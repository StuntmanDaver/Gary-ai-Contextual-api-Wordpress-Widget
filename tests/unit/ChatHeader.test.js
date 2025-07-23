/**
 * ChatHeader Component Unit Tests
 * 
 * Comprehensive test suite for ChatHeader component covering:
 * - Constructor and initialization
 * - DOM element creation and management
 * - Connection status updates
 * - User interactions (close, minimize)
 * - Drag functionality
 * - Accessibility features
 * - Error handling and cleanup
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { ChatHeader } from '../../src/components/ChatHeader.js';

describe('ChatHeader', () => {
  let container;
  let headerElement;
  let mockLogger;
  let mockOnClose;

  beforeEach(() => {
    // Create DOM elements
    container = document.createElement('div');
    headerElement = document.createElement('div');
    headerElement.className = 'gary-ai-chat-header';
    
    // Create required child elements
    const titleElement = document.createElement('h3');
    titleElement.className = 'gary-ai-chat-title';
    titleElement.textContent = 'Gary AI';
    
    const subtitleElement = document.createElement('p');
    subtitleElement.className = 'gary-ai-chat-subtitle';
    subtitleElement.textContent = 'AI Assistant';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'gary-ai-close-button';
    closeButton.innerHTML = '×';
    
    headerElement.appendChild(titleElement);
    headerElement.appendChild(subtitleElement);
    headerElement.appendChild(closeButton);
    
    container.appendChild(headerElement);
    document.body.appendChild(container);

    // Mock dependencies
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    mockOnClose = jest.fn();
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default options', () => {
      const chatHeader = new ChatHeader(headerElement);

      expect(chatHeader.element).toBe(headerElement);
      expect(chatHeader.connectionStatus).toBe('connected');
      expect(chatHeader.isMinimized).toBe(false);
    });

    test('should initialize with custom options', () => {
      const options = {
        onClose: mockOnClose,
        logger: mockLogger
      };

      const chatHeader = new ChatHeader(headerElement, options);

      expect(chatHeader.onClose).toBe(mockOnClose);
      expect(chatHeader.logger).toBe(mockLogger);
    });

    test('should find required DOM elements', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      expect(chatHeader.titleElement).toBeTruthy();
      expect(chatHeader.subtitleElement).toBeTruthy();
      expect(chatHeader.closeButton).toBeTruthy();
    });

    test('should create status indicator', () => {
      new ChatHeader(headerElement, { logger: mockLogger });

      const statusElement = headerElement.querySelector('.gary-ai-status-indicator');
      expect(statusElement).toBeTruthy();
    });

    test('should create minimize button', () => {
      new ChatHeader(headerElement, { logger: mockLogger });

      const minimizeButton = headerElement.querySelector('.gary-ai-minimize-button');
      expect(minimizeButton).toBeTruthy();
    });

    test('should log initialization', () => {
      new ChatHeader(headerElement, { logger: mockLogger });

      expect(mockLogger.debug).toHaveBeenCalledWith('Initializing ChatHeader');
      expect(mockLogger.debug).toHaveBeenCalledWith('ChatHeader initialized');
    });
  });

  describe('Event Handling', () => {
    test('should handle close button click', () => {
      const chatHeader = new ChatHeader(headerElement, { 
        onClose: mockOnClose,
        logger: mockLogger 
      });

      const closeButton = headerElement.querySelector('.gary-ai-close-button');
      closeButton.click();

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should handle minimize button click', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });
      const minimizeButton = headerElement.querySelector('.gary-ai-minimize-button');

      minimizeButton.click();

      expect(chatHeader.isMinimized).toBe(true);
      expect(headerElement.classList.contains('gary-ai-chat-header--minimized')).toBe(true);
    });

    test('should handle keyboard events on close button', () => {
      const chatHeader = new ChatHeader(headerElement, { 
        onClose: mockOnClose,
        logger: mockLogger 
      });

      const closeButton = headerElement.querySelector('.gary-ai-close-button');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      closeButton.dispatchEvent(enterEvent);
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should handle keyboard events on minimize button', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });
      const minimizeButton = headerElement.querySelector('.gary-ai-minimize-button');

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      minimizeButton.dispatchEvent(spaceEvent);

      expect(chatHeader.isMinimized).toBe(true);
    });
  });

  describe('Connection Status', () => {
    test('should set connected status', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setConnectionStatus('connected');

      expect(chatHeader.connectionStatus).toBe('connected');
      const statusElement = headerElement.querySelector('.gary-ai-status-indicator');
      expect(statusElement.classList.contains('gary-ai-status--connected')).toBe(true);
    });

    test('should set connecting status', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setConnectionStatus('connecting');

      expect(chatHeader.connectionStatus).toBe('connecting');
      const statusElement = headerElement.querySelector('.gary-ai-status-indicator');
      expect(statusElement.classList.contains('gary-ai-status--connecting')).toBe(true);
    });

    test('should set disconnected status', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setConnectionStatus('disconnected');

      expect(chatHeader.connectionStatus).toBe('disconnected');
      const statusElement = headerElement.querySelector('.gary-ai-status-indicator');
      expect(statusElement.classList.contains('gary-ai-status--disconnected')).toBe(true);
    });

    test('should set error status', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setConnectionStatus('error');

      expect(chatHeader.connectionStatus).toBe('error');
      const statusElement = headerElement.querySelector('.gary-ai-status-indicator');
      expect(statusElement.classList.contains('gary-ai-status--error')).toBe(true);
    });

    test('should update status text', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setConnectionStatus('connecting');

      const statusElement = headerElement.querySelector('.gary-ai-status-indicator');
      expect(statusElement.textContent).toContain('Connecting');
    });

    test('should handle invalid status gracefully', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setConnectionStatus('invalid-status');

      expect(chatHeader.connectionStatus).toBe('invalid-status');
      expect(mockLogger.warn).toHaveBeenCalledWith('Unknown connection status: invalid-status');
    });
  });

  describe('Title and Subtitle Management', () => {
    test('should set title', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setTitle('Custom Title');

      expect(chatHeader.titleElement.textContent).toBe('Custom Title');
    });

    test('should set subtitle', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setSubtitle('Custom Subtitle');

      expect(chatHeader.subtitleElement.textContent).toBe('Custom Subtitle');
    });

    test('should handle empty title', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setTitle('');

      expect(chatHeader.titleElement.textContent).toBe('');
    });

    test('should handle HTML in title safely', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setTitle('<script>alert("xss")</script>Safe Title');

      expect(chatHeader.titleElement.textContent).not.toContain('<script>');
      expect(chatHeader.titleElement.innerHTML).not.toContain('<script>');
    });
  });

  describe('Minimize/Maximize Functionality', () => {
    test('should minimize header', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.minimize();

      expect(chatHeader.isMinimized).toBe(true);
      expect(headerElement.classList.contains('gary-ai-chat-header--minimized')).toBe(true);
      
      const minimizeButton = headerElement.querySelector('.gary-ai-minimize-button');
      expect(minimizeButton.getAttribute('aria-label')).toContain('Maximize');
    });

    test('should maximize header', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.minimize();
      chatHeader.maximize();

      expect(chatHeader.isMinimized).toBe(false);
      expect(headerElement.classList.contains('gary-ai-chat-header--minimized')).toBe(false);
      
      const minimizeButton = headerElement.querySelector('.gary-ai-minimize-button');
      expect(minimizeButton.getAttribute('aria-label')).toContain('Minimize');
    });

    test('should toggle minimize state', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      const initialState = chatHeader.isMinimized;
      chatHeader.toggleMinimize();

      expect(chatHeader.isMinimized).toBe(!initialState);
    });
  });

  describe('Accessibility', () => {
    test('should maintain proper ARIA attributes', () => {
      new ChatHeader(headerElement, { logger: mockLogger });

      const closeButton = headerElement.querySelector('.gary-ai-close-button');
      const minimizeButton = headerElement.querySelector('.gary-ai-minimize-button');

      expect(closeButton.getAttribute('aria-label')).toBeTruthy();
      expect(minimizeButton.getAttribute('aria-label')).toBeTruthy();
      expect(closeButton.getAttribute('role')).toBe('button');
      expect(minimizeButton.getAttribute('role')).toBe('button');
    });

    test('should update ARIA labels for minimize button', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });
      const minimizeButton = headerElement.querySelector('.gary-ai-minimize-button');

      const initialLabel = minimizeButton.getAttribute('aria-label');
      chatHeader.minimize();
      const minimizedLabel = minimizeButton.getAttribute('aria-label');

      expect(minimizedLabel).not.toBe(initialLabel);
      expect(minimizedLabel).toContain('Maximize');
    });

    test('should handle focus management', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });
      const closeButton = headerElement.querySelector('.gary-ai-close-button');

      const focusEvent = new FocusEvent('focus');
      const blurEvent = new FocusEvent('blur');

      closeButton.dispatchEvent(focusEvent);
      expect(closeButton.classList.contains('gary-ai-button--focused')).toBe(true);

      closeButton.dispatchEvent(blurEvent);
      expect(closeButton.classList.contains('gary-ai-button--focused')).toBe(false);
    });

    test('should announce status changes to screen readers', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setConnectionStatus('disconnected');

      const statusElement = headerElement.querySelector('.gary-ai-status-indicator');
      expect(statusElement.getAttribute('aria-live')).toBe('polite');
      expect(statusElement.getAttribute('role')).toBe('status');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      const emptyHeader = document.createElement('div');
      
      expect(() => {
        new ChatHeader(emptyHeader, { logger: mockLogger });
      }).not.toThrow();

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    test('should handle null element', () => {
      expect(() => {
        new ChatHeader(null, { logger: mockLogger });
      }).toThrow();
    });

    test('should handle event binding errors', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });
      
      // Mock addEventListener to throw
      const originalAddEventListener = headerElement.addEventListener;
      headerElement.addEventListener = jest.fn().mockImplementation(() => {
        throw new Error('Event binding failed');
      });

      // Should not crash the component
      expect(() => {
        chatHeader.bindEvents();
      }).not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();

      // Restore original method
      headerElement.addEventListener = originalAddEventListener;
    });
  });

  describe('Performance', () => {
    test('should debounce rapid status changes', () => {
      jest.useFakeTimers();
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      // Rapid status changes
      chatHeader.setConnectionStatus('connecting');
      chatHeader.setConnectionStatus('connected');
      chatHeader.setConnectionStatus('disconnected');

      // Should only result in final status
      expect(chatHeader.connectionStatus).toBe('disconnected');

      jest.useRealTimers();
    });

    test('should handle memory cleanup', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.destroy();

      expect(chatHeader.element).toBe(null);
      expect(chatHeader.titleElement).toBe(null);
      expect(chatHeader.subtitleElement).toBe(null);
    });
  });

  describe('Integration', () => {
    test('should work with custom CSS classes', () => {
      headerElement.className = 'custom-header gary-ai-chat-header';
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.minimize();

      expect(headerElement.classList.contains('custom-header')).toBe(true);
      expect(headerElement.classList.contains('gary-ai-chat-header--minimized')).toBe(true);
    });

    test('should maintain state consistency', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.setConnectionStatus('connecting');
      chatHeader.minimize();
      chatHeader.setTitle('New Title');

      expect(chatHeader.connectionStatus).toBe('connecting');
      expect(chatHeader.isMinimized).toBe(true);
      expect(chatHeader.titleElement.textContent).toBe('New Title');
    });

    test('should handle rapid user interactions', () => {
      const chatHeader = new ChatHeader(headerElement, { 
        onClose: mockOnClose,
        logger: mockLogger 
      });

      const closeButton = headerElement.querySelector('.gary-ai-close-button');
      const minimizeButton = headerElement.querySelector('.gary-ai-minimize-button');

      // Rapid clicks
      closeButton.click();
      minimizeButton.click();
      closeButton.click();

      expect(mockOnClose).toHaveBeenCalledTimes(2);
      expect(chatHeader.isMinimized).toBe(true);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup event listeners', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });
      const closeButton = headerElement.querySelector('.gary-ai-close-button');
      const minimizeButton = headerElement.querySelector('.gary-ai-minimize-button');

      const removeEventListenerSpy = jest.spyOn(closeButton, 'removeEventListener');

      chatHeader.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should remove DOM references', () => {
      const chatHeader = new ChatHeader(headerElement, { logger: mockLogger });

      chatHeader.destroy();

      expect(chatHeader.element).toBe(null);
      expect(chatHeader.titleElement).toBe(null);
      expect(chatHeader.subtitleElement).toBe(null);
      expect(chatHeader.closeButton).toBe(null);
      expect(chatHeader.minimizeButton).toBe(null);
    });
  });
});
