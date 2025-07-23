<?php
/**
 * Test script to verify PSR-3 dependency installation and Logger class functionality
 */

echo "=== PSR-3 Dependency Test ===\n";

// Test 1: Load PSR-3 interfaces directly
echo "1. Loading PSR-3 interfaces directly...\n";
require_once __DIR__ . '/vendor/psr/log/src/LoggerInterface.php';
require_once __DIR__ . '/vendor/psr/log/src/InvalidArgumentException.php';
require_once __DIR__ . '/vendor/psr/log/src/LogLevel.php';

echo "   - LoggerInterface: " . (interface_exists('Psr\Log\LoggerInterface') ? 'FOUND' : 'NOT FOUND') . "\n";
echo "   - InvalidArgumentException: " . (class_exists('Psr\Log\InvalidArgumentException') ? 'FOUND' : 'NOT FOUND') . "\n";
echo "   - LogLevel: " . (class_exists('Psr\Log\LogLevel') ? 'FOUND' : 'NOT FOUND') . "\n";

// Test 2: Load Gary AI autoloader
echo "\n2. Loading Gary AI autoloader...\n";
require_once __DIR__ . '/includes/class-autoloader.php';
GaryAI\Autoloader::register();
echo "   - Autoloader registered successfully\n";

// Test 3: Test Logger class instantiation
echo "\n3. Testing Logger class instantiation...\n";
try {
    $logger = new GaryAI\Logger();
    echo "   - Logger instantiation: SUCCESS\n";
    
    // Test 4: Test basic logging functionality
    echo "\n4. Testing basic logging functionality...\n";
    $logger->info('Test log message', ['test' => 'data']);
    echo "   - Basic logging: SUCCESS\n";
    
} catch (Exception $e) {
    echo "   - Logger instantiation: FAILED - " . $e->getMessage() . "\n";
    echo "   - Error trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";
?>
