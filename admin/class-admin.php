<?php
/**
 * Gary AI Admin Interface
 *
 * @package GaryAI
 */

namespace GaryAI\Admin;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Admin class for Gary AI plugin
 */
class Admin {

    private $settings;

    /**
     * Initialize admin hooks
     */
    public function __construct() {
        $this->settings = get_option('gary_ai_settings', []);
        error_log('Settings loaded: ' . print_r($this->settings, true));

        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('wp_ajax_gary_ai_test_connection', [$this, 'test_api_connection']);
    }

    /**
     * Register plugin settings, sections, and fields.
     */
    public function register_settings() {
        error_log('REGISTER_SETTINGS RAN');
        register_setting(
            'gary_ai_settings_group', // Option group
            'gary_ai_settings',       // Option name
            [$this, 'sanitize_settings'] // Sanitize callback
        );

        add_settings_section(
            'gary_ai_api_config_section',
            'API Configuration',
            null, // Section callback (optional)
            'gary-ai-api-config' // Page slug
        );

        add_settings_field(
            'api_key',
            'Contextual API Key',
            [$this, 'render_api_key_field'],
            'gary-ai-api-config',
            'gary_ai_api_config_section'
        );

        add_settings_field(
            'agent_id',
            'Agent ID',
            [$this, 'render_agent_id_field'],
            'gary-ai-api-config',
            'gary_ai_api_config_section'
        );

        add_settings_field(
            'datastore_id',
            'Datastore ID',
            [$this, 'render_datastore_id_field'],
            'gary-ai-api-config',
            'gary_ai_api_config_section'
        );

        // General Settings Section
        add_settings_section(
            'gary_ai_general_section',
            'General Settings',
            null,
            'gary-ai-general-settings'
        );

        add_settings_field(
            'widget_enabled',
            'Enable Chat Widget',
            [$this, 'render_widget_enabled_field'],
            'gary-ai-general-settings',
            'gary_ai_general_section'
        );

        // Widget Settings Section
        add_settings_section(
            'gary_ai_widget_section',
            'Widget Settings',
            null,
            'gary-ai-widget-settings'
        );

        add_settings_field(
            'widget_position',
            'Widget Position',
            [$this, 'render_widget_position_field'],
            'gary-ai-widget-settings',
            'gary_ai_widget_section'
        );
    }

    /**
     * Sanitize settings fields.
     */
    public function sanitize_settings($input) {
        $sanitized_input = [];
        if (isset($input['api_key'])) {
            $sanitized_input['api_key'] = sanitize_text_field($input['api_key']);
        }
        if (isset($input['agent_id'])) {
            $sanitized_input['agent_id'] = sanitize_text_field($input['agent_id']);
        }
        if (isset($input['datastore_id'])) {
            $sanitized_input['datastore_id'] = sanitize_text_field($input['datastore_id']);
        }
        if (isset($input['widget_enabled'])) {
            $sanitized_input['widget_enabled'] = (bool)$input['widget_enabled'];
        }
        if (isset($input['widget_position'])) {
            $sanitized_input['widget_position'] = sanitize_text_field($input['widget_position']);
        }
        return array_merge($this->settings, $sanitized_input);
    }

    /**
     * Render the API Key input field.
     */
    public function render_api_key_field() {
        error_log('CALLBACK api_key executed');
        $value = $this->settings['api_key'] ?? '';
        if (empty($value)) {
            $value = $_SERVER['CONTEXTUAL_API_KEY'] ?? '';
        }
        error_log('API Key field value: ' . $value);
        echo '<input type="password" name="gary_ai_settings[api_key]" value="' . esc_attr($value) . '" class="regular-text">';
    }

    /**
     * Render the Agent ID input field.
     */
    public function render_agent_id_field() {
        $value = $this->settings['agent_id'] ?? '';
        if (empty($value)) {
            $value = $_SERVER['AGENT_ID'] ?? '';
        }
        echo '<input type="text" name="gary_ai_settings[agent_id]" value="' . esc_attr($value) . '" class="regular-text">';
    }

    /**
     * Render the Datastore ID input field.
     */
    public function render_datastore_id_field() {
        $value = $this->settings['datastore_id'] ?? '';
        if (empty($value)) {
            $value = $_SERVER['DATASTORE_ID'] ?? '';
        }
        echo '<input type="text" name="gary_ai_settings[datastore_id]" value="' . esc_attr($value) . '" class="regular-text">';
    }

    /**
     * Render the Widget Enabled checkbox.
     */
    public function render_widget_enabled_field() {
        $checked = $this->settings['widget_enabled'] ?? false;
        echo '<input type="checkbox" name="gary_ai_settings[widget_enabled]" value="1" ' . checked(1, $checked, false) . '>';
        echo '<p class="description">Enable the Gary AI chat widget on your website.</p>';
    }

    /**
     * Render the Widget Position dropdown.
     */
    public function render_widget_position_field() {
        $position = $this->settings['widget_position'] ?? 'bottom-right';
        $options = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
        echo '<select name="gary_ai_settings[widget_position]">';
        foreach ($options as $option) {
            echo '<option value="' . esc_attr($option) . '" ' . selected($position, $option, false) . '>' . esc_html(ucwords(str_replace('-', ' ', $option))) . '</option>';
        }
        echo '</select>';
        echo '<p class="description">Choose where to display the chat widget on your site.</p>';
    }

    /**
     * Add admin menu pages
     */
    public function add_admin_menu() {
        add_menu_page(
            'Gary AI',
            'Gary AI',
            'manage_options',
            'gary-ai',
            [$this, 'render_settings_page'],
            'dashicons-format-chat',
            30
        );
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        if ('toplevel_page_gary-ai' !== $hook) {
            return;
        }
        
        wp_enqueue_style(
            'gary-ai-admin',
            plugin_dir_url(dirname(__FILE__)) . 'assets/css/admin.css',
            [],
            GARY_AI_VERSION
        );
        
        wp_enqueue_script(
            'gary-ai-admin',
            plugin_dir_url(dirname(__FILE__)) . 'assets/js/admin.js',
            ['jquery'],
            GARY_AI_VERSION,
            true
        );
        
        wp_localize_script('gary-ai-admin', 'garyAiAdmin', [
            'nonce' => wp_create_nonce('gary_ai_admin_nonce'),
            'ajaxUrl' => admin_url('admin-ajax.php')
        ]);
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        include plugin_dir_path(dirname(__FILE__)) . 'admin/views/settings.php';
    }
    
    /**
     * Test API connection via AJAX
     */
    public function test_api_connection() {
        check_ajax_referer('gary_ai_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }
        
        $api_key = sanitize_text_field($_POST['api_key'] ?? '');
        $agent_id = sanitize_text_field($_POST['agent_id'] ?? '');
        
        if (empty($api_key) || empty($agent_id)) {
            wp_send_json_error(['message' => 'API key and Agent ID are required.']);
            return;
        }
        
        try {
            $client = new \GaryAI\ContextualAIClient($api_key);
            $response = $client->testConnection($agent_id);
            
            if ($response) {
                wp_send_json_success(['message' => 'Connection successful!']);
            } else {
                wp_send_json_error(['message' => 'Connection failed. Please check your credentials.']);
            }
        } catch (\Exception $e) {
            wp_send_json_error(['message' => 'An error occurred: ' . $e->getMessage()]);
        }
    }
}
