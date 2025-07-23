# Gary AI Implementation Plan

| Phase | Calendar Window\* | Milestone                   | Key Outputs                                                 |
| ----- | ----------------- | --------------------------- | ----------------------------------------------------------- |
| 0     | Week 0            | **Project Kick-Off**        | Scope doc, RACI, initial backlog                            |
| 1     | Weeks 1–2         | **Foundations**             | Repo scaffolding, CI/CD skeleton, Composer & NPM tool-chain |
| 2     | Weeks 3–5         | **Core Backend**            | All PHP classes & database migrations done                  |
| 3     | Weeks 6–7         | **Chat Widget (Front-End)** | Widget JS+CSS finished and integrated                       |
| 4     | Weeks 8–9         | **Admin UI & Settings**     | React/JS settings panel, validation, Role-Cap matrix        |
| 5     | Weeks 10–11       | **Testing & Hardening**     | 90 %+ unit coverage, penetration & load tests green         |
| 6     | Week 12           | **Beta Release**            | v0.9.0 beta tag, staging deployment, feedback cycle         |
| 7     | Weeks 13–14       | **Marketplace Prep**        | Readme.txt, screenshots, WordPress dot-org review fixes     |
| 8     | Week 15           | **GA Launch**               | v1.0.0 tag, marketing blurb, support SLA in place           |

\*Assumes full-time effort by a 3-person core team (Lead PHP SE, Front-end SE, QA/DevOps). Adjust proportional to staffing.

---

## 0. Project Kick-Off (Week 0)

| Task                                               | Owner        | Acceptance Criteria                                      |
| -------------------------------------------------- | ------------ | -------------------------------------------------------- |
| Draft **Project Charter** (goals, non-goals, KPIs) | Product Mgr. | Charter circulated & signed-off                          |
| Create shared **Notion/Jira board**                | Scrum Master | Columns: Backlog · In Progress · Code Review · QA · Done |
| Define **RACI** for every deliverable              | PM           | RACI published in wiki                                   |
| Generate **risk register**                         | All leads    | ≥10 initial risks logged & ranked                        |

---

## 1. Foundations (Weeks 1–2)

### 1.1 Repositories & Tooling

* **Git** repo (`main`, `develop`, `release/*` branches; Git Flow).
* **Composer** bootstrap

  ```bash
  composer init && composer require guzzlehttp/guzzle php-stan/php-stan phpunit/phpunit
  ```
* **NPM/Vite** scaffold (`vite.config.js`) with ESLint, Prettier, Jest, Playwright.
* **Autoloader**: `includes/class-autoloader.php` registers PSR-4 (`GaryAI\` → `includes/`).

### 1.2 Continuous Integration / Continuous Delivery

* GitHub Actions:

  1. **`ci.yml`**: PHPStan 8 + PHPUnit + ESLint + Jest.
  2. **`release.yml`**: On tag push → build ZIP → attach GitHub Release.
  3. **`deploy-wporg.yml`**: Semi-manual dispatch → SVN push to `plugins.svn.wordpress.org/gary-ai`.

### 1.3 Baseline Code

* Stub main plugin file **`gary-ai.php`**: registers activation hook, text domain, default options.
* Write **constants** (`GARY_AI_VERSION`, endpoints, secrets via `wp_config.php`).

---

## 2. Core Backend (Weeks 3–5)

### 2.1 Database Migrations

* Use **dbDelta()** in `class-installer.php`.
* Implement rollback on deactivation.

### 2.2 PHP Service Layer

| Service               | Interfaces                                                                    | Notes                                                    |
| --------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| `ContextualAIClient`  | `queryAgent()`, `listDatastores()` … all wrappers from Endpoint Directory doc | HTTP retry w/ exponential back-off                       |
| `WordPressAuth`       | `issueToken()`, `verifyToken()`                                               | WordPress nonces; 15-min expiry                         |
| `Encryption`          | `encrypt()`, `decrypt()`                                                      | AES-256-GCM; keys in `wp_options` (salted)               |
| `RateLimiter`         | `isAllowed($ip)`                                                              | Token bucket; fallback to transients; Redis if available |
| `ConversationManager` | CRUD for conversations/messages                                               | Encrypt payload before insert                            |
| `AnalyticsService`    | `track($metric, $value)`                                                      | Writes to `gary_ai_analytics`                            |

### 2.3 REST Routes

* Name-space `gary-ai/v1`.
* `/token` (GET) → WordPress authentication token.
* `/chat` (POST) → passes prompt to Contextual AI.
* `/settings` (CRUD) – admin-only.

### 2.4 Logging & Error Handling

* `class-logger.php` with PSR-3 interface.
* Levels: debug disabled by default in production (filter via constant).

---

## 3. Chat Widget (Weeks 6–7)

### 3.1 Front-End Stack

* **Vanilla JS** (ES2022) + optional React mini-app (if admin panel already uses React).
* Compile via **Vite**; output to `assets/js/chat-widget.js` (39 KB gz).
* Styles in `chat-widget.css` (9 KB, CSS Modules or `@voyager-css`).

### 3.2 Features

* Auto-scroll, Markdown rendering, code block copy button.
* Typing indicator via SSE/polling.
* Reconnect & session resume via conversation token in `sessionStorage`.

### 3.3 Accessibility & i18n

* ARIA roles (`log`, `textbox`, `status`).
* Text domain `gary-ai`; generate `.pot`.

### 3.4 Unit & e2e Tests

* Jest DOM snapshots.
* Playwright script: open WP test site, start chat, validate response.

---

## 4. Admin UI & Settings (Weeks 8–9)

### 4.1 React Settings Page

* Tabbed interface: **General · API Keys · Roles · Analytics**.
* Use WordPress components (`@wordpress/components`).
* Real-time validation, error toasts.

### 4.2 Role/Capability Mapping

| Capability                | Default Role  |
| ------------------------- | ------------- |
| `gary_ai_manage_settings` | Administrator |
| `gary_ai_view_analytics`  | Editor+       |

### 4.3 Data Privacy

* Toggle: **Save transcripts?** YES/NO (default YES).
* GDPR export/erase hooks.

---

## 5. Testing & Hardening (Weeks 10–11)

| Track             | Tools                                  | Exit Criteria            |
| ----------------- | -------------------------------------- | ------------------------ |
| **Unit**          | PHPUnit 10 + Mockery                   | ≥90 % classes            |
| **Integration**   | Guzzle Mock + Testcontainers for MySQL | All REST endpoints happy |
| **Security**      | WPScan, PHPStan max, SonarCloud        | Zero critical/high       |
| **Performance**   | k6.io scripted 1 k RPS, 100 chats/sec  | p95 latency ≤800 ms      |
| **Accessibility** | axe-core, Lighthouse                   | WCAG 2.1 AA pass         |

Prepare **`SECURITY.md`** (report process) and **`CODE_OF_CONDUCT.md`**.

---

## 6. Beta Release (Week 12)

* Tag **`v0.9.0-beta`**.
* Deploy to staging site (`beta.example.com`).
* Send call-for-testers email.
* Collect feedback & open GitHub issues.

---

## 7. Marketplace Prep (Weeks 13–14)

### 7.1 WordPress dot-org Requirements

* Ensure GPLv2 license header.
* `README.txt` WordPress readme standard (Changelog, FAQ, Screenshots).
* Assets: banner `1544×500`, icon `256×256`, up to 3 screenshots.

### 7.2 Final QA Checklist

* PHP 7.4 & 8.2 compatibility verified.
* WP 5.0 – 6.4 compatibility matrix.
* Upgrade path: Deactivate old plugin gracefully.

### 7.3 Security Review

* **Third-party lib audit** (`composer audit`, `npm audit`).
* Pen-test summary attached to release notes.

---

## 8. GA Launch (Week 15)

1. Increment version → **`1.0.0`**; update changelog.
2. Merge `release/1.0.0` → `main`; push tag.
3. GitHub Action auto-builds ZIP; manual push to WordPress SVN.
4. Blog post & social announcement.
5. Open **support forum** on WP org; two-day response SLA.

---

## Post-Launch (Ongoing)

* **Telemetry dashboard** (Matomo or GA4 + BigQuery).
* Monthly patch cycle; semantic versioning.
* Road-map next-features: streaming responses, file upload to datastore, voice input.

---

## Responsibility Matrix

| Role                 | Name/Placeholder         | Core Duties                              |
| -------------------- | ------------------------ | ---------------------------------------- |
| Product Manager      | TBD                      | Charter, roadmap, success metrics        |
| Lead PHP Engineer    | You (Gary AI maintainer) | Backend, REST, security                  |
| Front-End Engineer   | TBD                      | Chat widget, React admin                 |
| QA / DevOps          | TBD                      | CI/CD, test automation, load & pen-tests |
| Designer (part-time) | TBD                      | Branding, widget UX                      |
| Docs & Support       | TBD                      | README, tutorials, forum                 |

---

## Risk Register (Top 5)

| ID  | Risk                        | Impact | Mitigation                                 |
| --- | --------------------------- | ------ | ------------------------------------------ |
| R-1 | Contextual AI API rate caps | High   | Dynamic back-off + local caching           |
| R-2 | WordPress review rejects    | Med    | Pre-submit to **Plugin Review Team** slack |
| R-3 | Data breach (PII)           | High   | AES-256 encryption + security plugin audit |
| R-4 | Unoptimised DB growth       | Med    | Scheduled cron cleanup + table partitions  |
| R-5 | Team resource shuffle       | Med    | Knowledge base & extensive docs            |

---

## Communication Cadence

| Meeting            | Frequency     | Participants     |
| ------------------ | ------------- | ---------------- |
| Sprint Planning    | Bi-weekly     | Full team        |
| Daily Stand-up     | Daily, 15 min | Engineers only   |
| Demo / Review      | End of sprint | All stakeholders |
| Retrospective      | End of sprint | Team             |
| Steering Committee | Monthly       | Exec & PM        |

---

## Deliverables Checklist

* [ ] `gary-ai.php` main loader
* [ ] **Composer** updated & locked
* [ ] **Vendor** libraries bundled (no dev-deps)
* [ ] All REST routes documented in `/docs/endpoints.md`
* [ ] Unit/Integration/e2e reports uploaded to CI artifacts
* [ ] Signed `CHANGELOG.md` & `LICENSE`
* [ ] WordPress **SVN** repository with correct structure

---

*This implementation plan is intentionally granular so each story can be copied directly into your task tracker without re-work. Adjust dates, owners, and tooling as your organisation requires.*
