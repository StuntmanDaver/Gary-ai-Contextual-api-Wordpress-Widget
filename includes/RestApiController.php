<?php
/**
 * REST API Controller
 *
 * Handles REST API endpoints for Gary AI plugin.
 *
 * @package GaryAI
 * @since   1.0.0
 */

namespace GaryAI;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class RestApiController
 *
 * Manages REST API endpoints and request handling.
 */
class RestApiController {

    /**
     * API namespace.
     */
    const NAMESPACE = 'gary-ai/v1';

    /**
     * Service instances.
     */
    private WordPressAuth $wpAuth;
    private ContextualAIClient $aiClient;
    private ConversationManager $conversationManager;
    private AnalyticsService $analyticsService;
    private RateLimiter $rateLimiter;
    private Encryption $encryption;
    private Logger $logger;

    /**
     * Constructor.
     */
    public function __construct() {
        $this->initializeServices();
        add_action( 'rest_api_init', [ $this, 'registerRoutes' ] );
    }

    /**
     * Initialize service instances.
     */
    private function initializeServices(): void {
        $encryptionKey = defined('GARY_AI_ENCRYPTION_KEY') ? GARY_AI_ENCRYPTION_KEY : 'dev-32-byte-encryption-key-test123';
        $this->encryption = new Encryption($encryptionKey);
        $this->wpAuth = new WordPressAuth();
        $this->logger = new Logger();
        $this->conversationManager = new ConversationManager( $this->encryption );
        $this->analyticsService = new AnalyticsService();
        $this->rateLimiter = new RateLimiter();

        // Initialize AI client if API key is available
        $apiKey = get_option( 'gary_ai_api_key', '' );
        if ( ! empty( $apiKey ) ) {
            $this->aiClient = new ContextualAIClient( $apiKey );
        }
    }

    /**
     * Register REST API routes.
     */
    public function registerRoutes(): void {
        // Token endpoint
        register_rest_route( self::NAMESPACE, '/token', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'getToken' ],
            'permission_callback' => [ $this, 'checkRateLimit' ],
        ] );

        // Chat endpoint
        register_rest_route( self::NAMESPACE, '/chat', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'handleChat' ],
            'permission_callback' => [ $this, 'validateChatRequest' ],
            'args'                => [
                'message' => [
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => [ $this, 'validateMessage' ],
                ],
                'conversation_id' => [
                    'required'          => false,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ],
                'session_id' => [
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ] );

        // Settings endpoints
        register_rest_route( self::NAMESPACE, '/settings', [
            [
                'methods'             => 'GET',
                'callback'            => [ $this, 'getSettings' ],
                'permission_callback' => [ $this, 'checkAdminPermission' ],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [ $this, 'updateSettings' ],
                'permission_callback' => [ $this, 'checkAdminPermission' ],
                'args'                => $this->getSettingsSchema(),
            ],
        ] );

        // Conversation endpoints
        register_rest_route( self::NAMESPACE, '/conversations/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'getConversation' ],
            'permission_callback' => [ $this, 'validateConversationAccess' ],
            'args'                => [
                'id' => [
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ] );

        // Health check endpoint
        register_rest_route( self::NAMESPACE, '/health', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'healthCheck' ],
            'permission_callback' => '__return_true',
        ] );
    }

    /**
     * Get authentication token endpoint.
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error Response object or error.
     */
    public function getToken( WP_REST_Request $request ) {
        $startTime = microtime( true );
        $clientIp = $this->getClientIpAddress();
        $userAgent = $request->get_header( 'User-Agent' ) ?: 'unknown';
        
        $this->logger->info( 'Token request initiated', [
            'ip_address' => $clientIp,
            'user_agent' => $userAgent,
            'endpoint' => '/token'
        ] );

        try {
            // Validate request context
            $sessionId = $this->getOrCreateSessionId( $request );
            $userId = get_current_user_id() ?: null;
            
            if ( empty( $sessionId ) ) {
                $this->logger->warning( 'Token request failed: invalid session', [
                    'ip_address' => $clientIp,
                    'user_id' => $userId
                ] );
                return new WP_Error( 'invalid_session', 'Invalid session identifier', [ 'status' => 400 ] );
            }

            // Issue token with comprehensive claims
            $tokenClaims = [
                'user_id'    => $userId,
                'session_id' => $sessionId,
                'ip_address' => $clientIp,
                'user_agent' => $userAgent,
                'issued_at'  => time()
            ];
            
            $token = $this->wpAuth->issueToken( $tokenClaims );
            
            if ( empty( $token ) ) {
                $this->logger->error( 'Token generation failed: empty token returned', [
                    'user_id' => $userId,
                    'session_id' => $sessionId,
                    'ip_address' => $clientIp
                ] );
                return new WP_Error( 'token_generation_failed', 'Failed to generate authentication token', [ 'status' => 500 ] );
            }

            // Track successful token issuance
            $this->analyticsService->track( 'token_issued', [
                'user_id'    => $userId,
                'session_id' => $sessionId,
                'ip_address' => $clientIp,
                'response_time' => round( ( microtime( true ) - $startTime ) * 1000, 2 )
            ], $userId, $sessionId );
            
            $this->logger->info( 'Token issued successfully', [
                'user_id' => $userId,
                'session_id' => $sessionId,
                'ip_address' => $clientIp,
                'response_time_ms' => round( ( microtime( true ) - $startTime ) * 1000, 2 )
            ] );

            return new WP_REST_Response( [
                'success' => true,
                'data'    => [
                    'token'      => $token,
                    'expires_in' => 900, // 15 minutes
                    'session_id' => $sessionId,
                    'issued_at'  => time(),
                    'user_id'    => $userId
                ],
                'meta' => [
                    'response_time' => round( ( microtime( true ) - $startTime ) * 1000, 2 )
                ]
            ], 200 );

        } catch ( \Throwable $e ) {
            $this->logger->error( 'Token generation exception', [
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'ip_address' => $clientIp,
                'user_id' => get_current_user_id() ?: null,
                'response_time_ms' => round( ( microtime( true ) - $startTime ) * 1000, 2 )
            ] );
            
            return new WP_Error( 'token_generation_failed', 'Internal server error during token generation', [ 'status' => 500 ] );
        }
    }

    /**
     * Handle chat endpoint.
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error Response object or error.
     */
    public function handleChat( WP_REST_Request $request ) {
        $startTime = microtime( true );
        $clientIp = $this->getClientIpAddress();
        $userAgent = $request->get_header( 'User-Agent' ) ?: 'unknown';
        
        // Initialize variables for logging context
        $message = null;
        $conversationId = null;
        $sessionId = null;
        $userId = null;
        
        $this->logger->info( 'Chat request initiated', [
            'ip_address' => $clientIp,
            'user_agent' => $userAgent,
            'endpoint' => '/chat'
        ] );

        try {
            // Validate AI client configuration
            if ( ! isset( $this->aiClient ) ) {
                $this->logger->error( 'Chat request failed: AI client not configured', [
                    'ip_address' => $clientIp,
                    'user_id' => get_current_user_id() ?: null
                ] );
                return new WP_Error( 'api_not_configured', 'Contextual AI API key not configured', [ 'status' => 500 ] );
            }

            // Extract and validate request parameters
            $message = $request->get_param( 'message' );
            $conversationId = $request->get_param( 'conversation_id' );
            $sessionId = $this->getOrCreateSessionId( $request );
            $userId = get_current_user_id() ?: null;
            
            // Validate message content
            if ( empty( trim( $message ) ) ) {
                $this->logger->warning( 'Chat request failed: empty message', [
                    'ip_address' => $clientIp,
                    'user_id' => $userId,
                    'session_id' => $sessionId
                ] );
                return new WP_Error( 'invalid_message', 'Message cannot be empty', [ 'status' => 400 ] );
            }
            
            // Validate session
            if ( empty( $sessionId ) ) {
                $this->logger->warning( 'Chat request failed: invalid session', [
                    'ip_address' => $clientIp,
                    'user_id' => $userId
                ] );
                return new WP_Error( 'invalid_session', 'Invalid session identifier', [ 'status' => 400 ] );
            }

            $this->logger->info( 'Chat request validated', [
                'user_id' => $userId,
                'session_id' => $sessionId,
                'conversation_id' => $conversationId,
                'message_length' => strlen( $message ),
                'ip_address' => $clientIp
            ] );

            // Get or create conversation
            if ( $conversationId ) {
                $conversation = $this->conversationManager->getConversation( $conversationId );
                if ( ! $conversation ) {
                    $this->logger->warning( 'Chat request failed: conversation not found', [
                        'conversation_id' => $conversationId,
                        'user_id' => $userId,
                        'session_id' => $sessionId,
                        'ip_address' => $clientIp
                    ] );
                    return new WP_Error( 'conversation_not_found', 'Conversation not found', [ 'status' => 404 ] );
                }
                $this->logger->debug( 'Using existing conversation', [
                    'conversation_id' => $conversationId,
                    'user_id' => $userId
                ] );
            } else {
                $conversationId = $this->conversationManager->createConversation( $userId, $sessionId );
                if ( ! $conversationId ) {
                    $this->logger->error( 'Failed to create new conversation', [
                        'user_id' => $userId,
                        'session_id' => $sessionId,
                        'ip_address' => $clientIp
                    ] );
                    return new WP_Error( 'conversation_creation_failed', 'Failed to create conversation', [ 'status' => 500 ] );
                }
                $this->analyticsService->trackConversationStart( $conversationId, $userId, $sessionId );
                $this->logger->info( 'New conversation created', [
                    'conversation_id' => $conversationId,
                    'user_id' => $userId,
                    'session_id' => $sessionId
                ] );
            }

            // Add user message to conversation
            $userMessageId = $this->conversationManager->addMessage( $conversationId, 'user', $message );
            if ( ! $userMessageId ) {
                $this->logger->error( 'Failed to save user message', [
                    'conversation_id' => $conversationId,
                    'user_id' => $userId,
                    'message_length' => strlen( $message )
                ] );
                return new WP_Error( 'message_save_failed', 'Failed to save user message', [ 'status' => 500 ] );
            }
            
            $this->analyticsService->trackMessageSent( $conversationId, $userMessageId, 'user', 0, $userId, $sessionId );
            $this->logger->debug( 'User message saved', [
                'conversation_id' => $conversationId,
                'message_id' => $userMessageId,
                'user_id' => $userId
            ] );

            // Get datastore ID from settings
            $datastoreId = get_option( 'gary_ai_datastore_id', '' );
            if ( empty( $datastoreId ) ) {
                $this->logger->error( 'Chat request failed: datastore not configured', [
                    'conversation_id' => $conversationId,
                    'user_id' => $userId,
                    'ip_address' => $clientIp
                ] );
                return new WP_Error( 'datastore_not_configured', 'Datastore not configured', [ 'status' => 500 ] );
            }

            // Send message to Contextual AI
            $aiRequestStart = microtime( true );
            $this->logger->debug( 'Sending request to Contextual AI', [
                'datastore_id' => $datastoreId,
                'conversation_id' => $conversationId,
                'message_length' => strlen( $message )
            ] );
            
            $aiResponse = $this->aiClient->sendMessage( $datastoreId, $message, [
                'conversation_id' => $conversationId,
                'user_id'         => $userId,
                'session_id'      => $sessionId,
                'ip_address'      => $clientIp
            ] );
            
            $aiRequestTime = round( ( microtime( true ) - $aiRequestStart ) * 1000, 2 );
            
            if ( empty( $aiResponse ) ) {
                $this->logger->error( 'Empty response from Contextual AI', [
                    'conversation_id' => $conversationId,
                    'datastore_id' => $datastoreId,
                    'request_time_ms' => $aiRequestTime
                ] );
                return new WP_Error( 'ai_response_empty', 'No response received from AI service', [ 'status' => 502 ] );
            }

            // Extract and validate response content
            $responseContent = $aiResponse['message'] ?? $aiResponse['response'] ?? $aiResponse['content'] ?? null;
            if ( empty( $responseContent ) ) {
                $this->logger->error( 'Invalid response format from Contextual AI', [
                    'conversation_id' => $conversationId,
                    'response_keys' => array_keys( $aiResponse ),
                    'request_time_ms' => $aiRequestTime
                ] );
                return new WP_Error( 'ai_response_invalid', 'Invalid response format from AI service', [ 'status' => 502 ] );
            }
            
            $tokenCount = $aiResponse['token_count'] ?? $aiResponse['tokens'] ?? 0;
            
            $this->logger->info( 'Received response from Contextual AI', [
                'conversation_id' => $conversationId,
                'response_length' => strlen( $responseContent ),
                'token_count' => $tokenCount,
                'request_time_ms' => $aiRequestTime
            ] );

            // Add AI response to conversation
            $aiMessageId = $this->conversationManager->addMessage( 
                $conversationId, 
                'assistant', 
                $responseContent,
                $aiResponse,
                $tokenCount
            );
            
            if ( ! $aiMessageId ) {
                $this->logger->error( 'Failed to save AI response message', [
                    'conversation_id' => $conversationId,
                    'response_length' => strlen( $responseContent ),
                    'token_count' => $tokenCount
                ] );
                return new WP_Error( 'ai_message_save_failed', 'Failed to save AI response', [ 'status' => 500 ] );
            }

            $this->analyticsService->trackMessageSent( $conversationId, $aiMessageId, 'assistant', $tokenCount, $userId, $sessionId );
            
            $totalResponseTime = round( ( microtime( true ) - $startTime ) * 1000, 2 );
            
            $this->logger->info( 'Chat request completed successfully', [
                'conversation_id' => $conversationId,
                'user_message_id' => $userMessageId,
                'ai_message_id' => $aiMessageId,
                'token_count' => $tokenCount,
                'ai_request_time_ms' => $aiRequestTime,
                'total_response_time_ms' => $totalResponseTime,
                'user_id' => $userId,
                'session_id' => $sessionId
            ] );

            return new WP_REST_Response( [
                'success' => true,
                'data'    => [
                    'conversation_id' => $conversationId,
                    'message_id'      => $aiMessageId,
                    'response'        => $responseContent,
                    'token_count'     => $tokenCount,
                    'session_id'      => $sessionId,
                    'user_id'         => $userId
                ],
                'meta' => [
                    'response_time' => $totalResponseTime,
                    'ai_request_time' => $aiRequestTime
                ]
            ], 200 );

        } catch ( \Throwable $e ) {
            $totalResponseTime = round( ( microtime( true ) - $startTime ) * 1000, 2 );
            
            $this->logger->error( 'Chat request exception', [
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'session_id' => $sessionId,
                'ip_address' => $clientIp,
                'response_time_ms' => $totalResponseTime
            ] );
            
            $this->analyticsService->trackApiError( 'chat_error', $e->getMessage(), [
                'conversation_id' => $conversationId,
                'message'         => $message ? substr( $message, 0, 100 ) : '',
                'error_type'      => get_class( $e ),
                'response_time'   => $totalResponseTime
            ], $userId, $sessionId );

            return new WP_Error( 'chat_failed', 'Internal server error during chat processing', [ 'status' => 500 ] );
        }
    }

    /**
     * Get settings endpoint.
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response Response object.
     */
    public function getSettings( WP_REST_Request $request ): WP_REST_Response {
        $startTime = microtime( true );
        $clientIp = $this->getClientIpAddress();
        $userId = get_current_user_id() ?: null;
        
        $this->logger->info( 'Settings request initiated', [
            'ip_address' => $clientIp,
            'user_id' => $userId,
            'endpoint' => '/settings'
        ] );

        try {
            $settings = [
                'api_key_configured'           => ! empty( get_option( 'gary_ai_api_key', '' ) ),
                'datastore_id'                 => get_option( 'gary_ai_datastore_id', '' ),
                'widget_enabled'               => (bool) get_option( 'gary_ai_widget_enabled', true ),
                'save_conversations'           => (bool) get_option( 'gary_ai_save_conversations', true ),
                'rate_limit_enabled'           => (bool) get_option( 'gary_ai_rate_limit_enabled', true ),
                'rate_limit_requests_per_minute' => (int) get_option( 'gary_ai_rate_limit_requests_per_minute', 60 ),
                'analytics_enabled'            => (bool) get_option( 'gary_ai_analytics_enabled', true ),
                'widget_position'              => get_option( 'gary_ai_widget_position', 'bottom-right' ),
                'widget_theme'                 => get_option( 'gary_ai_widget_theme', 'light' ),
                'max_conversation_length'      => (int) get_option( 'gary_ai_max_conversation_length', 50 ),
                'session_timeout'              => (int) get_option( 'gary_ai_session_timeout', 3600 ),
            ];
            
            $responseTime = round( ( microtime( true ) - $startTime ) * 1000, 2 );
            
            $this->logger->info( 'Settings retrieved successfully', [
                'user_id' => $userId,
                'ip_address' => $clientIp,
                'settings_count' => count( $settings ),
                'api_key_configured' => $settings['api_key_configured'],
                'response_time_ms' => $responseTime
            ] );

            return new WP_REST_Response( [
                'success' => true,
                'data'    => $settings,
                'meta' => [
                    'response_time' => $responseTime
                ]
            ], 200 );
            
        } catch ( \Throwable $e ) {
            $responseTime = round( ( microtime( true ) - $startTime ) * 1000, 2 );
            
            $this->logger->error( 'Settings request exception', [
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'user_id' => $userId,
                'ip_address' => $clientIp,
                'response_time_ms' => $responseTime
            ] );
            
            return new WP_REST_Response( [
                'success' => false,
                'error' => 'Internal server error while retrieving settings'
            ], 500 );
        }
    }

    /**
     * Update settings endpoint.
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error Response object or error.
     */
    public function updateSettings( WP_REST_Request $request ) {
        $startTime = microtime( true );
        $clientIp = $this->getClientIpAddress();
        $userId = get_current_user_id() ?: null;
        
        $this->logger->info( 'Settings update request initiated', [
            'ip_address' => $clientIp,
            'user_id' => $userId,
            'endpoint' => '/settings'
        ] );

        try {
            // Validate user permissions
            if ( ! current_user_can( 'manage_options' ) ) {
                $this->logger->warning( 'Settings update failed: insufficient permissions', [
                    'user_id' => $userId,
                    'ip_address' => $clientIp
                ] );
                return new WP_Error( 'insufficient_permissions', 'You do not have permission to update settings', [ 'status' => 403 ] );
            }
            
            $settings = $request->get_json_params();
            if ( empty( $settings ) || ! is_array( $settings ) ) {
                $this->logger->warning( 'Settings update failed: invalid request data', [
                    'user_id' => $userId,
                    'ip_address' => $clientIp,
                    'data_type' => gettype( $settings )
                ] );
                return new WP_Error( 'invalid_request', 'Invalid settings data provided', [ 'status' => 400 ] );
            }
            
            $updated = [];
            $failed = [];

            $allowedSettings = [
                'gary_ai_api_key'                        => 'api_key',
                'gary_ai_datastore_id'                   => 'datastore_id',
                'gary_ai_widget_enabled'                 => 'widget_enabled',
                'gary_ai_save_conversations'             => 'save_conversations',
                'gary_ai_rate_limit_enabled'             => 'rate_limit_enabled',
                'gary_ai_rate_limit_requests_per_minute' => 'rate_limit_requests_per_minute',
                'gary_ai_analytics_enabled'              => 'analytics_enabled',
                'gary_ai_widget_position'                => 'widget_position',
                'gary_ai_widget_theme'                   => 'widget_theme',
                'gary_ai_max_conversation_length'        => 'max_conversation_length',
                'gary_ai_session_timeout'                => 'session_timeout',
            ];
            
            $this->logger->debug( 'Processing settings update', [
                'user_id' => $userId,
                'settings_provided' => array_keys( $settings ),
                'settings_count' => count( $settings )
            ] );

            foreach ( $allowedSettings as $optionKey => $requestKey ) {
                if ( isset( $settings[ $requestKey ] ) ) {
                    try {
                        $value = $settings[ $requestKey ];
                        $originalValue = $value;
                        
                        // Validate and sanitize specific settings
                        if ( 'rate_limit_requests_per_minute' === $requestKey ) {
                            $value = max( 1, min( 1000, (int) $value ) ); // Limit between 1-1000
                        } elseif ( 'max_conversation_length' === $requestKey ) {
                            $value = max( 1, min( 200, (int) $value ) ); // Limit between 1-200
                        } elseif ( 'session_timeout' === $requestKey ) {
                            $value = max( 300, min( 86400, (int) $value ) ); // Limit between 5 minutes - 24 hours
                        } elseif ( 'widget_position' === $requestKey ) {
                            $validPositions = [ 'bottom-right', 'bottom-left', 'top-right', 'top-left' ];
                            if ( ! in_array( $value, $validPositions, true ) ) {
                                $value = 'bottom-right';
                            }
                        } elseif ( 'widget_theme' === $requestKey ) {
                            $validThemes = [ 'light', 'dark', 'auto' ];
                            if ( ! in_array( $value, $validThemes, true ) ) {
                                $value = 'light';
                            }
                        }
                        
                        // Encrypt API key if provided
                        if ( 'api_key' === $requestKey && ! empty( $value ) ) {
                            if ( ! isset( $this->encryption ) ) {
                                $this->logger->error( 'Encryption service not available for API key', [
                                    'user_id' => $userId
                                ] );
                                $failed[ $requestKey ] = 'Encryption service unavailable';
                                continue;
                            }
                            $value = $this->encryption->encrypt( $value );
                        }
                        
                        $updateResult = update_option( $optionKey, $value );
                        if ( $updateResult !== false ) {
                            $updated[ $requestKey ] = true;
                            
                            $this->logger->debug( 'Setting updated successfully', [
                                'setting' => $requestKey,
                                'user_id' => $userId,
                                'value_changed' => $originalValue !== get_option( $optionKey )
                            ] );
                        } else {
                            $failed[ $requestKey ] = 'Database update failed';
                            $this->logger->warning( 'Setting update failed', [
                                'setting' => $requestKey,
                                'user_id' => $userId,
                                'reason' => 'Database update returned false'
                            ] );
                        }
                        
                    } catch ( \Throwable $settingError ) {
                        $failed[ $requestKey ] = $settingError->getMessage();
                        $this->logger->error( 'Setting update exception', [
                            'setting' => $requestKey,
                            'error_message' => $settingError->getMessage(),
                            'user_id' => $userId
                        ] );
                    }
                }
            }
            
            // Check for unknown settings
            $unknownSettings = array_diff( array_keys( $settings ), array_values( $allowedSettings ) );
            if ( ! empty( $unknownSettings ) ) {
                $this->logger->warning( 'Unknown settings provided', [
                    'unknown_settings' => $unknownSettings,
                    'user_id' => $userId
                ] );
            }

            // Track settings update
            if ( ! empty( $updated ) ) {
                $this->analyticsService->track( 'settings_updated', [
                    'updated_fields' => array_keys( $updated ),
                    'failed_fields' => array_keys( $failed ),
                    'unknown_fields' => $unknownSettings
                ], $userId, '' );
            }
            
            $responseTime = round( ( microtime( true ) - $startTime ) * 1000, 2 );
            
            $this->logger->info( 'Settings update completed', [
                'user_id' => $userId,
                'ip_address' => $clientIp,
                'updated_count' => count( $updated ),
                'failed_count' => count( $failed ),
                'response_time_ms' => $responseTime
            ] );

            $responseData = [
                'success' => true,
                'data'    => [
                    'updated' => $updated,
                    'message' => 'Settings updated successfully',
                ],
                'meta' => [
                    'response_time' => $responseTime
                ]
            ];
            
            if ( ! empty( $failed ) ) {
                $responseData['data']['failed'] = $failed;
                $responseData['data']['message'] = 'Settings partially updated with some failures';
            }
            
            if ( ! empty( $unknownSettings ) ) {
                $responseData['data']['ignored'] = $unknownSettings;
            }

            return new WP_REST_Response( $responseData, 200 );

        } catch ( \Throwable $e ) {
            $responseTime = round( ( microtime( true ) - $startTime ) * 1000, 2 );
            
            $this->logger->error( 'Settings update exception', [
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'user_id' => $userId,
                'ip_address' => $clientIp,
                'response_time_ms' => $responseTime
            ] );
            
            $this->analyticsService->trackApiError( 'settings_update_error', $e->getMessage(), [
                'error_type' => get_class( $e ),
                'response_time' => $responseTime
            ], $userId, '' );
            
            return new WP_Error( 'settings_update_failed', 'Internal server error during settings update', [ 'status' => 500 ] );
        }
    }

    /**
     * Get conversation endpoint.
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error Response object or error.
     */
    public function getConversation( WP_REST_Request $request ) {
        $startTime = microtime( true );
        $clientIp = $this->getClientIpAddress();
        $userId = get_current_user_id() ?: null;
        $conversationId = $request->get_param( 'id' );
        
        $this->logger->info( 'Conversation request initiated', [
            'ip_address' => $clientIp,
            'user_id' => $userId,
            'conversation_id' => $conversationId,
            'endpoint' => '/conversations/{id}'
        ] );

        try {
            // Validate conversation ID
            if ( empty( $conversationId ) ) {
                $this->logger->warning( 'Conversation request failed: missing conversation ID', [
                    'ip_address' => $clientIp,
                    'user_id' => $userId
                ] );
                return new WP_Error( 'missing_conversation_id', 'Conversation ID is required', [ 'status' => 400 ] );
            }
            
            // Validate conversation ID format (assuming UUID or similar)
            if ( ! preg_match( '/^[a-zA-Z0-9\-_]{8,}$/', $conversationId ) ) {
                $this->logger->warning( 'Conversation request failed: invalid conversation ID format', [
                    'conversation_id' => $conversationId,
                    'ip_address' => $clientIp,
                    'user_id' => $userId
                ] );
                return new WP_Error( 'invalid_conversation_id', 'Invalid conversation ID format', [ 'status' => 400 ] );
            }
        
            $conversation = $this->conversationManager->getConversation( $conversationId );
            if ( ! $conversation ) {
                $this->logger->warning( 'Conversation not found', [
                    'conversation_id' => $conversationId,
                    'ip_address' => $clientIp,
                    'user_id' => $userId
                ] );
                return new WP_Error( 'conversation_not_found', 'Conversation not found', [ 'status' => 404 ] );
            }
            
            // Check user permissions for conversation access
            if ( $userId && isset( $conversation['user_id'] ) && $conversation['user_id'] !== $userId && ! current_user_can( 'manage_options' ) ) {
                $this->logger->warning( 'Conversation access denied: insufficient permissions', [
                    'conversation_id' => $conversationId,
                    'conversation_user_id' => $conversation['user_id'],
                    'requesting_user_id' => $userId,
                    'ip_address' => $clientIp
                ] );
                return new WP_Error( 'access_denied', 'You do not have permission to access this conversation', [ 'status' => 403 ] );
            }
            
            $this->logger->debug( 'Conversation found, retrieving messages and stats', [
                'conversation_id' => $conversationId,
                'user_id' => $userId
            ] );

            $messages = $this->conversationManager->getMessages( $conversationId );
            if ( $messages === false ) {
                $this->logger->error( 'Failed to retrieve conversation messages', [
                    'conversation_id' => $conversationId,
                    'user_id' => $userId
                ] );
                return new WP_Error( 'messages_retrieval_failed', 'Failed to retrieve conversation messages', [ 'status' => 500 ] );
            }
            
            $stats = $this->conversationManager->getConversationStats( $conversationId );
            if ( $stats === false ) {
                $this->logger->warning( 'Failed to retrieve conversation stats', [
                    'conversation_id' => $conversationId,
                    'user_id' => $userId
                ] );
                // Stats failure is not critical, set empty stats
                $stats = [
                    'message_count' => is_array( $messages ) ? count( $messages ) : 0,
                    'total_tokens' => 0,
                    'created_at' => $conversation['created_at'] ?? null,
                    'updated_at' => $conversation['updated_at'] ?? null
                ];
            }
            
            $responseTime = round( ( microtime( true ) - $startTime ) * 1000, 2 );
            
            $this->logger->info( 'Conversation retrieved successfully', [
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'ip_address' => $clientIp,
                'message_count' => is_array( $messages ) ? count( $messages ) : 0,
                'response_time_ms' => $responseTime
            ] );

            return new WP_REST_Response( [
                'success' => true,
                'data'    => [
                    'conversation' => $conversation,
                    'messages'     => $messages,
                    'stats'        => $stats,
                ],
                'meta' => [
                    'response_time' => $responseTime
                ]
            ], 200 );
            
        } catch ( \Throwable $e ) {
            $responseTime = round( ( microtime( true ) - $startTime ) * 1000, 2 );
            
            $this->logger->error( 'Conversation request exception', [
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'ip_address' => $clientIp,
                'response_time_ms' => $responseTime
            ] );
            
            $this->analyticsService->trackApiError( 'conversation_retrieval_error', $e->getMessage(), [
                'conversation_id' => $conversationId,
                'error_type' => get_class( $e ),
                'response_time' => $responseTime
            ], $userId, '' );
            
            return new WP_Error( 'conversation_retrieval_failed', 'Internal server error during conversation retrieval', [ 'status' => 500 ] );
        }
    }

    /**
     * Health check endpoint.
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response Response object.
     */
    public function healthCheck( WP_REST_Request $request ): WP_REST_Response {
        $startTime = microtime( true );
        $clientIp = $this->getClientIpAddress();
        
        $this->logger->debug( 'Health check request initiated', [
            'ip_address' => $clientIp,
            'endpoint' => '/health'
        ] );

        try {
            $services = [];
            $overallHealthy = true;
            
            // Check database health
            try {
                $dbHealth = $this->checkDatabaseHealth();
                $services['database'] = $dbHealth;
                if ( ! $dbHealth['healthy'] ) {
                    $overallHealthy = false;
                    $this->logger->warning( 'Database health check failed', $dbHealth );
                }
            } catch ( \Throwable $e ) {
                $services['database'] = [
                    'healthy' => false,
                    'error' => 'Health check exception: ' . $e->getMessage()
                ];
                $overallHealthy = false;
                $this->logger->error( 'Database health check exception', [
                    'error_message' => $e->getMessage(),
                    'error_file' => $e->getFile(),
                    'error_line' => $e->getLine()
                ] );
            }
            
            // Check AI client health
            try {
                $aiHealth = $this->checkAiClientHealth();
                $services['ai_client'] = $aiHealth;
                if ( ! $aiHealth['healthy'] ) {
                    $overallHealthy = false;
                    $this->logger->warning( 'AI client health check failed', $aiHealth );
                }
            } catch ( \Throwable $e ) {
                $services['ai_client'] = [
                    'healthy' => false,
                    'error' => 'Health check exception: ' . $e->getMessage()
                ];
                $overallHealthy = false;
                $this->logger->error( 'AI client health check exception', [
                    'error_message' => $e->getMessage(),
                    'error_file' => $e->getFile(),
                    'error_line' => $e->getLine()
                ] );
            }
            
            // Check rate limiter health
            try {
                $rateLimiterHealth = $this->checkRateLimiterHealth();
                $services['rate_limiter'] = $rateLimiterHealth;
                if ( ! $rateLimiterHealth['healthy'] ) {
                    $overallHealthy = false;
                    $this->logger->warning( 'Rate limiter health check failed', $rateLimiterHealth );
                }
            } catch ( \Throwable $e ) {
                $services['rate_limiter'] = [
                    'healthy' => false,
                    'error' => 'Health check exception: ' . $e->getMessage()
                ];
                $overallHealthy = false;
                $this->logger->error( 'Rate limiter health check exception', [
                    'error_message' => $e->getMessage(),
                    'error_file' => $e->getFile(),
                    'error_line' => $e->getLine()
                ] );
            }
            
            $responseTime = round( ( microtime( true ) - $startTime ) * 1000, 2 );
            
            $status = [
                'status'    => $overallHealthy ? 'healthy' : 'unhealthy',
                'timestamp' => current_time( 'mysql' ),
                'version'   => GARY_AI_VERSION,
                'services'  => $services,
                'response_time' => $responseTime
            ];
            
            $httpStatus = $overallHealthy ? 200 : 503;
            
            $logLevel = $overallHealthy ? 'info' : 'warning';
            $this->logger->log( $logLevel, 'Health check completed', [
                'overall_status' => $status['status'],
                'services_healthy' => array_map( function( $service ) {
                    return $service['healthy'] ?? false;
                }, $services ),
                'response_time_ms' => $responseTime,
                'http_status' => $httpStatus
            ] );

            return new WP_REST_Response( $status, $httpStatus );
            
        } catch ( \Throwable $e ) {
            $responseTime = round( ( microtime( true ) - $startTime ) * 1000, 2 );
            
            $this->logger->error( 'Health check exception', [
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'response_time_ms' => $responseTime
            ] );
            
            return new WP_REST_Response( [
                'status' => 'error',
                'timestamp' => current_time( 'mysql' ),
                'version' => GARY_AI_VERSION,
                'error' => 'Health check failed due to internal error',
                'response_time' => $responseTime
            ], 500 );
        }
    }

    /**
     * Check rate limit permission callback.
     *
     * @param WP_REST_Request $request Request object.
     * @return bool|WP_Error True if allowed, error otherwise.
     */
    public function checkRateLimit( WP_REST_Request $request ) {
        if ( ! get_option( 'gary_ai_rate_limit_enabled', true ) ) {
            return true;
        }

        $identifier = $this->getClientIpAddress();
        
        if ( ! $this->rateLimiter->isAllowed( $identifier ) ) {
            return new WP_Error( 'rate_limit_exceeded', 'Rate limit exceeded', [ 'status' => 429 ] );
        }

        return true;
    }

    /**
     * Validate chat request permission callback.
     *
     * @param WP_REST_Request $request Request object.
     * @return bool|WP_Error True if valid, error otherwise.
     */
    public function validateChatRequest( WP_REST_Request $request ) {
        // Check rate limit first
        $rateLimitCheck = $this->checkRateLimit( $request );
        if ( is_wp_error( $rateLimitCheck ) ) {
            return $rateLimitCheck;
        }

        // Validate WordPress authentication token if provided
        $authHeader = $request->get_header( 'Authorization' );
        if ( $authHeader && str_starts_with( $authHeader, 'Bearer ' ) ) {
            $token = substr( $authHeader, 7 );
            $tokenData = $this->wpAuth->verifyToken( $token );
            if ( ! $tokenData ) {
                return new WP_Error( 'invalid_token', 'Invalid or expired token', [ 'status' => 401 ] );
            }
        }

        return true;
    }

    /**
     * Check admin permission callback.
     *
     * @param WP_REST_Request $request Request object.
     * @return bool True if user has admin permission.
     */
    public function checkAdminPermission( WP_REST_Request $request ): bool {
        return current_user_can( 'gary_ai_manage_settings' ) || current_user_can( 'manage_options' );
    }

    /**
     * Validate conversation access permission callback.
     *
     * @param WP_REST_Request $request Request object.
     * @return bool|WP_Error True if allowed, error otherwise.
     */
    public function validateConversationAccess( WP_REST_Request $request ) {
        $conversationId = $request->get_param( 'id' );
        $conversation = $this->conversationManager->getConversation( $conversationId );
        
        if ( ! $conversation ) {
            return new WP_Error( 'conversation_not_found', 'Conversation not found', [ 'status' => 404 ] );
        }

        $currentUserId = get_current_user_id();
        $sessionId = $this->getOrCreateSessionId( $request );

        // Allow access if user owns the conversation or it's from their session
        if ( $conversation['user_id'] == $currentUserId || $conversation['session_id'] === $sessionId ) {
            return true;
        }

        // Allow admin access
        if ( current_user_can( 'gary_ai_view_analytics' ) || current_user_can( 'manage_options' ) ) {
            return true;
        }

        return new WP_Error( 'access_denied', 'Access denied to this conversation', [ 'status' => 403 ] );
    }

    /**
     * Validate message parameter.
     *
     * @param string $value Message value.
     * @param WP_REST_Request $request Request object.
     * @param string $param Parameter name.
     * @return bool|WP_Error True if valid, error otherwise.
     */
    public function validateMessage( $value, $request, $param ) {
        if ( empty( trim( $value ) ) ) {
            return new WP_Error( 'empty_message', 'Message cannot be empty', [ 'status' => 400 ] );
        }

        if ( strlen( $value ) > 4000 ) {
            return new WP_Error( 'message_too_long', 'Message too long (max 4000 characters)', [ 'status' => 400 ] );
        }

        return true;
    }

    /**
     * Get settings schema for validation.
     *
     * @return array Settings schema.
     */
    private function getSettingsSchema(): array {
        return [
            'api_key' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'datastore_id' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'widget_enabled' => [
                'type' => 'boolean',
            ],
            'save_conversations' => [
                'type' => 'boolean',
            ],
            'rate_limit_enabled' => [
                'type' => 'boolean',
            ],
            'rate_limit_requests_per_minute' => [
                'type'    => 'integer',
                'minimum' => 1,
                'maximum' => 1000,
            ],
            'analytics_enabled' => [
                'type' => 'boolean',
            ],
            'widget_position' => [
                'type' => 'string',
                'enum' => [ 'bottom-right', 'bottom-left', 'top-right', 'top-left' ],
            ],
            'widget_theme' => [
                'type' => 'string',
                'enum' => [ 'light', 'dark', 'auto' ],
            ],
            'max_conversation_length' => [
                'type'    => 'integer',
                'minimum' => 10,
                'maximum' => 200,
            ],
            'session_timeout' => [
                'type'    => 'integer',
                'minimum' => 300,
                'maximum' => 86400,
            ],
        ];
    }

    /**
     * Get or create session ID.
     *
     * @param WP_REST_Request $request Request object.
     * @return string Session ID.
     */
    private function getOrCreateSessionId( WP_REST_Request $request ): string {
        $sessionId = $request->get_param( 'session_id' ) ?: $request->get_header( 'X-Session-ID' );
        
        if ( empty( $sessionId ) ) {
            $sessionId = wp_generate_uuid4();
        }

        return $sessionId;
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
     * Check database health.
     *
     * @return array Health status.
     */
    private function checkDatabaseHealth(): array {
        global $wpdb;
        
        try {
            $result = $wpdb->get_var( "SELECT 1" );
            return [
                'healthy' => $result === '1',
                'message' => $result === '1' ? 'Database connection OK' : 'Database connection failed',
            ];
        } catch ( \Exception $e ) {
            return [
                'healthy' => false,
                'message' => 'Database error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Check AI client health.
     *
     * @return array Health status.
     */
    private function checkAiClientHealth(): array {
        if ( ! isset( $this->aiClient ) ) {
            return [
                'healthy' => false,
                'message' => 'AI client not configured',
            ];
        }

        try {
            $this->aiClient->healthCheck();
            return [
                'healthy' => true,
                'message' => 'AI client connection OK',
            ];
        } catch ( \Exception $e ) {
            return [
                'healthy' => false,
                'message' => 'AI client error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Check rate limiter health.
     *
     * @return array Health status.
     */
    private function checkRateLimiterHealth(): array {
        try {
            $testId = 'health_check_' . time();
            $allowed = $this->rateLimiter->isAllowed( $testId );
            return [
                'healthy' => true,
                'message' => 'Rate limiter functional',
            ];
        } catch ( \Exception $e ) {
            return [
                'healthy' => false,
                'message' => 'Rate limiter error: ' . $e->getMessage(),
            ];
        }
    }
}
