<?php
/**
 * Focused test to verify Gary AI plugin activation without fatal errors
 */

echo "=== Gary AI Plugin Activation Test ===\n";

// Load PSR-3 dependencies
require_once __DIR__ . '/vendor/psr/log/src/LoggerInterface.php';
require_once __DIR__ . '/vendor/psr/log/src/InvalidArgumentException.php';
require_once __DIR__ . '/vendor/psr/log/src/LogLevel.php';

echo "1. PSR-3 interfaces loaded successfully\n";

// Load autoloader
require_once __DIR__ . '/includes/class-autoloader.php';
GaryAI\Autoloader::register();

echo "2. Gary AI autoloader registered\n";

// Test the critical classes that were causing fatal errors
echo "3. Testing critical class instantiation...\n";

try {
    // Test Logger class (this was the main issue)
    $logger = new GaryAI\Logger();
    echo "   - Logger: SUCCESS\n";
    
    // Test Encryption class
    $encryption = new GaryAI\Encryption('dev-32-byte-encryption-key-test123');
    echo "   - Encryption: SUCCESS\n";
    
    // Test WordPressAuth class
    $wpAuth = new GaryAI\WordPressAuth();
    echo "   - WordPressAuth: SUCCESS\n";
    
    echo "\n4. All critical classes instantiated successfully!\n";
    echo "   Plugin activation should now work without fatal errors.\n";
    
} catch (Exception $e) {
    echo "   - FAILED: " . $e->getMessage() . "\n";
    echo "   - File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n=== Test Complete ===\n";
?>
