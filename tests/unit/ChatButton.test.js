/**
 * ChatButton Component Unit Tests
 * 
 * Comprehensive test suite for ChatButton component covering:
 * - Constructor and initialization
 * - Event handling and user interactions
 * - Show/hide functionality
 * - Notification system
 * - Tooltip functionality
 * - Animation states
 * - Accessibility features
 * - Error handling and cleanup
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { ChatButton } from '../../src/components/ChatButton.js';

describe('ChatButton', () => {
  let container;
  let buttonElement;
  let mockLogger;
  let mockOnClick;

  beforeEach(() => {
    // Create DOM elements
    container = document.createElement('div');
    buttonElement = document.createElement('button');
    buttonElement.className = 'gary-ai-chat-button';
    container.appendChild(buttonElement);
    document.body.appendChild(container);

    // Mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Mock onClick handler
    mockOnClick = jest.fn();

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    global.cancelAnimationFrame = jest.fn();

    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true
    });

    // Mock setTimeout and setInterval
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default options', () => {
      const chatButton = new ChatButton(buttonElement);

      expect(chatButton.element).toBe(buttonElement);
      expect(chatButton.onClick).toBeInstanceOf(Function);
      expect(chatButton.logger).toBe(console);
      expect(chatButton.isVisible).toBe(true);
      expect(chatButton.isExpanded).toBe(false);
      expect(chatButton.hasNotification).toBe(false);
      expect(chatButton.animationDuration).toBe(200);
      expect(chatButton.pulseInterval).toBeNull();
    });

    test('should initialize with custom options', () => {
      const chatButton = new ChatButton(buttonElement, {
        onClick: mockOnClick,
        logger: mockLogger
      });

      expect(chatButton.onClick).toBe(mockOnClick);
      expect(chatButton.logger).toBe(mockLogger);
      expect(mockLogger.debug).toHaveBeenCalledWith('Initializing ChatButton');
    });

    test('should setup event listeners during initialization', () => {
      const addEventListenerSpy = jest.spyOn(buttonElement, 'addEventListener');
      
      new ChatButton(buttonElement, { logger: mockLogger });

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseenter', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    test('should setup scroll event listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      new ChatButton(buttonElement, { logger: mockLogger });

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    test('should log initialization', () => {
      new ChatButton(buttonElement, { logger: mockLogger });

      expect(mockLogger.debug).toHaveBeenCalledWith('Initializing ChatButton');
      expect(mockLogger.debug).toHaveBeenCalledWith('ChatButton initialized');
    });
  });

  describe('Event Handling', () => {
    let chatButton;

    beforeEach(() => {
      chatButton = new ChatButton(buttonElement, {
        onClick: mockOnClick,
        logger: mockLogger
      });
    });

    test('should handle click events', () => {
      const event = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
      
      buttonElement.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(mockOnClick).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('ChatButton clicked');
    });

    test('should handle keyboard events (Enter)', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      buttonElement.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockOnClick).toHaveBeenCalled();
    });

    test('should handle keyboard events (Space)', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      buttonElement.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockOnClick).toHaveBeenCalled();
    });

    test('should ignore other keyboard events', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      
      buttonElement.dispatchEvent(event);

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('should handle mouse enter events', () => {
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));

      expect(buttonElement.classList.contains('gary-ai-chat-button-hover')).toBe(true);
    });

    test('should handle mouse leave events', () => {
      buttonElement.classList.add('gary-ai-chat-button-hover');
      
      buttonElement.dispatchEvent(new MouseEvent('mouseleave'));

      expect(buttonElement.classList.contains('gary-ai-chat-button-hover')).toBe(false);
    });

    test('should handle focus events', () => {
      buttonElement.dispatchEvent(new FocusEvent('focus'));

      expect(buttonElement.classList.contains('gary-ai-chat-button-focused')).toBe(true);
    });

    test('should handle blur events', () => {
      buttonElement.classList.add('gary-ai-chat-button-focused');
      
      buttonElement.dispatchEvent(new FocusEvent('blur'));

      expect(buttonElement.classList.contains('gary-ai-chat-button-focused')).toBe(false);
    });

    test('should toggle expanded state on click', () => {
      expect(chatButton.isExpanded).toBe(false);
      expect(buttonElement.getAttribute('aria-expanded')).toBe('false');
      
      buttonElement.dispatchEvent(new MouseEvent('click'));
      
      expect(chatButton.isExpanded).toBe(true);
      expect(buttonElement.getAttribute('aria-expanded')).toBe('true');
      
      buttonElement.dispatchEvent(new MouseEvent('click'));
      
      expect(chatButton.isExpanded).toBe(false);
      expect(buttonElement.getAttribute('aria-expanded')).toBe('false');
    });

    test('should clear notification on click when present', () => {
      chatButton.hasNotification = true;
      const clearNotificationSpy = jest.spyOn(chatButton, 'clearNotification');
      
      buttonElement.dispatchEvent(new MouseEvent('click'));

      expect(clearNotificationSpy).toHaveBeenCalled();
      jest.advanceTimersByTime(1000);

      chatButton.stopPulse();
      expect(chatButton.pulseInterval).toBe(null);
      expect(buttonElement.classList.contains('gary-ai-chat-button--pulse')).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Show and Hide Functionality', () => {
    let chatButton;

    beforeEach(() => {
      chatButton = new ChatButton(buttonElement, { logger: mockLogger });
    });

    test('should show button when hidden', () => {
      chatButton.isVisible = false;
      buttonElement.style.display = 'none';
      
      chatButton.show();
      
      expect(chatButton.isVisible).toBe(true);
      expect(buttonElement.style.display).toBe('flex');
      expect(buttonElement.classList.contains('gary-ai-chat-button-show')).toBe(true);
      expect(buttonElement.classList.contains('gary-ai-chat-button-hide')).toBe(false);
      expect(buttonElement.getAttribute('aria-hidden')).toBe('false');
      expect(mockLogger.debug).toHaveBeenCalledWith('Showing ChatButton');
    });

    test('should not show button when already visible', () => {
      chatButton.isVisible = true;
      
      chatButton.show();
      
      expect(mockLogger.debug).not.toHaveBeenCalledWith('Showing ChatButton');
    });

    test('should hide button when visible', () => {
      chatButton.isVisible = true;
      
      chatButton.hide();
      
      expect(chatButton.isVisible).toBe(false);
      expect(buttonElement.classList.contains('gary-ai-chat-button-hide')).toBe(true);
      expect(buttonElement.classList.contains('gary-ai-chat-button-show')).toBe(false);
      expect(buttonElement.getAttribute('aria-hidden')).toBe('true');
      expect(mockLogger.debug).toHaveBeenCalledWith('Hiding ChatButton');
      
      // Test delayed display none
      jest.advanceTimersByTime(200);
      expect(buttonElement.style.display).toBe('none');
    });

    test('should not hide button when already hidden', () => {
      chatButton.isVisible = false;
      
      chatButton.hide();
      
      expect(mockLogger.debug).not.toHaveBeenCalledWith('Hiding ChatButton');
    });

    test('should not set display none if button becomes visible during hide animation', () => {
      chatButton.isVisible = true;
      
      chatButton.hide();
      chatButton.isVisible = true; // Button becomes visible again
      
      jest.advanceTimersByTime(200);
      expect(buttonElement.style.display).not.toBe('none');
    });
  });

  describe('Click Animation', () => {
    let chatButton;

    beforeEach(() => {
      chatButton = new ChatButton(buttonElement, { logger: mockLogger });
    });

    test('should add click animation class', () => {
      chatButton.addClickAnimation();
      
      expect(buttonElement.classList.contains('gary-ai-chat-button-clicked')).toBe(true);
      
      // Test animation removal after delay
      jest.advanceTimersByTime(150);
      expect(buttonElement.classList.contains('gary-ai-chat-button-clicked')).toBe(false);
    });

    test('should trigger click animation on button click', () => {
      const addClickAnimationSpy = jest.spyOn(chatButton, 'addClickAnimation');
      
      buttonElement.dispatchEvent(new MouseEvent('click'));
      
      expect(addClickAnimationSpy).toHaveBeenCalled();
    });
  });

  describe('Notification System', () => {
    let chatButton;

    beforeEach(() => {
      chatButton = new ChatButton(buttonElement, { logger: mockLogger });
    });

    test('should show notification indicator', () => {
      chatButton.showNotification();
      
      expect(chatButton.hasNotification).toBe(true);
      expect(buttonElement.querySelector('.gary-ai-notification-dot')).toBeTruthy();
      expect(buttonElement.getAttribute('aria-label')).toBe('Open Gary AI Chat (new message)');
      expect(mockLogger.debug).toHaveBeenCalledWith('Showing notification on ChatButton');
    });

    test('should not show notification if already present', () => {
      chatButton.hasNotification = true;
      
      chatButton.showNotification();
      
      expect(mockLogger.debug).not.toHaveBeenCalledWith('Showing notification on ChatButton');
    });

    test('should clear notification indicator', () => {
      // First show notification
      chatButton.showNotification();
      
      chatButton.clearNotification();
      
      expect(chatButton.hasNotification).toBe(false);
      expect(buttonElement.querySelector('.gary-ai-notification-dot')).toBeNull();
      expect(buttonElement.getAttribute('aria-label')).toBe('Open Gary AI Chat');
      expect(mockLogger.debug).toHaveBeenCalledWith('Clearing notification on ChatButton');
    });

    test('should not clear notification if not present', () => {
      chatButton.hasNotification = false;
      
      chatButton.clearNotification();
      
      expect(mockLogger.debug).not.toHaveBeenCalledWith('Clearing notification on ChatButton');
    });

    test('should start pulse animation with notification', () => {
      chatButton.showNotification();
      
      expect(buttonElement.classList.contains('gary-ai-chat-button-pulse')).toBe(true);
      expect(chatButton.pulseInterval).toBeTruthy();
    });

    test('should stop pulse animation when clearing notification', () => {
      chatButton.showNotification();
      chatButton.clearNotification();
      
      expect(buttonElement.classList.contains('gary-ai-chat-button-pulse')).toBe(false);
      expect(buttonElement.classList.contains('gary-ai-chat-button-pulse-active')).toBe(false);
      expect(chatButton.pulseInterval).toBeNull();
    });
  });

  describe('Tooltip Functionality', () => {
    let chatButton;

    beforeEach(() => {
      chatButton = new ChatButton(buttonElement, { logger: mockLogger });
    });

    test('should show tooltip on mouse enter', () => {
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));
      
      expect(chatButton.tooltip).toBeTruthy();
      expect(chatButton.tooltip.classList.contains('gary-ai-tooltip-visible')).toBe(true);
      expect(chatButton.tooltip.textContent).toBe('Chat with Gary AI');
      expect(chatButton.tooltip.getAttribute('role')).toBe('tooltip');
    });

    test('should show tooltip on focus', () => {
      buttonElement.dispatchEvent(new FocusEvent('focus'));
      
      expect(chatButton.tooltip).toBeTruthy();
      expect(chatButton.tooltip.classList.contains('gary-ai-tooltip-visible')).toBe(true);
    });

    test('should hide tooltip on mouse leave', () => {
      // First show tooltip
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));
      
      buttonElement.dispatchEvent(new MouseEvent('mouseleave'));
      
      expect(chatButton.tooltip.classList.contains('gary-ai-tooltip-visible')).toBe(false);
    });

    test('should hide tooltip on blur', () => {
      // First show tooltip
      buttonElement.dispatchEvent(new FocusEvent('focus'));
      
      buttonElement.dispatchEvent(new FocusEvent('blur'));
      
      expect(chatButton.tooltip.classList.contains('gary-ai-tooltip-visible')).toBe(false);
    });
  });

  describe('Button State Management', () => {
    let chatButton;

    beforeEach(() => {
      chatButton = new ChatButton(buttonElement, { logger: mockLogger });
    });

    test('should set loading state', () => {
      chatButton.setState('loading');
      
      expect(buttonElement.classList.contains('gary-ai-chat-button-loading')).toBe(true);
      expect(buttonElement.querySelector('.gary-ai-spinner')).toBeTruthy();
    });

    test('should set error state', () => {
      chatButton.setState('error');
      
      expect(buttonElement.classList.contains('gary-ai-chat-button-error')).toBe(true);
      expect(buttonElement.querySelector('svg')).toBeTruthy();
    });

    test('should set default state', () => {
      // First set to loading
      chatButton.setState('loading');
      
      chatButton.setState('default');
      
      expect(buttonElement.classList.contains('gary-ai-chat-button-loading')).toBe(false);
      expect(buttonElement.classList.contains('gary-ai-chat-button-error')).toBe(false);
    });
  });

  describe('Cleanup and Error Handling', () => {
    test('should handle missing element gracefully', () => {
      expect(() => {
        new ChatButton(null, { logger: mockLogger });
      }).not.toThrow();
    });

    test('should clean up intervals on destroy', () => {
      const chatButton = new ChatButton(buttonElement, { logger: mockLogger });
      chatButton.startPulseAnimation();
      
      chatButton.destroy();
      
      expect(chatButton.pulseInterval).toBeNull();
    });
  });

  describe('Integration', () => {
    test('should work with custom CSS classes', () => {
      buttonElement.className = 'custom-button gary-ai-chat-button';
      const chatButton = new ChatButton(buttonElement, { logger: mockLogger });

      chatButton.setExpanded(true);

      expect(buttonElement.classList.contains('custom-button')).toBe(true);
      expect(buttonElement.classList.contains('gary-ai-chat-button--expanded')).toBe(true);
    });

    test('should maintain state consistency', () => {
      const chatButton = new ChatButton(buttonElement, { logger: mockLogger });

      chatButton.setExpanded(true);
      chatButton.showNotification();
      chatButton.hide();

      expect(chatButton.isExpanded).toBe(true);
      expect(chatButton.hasNotification).toBe(true);
      expect(chatButton.isVisible).toBe(false);
    });
  });
});
