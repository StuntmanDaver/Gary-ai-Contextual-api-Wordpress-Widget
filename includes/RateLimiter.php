<?php
namespace GaryAI;

/**
 * Simple token-bucket rate limiter (site‐wide, per IP).
 * Stores allowance in WP transients; upgrade to Redis if available (TODO).
 */
class RateLimiter {
    private int $capacity;
    private float $refillRate; // tokens per second

    public function __construct( int $capacity = 60, int $windowSeconds = 60 ) {
        $this->capacity   = $capacity;
        $this->refillRate = $capacity / $windowSeconds;
    }

    /**
     * Determine if the request identified by $ip may proceed.
     */
    public function isAllowed( string $ip ): bool {
        $key = 'gary_ai_rate_' . md5( $ip );
        $bucket = get_transient( $key );
        if ( ! is_array( $bucket ) ) {
            $bucket = [ 'tokens' => $this->capacity, 'ts' => microtime( true ) ];
        }
        // Refill based on elapsed time.
        $now   = microtime( true );
        $delta = $now - $bucket['ts'];
        $bucket['tokens'] = min( $this->capacity, $bucket['tokens'] + $delta * $this->refillRate );
        $bucket['ts'] = $now;

        if ( $bucket['tokens'] >= 1 ) {
            $bucket['tokens'] -= 1;
            set_transient( $key, $bucket, 2 * 60 );
            return true;
        }
        set_transient( $key, $bucket, 2 * 60 );
        return false;
    }
}
