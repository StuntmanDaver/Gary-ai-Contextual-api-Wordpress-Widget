/**
 * Logger Utility Unit Tests
 * 
 * Comprehensive test suite for Logger utility covering:
 * - Constructor and initialization
 * - Log level management and filtering
 * - Message formatting and output
 * - Storage and persistence features
 * - Console output and WordPress integration
 * - Error handling and cleanup
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { Logger } from '../../src/utils/Logger.js';

describe('Logger', () => {
  let mockConsole;
  let mockLocalStorage;

  beforeEach(() => {
    // Mock console methods
    mockConsole = {
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    global.console = mockConsole;

    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = mockLocalStorage;

    // Mock window object
    global.window = {
      garyAI: {
        debug: false
      }
    };

    // Mock process.env
    global.process = {
      env: {
        NODE_ENV: 'test'
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.window;
    delete global.process;
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default options', () => {
      const logger = new Logger();

      expect(logger.context).toBe('GaryAI');
      expect(logger.level).toBe('INFO');
      expect(logger.enableConsole).toBe(true);
      expect(logger.enableStorage).toBe(false);
      expect(logger.maxStorageEntries).toBe(100);
    });

    test('should initialize with custom context', () => {
      const logger = new Logger('CustomContext');

      expect(logger.context).toBe('CustomContext');
    });

    test('should initialize with custom options', () => {
      const options = {
        level: 'DEBUG',
        enableConsole: false,
        enableStorage: true,
        maxStorageEntries: 50
      };

      const logger = new Logger('Test', options);

      expect(logger.level).toBe('DEBUG');
      expect(logger.enableConsole).toBe(false);
      expect(logger.enableStorage).toBe(true);
      expect(logger.maxStorageEntries).toBe(50);
    });

    test('should define log levels correctly', () => {
      const logger = new Logger();

      expect(logger.levels.ERROR).toBe(0);
      expect(logger.levels.WARN).toBe(1);
      expect(logger.levels.INFO).toBe(2);
      expect(logger.levels.DEBUG).toBe(3);
    });

    test('should initialize storage when enabled', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      new Logger('Test', { enableStorage: true });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('gary-ai-logs', '[]');
    });

    test('should handle storage initialization errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const logger = new Logger('Test', { enableStorage: true });

      expect(logger.enableStorage).toBe(false);
      expect(mockConsole.warn).toHaveBeenCalledWith('Gary AI: Failed to initialize log storage');
    });
  });

  describe('Log Level Management', () => {
    test('should get log level from WordPress debug', () => {
      global.window.garyAI.debug = true;
      
      const logger = new Logger();

      expect(logger.level).toBe('DEBUG');
    });

    test('should get log level from NODE_ENV', () => {
      global.process.env.NODE_ENV = 'development';
      
      const logger = new Logger();

      expect(logger.level).toBe('DEBUG');
    });

    test('should default to INFO level', () => {
      global.window.garyAI.debug = false;
      global.process.env.NODE_ENV = 'production';
      
      const logger = new Logger();

      expect(logger.level).toBe('INFO');
    });

    test('should check if message should be logged', () => {
      const logger = new Logger('Test', { level: 'WARN' });

      expect(logger.shouldLog('ERROR')).toBe(true);
      expect(logger.shouldLog('WARN')).toBe(true);
      expect(logger.shouldLog('INFO')).toBe(false);
      expect(logger.shouldLog('DEBUG')).toBe(false);
    });
  });

  describe('Message Formatting', () => {
    test('should format message with timestamp and context', () => {
      const logger = new Logger('TestContext');
      const mockDate = new Date('2023-01-01T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const formatted = logger.formatMessage('INFO', 'Test message');

      expect(formatted.prefix).toBe('[2023-01-01T12:00:00.000Z] [TestContext] [INFO]');
      expect(formatted.message).toBe('Test message');
    });

    test('should format message with data', () => {
      const logger = new Logger('TestContext');
      const data = { key: 'value' };

      const formatted = logger.formatMessage('INFO', 'Test message', data);

      expect(formatted.data).toEqual(data);
    });
  });

  describe('Logging Methods', () => {
    let logger;

    beforeEach(() => {
      logger = new Logger('Test', { level: 'DEBUG' });
    });

    test('should log error messages', () => {
      logger.error('Error message');

      expect(mockConsole.error).toHaveBeenCalled();
    });

    test('should log warning messages', () => {
      logger.warn('Warning message');

      expect(mockConsole.warn).toHaveBeenCalled();
    });

    test('should log info messages', () => {
      logger.info('Info message');

      expect(mockConsole.info).toHaveBeenCalled();
    });

    test('should log debug messages', () => {
      logger.debug('Debug message');

      expect(mockConsole.debug).toHaveBeenCalled();
    });

    test('should not log messages below current level', () => {
      const warnLogger = new Logger('Test', { level: 'WARN' });
      
      warnLogger.info('Info message');
      warnLogger.debug('Debug message');

      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    test('should log messages with data', () => {
      const data = { error: 'details' };
      
      logger.error('Error occurred', data);

      expect(mockConsole.error).toHaveBeenCalled();
    });

    test('should respect console disable option', () => {
      const noConsoleLogger = new Logger('Test', { enableConsole: false });
      
      noConsoleLogger.info('Test message');

      expect(mockConsole.info).not.toHaveBeenCalled();
    });
  });

  describe('Storage and Persistence', () => {
    let logger;

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('[]');
      logger = new Logger('Test', { enableStorage: true });
    });

    test('should store log entries', () => {
      logger.info('Test message');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'gary-ai-logs',
        expect.stringContaining('Test message')
      );
    });

    test('should limit storage entries', () => {
      const limitedLogger = new Logger('Test', { 
        enableStorage: true, 
        maxStorageEntries: 2 
      });
      
      // Mock existing logs
      const existingLogs = [
        { timestamp: 1, message: 'Old message 1' },
        { timestamp: 2, message: 'Old message 2' }
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingLogs));
      
      limitedLogger.info('New message');

      // Should remove oldest entry
      const setItemCall = mockLocalStorage.setItem.mock.calls.find(
        call => call[0] === 'gary-ai-logs'
      );
      const storedLogs = JSON.parse(setItemCall[1]);
      expect(storedLogs).toHaveLength(2);
      expect(storedLogs[0].message).toBe('Old message 2');
    });

    test('should handle storage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        logger.info('Test message');
      }).not.toThrow();
    });

    test('should retrieve stored logs', () => {
      const storedLogs = [
        { timestamp: 1, message: 'Stored message' }
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedLogs));

      const logs = logger.getLogs();

      expect(logs).toEqual(storedLogs);
    });

    test('should clear stored logs', () => {
      logger.clearLogs();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('gary-ai-logs', '[]');
    });
  });

  describe('Error Handling and Cleanup', () => {
    test('should handle undefined window object', () => {
      delete global.window;
      

      const logCall = mockConsole.info.mock.calls[0][0];
      expect(logCall).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should include context in log format', () => {
      const logger = new Logger('CustomContext', { level: 'DEBUG' });

      logger.info('Test message');

      const logCall = mockConsole.info.mock.calls[0][0];
      expect(logCall).toContain('[CustomContext]');
    });

    test('should include log level in format', () => {
      const logger = new Logger('Test', { level: 'DEBUG' });

      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(mockConsole.error.mock.calls[0][0]).toContain('ERROR');
      expect(mockConsole.warn.mock.calls[0][0]).toContain('WARN');
      expect(mockConsole.info.mock.calls[0][0]).toContain('INFO');
      expect(mockConsole.debug.mock.calls[0][0]).toContain('DEBUG');
    });

    test('should handle special characters in messages', () => {
      const logger = new Logger('Test', { level: 'DEBUG' });

      logger.info('Message with "quotes" and \'apostrophes\' and \n newlines');

      expect(mockConsole.info).toHaveBeenCalled();
    });

    test('should handle undefined and null values', () => {
      const logger = new Logger('Test', { level: 'DEBUG' });

      logger.info('Test', undefined, null);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        expect.stringContaining('Test undefined null')
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle console method errors', () => {
      mockConsole.info.mockImplementation(() => {
        throw new Error('Console error');
      });

      const logger = new Logger('Test', { level: 'DEBUG' });

      // Should not throw
      expect(() => {
        logger.info('Test message');
      }).not.toThrow();
    });

    test('should handle invalid log levels', () => {
      const logger = new Logger('Test', { level: 'INVALID' });

      // Should default to a safe level
      logger.info('Test message');

      expect(mockConsole.info).toHaveBeenCalled();
    });

    test('should handle missing localStorage', () => {
      delete global.localStorage;

      const logger = new Logger('Test', { enableStorage: true });

      // Should not throw
      expect(() => {
        logger.info('Test message');
      }).not.toThrow();
    });

    test('should handle circular references in objects', () => {
      const logger = new Logger('Test', { level: 'DEBUG' });
      
      const circularObj = { name: 'test' };
      circularObj.self = circularObj;

      // Should not throw
      expect(() => {
        logger.info('Circular object', circularObj);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should not format messages when level is filtered', () => {
      const logger = new Logger('Test', { level: 'ERROR' });
      const expensiveOperation = jest.fn(() => 'expensive result');

      logger.debug('Debug message', expensiveOperation());

      // Expensive operation should not be called
      expect(expensiveOperation).not.toHaveBeenCalled();
    });

    test('should handle high-frequency logging', () => {
      const logger = new Logger('Test', { level: 'DEBUG' });

      // Log many messages quickly
      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`);
      }

      expect(mockConsole.info).toHaveBeenCalledTimes(1000);
    });

    test('should optimize storage operations', () => {
      const logger = new Logger('Test', { 
        enableStorage: true,
        maxStorageEntries: 10
      });

      // Add many logs
      for (let i = 0; i < 20; i++) {
        logger.info(`Message ${i}`);
      }

      // Should not call setItem for every log
      expect(localStorage.setItem.mock.calls.length).toBeLessThan(20);
    });
  });

  describe('Integration', () => {
    test('should work with WordPress globals', () => {
      global.window.garyAI = {
        debug: true,
        logLevel: 'DEBUG'
      };

      const logger = new Logger('WordPress');

      logger.debug('WordPress integration test');

      expect(mockConsole.debug).toHaveBeenCalled();
    });

    test('should integrate with error reporting', () => {
      const logger = new Logger('Test', { level: 'DEBUG' });
      const errorHandler = jest.fn();

      logger.onError = errorHandler;
      logger.error('Critical error', new Error('Test error'));

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'ERROR',
          message: expect.stringContaining('Critical error')
        })
      );
    });

    test('should support custom formatters', () => {
      const logger = new Logger('Test', { level: 'DEBUG' });
      
      logger.setFormatter((level, context, message, ...args) => {
        return `CUSTOM: [${context}] ${level} - ${message}`;
      });

      logger.info('Custom format test');

      expect(mockConsole.info).toHaveBeenCalledWith(
        'CUSTOM: [Test] INFO - Custom format test'
      );
    });
  });

  describe('Utility Methods', () => {
    test('should set log level dynamically', () => {
      const logger = new Logger('Test', { level: 'ERROR' });

      logger.setLevel('DEBUG');

      expect(logger.level).toBe('DEBUG');
    });

    test('should check if level is enabled', () => {
      const logger = new Logger('Test', { level: 'WARN' });

      expect(logger.isLevelEnabled('ERROR')).toBe(true);
      expect(logger.isLevelEnabled('WARN')).toBe(true);
      expect(logger.isLevelEnabled('INFO')).toBe(false);
      expect(logger.isLevelEnabled('DEBUG')).toBe(false);
    });

    test('should get current configuration', () => {
      const logger = new Logger('Test', { 
        level: 'INFO',
        enableConsole: true,
        enableStorage: false
      });

      const config = logger.getConfig();

      expect(config).toEqual({
        context: 'Test',
        level: 'INFO',
        enableConsole: true,
        enableStorage: false,
        maxStorageEntries: 100
      });
    });

    test('should export logs in different formats', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify([
        { level: 'INFO', message: 'Test message', timestamp: Date.now() }
      ]));

      const logger = new Logger('Test', { enableStorage: true });

      const jsonExport = logger.exportLogs('json');
      const csvExport = logger.exportLogs('csv');

      expect(jsonExport).toContain('Test message');
      expect(csvExport).toContain('Test message');
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources on destroy', () => {
      const logger = new Logger('Test', { enableStorage: true });

      logger.destroy();

      expect(logger.context).toBe(null);
      expect(logger.levels).toBe(null);
    });

    test('should stop logging after destroy', () => {
      const logger = new Logger('Test', { level: 'DEBUG' });

      logger.destroy();
      logger.info('Should not log');

      expect(mockConsole.info).not.toHaveBeenCalled();
    });
  });
});
