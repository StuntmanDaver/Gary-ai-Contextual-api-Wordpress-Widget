<?php
/**
 * Gary AI Logger Class
 *
 * PSR-3 compatible logger for Gary AI plugin.
 *
 * @package GaryAI
 * @since   1.0.0
 */

namespace GaryAI;

use Psr\Log\LoggerInterface;
use Psr\Log\LogLevel;
use Psr\Log\InvalidArgumentException;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class Logger
 *
 * PSR-3 compatible logger implementation.
 */
class Logger implements LoggerInterface {

    /**
     * Log levels hierarchy.
     */
    const LEVELS = [
        LogLevel::EMERGENCY => 0,
        LogLevel::ALERT     => 1,
        LogLevel::CRITICAL  => 2,
        LogLevel::ERROR     => 3,
        LogLevel::WARNING   => 4,
        LogLevel::NOTICE    => 5,
        LogLevel::INFO      => 6,
        LogLevel::DEBUG     => 7,
    ];

    /**
     * Minimum log level to actually log.
     *
     * @var string
     */
    private string $minLevel;

    /**
     * Whether to log to WordPress debug.log.
     *
     * @var bool
     */
    private bool $logToDebugFile;

    /**
     * Whether to log to database.
     *
     * @var bool
     */
    private bool $logToDatabase;

    /**
     * Constructor.
     *
     * @param string $minLevel       Minimum log level.
     * @param bool   $logToDebugFile Whether to log to debug.log.
     * @param bool   $logToDatabase  Whether to log to database.
     */
    public function __construct( 
        string $minLevel = LogLevel::INFO, 
        bool $logToDebugFile = true, 
        bool $logToDatabase = false 
    ) {
        $this->minLevel = $minLevel;
        $this->logToDebugFile = $logToDebugFile;
        $this->logToDatabase = $logToDatabase;

        // In production, disable debug logging by default
        if ( defined( 'WP_DEBUG' ) && ! WP_DEBUG && $minLevel === LogLevel::DEBUG ) {
            $this->minLevel = LogLevel::INFO;
        }
    }

    /**
     * System is unusable.
     *
     * @param string|\Stringable $message
     * @param mixed[]            $context
     * @return void
     */
    public function emergency( $message, array $context = [] ): void {
        $this->log( LogLevel::EMERGENCY, $message, $context );
    }

    /**
     * Action must be taken immediately.
     *
     * @param string|\Stringable $message
     * @param mixed[]            $context
     * @return void
     */
    public function alert( $message, array $context = [] ): void {
        $this->log( LogLevel::ALERT, $message, $context );
    }

    /**
     * Critical conditions.
     *
     * @param string|\Stringable $message
     * @param mixed[]            $context
     * @return void
     */
    public function critical( $message, array $context = [] ): void {
        $this->log( LogLevel::CRITICAL, $message, $context );
    }

    /**
     * Runtime errors that do not require immediate action.
     *
     * @param string|\Stringable $message
     * @param mixed[]            $context
     * @return void
     */
    public function error( $message, array $context = [] ): void {
        $this->log( LogLevel::ERROR, $message, $context );
    }

    /**
     * Exceptional occurrences that are not errors.
     *
     * @param string|\Stringable $message
     * @param mixed[]            $context
     * @return void
     */
    public function warning( $message, array $context = [] ): void {
        $this->log( LogLevel::WARNING, $message, $context );
    }

    /**
     * Normal but significant events.
     *
     * @param string|\Stringable $message
     * @param mixed[]            $context
     * @return void
     */
    public function notice( $message, array $context = [] ): void {
        $this->log( LogLevel::NOTICE, $message, $context );
    }

    /**
     * Interesting events.
     *
     * @param string|\Stringable $message
     * @param mixed[]            $context
     * @return void
     */
    public function info( $message, array $context = [] ): void {
        $this->log( LogLevel::INFO, $message, $context );
    }

    /**
     * Detailed debug information.
     *
     * @param string|\Stringable $message
     * @param mixed[]            $context
     * @return void
     */
    public function debug( $message, array $context = [] ): void {
        $this->log( LogLevel::DEBUG, $message, $context );
    }

    /**
     * Logs with an arbitrary level.
     *
     * @param mixed              $level
     * @param string|\Stringable $message
     * @param mixed[]            $context
     * @return void
     * @throws InvalidArgumentException
     */
    public function log( $level, $message, array $context = [] ): void {
        if ( ! isset( self::LEVELS[ $level ] ) ) {
            throw new InvalidArgumentException( "Invalid log level: {$level}" );
        }

        // Check if we should log this level
        if ( ! $this->shouldLog( $level ) ) {
            return;
        }

        $formattedMessage = $this->formatMessage( $level, $message, $context );

        // Log to WordPress debug.log
        if ( $this->logToDebugFile ) {
            error_log( $formattedMessage );
        }

        // Log to database
        if ( $this->logToDatabase ) {
            $this->logToDatabase( $level, $message, $context );
        }

        // Trigger WordPress action for custom logging
        do_action( 'gary_ai_log', $level, $message, $context );
    }

    /**
     * Check if we should log this level.
     *
     * @param string $level Log level.
     * @return bool True if should log.
     */
    private function shouldLog( string $level ): bool {
        return self::LEVELS[ $level ] <= self::LEVELS[ $this->minLevel ];
    }

    /**
     * Format log message.
     *
     * @param string $level   Log level.
     * @param string $message Log message.
     * @param array  $context Context data.
     * @return string Formatted message.
     */
    private function formatMessage( string $level, string $message, array $context ): string {
        $timestamp = current_time( 'Y-m-d H:i:s' );
        $levelUpper = strtoupper( $level );
        
        // Interpolate context values into message placeholders
        $message = $this->interpolate( $message, $context );
        
        // Add context data if present
        $contextString = '';
        if ( ! empty( $context ) ) {
            $contextString = ' | Context: ' . wp_json_encode( $context );
        }

        return "[{$timestamp}] Gary AI.{$levelUpper}: {$message}{$contextString}";
    }

    /**
     * Interpolate context values into message placeholders.
     *
     * @param string $message Message with placeholders.
     * @param array  $context Context data.
     * @return string Interpolated message.
     */
    private function interpolate( string $message, array $context ): string {
        $replace = [];
        
        foreach ( $context as $key => $val ) {
            // Check that the value can be cast to string
            if ( ! is_array( $val ) && ( ! is_object( $val ) || method_exists( $val, '__toString' ) ) ) {
                $replace[ '{' . $key . '}' ] = $val;
            }
        }

        return strtr( $message, $replace );
    }

    /**
     * Log to database.
     *
     * @param string $level   Log level.
     * @param string $message Log message.
     * @param array  $context Context data.
     */
    private function logToDatabase( string $level, string $message, array $context ): void {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_analytics';
        
        $data = [
            'event_type'  => 'log_entry',
            'event_data'  => wp_json_encode( [
                'level'   => $level,
                'message' => $message,
                'context' => $context,
            ] ),
            'user_id'     => get_current_user_id() ?: null,
            'session_id'  => $this->getCurrentSessionId(),
            'ip_address'  => $this->getClientIpAddress(),
            'user_agent'  => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'created_at'  => current_time( 'mysql' ),
        ];

        $wpdb->insert( $table, $data );
    }

    /**
     * Get current session ID.
     *
     * @return string Session ID.
     */
    private function getCurrentSessionId(): string {
        if ( ! session_id() ) {
            return 'no-session';
        }
        return session_id();
    }

    /**
     * Get client IP address.
     *
     * @return string Client IP address.
     */
    private function getClientIpAddress(): string {
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR',
        ];

        foreach ( $ipKeys as $key ) {
            if ( ! empty( $_SERVER[ $key ] ) ) {
                $ips = explode( ',', $_SERVER[ $key ] );
                $ip = trim( $ips[0] );
                
                if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    /**
     * Create logger instance with default configuration.
     *
     * @return self Logger instance.
     */
    public static function create(): self {
        $minLevel = defined( 'WP_DEBUG' ) && WP_DEBUG ? LogLevel::DEBUG : LogLevel::INFO;
        $logToDatabase = (bool) get_option( 'gary_ai_analytics_enabled', true );
        
        return new self( $minLevel, true, $logToDatabase );
    }

    /**
     * Set minimum log level.
     *
     * @param string $level Minimum log level.
     * @return self For method chaining.
     */
    public function setMinLevel( string $level ): self {
        if ( ! isset( self::LEVELS[ $level ] ) ) {
            throw new InvalidArgumentException( "Invalid log level: {$level}" );
        }
        
        $this->minLevel = $level;
        return $this;
    }

    /**
     * Enable or disable database logging.
     *
     * @param bool $enabled Whether to enable database logging.
     * @return self For method chaining.
     */
    public function setDatabaseLogging( bool $enabled ): self {
        $this->logToDatabase = $enabled;
        return $this;
    }

    /**
     * Enable or disable debug file logging.
     *
     * @param bool $enabled Whether to enable debug file logging.
     * @return self For method chaining.
     */
    public function setDebugFileLogging( bool $enabled ): self {
        $this->logToDebugFile = $enabled;
        return $this;
    }

    /**
     * Get current minimum log level.
     *
     * @return string Current minimum log level.
     */
    public function getMinLevel(): string {
        return $this->minLevel;
    }

    /**
     * Check if a log level is enabled.
     *
     * @param string $level Log level to check.
     * @return bool True if level is enabled.
     */
    public function isLevelEnabled( string $level ): bool {
        return $this->shouldLog( $level );
    }
}
