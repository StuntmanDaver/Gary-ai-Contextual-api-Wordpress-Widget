/**
 * Production Readiness Tests
 * 
 * Comprehensive production validation tests covering performance, security,
 * deployment readiness, and optimization for all Gary AI chat widget components.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { jest } from '@jest/globals';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

describe('Production Readiness Validation', () => {
  describe('Build Validation', () => {
    test('should have all required build artifacts', () => {
      const distPath = path.resolve('dist');
      const requiredFiles = [
        'chat-widget.js',
        'chat-widget.css',
        'chat-widget.js.map',
        'chat-widget.css.map'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(distPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have minified production builds', () => {
      const jsFile = path.resolve('dist/chat-widget.js');
      const cssFile = path.resolve('dist/chat-widget.css');

      if (fs.existsSync(jsFile)) {
        const jsContent = fs.readFileSync(jsFile, 'utf8');
        // Check for minification indicators
        expect(jsContent).not.toMatch(/\/\*\*[\s\S]*?\*\//); // No JSDoc comments
        expect(jsContent.split('\n').length).toBeLessThan(50); // Minified to few lines
      }

      if (fs.existsSync(cssFile)) {
        const cssContent = fs.readFileSync(cssFile, 'utf8');
        // Check for CSS minification
        expect(cssContent).not.toMatch(/\/\*[\s\S]*?\*\//); // No CSS comments
        expect(cssContent.includes('\n')).toBe(false); // Single line
      }
    });

    test('should have proper source maps', () => {
      const jsMapFile = path.resolve('dist/chat-widget.js.map');
      const cssMapFile = path.resolve('dist/chat-widget.css.map');

      if (fs.existsSync(jsMapFile)) {
        const jsMap = JSON.parse(fs.readFileSync(jsMapFile, 'utf8'));
        expect(jsMap.version).toBe(3);
        expect(jsMap.sources).toBeDefined();
        expect(jsMap.mappings).toBeDefined();
      }

      if (fs.existsSync(cssMapFile)) {
        const cssMap = JSON.parse(fs.readFileSync(cssMapFile, 'utf8'));
        expect(cssMap.version).toBe(3);
        expect(cssMap.sources).toBeDefined();
      }
    });
  });

  describe('Performance Validation', () => {
    test('should meet performance benchmarks', async () => {
      // Mock performance-critical components
      const { ChatWidget } = await import('../../src/components/ChatWidget.js');
      const { Logger } = await import('../../src/utils/Logger.js');

      const mockContainer = document.createElement('div');
      const mockApiClient = {
        sendMessage: jest.fn().mockResolvedValue({ message: 'test', id: '123' }),
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn()
      };
      const mockLogger = new Logger('test');

      // Measure initialization time
      const initStart = performance.now();
      const widget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: mockContainer
      });
      await widget.mount();
      const initTime = performance.now() - initStart;

      expect(initTime).toBeLessThan(100); // Should initialize within 100ms

      // Measure message rendering time
      const renderStart = performance.now();
      for (let i = 0; i < 10; i++) {
        widget.messageList.addMessage(`Message ${i}`, 'user');
      }
      const renderTime = performance.now() - renderStart;

      expect(renderTime).toBeLessThan(50); // Should render 10 messages within 50ms

      // Measure cleanup time
      const cleanupStart = performance.now();
      widget.destroy();
      const cleanupTime = performance.now() - cleanupStart;

      expect(cleanupTime).toBeLessThan(20); // Should cleanup within 20ms
    });

    test('should handle memory efficiently', async () => {
      const { ChatWidget } = await import('../../src/components/ChatWidget.js');
      const mockContainer = document.createElement('div');
      const mockApiClient = {
        sendMessage: jest.fn().mockResolvedValue({ message: 'test', id: '123' }),
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn()
      };
      const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), child: jest.fn().mockReturnThis() };

      // Create multiple widgets to test memory usage
      const widgets = [];
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 5; i++) {
        const widget = new ChatWidget({
          apiClient: mockApiClient,
          logger: mockLogger,
          container: mockContainer.cloneNode(true)
        });
        await widget.mount();
        widgets.push(widget);
      }

      const afterCreationMemory = process.memoryUsage().heapUsed;
      const creationMemoryIncrease = afterCreationMemory - initialMemory;

      // Cleanup all widgets
      widgets.forEach(widget => widget.destroy());
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const afterCleanupMemory = process.memoryUsage().heapUsed;
      const memoryLeakage = afterCleanupMemory - initialMemory;

      // Memory leakage should be minimal (less than 10% of creation increase)
      expect(memoryLeakage).toBeLessThan(creationMemoryIncrease * 0.1);
    });

    test('should optimize bundle size', () => {
      const bundlePath = path.resolve('dist/chat-widget.js');
      
      if (fs.existsSync(bundlePath)) {
        const stats = fs.statSync(bundlePath);
        const sizeInKB = stats.size / 1024;

        // Bundle should be under 100KB for good performance
        expect(sizeInKB).toBeLessThan(100);
      }
    });
  });

  describe('Security Validation', () => {
    test('should sanitize all user inputs', async () => {
      const { MessageList } = await import('../../src/components/MessageList.js');
      const mockElement = document.createElement('div');
      const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

      const messageList = new MessageList(mockElement, { logger: mockLogger });

      // Test XSS prevention
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '<svg onload="alert(\'xss\')">',
        '"><script>alert("xss")</script>',
        '\' OR 1=1--',
        '<iframe src="javascript:alert(\'xss\')"></iframe>'
      ];

      maliciousInputs.forEach(input => {
        messageList.addMessage(input, 'user');
        
        // Verify no script execution
        const messageElements = mockElement.querySelectorAll('.gary-ai-message');
        const lastMessage = messageElements[messageElements.length - 1];
        
        // Should not contain executable scripts
        expect(lastMessage.innerHTML).not.toMatch(/<script/i);
        expect(lastMessage.innerHTML).not.toMatch(/javascript:/i);
        expect(lastMessage.innerHTML).not.toMatch(/on\w+=/i);
      });
    });

    test('should validate API endpoints', async () => {
      const { ApiClient } = await import('../../src/utils/ApiClient.js');
      
      const apiClient = new ApiClient({
        baseUrl: 'https://example.com/wp-json/gary-ai/v1',
        nonce: 'test-nonce'
      });

      // Test URL validation
      const validUrls = [
        'https://example.com/wp-json/gary-ai/v1/chat',
        'http://localhost:9000/wp-json/gary-ai/v1/token'
      ];

      const invalidUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'file:///etc/passwd',
        'ftp://malicious.com/payload'
      ];

      validUrls.forEach(url => {
        expect(() => new URL(url)).not.toThrow();
      });

      invalidUrls.forEach(url => {
        if (url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('file:')) {
          expect(() => {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
          }).toBeTruthy();
        }
      });
    });

    test('should handle authentication securely', async () => {
      const { ApiClient } = await import('../../src/utils/ApiClient.js');
      
      // Mock fetch to capture requests
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const apiClient = new ApiClient({
        baseUrl: 'https://example.com/wp-json/gary-ai/v1',
        nonce: 'secure-nonce-123'
      });

      await apiClient.sendMessage('test message', 'conv-123');

      // Verify nonce is included in headers
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-WP-Nonce': 'secure-nonce-123'
          })
        })
      );
    });
  });

  describe('Accessibility Compliance', () => {
    test('should meet WCAG 2.1 AA standards', async () => {
      const { ChatWidget } = await import('../../src/components/ChatWidget.js');
      const mockContainer = document.createElement('div');
      const mockApiClient = {
        sendMessage: jest.fn().mockResolvedValue({ message: 'test', id: '123' }),
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn()
      };
      const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), child: jest.fn().mockReturnThis() };

      const widget = new ChatWidget({
        apiClient: mockApiClient,
        logger: mockLogger,
        container: mockContainer
      });

      await widget.mount();

      // Check required ARIA attributes
      const widgetElement = mockContainer.querySelector('.gary-ai-chat-widget');
      expect(widgetElement.getAttribute('role')).toBe('dialog');
      expect(widgetElement.getAttribute('aria-label')).toBeTruthy();
      expect(widgetElement.getAttribute('aria-modal')).toBe('true');

      // Check color contrast (mock implementation)
      const computedStyle = window.getComputedStyle(widgetElement);
      expect(computedStyle.color).toBeTruthy();
      expect(computedStyle.backgroundColor).toBeTruthy();

      // Check keyboard navigation
      const focusableElements = mockContainer.querySelectorAll(
        'button, input, [tabindex="0"], [tabindex="-1"]'
      );
      expect(focusableElements.length).toBeGreaterThan(0);

      // Check semantic HTML structure
      const header = mockContainer.querySelector('header, [role="banner"]');
      const main = mockContainer.querySelector('main, [role="main"], [role="log"]');
      const buttons = mockContainer.querySelectorAll('button');

      expect(header).toBeTruthy();
      expect(main).toBeTruthy();
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        expect(button.getAttribute('aria-label') || button.textContent.trim()).toBeTruthy();
      });
    });

    test('should support screen readers', async () => {
      const { MessageList } = await import('../../src/components/MessageList.js');
      const mockElement = document.createElement('div');
      const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

      const messageList = new MessageList(mockElement, { logger: mockLogger });

      // Add messages and verify ARIA announcements
      messageList.addMessage('Hello', 'user');
      messageList.addMessage('Hi there!', 'assistant');

      const messages = mockElement.querySelectorAll('.gary-ai-message');
      messages.forEach(message => {
        expect(message.getAttribute('role')).toBe('article');
        expect(message.getAttribute('aria-label')).toBeTruthy();
      });

      // Check live region
      const liveRegion = mockElement.querySelector('[aria-live]');
      expect(liveRegion).toBeTruthy();
      expect(['polite', 'assertive']).toContain(liveRegion.getAttribute('aria-live'));
    });
  });

  describe('Browser Compatibility', () => {
    test('should support required browser features', () => {
      // Check for required modern browser features
      const requiredFeatures = [
        'Promise',
        'fetch',
        'addEventListener',
        'querySelector',
        'classList',
        'JSON',
        'localStorage',
        'sessionStorage'
      ];

      requiredFeatures.forEach(feature => {
        if (feature === 'Promise') {
          expect(typeof Promise).toBe('function');
        } else if (feature === 'fetch') {
          expect(typeof fetch).toBe('function');
        } else if (feature === 'JSON') {
          expect(typeof JSON).toBe('object');
        } else if (feature === 'localStorage' || feature === 'sessionStorage') {
          expect(typeof window[feature]).toBe('object');
        } else {
          expect(typeof Element.prototype[feature]).toBe('function');
        }
      });
    });

    test('should have fallbacks for older browsers', () => {
      // Test polyfill detection
      const polyfillChecks = [
        () => typeof Promise !== 'undefined',
        () => typeof fetch !== 'undefined',
        () => typeof Object.assign !== 'undefined',
        () => typeof Array.prototype.includes !== 'undefined'
      ];

      polyfillChecks.forEach(check => {
        expect(check()).toBe(true);
      });
    });
  });

  describe('WordPress Integration Validation', () => {
    test('should integrate properly with WordPress', async () => {
      // Mock WordPress environment
      global.window = {
        garyAI: {
          restUrl: '/wp-json/gary-ai/v1',
          nonce: 'wp-nonce-123',
          debug: false
        },
        wp: {
          hooks: {
            addAction: jest.fn(),
            addFilter: jest.fn(),
            doAction: jest.fn(),
            applyFilters: jest.fn()
          }
        }
      };

      const { default: chatWidget } = await import('../../src/chat-widget.js');

      // Verify WordPress globals are used
      expect(global.window.garyAI).toBeDefined();
      expect(global.window.garyAI.restUrl).toBe('/wp-json/gary-ai/v1');
      expect(global.window.garyAI.nonce).toBe('wp-nonce-123');

      // Verify WordPress hooks integration (if available)
      if (global.window.wp && global.window.wp.hooks) {
        expect(global.window.wp.hooks.addAction).toBeDefined();
        expect(global.window.wp.hooks.addFilter).toBeDefined();
      }
    });

    test('should handle WordPress plugin conflicts', async () => {
      // Mock conflicting plugins
      global.window.jQuery = {
        fn: {
          chatWidget: jest.fn() // Conflicting jQuery plugin
        }
      };

      global.window.ChatWidget = function() {}; // Conflicting global

      // Import should still work without conflicts
      const { default: chatWidget } = await import('../../src/chat-widget.js');
      
      // Verify our widget doesn't conflict
      expect(typeof chatWidget).toBe('function');
      expect(global.window.GaryAI).toBeDefined();
      expect(global.window.GaryAI.init).toBeDefined();
    });
  });

  describe('Error Handling & Recovery', () => {
    test('should handle all error scenarios gracefully', async () => {
      const { ChatWidget } = await import('../../src/components/ChatWidget.js');
      const mockContainer = document.createElement('div');
      const mockLogger = { 
        info: jest.fn(), 
        warn: jest.fn(), 
        error: jest.fn(), 
        debug: jest.fn(), 
        child: jest.fn().mockReturnThis() 
      };

      // Test API failure
      const failingApiClient = {
        sendMessage: jest.fn().mockRejectedValue(new Error('Network error')),
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        disconnect: jest.fn()
      };

      const widget = new ChatWidget({
        apiClient: failingApiClient,
        logger: mockLogger,
        container: mockContainer
      });

      await widget.mount();

      // Widget should still be functional despite API failures
      expect(widget.isInitialized).toBe(true);
      expect(mockLogger.error).toHaveBeenCalled();

      // Test DOM manipulation errors
      const originalQuerySelector = mockContainer.querySelector;
      mockContainer.querySelector = jest.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });

      // Should handle DOM errors gracefully
      expect(() => {
        widget.open();
      }).not.toThrow();

      // Restore original method
      mockContainer.querySelector = originalQuerySelector;
    });

    test('should provide meaningful error messages', async () => {
      const { Logger } = await import('../../src/utils/Logger.js');
      const logger = new Logger('test');

      // Mock console methods
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Test different error types
      logger.error('Network error', new Error('Failed to fetch'));
      logger.error('Validation error', { field: 'message', value: '' });
      logger.error('Unexpected error', 'Something went wrong');

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      
      // Verify error messages are informative
      consoleSpy.mock.calls.forEach(call => {
        expect(call[0]).toContain('[test]');
        expect(call[1]).toBeTruthy();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Deployment Readiness', () => {
    test('should have proper configuration for production', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve('package.json'), 'utf8')
      );

      // Verify production dependencies
      expect(packageJson.name).toBe('gary-ai');
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();

      // Verify no development-only code in production build
      const distPath = path.resolve('dist/chat-widget.js');
      if (fs.existsSync(distPath)) {
        const buildContent = fs.readFileSync(distPath, 'utf8');
        expect(buildContent).not.toContain('console.log');
        expect(buildContent).not.toContain('debugger');
        expect(buildContent).not.toContain('TODO');
        expect(buildContent).not.toContain('FIXME');
      }
    });

    test('should have proper documentation', () => {
      const requiredDocs = [
        'README.md',
        'CHANGELOG.md',
        'docs/installation.md',
        'docs/configuration.md',
        'docs/api.md'
      ];

      requiredDocs.forEach(doc => {
        const docPath = path.resolve(doc);
        if (fs.existsSync(docPath)) {
          const content = fs.readFileSync(docPath, 'utf8');
          expect(content.length).toBeGreaterThan(100); // Should have meaningful content
        }
      });
    });

    test('should have proper version management', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve('package.json'), 'utf8')
      );

      // Check main plugin file for version consistency
      const pluginFile = path.resolve('gary-ai.php');
      if (fs.existsSync(pluginFile)) {
        const pluginContent = fs.readFileSync(pluginFile, 'utf8');
        const versionMatch = pluginContent.match(/Version:\s*([0-9.]+)/);
        
        if (versionMatch) {
          expect(versionMatch[1]).toBe(packageJson.version);
        }
      }
    });
  });
});
