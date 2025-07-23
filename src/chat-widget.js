/**
 * Gary AI Chat Widget - Main Entry Point
 * 
 * A WordPress-compatible chat widget that integrates with the Gary AI backend.
 * Built with Vanilla JS (ES2022) and optimized for performance.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import './styles/chat-widget.css';
import { ChatWidget } from './components/ChatWidget.js';
import { ApiClient } from './utils/ApiClient.js';
import { Logger } from './utils/Logger.js';

/**
 * Initialize the Gary AI Chat Widget
 */
class GaryAIChatWidget {
    constructor() {
        this.widget = null;
        this.apiClient = null;
        this.logger = new Logger('GaryAI');
        this.isInitialized = false;
        
        // WordPress integration globals
        this.wpRestUrl = window.garyAI?.restUrl || '/wp-json/gary-ai/v1';
        this.wpNonce = window.garyAI?.nonce || '';
        
        this.init();
    }

    /**
     * Initialize the chat widget
     */
    async init() {
        try {
            this.logger.info('Initializing Gary AI Chat Widget');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
            
        } catch (error) {
            this.logger.error('Failed to initialize chat widget:', error);
        }
    }

    /**
     * Setup the chat widget components
     */
    async setup() {
        try {
            // Validate WordPress environment
            if (!this.validateWordPressEnvironment()) {
                this.logger.warn('WordPress environment not detected, using fallback mode');
            }

            // Initialize API client with proper WordPress integration
            this.apiClient = new ApiClient({
                baseUrl: this.wpRestUrl,
                nonce: this.wpNonce,
                logger: this.logger.child('ApiClient')
            });

            // Initialize chat widget
            this.widget = new ChatWidget({
                apiClient: this.apiClient,
                logger: this.logger.child('ChatWidget'),
                container: document.body
            });

            // Mount the widget
            await this.widget.mount();
            
            this.isInitialized = true;
            this.logger.info('Gary AI Chat Widget initialized successfully');
            
            // Emit ready event for WordPress integration
            this.emitReadyEvent();
            
        } catch (error) {
            this.logger.error('Failed to setup chat widget:', error);
            this.showFallbackError();
        }
    }

    /**
     * Validate WordPress environment
     */
    validateWordPressEnvironment() {
        return !!(window.garyAI && window.garyAI.restUrl && window.garyAI.nonce);
    }

    /**
     * Emit ready event for WordPress integration
     */
    emitReadyEvent() {
        const event = new CustomEvent('gary-ai-widget-ready', {
            detail: {
                widget: this.widget,
                apiClient: this.apiClient
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Show fallback error message
     */
    showFallbackError() {
        const errorContainer = document.createElement('div');
        errorContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #fee2e2;
            color: #dc2626;
            padding: 12px 16px;
            border-radius: 8px;
            border-left: 4px solid #dc2626;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 300px;
            z-index: 999999;
        `;
        errorContainer.innerHTML = `
            <strong>Gary AI Chat Widget Error</strong><br>
            Failed to initialize. Please check console for details.
        `;
        
        document.body.appendChild(errorContainer);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 10000);
    }

    /**
     * Destroy the widget
     */
    destroy() {
        if (this.widget) {
            this.widget.destroy();
            this.widget = null;
        }
        this.isInitialized = false;
        this.logger.info('Gary AI Chat Widget destroyed');
    }

    /**
     * Get widget instance
     */
    getInstance() {
        return this.widget;
    }
}

// Auto-initialize when script loads (WordPress compatibility)
let widgetInstance = null;

// Expose global interface for WordPress
window.GaryAI = window.GaryAI || {};
window.GaryAI.ChatWidget = {
    init() {
        if (!widgetInstance) {
            widgetInstance = new GaryAIChatWidget();
        }
        return widgetInstance;
    },
    
    destroy() {
        if (widgetInstance) {
            widgetInstance.destroy();
            widgetInstance = null;
        }
    },
    
    getInstance() {
        return widgetInstance?.getInstance() || null;
    }
};

// Auto-initialize for WordPress
document.addEventListener('DOMContentLoaded', () => {
    // Only auto-initialize if WordPress globals are present
    if (window.garyAI?.autoInit !== false) {
        window.GaryAI.ChatWidget.init();
    }
});

// Export for module systems
export { GaryAIChatWidget as default };
