/**
 * TypingIndicator Component Unit Tests
 * 
 * Comprehensive test suite for TypingIndicator component covering:
 * - Constructor and initialization
 * - Show and hide functionality
 * - Animation control and timing
 * - Accessibility features and ARIA
 * - Screen reader announcements
 * - Error handling and cleanup
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { TypingIndicator } from '../../src/components/TypingIndicator.js';

describe('TypingIndicator', () => {
  let container;
  let typingIndicatorElement;
  let mockLogger;

  beforeEach(() => {
    // Create DOM structure
    container = document.createElement('div');
    typingIndicatorElement = document.createElement('div');
    typingIndicatorElement.className = 'gary-ai-typing-indicator gary-ai-hidden';
    
    // Add typing dots
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'gary-ai-typing-dot';
      typingIndicatorElement.appendChild(dot);
    }
    
    container.appendChild(typingIndicatorElement);
    document.body.appendChild(container);

    // Mock dependencies
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

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
      const typingIndicator = new TypingIndicator(typingIndicatorElement);

      expect(typingIndicator.element).toBe(typingIndicatorElement);
      expect(typingIndicator.logger).toBe(console);
      expect(typingIndicator.isVisible).toBe(false);
      expect(typingIndicator.animationFrameId).toBeNull();
      expect(typingIndicator.dotElements).toHaveLength(3);
    });

    test('should initialize with custom options', () => {
      const typingIndicator = new TypingIndicator(typingIndicatorElement, {
        logger: mockLogger
      });

      expect(typingIndicator.logger).toBe(mockLogger);
      expect(mockLogger.debug).toHaveBeenCalledWith('Initializing TypingIndicator');
      expect(mockLogger.debug).toHaveBeenCalledWith('TypingIndicator initialized');
    });

    test('should find dot elements', () => {
      const typingIndicator = new TypingIndicator(typingIndicatorElement, { logger: mockLogger });

      expect(typingIndicator.dotElements).toHaveLength(3);
      typingIndicator.dotElements.forEach(dot => {
        expect(dot.classList.contains('gary-ai-typing-dot')).toBe(true);
      });
    });

    test('should setup accessibility attributes', () => {
      new TypingIndicator(typingIndicatorElement, { logger: mockLogger });

      expect(typingIndicatorElement.getAttribute('role')).toBe('status');
      expect(typingIndicatorElement.getAttribute('aria-live')).toBe('polite');
      expect(typingIndicatorElement.getAttribute('aria-label')).toBe('Gary AI is typing');
    });

    test('should hide dots from screen readers', () => {
      new TypingIndicator(typingIndicatorElement, { logger: mockLogger });

      const dots = typingIndicatorElement.querySelectorAll('.gary-ai-typing-dot');
      dots.forEach(dot => {
        expect(dot.getAttribute('aria-hidden')).toBe('true');
      });
    });

    test('should be initially hidden', () => {
      const typingIndicator = new TypingIndicator(typingIndicatorElement, { logger: mockLogger });

      expect(typingIndicator.isVisible).toBe(false);
      expect(typingIndicatorElement.classList.contains('gary-ai-hidden')).toBe(true);
      expect(typingIndicatorElement.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Show and Hide Functionality', () => {
    let typingIndicator;

    beforeEach(() => {
      typingIndicator = new TypingIndicator(typingIndicatorElement, { logger: mockLogger });
    });

    test('should show typing indicator', () => {
      const startAnimationSpy = jest.spyOn(typingIndicator, 'startAnimation');
      const announceToScreenReaderSpy = jest.spyOn(typingIndicator, 'announceToScreenReader');

      typingIndicator.show();

      expect(typingIndicator.isVisible).toBe(true);
      expect(typingIndicatorElement.classList.contains('gary-ai-hidden')).toBe(false);
      expect(typingIndicatorElement.classList.contains('gary-ai-typing-visible')).toBe(true);
      expect(typingIndicatorElement.getAttribute('aria-hidden')).toBe('false');
      expect(startAnimationSpy).toHaveBeenCalled();
      expect(announceToScreenReaderSpy).toHaveBeenCalledWith('Gary AI is typing');
      expect(mockLogger.debug).toHaveBeenCalledWith('Showing typing indicator');
    });

    test('should not show if already visible', () => {
      const startAnimationSpy = jest.spyOn(typingIndicator, 'startAnimation');
      
      typingIndicator.show();
      jest.clearAllMocks();
      typingIndicator.show();

      expect(startAnimationSpy).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalledWith('Showing typing indicator');
    });

    test('should hide typing indicator', () => {
      const stopAnimationSpy = jest.spyOn(typingIndicator, 'stopAnimation');
      
      // First show it
      typingIndicator.show();
      
      // Then hide it
      typingIndicator.hide();

      expect(typingIndicator.isVisible).toBe(false);
      expect(typingIndicatorElement.classList.contains('gary-ai-hidden')).toBe(true);
      expect(typingIndicatorElement.classList.contains('gary-ai-typing-visible')).toBe(false);
      expect(typingIndicatorElement.getAttribute('aria-hidden')).toBe('true');
      expect(stopAnimationSpy).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Hiding typing indicator');
    });

    test('should not hide if already hidden', () => {
      const stopAnimationSpy = jest.spyOn(typingIndicator, 'stopAnimation');
      
      typingIndicator.hide();

      expect(stopAnimationSpy).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalledWith('Hiding typing indicator');
    });
  });

  describe('Animation Control', () => {
    let typingIndicator;

    beforeEach(() => {
      typingIndicator = new TypingIndicator(typingIndicatorElement, { logger: mockLogger });
    });

    test('should start animation', () => {
      typingIndicator.startAnimation();

      expect(global.requestAnimationFrame).toHaveBeenCalled();
      expect(typingIndicator.animationFrameId).toBeTruthy();
    });

    test('should stop animation', () => {
      typingIndicator.startAnimation();
      const frameId = typingIndicator.animationFrameId;
      
      typingIndicator.stopAnimation();

      expect(global.cancelAnimationFrame).toHaveBeenCalledWith(frameId);
      expect(typingIndicator.animationFrameId).toBeNull();
    });

    test('should animate dots with proper timing', () => {
      typingIndicator.show();
      
      // Fast-forward time to see animation cycles
      jest.advanceTimersByTime(typingIndicator.animationDuration);
      
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Screen Reader Announcements', () => {
    let typingIndicator;

    beforeEach(() => {
      typingIndicator = new TypingIndicator(typingIndicatorElement, { logger: mockLogger });
    });

    test('should announce to screen reader', () => {
      const message = 'Test announcement';
      
      typingIndicator.announceToScreenReader(message);
      
      // Check if announcement element was created and added
      const announcements = document.querySelectorAll('[aria-live="assertive"]');
      expect(announcements.length).toBeGreaterThan(0);
    });

    test('should clean up announcement elements', () => {
      const message = 'Test announcement';
      
      typingIndicator.announceToScreenReader(message);
      
      // Fast-forward to cleanup time
      jest.advanceTimersByTime(1000);
      
      const announcements = document.querySelectorAll('[aria-live="assertive"]');
      expect(announcements.length).toBe(0);
    });
  });

  describe('Error Handling and Cleanup', () => {
    test('should handle missing dot elements gracefully', () => {
      const emptyElement = document.createElement('div');
      emptyElement.className = 'gary-ai-typing-indicator';
      
      expect(() => {
        new TypingIndicator(emptyElement, { logger: mockLogger });
      }).not.toThrow();
    });

    test('should handle animation errors gracefully', () => {
      const typingIndicator = new TypingIndicator(typingIndicatorElement, { logger: mockLogger });
      
      // Mock requestAnimationFrame to throw
      global.requestAnimationFrame = jest.fn(() => {
        throw new Error('Animation error');
      });
      
      expect(() => {
        typingIndicator.startAnimation();
      }).not.toThrow();
    });

    test('should clean up animation on destroy', () => {
      const typingIndicator = new TypingIndicator(typingIndicatorElement, { logger: mockLogger });
      
      typingIndicator.show();
      const frameId = typingIndicator.animationFrameId;
      
      typingIndicator.destroy();
      
      expect(global.cancelAnimationFrame).toHaveBeenCalledWith(frameId);
      expect(typingIndicator.animationFrameId).toBeNull();
    });
  });
});
      expect(() => {
        new TypingIndicator(null, { logger: mockLogger });
      }).toThrow();
    });


      expect(indicatorElement.classList.contains('custom-indicator')).toBe(true);
      expect(indicatorElement.classList.contains('gary-ai-typing-indicator--visible')).toBe(true);
    });

    test('should maintain state consistency', () => {
      const typingIndicator = new TypingIndicator(indicatorElement, { logger: mockLogger });

      typingIndicator.show();
      expect(typingIndicator.isVisible).toBe(true);
      expect(typingIndicator.animationFrameId).toBeTruthy();

      typingIndicator.hide();
      expect(typingIndicator.isVisible).toBe(false);
      expect(typingIndicator.animationFrameId).toBe(null);
    });

    test('should handle different dot configurations', () => {
      // Test with different number of dots
      const customIndicator = document.createElement('div');
      for (let i = 0; i < 5; i++) {
        const dot = document.createElement('div');
        dot.className = 'gary-ai-typing-dot';
        customIndicator.appendChild(dot);
      }

      const typingIndicator = new TypingIndicator(customIndicator, { logger: mockLogger });

      expect(typingIndicator.dotElements).toHaveLength(5);
    });

    test('should work with dynamic dot creation', () => {
      const emptyIndicator = document.createElement('div');
      const typingIndicator = new TypingIndicator(emptyIndicator, { logger: mockLogger });

      // Add dots dynamically
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'gary-ai-typing-dot';
        emptyIndicator.appendChild(dot);
      }

      typingIndicator.refreshDots();

      expect(typingIndicator.dotElements).toHaveLength(3);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup animation frame', () => {
      const typingIndicator = new TypingIndicator(indicatorElement, { logger: mockLogger });

      typingIndicator.show();
      typingIndicator.destroy();

      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    test('should remove DOM references', () => {
      const typingIndicator = new TypingIndicator(indicatorElement, { logger: mockLogger });

      typingIndicator.destroy();

      expect(typingIndicator.element).toBe(null);
      expect(typingIndicator.dotElements).toEqual([]);
    });

    test('should reset state on destroy', () => {
      const typingIndicator = new TypingIndicator(indicatorElement, { logger: mockLogger });

      typingIndicator.show();
      typingIndicator.destroy();

      expect(typingIndicator.isVisible).toBe(false);
      expect(typingIndicator.animationFrameId).toBe(null);
    });
  });

  describe('Custom Configuration', () => {
    test('should accept custom animation duration', () => {
      const typingIndicator = new TypingIndicator(indicatorElement, { 
        logger: mockLogger,
        animationDuration: 2000
      });

      expect(typingIndicator.animationDuration).toBe(2000);
    });

    test('should accept custom dot delay', () => {
      const typingIndicator = new TypingIndicator(indicatorElement, { 
        logger: mockLogger,
        dotDelay: 300
      });

      expect(typingIndicator.dotDelay).toBe(300);
    });

    test('should handle invalid configuration gracefully', () => {
      const typingIndicator = new TypingIndicator(indicatorElement, { 
        logger: mockLogger,
        animationDuration: -1000,
        dotDelay: -200
      });

      // Should use default values for invalid config
      expect(typingIndicator.animationDuration).toBeGreaterThan(0);
      expect(typingIndicator.dotDelay).toBeGreaterThan(0);
    });
  });
});
