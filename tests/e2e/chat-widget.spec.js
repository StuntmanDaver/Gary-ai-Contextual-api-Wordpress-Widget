/**
 * Chat Widget E2E Tests
 * 
 * Comprehensive end-to-end tests for the Gary AI chat widget in WordPress environment.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { test, expect } from '@playwright/test';

test.describe('Gary AI Chat Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page with widget
    await page.goto('/test-api-integration.html');
    
    // Wait for widget to initialize
    await page.waitForSelector('#gary-ai-widget-container', { timeout: 10000 });
    
    // Ensure widget is loaded
    await expect(page.locator('.gary-ai-chat-widget')).toBeVisible();
  });

  test.describe('Widget Initialization', () => {
    test('should load widget with correct initial state', async ({ page }) => {
      // Check widget container exists
      await expect(page.locator('#gary-ai-widget-container')).toBeVisible();
      
      // Check chat button is visible
      await expect(page.locator('.gary-ai-chat-button')).toBeVisible();
      
      // Check chat window is initially hidden
      await expect(page.locator('.gary-ai-chat-window')).toHaveClass(/gary-ai-hidden/);
      
      // Check widget position
      await expect(page.locator('.gary-ai-chat-widget')).toHaveClass(/gary-ai-position-bottom-right/);
    });

    test('should have proper accessibility attributes', async ({ page }) => {
      const chatButton = page.locator('.gary-ai-chat-button');
      
      await expect(chatButton).toHaveAttribute('role', 'button');
      await expect(chatButton).toHaveAttribute('aria-label');
      await expect(chatButton).toHaveAttribute('tabindex', '0');
    });

    test('should load with WordPress globals', async ({ page }) => {
      const garyAIGlobals = await page.evaluate(() => window.garyAI);
      
      expect(garyAIGlobals).toBeDefined();
      expect(garyAIGlobals.restUrl).toBe('/wp-json/gary-ai/v1');
      expect(garyAIGlobals.nonce).toBeDefined();
      expect(garyAIGlobals.settings).toBeDefined();
    });
  });

  test.describe('Widget Opening and Closing', () => {
    test('should open widget when chat button is clicked', async ({ page }) => {
      const chatButton = page.locator('.gary-ai-chat-button');
      const chatWindow = page.locator('.gary-ai-chat-window');
      
      await chatButton.click();
      
      // Wait for opening animation
      await page.waitForTimeout(500);
      
      await expect(chatWindow).not.toHaveClass(/gary-ai-hidden/);
      await expect(chatWindow).toBeVisible();
    });

    test('should close widget when close button is clicked', async ({ page }) => {
      // Open widget first
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
      
      // Close widget
      const closeButton = page.locator('.gary-ai-close-button');
      await closeButton.click();
      
      // Wait for closing animation
      await page.waitForTimeout(500);
      
      const chatWindow = page.locator('.gary-ai-chat-window');
      await expect(chatWindow).toHaveClass(/gary-ai-hidden/);
    });

    test('should minimize and restore widget', async ({ page }) => {
      // Open widget
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
      
      // Minimize widget
      const minimizeButton = page.locator('.gary-ai-minimize-button');
      await minimizeButton.click();
      
      const chatWindow = page.locator('.gary-ai-chat-window');
      await expect(chatWindow).toHaveClass(/gary-ai-minimized/);
      
      // Restore by clicking header
      const header = page.locator('.gary-ai-chat-header');
      await header.click();
      
      await expect(chatWindow).not.toHaveClass(/gary-ai-minimized/);
    });

    test('should close widget with Escape key', async ({ page }) => {
      // Open widget
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Wait for closing animation
      await page.waitForTimeout(500);
      
      const chatWindow = page.locator('.gary-ai-chat-window');
      await expect(chatWindow).toHaveClass(/gary-ai-hidden/);
    });
  });

  test.describe('Message Sending and Receiving', () => {
    test.beforeEach(async ({ page }) => {
      // Open widget before each test
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
    });

    test('should send message when send button is clicked', async ({ page }) => {
      const input = page.locator('.gary-ai-input');
      const sendButton = page.locator('.gary-ai-send-button');
      
      const testMessage = 'Hello, this is a test message!';
      
      await input.fill(testMessage);
      await sendButton.click();
      
      // Check user message appears
      const userMessage = page.locator('.gary-ai-message-user').last();
      await expect(userMessage).toContainText(testMessage);
      
      // Check input is cleared
      await expect(input).toHaveValue('');
    });

    test('should send message with Enter key', async ({ page }) => {
      const input = page.locator('.gary-ai-input');
      
      const testMessage = 'Message sent with Enter key';
      
      await input.fill(testMessage);
      await input.press('Enter');
      
      // Check user message appears
      const userMessage = page.locator('.gary-ai-message-user').last();
      await expect(userMessage).toContainText(testMessage);
    });

    test('should not send message with Shift+Enter', async ({ page }) => {
      const input = page.locator('.gary-ai-input');
      
      const testMessage = 'Message with Shift+Enter';
      
      await input.fill(testMessage);
      await input.press('Shift+Enter');
      
      // Message should still be in input
      await expect(input).toHaveValue(testMessage);
      
      // No new message should appear
      const messages = page.locator('.gary-ai-message-user');
      const initialCount = await messages.count();
      
      // Wait a bit to ensure no message was sent
      await page.waitForTimeout(1000);
      
      const finalCount = await messages.count();
      expect(finalCount).toBe(initialCount);
    });

    test('should not send empty messages', async ({ page }) => {
      const input = page.locator('.gary-ai-input');
      const sendButton = page.locator('.gary-ai-send-button');
      
      // Try to send empty message
      await input.fill('   ');
      await sendButton.click();
      
      // No message should appear
      const messages = page.locator('.gary-ai-message');
      const count = await messages.count();
      expect(count).toBe(0);
    });

    test('should show typing indicator during API call', async ({ page }) => {
      // Mock slow API response
      await page.route('/wp-json/gary-ai/v1/chat', async route => {
        // Delay response to see typing indicator
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              response: 'Delayed response',
              conversation_id: 'test-conv-123'
            }
          })
        });
      });
      
      const input = page.locator('.gary-ai-input');
      const sendButton = page.locator('.gary-ai-send-button');
      const typingIndicator = page.locator('.gary-ai-typing-indicator');
      
      await input.fill('Test message');
      await sendButton.click();
      
      // Check typing indicator appears
      await expect(typingIndicator).toBeVisible();
      await expect(typingIndicator).not.toHaveClass(/gary-ai-hidden/);
      
      // Wait for response and check typing indicator disappears
      await expect(page.locator('.gary-ai-message-bot').last()).toContainText('Delayed response');
      await expect(typingIndicator).toHaveClass(/gary-ai-hidden/);
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('/wp-json/gary-ai/v1/chat', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error'
          })
        });
      });
      
      const input = page.locator('.gary-ai-input');
      const sendButton = page.locator('.gary-ai-send-button');
      
      await input.fill('Test message');
      await sendButton.click();
      
      // Check error message appears
      const errorMessage = page.locator('.gary-ai-message-error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('error');
    });
  });

  test.describe('Markdown Rendering', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
    });

    test('should render markdown in AI responses', async ({ page }) => {
      // Mock API response with markdown
      await page.route('/wp-json/gary-ai/v1/chat', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              response: '# Heading\n\nThis is **bold** text with `inline code`.\n\n```javascript\nconst x = 1;\nconsole.log(x);\n```',
              conversation_id: 'test-conv-123'
            }
          })
        });
      });
      
      const input = page.locator('.gary-ai-input');
      const sendButton = page.locator('.gary-ai-send-button');
      
      await input.fill('Show me markdown');
      await sendButton.click();
      
      const botMessage = page.locator('.gary-ai-message-bot').last();
      
      // Check markdown elements are rendered
      await expect(botMessage.locator('h1')).toContainText('Heading');
      await expect(botMessage.locator('strong')).toContainText('bold');
      await expect(botMessage.locator('code')).toContainText('inline code');
      await expect(botMessage.locator('.gary-ai-code-block')).toBeVisible();
    });

    test('should enable code copying functionality', async ({ page }) => {
      // Mock API response with code block
      await page.route('/wp-json/gary-ai/v1/chat', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              response: '```javascript\nconst message = "Hello World";\nconsole.log(message);\n```',
              conversation_id: 'test-conv-123'
            }
          })
        });
      });
      
      const input = page.locator('.gary-ai-input');
      await input.fill('Show me code');
      await input.press('Enter');
      
      const botMessage = page.locator('.gary-ai-message-bot').last();
      const copyButton = botMessage.locator('.gary-ai-code-copy');
      
      await expect(copyButton).toBeVisible();
      await expect(copyButton).toContainText('Copy');
      
      // Click copy button
      await copyButton.click();
      
      // Check button state changes
      await expect(copyButton).toContainText('Copied!');
      
      // Button should reset after timeout
      await page.waitForTimeout(2500);
      await expect(copyButton).toContainText('Copy');
    });
  });

  test.describe('Accessibility Features', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Tab to chat button
      await page.keyboard.press('Tab');
      await expect(page.locator('.gary-ai-chat-button')).toBeFocused();
      
      // Open with Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Should focus input when opened
      await expect(page.locator('.gary-ai-input')).toBeFocused();
      
      // Tab through focusable elements
      await page.keyboard.press('Tab');
      await expect(page.locator('.gary-ai-send-button')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('.gary-ai-minimize-button')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('.gary-ai-close-button')).toBeFocused();
    });

    test('should have proper ARIA live regions', async ({ page }) => {
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
      
      const messageList = page.locator('.gary-ai-message-list');
      await expect(messageList).toHaveAttribute('aria-live', 'polite');
      await expect(messageList).toHaveAttribute('role', 'log');
    });

    test('should announce new messages to screen readers', async ({ page }) => {
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
      
      // Mock API response
      await page.route('/wp-json/gary-ai/v1/chat', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              response: 'This is an AI response for screen readers',
              conversation_id: 'test-conv-123'
            }
          })
        });
      });
      
      const input = page.locator('.gary-ai-input');
      await input.fill('Test message');
      await input.press('Enter');
      
      // Check for screen reader announcement
      const announcement = page.locator('.gary-ai-sr-only');
      await expect(announcement).toContainText('AI response for screen readers');
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const chatWidget = page.locator('.gary-ai-chat-widget');
      await expect(chatWidget).toHaveClass(/gary-ai-mobile/);
      
      // Open widget
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
      
      // Check mobile-specific styles
      const chatWindow = page.locator('.gary-ai-chat-window');
      await expect(chatWindow).toBeVisible();
      
      // Widget should take more screen space on mobile
      const boundingBox = await chatWindow.boundingBox();
      expect(boundingBox.width).toBeGreaterThan(300);
    });

    test('should work on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      
      const chatWidget = page.locator('.gary-ai-chat-widget');
      await expect(chatWidget).not.toHaveClass(/gary-ai-mobile/);
      
      // Open widget
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
      
      // Check desktop positioning
      const chatWindow = page.locator('.gary-ai-chat-window');
      const boundingBox = await chatWindow.boundingBox();
      
      // Should be positioned in bottom-right
      expect(boundingBox.x).toBeGreaterThan(800);
      expect(boundingBox.y).toBeGreaterThan(200);
    });
  });

  test.describe('Session Management', () => {
    test('should maintain conversation across page reloads', async ({ page }) => {
      // Open widget and send message
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
      
      // Mock API responses
      await page.route('/wp-json/gary-ai/v1/chat', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              response: 'Response before reload',
              conversation_id: 'persistent-conv-123'
            }
          })
        });
      });
      
      const input = page.locator('.gary-ai-input');
      await input.fill('Message before reload');
      await input.press('Enter');
      
      // Wait for message to appear
      await expect(page.locator('.gary-ai-message-bot').last()).toContainText('Response before reload');
      
      // Reload page
      await page.reload();
      await page.waitForSelector('#gary-ai-widget-container');
      
      // Check if conversation state is restored
      // This would require the widget to implement session restoration
      const sessionId = await page.evaluate(() => localStorage.getItem('gary-ai-session-id'));
      expect(sessionId).toBeDefined();
    });

    test('should handle session reconnection', async ({ page }) => {
      // Mock token expiration scenario
      let tokenExpired = false;
      
      await page.route('/wp-json/gary-ai/v1/chat', route => {
        if (!tokenExpired) {
          tokenExpired = true;
          route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Token expired'
            })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                response: 'Response after reconnection',
                conversation_id: 'reconnected-conv-123'
              }
            })
          });
        }
      });
      
      // Mock token refresh
      await page.route('/wp-json/gary-ai/v1/token', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'new-token-after-reconnect',
              expires_in: 900
            }
          })
        });
      });
      
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
      
      const input = page.locator('.gary-ai-input');
      await input.fill('Test reconnection');
      await input.press('Enter');
      
      // Should eventually get successful response after reconnection
      await expect(page.locator('.gary-ai-message-bot').last()).toContainText('Response after reconnection');
    });
  });

  test.describe('Performance', () => {
    test('should load widget quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/test-api-integration.html');
      await page.waitForSelector('.gary-ai-chat-widget');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle multiple rapid messages', async ({ page }) => {
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForTimeout(500);
      
      // Mock API responses
      await page.route('/wp-json/gary-ai/v1/chat', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              response: 'Quick response',
              conversation_id: 'rapid-test-123'
            }
          })
        });
      });
      
      const input = page.locator('.gary-ai-input');
      
      // Send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        await input.fill(`Rapid message ${i + 1}`);
        await input.press('Enter');
        await page.waitForTimeout(100);
      }
      
      // All messages should be handled
      const userMessages = page.locator('.gary-ai-message-user');
      await expect(userMessages).toHaveCount(5);
    });
  });
});
