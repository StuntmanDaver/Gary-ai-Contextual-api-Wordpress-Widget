/**
 * Jest Test Setup
 * 
 * Global test configuration and utilities for Gary AI Chat Widget tests.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock fetch API
global.fetch = jest.fn();

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue('')
  },
  writable: true
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: []
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn()
}));

// Mock CSS custom properties
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: jest.fn().mockReturnValue(''),
    setProperty: jest.fn()
  })
});

// Mock WordPress globals
global.window.garyAI = {
  restUrl: '/wp-json/gary-ai/v1',
  nonce: 'test-nonce-12345',
  userId: 1,
  userName: 'Test User',
  userEmail: 'test@example.com',
  isLoggedIn: true,
  settings: {
    widget_enabled: true,
    widget_position: 'bottom-right',
    widget_theme: 'light',
    max_conversation_length: 50,
    welcome_message: 'Hello! How can I help you today?'
  }
};

// Mock console methods for cleaner test output
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Restore console for specific tests if needed
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Custom matchers
expect.extend({
  toBeInDOM(received) {
    const pass = document.body.contains(received);
    return {
      pass,
      message: () => pass 
        ? `Expected element not to be in DOM`
        : `Expected element to be in DOM`
    };
  },
  
  toHaveAccessibleName(received, expectedName) {
    const accessibleName = received.getAttribute('aria-label') || 
                          received.getAttribute('aria-labelledby') ||
                          received.textContent;
    const pass = accessibleName === expectedName;
    return {
      pass,
      message: () => pass
        ? `Expected element not to have accessible name "${expectedName}"`
        : `Expected element to have accessible name "${expectedName}", but got "${accessibleName}"`
    };
  }
});

// Test utilities
global.createMockElement = (tag = 'div', attributes = {}) => {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

global.createMockLogger = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
});

global.createMockApiClient = () => ({
  getToken: jest.fn().mockResolvedValue({ success: true, data: { token: 'mock-token' } }),
  sendMessage: jest.fn().mockResolvedValue({ success: true, data: { response: 'Mock response' } }),
  getSettings: jest.fn().mockResolvedValue({ success: true, data: global.window.garyAI.settings }),
  checkHealth: jest.fn().mockResolvedValue({ healthy: true, status: 'ok' }),
  reconnectSession: jest.fn().mockResolvedValue({ success: true }),
  resumeConversation: jest.fn().mockResolvedValue({ success: true, messages: [] })
});

// Cleanup after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Clear fetch mock
  fetch.mockClear();
  
  // Clear DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});
