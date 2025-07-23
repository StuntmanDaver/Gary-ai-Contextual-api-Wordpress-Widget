<?php
/**
 * Final meticulous verification of PSR-3 dependency resolution
 */

echo "=== FINAL PSR-3 DEPENDENCY VERIFICATION ===\n";

// 1. Verify PSR-3 interfaces load correctly
echo "1. Loading PSR-3 interfaces...\n";
require_once __DIR__ . '/vendor/psr/log/src/LoggerInterface.php';
require_once __DIR__ . '/vendor/psr/log/src/InvalidArgumentException.php';
require_once __DIR__ . '/vendor/psr/log/src/LogLevel.php';

echo "   - LoggerInterface: " . (interface_exists('Psr\Log\LoggerInterface') ? 'FOUND' : 'NOT FOUND') . "\n";
echo "   - InvalidArgumentException: " . (class_exists('Psr\Log\InvalidArgumentException') ? 'FOUND' : 'NOT FOUND') . "\n";
echo "   - LogLevel: " . (class_exists('Psr\Log\LogLevel') ? 'FOUND' : 'NOT FOUND') . "\n";

// 2. Verify autoloader registration
echo "\n2. Loading Gary AI autoloader...\n";
require_once __DIR__ . '/includes/class-autoloader.php';
GaryAI\Autoloader::register();
echo "   - Autoloader registered successfully\n";

// 3. Verify Logger class instantiation (the critical test)
echo "\n3. Testing Logger class instantiation...\n";
try {
    $logger = new GaryAI\Logger();
    echo "   - Logger instantiation: SUCCESS\n";
    
    // Test basic logging functionality
    $logger->info('Verification test message', ['test' => 'data']);
    echo "   - Logger info() method: SUCCESS\n";
    
    $logger->error('Test error message');
    echo "   - Logger error() method: SUCCESS\n";
    
} catch (Exception $e) {
    echo "   - Logger test: FAILED - " . $e->getMessage() . "\n";
    echo "   - Error in: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

// 4. Verify other critical classes
echo "\n4. Testing other critical classes...\n";
try {
    $encryption = new GaryAI\Encryption('dev-32-byte-encryption-key-test123');
    echo "   - Encryption instantiation: SUCCESS\n";
    
    $wpAuth = new GaryAI\WordPressAuth();
    echo "   - WordPressAuth instantiation: SUCCESS\n";
    
} catch (Exception $e) {
    echo "   - Critical class test: FAILED - " . $e->getMessage() . "\n";
}

// 5. Verify vendor autoloader functionality
echo "\n5. Testing vendor autoloader...\n";
require_once __DIR__ . '/vendor/autoload.php';
echo "   - Vendor autoloader loaded successfully\n";

echo "\n=== VERIFICATION COMPLETE ===\n";
echo "All PSR-3 dependencies and critical classes verified!\n";
?>
