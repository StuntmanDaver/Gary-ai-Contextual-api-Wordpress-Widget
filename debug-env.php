<?php
// Debug file to test environment variable logic
define('ABSPATH', '/var/www/html/');
require_once('/var/www/html/wp-load.php');

echo "=== Environment Variable Debug Test ===\n";

// Test the exact same logic used in settings page
$settings = get_option('gary_ai_settings', []);

echo "1. getenv('CONTEXTUAL_API_KEY'): [" . getenv('CONTEXTUAL_API_KEY') . "]\n";
echo "2. settings array: " . print_r($settings, true) . "\n";
echo "3. settings['api_key'] ?? '': [" . ($settings['api_key'] ?? '') . "]\n";
echo "4. Final ternary result: [" . (getenv('CONTEXTUAL_API_KEY') ?: ($settings['api_key'] ?? '')) . "]\n";

echo "\n=== Testing Other Variables ===\n";
echo "AGENT_ID: [" . (getenv('AGENT_ID') ?: ($settings['agent_id'] ?? '')) . "]\n";
echo "DATASTORE_ID: [" . (getenv('DATASTORE_ID') ?: ($settings['datastore_id'] ?? '')) . "]\n";

echo "\n=== Raw getenv() Tests ===\n";
echo "Raw CONTEXTUAL_API_KEY: [" . getenv('CONTEXTUAL_API_KEY') . "]\n";
echo "Raw AGENT_ID: [" . getenv('AGENT_ID') . "]\n";
echo "Raw DATASTORE_ID: [" . getenv('DATASTORE_ID') . "]\n";
