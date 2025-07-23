<?php
/**
 * WordPress Native Authentication
 *
 * Handles authentication using WordPress nonces and sessions instead of JWT.
 * This provides better WordPress integration and eliminates external dependencies.
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
 * Class WordPressAuth
 *
 * WordPress-native authentication using nonces and sessions.
 */
class WordPressAuth {

    /**
     * Token expiry time in seconds (15 minutes).
     *
     * @var int
     */
    private int $ttl = 900;

    /**
     * Nonce action prefix.
     *
     * @var string
     */
    private string $nonceAction = 'gary_ai_api';

    /**
     * Constructor.
     */
    public function __construct() {
        // Initialize session handling if needed
        add_action( 'init', [ $this, 'maybeStartSession' ] );
    }

    /**
     * Start session if not already started.
     */
    public function maybeStartSession(): void {
        if ( ! session_id() && ! headers_sent() ) {
            session_start();
        }
    }

    /**
     * Generate an authentication token using WordPress nonces.
     *
     * @param array $claims Additional claims to include in the token.
     * @return string Authentication token.
     */
    public function issueToken( array $claims = [] ): string {
        $userId = get_current_user_id();
        $sessionId = session_id() ?: wp_generate_password( 32, false );
        
        // Create nonce with user and session context
        $nonceAction = $this->nonceAction . '_' . $userId . '_' . $sessionId;
        $nonce = wp_create_nonce( $nonceAction );
        
        // Store token metadata in session or transient
        $tokenData = [
            'user_id' => $userId,
            'session_id' => $sessionId,
            'issued_at' => time(),
            'expires_at' => time() + $this->ttl,
            'claims' => $claims
        ];
        
        // Store in WordPress transient for persistence
        $tokenKey = 'gary_ai_token_' . md5( $nonce );
        set_transient( $tokenKey, $tokenData, $this->ttl );
        
        // Return base64 encoded token with nonce and metadata
        return base64_encode( json_encode( [
            'nonce' => $nonce,
            'token_key' => $tokenKey,
            'user_id' => $userId,
            'session_id' => $sessionId
        ] ) );
    }

    /**
     * Verify authentication token and return decoded payload.
     *
     * @param string $token Authentication token to verify.
     * @return array|null Decoded token data or null if invalid.
     */
    public function verifyToken( string $token ): ?array {
        try {
            // Decode the token
            $tokenData = json_decode( base64_decode( $token ), true );
            if ( ! $tokenData || ! isset( $tokenData['nonce'], $tokenData['token_key'] ) ) {
                return null;
            }
            
            // Get stored token metadata
            $storedData = get_transient( $tokenData['token_key'] );
            if ( ! $storedData ) {
                return null; // Token expired or doesn't exist
            }
            
            // Verify nonce
            $nonceAction = $this->nonceAction . '_' . $storedData['user_id'] . '_' . $storedData['session_id'];
            if ( ! wp_verify_nonce( $tokenData['nonce'], $nonceAction ) ) {
                return null; // Invalid nonce
            }
            
            // Check expiration
            if ( time() > $storedData['expires_at'] ) {
                delete_transient( $tokenData['token_key'] );
                return null; // Token expired
            }
            
            // Return valid token data
            return [
                'user_id' => $storedData['user_id'],
                'session_id' => $storedData['session_id'],
                'issued_at' => $storedData['issued_at'],
                'expires_at' => $storedData['expires_at'],
                'claims' => $storedData['claims'] ?? []
            ];
            
        } catch ( \Throwable $e ) {
            return null;
        }
    }

    /**
     * Revoke a token by removing it from storage.
     *
     * @param string $token Token to revoke.
     * @return bool True if token was revoked, false otherwise.
     */
    public function revokeToken( string $token ): bool {
        try {
            $tokenData = json_decode( base64_decode( $token ), true );
            if ( ! $tokenData || ! isset( $tokenData['token_key'] ) ) {
                return false;
            }
            
            return delete_transient( $tokenData['token_key'] );
            
        } catch ( \Throwable $e ) {
            return false;
        }
    }

    /**
     * Clean up expired tokens.
     */
    public function cleanupExpiredTokens(): void {
        // WordPress transients automatically expire, so no manual cleanup needed
        // This method is kept for compatibility and future enhancements
    }
}
