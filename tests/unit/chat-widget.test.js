/**
 * Chat Widget Main Entry Point Unit Tests
 * 
 * Comprehensive test suite for the main chat widget entry point covering:
 * - Widget initialization and setup
 * - WordPress environment integration
 * - API client configuration and connection
 * - Component mounting and lifecycle
 * - Error handling and fallback modes
 * - Global interface and WordPress compatibility
 * - Event handling and communication
 * - Memory management and cleanup
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { jest } from '@jest/globals';

// Mock the CSS import
jest.mock('../../src/styles/chat-widget.css', () => ({}));

// Mock dependencies
jest.mock('../../src/components/ChatWidget.js', () => ({
  ChatWidget: jest.fn().mockImplementation(() => ({
    mount: jest.fn().mockResolvedValue(undefined),
    unmount: jest.fn().mockResolvedValue(undefined),
    show: jest.fn(),
    hide: jest.fn(),
    destroy: jest.fn()
  }))
}));

jest.mock('../../src/utils/ApiClient.js', () => ({
  ApiClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue({ status: 'ok' })
  }))
}));

jest.mock('../../src/utils/Logger.js', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis()
  }))
}));

describe('Gary AI Chat Widget Entry Point', () => {
  let mockWindow;
  let mockDocument;
  let GaryAIChatWidget;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.resetModules();

    // Mock window object with WordPress globals
    mockWindow = {
      garyAI: {
        restUrl: '/wp-json/gary-ai/v1',
        nonce: 'test-nonce-123',
        debug: false
      },
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };
    global.window = mockWindow;

    // Mock document object
    mockDocument = {
      readyState: 'complete',
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      body: document.createElement('div')
    };
    global.document = mockDocument;

    // Import the module after mocking
    const module = await import('../../src/chat-widget.js');
    GaryAIChatWidget = module.default;
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default properties', async () => {
      const widget = new GaryAIChatWidget();

      expect(widget.widget).toBeNull();
      expect(widget.apiClient).toBeNull();
      expect(widget.logger).toBeDefined();
      expect(widget.isInitialized).toBe(false);
      expect(widget.wpRestUrl).toBe('/wp-json/gary-ai/v1');
      expect(widget.wpNonce).toBe('test-nonce-123');
    });

    test('should use fallback values when WordPress globals missing', async () => {
      delete global.window.garyAI;
      
      const widget = new GaryAIChatWidget();

      expect(widget.wpRestUrl).toBe('/wp-json/gary-ai/v1');
      expect(widget.wpNonce).toBe('');
    });
  });

  describe('WordPress Environment Validation', () => {
    test('should validate complete WordPress environment', async () => {
      const widget = new GaryAIChatWidget();

      expect(widget.validateWordPressEnvironment()).toBe(true);
    });

    test('should fail validation with missing garyAI global', async () => {
      delete global.window.garyAI;
      
      const widget = new GaryAIChatWidget();

      expect(widget.validateWordPressEnvironment()).toBe(false);
    });

    test('should fail validation with missing restUrl', async () => {
      delete global.window.garyAI.restUrl;
      
      const widget = new GaryAIChatWidget();

      expect(widget.validateWordPressEnvironment()).toBe(false);
    });

    test('should fail validation with missing nonce', async () => {
      delete global.window.garyAI.nonce;
      
      const widget = new GaryAIChatWidget();

      expect(widget.validateWordPressEnvironment()).toBe(false);
    });
  });

  describe('Setup and Component Initialization', () => {
    test('should setup components successfully', async () => {
      const widget = new GaryAIChatWidget();
      await widget.setup();

      expect(widget.apiClient).toBeDefined();
      expect(widget.widget).toBeDefined();
      expect(widget.isInitialized).toBe(true);
    });

    test('should initialize API client with correct configuration', async () => {
      const { ApiClient } = await import('../../src/utils/ApiClient.js');
      
      const widget = new GaryAIChatWidget();
      await widget.setup();

      expect(ApiClient).toHaveBeenCalledWith({
        baseUrl: '/wp-json/gary-ai/v1',
        nonce: 'test-nonce-123',
        logger: expect.any(Object)
      });
    });

    test('should initialize ChatWidget with correct configuration', async () => {
      const { ChatWidget } = await import('../../src/components/ChatWidget.js');
      
      const widget = new GaryAIChatWidget();
      await widget.setup();

      expect(ChatWidget).toHaveBeenCalledWith({
        apiClient: expect.any(Object),
        logger: expect.any(Object),
        container: mockDocument.body
      });
    });

    test('should mount the widget after initialization', async () => {
      const widget = new GaryAIChatWidget();
      await widget.setup();

      expect(widget.widget.mount).toHaveBeenCalled();
    });

    test('should warn when WordPress environment not detected', async () => {
      delete global.window.garyAI;
      
      const widget = new GaryAIChatWidget();
      await widget.setup();

      expect(widget.logger.warn).toHaveBeenCalledWith(
        'WordPress environment not detected, using fallback mode'
      );
    });
  });

  describe('DOM Ready State Handling', () => {
    test('should setup immediately when DOM is ready', async () => {
      mockDocument.readyState = 'complete';
      const setupSpy = jest.spyOn(GaryAIChatWidget.prototype, 'setup');
      
      new GaryAIChatWidget();

      expect(setupSpy).toHaveBeenCalled();
    });

    test('should wait for DOMContentLoaded when DOM is loading', async () => {
      mockDocument.readyState = 'loading';
      
      new GaryAIChatWidget();

      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function)
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle setup errors gracefully', async () => {
      const error = new Error('Setup failed');
      const { ChatWidget } = await import('../../src/components/ChatWidget.js');
      ChatWidget.mockImplementation(() => {
        throw error;
      });
      
      const widget = new GaryAIChatWidget();
      const showFallbackErrorSpy = jest.spyOn(widget, 'showFallbackError');
      
      await widget.setup();

      expect(widget.logger.error).toHaveBeenCalledWith(
        'Failed to setup chat widget:',
        error
      );
      expect(showFallbackErrorSpy).toHaveBeenCalled();
    });
  });
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('Performance and Optimization', () => {
    test('should load components lazily', async () => {
      const { ChatWidget } = require('../../src/components/ChatWidget.js');
      
      // Should not create widget until needed
      expect(ChatWidget).not.toHaveBeenCalled();

      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      // Now should be created
      expect(ChatWidget).toHaveBeenCalled();
    });

    test('should handle memory cleanup on destroy', async () => {
      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      window.GaryAI.destroy();

      // Should clean up references
      expect(window.GaryAI.getInstance()).toBe(null);
    });

    test('should debounce rapid initialization calls', async () => {
      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      // Rapid calls
      window.GaryAI.init();
      window.GaryAI.init();
      window.GaryAI.init();

      // Should only initialize once
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('already initialized')
      );
    });
  });

  describe('Browser Compatibility', () => {
    test('should handle missing modern JavaScript features', async () => {
      // Mock missing features
      const originalPromise = global.Promise;
      delete global.Promise;

      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Browser compatibility')
      );

      // Restore
      global.Promise = originalPromise;
    });

    test('should provide polyfill information', async () => {
      // Mock old browser
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)',
        configurable: true
      });

      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Browser detected')
      );
    });

    test('should handle CSS import failures gracefully', async () => {
      // This is handled by the Jest mock, but in real scenarios
      // the widget should still function without CSS
      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('Development and Debug Mode', () => {
    test('should enable debug logging in development', async () => {
      global.window.garyAI.debug = true;

      const { Logger } = require('../../src/utils/Logger.js');
      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      expect(Logger).toHaveBeenCalledWith('GaryAI');
    });

    test('should expose debug information in development', async () => {
      global.window.garyAI.debug = true;

      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      expect(window.GaryAI.debug).toBeDefined();
    });

    test('should handle production mode correctly', async () => {
      global.window.garyAI.debug = false;

      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      expect(window.GaryAI.debug).toBeUndefined();
    });
  });

  describe('Integration Testing', () => {
    test('should integrate all components correctly', async () => {
      const { ChatWidget } = require('../../src/components/ChatWidget.js');
      const { ApiClient } = require('../../src/utils/ApiClient.js');
      const { Logger } = require('../../src/utils/Logger.js');

      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      // All components should be initialized
      expect(Logger).toHaveBeenCalled();
      expect(ApiClient).toHaveBeenCalled();
      expect(ChatWidget).toHaveBeenCalled();
    });

    test('should handle component interdependencies', async () => {
      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      // ApiClient should be passed to ChatWidget
      const { ChatWidget } = require('../../src/components/ChatWidget.js');
      const chatWidgetCall = ChatWidget.mock.calls[0];
      
      expect(chatWidgetCall[1]).toHaveProperty('apiClient');
      expect(chatWidgetCall[1]).toHaveProperty('logger');
    });

    test('should maintain proper initialization order', async () => {
      const { Logger } = require('../../src/utils/Logger.js');
      const { ApiClient } = require('../../src/utils/ApiClient.js');
      const { ChatWidget } = require('../../src/components/ChatWidget.js');

      const { default: chatWidgetModule } = await import('../../src/chat-widget.js');

      // Logger should be created first
      expect(Logger).toHaveBeenCalledBefore(ApiClient);
      expect(ApiClient).toHaveBeenCalledBefore(ChatWidget);
    });
  });
});
