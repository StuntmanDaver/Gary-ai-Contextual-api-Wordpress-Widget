<?php
namespace GaryAI;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * Simple JWT helper.
 * NOTE: placeholder implementation; add claims & storage in later phases.
 */
class JWTAuth {
    private string $secret;
    private string $algo = 'HS256';
    private int $ttl   = 900; // 15 min

    public function __construct( string $secret ) {
        $this->secret = $secret;
    }

    /**
     * Issue a short-lived token for the current site/user.
     */
    public function issueToken( array $claims = [] ): string {
        $payload = [
            'iss' => get_bloginfo( 'url' ),
            'iat' => time(),
            'exp' => time() + $this->ttl,
        ] + $claims;
        return JWT::encode( $payload, $this->secret, $this->algo );
    }

    /**
     * Verify token and return decoded payload or null.
     */
    public function verifyToken( string $jwt ): ?array {
        try {
            $decoded = JWT::decode( $jwt, new Key( $this->secret, $this->algo ) );
            return (array) $decoded;
        } catch ( \Throwable $e ) {
            return null;
        }
    }
}
