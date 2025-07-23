/**
 * Component Integration Tests
 * 
 * Comprehensive integration testing for all Gary AI chat widget components
 * covering component interactions, data flow validation, and system integration.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Import all components for integration testing
import { ChatWidget } from '../../src/components/ChatWidget.js';
import { ChatButton } from '../../src/components/ChatButton.js';
import { ChatHeader } from '../../src/components/ChatHeader.js';
import { InputArea } from '../../src/components/InputArea.js';
import { MessageList } from '../../src/components/MessageList.js';
import { TypingIndicator } from '../../src/components/TypingIndicator.js';
import { ApiClient } from '../../src/utils/ApiClient.js';
import { Logger } from '../../src/utils/Logger.js';

describe('Component Integration Tests', () => {
  let dom;
  let document;
  let window;
  let container;
  let mockApiClient;
  let mockLogger;

  beforeEach(() => {
    // Setup JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <div id="test-container"></div>
        </body>
      </html>
    `, { 
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;

    // Setup container
    container = document.getElementById('test-container');

    // Mock WordPress globals
    window.garyAI = {
      restUrl: '/wp-json/gary-ai/v1',
      nonce: 'test-nonce-123',
      debug: true
    };

    // Mock API client
    mockApiClient = {
      sendMessage: jest.fn().mockResolvedValue({
        message: 'Test response',
        conversationId: 'conv-123',
        messageId: 'msg-456'
      }),
      getToken: jest.fn().mockResolvedValue({ token: 'test-token' }),
      healthCheck: jest.fn().mockResolvedValue({ status: 'ok' }),
      connect: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn()
    };

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis()
    };

    // Mock DOM APIs
    window.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    window.cancelAnimationFrame = jest.fn();
    window.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));

    // Mock clipboard API
    Object.defineProperty(window.navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined)
      },
      writable: true
    });
  });

  afterEach(() => {
    dom.window.close();
    jest.clearAllMocks();
  });

  describe('Full Widget Integration', () => {
    test('should initialize all components together', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      // Verify all components are initialized
      expect(chatWidget.chatButton).toBeDefined();
      expect(chatWidget.chatHeader).toBeDefined();
      expect(chatWidget.inputArea).toBeDefined();
      expect(chatWidget.messageList).toBeDefined();
      expect(chatWidget.typingIndicator).toBeDefined();

      // Verify DOM structure
      const widgetElement = container.querySelector('.gary-ai-chat-widget');
      expect(widgetElement).toBeTruthy();
      
      const buttonElement = widgetElement.querySelector('.gary-ai-chat-button');
      const headerElement = widgetElement.querySelector('.gary-ai-chat-header');
      const messagesElement = widgetElement.querySelector('.gary-ai-message-list');
      const inputElement = widgetElement.querySelector('.gary-ai-input-area');
      
      expect(buttonElement).toBeTruthy();
      expect(headerElement).toBeTruthy();
      expect(messagesElement).toBeTruthy();
      expect(inputElement).toBeTruthy();
    });

    test('should handle complete user interaction flow', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      // 1. User clicks chat button to open widget
      const chatButton = container.querySelector('.gary-ai-chat-button');
      chatButton.click();

      expect(chatWidget.isOpen).toBe(true);
      expect(container.querySelector('.gary-ai-chat-widget--open')).toBeTruthy();

      // 2. User types a message
      const inputField = container.querySelector('.gary-ai-input-field');
      const sendButton = container.querySelector('.gary-ai-send-button');

      inputField.value = 'Hello, I need help';
      inputField.dispatchEvent(new window.Event('input'));

      // 3. User sends the message
      sendButton.click();

      // Verify message was sent to API
      expect(mockApiClient.sendMessage).toHaveBeenCalledWith(
        'Hello, I need help',
        expect.any(String)
      );

      // 4. Verify typing indicator shows
      const typingIndicator = container.querySelector('.gary-ai-typing-indicator');
      expect(typingIndicator).toBeTruthy();

      // 5. Wait for response and verify message appears
      await new Promise(resolve => setTimeout(resolve, 100));

      const messages = container.querySelectorAll('.gary-ai-message');
      expect(messages.length).toBeGreaterThan(0);

      // 6. User closes widget
      const closeButton = container.querySelector('.gary-ai-close-button');
      closeButton.click();

      expect(chatWidget.isOpen).toBe(false);
    });
  });

  describe('Component Communication', () => {
    test('should handle data flow between components', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      // Test InputArea -> MessageList communication
      const userMessage = 'Test user message';
      await chatWidget.inputArea.sendMessage(userMessage);

      // Verify message appears in MessageList
      const messageElements = container.querySelectorAll('.gary-ai-message--user');
      expect(messageElements.length).toBe(1);
      expect(messageElements[0].textContent).toContain(userMessage);

      // Test API response -> MessageList communication
      const apiResponse = {
        message: 'Test assistant response',
        conversationId: 'conv-123',
        messageId: 'msg-456'
      };

      mockApiClient.sendMessage.mockResolvedValueOnce(apiResponse);
      await chatWidget.inputArea.sendMessage('Another message');

      // Verify assistant message appears
      await new Promise(resolve => setTimeout(resolve, 100));
      const assistantMessages = container.querySelectorAll('.gary-ai-message--assistant');
      expect(assistantMessages.length).toBe(1);
    });

    test('should handle error propagation between components', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      // Mock API error
      const apiError = new Error('API connection failed');
      mockApiClient.sendMessage.mockRejectedValueOnce(apiError);

      // Send message that will fail
      await chatWidget.inputArea.sendMessage('Test message');

      // Verify error is logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send message'),
        expect.any(Error)
      );

      // Verify error message appears in UI
      const errorMessages = container.querySelectorAll('.gary-ai-message--error');
      expect(errorMessages.length).toBe(1);
    });
  });

  describe('State Management Integration', () => {
    test('should maintain consistent state across components', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      // Test conversation state
      expect(chatWidget.conversationId).toBeDefined();
      expect(chatWidget.messageList.conversationId).toBe(chatWidget.conversationId);

      // Test open/close state
      chatWidget.open();
      expect(chatWidget.isOpen).toBe(true);
      expect(chatWidget.chatButton.isOpen).toBe(true);

      chatWidget.close();
      expect(chatWidget.isOpen).toBe(false);
      expect(chatWidget.chatButton.isOpen).toBe(false);

      // Test loading state
      chatWidget.setLoading(true);
      expect(chatWidget.isLoading).toBe(true);
      expect(chatWidget.inputArea.isDisabled).toBe(true);
      expect(chatWidget.typingIndicator.isVisible).toBe(true);
    });

    test('should handle concurrent state changes', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      // Simulate rapid state changes
      chatWidget.open();
      chatWidget.setLoading(true);
      chatWidget.setLoading(false);
      chatWidget.close();

      // Verify final state is consistent
      expect(chatWidget.isOpen).toBe(false);
      expect(chatWidget.isLoading).toBe(false);
      expect(chatWidget.typingIndicator.isVisible).toBe(false);
    });
  });

  describe('Event System Integration', () => {
    test('should handle custom events between components', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      const eventSpy = jest.fn();
      chatWidget.addEventListener('message-sent', eventSpy);

      // Send a message
      await chatWidget.inputArea.sendMessage('Test message');

      // Verify event was fired
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'message-sent',
          detail: expect.objectContaining({
            message: 'Test message'
          })
        })
      );
    });

    test('should handle DOM events across components', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      // Test keyboard events
      const inputField = container.querySelector('.gary-ai-input-field');
      
      // Test Enter key to send message
      const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
      inputField.value = 'Test message';
      inputField.dispatchEvent(enterEvent);

      expect(mockApiClient.sendMessage).toHaveBeenCalled();

      // Test Escape key to close widget
      const escapeEvent = new window.KeyboardEvent('keydown', { key: 'Escape' });
      container.dispatchEvent(escapeEvent);

      expect(chatWidget.isOpen).toBe(false);
    });
  });

  describe('Accessibility Integration', () => {
    test('should maintain accessibility across all components', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      // Verify ARIA attributes are properly set
      const widgetElement = container.querySelector('.gary-ai-chat-widget');
      expect(widgetElement.getAttribute('role')).toBe('dialog');
      expect(widgetElement.getAttribute('aria-label')).toBeTruthy();

      // Verify focus management
      chatWidget.open();
      const focusedElement = document.activeElement;
      expect(focusedElement.classList.contains('gary-ai-input-field')).toBe(true);

      // Verify screen reader announcements
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
    });

    test('should handle keyboard navigation across components', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();
      chatWidget.open();

      // Test Tab navigation
      const tabEvent = new window.KeyboardEvent('keydown', { key: 'Tab' });
      
      // Should cycle through focusable elements
      const focusableElements = container.querySelectorAll(
        'button, input, [tabindex="0"]'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);

      // Test focus trap when widget is open
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      expect(firstElement).toBeTruthy();
      expect(lastElement).toBeTruthy();
    });
  });

  describe('Performance Integration', () => {
    test('should handle large message volumes efficiently', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      // Add many messages
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        chatWidget.messageList.addMessage(
          `Message ${i}`, 
          i % 2 === 0 ? 'user' : 'assistant'
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);

      // Verify all messages are rendered
      const messageElements = container.querySelectorAll('.gary-ai-message');
      expect(messageElements.length).toBe(100);
    });

    test('should cleanup resources properly', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      // Add event listeners and timers
      chatWidget.open();
      await chatWidget.inputArea.sendMessage('Test message');

      // Destroy widget
      chatWidget.destroy();

      // Verify cleanup
      expect(container.innerHTML).toBe('');
      expect(mockApiClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('Error Recovery Integration', () => {
    test('should recover from component failures gracefully', async () => {
      const chatWidget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: container
      });

      await chatWidget.mount();

      // Simulate component failure
      const originalAddMessage = chatWidget.messageList.addMessage;
      chatWidget.messageList.addMessage = jest.fn().mockImplementation(() => {
        throw new Error('Component failure');
      });

      // Send message that will cause component failure
      await chatWidget.inputArea.sendMessage('Test message');

      // Verify error is handled gracefully
      expect(mockLogger.error).toHaveBeenCalled();
      expect(chatWidget.isOpen).toBe(true); // Widget should remain functional

      // Restore component and verify recovery
      chatWidget.messageList.addMessage = originalAddMessage;
      await chatWidget.inputArea.sendMessage('Recovery test');

      // Should work normally after recovery
      expect(mockApiClient.sendMessage).toHaveBeenCalledWith(
        'Recovery test',
        expect.any(String)
      );
    });
  });
});
