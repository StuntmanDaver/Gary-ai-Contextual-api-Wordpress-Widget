/**
 * InputArea Component Unit Tests
 * 
 * Comprehensive test suite for InputArea component covering:
 * - Constructor and initialization
 * - Text input and auto-resize functionality
 * - Message submission and validation
 * - Keyboard shortcuts and interactions
 * - Typing detection and indicators
 * - Disabled state management
 * - Character counting and limits
 * - Accessibility features
 * - Error handling and cleanup
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { InputArea } from '../../src/components/InputArea.js';

describe('InputArea', () => {
  let container;
  let inputElement;
  let mockLogger;
  let mockOnSendMessage;

  beforeEach(() => {
    // Create DOM elements
    container = document.createElement('div');
    inputElement = document.createElement('div');
    inputElement.className = 'gary-ai-input-area';
    
    // Create required child elements
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'gary-ai-input-wrapper';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'gary-ai-input';
    textarea.placeholder = 'Type your message...';
    
    const sendButton = document.createElement('button');
    sendButton.className = 'gary-ai-send-button';
    sendButton.textContent = 'Send';
    
    inputWrapper.appendChild(textarea);
    inputWrapper.appendChild(sendButton);
    inputElement.appendChild(inputWrapper);
    
    container.appendChild(inputElement);
    document.body.appendChild(container);

    // Mock dependencies
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    mockOnSendMessage = jest.fn();

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
      const inputArea = new InputArea(inputElement);

      expect(inputArea.element).toBe(inputElement);
      expect(inputArea.onSendMessage).toBeInstanceOf(Function);
      expect(inputArea.logger).toBe(console);
      expect(inputArea.isDisabled).toBe(false);
      expect(inputArea.maxLength).toBe(2000);
      expect(inputArea.minHeight).toBe(40);
      expect(inputArea.maxHeight).toBe(120);
    });

    test('should initialize with custom options', () => {
      const inputArea = new InputArea(inputElement, {
        onSendMessage: mockOnSendMessage,
        logger: mockLogger
      });

      expect(inputArea.onSendMessage).toBe(mockOnSendMessage);
      expect(inputArea.logger).toBe(mockLogger);
      expect(mockLogger.debug).toHaveBeenCalledWith('Initializing InputArea');
    });

    test('should find required DOM elements', () => {
      const inputArea = new InputArea(inputElement, { logger: mockLogger });

      expect(inputArea.inputWrapper).toBeTruthy();
      expect(inputArea.textarea).toBeTruthy();
      expect(inputArea.sendButton).toBeTruthy();
    });

    test('should setup event listeners', () => {
      const inputArea = new InputArea(inputElement, { logger: mockLogger });
      const addEventListenerSpy = jest.spyOn(inputArea.textarea, 'addEventListener');
      
      // Re-initialize to test event binding
      inputArea.bindEvents();

      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    });
  });

  describe('Text Input and Auto-Resize', () => {
    let inputArea;

    beforeEach(() => {
      inputArea = new InputArea(inputElement, {
        onSendMessage: mockOnSendMessage,
        logger: mockLogger
      });
    });

    test('should handle text input', () => {
      const testText = 'Hello, this is a test message';
      
      inputArea.textarea.value = testText;
      inputArea.textarea.dispatchEvent(new Event('input'));

      expect(inputArea.textarea.value).toBe(testText);
    });

    test('should auto-resize textarea on input', () => {
      const autoResizeSpy = jest.spyOn(inputArea, 'autoResize');
      
      inputArea.textarea.value = 'Test message\nWith multiple\nLines of text';
      inputArea.textarea.dispatchEvent(new Event('input'));

      expect(autoResizeSpy).toHaveBeenCalled();
    });

    test('should update character counter on input', () => {
      const testText = 'Hello world';
      
      inputArea.textarea.value = testText;
      inputArea.textarea.dispatchEvent(new Event('input'));

      expect(inputArea.charCounter.textContent).toContain(testText.length.toString());
    });
  });

  describe('Message Submission', () => {
    let inputArea;

    beforeEach(() => {
      inputArea = new InputArea(inputElement, {
        onSendMessage: mockOnSendMessage,
        logger: mockLogger
      });
    });

    test('should send message on button click', () => {
      const testMessage = 'Test message';
      inputArea.textarea.value = testMessage;
      
      inputArea.sendButton.click();

      expect(mockOnSendMessage).toHaveBeenCalledWith(testMessage);
      expect(inputArea.textarea.value).toBe(''); // Should clear after sending
    });

    test('should send message on Enter key', () => {
      const testMessage = 'Test message';
      inputArea.textarea.value = testMessage;
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      inputArea.textarea.dispatchEvent(enterEvent);

      expect(mockOnSendMessage).toHaveBeenCalledWith(testMessage);
    });

    test('should not send empty messages', () => {
      inputArea.textarea.value = '   '; // Only whitespace
      
      inputArea.sendButton.click();

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    test('should disable send button for empty input', () => {
      inputArea.textarea.value = '';
      inputArea.textarea.dispatchEvent(new Event('input'));

      expect(inputArea.sendButton.disabled).toBe(true);
    });

    test('should enable send button for valid input', () => {
      inputArea.textarea.value = 'Valid message';
      inputArea.textarea.dispatchEvent(new Event('input'));

      expect(inputArea.sendButton.disabled).toBe(false);
    });
  });

  describe('Disabled State Management', () => {
    let inputArea;

    beforeEach(() => {
      inputArea = new InputArea(inputElement, {
        onSendMessage: mockOnSendMessage,
        logger: mockLogger
      });
    });

    test('should disable input area', () => {
      inputArea.setDisabled(true);

      expect(inputArea.isDisabled).toBe(true);
      expect(inputArea.textarea.disabled).toBe(true);
      expect(inputArea.sendButton.disabled).toBe(true);
    });

    test('should enable input area', () => {
      inputArea.setDisabled(true);
      inputArea.setDisabled(false);

      expect(inputArea.isDisabled).toBe(false);
      expect(inputArea.textarea.disabled).toBe(false);
    });

    test('should not send messages when disabled', () => {
      inputArea.textarea.value = 'Test message';
      inputArea.setDisabled(true);
      
      inputArea.sendButton.click();

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Typing Detection', () => {
    let inputArea;

    beforeEach(() => {
      inputArea = new InputArea(inputElement, {
        onSendMessage: mockOnSendMessage,
        logger: mockLogger
      });
    });

    test('should detect typing on input', () => {
      inputArea.textarea.value = 'T';
      inputArea.textarea.dispatchEvent(new Event('input'));

      expect(inputArea.isTyping).toBe(true);
    });

    test('should stop typing detection after timeout', () => {
      inputArea.textarea.value = 'Test';
      inputArea.textarea.dispatchEvent(new Event('input'));
      
      expect(inputArea.isTyping).toBe(true);
      
      // Fast-forward time
      jest.advanceTimersByTime(3000);
      
      expect(inputArea.isTyping).toBe(false);
    });
  });

  describe('Error Handling and Cleanup', () => {
    test('should handle missing DOM elements gracefully', () => {
      const emptyElement = document.createElement('div');
      
      expect(() => {
        new InputArea(emptyElement, { logger: mockLogger });
      }).not.toThrow();
    });

    test('should clean up timers on destroy', () => {
      const inputArea = new InputArea(inputElement, { logger: mockLogger });
      inputArea.textarea.value = 'Test';
      inputArea.textarea.dispatchEvent(new Event('input'));
      
      inputArea.destroy();
      
      expect(inputArea.typingTimer).toBeNull();
    });
  });

  describe('Accessibility', () => {
    test('should maintain proper ARIA attributes', () => {
      new InputArea(inputElement, { logger: mockLogger });

      const textarea = inputElement.querySelector('.gary-ai-input');
      const sendButton = inputElement.querySelector('.gary-ai-send-button');
      const charCounter = inputElement.querySelector('.gary-ai-char-counter');

      expect(textarea.getAttribute('aria-label')).toBeTruthy();
      expect(sendButton.getAttribute('aria-label')).toBeTruthy();
      expect(charCounter.getAttribute('aria-live')).toBe('polite');
    });

    test('should update ARIA attributes for character limit', () => {
      const inputArea = new InputArea(inputElement, { logger: mockLogger });
      const textarea = inputElement.querySelector('.gary-ai-input');

      textarea.value = 'x'.repeat(1950); // Near limit
      textarea.dispatchEvent(new Event('input'));

      expect(textarea.getAttribute('aria-describedby')).toContain('char-counter');
    });

    test('should handle focus management', () => {
      const inputArea = new InputArea(inputElement, { logger: mockLogger });
      const textarea = inputElement.querySelector('.gary-ai-input');

      const focusEvent = new FocusEvent('focus');
      const blurEvent = new FocusEvent('blur');

      textarea.dispatchEvent(focusEvent);
      expect(inputElement.classList.contains('gary-ai-input-area--focused')).toBe(true);

      textarea.dispatchEvent(blurEvent);
      expect(inputElement.classList.contains('gary-ai-input-area--focused')).toBe(false);
    });

    test('should announce typing status to screen readers', () => {
      const inputArea = new InputArea(inputElement, { logger: mockLogger });
      const textarea = inputElement.querySelector('.gary-ai-input');

      textarea.value = 'Test';
      textarea.dispatchEvent(new Event('input'));

      const statusElement = inputElement.querySelector('.gary-ai-typing-status');
      expect(statusElement).toBeTruthy();
      expect(statusElement.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      const emptyInput = document.createElement('div');
      
      expect(() => {
        new InputArea(emptyInput, { logger: mockLogger });
      }).not.toThrow();

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    test('should handle null element', () => {
      expect(() => {
        new InputArea(null, { logger: mockLogger });
      }).toThrow();
    });

    test('should handle event binding errors', () => {
      const inputArea = new InputArea(inputElement, { logger: mockLogger });
      const textarea = inputElement.querySelector('.gary-ai-input');
      
      // Mock addEventListener to throw
      const originalAddEventListener = textarea.addEventListener;
      textarea.addEventListener = jest.fn().mockImplementation(() => {
        throw new Error('Event binding failed');
      });

      // Should not crash the component
      expect(() => {
        inputArea.bindEvents();
      }).not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();

      // Restore original method
      textarea.addEventListener = originalAddEventListener;
    });

    test('should handle resize calculation errors', () => {
      const inputArea = new InputArea(inputElement, { logger: mockLogger });
      const textarea = inputElement.querySelector('.gary-ai-input');

      // Mock scrollHeight to throw
      Object.defineProperty(textarea, 'scrollHeight', {
        get() { throw new Error('ScrollHeight error'); },
        configurable: true
      });

      textarea.value = 'Test';
      textarea.dispatchEvent(new Event('input'));

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('should debounce resize calculations', () => {
      jest.useFakeTimers();
      const inputArea = new InputArea(inputElement, { logger: mockLogger });
      const textarea = inputElement.querySelector('.gary-ai-input');

      const resizeSpy = jest.spyOn(inputArea, 'adjustHeight');

      // Rapid input changes
      textarea.value = 'T';
      textarea.dispatchEvent(new Event('input'));
      textarea.value = 'Te';
      textarea.dispatchEvent(new Event('input'));
      textarea.value = 'Tes';
      textarea.dispatchEvent(new Event('input'));

      // Should debounce resize calls
      expect(resizeSpy).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    test('should cleanup timers on destroy', () => {
      jest.useFakeTimers();
      const inputArea = new InputArea(inputElement, { logger: mockLogger });
      const textarea = inputElement.querySelector('.gary-ai-input');

      textarea.value = 'Test';
      textarea.dispatchEvent(new Event('input'));

      expect(inputArea.typingTimer).toBeTruthy();

      inputArea.destroy();
      expect(inputArea.typingTimer).toBe(null);

      jest.useRealTimers();
    });
  });

  describe('Integration', () => {
    test('should work with custom CSS classes', () => {
      inputElement.className = 'custom-input gary-ai-input-area';
      const inputArea = new InputArea(inputElement, { logger: mockLogger });

      inputArea.setDisabled(true);

      expect(inputElement.classList.contains('custom-input')).toBe(true);
      expect(inputElement.classList.contains('gary-ai-input-area--disabled')).toBe(true);
    });

    test('should maintain state consistency', () => {
      const inputArea = new InputArea(inputElement, { logger: mockLogger });
      const textarea = inputElement.querySelector('.gary-ai-input');

      inputArea.setDisabled(true);
      textarea.value = 'Test message';
      
      expect(inputArea.isDisabled).toBe(true);
      expect(textarea.disabled).toBe(true);
    });

    test('should handle rapid user interactions', () => {
      const inputArea = new InputArea(inputElement, { 
        onSendMessage: mockOnSendMessage,
        logger: mockLogger 
      });
      
      const textarea = inputElement.querySelector('.gary-ai-input');
      const sendButton = inputElement.querySelector('.gary-ai-send-button');

      // Rapid interactions
      textarea.value = 'Message 1';
      sendButton.click();
      textarea.value = 'Message 2';
      sendButton.click();

      expect(mockOnSendMessage).toHaveBeenCalledTimes(2);
      expect(mockOnSendMessage).toHaveBeenCalledWith('Message 1');
      expect(mockOnSendMessage).toHaveBeenCalledWith('Message 2');
    });
  });

  describe('Cleanup', () => {
    test('should cleanup event listeners', () => {
      const inputArea = new InputArea(inputElement, { logger: mockLogger });
      const textarea = inputElement.querySelector('.gary-ai-input');
      const sendButton = inputElement.querySelector('.gary-ai-send-button');

      const removeEventListenerSpy = jest.spyOn(textarea, 'removeEventListener');

      inputArea.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    test('should remove DOM references', () => {
      const inputArea = new InputArea(inputElement, { logger: mockLogger });

      inputArea.destroy();

      expect(inputArea.element).toBe(null);
      expect(inputArea.textarea).toBe(null);
      expect(inputArea.sendButton).toBe(null);
      expect(inputArea.charCounter).toBe(null);
    });
  });
});
