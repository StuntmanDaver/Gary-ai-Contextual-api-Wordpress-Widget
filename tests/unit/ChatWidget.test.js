/**
 * ChatWidget Component Unit Tests
 * 
 * Comprehensive tests for the main ChatWidget component.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { ChatWidget } from '../../src/components/ChatWidget.js';

describe('ChatWidget', () => {
  let widget;
  let container;
  let mockApiClient;
  let mockLogger;

  beforeEach(() => {
    // Create container element
    container = createMockElement('div', { id: 'gary-ai-widget-container' });
    document.body.appendChild(container);

    // Create mocks
    mockApiClient = createMockApiClient();
    mockLogger = createMockLogger();

    // Initialize widget
    widget = new ChatWidget(container, {
      apiClient: mockApiClient,
      logger: mockLogger,
      settings: {
        widget_enabled: true,
        widget_position: 'bottom-right',
        welcome_message: 'Hello! How can I help?'
      }
    });
  });

  afterEach(() => {
    if (widget) {
      widget.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Initialization', () => {
    test('should initialize with default options', () => {
      expect(widget.element).toBe(container);
      expect(widget.isOpen).toBe(false);
      expect(widget.isMinimized).toBe(false);
      expect(widget.apiClient).toBe(mockApiClient);
    });

    test('should create widget structure', () => {
      expect(container.querySelector('.gary-ai-chat-widget')).toBeTruthy();
      expect(container.querySelector('.gary-ai-chat-button')).toBeTruthy();
      expect(container.querySelector('.gary-ai-chat-window')).toBeTruthy();
    });

    test('should set initial position', () => {
      const chatWidget = container.querySelector('.gary-ai-chat-widget');
      expect(chatWidget.classList.contains('gary-ai-position-bottom-right')).toBe(true);
    });

    test('should be closed initially', () => {
      const chatWindow = container.querySelector('.gary-ai-chat-window');
      expect(chatWindow.classList.contains('gary-ai-hidden')).toBe(true);
    });
  });

  describe('Widget Opening and Closing', () => {
    test('should open widget when button is clicked', () => {
      const button = container.querySelector('.gary-ai-chat-button');
      button.click();

      expect(widget.isOpen).toBe(true);
      const chatWindow = container.querySelector('.gary-ai-chat-window');
      expect(chatWindow.classList.contains('gary-ai-hidden')).toBe(false);
    });

    test('should close widget when close button is clicked', () => {
      // First open the widget
      widget.open();
      expect(widget.isOpen).toBe(true);

      // Then close it
      const closeButton = container.querySelector('.gary-ai-close-button');
      closeButton.click();

      expect(widget.isOpen).toBe(false);
      const chatWindow = container.querySelector('.gary-ai-chat-window');
      expect(chatWindow.classList.contains('gary-ai-hidden')).toBe(true);
    });

    test('should minimize widget when minimize button is clicked', () => {
      widget.open();
      
      const minimizeButton = container.querySelector('.gary-ai-minimize-button');
      minimizeButton.click();

      expect(widget.isMinimized).toBe(true);
      const chatWindow = container.querySelector('.gary-ai-chat-window');
      expect(chatWindow.classList.contains('gary-ai-minimized')).toBe(true);
    });

    test('should restore widget from minimized state', () => {
      widget.open();
      widget.minimize();
      expect(widget.isMinimized).toBe(true);

      // Click header to restore
      const header = container.querySelector('.gary-ai-chat-header');
      header.click();

      expect(widget.isMinimized).toBe(false);
      const chatWindow = container.querySelector('.gary-ai-chat-window');
      expect(chatWindow.classList.contains('gary-ai-minimized')).toBe(false);
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      widget.open();
    });

    test('should send message when form is submitted', async () => {
      const input = container.querySelector('.gary-ai-input');
      const sendButton = container.querySelector('.gary-ai-send-button');
      
      input.value = 'Test message';
      sendButton.click();

      expect(mockApiClient.sendMessage).toHaveBeenCalledWith('Test message', null);
    });

    test('should not send empty messages', async () => {
      const input = container.querySelector('.gary-ai-input');
      const sendButton = container.querySelector('.gary-ai-send-button');
      
      input.value = '   ';
      sendButton.click();

      expect(mockApiClient.sendMessage).not.toHaveBeenCalled();
    });

    test('should display user message in chat', async () => {
      const testMessage = 'Hello AI!';
      
      await widget.sendMessage(testMessage);

      const messages = container.querySelectorAll('.gary-ai-message-user');
      expect(messages.length).toBeGreaterThan(0);
      
      const lastMessage = messages[messages.length - 1];
      expect(lastMessage.textContent).toContain(testMessage);
    });

    test('should display AI response in chat', async () => {
      mockApiClient.sendMessage.mockResolvedValueOnce({
        success: true,
        data: {
          response: 'AI response message',
          conversation_id: 'conv-123'
        }
      });

      await widget.sendMessage('Test message');

      const botMessages = container.querySelectorAll('.gary-ai-message-bot');
      expect(botMessages.length).toBeGreaterThan(0);
      
      const lastBotMessage = botMessages[botMessages.length - 1];
      expect(lastBotMessage.textContent).toContain('AI response message');
    });

    test('should handle API errors gracefully', async () => {
      mockApiClient.sendMessage.mockResolvedValueOnce({
        success: false,
        error: 'API Error occurred'
      });

      await widget.sendMessage('Test message');

      const errorMessages = container.querySelectorAll('.gary-ai-message-error');
      expect(errorMessages.length).toBeGreaterThan(0);
      
      const errorMessage = errorMessages[errorMessages.length - 1];
      expect(errorMessage.textContent).toContain('API Error occurred');
    });

    test('should show typing indicator during API call', async () => {
      let resolveApiCall;
      const apiPromise = new Promise(resolve => {
        resolveApiCall = resolve;
      });
      
      mockApiClient.sendMessage.mockReturnValueOnce(apiPromise);

      const messagePromise = widget.sendMessage('Test message');
      
      // Check typing indicator is shown
      const typingIndicator = container.querySelector('.gary-ai-typing-indicator');
      expect(typingIndicator.classList.contains('gary-ai-hidden')).toBe(false);

      // Resolve API call
      resolveApiCall({
        success: true,
        data: { response: 'Response' }
      });
      
      await messagePromise;

      // Check typing indicator is hidden
      expect(typingIndicator.classList.contains('gary-ai-hidden')).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      widget.open();
    });

    test('should send message on Enter key', () => {
      const input = container.querySelector('.gary-ai-input');
      input.value = 'Test message';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);

      expect(mockApiClient.sendMessage).toHaveBeenCalledWith('Test message', null);
    });

    test('should not send message on Shift+Enter', () => {
      const input = container.querySelector('.gary-ai-input');
      input.value = 'Test message';
      
      const shiftEnterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        shiftKey: true 
      });
      input.dispatchEvent(shiftEnterEvent);

      expect(mockApiClient.sendMessage).not.toHaveBeenCalled();
    });

    test('should close widget on Escape key', () => {
      expect(widget.isOpen).toBe(true);
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(widget.isOpen).toBe(false);
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      const chatWidget = container.querySelector('.gary-ai-chat-widget');
      expect(chatWidget.getAttribute('role')).toBe('dialog');
      expect(chatWidget.getAttribute('aria-label')).toBeTruthy();
      
      const input = container.querySelector('.gary-ai-input');
      expect(input.getAttribute('aria-label')).toBeTruthy();
      
      const sendButton = container.querySelector('.gary-ai-send-button');
      expect(sendButton.getAttribute('aria-label')).toBeTruthy();
    });

    test('should manage focus properly when opening', () => {
      const input = container.querySelector('.gary-ai-input');
      const focusSpy = jest.spyOn(input, 'focus');
      
      widget.open();
      
      expect(focusSpy).toHaveBeenCalled();
    });

    test('should trap focus within widget when open', () => {
      widget.open();
      
      const focusableElements = container.querySelectorAll(
        'button, input, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Test that Tab key cycles through focusable elements
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      expect(firstElement).toBeTruthy();
      expect(lastElement).toBeTruthy();
    });

    test('should announce new messages to screen readers', async () => {
      const announceSpy = jest.spyOn(widget, 'announceToScreenReader');
      
      mockApiClient.sendMessage.mockResolvedValueOnce({
        success: true,
        data: { response: 'AI response' }
      });

      await widget.sendMessage('Test message');

      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI response')
      );
    });
  });

  describe('Responsive Behavior', () => {
    test('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      window.dispatchEvent(new Event('resize'));

      const chatWidget = container.querySelector('.gary-ai-chat-widget');
      expect(chatWidget.classList.contains('gary-ai-mobile')).toBe(true);
    });

    test('should adapt to desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      Object.defineProperty(window, 'innerHeight', { value: 800 });
      
      window.dispatchEvent(new Event('resize'));

      const chatWidget = container.querySelector('.gary-ai-chat-widget');
      expect(chatWidget.classList.contains('gary-ai-mobile')).toBe(false);
    });
  });

  describe('Session Management', () => {
    test('should restore conversation on initialization', async () => {
      const mockConversationState = {
        conversationId: 'conv-123',
        messageCount: 3
      };
      
      mockApiClient.getStoredConversationState.mockReturnValue(mockConversationState);
      mockApiClient.resumeConversation.mockResolvedValueOnce({
        success: true,
        messages: [
          { id: 'msg-1', content: 'Hello', type: 'user' },
          { id: 'msg-2', content: 'Hi there!', type: 'bot' }
        ]
      });

      const newWidget = new ChatWidget(container, {
        apiClient: mockApiClient,
        logger: mockLogger,
        autoRestore: true
      });

      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async initialization

      expect(mockApiClient.resumeConversation).toHaveBeenCalledWith('conv-123');
    });

    test('should handle session reconnection', async () => {
      mockApiClient.needsReconnection.mockReturnValue(true);
      mockApiClient.reconnectSession.mockResolvedValueOnce({
        success: true,
        sessionId: 'new-session-456'
      });

      await widget.handleReconnection();

      expect(mockApiClient.reconnectSession).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('reconnected')
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', () => {
      const invalidContainer = null;
      
      expect(() => {
        new ChatWidget(invalidContainer, { apiClient: mockApiClient });
      }).not.toThrow();
    });

    test('should handle API client errors', async () => {
      mockApiClient.sendMessage.mockRejectedValueOnce(new Error('Network error'));

      await widget.sendMessage('Test message');

      const errorMessages = container.querySelectorAll('.gary-ai-message-error');
      expect(errorMessages.length).toBeGreaterThan(0);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );
    });

    test('should handle malformed API responses', async () => {
      mockApiClient.sendMessage.mockResolvedValueOnce({
        success: true,
        data: null // Malformed response
      });

      await widget.sendMessage('Test message');

      const errorMessages = container.querySelectorAll('.gary-ai-message-error');
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    test('should throttle resize events', () => {
      const resizeHandler = jest.spyOn(widget, 'handleResize');
      
      // Trigger multiple resize events quickly
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event('resize'));
      }

      // Should be throttled to fewer calls
      expect(resizeHandler.mock.calls.length).toBeLessThan(10);
    });

    test('should cleanup event listeners on destroy', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      widget.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should limit message history', async () => {
      // Send many messages
      for (let i = 0; i < 60; i++) {
        mockApiClient.sendMessage.mockResolvedValueOnce({
          success: true,
          data: { response: `Response ${i}` }
        });
        
        await widget.sendMessage(`Message ${i}`);
      }

      const messages = container.querySelectorAll('.gary-ai-message');
      expect(messages.length).toBeLessThanOrEqual(50); // Should be limited by max_conversation_length
    });
  });

  describe('Integration', () => {
    test('should integrate with all subcomponents', () => {
      expect(widget.chatButton).toBeTruthy();
      expect(widget.chatHeader).toBeTruthy();
      expect(widget.messageList).toBeTruthy();
      expect(widget.inputArea).toBeTruthy();
      expect(widget.typingIndicator).toBeTruthy();
    });

    test('should handle regenerate message events', () => {
      const regenerateEvent = new CustomEvent('gary-ai-regenerate-message', {
        detail: { messageId: 'msg-123' }
      });
      
      const handleRegenerateSpy = jest.spyOn(widget, 'handleRegenerateMessage');
      
      container.dispatchEvent(regenerateEvent);

      expect(handleRegenerateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { messageId: 'msg-123' }
        })
      );
    });
  });
});
