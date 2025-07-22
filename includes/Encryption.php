<?php
namespace GaryAI;

/**
 * AES-256-GCM Encryption helper (placeholder implementation).
 */
class Encryption {
    private string $key;

    public function __construct( string $key ) {
        if ( empty( $key ) || strlen( $key ) < 32 ) {
            throw new \InvalidArgumentException( 'Encryption key must be 32 bytes.' );
        }
        $this->key = $key;
    }

    public function encrypt( string $plainText ): string {
        $iv = random_bytes( 12 );
        $cipherText = openssl_encrypt( $plainText, 'aes-256-gcm', $this->key, OPENSSL_RAW_DATA, $iv, $tag );
        return base64_encode( $iv . $tag . $cipherText );
    }

    public function decrypt( string $encoded ): string {
        $raw = base64_decode( $encoded, true );
        $iv  = substr( $raw, 0, 12 );
        $tag = substr( $raw, 12, 16 );
        $cipherText = substr( $raw, 28 );
        return openssl_decrypt( $cipherText, 'aes-256-gcm', $this->key, OPENSSL_RAW_DATA, $iv, $tag );
    }
}
