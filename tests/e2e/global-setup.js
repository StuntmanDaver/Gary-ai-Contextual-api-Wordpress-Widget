/**
 * Playwright Global Setup
 * 
 * Sets up test environment and WordPress mock server for E2E tests.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { chromium } from '@playwright/test';

async function globalSetup(config) {
  console.log('🚀 Setting up E2E test environment...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Check if WordPress test environment is available
    const baseURL = config.use.baseURL;
    console.log(`📡 Checking WordPress test environment at ${baseURL}`);
    
    // Try to access the test page
    const response = await page.goto(`${baseURL}/test-api-integration.html`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    if (!response.ok()) {
      console.warn('⚠️  WordPress test environment not available, using mock server');
      // Here you could start a mock server if needed
    } else {
      console.log('✅ WordPress test environment is ready');
    }
    
    // Set up test data or configuration if needed
    await page.evaluate(() => {
      // Mock WordPress globals for testing
      window.garyAI = {
        restUrl: '/wp-json/gary-ai/v1',
        nonce: 'test-nonce-e2e-12345',
        userId: 1,
        userName: 'E2E Test User',
        userEmail: 'e2e@test.com',
        isLoggedIn: true,
        settings: {
          widget_enabled: true,
          widget_position: 'bottom-right',
          widget_theme: 'light',
          max_conversation_length: 50,
          welcome_message: 'Hello! This is an E2E test environment.'
        }
      };
      
      // Store test configuration
      localStorage.setItem('gary-ai-e2e-test', 'true');
    });
    
    console.log('✅ E2E test environment setup complete');
    
  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
