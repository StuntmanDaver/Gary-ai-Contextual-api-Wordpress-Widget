<?php
/**
 * Create WordPress admin user
 */

// Load WordPress
require_once('/var/www/html/wp-config.php');

// Create admin user if it doesn't exist
if (!username_exists('admin') && !email_exists('admin@example.com')) {
    $user_id = wp_create_user('admin', 'admin123', 'admin@example.com');
    if (!is_wp_error($user_id)) {
        $user = new WP_User($user_id);
        $user->set_role('administrator');
        echo "Admin user created successfully with ID: " . $user_id . "\n";
    } else {
        echo "Error creating user: " . $user_id->get_error_message() . "\n";
    }
} else {
    echo "Admin user already exists\n";
}

// Check if Gary AI plugin is active
if (is_plugin_active('gary-ai/gary-ai.php')) {
    echo "Gary AI plugin is active\n";
} else {
    echo "Gary AI plugin is not active\n";
}
