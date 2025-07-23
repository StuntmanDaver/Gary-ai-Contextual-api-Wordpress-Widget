<?php
/**
 * Gary AI Installer Class
 *
 * Handles database table creation, migrations, and cleanup.
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
 * Class Installer
 *
 * Manages database schema creation and migrations for Gary AI plugin.
 */
class Installer {

    /**
     * Database version for tracking migrations.
     */
    const DB_VERSION = '1.0.0';

    /**
     * Option key for storing database version.
     */
    const DB_VERSION_OPTION = 'gary_ai_db_version';

    /**
     * Run installation process.
     *
     * Creates database tables and sets up initial options.
     */
    public static function install() {
        self::create_tables();
        self::set_default_options();
        self::update_db_version();
    }

    /**
     * Run uninstallation process.
     *
     * Removes database tables and options (only on plugin deletion, not deactivation).
     */
    public static function uninstall() {
        self::drop_tables();
        self::remove_options();
    }

    /**
     * Run deactivation cleanup.
     *
     * Minimal cleanup on plugin deactivation (preserves data).
     */
    public static function deactivate() {
        // Clear any scheduled cron jobs
        wp_clear_scheduled_hook( 'gary_ai_cleanup_old_conversations' );
        wp_clear_scheduled_hook( 'gary_ai_analytics_aggregation' );
    }

    /**
     * Create database tables using dbDelta.
     */
    private static function create_tables() {
        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset_collate = $wpdb->get_charset_collate();

        // Conversations table
        $conversations_table = $wpdb->prefix . 'gary_ai_conversations';
        $conversations_sql = "CREATE TABLE $conversations_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned DEFAULT NULL,
            session_id varchar(255) NOT NULL,
            title varchar(500) DEFAULT NULL,
            status varchar(20) DEFAULT 'active',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY session_id (session_id),
            KEY status (status),
            KEY created_at (created_at)
        ) $charset_collate;";

        // Messages table
        $messages_table = $wpdb->prefix . 'gary_ai_messages';
        $messages_sql = "CREATE TABLE $messages_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            conversation_id bigint(20) unsigned NOT NULL,
            role enum('user','assistant','system') NOT NULL,
            content longtext NOT NULL,
            metadata longtext DEFAULT NULL,
            token_count int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY conversation_id (conversation_id),
            KEY role (role),
            KEY created_at (created_at),
            FOREIGN KEY (conversation_id) REFERENCES $conversations_table(id) ON DELETE CASCADE
        ) $charset_collate;";

        // Analytics table
        $analytics_table = $wpdb->prefix . 'gary_ai_analytics';
        $analytics_sql = "CREATE TABLE $analytics_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            event_type varchar(50) NOT NULL,
            event_data longtext DEFAULT NULL,
            user_id bigint(20) unsigned DEFAULT NULL,
            session_id varchar(255) DEFAULT NULL,
            ip_address varchar(45) DEFAULT NULL,
            user_agent text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY event_type (event_type),
            KEY user_id (user_id),
            KEY session_id (session_id),
            KEY created_at (created_at)
        ) $charset_collate;";

        // Settings table
        $settings_table = $wpdb->prefix . 'gary_ai_settings';
        $settings_sql = "CREATE TABLE $settings_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            setting_key varchar(100) NOT NULL,
            setting_value longtext DEFAULT NULL,
            is_encrypted tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY setting_key (setting_key)
        ) $charset_collate;";

        // Rate limiting table
        $rate_limits_table = $wpdb->prefix . 'gary_ai_rate_limits';
        $rate_limits_sql = "CREATE TABLE $rate_limits_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            identifier varchar(255) NOT NULL,
            tokens int(11) NOT NULL DEFAULT 0,
            last_refill datetime DEFAULT CURRENT_TIMESTAMP,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY identifier (identifier),
            KEY last_refill (last_refill)
        ) $charset_collate;";

        // Execute dbDelta for each table
        dbDelta( $conversations_sql );
        dbDelta( $messages_sql );
        dbDelta( $analytics_sql );
        dbDelta( $settings_sql );
        dbDelta( $rate_limits_sql );
    }

    /**
     * Drop all plugin tables.
     */
    private static function drop_tables() {
        global $wpdb;

        $tables = [
            $wpdb->prefix . 'gary_ai_rate_limits',
            $wpdb->prefix . 'gary_ai_messages',
            $wpdb->prefix . 'gary_ai_conversations',
            $wpdb->prefix . 'gary_ai_analytics',
            $wpdb->prefix . 'gary_ai_settings',
        ];

        foreach ( $tables as $table ) {
            $wpdb->query( $wpdb->prepare( "DROP TABLE IF EXISTS %i", $table ) );
        }
    }

    /**
     * Set default plugin options.
     */
    private static function set_default_options() {
        $default_options = [
            'gary_ai_api_key' => '',
            'gary_ai_datastore_id' => '',
            'gary_ai_widget_enabled' => true,
            'gary_ai_save_conversations' => true,
            'gary_ai_rate_limit_enabled' => true,
            'gary_ai_rate_limit_requests_per_minute' => 60,
            'gary_ai_analytics_enabled' => true,
            'gary_ai_encryption_key' => wp_generate_password( 32, false ),
            'gary_ai_widget_position' => 'bottom-right',
            'gary_ai_widget_theme' => 'light',
            'gary_ai_max_conversation_length' => 50,
            'gary_ai_session_timeout' => 3600, // 1 hour
        ];

        foreach ( $default_options as $option_name => $default_value ) {
            if ( false === get_option( $option_name ) ) {
                add_option( $option_name, $default_value );
            }
        }
    }

    /**
     * Remove all plugin options.
     */
    private static function remove_options() {
        $options_to_remove = [
            'gary_ai_api_key',
            'gary_ai_datastore_id',
            'gary_ai_widget_enabled',
            'gary_ai_save_conversations',
            'gary_ai_rate_limit_enabled',
            'gary_ai_rate_limit_requests_per_minute',
            'gary_ai_analytics_enabled',
            'gary_ai_encryption_key',
            'gary_ai_widget_position',
            'gary_ai_widget_theme',
            'gary_ai_max_conversation_length',
            'gary_ai_session_timeout',
            self::DB_VERSION_OPTION,
        ];

        foreach ( $options_to_remove as $option_name ) {
            delete_option( $option_name );
        }
    }

    /**
     * Update database version option.
     */
    private static function update_db_version() {
        update_option( self::DB_VERSION_OPTION, self::DB_VERSION );
    }

    /**
     * Check if database needs migration.
     *
     * @return bool True if migration is needed.
     */
    public static function needs_migration() {
        $current_version = get_option( self::DB_VERSION_OPTION, '0.0.0' );
        return version_compare( $current_version, self::DB_VERSION, '<' );
    }

    /**
     * Run database migration if needed.
     */
    public static function maybe_migrate() {
        if ( self::needs_migration() ) {
            self::install();
        }
    }
}
