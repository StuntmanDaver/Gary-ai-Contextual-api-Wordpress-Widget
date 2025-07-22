<?php
namespace GaryAI;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

/**
 * Wrapper around Contextual AI REST endpoints.
 *
 * NOTE: This placeholder will be fleshed out in later development phases.
 */
class ContextualAIClient {
    /** @var Client */
    private Client $http;

    /** @var string */
    private string $apiKey;

    /** @var string */
    private string $baseUrl;

    public function __construct( string $apiKey, string $baseUrl = 'https://api.contextual.ai' ) {
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim( $baseUrl, '/' );
        $this->http    = new Client( [
            'base_uri' => $this->baseUrl,
            'timeout'  => 10,
            'headers'  => [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept'        => 'application/json',
            ],
        ] );
    }

    /**
     * Example method: query agent (placeholder).
     */
    public function queryAgent( string $agentId, string $prompt, array $options = [] ): array {
        try {
            $response = $this->http->post( "/agents/{$agentId}/query", [
                'json' => [ 'prompt' => $prompt ] + $options,
            ] );
            return json_decode( (string) $response->getBody(), true ) ?? [];
        } catch ( GuzzleException $e ) {
            // Log & rethrow for now.
            error_log( '[Gary AI] ContextualAIClient error: ' . $e->getMessage() );
            throw $e;
        }
    }
}
