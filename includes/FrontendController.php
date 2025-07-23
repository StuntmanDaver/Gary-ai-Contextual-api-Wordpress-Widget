<?php
/**
 * Frontend Controller
 *
 * Handles frontend script enqueuing and WordPress integration for the chat widget.
 *
 * @package GaryAI
 * @since   1.0.0
 */

namespace GaryAI;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class FrontendController
 *
 * Manages frontend assets and widget integration.
 */
class FrontendController {

    /**
     * Logger instance.
     */
    private Logger $logger;

    /**
     * Constructor.
     */
    public function __construct() {
        $this->logger = new Logger( 'FrontendController' );
        
        // Hook into WordPress
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueueScripts' ] );
        add_action( 'wp_footer', [ $this, 'renderWidgetContainer' ] );
        add_action( 'wp_head', [ $this, 'addWidgetGlobals' ] );
    }

    /**
     * Enqueue frontend scripts and styles.
     */
    public function enqueueScripts(): void {
        // Only enqueue on pages where widget should appear
        if ( ! $this->shouldEnqueueWidget() ) {
            return;
        }

        $this->logger->debug( 'Enqueuing Gary AI chat widget assets' );

        // Check if built assets exist
        $jsFile = GARY_AI_PLUGIN_DIR . 'assets/js/chat-widget.js';
        $cssFile = GARY_AI_PLUGIN_DIR . 'assets/css/chat-widget.css';

        if ( file_exists( $jsFile ) && file_exists( $cssFile ) ) {
            // Production build assets
            $jsUrl = plugin_dir_url( GARY_AI_PLUGIN_FILE ) . 'assets/js/chat-widget.js';
            $cssUrl = plugin_dir_url( GARY_AI_PLUGIN_FILE ) . 'assets/css/chat-widget.css';
            
            $jsVersion = filemtime( $jsFile );
            $cssVersion = filemtime( $cssFile );
        } else {
            // Development assets (Vite dev server or built from src)
            $jsUrl = plugin_dir_url( GARY_AI_PLUGIN_FILE ) . 'src/chat-widget.js';
            $cssUrl = plugin_dir_url( GARY_AI_PLUGIN_FILE ) . 'src/styles/chat-widget.css';
            
            $jsVersion = GARY_AI_VERSION;
            $cssVersion = GARY_AI_VERSION;
            
            $this->logger->info( 'Using development assets for Gary AI widget' );
        }

        // Enqueue CSS
        wp_enqueue_style(
            'gary-ai-chat-widget',
            $cssUrl,
            [],
            $cssVersion
        );

        // Enqueue JavaScript as ES module
        wp_enqueue_script(
            'gary-ai-chat-widget',
            $jsUrl,
            [],
            $jsVersion,
            [
                'strategy' => 'defer',
                'in_footer' => true
            ]
        );

        // Add module type for ES6 imports
        add_filter( 'script_loader_tag', [ $this, 'addModuleType' ], 10, 3 );

        $this->logger->debug( 'Gary AI chat widget assets enqueued successfully' );
    }

    /**
     * Add module type to script tag for ES6 imports.
     *
     * @param string $tag    Script tag.
     * @param string $handle Script handle.
     * @param string $src    Script source.
     * @return string Modified script tag.
     */
    public function addModuleType( string $tag, string $handle, string $src ): string {
        if ( 'gary-ai-chat-widget' === $handle ) {
            $tag = str_replace( '<script ', '<script type="module" ', $tag );
        }
        return $tag;
    }

    /**
     * Add widget globals to page head.
     */
    public function addWidgetGlobals(): void {
        if ( ! $this->shouldEnqueueWidget() ) {
            return;
        }

        $restUrl = rest_url( 'gary-ai/v1' );
        $nonce = wp_create_nonce( 'wp_rest' );
        $currentUser = wp_get_current_user();
        
        // Get widget settings
        $settings = $this->getWidgetSettings();
        
        // Debug mode check
        $debug = defined( 'WP_DEBUG' ) && WP_DEBUG;

        $globals = [
            'restUrl' => $restUrl,
            'nonce' => $nonce,
            'userId' => $currentUser->ID,
            'userDisplayName' => $currentUser->display_name,
            'settings' => $settings,
            'debug' => $debug,
            'version' => GARY_AI_VERSION,
            'autoInit' => true,
            'logEndpoint' => rest_url( 'gary-ai/v1/logs' )
        ];

        echo '<script type="text/javascript">' . "\n";
        echo 'window.garyAI = ' . wp_json_encode( $globals ) . ';' . "\n";
        echo '</script>' . "\n";

        $this->logger->debug( 'Gary AI widget globals added to page', [
            'rest_url' => $restUrl,
            'user_id' => $currentUser->ID,
            'debug_mode' => $debug
        ] );
    }

    /**
     * Render widget container in footer.
     */
    public function renderWidgetContainer(): void {
        if ( ! $this->shouldEnqueueWidget() ) {
            return;
        }

        echo '<div id="gary-ai-widget-root" aria-live="polite"></div>' . "\n";
        
        $this->logger->debug( 'Gary AI widget container rendered' );
    }

    /**
     * Check if widget should be enqueued on current page.
     *
     * @return bool Whether to enqueue widget.
     */
    private function shouldEnqueueWidget(): bool {
        // Check if widget is enabled
        $enabled = get_option( 'gary_ai_widget_enabled', true );
        if ( ! $enabled ) {
            return false;
        }

        // Check if API key is configured
        $apiKey = get_option( 'gary_ai_api_key', '' );
        if ( empty( $apiKey ) ) {
            $this->logger->warning( 'Gary AI widget not loaded: API key not configured' );
            return false;
        }

        // Check page restrictions
        $restrictedPages = get_option( 'gary_ai_restricted_pages', [] );
        $currentPageId = get_the_ID();
        
        if ( is_array( $restrictedPages ) && in_array( $currentPageId, $restrictedPages, true ) ) {
            return false;
        }

        // Check user capabilities if restricted
        $requireLogin = get_option( 'gary_ai_require_login', false );
        if ( $requireLogin && ! is_user_logged_in() ) {
            return false;
        }

        // Allow filtering
        return apply_filters( 'gary_ai_should_enqueue_widget', true );
    }

    /**
     * Get widget settings for frontend.
     *
     * @return array Widget settings.
     */
    private function getWidgetSettings(): array {
        $defaults = [
            'widget_enabled' => true,
            'widget_position' => 'bottom-right',
            'widget_theme' => 'light',
            'welcome_message' => 'Hello! How can I help you today?',
            'max_conversation_length' => 50,
            'enable_file_upload' => false,
            'enable_markdown' => true,
            'enable_code_copy' => true,
            'rate_limit_messages' => 10,
            'rate_limit_window' => 60
        ];

        $settings = [];
        foreach ( $defaults as $key => $default ) {
            $settings[ $key ] = get_option( "gary_ai_{$key}", $default );
        }

        // Sanitize settings for frontend
        $settings['welcome_message'] = wp_kses_post( $settings['welcome_message'] );
        $settings['max_conversation_length'] = absint( $settings['max_conversation_length'] );
        $settings['rate_limit_messages'] = absint( $settings['rate_limit_messages'] );
        $settings['rate_limit_window'] = absint( $settings['rate_limit_window'] );

        return apply_filters( 'gary_ai_widget_settings', $settings );
    }

    /**
     * Get widget analytics data.
     *
     * @return array Analytics data.
     */
    public function getAnalyticsData(): array {
        global $wpdb;
        
        $table = $wpdb->prefix . 'gary_ai_analytics';
        
        // Get basic stats for the last 30 days
        $thirtyDaysAgo = gmdate( 'Y-m-d H:i:s', strtotime( '-30 days' ) );
        
        $stats = $wpdb->get_row( $wpdb->prepare(
            "SELECT 
                COUNT(*) as total_events,
                COUNT(DISTINCT session_id) as unique_sessions,
                COUNT(CASE WHEN event_name = 'message_sent' THEN 1 END) as messages_sent,
                COUNT(CASE WHEN event_name = 'widget_opened' THEN 1 END) as widget_opens
            FROM {$table} 
            WHERE created_at >= %s",
            $thirtyDaysAgo
        ), ARRAY_A );

        return $stats ?: [
            'total_events' => 0,
            'unique_sessions' => 0,
            'messages_sent' => 0,
            'widget_opens' => 0
        ];
    }

    /**
     * Handle AJAX request for widget settings.
     */
    public function ajaxGetSettings(): void {
        check_ajax_referer( 'gary_ai_nonce', 'nonce' );
        
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Unauthorized', 403 );
        }

        $settings = $this->getWidgetSettings();
        wp_send_json_success( $settings );
    }

    /**
     * Handle AJAX request to update widget settings.
     */
    public function ajaxUpdateSettings(): void {
        check_ajax_referer( 'gary_ai_nonce', 'nonce' );
        
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Unauthorized', 403 );
        }

        $settings = $_POST['settings'] ?? [];
        
        // Validate and save settings
        $allowedSettings = [
            'widget_enabled',
            'widget_position',
            'widget_theme',
            'welcome_message',
            'max_conversation_length',
            'enable_file_upload',
            'enable_markdown',
            'enable_code_copy',
            'rate_limit_messages',
            'rate_limit_window'
        ];

        foreach ( $allowedSettings as $setting ) {
            if ( isset( $settings[ $setting ] ) ) {
                $value = $settings[ $setting ];
                
                // Sanitize based on setting type
                switch ( $setting ) {
                    case 'welcome_message':
                        $value = wp_kses_post( $value );
                        break;
                    case 'widget_position':
                        $value = in_array( $value, [ 'bottom-right', 'bottom-left', 'top-right', 'top-left' ], true ) ? $value : 'bottom-right';
                        break;
                    case 'widget_theme':
                        $value = in_array( $value, [ 'light', 'dark', 'auto' ], true ) ? $value : 'light';
                        break;
                    case 'max_conversation_length':
                    case 'rate_limit_messages':
                    case 'rate_limit_window':
                        $value = absint( $value );
                        break;
                    default:
                        $value = (bool) $value;
                        break;
                }
                
                update_option( "gary_ai_{$setting}", $value );
            }
        }

        $this->logger->info( 'Widget settings updated', [
            'user_id' => get_current_user_id(),
            'settings_updated' => array_keys( $settings )
        ] );

        wp_send_json_success( [ 'message' => 'Settings updated successfully' ] );
    }
}
