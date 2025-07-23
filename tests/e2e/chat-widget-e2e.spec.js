/**
 * End-to-End Tests for Gary AI Chat Widget
 * 
 * Comprehensive E2E testing using Playwright covering complete user journeys,
 * real browser interactions, and production-like scenarios for all components.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { test, expect } from '@playwright/test';

test.describe('Gary AI Chat Widget E2E Tests', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Setup test environment
    await page.goto('http://localhost:3000/test.html');
    
    // Wait for widget to load
    await page.waitForSelector('.gary-ai-chat-widget', { timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Complete User Journey', () => {
    test('should complete full conversation flow', async () => {
      // 1. Verify initial state - widget closed
      const widget = page.locator('.gary-ai-chat-widget');
      await expect(widget).toBeVisible();
      await expect(widget).not.toHaveClass(/gary-ai-chat-widget--open/);

      // 2. Click chat button to open widget
      const chatButton = page.locator('.gary-ai-chat-button');
      await expect(chatButton).toBeVisible();
      await chatButton.click();

      // 3. Verify widget opens with animation
      await expect(widget).toHaveClass(/gary-ai-chat-widget--open/);
      await expect(page.locator('.gary-ai-chat-header')).toBeVisible();
      await expect(page.locator('.gary-ai-message-list')).toBeVisible();
      await expect(page.locator('.gary-ai-input-area')).toBeVisible();

      // 4. Verify initial focus on input field
      const inputField = page.locator('.gary-ai-input-field');
      await expect(inputField).toBeFocused();

      // 5. Type a message
      const userMessage = 'Hello, I need help with my WordPress site';
      await inputField.fill(userMessage);
      await expect(inputField).toHaveValue(userMessage);

      // 6. Send message via Enter key
      await inputField.press('Enter');

      // 7. Verify user message appears in chat
      const userMessageElement = page.locator('.gary-ai-message--user').last();
      await expect(userMessageElement).toBeVisible();
      await expect(userMessageElement).toContainText(userMessage);

      // 8. Verify typing indicator appears
      const typingIndicator = page.locator('.gary-ai-typing-indicator');
      await expect(typingIndicator).toBeVisible();
      await expect(typingIndicator).toHaveAttribute('aria-live', 'polite');

      // 9. Wait for assistant response
      await page.waitForSelector('.gary-ai-message--assistant', { timeout: 15000 });
      const assistantMessage = page.locator('.gary-ai-message--assistant').last();
      await expect(assistantMessage).toBeVisible();

      // 10. Verify typing indicator disappears
      await expect(typingIndicator).not.toBeVisible();

      // 11. Test message copy functionality
      await assistantMessage.hover();
      const copyButton = assistantMessage.locator('.gary-ai-copy-button');
      await expect(copyButton).toBeVisible();
      await copyButton.click();

      // 12. Verify copy success feedback
      await expect(page.locator('.gary-ai-copy-success')).toBeVisible();

      // 13. Send another message via send button
      const secondMessage = 'Can you help me with SEO optimization?';
      await inputField.fill(secondMessage);
      const sendButton = page.locator('.gary-ai-send-button');
      await sendButton.click();

      // 14. Verify second conversation turn
      await expect(page.locator('.gary-ai-message--user').nth(1)).toContainText(secondMessage);
      await expect(page.locator('.gary-ai-message--assistant').nth(1)).toBeVisible({ timeout: 15000 });

      // 15. Test scroll behavior with multiple messages
      const messageList = page.locator('.gary-ai-message-list');
      await expect(messageList).toHaveCSS('overflow-y', 'auto');

      // 16. Close widget via close button
      const closeButton = page.locator('.gary-ai-close-button');
      await closeButton.click();

      // 17. Verify widget closes
      await expect(widget).not.toHaveClass(/gary-ai-chat-widget--open/);

      // 18. Reopen widget and verify conversation persists
      await chatButton.click();
      await expect(widget).toHaveClass(/gary-ai-chat-widget--open/);
      await expect(page.locator('.gary-ai-message')).toHaveCount(4); // 2 user + 2 assistant
    });

    test('should handle error scenarios gracefully', async () => {
      // Open widget
      await page.locator('.gary-ai-chat-button').click();
      
      // Mock network failure
      await page.route('**/wp-json/gary-ai/v1/chat', route => {
        route.abort('failed');
      });

      // Send message that will fail
      const inputField = page.locator('.gary-ai-input-field');
      await inputField.fill('This message will fail');
      await inputField.press('Enter');

      // Verify error message appears
      await expect(page.locator('.gary-ai-message--error')).toBeVisible();
      await expect(page.locator('.gary-ai-message--error')).toContainText('connection');

      // Verify retry functionality
      const retryButton = page.locator('.gary-ai-retry-button');
      await expect(retryButton).toBeVisible();
      
      // Remove network mock and retry
      await page.unroute('**/wp-json/gary-ai/v1/chat');
      await retryButton.click();

      // Verify message sends successfully after retry
      await expect(page.locator('.gary-ai-message--assistant')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Accessibility Testing', () => {
    test('should be fully accessible via keyboard navigation', async () => {
      // Test keyboard opening
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Verify widget opens
      const widget = page.locator('.gary-ai-chat-widget');
      await expect(widget).toHaveClass(/gary-ai-chat-widget--open/);

      // Test focus management
      await expect(page.locator('.gary-ai-input-field')).toBeFocused();

      // Test Tab navigation through interactive elements
      await page.keyboard.press('Tab');
      await expect(page.locator('.gary-ai-send-button')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('.gary-ai-close-button')).toBeFocused();

      // Test Escape key to close
      await page.keyboard.press('Escape');
      await expect(widget).not.toHaveClass(/gary-ai-chat-widget--open/);

      // Verify focus returns to chat button
      await expect(page.locator('.gary-ai-chat-button')).toBeFocused();
    });

    test('should have proper ARIA attributes and roles', async () => {
      await page.locator('.gary-ai-chat-button').click();

      // Verify widget ARIA attributes
      const widget = page.locator('.gary-ai-chat-widget');
      await expect(widget).toHaveAttribute('role', 'dialog');
      await expect(widget).toHaveAttribute('aria-label');
      await expect(widget).toHaveAttribute('aria-modal', 'true');

      // Verify header ARIA attributes
      const header = page.locator('.gary-ai-chat-header');
      await expect(header).toHaveAttribute('role', 'banner');

      // Verify message list ARIA attributes
      const messageList = page.locator('.gary-ai-message-list');
      await expect(messageList).toHaveAttribute('role', 'log');
      await expect(messageList).toHaveAttribute('aria-live', 'polite');

      // Verify input area ARIA attributes
      const inputField = page.locator('.gary-ai-input-field');
      await expect(inputField).toHaveAttribute('aria-label');
      await expect(inputField).toHaveAttribute('aria-describedby');

      // Send message and verify message ARIA attributes
      await inputField.fill('Test accessibility');
      await inputField.press('Enter');

      const userMessage = page.locator('.gary-ai-message--user').last();
      await expect(userMessage).toHaveAttribute('role', 'article');
      await expect(userMessage).toHaveAttribute('aria-label');
    });

    test('should work with screen readers', async () => {
      // Open widget
      await page.locator('.gary-ai-chat-button').click();

      // Verify live region announcements
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toBeVisible();

      // Send message and verify announcement
      const inputField = page.locator('.gary-ai-input-field');
      await inputField.fill('Screen reader test');
      await inputField.press('Enter');

      // Verify typing indicator announcement
      const typingIndicator = page.locator('.gary-ai-typing-indicator');
      await expect(typingIndicator).toHaveAttribute('aria-live', 'polite');
      await expect(typingIndicator).toContainText('typing');

      // Wait for response and verify announcement
      await page.waitForSelector('.gary-ai-message--assistant');
      
      // Verify message has proper labeling for screen readers
      const assistantMessage = page.locator('.gary-ai-message--assistant').last();
      await expect(assistantMessage).toHaveAttribute('aria-label');
    });
  });

  test.describe('Performance Testing', () => {
    test('should load and render quickly', async () => {
      const startTime = Date.now();
      
      // Measure initial load time
      await page.goto('http://localhost:3000/test.html');
      await page.waitForSelector('.gary-ai-chat-widget');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds

      // Measure widget open time
      const openStartTime = Date.now();
      await page.locator('.gary-ai-chat-button').click();
      await page.waitForSelector('.gary-ai-chat-widget--open');
      
      const openTime = Date.now() - openStartTime;
      expect(openTime).toBeLessThan(500); // Should open within 500ms
    });

    test('should handle rapid interactions smoothly', async () => {
      await page.locator('.gary-ai-chat-button').click();
      
      const inputField = page.locator('.gary-ai-input-field');
      
      // Send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        await inputField.fill(`Rapid message ${i + 1}`);
        await inputField.press('Enter');
        await page.waitForTimeout(100); // Small delay between messages
      }

      // Verify all messages appear
      await expect(page.locator('.gary-ai-message--user')).toHaveCount(5);
      
      // Verify widget remains responsive
      const closeButton = page.locator('.gary-ai-close-button');
      await expect(closeButton).toBeEnabled();
      await closeButton.click();
      
      await expect(page.locator('.gary-ai-chat-widget')).not.toHaveClass(/gary-ai-chat-widget--open/);
    });

    test('should handle large conversation history', async () => {
      await page.locator('.gary-ai-chat-button').click();
      
      // Add many messages via JavaScript for speed
      await page.evaluate(() => {
        const messageList = document.querySelector('.gary-ai-message-list');
        const widget = window.garyAIWidget;
        
        for (let i = 0; i < 50; i++) {
          widget.messageList.addMessage(`Message ${i + 1}`, i % 2 === 0 ? 'user' : 'assistant');
        }
      });

      // Verify scroll behavior with many messages
      const messageList = page.locator('.gary-ai-message-list');
      await expect(messageList).toBeVisible();
      
      // Verify auto-scroll to bottom
      const lastMessage = page.locator('.gary-ai-message').last();
      await expect(lastMessage).toBeInViewport();

      // Test scroll performance
      await messageList.evaluate(el => el.scrollTop = 0);
      await page.waitForTimeout(100);
      
      // Scroll should be smooth and responsive
      await messageList.evaluate(el => el.scrollTop = el.scrollHeight);
      await expect(lastMessage).toBeInViewport();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify widget adapts to mobile
      const widget = page.locator('.gary-ai-chat-widget');
      await expect(widget).toHaveCSS('position', 'fixed');
      
      // Open widget
      await page.locator('.gary-ai-chat-button').click();
      
      // Verify mobile layout
      await expect(widget).toHaveClass(/gary-ai-chat-widget--mobile/);
      
      // Test touch interactions
      const inputField = page.locator('.gary-ai-input-field');
      await inputField.tap();
      await expect(inputField).toBeFocused();
      
      // Test mobile send button
      await inputField.fill('Mobile test message');
      const sendButton = page.locator('.gary-ai-send-button');
      await sendButton.tap();
      
      // Verify message appears
      await expect(page.locator('.gary-ai-message--user')).toContainText('Mobile test message');
    });

    test('should handle orientation changes', async () => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.locator('.gary-ai-chat-button').click();
      
      // Verify portrait layout
      const widget = page.locator('.gary-ai-chat-widget');
      await expect(widget).toBeVisible();
      
      // Change to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      
      // Verify widget adapts to landscape
      await expect(widget).toBeVisible();
      await expect(widget).toHaveClass(/gary-ai-chat-widget--landscape/);
      
      // Verify functionality still works
      const inputField = page.locator('.gary-ai-input-field');
      await inputField.fill('Landscape test');
      await inputField.press('Enter');
      
      await expect(page.locator('.gary-ai-message--user')).toContainText('Landscape test');
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work consistently across browsers', async () => {
      // This test runs across different browsers via Playwright config
      
      // Test core functionality
      await page.locator('.gary-ai-chat-button').click();
      
      const widget = page.locator('.gary-ai-chat-widget');
      await expect(widget).toHaveClass(/gary-ai-chat-widget--open/);
      
      // Test CSS features
      await expect(widget).toHaveCSS('opacity', '1');
      await expect(widget).toHaveCSS('visibility', 'visible');
      
      // Test JavaScript functionality
      const inputField = page.locator('.gary-ai-input-field');
      await inputField.fill('Cross-browser test');
      await inputField.press('Enter');
      
      await expect(page.locator('.gary-ai-message--user')).toContainText('Cross-browser test');
      
      // Test animations
      const closeButton = page.locator('.gary-ai-close-button');
      await closeButton.click();
      
      // Wait for close animation
      await page.waitForTimeout(300);
      await expect(widget).not.toHaveClass(/gary-ai-chat-widget--open/);
    });
  });

  test.describe('Security Testing', () => {
    test('should sanitize user input properly', async () => {
      await page.locator('.gary-ai-chat-button').click();
      
      // Test XSS prevention
      const maliciousInput = '<script>alert("XSS")</script>';
      const inputField = page.locator('.gary-ai-input-field');
      await inputField.fill(maliciousInput);
      await inputField.press('Enter');
      
      // Verify script is not executed
      const userMessage = page.locator('.gary-ai-message--user').last();
      await expect(userMessage).toContainText('<script>alert("XSS")</script>');
      
      // Verify no script tags in DOM
      const scriptTags = page.locator('script:has-text("XSS")');
      await expect(scriptTags).toHaveCount(0);
    });

    test('should handle malformed HTML input', async () => {
      await page.locator('.gary-ai-chat-button').click();
      
      const malformedHTML = '<div><span>Unclosed tags<div><p>';
      const inputField = page.locator('.gary-ai-input-field');
      await inputField.fill(malformedHTML);
      await inputField.press('Enter');
      
      // Verify message displays safely
      const userMessage = page.locator('.gary-ai-message--user').last();
      await expect(userMessage).toBeVisible();
      await expect(userMessage).toContainText('Unclosed tags');
    });
  });

  test.describe('WordPress Integration', () => {
    test('should integrate with WordPress environment', async () => {
      // Verify WordPress globals are available
      const wpGlobals = await page.evaluate(() => {
        return {
          hasGaryAI: typeof window.garyAI !== 'undefined',
          hasRestUrl: window.garyAI?.restUrl,
          hasNonce: window.garyAI?.nonce
        };
      });
      
      expect(wpGlobals.hasGaryAI).toBe(true);
      expect(wpGlobals.hasRestUrl).toBeTruthy();
      expect(wpGlobals.hasNonce).toBeTruthy();
      
      // Test API integration
      await page.locator('.gary-ai-chat-button').click();
      const inputField = page.locator('.gary-ai-input-field');
      await inputField.fill('WordPress integration test');
      await inputField.press('Enter');
      
      // Verify API call is made with proper headers
      const apiRequest = await page.waitForRequest(request => 
        request.url().includes('/wp-json/gary-ai/v1/chat')
      );
      
      expect(apiRequest.headers()['x-wp-nonce']).toBeTruthy();
      expect(apiRequest.method()).toBe('POST');
    });
  });
});
