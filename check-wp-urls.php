<?php
/**
 * Check and fix WordPress URLs for port consistency
 */

// Load WordPress
require_once('/var/www/html/wp-config.php');

echo "=== WordPress URL Configuration Check ===\n";

// Check current URLs
$siteurl = get_option('siteurl');
$home = get_option('home');

echo "Current Site URL: " . $siteurl . "\n";
echo "Current Home URL: " . $home . "\n";

// Check if URLs contain port 8080
if (strpos($siteurl, ':8080') !== false || strpos($home, ':8080') !== false) {
    echo "\n🚨 ISSUE FOUND: URLs contain port 8080!\n";
    
    // Fix the URLs to use port 9000
    $new_siteurl = str_replace(':8080', ':9000', $siteurl);
    $new_home = str_replace(':8080', ':9000', $home);
    
    echo "Updating Site URL to: " . $new_siteurl . "\n";
    echo "Updating Home URL to: " . $new_home . "\n";
    
    update_option('siteurl', $new_siteurl);
    update_option('home', $new_home);
    
    echo "✅ URLs updated successfully!\n";
} else {
    echo "✅ URLs are correct (no port 8080 found)\n";
}

// Check wp-config constants
echo "\n=== wp-config.php Constants ===\n";
if (defined('WP_HOME')) {
    echo "WP_HOME: " . WP_HOME . "\n";
} else {
    echo "WP_HOME: Not defined\n";
}

if (defined('WP_SITEURL')) {
    echo "WP_SITEURL: " . WP_SITEURL . "\n";
} else {
    echo "WP_SITEURL: Not defined\n";
}

// Check server variables
echo "\n=== Server Variables ===\n";
echo "HTTP_HOST: " . ($_SERVER['HTTP_HOST'] ?? 'Not set') . "\n";
echo "SERVER_PORT: " . ($_SERVER['SERVER_PORT'] ?? 'Not set') . "\n";
echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'Not set') . "\n";
