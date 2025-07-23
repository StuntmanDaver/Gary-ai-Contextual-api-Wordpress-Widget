/**
 * ApiClient Unit Tests
 * 
 * Comprehensive tests for the ApiClient utility class.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { ApiClient } from '../../src/utils/ApiClient.js';

describe('ApiClient', () => {
  let apiClient;
  let mockLogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    apiClient = new ApiClient({
      baseUrl: '/wp-json/gary-ai/v1',
      nonce: 'test-nonce',
      logger: mockLogger
    });
    
    // Mock fetch responses
    fetch.mockClear();
  });

  afterEach(() => {
    apiClient.destroy();
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      const client = new ApiClient();
      expect(client.baseUrl).toBe('/wp-json/gary-ai/v1');
      expect(client.timeout).toBe(30000);
      expect(client.retryAttempts).toBe(3);
    });

    test('should initialize with custom options', () => {
      const options = {
        baseUrl: '/custom/api',
        timeout: 5000,
        retryAttempts: 5,
        logger: mockLogger
      };
      
      const client = new ApiClient(options);
      expect(client.baseUrl).toBe('/custom/api');
      expect(client.timeout).toBe(5000);
      expect(client.retryAttempts).toBe(5);
      expect(client.logger).toBe(mockLogger);
    });

    test('should create session ID', () => {
      expect(apiClient.sessionId).toBeDefined();
      expect(apiClient.sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
    });
  });

  describe('Session Management', () => {
    test('should get or create session ID', () => {
      const sessionId = apiClient.getOrCreateSessionId();
      expect(sessionId).toBeDefined();
      expect(localStorage.setItem).toHaveBeenCalledWith('gary-ai-session-id', sessionId);
    });

    test('should use existing session ID from localStorage', () => {
      const existingSessionId = 'existing-session-123';
      localStorage.getItem.mockReturnValue(existingSessionId);
      
      const client = new ApiClient();
      expect(client.sessionId).toBe(existingSessionId);
    });

    test('should update session ID', () => {
      const newSessionId = 'new-session-456';
      apiClient.updateSessionId(newSessionId);
      
      expect(apiClient.sessionId).toBe(newSessionId);
      expect(localStorage.setItem).toHaveBeenCalledWith('gary-ai-session-id', newSessionId);
    });

    test('should get session info', () => {
      const info = apiClient.getSessionInfo();
      expect(info).toHaveProperty('sessionId');
      expect(info).toHaveProperty('hasToken');
      expect(info).toHaveProperty('tokenExpiry');
      expect(info).toHaveProperty('activeRequests');
    });
  });

  describe('Authentication', () => {
    test('should get token successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'test-token-123',
          expires_in: 900,
          issued_at: Date.now()
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.getToken();
      
      expect(result.success).toBe(true);
      expect(apiClient.token).toBe('test-token-123');
      expect(fetch).toHaveBeenCalledWith(
        '/wp-json/gary-ai/v1/token',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-WP-Nonce': 'test-nonce'
          })
        })
      );
    });

    test('should handle token request failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      const result = await apiClient.getToken();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should ensure authentication with valid token', async () => {
      apiClient.token = 'valid-token';
      apiClient.tokenExpiry = Date.now() + 10000; // 10 seconds from now
      
      const result = await apiClient.ensureAuthenticated();
      expect(result).toBe(true);
    });

    test('should refresh token when expired', async () => {
      apiClient.token = 'expired-token';
      apiClient.tokenExpiry = Date.now() - 1000; // 1 second ago
      
      const mockResponse = {
        success: true,
        data: {
          token: 'new-token-456',
          expires_in: 900,
          issued_at: Date.now()
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.ensureAuthenticated();
      expect(result).toBe(true);
      expect(apiClient.token).toBe('new-token-456');
    });
  });

  describe('API Requests', () => {
    test('should make successful GET request', async () => {
      const mockResponse = { success: true, data: { test: 'data' } };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.makeRequest('/test', { method: 'GET' });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ test: 'data' });
    });

    test('should make successful POST request with body', async () => {
      const mockResponse = { success: true, data: { created: true } };
      const requestBody = { message: 'test message' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.makeRequest('/test', {
        method: 'POST',
        body: requestBody
      });
      
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        '/wp-json/gary-ai/v1/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody)
        })
      );
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiClient.makeRequest('/test');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    test('should retry failed requests', async () => {
      // First two calls fail, third succeeds
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} })
        });

      const result = await apiClient.makeRequest('/test');
      
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Chat Operations', () => {
    test('should send message successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          response: 'AI response',
          conversation_id: 'conv-123',
          message_id: 'msg-456'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.sendMessage('Hello AI');
      
      expect(result.success).toBe(true);
      expect(result.data.response).toBe('AI response');
      expect(fetch).toHaveBeenCalledWith(
        '/wp-json/gary-ai/v1/chat',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"message":"Hello AI"')
        })
      );
    });

    test('should reject empty messages', async () => {
      await expect(apiClient.sendMessage('')).rejects.toThrow('Message is required');
      await expect(apiClient.sendMessage(null)).rejects.toThrow('Message is required');
    });

    test('should include conversation ID in request', async () => {
      const mockResponse = { success: true, data: {} };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await apiClient.sendMessage('Hello', 'conv-123');
      
      expect(fetch).toHaveBeenCalledWith(
        '/wp-json/gary-ai/v1/chat',
        expect.objectContaining({
          body: expect.stringContaining('"conversation_id":"conv-123"')
        })
      );
    });
  });

  describe('Settings Management', () => {
    test('should get settings successfully', async () => {
      const mockSettings = {
        widget_enabled: true,
        widget_position: 'bottom-right',
        widget_theme: 'light'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSettings })
      });

      const settings = await apiClient.getSettings();
      
      expect(settings).toEqual(mockSettings);
    });

    test('should return default settings on failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const settings = await apiClient.getSettings();
      
      expect(settings).toHaveProperty('widget_enabled', true);
      expect(settings).toHaveProperty('widget_position', 'bottom-right');
      expect(settings).toHaveProperty('welcome_message');
    });
  });

  describe('Health Check', () => {
    test('should perform health check successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          status: 'ok',
          timestamp: Date.now()
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.checkHealth();
      
      expect(result.healthy).toBe(true);
      expect(result.status).toBe('ok');
    });

    test('should handle health check failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await apiClient.checkHealth();
      
      expect(result.healthy).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('Session Reconnection', () => {
    test('should reconnect session successfully', async () => {
      // Mock token request
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { token: 'new-token', expires_in: 900 }
        })
      });

      // Mock health check
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { status: 'ok' }
        })
      });

      const result = await apiClient.reconnectSession();
      
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(apiClient.sessionId);
    });

    test('should handle reconnection failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Token request failed'));

      const result = await apiClient.reconnectSession();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Token request failed');
    });
  });

  describe('Conversation Management', () => {
    test('should store conversation state', () => {
      const conversationId = 'conv-123';
      const messages = [
        { id: 'msg-1', content: 'Hello', timestamp: Date.now() }
      ];

      apiClient.storeConversationState(conversationId, messages);
      
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'gary-ai-conversation-state',
        expect.stringContaining(conversationId)
      );
    });

    test('should retrieve stored conversation state', () => {
      const mockState = {
        conversationId: 'conv-123',
        sessionId: 'session-456',
        messageCount: 5,
        storedAt: Date.now()
      };

      sessionStorage.getItem.mockReturnValue(JSON.stringify(mockState));

      const state = apiClient.getStoredConversationState();
      
      expect(state).toEqual(mockState);
    });

    test('should return null for expired conversation state', () => {
      const expiredState = {
        conversationId: 'conv-123',
        storedAt: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      sessionStorage.getItem.mockReturnValue(JSON.stringify(expiredState));

      const state = apiClient.getStoredConversationState();
      
      expect(state).toBeNull();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('gary-ai-conversation-state');
    });

    test('should resume conversation successfully', async () => {
      const mockConversation = {
        id: 'conv-123',
        messages: [
          { id: 'msg-1', content: 'Hello', type: 'user' },
          { id: 'msg-2', content: 'Hi there!', type: 'bot' }
        ]
      };

      // Mock authentication
      apiClient.token = 'valid-token';
      apiClient.tokenExpiry = Date.now() + 10000;

      // Mock conversation fetch
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockConversation
        })
      });

      const result = await apiClient.resumeConversation('conv-123');
      
      expect(result.success).toBe(true);
      expect(result.conversation).toEqual(mockConversation);
      expect(result.messages).toHaveLength(2);
    });
  });

  describe('Utility Methods', () => {
    test('should check if reconnection is needed', () => {
      // No token
      expect(apiClient.needsReconnection()).toBe(true);
      
      // Expired token
      apiClient.token = 'token';
      apiClient.tokenExpiry = Date.now() - 1000;
      expect(apiClient.needsReconnection()).toBe(true);
      
      // Valid token
      apiClient.tokenExpiry = Date.now() + 10000;
      expect(apiClient.needsReconnection()).toBe(false);
    });

    test('should clear authentication', () => {
      apiClient.token = 'test-token';
      apiClient.tokenExpiry = Date.now() + 1000;
      
      apiClient.clearAuth();
      
      expect(apiClient.token).toBeNull();
      expect(apiClient.tokenExpiry).toBeNull();
    });

    test('should destroy client properly', () => {
      apiClient.token = 'test-token';
      apiClient.requestQueue = ['request1', 'request2'];
      apiClient.activeRequests = 2;
      
      apiClient.destroy();
      
      expect(apiClient.token).toBeNull();
      expect(apiClient.requestQueue).toEqual([]);
      expect(apiClient.activeRequests).toBe(0);
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('gary-ai-conversation-state');
    });
  });
});
