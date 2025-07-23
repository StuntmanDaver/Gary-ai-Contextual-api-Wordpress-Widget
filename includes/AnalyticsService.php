<?php
/**
 * Analytics Service
 *
 * Handles tracking and analytics for Gary AI plugin usage.
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
 * Class AnalyticsService
 *
 * Manages analytics data collection and reporting.
 */
class AnalyticsService {

    /**
     * Track an analytics event.
     *
     * @param string $eventType Event type identifier.
     * @param mixed  $eventData Event data (will be JSON encoded).
     * @param int|null $userId  WordPress user ID (null for anonymous).
     * @param string $sessionId Session identifier.
     * @return bool True on success, false on failure.
     */
    public function track( string $eventType, $eventData = null, ?int $userId = null, string $sessionId = '' ): bool {
        // Check if analytics is enabled
        if ( ! $this->isAnalyticsEnabled() ) {
            return true; // Silently succeed if disabled
        }

        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_analytics';
        
        $data = [
            'event_type'  => $eventType,
            'event_data'  => $eventData ? wp_json_encode( $eventData ) : null,
            'user_id'     => $userId,
            'session_id'  => $sessionId,
            'ip_address'  => $this->getClientIpAddress(),
            'user_agent'  => $this->getUserAgent(),
            'created_at'  => current_time( 'mysql' ),
        ];

        $result = $wpdb->insert( $table, $data );

        if ( false === $result ) {
            error_log( '[Gary AI] AnalyticsService: Failed to track event: ' . $wpdb->last_error );
            return false;
        }

        return true;
    }

    /**
     * Track conversation start event.
     *
     * @param int    $conversationId Conversation ID.
     * @param int|null $userId       WordPress user ID.
     * @param string $sessionId      Session identifier.
     * @return bool True on success.
     */
    public function trackConversationStart( int $conversationId, ?int $userId, string $sessionId ): bool {
        return $this->track( 'conversation_start', [
            'conversation_id' => $conversationId,
        ], $userId, $sessionId );
    }

    /**
     * Track message sent event.
     *
     * @param int    $conversationId Conversation ID.
     * @param int    $messageId      Message ID.
     * @param string $role           Message role (user, assistant, system).
     * @param int    $tokenCount     Token count.
     * @param int|null $userId       WordPress user ID.
     * @param string $sessionId      Session identifier.
     * @return bool True on success.
     */
    public function trackMessageSent( 
        int $conversationId, 
        int $messageId, 
        string $role, 
        int $tokenCount, 
        ?int $userId, 
        string $sessionId 
    ): bool {
        return $this->track( 'message_sent', [
            'conversation_id' => $conversationId,
            'message_id'      => $messageId,
            'role'            => $role,
            'token_count'     => $tokenCount,
        ], $userId, $sessionId );
    }

    /**
     * Track API error event.
     *
     * @param string $errorType    Error type/category.
     * @param string $errorMessage Error message.
     * @param array  $context      Additional context.
     * @param int|null $userId     WordPress user ID.
     * @param string $sessionId    Session identifier.
     * @return bool True on success.
     */
    public function trackApiError( 
        string $errorType, 
        string $errorMessage, 
        array $context = [], 
        ?int $userId = null, 
        string $sessionId = '' 
    ): bool {
        return $this->track( 'api_error', [
            'error_type'    => $errorType,
            'error_message' => $errorMessage,
            'context'       => $context,
        ], $userId, $sessionId );
    }

    /**
     * Track widget interaction event.
     *
     * @param string $action     Action performed (open, close, minimize, etc.).
     * @param array  $metadata   Additional metadata.
     * @param int|null $userId   WordPress user ID.
     * @param string $sessionId  Session identifier.
     * @return bool True on success.
     */
    public function trackWidgetInteraction( 
        string $action, 
        array $metadata = [], 
        ?int $userId = null, 
        string $sessionId = '' 
    ): bool {
        return $this->track( 'widget_interaction', [
            'action'   => $action,
            'metadata' => $metadata,
        ], $userId, $sessionId );
    }

    /**
     * Get analytics summary for a time period.
     *
     * @param string $period Period (day, week, month, year).
     * @param string $eventType Optional event type filter.
     * @return array Analytics summary.
     */
    public function getSummary( string $period = 'day', string $eventType = '' ): array {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_analytics';
        
        // Calculate date range
        $dateRange = $this->getDateRange( $period );
        
        // Base query
        $whereClause = "WHERE created_at >= %s AND created_at <= %s";
        $params = [ $dateRange['start'], $dateRange['end'] ];
        
        // Add event type filter if specified
        if ( ! empty( $eventType ) ) {
            $whereClause .= " AND event_type = %s";
            $params[] = $eventType;
        }

        // Get event counts by type
        $eventCounts = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT event_type, COUNT(*) as count 
                FROM {$table} 
                {$whereClause} 
                GROUP BY event_type 
                ORDER BY count DESC",
                ...$params
            ),
            ARRAY_A
        );

        // Get unique users/sessions
        $uniqueStats = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT 
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT session_id) as unique_sessions,
                    COUNT(*) as total_events
                FROM {$table} 
                {$whereClause}",
                ...$params
            ),
            ARRAY_A
        );

        return [
            'period'         => $period,
            'date_range'     => $dateRange,
            'event_counts'   => $eventCounts,
            'unique_users'   => (int) $uniqueStats['unique_users'],
            'unique_sessions' => (int) $uniqueStats['unique_sessions'],
            'total_events'   => (int) $uniqueStats['total_events'],
        ];
    }

    /**
     * Get conversation analytics.
     *
     * @param string $period Period (day, week, month, year).
     * @return array Conversation analytics.
     */
    public function getConversationAnalytics( string $period = 'day' ): array {
        global $wpdb;

        $analytics_table = $wpdb->prefix . 'gary_ai_analytics';
        $conversations_table = $wpdb->prefix . 'gary_ai_conversations';
        $messages_table = $wpdb->prefix . 'gary_ai_messages';
        
        $dateRange = $this->getDateRange( $period );

        // Get conversation starts
        $conversationStarts = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$analytics_table} 
                WHERE event_type = 'conversation_start' 
                AND created_at >= %s AND created_at <= %s",
                $dateRange['start'],
                $dateRange['end']
            )
        );

        // Get message counts by role
        $messageCounts = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT 
                    m.role,
                    COUNT(*) as count,
                    AVG(m.token_count) as avg_tokens
                FROM {$messages_table} m
                WHERE m.created_at >= %s AND m.created_at <= %s
                GROUP BY m.role",
                $dateRange['start'],
                $dateRange['end']
            ),
            ARRAY_A
        );

        // Get average conversation length
        $avgConversationLength = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT AVG(message_count) FROM (
                    SELECT COUNT(*) as message_count
                    FROM {$messages_table} m
                    JOIN {$conversations_table} c ON m.conversation_id = c.id
                    WHERE c.created_at >= %s AND c.created_at <= %s
                    GROUP BY m.conversation_id
                ) as conversation_lengths",
                $dateRange['start'],
                $dateRange['end']
            )
        );

        return [
            'period'                   => $period,
            'date_range'              => $dateRange,
            'conversation_starts'     => (int) $conversationStarts,
            'message_counts'          => $messageCounts,
            'avg_conversation_length' => (float) $avgConversationLength,
        ];
    }

    /**
     * Get error analytics.
     *
     * @param string $period Period (day, week, month, year).
     * @return array Error analytics.
     */
    public function getErrorAnalytics( string $period = 'day' ): array {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_analytics';
        $dateRange = $this->getDateRange( $period );

        $errorStats = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT 
                    JSON_EXTRACT(event_data, '$.error_type') as error_type,
                    COUNT(*) as count
                FROM {$table} 
                WHERE event_type = 'api_error' 
                AND created_at >= %s AND created_at <= %s
                GROUP BY error_type
                ORDER BY count DESC",
                $dateRange['start'],
                $dateRange['end']
            ),
            ARRAY_A
        );

        return [
            'period'      => $period,
            'date_range'  => $dateRange,
            'error_stats' => $errorStats,
        ];
    }

    /**
     * Clean up old analytics data.
     *
     * @param int $daysToKeep Number of days to keep analytics data.
     * @return int Number of records deleted.
     */
    public function cleanupOldData( int $daysToKeep = 90 ): int {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_analytics';
        $cutoffDate = gmdate( 'Y-m-d H:i:s', strtotime( "-{$daysToKeep} days" ) );

        $result = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$table} WHERE created_at < %s",
                $cutoffDate
            )
        );

        return (int) $result;
    }

    /**
     * Export analytics data for a period.
     *
     * @param string $period    Period (day, week, month, year).
     * @param string $format    Export format (json, csv).
     * @param string $eventType Optional event type filter.
     * @return array|string Exported data.
     */
    public function exportData( string $period = 'month', string $format = 'json', string $eventType = '' ) {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_analytics';
        $dateRange = $this->getDateRange( $period );
        
        $whereClause = "WHERE created_at >= %s AND created_at <= %s";
        $params = [ $dateRange['start'], $dateRange['end'] ];
        
        if ( ! empty( $eventType ) ) {
            $whereClause .= " AND event_type = %s";
            $params[] = $eventType;
        }

        $data = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} {$whereClause} ORDER BY created_at DESC",
                ...$params
            ),
            ARRAY_A
        );

        if ( 'csv' === $format ) {
            return $this->convertToCsv( $data );
        }

        return $data;
    }

    /**
     * Check if analytics is enabled.
     *
     * @return bool True if analytics is enabled.
     */
    private function isAnalyticsEnabled(): bool {
        return (bool) get_option( 'gary_ai_analytics_enabled', true );
    }

    /**
     * Get client IP address.
     *
     * @return string Client IP address.
     */
    private function getClientIpAddress(): string {
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_CLIENT_IP',            // Proxy
            'HTTP_X_FORWARDED_FOR',      // Load balancer/proxy
            'HTTP_X_FORWARDED',          // Proxy
            'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
            'HTTP_FORWARDED_FOR',        // Proxy
            'HTTP_FORWARDED',            // Proxy
            'REMOTE_ADDR',               // Standard
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
     * Get user agent string.
     *
     * @return string User agent string.
     */
    private function getUserAgent(): string {
        return $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    }

    /**
     * Get date range for a period.
     *
     * @param string $period Period identifier.
     * @return array Date range with start and end.
     */
    private function getDateRange( string $period ): array {
        $now = current_time( 'mysql' );
        
        switch ( $period ) {
            case 'hour':
                $start = gmdate( 'Y-m-d H:i:s', strtotime( '-1 hour' ) );
                break;
            case 'day':
                $start = gmdate( 'Y-m-d H:i:s', strtotime( '-1 day' ) );
                break;
            case 'week':
                $start = gmdate( 'Y-m-d H:i:s', strtotime( '-1 week' ) );
                break;
            case 'month':
                $start = gmdate( 'Y-m-d H:i:s', strtotime( '-1 month' ) );
                break;
            case 'year':
                $start = gmdate( 'Y-m-d H:i:s', strtotime( '-1 year' ) );
                break;
            default:
                $start = gmdate( 'Y-m-d H:i:s', strtotime( '-1 day' ) );
        }

        return [
            'start' => $start,
            'end'   => $now,
        ];
    }

    /**
     * Convert data array to CSV format.
     *
     * @param array $data Data to convert.
     * @return string CSV formatted data.
     */
    private function convertToCsv( array $data ): string {
        if ( empty( $data ) ) {
            return '';
        }

        $output = fopen( 'php://temp', 'r+' );
        
        // Write headers
        fputcsv( $output, array_keys( $data[0] ) );
        
        // Write data rows
        foreach ( $data as $row ) {
            fputcsv( $output, $row );
        }
        
        rewind( $output );
        $csv = stream_get_contents( $output );
        fclose( $output );
        
        return $csv;
    }
}
