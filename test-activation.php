<?php
/**
 * Comprehensive test to verify Gary AI plugin activation without fatal errors
 * This simulates the WordPress plugin activation process
 */

echo "=== Gary AI Plugin Activation Test ===\n";

// Simulate WordPress environment constants
define('ABSPATH', '/var/www/html/');
define('WP_DEBUG', true);

// Define plugin constants
define('GARY_AI_PLUGIN_DIR', __DIR__ . '/');
define('GARY_AI_PLUGIN_URL', 'http://localhost:8080/wp-content/plugins/gary-ai/');

echo "1. Loading WordPress simulation functions...\n";

// Mock WordPress functions that the plugin expects
function add_option($option, $value) {
    echo "   - add_option('$option') called\n";
    return true;
}

function do_action($action) {
    echo "   - do_action('$action') called\n";
}

function add_action($hook, $callback) {
    echo "   - add_action('$hook') registered\n";
}

function file_exists($file) {
    return \file_exists($file);
}

function class_exists($class) {
    return \class_exists($class);
}

function defined($constant) {
    return \defined($constant);
}

echo "2. Testing PSR-3 dependency loading...\n";

// Load vendor autoloader for PSR-3 dependencies
if (file_exists(GARY_AI_PLUGIN_DIR . 'vendor/autoload.php')) {
    require_once GARY_AI_PLUGIN_DIR . 'vendor/autoload.php';
    echo "   - Vendor autoloader: LOADED\n";
} else {
    echo "   - Vendor autoloader: NOT FOUND\n";
}

// Load custom autoloader
if (file_exists(GARY_AI_PLUGIN_DIR . 'includes/class-autoloader.php')) {
    require_once GARY_AI_PLUGIN_DIR . 'includes/class-autoloader.php';
    GaryAI\Autoloader::register();
    echo "   - Custom autoloader: LOADED\n";
} else {
    echo "   - Custom autoloader: NOT FOUND\n";
}

echo "3. Testing critical class availability...\n";

$testClasses = [
    'GaryAI\Installer',
    'GaryAI\RestApiController', 
    'GaryAI\FrontendController',
    'GaryAI\Logger',
    'GaryAI\Encryption',
    'GaryAI\WordPressAuth',
    'Psr\Log\LoggerInterface',
    'Psr\Log\InvalidArgumentException',
    'Psr\Log\LogLevel'
];

foreach ($testClasses as $class) {
    $exists = class_exists($class) || interface_exists($class);
    echo "   - $class: " . ($exists ? 'FOUND' : 'NOT FOUND') . "\n";
}

echo "4. Testing plugin activation simulation...\n";

try {
    // Simulate the plugin activation function
    echo "   - Starting plugin activation...\n";
    
    // Test Installer class instantiation
    if (class_exists('GaryAI\Installer')) {
        echo "   - Installer class available\n";
    }
    
    // Test RestApiController instantiation (this was causing the fatal error)
    if (class_exists('GaryAI\RestApiController')) {
        echo "   - RestApiController class available\n";
        
        // Test if we can create the controller without fatal errors
        echo "   - Testing RestApiController instantiation...\n";
        $controller = new GaryAI\RestApiController();
        echo "   - RestApiController instantiation: SUCCESS\n";
    }
    
    echo "   - Plugin activation simulation: SUCCESS\n";
    
} catch (Exception $e) {
    echo "   - Plugin activation simulation: FAILED\n";
    echo "   - Error: " . $e->getMessage() . "\n";
    echo "   - File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n=== Test Complete ===\n";
?>
