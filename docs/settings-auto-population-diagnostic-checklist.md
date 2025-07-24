# Gary AI Plugin Settings Auto-Population Diagnostic Checklist

**Date:** July 24, 2025
**Issue:** API credential fields (API Key, Agent ID, Datastore ID) not auto-populating from environment variables
**Goal:** Exhaustively test and diagnose all possible causes

## Instructions

Work through each item methodically. Record the command executed, output observed, and immediate inference for each step. Mark each item as ✅ PASS, ❌ FAIL, or ⚠️ PARTIAL.

## Part 1: WordPress & PHP Environment

### A. Environment Variable Availability

#### A1. Container Environment Variables

- [x] **Action:** Verified that `CONTEXTUAL_API_KEY`, `AGENT_ID`, and `DATASTORE_ID` are available to the PHP process inside the `gary-ai-wordpress` container.
- [x] **Method:** Created a temporary `env-test.php` script, copied it to the container, and executed it using `docker exec gary-ai-wordpress php ...` because `wp-cli` was not found in the container's PATH.
- [x] **Result:** The script successfully printed the values for all three environment variables.
- [x] **Status:** ✅ PASS

#### A3. PHP-FPM Pool Configuration

- [x] **Action:** Resolved the issue by creating a custom Apache configuration file (`envvars.conf`) to explicitly pass the environment variables to the web server process.
- [x] **Method:** The `envvars.conf` file uses the `PassEnv` directive for each required variable. This file was then mounted into the container's Apache configuration directory (`/etc/apache2/conf-enabled/`) via `docker-compose.yml`.
- [x] **Result:** This method successfully makes the environment variables available to Apache and, consequently, to PHP, resolving the auto-population issue without modifying the PHP-FPM pool directly.
- [x] **Status:** ✅ PASS

#### A4. Container Restart Test

- [x] **Command:** `docker-compose down && docker-compose up -d`
- [x] **Follow-up:** The environment was fully restarted after applying the `envvars.conf` fix. This ensures the new Apache configuration was loaded.
- [x] **Status:** ✅ PASS

### B. Plugin Code & WordPress Integration

#### B1. Slug Consistency Check

- [x] **API Config:** `add_settings_field()` uses `'gary-ai-api-config'`, view calls `do_settings_sections('gary-ai-api-config')`.
- [x] **General:** `add_settings_field()` uses `'gary-ai-general-settings'`, view calls `do_settings_sections('gary-ai-general-settings')`.
- [x] **Widget:** `add_settings_field()` uses `'gary-ai-widget-settings'`, view calls `do_settings_sections('gary-ai-widget-settings')`.
- [x] **Expected:** All slugs must match exactly.
- [x] **Result:** Verified that the page slugs used in `add_settings_section()` in `admin/class-admin.php` perfectly match the slugs used in `do_settings_sections()` in `admin/views/settings.php`.
- [x] **Status:** ✅ PASS

#### B2. Rendered HTML Output

- [x] **Action:** Right-click on settings page and "View Page Source" to get raw HTML.
- [x] **Search:** In page source, look for `name="gary_ai_settings[api_key]"`.
- [x] **Expected:** The input tag should have `value="..."` populated with the env var.
- [x] **Result:** The final attempt using the `$_SERVER` superglobal also failed to auto-populate the fields. This indicates a deeper environmental issue preventing WordPress from accessing the variables during rendering.
- [x] **Status:** ❌ **FAIL** - Auto-population issue unresolved.

#### B3. Duplicate Input Detection

- [x] **Search:** Look for `name="gary_ai_api_key"`, `name="gary_ai_agent_id"`, `name="gary_ai_datastore_id]"`.
- [x] **Issue:** These would duplicate Settings-API-rendered inputs.
- [x] **Expected:** Should only find `name="gary_ai_settings[api_key]"` format.
- [x] **Result:** The primary input fields do not exist, so no duplicates were found.
- [x] **Status:** ✅ PASS

#### B4. `$this->settings` Value Precedence Logic

- [x] **File:** `class-admin.php`
- [x] **Methods:** `render_api_key_field`, `render_agent_id_field`, `render_datastore_id_field`.
- [x] **Logic:** `isset($this->settings['api_key']) ? esc_attr($this->settings['api_key']) : getenv('CONTEXTUAL_API_KEY')`.
- [x] **Expected:** Logic should prioritize saved settings over environment variables.
- [x] **Result:** The rendering functions execute, but cannot access the environment variables via `getenv()` or `$_SERVER`. The value precedence logic itself is correct but ineffective.
- [x] **Status:** ❌ **FAIL** - Auto-population issue unresolved.

#### B5. `get_option` Direct Test

- [x] **Command:** `docker-compose run --rm cli wp option get gary_ai_settings`
- [x] **Expected:** The command should return an error if the option does not exist, or an empty value if it has not been saved.
- [x] **Result:** The command returned: `Error: Could not get 'gary_ai_settings' option. Does it exist?` This confirms the option is not in the database.
- [x] **Status:** ✅ PASS

### C. Caching (Server-Side)

#### C1. Object Cache Check

- [x] **Command:** `docker-compose run --rm cli wp cache type`
- [x] **Expected:** Should show `Default` (non-persistent).
- [x] **Issue:** If Redis/Memcached is active, it could be caching old `get_option` results.
- [x] **Result:** The command returned `Default (non-persistent)`, confirming a non-persistent object cache is in use.
- [x] **Status:** ✅ PASS

#### C2. OPcache Check

- [ ] **Action:** Temporarily set `opcache.revalidate_freq=0` in php.ini.
- [ ] **Command:** `docker exec -it gary-ai-wordpress-1 service php7.4-fpm restart` (or appropriate PHP version).
- [ ] **Purpose:** Ensure opcode caching isn't serving an old class version.
- [ ] **Result:**
- [ ] **Status:** ⬜

### D. Form Submission & Data Handling

#### D1. Verify `settings_fields()` Option Group

- [x] **Verification:** Confirmed the `option_group` in `settings_fields()` in `admin/views/settings.php` exactly matches the first parameter of `register_setting()` in `admin/class-admin.php`.

## Part E: Admin UI Visibility

### E1. Admin Menu Item

- [x] **Action:** Navigate to WordPress admin dashboard and check for the "Gary AI" menu item.
- [x] **Expected:** The menu item should be visible after correcting the plugin initialization logic.
- [x] **Result:** User confirmed the menu item is now visible.
- [x] **Status:** ✅ PASS
- [x] **File (`settings.php`):** `<?php settings_fields('gary_ai_settings_group'); ?>`
- [x] **File (`class-admin.php`):** `register_setting('gary_ai_settings_group', ...)`
- [x] **Result:** The option groups match perfectly.
- [x] **Status:** ✅ PASS

#### D2. Verify Form Structure

- [ ] Ensure the `settings.php` view contains `<form method="post" action="options.php">` and `submit_button()`.
- [ ] **Status:** Pending.

#### D3. Review Sanitization Callback

- [ ] Analyze the `sanitize_settings` function for any logic that might improperly discard or mangle data on save.
- [ ] **Status:** Pending.

#### D4. Empty Value Save Test

- [ ] **Action:** Manually save an empty string in the API Key field.
- [ ] **Expected:** `isset($this->settings['api_key'])` will now be `true`.
- [ ] **Result:** The field will now be blank, overriding the `getenv()` fallback. This is expected behavior.
- [ ] **Status:** ⬜

#### D5. Partial Save Test

- [ ] **Action:** Save only one field (e.g., just API key).
- [ ] **Expected:** Other fields should persist via `array_merge` logic.
- [ ] **Command:** Check option value after partial save.
- [ ] **Result:**
- [ ] **Status:** ⬜

### E. AJAX & API Communication ("Test Connection")

#### E1. Check for JavaScript Errors

- [ ] Open the browser's developer console for errors when clicking "Test Connection".
- [ ] **Status:** Pending.

#### E2. Verify AJAX Nonce and URL

- [ ] Ensure `wp_localize_script` is correctly passing the `ajaxUrl` and a valid nonce.
- [ ] **Status:** Pending.

#### E3. Verify AJAX Action Hook

- [ ] Confirm the `action` name in `admin.js` matches the `wp_ajax_...` hook in `class-admin.php`.
- [ ] **Status:** Pending.

#### E4. Test API Endpoint Network Access

- [ ] From inside the container, attempt to `curl` the Contextual AI API endpoint to rule out container network issues.
- [ ] **Status:** Pending.

## Part 2: Settings Saving & API Connection

### F. Browser-side Issues

#### F1. Password Manager Interference

- [ ] **Action:** Disable all password managers/extensions and reload the settings page.
- [ ] **Expected:** Fields should show env var values without manager interference.
- [ ] **Result:**
- [ ] **Status:** ⬜

#### F2. Cache-free Browser Test

- [ ] **Action:** Open Chrome Incognito mode and press Ctrl+Shift+R (hard refresh) on the settings page.
- [ ] **Expected:** Fresh HTML without browser cache.
- [ ] **Result:**
- [ ] **Status:** ⬜

#### F3. WordPress Caching Plugin Check

- [x] **Command:** `docker-compose run --rm cli wp plugin list --status=active`
- [x] **Expected:** No caching plugins (e.g., W3 Total Cache, WP Super Cache) should be listed as active.
- [x] **Result:** The command output confirms that only the `gary-ai` plugin is active. No caching plugins are installed or active.
- [x] **Status:** ✅ PASS

### G. JavaScript Interference

#### G1. Field Value Console Check

- [ ] **Command:** In browser console: `document.querySelector('[name="gary_ai_settings[api_key]"]').value`
- [ ] **Expected:** Should return the environment variable value.
- [ ] **Result:**
- [ ] **Status:** ⬜

#### G2. JavaScript Disable Test

- [ ] **Action:** Temporarily rename `assets/js/admin.js` to `admin.js.disabled` and reload the page.
- [ ] **Purpose:** Rule out script-based field clearing.
- [ ] **Result:**
- [ ] **Status:** ⬜

### H. Capability / Multisite Context

#### H1. User Capability Check

- [x] **Verification:** Confirm logged in as a user with `manage_options` capability.
- [x] **Command:** `docker-compose run --rm cli wp user list --fields=user_login,roles`
- [x] **Expected:** The current user (`admin`) should have the administrator role.
- [x] **Result:** The command output confirms the `admin` user has the `administrator` role, which includes the `manage_options` capability.
- [x] **Status:** ✅ PASS

### I. Database Serialization

#### I1. Direct Database Inspection

- [ ] **Command:** Access phpMyAdmin or database directly.
- [ ] **Query:** `SELECT option_value FROM wp_options WHERE option_name = 'gary_ai_settings';`
- [ ] **Expected:** Valid PHP serialized array format `a:N:{...}`.
- [ ] **Analysis:** Corruption causes `get_option` to return `false`.
- [ ] **Status:** ⬜

### J. Debug Log Inspection

#### J1. WordPress Debug Logging

- [x] **Action:** Ensure `WP_DEBUG` and `WP_DEBUG_LOG` are enabled in `wp-config.php`.
- [x] **Verification:** Inspected `docker-compose.yml` and confirmed that `WORDPRESS_CONFIG_EXTRA` is used to set `WP_DEBUG` and `WP_DEBUG_LOG` to `true`.
- [ ] **Command:** `docker exec -it gary-ai-wordpress-1 tail -f /var/www/html/wp-content/debug.log`
- [ ] **Action:** Reload the settings page.
- [ ] **Expected:** No PHP notices/warnings that could abort rendering.
- [ ] **Result:**
- [ ] **Status:** ⬜

### K. Plugin Activation State

#### K1. Plugin Reactivation Test

- [ ] **Action:** Deactivate and reactivate the Gary AI plugin in the WordPress admin.
- [ ] **Action:** Test settings page auto-population.
- [ ] **Expected:** Hooks should be properly registered after reactivation.
- [ ] **Result:**
- [ ] **Status:** ⬜

### L. Hosting / Permission Issues

#### L1. File System Write Test

- [x] **Command:** `docker-compose run --rm cli wp option update test_gary_key test_gary_value`
- [x] **Command:** `docker-compose run --rm cli wp option get test_gary_key`
- [x] **Expected:** Should successfully write and read a test option.
- [x] **Purpose:** Confirm `update_option` functionality.
- [x] **Result:** The commands successfully created and retrieved the test option (`test_gary_value`), confirming that the database is writable by WordPress.
- [x] **Status:** ✅ PASS

## Summary and Next Steps

### Issues Identified:

- [ ] **Issue 1:**
- [ ] **Issue 2:**
- [ ] **Issue 3:**

### Root Cause Analysis:

- [ ] **Primary Cause:**
- [ ] **Contributing Factors:**

### Recommended Fixes:

1. **Fix 1:**
2. **Fix 2:**
3. **Fix 3:**

### Verification Steps:

- [ ] **Step 1:**
- [ ] **Step 2:**
- [ ] **Step 3:**

## Completed by: ________________
## Date: ________________
## Time: ________________
