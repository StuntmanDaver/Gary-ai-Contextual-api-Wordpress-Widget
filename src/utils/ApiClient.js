/**
 * API Client for Gary AI Chat Widget
 * 
 * Handles communication with WordPress REST API endpoints with proper
 * authentication, retry logic, and error handling.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

export class ApiClient {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || '/wp-json/gary-ai/v1';
        this.nonce = options.nonce || '';
        this.logger = options.logger || console;
        
        // Request configuration
        this.timeout = options.timeout || 30000;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
        
        // Session management
        this.sessionId = this.getOrCreateSessionId();
        this.token = null;
        this.tokenExpiry = null;
        
        // Request queue for rate limiting
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.maxConcurrentRequests = 3;
        this.activeRequests = 0;
        
        this.logger.debug('ApiClient initialized', {
            baseUrl: this.baseUrl,
            hasNonce: !!this.nonce,
            sessionId: this.sessionId
        });
    }

    /**
     * Get or create session ID
     */
    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('gary-ai-session-id');
        
        if (!sessionId) {
            sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('gary-ai-session-id', sessionId);
        }
        
        return sessionId;
    }

    /**
     * Get authentication token
     */
    async getToken() {
        // Return cached token if still valid
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        try {
            this.logger.debug('Requesting new authentication token');
            
            const response = await this.makeRequest('/token', {
                method: 'POST',
                skipAuth: true, // Don't use token for token request
                body: JSON.stringify({
                    session_id: this.sessionId
                })
            });

            if (response.success && response.data?.token) {
                this.token = response.data.token;
                // Set expiry to 90% of actual expiry for safety margin
                this.tokenExpiry = Date.now() + (response.data.expires_in * 900);
                
                this.logger.debug('Authentication token obtained', {
                    expiresIn: response.data.expires_in,
                    sessionId: response.data.session_id
                });
                
                return this.token;
            } else {
                throw new Error('Invalid token response format');
            }
        } catch (error) {
            this.logger.error('Failed to get authentication token:', error);
            throw new Error('Authentication failed: ' + error.message);
        }
    }

    /**
     * Get widget settings
     */
    async getSettings() {
        try {
            this.logger.debug('Fetching widget settings');
            
            const response = await this.makeRequest('/settings', {
                method: 'GET'
            });

            if (response.success && response.data) {
                this.logger.debug('Widget settings retrieved', response.data);
                return response.data;
            } else {
                throw new Error('Invalid settings response format');
            }
        } catch (error) {
            this.logger.warn('Failed to fetch settings, using defaults:', error);
            
            // Return default settings as fallback
            return {
                widget_enabled: true,
                widget_position: 'bottom-right',
                widget_theme: 'light',
                max_conversation_length: 50,
                welcome_message: 'Hello! How can I help you today?'
            };
        }
    }

    /**
     * Send chat message
     */
    async sendMessage(message, conversationId = null) {
        if (!message || typeof message !== 'string') {
            throw new Error('Message is required and must be a string');
        }

        try {
            this.logger.debug('Sending chat message', {
                messageLength: message.length,
                conversationId,
                sessionId: this.sessionId
            });

            const requestBody = {
                message: message.trim(),
                session_id: this.sessionId
            };

            if (conversationId) {
                requestBody.conversation_id = conversationId;
            }

            const response = await this.makeRequest('/chat', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            if (response.success && response.data) {
                this.logger.debug('Chat response received', {
                    conversationId: response.data.conversation_id,
                    responseLength: response.data.response?.length || 0,
                    tokenCount: response.data.token_count
                });
                
                return response.data;
            } else {
                throw new Error('Invalid chat response format');
            }
        } catch (error) {
            this.logger.error('Failed to send message:', error);
            throw new Error('Failed to send message: ' + error.message);
        }
    }

    /**
     * Get conversation history
     */
    async getConversation(conversationId) {
        if (!conversationId) {
            throw new Error('Conversation ID is required');
        }

        try {
            this.logger.debug('Fetching conversation history', { conversationId });
            
            const response = await this.makeRequest(`/conversations/${conversationId}`, {
                method: 'GET'
            });

            if (response.success && response.data) {
                this.logger.debug('Conversation history retrieved', {
                    conversationId,
                    messageCount: response.data.messages?.length || 0
                });
                
                return response.data;
            } else {
                throw new Error('Invalid conversation response format');
            }
        } catch (error) {
            this.logger.error('Failed to fetch conversation:', error);
            throw new Error('Failed to fetch conversation: ' + error.message);
        }
    }

    /**
     * Ensure authentication token is valid
     */
    async ensureAuthenticated() {
        // Check if we have a valid token
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return true;
        }
        
        this.logger.debug('Token missing or expired, obtaining new token');
        
        try {
            const tokenResult = await this.getToken();
            if (!tokenResult.success) {
                throw new Error('Failed to obtain authentication token');
            }
            
            return true;
        } catch (error) {
            this.logger.error('Authentication failed:', error);
            throw new Error('Authentication failed: ' + error.message);
        }
    }

    /**
     * Check API health
     */
    async checkHealth() {
        try {
            this.logger.debug('Checking API health');
            
            const response = await this.makeRequest('/health', {
                method: 'GET',
                skipAuth: true,
                timeout: 5000 // Shorter timeout for health checks
            });

            const isHealthy = response.success && response.data?.status === 'ok';
            
            this.logger.debug('API health check result', {
                healthy: isHealthy,
                status: response.data?.status,
                timestamp: response.data?.timestamp
            });
            
            return {
                healthy: isHealthy,
                status: response.data?.status || 'unknown',
                timestamp: response.data?.timestamp,
                response_time: response.meta?.response_time
            };
        } catch (error) {
            this.logger.warn('API health check failed:', error);
            return {
                healthy: false,
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Make HTTP request with proper authentication and error handling
     */
    async makeRequest(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        const method = options.method || 'GET';
        const timeout = options.timeout || this.timeout;
        const skipAuth = options.skipAuth || false;

        // Prepare headers
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        // Add WordPress nonce for authentication
        if (this.nonce) {
            headers['X-WP-Nonce'] = this.nonce;
        }

        // Add authentication token if available and not skipped
        if (!skipAuth) {
            try {
                const token = await this.getToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            } catch (error) {
                this.logger.warn('Failed to get auth token, proceeding without:', error);
            }
        }

        // Add session information
        headers['X-Gary-AI-Session'] = this.sessionId;

        // Create request configuration
        const requestConfig = {
            method,
            headers,
            signal: AbortSignal.timeout(timeout)
        };

        // Add body for non-GET requests
        if (method !== 'GET' && options.body) {
            requestConfig.body = options.body;
        }

        // Execute request with retry logic
        return await this.executeWithRetry(url, requestConfig, options.retryAttempts);
    }

    /**
     * Execute request with retry logic
     */
    async executeWithRetry(url, requestConfig, maxRetries = null) {
        const retries = maxRetries !== null ? maxRetries : this.retryAttempts;
        let lastError = null;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                this.logger.debug(`Making request (attempt ${attempt + 1}/${retries + 1})`, {
                    url,
                    method: requestConfig.method
                });

                // Rate limiting
                await this.waitForRateLimit();
                this.activeRequests++;

                const response = await fetch(url, requestConfig);
                
                // Always decrement active requests
                this.activeRequests = Math.max(0, this.activeRequests - 1);

                // Handle HTTP errors
                if (!response.ok) {
                    const errorText = await response.text();
                    let errorData = null;
                    
                    try {
                        errorData = JSON.parse(errorText);
                    } catch (e) {
                        // Not JSON, use text as error message
                    }

                    const error = new Error(
                        errorData?.message || 
                        `HTTP ${response.status}: ${response.statusText}`
                    );
                    error.status = response.status;
                    error.data = errorData;
                    
                    // Don't retry client errors (4xx), only server errors (5xx)
                    if (response.status >= 400 && response.status < 500) {
                        throw error;
                    }
                    
                    lastError = error;
                    
                    if (attempt < retries) {
                        this.logger.warn(`Request failed, retrying in ${this.retryDelay}ms`, {
                            attempt: attempt + 1,
                            status: response.status,
                            error: error.message
                        });
                        
                        await this.delay(this.retryDelay * (attempt + 1)); // Exponential backoff
                        continue;
                    }
                    
                    throw error;
                }

                // Parse JSON response
                const responseData = await response.json();
                
                this.logger.debug('Request successful', {
                    url,
                    status: response.status,
                    hasData: !!responseData
                });

                return responseData;

            } catch (error) {
                this.activeRequests = Math.max(0, this.activeRequests - 1);
                lastError = error;

                // Don't retry on abort/timeout or client errors
                if (error.name === 'AbortError' || error.name === 'TimeoutError' || 
                    (error.status && error.status >= 400 && error.status < 500)) {
                    throw error;
                }

                if (attempt < retries) {
                    this.logger.warn(`Request failed, retrying in ${this.retryDelay}ms`, {
                        attempt: attempt + 1,
                        error: error.message
                    });
                    
                    await this.delay(this.retryDelay * (attempt + 1));
                    continue;
                }
            }
        }

        throw lastError || new Error('Request failed after all retry attempts');
    }

    /**
     * Wait for rate limit if needed
     */
    async waitForRateLimit() {
        while (this.activeRequests >= this.maxConcurrentRequests) {
            await this.delay(100);
        }
    }

    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear cached authentication
     */
    clearAuth() {
        this.token = null;
        this.tokenExpiry = null;
        this.logger.debug('Authentication cache cleared');
    }

    /**
     * Update session ID
     */
    updateSessionId(newSessionId) {
        if (newSessionId && newSessionId !== this.sessionId) {
            this.sessionId = newSessionId;
            localStorage.setItem('gary-ai-session-id', newSessionId);
            this.clearAuth(); // Clear auth when session changes
            
            this.logger.debug('Session ID updated', { sessionId: newSessionId });
        }
    }

    /**
     * Get current session information
     */
    getSessionInfo() {
        return {
            sessionId: this.sessionId,
            hasToken: !!this.token,
            tokenExpiry: this.tokenExpiry,
            activeRequests: this.activeRequests
        };
    }

    /**
     * Reconnect session and restore conversation state
     */
    async reconnectSession() {
        this.logger.info('Attempting session reconnect');
        
        try {
            // Clear current authentication
            this.clearAuth();
            
            // Get fresh token
            const tokenResult = await this.getToken();
            if (!tokenResult.success) {
                throw new Error('Failed to obtain new token during reconnect');
            }
            
            // Test connection with health check
            const healthResult = await this.checkHealth();
            if (!healthResult.healthy) {
                throw new Error('Health check failed during reconnect');
            }
            
            this.logger.info('Session reconnected successfully', {
                sessionId: this.sessionId,
                hasToken: !!this.token
            });
            
            return {
                success: true,
                sessionId: this.sessionId,
                message: 'Session reconnected successfully'
            };
            
        } catch (error) {
            this.logger.error('Session reconnect failed:', error);
            
            return {
                success: false,
                error: error.message,
                message: 'Failed to reconnect session'
            };
        }
    }
    
    /**
     * Resume conversation from stored state
     */
    async resumeConversation(conversationId) {
        if (!conversationId) {
            this.logger.warn('No conversation ID provided for resume');
            return { success: false, error: 'No conversation ID provided' };
        }
        
        try {
            this.logger.info('Resuming conversation', { conversationId });
            
            // Ensure we have authentication
            await this.ensureAuthenticated();
            
            // Fetch conversation history
            const response = await this.makeRequest(`/conversations/${conversationId}`, {
                method: 'GET'
            });
            
            if (response.success && response.data) {
                this.logger.info('Conversation resumed successfully', {
                    conversationId,
                    messageCount: response.data.messages?.length || 0
                });
                
                return {
                    success: true,
                    conversation: response.data,
                    messages: response.data.messages || []
                };
            } else {
                throw new Error(response.error || 'Failed to fetch conversation');
            }
            
        } catch (error) {
            this.logger.error('Failed to resume conversation:', error);
            
            return {
                success: false,
                error: error.message,
                message: 'Failed to resume conversation'
            };
        }
    }
    
    /**
     * Store conversation state for reconnection
     */
    storeConversationState(conversationId, messages = []) {
        if (!conversationId) {
            return;
        }
        
        try {
            const conversationState = {
                conversationId,
                sessionId: this.sessionId,
                messageCount: messages.length,
                lastMessageTime: messages.length > 0 ? messages[messages.length - 1].timestamp : Date.now(),
                storedAt: Date.now()
            };
            
            sessionStorage.setItem('gary-ai-conversation-state', JSON.stringify(conversationState));
            
            this.logger.debug('Conversation state stored', conversationState);
            
        } catch (error) {
            this.logger.error('Failed to store conversation state:', error);
        }
    }
    
    /**
     * Retrieve stored conversation state
     */
    getStoredConversationState() {
        try {
            const stored = sessionStorage.getItem('gary-ai-conversation-state');
            if (!stored) {
                return null;
            }
            
            const state = JSON.parse(stored);
            
            // Check if state is still valid (within 24 hours)
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            if (Date.now() - state.storedAt > maxAge) {
                this.clearStoredConversationState();
                return null;
            }
            
            return state;
            
        } catch (error) {
            this.logger.error('Failed to retrieve conversation state:', error);
            return null;
        }
    }
    
    /**
     * Clear stored conversation state
     */
    clearStoredConversationState() {
        try {
            sessionStorage.removeItem('gary-ai-conversation-state');
            this.logger.debug('Conversation state cleared');
        } catch (error) {
            this.logger.error('Failed to clear conversation state:', error);
        }
    }
    
    /**
     * Check if session needs reconnection
     */
    needsReconnection() {
        // Check if token is expired or missing
        if (!this.token || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
            return true;
        }
        
        // Check if session ID has changed
        const storedSessionId = localStorage.getItem('gary-ai-session-id');
        if (storedSessionId && storedSessionId !== this.sessionId) {
            return true;
        }
        
        return false;
    }

    /**
     * Destroy the API client
     */
    destroy() {
        this.clearAuth();
        this.clearStoredConversationState();
        this.requestQueue = [];
        this.activeRequests = 0;
        this.logger.debug('ApiClient destroyed');
    }
}
