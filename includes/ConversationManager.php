<?php
/**
 * Conversation Manager
 *
 * Handles CRUD operations for conversations and messages with encryption.
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
 * Class ConversationManager
 *
 * Manages conversations and messages with database operations and encryption.
 */
class ConversationManager {

    /**
     * Encryption service instance.
     *
     * @var Encryption
     */
    private Encryption $encryption;

    /**
     * Constructor.
     *
     * @param Encryption $encryption Encryption service instance.
     */
    public function __construct( Encryption $encryption ) {
        $this->encryption = $encryption;
    }

    /**
     * Create a new conversation.
     *
     * @param int|null $userId    WordPress user ID (null for anonymous).
     * @param string   $sessionId Session identifier.
     * @param string   $title     Conversation title.
     * @return int Conversation ID.
     * @throws \Exception If conversation creation fails.
     */
    public function createConversation( ?int $userId, string $sessionId, string $title = '' ): int {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_conversations';
        
        $data = [
            'user_id'    => $userId,
            'session_id' => $sessionId,
            'title'      => $title ?: 'New Conversation',
            'status'     => 'active',
            'created_at' => current_time( 'mysql' ),
            'updated_at' => current_time( 'mysql' ),
        ];

        $result = $wpdb->insert( $table, $data );

        if ( false === $result ) {
            throw new \Exception( 'Failed to create conversation: ' . $wpdb->last_error );
        }

        return $wpdb->insert_id;
    }

    /**
     * Get conversation by ID.
     *
     * @param int $conversationId Conversation ID.
     * @return array|null Conversation data or null if not found.
     */
    public function getConversation( int $conversationId ): ?array {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_conversations';
        
        $conversation = $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $conversationId ),
            ARRAY_A
        );

        return $conversation ?: null;
    }

    /**
     * Get conversation by session ID.
     *
     * @param string $sessionId Session identifier.
     * @return array|null Conversation data or null if not found.
     */
    public function getConversationBySession( string $sessionId ): ?array {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_conversations';
        
        $conversation = $wpdb->get_row(
            $wpdb->prepare( 
                "SELECT * FROM {$table} WHERE session_id = %s AND status = 'active' ORDER BY updated_at DESC LIMIT 1", 
                $sessionId 
            ),
            ARRAY_A
        );

        return $conversation ?: null;
    }

    /**
     * Update conversation.
     *
     * @param int   $conversationId Conversation ID.
     * @param array $data           Data to update.
     * @return bool True on success, false on failure.
     */
    public function updateConversation( int $conversationId, array $data ): bool {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_conversations';
        
        // Add updated timestamp
        $data['updated_at'] = current_time( 'mysql' );

        $result = $wpdb->update(
            $table,
            $data,
            [ 'id' => $conversationId ],
            null,
            [ '%d' ]
        );

        return false !== $result;
    }

    /**
     * Delete conversation and all its messages.
     *
     * @param int $conversationId Conversation ID.
     * @return bool True on success, false on failure.
     */
    public function deleteConversation( int $conversationId ): bool {
        global $wpdb;

        // Start transaction
        $wpdb->query( 'START TRANSACTION' );

        try {
            // Delete messages first (foreign key constraint)
            $messages_table = $wpdb->prefix . 'gary_ai_messages';
            $wpdb->delete( $messages_table, [ 'conversation_id' => $conversationId ], [ '%d' ] );

            // Delete conversation
            $conversations_table = $wpdb->prefix . 'gary_ai_conversations';
            $result = $wpdb->delete( $conversations_table, [ 'id' => $conversationId ], [ '%d' ] );

            if ( false === $result ) {
                throw new \Exception( 'Failed to delete conversation' );
            }

            $wpdb->query( 'COMMIT' );
            return true;

        } catch ( \Exception $e ) {
            $wpdb->query( 'ROLLBACK' );
            error_log( '[Gary AI] ConversationManager: ' . $e->getMessage() );
            return false;
        }
    }

    /**
     * Add a message to a conversation.
     *
     * @param int    $conversationId Conversation ID.
     * @param string $role           Message role (user, assistant, system).
     * @param string $content        Message content.
     * @param array  $metadata       Additional metadata.
     * @param int    $tokenCount     Token count for the message.
     * @return int Message ID.
     * @throws \Exception If message creation fails.
     */
    public function addMessage( 
        int $conversationId, 
        string $role, 
        string $content, 
        array $metadata = [], 
        int $tokenCount = 0 
    ): int {
        global $wpdb;

        // Validate role
        if ( ! in_array( $role, [ 'user', 'assistant', 'system' ], true ) ) {
            throw new \Exception( 'Invalid message role: ' . $role );
        }

        // Encrypt content if configured
        $encryptedContent = $this->shouldEncryptContent() ? 
            $this->encryption->encrypt( $content ) : 
            $content;

        $table = $wpdb->prefix . 'gary_ai_messages';
        
        $data = [
            'conversation_id' => $conversationId,
            'role'           => $role,
            'content'        => $encryptedContent,
            'metadata'       => ! empty( $metadata ) ? wp_json_encode( $metadata ) : null,
            'token_count'    => $tokenCount,
            'created_at'     => current_time( 'mysql' ),
        ];

        $result = $wpdb->insert( $table, $data );

        if ( false === $result ) {
            throw new \Exception( 'Failed to add message: ' . $wpdb->last_error );
        }

        // Update conversation timestamp
        $this->updateConversation( $conversationId, [] );

        return $wpdb->insert_id;
    }

    /**
     * Get messages for a conversation.
     *
     * @param int $conversationId Conversation ID.
     * @param int $limit          Maximum number of messages to retrieve.
     * @param int $offset         Offset for pagination.
     * @return array Array of messages.
     */
    public function getMessages( int $conversationId, int $limit = 50, int $offset = 0 ): array {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_messages';
        
        $messages = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE conversation_id = %d ORDER BY created_at ASC LIMIT %d OFFSET %d",
                $conversationId,
                $limit,
                $offset
            ),
            ARRAY_A
        );

        // Decrypt content if needed
        foreach ( $messages as &$message ) {
            if ( $this->shouldEncryptContent() ) {
                $message['content'] = $this->encryption->decrypt( $message['content'] );
            }
            
            // Decode metadata
            if ( ! empty( $message['metadata'] ) ) {
                $message['metadata'] = json_decode( $message['metadata'], true );
            }
        }

        return $messages;
    }

    /**
     * Get recent conversations for a user or session.
     *
     * @param int|null $userId    WordPress user ID (null for anonymous).
     * @param string   $sessionId Session identifier.
     * @param int      $limit     Maximum number of conversations.
     * @return array Array of conversations.
     */
    public function getRecentConversations( ?int $userId, string $sessionId, int $limit = 10 ): array {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_conversations';
        
        if ( $userId ) {
            $conversations = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT * FROM {$table} WHERE user_id = %d ORDER BY updated_at DESC LIMIT %d",
                    $userId,
                    $limit
                ),
                ARRAY_A
            );
        } else {
            $conversations = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT * FROM {$table} WHERE session_id = %s ORDER BY updated_at DESC LIMIT %d",
                    $sessionId,
                    $limit
                ),
                ARRAY_A
            );
        }

        return $conversations;
    }

    /**
     * Get conversation statistics.
     *
     * @param int $conversationId Conversation ID.
     * @return array Statistics array.
     */
    public function getConversationStats( int $conversationId ): array {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_messages';
        
        $stats = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT 
                    COUNT(*) as message_count,
                    SUM(token_count) as total_tokens,
                    MIN(created_at) as first_message,
                    MAX(created_at) as last_message
                FROM {$table} 
                WHERE conversation_id = %d",
                $conversationId
            ),
            ARRAY_A
        );

        return $stats ?: [
            'message_count' => 0,
            'total_tokens'  => 0,
            'first_message' => null,
            'last_message'  => null,
        ];
    }

    /**
     * Clean up old conversations based on retention policy.
     *
     * @param int $daysToKeep Number of days to keep conversations.
     * @return int Number of conversations deleted.
     */
    public function cleanupOldConversations( int $daysToKeep = 30 ): int {
        global $wpdb;

        $cutoffDate = gmdate( 'Y-m-d H:i:s', strtotime( "-{$daysToKeep} days" ) );
        
        // Get conversations to delete
        $conversations_table = $wpdb->prefix . 'gary_ai_conversations';
        $conversationIds = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT id FROM {$conversations_table} WHERE updated_at < %s",
                $cutoffDate
            )
        );

        if ( empty( $conversationIds ) ) {
            return 0;
        }

        $deletedCount = 0;
        
        // Delete each conversation (this will cascade to messages)
        foreach ( $conversationIds as $conversationId ) {
            if ( $this->deleteConversation( (int) $conversationId ) ) {
                $deletedCount++;
            }
        }

        return $deletedCount;
    }

    /**
     * Check if content should be encrypted.
     *
     * @return bool True if encryption is enabled.
     */
    private function shouldEncryptContent(): bool {
        return (bool) get_option( 'gary_ai_save_conversations', true );
    }

    /**
     * Get conversation count for analytics.
     *
     * @param string $period Period for counting (day, week, month).
     * @return int Conversation count.
     */
    public function getConversationCount( string $period = 'day' ): int {
        global $wpdb;

        $table = $wpdb->prefix . 'gary_ai_conversations';
        
        switch ( $period ) {
            case 'week':
                $since = gmdate( 'Y-m-d H:i:s', strtotime( '-1 week' ) );
                break;
            case 'month':
                $since = gmdate( 'Y-m-d H:i:s', strtotime( '-1 month' ) );
                break;
            default:
                $since = gmdate( 'Y-m-d H:i:s', strtotime( '-1 day' ) );
        }

        return (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table} WHERE created_at >= %s",
                $since
            )
        );
    }
}
