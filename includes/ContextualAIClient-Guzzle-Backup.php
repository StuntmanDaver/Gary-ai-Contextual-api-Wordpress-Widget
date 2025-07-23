<?php
/**
 * Contextual AI Client
 *
 * Wrapper around Contextual AI REST endpoints with retry logic and error handling.
 *
 * @package GaryAI
 * @since   1.0.0
 */

namespace GaryAI;

// Using WordPress native HTTP API instead of Guzzle to avoid external dependencies

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class ContextualAIClient
 *
 * Handles communication with Contextual AI API endpoints.
 */
class ContextualAIClient {

    /**
     * WordPress HTTP API - no external dependencies needed
     *
     * @var bool
     */
    private bool $useWordPressHttp = true;

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
        
        // Using WordPress native HTTP API - no Guzzle dependency needed
        // HTTP requests will be handled by WordPress wp_remote_* functions
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
        $payload = array_merge( [
            'messages' => $messages,
            'stream' => false,
        ], $options );

        return $this->makeRequest( 'POST', "/agents/{$agentId}/query", $payload );
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
        $messages = [[
            'content' => $prompt,
            'role' => 'user'
        ]];
        
        return $this->queryAgent( $agentId, $messages, $options );
    }

    /**
     * List available datastores.
     *
     * @param array $params Query parameters (agent_id, limit, cursor).
     * @return array List of datastores.
     * @throws \Exception If the request fails after all retries.
     */
    public function listDatastores( array $params = [] ): array {
        $query = !empty( $params ) ? '?' . http_build_query( $params ) : '';
        return $this->makeRequest( 'GET', '/datastores' . $query );
    }

    /**
     * Get datastore metadata and details.
     *
     * @param string $datastoreId Datastore ID.
     * @return array Datastore metadata including name, configuration, agents, etc.
     * @throws \Exception If the request fails after all retries.
     */
    public function getDatastore( string $datastoreId ): array {
        return $this->makeRequest( 'GET', "/datastores/{$datastoreId}/metadata" );
    }

    /**
     * Create a new conversation.
     *
     * @param string $datastoreId Datastore ID.
     * @param array  $options     Additional options.
     * @return array Conversation details.
     * @throws \Exception If the request fails after all retries.
     */
    public function createConversation( string $datastoreId, array $options = [] ): array {
        $payload = array_merge( [
            'datastore_id' => $datastoreId,
        ], $options );

        return $this->makeRequest( 'POST', '/conversations', $payload );
    }

    /**
     * Send a message in a conversation.
     *
     * @param string $conversationId Conversation ID.
     * @param string $message        Message content.
     * @param array  $options        Additional options.
     * @return array Response from the API.
     * @throws \Exception If the request fails after all retries.
     */
    public function sendMessage( string $conversationId, string $message, array $options = [] ): array {
        $payload = array_merge( [
            'message' => $message,
        ], $options );

        return $this->makeRequest( 'POST', "/conversations/{$conversationId}/messages", $payload );
    }

    /**
     * Get conversation history.
     *
     * @param string $conversationId Conversation ID.
     * @param int    $limit          Number of messages to retrieve.
     * @return array Conversation messages.
     * @throws \Exception If the request fails after all retries.
     */
    public function getConversationHistory( string $conversationId, int $limit = 50 ): array {
        $query = http_build_query( [ 'limit' => $limit ] );
        return $this->makeRequest( 'GET', "/conversations/{$conversationId}/messages?{$query}" );
    }

    /**
     * Check API health status.
     *
     * @return array Health status response.
     * @throws \Exception If the request fails after all retries.
     */
    public function healthCheck(): array {
        return $this->makeRequest( 'GET', '/health' );
    }

    // =============================================================================
    // DATASTORE ENDPOINTS
    // =============================================================================

    /**
     * Create new datastore.
     *
     * @param array $body Datastore configuration.
     * @return array Created datastore details.
     * @throws \Exception If the request fails after all retries.
     */
    public function createDatastore( array $body ): array {
        return $this->makeRequest( 'POST', '/datastores', $body );
    }

    /**
     * Clear all documents & metadata from datastore.
     *
     * @param string $datastoreId Datastore ID.
     * @return array Reset response.
     * @throws \Exception If the request fails after all retries.
     */
    public function resetDatastore( string $datastoreId ): array {
        return $this->makeRequest( 'PUT', "/datastores/{$datastoreId}/reset" );
    }

    /**
     * Update datastore attributes.
     *
     * @param string $datastoreId Datastore ID.
     * @param array  $body        Updated attributes.
     * @return array Updated datastore details.
     * @throws \Exception If the request fails after all retries.
     */
    public function updateDatastore( string $datastoreId, array $body ): array {
        return $this->makeRequest( 'PUT', "/datastores/{$datastoreId}", $body );
    }

    /**
     * Remove datastore.
     *
     * @param string $datastoreId Datastore ID.
     * @return array Deletion response.
     * @throws \Exception If the request fails after all retries.
     */
    public function deleteDatastore( string $datastoreId ): array {
        return $this->makeRequest( 'DELETE', "/datastores/{$datastoreId}" );
    }

    // =============================================================================
    // DATASTORE DOCUMENTS ENDPOINTS
    // =============================================================================

    /**
     * List documents in datastore.
     *
     * @param string $datastoreId Datastore ID.
     * @param array  $params      Query parameters.
     * @return array List of documents.
     * @throws \Exception If the request fails after all retries.
     */
    public function listDocuments( string $datastoreId, array $params = [] ): array {
        $query = ! empty( $params ) ? '?' . http_build_query( $params ) : '';
        return $this->makeRequest( 'GET', "/datastores/{$datastoreId}/documents{$query}" );
    }

    /**
     * Upload/ingest document to datastore.
     *
     * @param string $datastoreId Datastore ID.
     * @param mixed  $file        File data, path, or resource.
     * @param array  $metadata    Document metadata (optional).
     * @return array Ingestion response.
     * @throws \Exception If the request fails after all retries.
     */
    public function ingestDocument( string $datastoreId, $file, array $metadata = [] ): array {
        return $this->makeFileUploadRequest( 'POST', "/datastores/{$datastoreId}/documents", $file, $metadata );
    }

    /**
     * Fetch document metadata.
     *
     * @param string $datastoreId Datastore ID.
     * @param string $documentId  Document ID.
     * @return array Document metadata.
     * @throws \Exception If the request fails after all retries.
     */
    public function getDocumentMeta( string $datastoreId, string $documentId ): array {
        return $this->makeRequest( 'GET', "/datastores/{$datastoreId}/documents/{$documentId}/metadata" );
    }

    /**
     * Edit document metadata.
     *
     * @param string $datastoreId Datastore ID.
     * @param string $documentId  Document ID.
     * @param array  $metadata    Updated metadata.
     * @return array Updated metadata.
     * @throws \Exception If the request fails after all retries.
     */
    public function updateDocumentMeta( string $datastoreId, string $documentId, array $metadata ): array {
        return $this->makeRequest( 'POST', "/datastores/{$datastoreId}/documents/{$documentId}/metadata", $metadata );
    }

    /**
     * Delete document from datastore.
     *
     * @param string $datastoreId Datastore ID.
     * @param string $documentId  Document ID.
     * @return array Deletion response.
     * @throws \Exception If the request fails after all retries.
     */
    public function deleteDocument( string $datastoreId, string $documentId ): array {
        return $this->makeRequest( 'DELETE', "/datastores/{$datastoreId}/documents/{$documentId}" );
    }

    // =============================================================================
    // AGENT ENDPOINTS
    // =============================================================================

    /**
     * List all agents.
     *
     * @return array List of agents.
     * @throws \Exception If the request fails after all retries.
     */
    public function listAgents(): array {
        return $this->makeRequest( 'GET', '/agents' );
    }

    /**
     * Create new agent.
     *
     * @param array $body Agent configuration.
     * @return array Created agent details.
     * @throws \Exception If the request fails after all retries.
     */
    public function createAgent( array $body ): array {
        return $this->makeRequest( 'POST', '/agents', $body );
    }

    /**
     * Update agent configuration.
     *
     * @param string $agentId Agent ID.
     * @param array  $body    Updated configuration.
     * @return array Updated agent details.
     * @throws \Exception If the request fails after all retries.
     */
    public function updateAgent( string $agentId, array $body ): array {
        return $this->makeRequest( 'PUT', "/agents/{$agentId}", $body );
    }

    /**
     * Delete agent.
     *
     * @param string $agentId Agent ID.
     * @return array Deletion response.
     * @throws \Exception If the request fails after all retries.
     */
    public function deleteAgent( string $agentId ): array {
        return $this->makeRequest( 'DELETE', "/agents/{$agentId}" );
    }

    /**
     * Retrieve agent metadata and configuration.
     *
     * @param string $agentId Agent ID.
     * @return array Agent metadata including name, description, datastore_ids, configs, etc.
     * @throws \Exception If the request fails after all retries.
     */
    public function getAgent( string $agentId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/metadata" );
    }

    /**
     * Wipe agent conversation context.
     *
     * @param string $agentId Agent ID.
     * @return array Reset response.
     * @throws \Exception If the request fails after all retries.
     */
    public function resetAgent( string $agentId ): array {
        return $this->makeRequest( 'PUT', "/agents/{$agentId}/reset" );
    }

    // =============================================================================
    // AGENT QUERY ENDPOINTS
    // =============================================================================

    /**
     * Get RAG retrieval information for a message.
     *
     * @param string $agentId   Agent ID.
     * @param string $messageId Message ID.
     * @param array  $params    Optional query parameters (content_ids).
     * @return array Retrieval information.
     * @throws \Exception If the request fails after all retries.
     */
    public function getRetrievalInfo( string $agentId, string $messageId, array $params = [] ): array {
        $query = !empty( $params ) ? '?' . http_build_query( $params ) : '';
        return $this->makeRequest( 'GET', "/agents/{$agentId}/query/{$messageId}/retrieval/info" . $query );
    }

    /**
     * Provide feedback (thumbs-up/down etc.).
     *
     * @param string $agentId Agent ID.
     * @param array  $payload Feedback payload.
     * @return array Feedback response.
     * @throws \Exception If the request fails after all retries.
     */
    public function feedback( string $agentId, array $payload ): array {
        return $this->makeRequest( 'POST', "/agents/{$agentId}/feedback", $payload );
    }

    /**
     * Get agent usage metrics.
     *
     * @param string $agentId Agent ID.
     * @return array Usage metrics.
     * @throws \Exception If the request fails after all retries.
     */
    public function getAgentMetrics( string $agentId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/metrics" );
    }

    // =============================================================================
    // AGENT EVALUATION ENDPOINTS
    // =============================================================================

    /**
     * Start evaluation job.
     *
     * @param string $agentId Agent ID.
     * @param array  $body    Evaluation configuration.
     * @return array Evaluation job details.
     * @throws \Exception If the request fails after all retries.
     */
    public function createEvaluation( string $agentId, array $body ): array {
        return $this->makeRequest( 'POST', "/agents/{$agentId}/evaluate", $body );
    }

    /**
     * List evaluation jobs.
     *
     * @param string $agentId Agent ID.
     * @return array List of evaluation jobs.
     * @throws \Exception If the request fails after all retries.
     */
    public function listEvaluations( string $agentId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/evaluate" );
    }

    /**
     * Get evaluation job metadata.
     *
     * @param string $agentId      Agent ID.
     * @param string $evaluationId Evaluation ID.
     * @return array Evaluation job metadata.
     * @throws \Exception If the request fails after all retries.
     */
    public function getEvaluation( string $agentId, string $evaluationId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/evaluate/{$evaluationId}" );
    }

    /**
     * Cancel evaluation job.
     *
     * @param string $agentId      Agent ID.
     * @param string $evaluationId Evaluation ID.
     * @return array Cancellation response.
     * @throws \Exception If the request fails after all retries.
     */
    public function cancelEvaluation( string $agentId, string $evaluationId ): array {
        return $this->makeRequest( 'POST', "/agents/{$agentId}/evaluate/{$evaluationId}/cancel" );
    }

    // =============================================================================
    // AGENT EVALUATION DATASETS ENDPOINTS
    // =============================================================================

    /**
     * List evaluation datasets.
     *
     * @param string $agentId Agent ID.
     * @return array List of evaluation datasets.
     * @throws \Exception If the request fails after all retries.
     */
    public function listEvalDatasets( string $agentId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/datasets/evaluate" );
    }

    /**
     * Create evaluation dataset.
     *
     * @param string $agentId Agent ID.
     * @param array  $body    Dataset configuration.
     * @return array Created dataset details.
     * @throws \Exception If the request fails after all retries.
     */
    public function createEvalDataset( string $agentId, array $body ): array {
        return $this->makeRequest( 'POST', "/agents/{$agentId}/datasets/evaluate", $body );
    }

    /**
     * Get evaluation dataset.
     *
     * @param string $agentId   Agent ID.
     * @param string $datasetId Dataset ID.
     * @return array Dataset details.
     * @throws \Exception If the request fails after all retries.
     */
    public function getEvalDataset( string $agentId, string $datasetId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/datasets/evaluate/{$datasetId}" );
    }

    /**
     * Update evaluation dataset.
     *
     * @param string $agentId   Agent ID.
     * @param string $datasetId Dataset ID.
     * @param array  $body      Updated configuration.
     * @return array Updated dataset details.
     * @throws \Exception If the request fails after all retries.
     */
    public function updateEvalDataset( string $agentId, string $datasetId, array $body ): array {
        return $this->makeRequest( 'PUT', "/agents/{$agentId}/datasets/evaluate/{$datasetId}", $body );
    }

    /**
     * Delete evaluation dataset.
     *
     * @param string $agentId   Agent ID.
     * @param string $datasetId Dataset ID.
     * @return array Deletion response.
     * @throws \Exception If the request fails after all retries.
     */
    public function deleteEvalDataset( string $agentId, string $datasetId ): array {
        return $this->makeRequest( 'DELETE', "/agents/{$agentId}/datasets/evaluate/{$datasetId}" );
    }

    /**
     * Get evaluation dataset metadata.
     *
     * @param string $agentId   Agent ID.
     * @param string $datasetId Dataset ID.
     * @return array Dataset metadata.
     * @throws \Exception If the request fails after all retries.
     */
    public function getEvalDatasetMeta( string $agentId, string $datasetId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/datasets/evaluate/{$datasetId}/metadata" );
    }

    // =============================================================================
    // AGENT TUNE DATASETS ENDPOINTS
    // =============================================================================

    /**
     * List tune datasets.
     *
     * @param string $agentId Agent ID.
     * @return array List of tune datasets.
     * @throws \Exception If the request fails after all retries.
     */
    public function listTuneDatasets( string $agentId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/datasets/tune" );
    }

    /**
     * Create tune dataset.
     *
     * @param string $agentId Agent ID.
     * @param array  $body    Dataset configuration.
     * @return array Created dataset details.
     * @throws \Exception If the request fails after all retries.
     */
    public function createTuneDataset( string $agentId, array $body ): array {
        return $this->makeRequest( 'POST', "/agents/{$agentId}/datasets/tune", $body );
    }

    /**
     * Get tune dataset.
     *
     * @param string $agentId   Agent ID.
     * @param string $datasetId Dataset ID.
     * @return array Dataset details.
     * @throws \Exception If the request fails after all retries.
     */
    public function getTuneDataset( string $agentId, string $datasetId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/datasets/tune/{$datasetId}" );
    }

    /**
     * Update tune dataset.
     *
     * @param string $agentId   Agent ID.
     * @param string $datasetId Dataset ID.
     * @param array  $body      Updated configuration.
     * @return array Updated dataset details.
     * @throws \Exception If the request fails after all retries.
     */
    public function updateTuneDataset( string $agentId, string $datasetId, array $body ): array {
        return $this->makeRequest( 'PUT', "/agents/{$agentId}/datasets/tune/{$datasetId}", $body );
    }

    /**
     * Delete tune dataset.
     *
     * @param string $agentId   Agent ID.
     * @param string $datasetId Dataset ID.
     * @return array Deletion response.
     * @throws \Exception If the request fails after all retries.
     */
    public function deleteTuneDataset( string $agentId, string $datasetId ): array {
        return $this->makeRequest( 'DELETE', "/agents/{$agentId}/datasets/tune/{$datasetId}" );
    }

    /**
     * Get tune dataset metadata.
     *
     * @param string $agentId   Agent ID.
     * @param string $datasetId Dataset ID.
     * @return array Dataset metadata.
     * @throws \Exception If the request fails after all retries.
     */
    public function getTuneDatasetMeta( string $agentId, string $datasetId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/datasets/tune/{$datasetId}/metadata" );
    }

    // =============================================================================
    // AGENT TUNE ENDPOINTS
    // =============================================================================

    /**
     * Submit tune job.
     *
     * @param string $agentId Agent ID.
     * @param array  $body    Tune job configuration.
     * @return array Tune job details.
     * @throws \Exception If the request fails after all retries.
     */
    public function submitTuneJob( string $agentId, array $body ): array {
        return $this->makeRequest( 'POST', "/agents/{$agentId}/tune", $body );
    }

    /**
     * List tune jobs.
     *
     * @param string $agentId Agent ID.
     * @return array List of tune jobs.
     * @throws \Exception If the request fails after all retries.
     */
    public function listTuneJobs( string $agentId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/tune" );
    }

    /**
     * Get tune job details.
     *
     * @param string $agentId Agent ID.
     * @param string $jobId   Job ID.
     * @return array Tune job details.
     * @throws \Exception If the request fails after all retries.
     */
    public function getTuneJob( string $agentId, string $jobId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/tune/{$jobId}" );
    }

    /**
     * Cancel tune job.
     *
     * @param string $agentId Agent ID.
     * @param string $jobId   Job ID.
     * @return array Cancellation response.
     * @throws \Exception If the request fails after all retries.
     */
    public function cancelTuneJob( string $agentId, string $jobId ): array {
        return $this->makeRequest( 'DELETE', "/agents/{$agentId}/tune/{$jobId}" );
    }

    /**
     * List tuned models.
     *
     * @param string $agentId Agent ID.
     * @return array List of tuned models.
     * @throws \Exception If the request fails after all retries.
     */
    public function listTunedModels( string $agentId ): array {
        return $this->makeRequest( 'GET', "/agents/{$agentId}/tune/models" );
    }

    // =============================================================================
    // LMUNIT ENDPOINTS
    // =============================================================================

    /**
     * Execute LM-unit tests.
     *
     * @param array $body Test configuration.
     * @return array Test results.
     * @throws \Exception If the request fails after all retries.
     */
    public function runLMUnit( array $body ): array {
        return $this->makeRequest( 'POST', '/lmunit', $body );
    }

    // =============================================================================
    // USER ENDPOINTS
    // =============================================================================

    /**
     * Get users.
     *
     * @param array $params Query parameters.
     * @return array List of users.
     * @throws \Exception If the request fails after all retries.
     */
    public function getUsers( array $params = [] ): array {
        $query = ! empty( $params ) ? '?' . http_build_query( $params ) : '';
        return $this->makeRequest( 'GET', "/users{$query}" );
    }

    /**
     * Update user.
     *
     * @param array $body User data.
     * @return array Updated user details.
     * @throws \Exception If the request fails after all retries.
     */
    public function updateUser( array $body ): array {
        return $this->makeRequest( 'PUT', '/users', $body );
    }

    /**
     * Invite users.
     *
     * @param array $body Invitation data.
     * @return array Invitation response.
     * @throws \Exception If the request fails after all retries.
     */
    public function inviteUsers( array $body ): array {
        return $this->makeRequest( 'POST', '/users', $body );
    }

    /**
     * Remove users.
     *
     * @param array $body User removal data.
     * @return array Removal response.
     * @throws \Exception If the request fails after all retries.
     */
    public function removeUsers( array $body ): array {
        return $this->makeRequest( 'DELETE', '/users', $body );
    }

    // =============================================================================
    // GENERATE ENDPOINTS
    // =============================================================================

    /**
     * Free-form text/image generation.
     *
     * @param array $body Generation parameters.
     * @return array Generated content.
     * @throws \Exception If the request fails after all retries.
     */
    public function generate( array $body ): array {
        return $this->makeRequest( 'POST', '/generate', $body );
    }

    // =============================================================================
    // RERANK ENDPOINTS
    // =============================================================================

    /**
     * Semantic reranking.
     *
     * @param array $body Reranking parameters.
     * @return array Reranked results.
     * @throws \Exception If the request fails after all retries.
     */
    public function rerank( array $body ): array {
        return $this->makeRequest( 'POST', '/rerank', $body );
    }

    // =============================================================================
    // PARSE ENDPOINTS
    // =============================================================================

    /**
     * Parse file.
     *
     * @param array $body Parse parameters.
     * @return array Parse job details.
     * @throws \Exception If the request fails after all retries.
     */
    public function parseFile( array $body ): array {
        return $this->makeRequest( 'POST', '/parse', $body );
    }

    /**
     * Get parse job status.
     *
     * @param string $jobId Job ID.
     * @return array Parse job status.
     * @throws \Exception If the request fails after all retries.
     */
    public function getParseStatus( string $jobId ): array {
        return $this->makeRequest( 'GET', "/parse/jobs/{$jobId}/status" );
    }

    /**
     * Get parse job results.
     *
     * @param string $jobId Job ID.
     * @param array  $params Optional query parameters (output_format).
     * @return array Parse results.
     * @throws \Exception If the request fails after all retries.
     */
    public function getParseResults( string $jobId, array $params = [] ): array {
        $query = !empty( $params ) ? '?' . http_build_query( $params ) : '';
        return $this->makeRequest( 'GET', "/parse/jobs/{$jobId}/results" . $query );
    }

    /**
     * List parse jobs.
     *
     * @param array $params Optional query parameters (limit, cursor, uploaded_after).
     * @return array List of parse jobs.
     * @throws \Exception If the request fails after all retries.
     */
    public function listParseJobs( array $params = [] ): array {
        $query = !empty( $params ) ? '?' . http_build_query( $params ) : '';
        return $this->makeRequest( 'GET', '/parse/jobs' . $query );
    }

    /**
     * Make an HTTP request with retry logic.
     *
     * @param string $method  HTTP method.
     * @param string $endpoint API endpoint.
     * @param array  $payload  Request payload.
     * @return array Response data.
     * @throws \Exception If the request fails after all retries.
     */
    private function makeRequest( string $method, string $endpoint, array $payload = [] ): array {
        $attempt = 0;
        $lastException = null;

        while ( $attempt <= $this->maxRetries ) {
            try {
                $options = [];
                if ( ! empty( $payload ) && in_array( strtoupper( $method ), [ 'POST', 'PUT', 'PATCH' ], true ) ) {
                    $options['json'] = $payload;
                }

                $response = $this->http->request( $method, $endpoint, $options );
                $body = (string) $response->getBody();
                $data = json_decode( $body, true );

                if ( json_last_error() !== JSON_ERROR_NONE ) {
                    throw new \Exception( 'Invalid JSON response: ' . json_last_error_msg() );
                }

                return $data ?? [];

            } catch ( ConnectException $e ) {
                // Network connectivity issues - retry
                $lastException = $e;
                $this->logError( "Connection error (attempt {$attempt}): " . $e->getMessage() );
                
            } catch ( RequestException $e ) {
                // HTTP errors
                $statusCode = $e->getResponse() ? $e->getResponse()->getStatusCode() : 0;
                
                // Don't retry client errors (4xx), except for rate limiting (429)
                if ( $statusCode >= 400 && $statusCode < 500 && $statusCode !== 429 ) {
                    $this->logError( "Client error ({$statusCode}): " . $e->getMessage() );
                    throw new \Exception( "API client error ({$statusCode}): " . $e->getMessage() );
                }
                
                $lastException = $e;
                $this->logError( "Request error (attempt {$attempt}): " . $e->getMessage() );
                
            } catch ( GuzzleException $e ) {
                // Other Guzzle exceptions
                $lastException = $e;
                $this->logError( "HTTP error (attempt {$attempt}): " . $e->getMessage() );
            }

            // Don't sleep after the last attempt
            if ( $attempt < $this->maxRetries ) {
                $delay = $this->baseDelay * pow( 2, $attempt ); // Exponential backoff
                sleep( (int) $delay );
            }

            $attempt++;
        }

        // All retries exhausted
        $errorMessage = 'Request failed after ' . ($this->maxRetries + 1) . ' attempts';
        if ( $lastException ) {
            $errorMessage .= ': ' . $lastException->getMessage();
        }
        
        $this->logError( $errorMessage );
        throw new \Exception( $errorMessage );
    }

    /**
     * Make an HTTP request with file upload (multipart/form-data).
     *
     * @param string $method   HTTP method.
     * @param string $endpoint API endpoint.
     * @param mixed  $file     File data, path, or resource.
     * @param array  $metadata Optional metadata.
     * @return array Response data.
     * @throws \Exception If the request fails after all retries.
     */
    private function makeFileUploadRequest( string $method, string $endpoint, $file, array $metadata = [] ): array {
        $attempt = 0;
        $lastException = null;

        while ( $attempt <= $this->maxRetries ) {
            try {
                $multipart = [];
                
                // Add file to multipart data
                if ( is_string( $file ) && file_exists( $file ) ) {
                    // File path provided
                    $multipart[] = [
                        'name'     => 'file',
                        'contents' => fopen( $file, 'r' ),
                        'filename' => basename( $file )
                    ];
                } elseif ( is_resource( $file ) ) {
                    // File resource provided
                    $multipart[] = [
                        'name'     => 'file',
                        'contents' => $file
                    ];
                } else {
                    // File content provided as string
                    $multipart[] = [
                        'name'     => 'file',
                        'contents' => $file
                    ];
                }
                
                // Add metadata if provided
                if ( !empty( $metadata ) ) {
                    $multipart[] = [
                        'name'     => 'metadata',
                        'contents' => json_encode( $metadata )
                    ];
                }

                $options = [
                    'multipart' => $multipart
                ];

                $response = $this->http->request( $method, $endpoint, $options );
                $body = (string) $response->getBody();
                $data = json_decode( $body, true );

                if ( json_last_error() !== JSON_ERROR_NONE ) {
                    throw new \Exception( 'Invalid JSON response: ' . json_last_error_msg() );
                }

                return $data ?? [];

            } catch ( ConnectException $e ) {
                // Network connectivity issues - retry
                $lastException = $e;
                $this->logError( "Connection error (attempt {$attempt}): " . $e->getMessage() );
                
            } catch ( RequestException $e ) {
                // HTTP errors
                $statusCode = $e->getResponse() ? $e->getResponse()->getStatusCode() : 0;
                
                // Don't retry client errors (4xx), except for rate limiting (429)
                if ( $statusCode >= 400 && $statusCode < 500 && $statusCode !== 429 ) {
                    $this->logError( "Client error ({$statusCode}): " . $e->getMessage() );
                    throw new \Exception( "API client error ({$statusCode}): " . $e->getMessage() );
                }
                
                $lastException = $e;
                $this->logError( "Request error (attempt {$attempt}): " . $e->getMessage() );
                
            } catch ( GuzzleException $e ) {
                // Other Guzzle exceptions
                $lastException = $e;
                $this->logError( "HTTP error (attempt {$attempt}): " . $e->getMessage() );
            }

            // Don't sleep after the last attempt
            if ( $attempt < $this->maxRetries ) {
                $delay = $this->baseDelay * pow( 2, $attempt ); // Exponential backoff
                sleep( (int) $delay );
            }

            $attempt++;
        }

        // All retries exhausted
        $errorMessage = 'File upload request failed after ' . ($this->maxRetries + 1) . ' attempts';
        if ( $lastException ) {
            $errorMessage .= ': ' . $lastException->getMessage();
        }
        
        $this->logError( $errorMessage );
        throw new \Exception( $errorMessage );
    }

    /**
     * Log error messages.
     *
     * @param string $message Error message to log.
     */
    private function logError( string $message ): void {
        error_log( '[Gary AI] ContextualAIClient: ' . $message );
        
        // Also trigger WordPress action for custom logging
        do_action( 'gary_ai_api_error', $message );
    }

    /**
     * Validate API key format.
     *
     * @param string $apiKey API key to validate.
     * @return bool True if valid format.
     */
    public static function validateApiKey( string $apiKey ): bool {
        // Basic validation - adjust based on actual Contextual AI key format
        return ! empty( $apiKey ) && strlen( $apiKey ) >= 20;
    }
}
