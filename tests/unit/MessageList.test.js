/**
 * MessageList Component Unit Tests
 * 
 * Comprehensive test suite for MessageList component covering:
 * - Constructor and initialization
 * - Message addition and rendering
 * - Markdown processing and rendering
 * - Auto-scroll behavior and controls
 * - Message interactions and actions
 * - Scroll detection and visibility
 * - Accessibility features
 * - Error handling and cleanup
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { MessageList } from '../../src/components/MessageList.js';
import { MarkdownRenderer } from '../../src/utils/MarkdownRenderer.js';

describe('MessageList', () => {
  let container;
  let messageListElement;
  let mockLogger;

  beforeEach(() => {
    // Create DOM elements
    container = document.createElement('div');
    messageListElement = document.createElement('div');
    messageListElement.className = 'gary-ai-message-list';
    
    // Create required child elements
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'gary-ai-scroll-container';
    
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'gary-ai-messages-container';
    messagesContainer.setAttribute('role', 'log');
    messagesContainer.setAttribute('aria-live', 'polite');
    
    scrollContainer.appendChild(messagesContainer);
    messageListElement.appendChild(scrollContainer);
    
    container.appendChild(messageListElement);
    document.body.appendChild(container);

    // Mock dependencies
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
      callback
    }));

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    });

    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default options', () => {
      const messageList = new MessageList(messageListElement);

      expect(messageList.element).toBe(messageListElement);
      expect(messageList.logger).toBe(console);
      expect(messageList.messages).toEqual([]);
      expect(messageList.isAutoScrollEnabled).toBe(true);
      expect(messageList.lastScrollTop).toBe(0);
    });

    test('should initialize with custom options', () => {
      const messageList = new MessageList(messageListElement, {
        logger: mockLogger
      });

      expect(messageList.logger).toBe(mockLogger);
      expect(mockLogger.debug).toHaveBeenCalledWith('Initializing MessageList');
    });

    test('should find required DOM elements', () => {
      const messageList = new MessageList(messageListElement, { logger: mockLogger });

      expect(messageList.scrollContainer).toBeTruthy();
      expect(messageList.messagesContainer).toBeTruthy();
    });

    test('should setup intersection observer', () => {
      new MessageList(messageListElement, { logger: mockLogger });

      expect(global.IntersectionObserver).toHaveBeenCalled();
    });

    test('should initialize MarkdownRenderer', () => {
      const messageList = new MessageList(messageListElement, { logger: mockLogger });

      expect(messageList.markdownRenderer).toBeInstanceOf(MarkdownRenderer);
    });
  });

  describe('Message Addition and Rendering', () => {
    let messageList;

    beforeEach(() => {
      messageList = new MessageList(messageListElement, { logger: mockLogger });
    });

    test('should add a valid message', () => {
      const message = {
        id: '1',
        type: 'user',
        content: 'Hello world',
        timestamp: new Date().toISOString()
      };

      messageList.addMessage(message);

      expect(messageList.messages).toContain(message);
      expect(messageList.messagesContainer.children.length).toBe(1);
      expect(mockLogger.debug).toHaveBeenCalledWith('Adding message:', message);
    });

    test('should reject invalid messages', () => {
      const invalidMessage = { id: '1' }; // Missing content

      messageList.addMessage(invalidMessage);

      expect(messageList.messages).not.toContain(invalidMessage);
      expect(messageList.messagesContainer.children.length).toBe(0);
      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid message provided');
    });

    test('should handle null or undefined messages', () => {
      messageList.addMessage(null);
      messageList.addMessage(undefined);

      expect(messageList.messages.length).toBe(0);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });

    test('should create message element with correct structure', () => {
      const message = {
        id: '1',
        type: 'bot',
        content: 'Hello from bot',
        timestamp: new Date().toISOString()
      };

      messageList.addMessage(message);

      const messageElement = messageList.messagesContainer.firstChild;
      expect(messageElement.classList.contains('gary-ai-message')).toBe(true);
      expect(messageElement.classList.contains('gary-ai-message-bot')).toBe(true);
      expect(messageElement.getAttribute('data-message-id')).toBe('1');
    });

    test('should render markdown content', () => {
      const message = {
        id: '1',
        type: 'bot',
        content: '**Bold text** and `code`',
        timestamp: new Date().toISOString()
      };

      const renderSpy = jest.spyOn(messageList.markdownRenderer, 'render');
      messageList.addMessage(message);

      expect(renderSpy).toHaveBeenCalledWith('**Bold text** and `code`');
    });
  });

  describe('Auto-Scroll Behavior', () => {
    let messageList;

    beforeEach(() => {
      messageList = new MessageList(messageListElement, { logger: mockLogger });
    });

    test('should auto-scroll when enabled', () => {
      const scrollToBottomSpy = jest.spyOn(messageList, 'scrollToBottom');
      messageList.isAutoScrollEnabled = true;

      const message = {
        id: '1',
        type: 'bot',
        content: 'Test message',
        timestamp: new Date().toISOString()
      };

      messageList.addMessage(message);

      expect(scrollToBottomSpy).toHaveBeenCalled();
    });

    test('should not auto-scroll when disabled', () => {
      const scrollToBottomSpy = jest.spyOn(messageList, 'scrollToBottom');
      messageList.isAutoScrollEnabled = false;

      const message = {
        id: '1',
        type: 'bot',
        content: 'Test message',
        timestamp: new Date().toISOString()
      };

      messageList.addMessage(message);

      expect(scrollToBottomSpy).not.toHaveBeenCalled();
    });

    test('should scroll to bottom smoothly', () => {
      const scrollIntoViewSpy = jest.fn();
      messageList.messagesContainer.scrollIntoView = scrollIntoViewSpy;

      messageList.scrollToBottom();

      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'end'
      });
    });
  });

  describe('Message Interactions', () => {
    let messageList;

    beforeEach(() => {
      messageList = new MessageList(messageListElement, { logger: mockLogger });
    });

    test('should handle code copy button clicks', () => {
      const copyButton = document.createElement('button');
      copyButton.className = 'gary-ai-copy-button';
      copyButton.setAttribute('data-code', 'console.log("Hello");');
      messageList.messagesContainer.appendChild(copyButton);

      const handleCopyCodeSpy = jest.spyOn(messageList, 'handleCopyCode');
      copyButton.click();

      expect(handleCopyCodeSpy).toHaveBeenCalled();
    });

    test('should copy code to clipboard', async () => {
      const event = {
        target: {
          getAttribute: jest.fn().mockReturnValue('console.log("test");')
        }
      };

      await messageList.handleCopyCode(event);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('console.log("test");');
    });
  });

  describe('Error Handling and Cleanup', () => {
    test('should handle missing DOM elements gracefully', () => {
      const emptyElement = document.createElement('div');
      
      expect(() => {
        new MessageList(emptyElement, { logger: mockLogger });
      }).not.toThrow();
    });

    test('should handle intersection observer errors', () => {
      global.IntersectionObserver = undefined;
      
      expect(() => {
        new MessageList(messageListElement, { logger: mockLogger });
      }).not.toThrow();
    });

    test('should clean up intersection observer on destroy', () => {
      const messageList = new MessageList(messageListElement, { logger: mockLogger });
      const disconnectSpy = jest.spyOn(messageList.scrollObserver, 'disconnect');
      
      messageList.destroy();
      
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});

      // Should not cause performance issues
      expect(messageList.messages).toHaveLength(100);
    });

    test('should cleanup intersection observer', () => {
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };

      global.IntersectionObserver = jest.fn().mockImplementation(() => mockObserver);

      const messageList = new MessageList(messageListElement, { logger: mockLogger });
      messageList.destroy();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    test('should work with custom CSS classes', () => {
      messageListElement.className = 'custom-list gary-ai-message-list';
      const messageList = new MessageList(messageListElement, { logger: mockLogger });

      messageList.addMessage('Test message', 'user');

      expect(messageListElement.classList.contains('custom-list')).toBe(true);
      
      const messageElement = messageListElement.querySelector('.gary-ai-message');
      expect(messageElement.classList.contains('gary-ai-message--user')).toBe(true);
    });

    test('should maintain state consistency', () => {
      const messageList = new MessageList(messageListElement, { logger: mockLogger });

      messageList.addMessage('Message 1', 'user');
      messageList.addMessage('Message 2', 'assistant');
      messageList.isAutoScrollEnabled = false;

      expect(messageList.messages).toHaveLength(2);
      expect(messageList.isAutoScrollEnabled).toBe(false);
    });

    test('should handle rapid message additions', () => {
      const messageList = new MessageList(messageListElement, { logger: mockLogger });

      // Rapid message additions
      for (let i = 0; i < 10; i++) {
        messageList.addMessage(`Rapid message ${i}`, 'assistant');
      }

      expect(messageList.messages).toHaveLength(10);
      
      const messageElements = messageListElement.querySelectorAll('.gary-ai-message');
      expect(messageElements).toHaveLength(10);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup event listeners', () => {
      const messageList = new MessageList(messageListElement, { logger: mockLogger });
      const scrollContainer = messageListElement.querySelector('.gary-ai-scroll-container');

      const removeEventListenerSpy = jest.spyOn(scrollContainer, 'removeEventListener');

      messageList.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    test('should remove DOM references', () => {
      const messageList = new MessageList(messageListElement, { logger: mockLogger });

      messageList.destroy();

      expect(messageList.element).toBe(null);
      expect(messageList.scrollContainer).toBe(null);
      expect(messageList.messagesContainer).toBe(null);
    });

    test('should clear message array', () => {
      const messageList = new MessageList(messageListElement, { logger: mockLogger });

      messageList.addMessage('Test message', 'user');
      messageList.destroy();

      expect(messageList.messages).toHaveLength(0);
    });
  });
});
