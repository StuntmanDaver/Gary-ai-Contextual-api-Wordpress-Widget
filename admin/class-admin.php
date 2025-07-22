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
    
    /**
     * Initialize admin hooks
     */
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('wp_ajax_gary_ai_test_connection', [$this, 'test_api_connection']);
        add_action('wp_ajax_gary_ai_save_settings', [$this, 'save_settings']);
    }
    
    /**
     * Add admin menu pages
     */
    public function add_admin_menu() {
        add_menu_page(
            'Gary AI Settings',
            'Gary AI',
            'manage_options',
            'gary-ai',
            [$this, 'render_settings_page'],
            'dashicons-format-chat',
            30
        );
        
        add_submenu_page(
            'gary-ai',
            'Settings',
            'Settings',
            'manage_options',
            'gary-ai',
            [$this, 'render_settings_page']
        );
        
        add_submenu_page(
            'gary-ai',
            'Analytics',
            'Analytics',
            'manage_options',
            'gary-ai-analytics',
            [$this, 'render_analytics_page']
        );
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        if (strpos($hook, 'gary-ai') === false) {
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
            'nonce' => wp_create_nonce('gary_ai_admin'),
            'ajaxUrl' => admin_url('admin-ajax.php')
        ]);
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        $settings = get_option('gary_ai_settings', []);
        include plugin_dir_path(dirname(__FILE__)) . 'admin/views/settings.php';
    }
    
    /**
     * Render analytics page
     */
    public function render_analytics_page() {
        include plugin_dir_path(dirname(__FILE__)) . 'admin/views/analytics.php';
    }
    
    /**
     * Test API connection via AJAX
     */
    public function test_api_connection() {
        check_ajax_referer('gary_ai_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $api_key = sanitize_text_field($_POST['api_key'] ?? '');
        $agent_id = sanitize_text_field($_POST['agent_id'] ?? '');
        
        if (empty($api_key) || empty($agent_id)) {
            wp_send_json_error(['message' => 'API key and Agent ID are required']);
        }
        
        try {
            $client = new \GaryAI\ContextualAIClient($api_key);
            $response = $client->testConnection($agent_id);
            
            if ($response) {
                wp_send_json_success(['message' => 'Connection successful']);
            } else {
                wp_send_json_error(['message' => 'Connection failed']);
            }
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Save settings via AJAX
     */
    public function save_settings() {
        check_ajax_referer('gary_ai_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        parse_str($_POST['settings'], $settings);
        
        $sanitized_settings = [
            'api_key' => sanitize_text_field($settings['gary_ai_api_key'] ?? ''),
            'agent_id' => sanitize_text_field($settings['gary_ai_agent_id'] ?? ''),
            'datastore_id' => sanitize_text_field($settings['gary_ai_datastore_id'] ?? ''),
            'widget_enabled' => (bool)($settings['gary_ai_widget_enabled'] ?? false),
            'widget_position' => sanitize_text_field($settings['gary_ai_widget_position'] ?? 'bottom-right'),
            'rate_limit' => intval($settings['gary_ai_rate_limit'] ?? 10),
            'debug_mode' => (bool)($settings['gary_ai_debug_mode'] ?? false)
        ];
        
        update_option('gary_ai_settings', $sanitized_settings);
        wp_send_json_success(['message' => 'Settings saved']);
    }
}
