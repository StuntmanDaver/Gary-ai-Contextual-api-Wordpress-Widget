<?php
/**
 * Plugin Name: Gary AI – WordPress Chatbot
 * Plugin URI:  https://github.com/your-org/gary-ai
 * Description: Context-aware chatbot powered by Contextual AI.
 * Version: 1.0.0
 * Author: Gary AI Team
 * Author URI: https://contextual.ai
 * License: MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: gary-ai
 * Domain Path: /languages
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// -----------------------------------------------------------------------------
// 1. Define core constants.
// -----------------------------------------------------------------------------

define( 'GARY_AI_VERSION', '1.0.0' );
define( 'GARY_AI_PLUGIN_FILE', __FILE__ );
define( 'GARY_AI_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

// -----------------------------------------------------------------------------
// 2. Register activation / deactivation / uninstall hooks.
// -----------------------------------------------------------------------------

register_activation_hook( __FILE__, 'gary_ai_activate' );
register_deactivation_hook( __FILE__, 'gary_ai_deactivate' );
register_uninstall_hook( __FILE__, 'gary_ai_uninstall' );

/**
 * Plugin activation callback.
 */
function gary_ai_activate() {
    // Safe plugin activation with error handling
    try {
        // Load vendor autoloader first for PSR-3 dependencies
        if ( file_exists( GARY_AI_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
            require_once GARY_AI_PLUGIN_DIR . 'vendor/autoload.php';
        }
        
        // Load custom autoloader
        if ( file_exists( GARY_AI_PLUGIN_DIR . 'includes/class-autoloader.php' ) ) {
            require_once GARY_AI_PLUGIN_DIR . 'includes/class-autoloader.php';
            GaryAI\Autoloader::register();
        }
        
        // Run installation only if installer class exists and is safe
        if ( class_exists( 'GaryAI\Installer' ) ) {
            GaryAI\Installer::install();
        } else {
            // Basic setup if installer fails
            add_option( 'gary_ai_db_version', '1.0.0' );
            add_option( 'gary_ai_settings', array() );
        }
        
        do_action( 'gary_ai_activate' );
        
    } catch ( Exception $e ) {
        // Log error but allow activation to complete
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            error_log( '[Gary AI] Activation error: ' . $e->getMessage() );
        }
        
        // Basic fallback setup
        add_option( 'gary_ai_db_version', '1.0.0' );
        add_option( 'gary_ai_settings', array() );
    }
}

/**
 * Plugin deactivation callback.
 */
function gary_ai_deactivate() {
    // Load autoloader first
    require_once GARY_AI_PLUGIN_DIR . 'includes/class-autoloader.php';
    GaryAI\Autoloader::register();
    
    // Run deactivation cleanup
    GaryAI\Installer::deactivate();
    
    do_action( 'gary_ai_deactivate' );
}

/**
 * Plugin uninstall callback.
 */
function gary_ai_uninstall() {
    // Safe uninstall - avoid fatal errors if dependencies are missing
    try {
        // Only attempt cleanup if autoloader exists
        if ( file_exists( GARY_AI_PLUGIN_DIR . 'includes/class-autoloader.php' ) ) {
            require_once GARY_AI_PLUGIN_DIR . 'includes/class-autoloader.php';
            GaryAI\Autoloader::register();
            
            // Only run uninstall if class exists and is safe to load
            if ( class_exists( 'GaryAI\Installer' ) ) {
                GaryAI\Installer::uninstall();
            }
        }
        
        // Manual cleanup as fallback
        delete_option( 'gary_ai_db_version' );
        delete_option( 'gary_ai_api_key' );
        delete_option( 'gary_ai_settings' );
        
    } catch ( Exception $e ) {
        // Silent fail - allow plugin deletion even if cleanup fails
        error_log( 'Gary AI uninstall error: ' . $e->getMessage() );
    }
}

// -----------------------------------------------------------------------------
// 3. WordPress-native plugin - no Composer dependencies needed.
// -----------------------------------------------------------------------------

// Load vendor autoloader for PSR-3 dependencies
if ( file_exists( GARY_AI_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
    require_once GARY_AI_PLUGIN_DIR . 'vendor/autoload.php';
}

// -----------------------------------------------------------------------------
// 4. Fallback PSR-4 autoloader for plugin classes.
// -----------------------------------------------------------------------------

require_once GARY_AI_PLUGIN_DIR . 'includes/class-autoloader.php';
GaryAI\Autoloader::register();

// -----------------------------------------------------------------------------
// 5. Bootstrap the plugin.
// -----------------------------------------------------------------------------

// Main plugin bootstrap
add_action( 'plugins_loaded', function () {
    // Safe plugin initialization with error handling
    try {
        // Database migrations
        if ( class_exists( 'GaryAI\Installer' ) ) {
            GaryAI\Installer::maybe_migrate();
        }

        // REST API controller
        if ( class_exists( 'GaryAI\RestApiController' ) ) {
            new GaryAI\RestApiController();
        }

        // Frontend controller
        if ( ! is_admin() && class_exists( 'GaryAI\FrontendController' ) ) {
            new GaryAI\FrontendController();
        }

        // Admin controller
        if ( is_admin() && class_exists( 'GaryAI\Admin\Admin' ) ) {
            new GaryAI\Admin\Admin();
        }

        do_action( 'gary_ai_bootstrap' );

    } catch ( Exception $e ) {
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            error_log( '[Gary AI] Plugin bootstrap error: ' . $e->getMessage() );
        }
    }
} );

/*
    // Safe plugin initialization with error handling
    try {
        // Check for database migrations on every load
        if ( class_exists( 'GaryAI\Installer' ) ) {
            GaryAI\Installer::maybe_migrate();
        }
        
        // Initialize REST API controller only if class exists and is safe
        if ( class_exists( 'GaryAI\RestApiController' ) ) {
            new GaryAI\RestApiController();
        }
        
        // Initialize admin controller - direct require to ensure it loads
        if ( is_admin() ) {
            $admin_file = plugin_dir_path( __FILE__ ) . 'admin/class-admin.php';
            if ( file_exists( $admin_file ) ) {
                require_once $admin_file;
                if ( class_exists( 'GaryAI\Admin\Admin' ) ) {
                    new GaryAI\Admin\Admin();
                }
            }
        }
        
        // Initialize frontend controller only if class exists and is safe
        if ( class_exists( 'GaryAI\FrontendController' ) ) {
            new GaryAI\FrontendController();
        }
        
        do_action( 'gary_ai_bootstrap' );
        
    } catch ( Exception $e ) {
        // Log error but don't break the site
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            error_log( '[Gary AI] Plugin initialization error: ' . $e->getMessage() );
        }
    }
} );
