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
// 2. Register activation / deactivation hooks.
// -----------------------------------------------------------------------------

register_activation_hook( __FILE__, 'gary_ai_activate' );
register_deactivation_hook( __FILE__, 'gary_ai_deactivate' );

/**
 * Plugin activation callback.
 */
function gary_ai_activate() {
    // Placeholder for dbDelta migrations & default option seeds.
    do_action( 'gary_ai_activate' );
}

/**
 * Plugin deactivation callback.
 */
function gary_ai_deactivate() {
    // Placeholder for cleanup logic.
    do_action( 'gary_ai_deactivate' );
}

// -----------------------------------------------------------------------------
// 3. Load Composer autoloader if present.
// -----------------------------------------------------------------------------

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

add_action( 'plugins_loaded', function () {
    do_action( 'gary_ai_bootstrap' );
} );
