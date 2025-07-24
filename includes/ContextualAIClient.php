<?php
/**
 * Contextual AI Client - WordPress Native Implementation
 *
 * WordPress-native HTTP client for Contextual AI API without external dependencies.
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
 * Class ContextualAIClient
 *
 * WordPress-native implementation for Contextual AI API communication.
 */
class ContextualAIClient {

    /**
     * API key for authentication.
     *
     * @var string
     */
    private string $apiKey;

    /**
     * Base URL for API endpoints.
     *
     * @var string
     */
    private string $baseUrl;

    /**
     * Maximum retry attempts.
     *
     * @var int
     */
    private int $maxRetries;

    /**
     * Base delay for exponential backoff (in seconds).
     *
     * @var float
     */
    private float $baseDelay;

    /**
     * Constructor.
     *
     * @param string $apiKey   API key for authentication.
     * @param string $baseUrl  Base URL for API endpoints.
     * @param int    $maxRetries Maximum retry attempts.
     * @param float  $baseDelay Base delay for exponential backoff.
     */
    public function __construct( 
        string $apiKey, 
        string $baseUrl = 'https://api.contextual.ai/v1',
        int $maxRetries = 3,
        float $baseDelay = 1.0
    ) {
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim( $baseUrl, '/' );
        $this->maxRetries = $maxRetries;
        $this->baseDelay = $baseDelay;
    }

    /**
     * Query an agent with messages.
     *
     * @param string $agentId Agent ID to query.
     * @param array  $messages Array of message objects with 'content' and 'role' keys.
     * @param array  $options Additional options for the query.
     * @return array Response from the API.
     * @throws \Exception If the request fails after all retries.
     */
    public function queryAgent( string $agentId, array $messages, array $options = [] ): array {
        $endpoint = "/agents/{$agentId}/query";
        $payload = array_merge( [
            'messages' => $messages,
        ], $options );

        return $this->makeRequest( 'POST', $endpoint, $payload );
    }

    /**
     * Query an agent with a simple prompt (convenience method).
     *
     * @param string $agentId Agent ID to query.
     * @param string $prompt  User prompt/message.
     * @param array  $options Additional options for the query.
     * @return array Response from the API.
     * @throws \Exception If the request fails after all retries.
     */
    public function queryAgentWithPrompt( string $agentId, string $prompt, array $options = [] ): array {
        $messages = [
            [
                'role' => 'user',
                'content' => $prompt,
            ],
        ];

        return $this->queryAgent( $agentId, $messages, $options );
    }

    /**
     * Get agent metadata and configuration.
     *
     * @param string $agentId Agent ID.
     * @return array Agent data.
     * @throws \Exception If the request fails.
     */
    public function getAgent(string $agentId): array {
        $endpoint = "/agents/{$agentId}";
        return $this->makeRequest('GET', $endpoint);
    }

    /**
     * Test connection to API and specific agent.
     *
     * @param string $agentId Agent ID to test.
     * @return bool True if connection successful.
     */
    public function testConnection(string $agentId): bool {
        try {
            // A lightweight way to test the connection is to fetch the agent's metadata.
            // This validates the API key and confirms the agent exists.
            $response = $this->getAgent($agentId);
            
            // If the response contains an 'id', the connection is successful.
            return !empty($response) && isset($response['id']);
        } catch (\Exception $e) {
            // Log the specific error to help diagnose the issue.
            $this->logError('API connection test failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send message to AI (compatibility method)
     *
     * @param string $datastoreId Datastore ID.
     * @param string $message Message to send.
     * @param array $context Additional context.
     * @return array AI response.
     */
    public function sendMessage(string $datastoreId, string $message, array $context = []): array {
        $agentId = get_option('gary_ai_agent_id', '');
        if (empty($agentId)) {
            throw new \Exception('Agent ID not configured');
        }
        
        return $this->queryAgentWithPrompt($agentId, $message, $context);
    }

    /**
     * Make an HTTP request with retry logic using WordPress native functions.
     *
     * @param string $method  HTTP method.
     * @param string $endpoint API endpoint.
     * @param array  $payload  Request payload.
     * @return array Response data.
     * @throws \Exception If the request fails after all retries.
     */
    private function makeRequest( string $method, string $endpoint, array $payload = [] ): array {
        $attempt = 0;
        $lastError = null;

        while ( $attempt <= $this->maxRetries ) {
            try {
                $url = $this->baseUrl . $endpoint;
                
                // Prepare WordPress HTTP arguments
                $args = [
                    'method'  => strtoupper( $method ),
                    'timeout' => 30,
                    'headers' => [
                        'Authorization' => 'Bearer ' . $this->apiKey,
                        'Accept'        => 'application/json',
                        'Content-Type'  => 'application/json',
                        'User-Agent'    => 'Gary-AI-WordPress-Plugin/1.0.0',
                    ],
                ];

                // Add body for POST/PUT requests
                if ( in_array( strtoupper( $method ), [ 'POST', 'PUT', 'PATCH' ] ) && ! empty( $payload ) ) {
                    $args['body'] = wp_json_encode( $payload );
                }

                // Make the request using WordPress HTTP API
                $response = wp_remote_request( $url, $args );

                // Check for WordPress HTTP errors
                if ( is_wp_error( $response ) ) {
                    throw new \Exception( 'HTTP request failed: ' . $response->get_error_message() );
                }

                $status_code = wp_remote_retrieve_response_code( $response );
                $body = wp_remote_retrieve_body( $response );

                // Handle HTTP error status codes
                if ( $status_code >= 400 ) {
                    $error_message = "HTTP {$status_code}";
                    if ( ! empty( $body ) ) {
                        $error_data = json_decode( $body, true );
                        if ( isset( $error_data['error'] ) ) {
                            $error_message .= ': ' . $error_data['error'];
                        }
                    }
                    throw new \Exception( $error_message );
                }

                // Parse JSON response
                $data = json_decode( $body, true );
                if ( json_last_error() !== JSON_ERROR_NONE ) {
                    throw new \Exception( 'Invalid JSON response: ' . json_last_error_msg() );
                }

                return $data;

            } catch ( \Exception $e ) {
                $lastError = $e;
                $attempt++;

                if ( $attempt <= $this->maxRetries ) {
                    // Exponential backoff
                    $delay = $this->baseDelay * pow( 2, $attempt - 1 );
                    sleep( (int) $delay );
                    
                    $this->logError( "Attempt {$attempt} failed: " . $e->getMessage() . ". Retrying in {$delay}s..." );
                } else {
                    $this->logError( "All retry attempts exhausted. Final error: " . $e->getMessage() );
                }
            }
        }

        // All retries exhausted
        $errorMessage = 'Request failed after ' . ($this->maxRetries + 1) . ' attempts';
        if ( $lastError ) {
            $errorMessage .= ': ' . $lastError->getMessage();
        }
        
        throw new \Exception( $errorMessage );
    }

    /**
     * Log error messages using WordPress logging.
     *
     * @param string $message Error message to log.
     */
    private function logError( string $message ): void {
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            error_log( '[Gary AI] ' . $message );
        }
    }

    /**
     * Validate API key format.
     *
     * @param string $apiKey API key to validate.
     * @return bool True if valid format.
     */
    public function validateApiKey( string $apiKey ): bool {
        // Basic validation - adjust based on Contextual AI's key format
        return ! empty( $apiKey ) && strlen( $apiKey ) >= 10;
    }
}
