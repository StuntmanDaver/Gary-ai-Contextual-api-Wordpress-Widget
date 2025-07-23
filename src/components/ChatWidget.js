/**
 * ChatWidget Component - Main Widget Controller
 * 
 * Manages the entire chat widget lifecycle, state, and component coordination.
 * Implements accessibility, responsive design, and WordPress integration.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { ChatButton } from './ChatButton.js';
import { ChatHeader } from './ChatHeader.js';
import { MessageList } from './MessageList.js';
import { InputArea } from './InputArea.js';
import { TypingIndicator } from './TypingIndicator.js';

export class ChatWidget {
    constructor(options = {}) {
        this.apiClient = options.apiClient;
        this.logger = options.logger;
        this.container = options.container || document.body;
        
        // Widget state
        this.isOpen = false;
        this.isLoading = false;
        this.conversationId = null;
        this.messages = [];
        this.settings = null;
        
        // DOM elements
        this.elements = {
            button: null,
            widget: null,
            header: null,
            messageList: null,
            inputArea: null,
            typingIndicator: null
        };
        
        // Component instances
        this.components = {
            button: null,
            header: null,
            messageList: null,
            inputArea: null,
            typingIndicator: null
        };
        
        // Event handlers (bound to this context)
        this.handleToggle = this.handleToggle.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleSendMessage = this.handleSendMessage.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        // Initialize
        this.init();
    }

    /**
     * Initialize the chat widget
     */
    async init() {
        try {
            this.logger.info('Initializing ChatWidget');
            
            // Load settings
            await this.loadSettings();
            
            // Create DOM structure
            this.createElements();
            
            // Initialize components
            this.initializeComponents();
            
            // Bind events
            this.bindEvents();
            
            // Setup accessibility
            this.setupAccessibility();
            
            this.logger.info('ChatWidget initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize ChatWidget:', error);
            throw error;
        }
    }

    /**
     * Load widget settings from API
     */
    async loadSettings() {
        try {
            this.settings = await this.apiClient.getSettings();
            this.logger.debug('Settings loaded:', this.settings);
        } catch (error) {
            this.logger.warn('Failed to load settings, using defaults:', error);
            this.settings = {
                widget_enabled: true,
                widget_position: 'bottom-right',
                widget_theme: 'light',
                max_conversation_length: 50
            };
        }
    }

    /**
     * Create main DOM elements
     */
    createElements() {
        // Chat button
        this.elements.button = document.createElement('button');
        this.elements.button.className = 'gary-ai-chat-button';
        this.elements.button.setAttribute('aria-label', 'Open Gary AI Chat');
        this.elements.button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.471L3 21l2.471-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
        `;

        // Widget container
        this.elements.widget = document.createElement('div');
        this.elements.widget.className = 'gary-ai-widget-container gary-ai-widget';
        this.elements.widget.setAttribute('role', 'dialog');
        this.elements.widget.setAttribute('aria-labelledby', 'gary-ai-chat-title');
        this.elements.widget.setAttribute('aria-modal', 'true');
        this.elements.widget.setAttribute('data-gary-ai-theme', this.settings.widget_theme || 'light');

        // Widget structure
        this.elements.widget.innerHTML = `
            <div class="gary-ai-chat-header" id="gary-ai-chat-header">
                <div>
                    <h2 class="gary-ai-chat-title" id="gary-ai-chat-title">Gary AI Assistant</h2>
                    <p class="gary-ai-chat-subtitle">How can I help you today?</p>
                </div>
                <button class="gary-ai-close-button" aria-label="Close chat">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="gary-ai-messages-container" role="log" aria-live="polite" aria-label="Chat messages">
                <!-- Messages will be inserted here -->
            </div>
            <div class="gary-ai-typing-indicator gary-ai-hidden">
                <div class="gary-ai-typing-dots">
                    <div class="gary-ai-typing-dot"></div>
                    <div class="gary-ai-typing-dot"></div>
                    <div class="gary-ai-typing-dot"></div>
                </div>
                <span>Gary AI is typing...</span>
            </div>
            <div class="gary-ai-input-area">
                <div class="gary-ai-input-wrapper">
                    <textarea 
                        class="gary-ai-input" 
                        placeholder="Type your message here..." 
                        aria-label="Type your message"
                        rows="1"
                        maxlength="2000"
                    ></textarea>
                </div>
                <button class="gary-ai-send-button" aria-label="Send message" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        `;

        // Get references to key elements
        this.elements.header = this.elements.widget.querySelector('.gary-ai-chat-header');
        this.elements.messageList = this.elements.widget.querySelector('.gary-ai-messages-container');
        this.elements.inputArea = this.elements.widget.querySelector('.gary-ai-input-area');
        this.elements.typingIndicator = this.elements.widget.querySelector('.gary-ai-typing-indicator');
        this.elements.closeButton = this.elements.widget.querySelector('.gary-ai-close-button');
        this.elements.input = this.elements.widget.querySelector('.gary-ai-input');
        this.elements.sendButton = this.elements.widget.querySelector('.gary-ai-send-button');
    }

    /**
     * Initialize component instances
     */
    initializeComponents() {
        this.components.button = new ChatButton(this.elements.button, {
            onClick: this.handleToggle,
            logger: this.logger.child('ChatButton')
        });

        this.components.header = new ChatHeader(this.elements.header, {
            onClose: this.handleClose,
            logger: this.logger.child('ChatHeader')
        });

        this.components.messageList = new MessageList(this.elements.messageList, {
            logger: this.logger.child('MessageList')
        });

        this.components.inputArea = new InputArea(this.elements.inputArea, {
            onSendMessage: this.handleSendMessage,
            logger: this.logger.child('InputArea')
        });

        this.components.typingIndicator = new TypingIndicator(this.elements.typingIndicator, {
            logger: this.logger.child('TypingIndicator')
        });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Window events
        window.addEventListener('resize', this.handleResize);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Close button
        this.elements.closeButton.addEventListener('click', this.handleClose);
        
        // Input events
        this.elements.input.addEventListener('input', this.handleInputChange.bind(this));
        this.elements.input.addEventListener('keydown', this.handleInputKeyDown.bind(this));
        this.elements.sendButton.addEventListener('click', this.handleSendMessage);
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Focus management
        this.focusableElements = this.elements.widget.querySelectorAll(
            'button, input, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        // Trap focus within widget when open
        this.elements.widget.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && this.isOpen) {
                this.trapFocus(e);
            }
        });
    }

    /**
     * Mount the widget to the DOM
     */
    async mount() {
        try {
            this.logger.info('Mounting ChatWidget to DOM');
            
            // Add elements to container
            this.container.appendChild(this.elements.button);
            this.container.appendChild(this.elements.widget);
            
            // Initialize components
            await Promise.all([
                this.components.button.mount(),
                this.components.header.mount(),
                this.components.messageList.mount(),
                this.components.inputArea.mount(),
                this.components.typingIndicator.mount()
            ]);
            
            // Apply widget position
            this.applyPosition();
            
            // Show welcome message if first visit
            this.showWelcomeMessage();
            
            this.logger.info('ChatWidget mounted successfully');
        } catch (error) {
            this.logger.error('Failed to mount ChatWidget:', error);
            throw error;
        }
    }

    /**
     * Apply widget position based on settings
     */
    applyPosition() {
        const position = this.settings.widget_position || 'bottom-right';
        this.elements.widget.setAttribute('data-position', position);
        this.elements.button.setAttribute('data-position', position);
    }

    /**
     * Show welcome message on first visit
     */
    showWelcomeMessage() {
        if (!localStorage.getItem('gary-ai-welcomed')) {
            setTimeout(() => {
                this.components.messageList.addMessage({
                    id: 'welcome',
                    type: 'bot',
                    content: 'Hello! I\'m Gary AI, your helpful assistant. How can I help you today?',
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('gary-ai-welcomed', 'true');
            }, 1000);
        }
    }

    /**
     * Handle widget toggle (open/close)
     */
    handleToggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open the chat widget
     */
    open() {
        if (this.isOpen) return;
        
        this.logger.debug('Opening chat widget');
        
        this.isOpen = true;
        this.elements.widget.classList.add('gary-ai-widget-open');
        this.elements.button.setAttribute('aria-expanded', 'true');
        
        // Focus on input
        setTimeout(() => {
            this.elements.input.focus();
        }, 300);
        
        // Announce to screen readers
        this.announceToScreenReader('Chat opened');
        
        // Track analytics
        this.trackEvent('widget_opened');
    }

    /**
     * Close the chat widget
     */
    close() {
        if (!this.isOpen) return;
        
        this.logger.debug('Closing chat widget');
        
        this.isOpen = false;
        this.elements.widget.classList.remove('gary-ai-widget-open');
        this.elements.button.setAttribute('aria-expanded', 'false');
        
        // Focus back on button
        this.elements.button.focus();
        
        // Announce to screen readers
        this.announceToScreenReader('Chat closed');
        
        // Track analytics
        this.trackEvent('widget_closed');
    }

    /**
     * Handle close button click
     */
    handleClose() {
        this.close();
    }

    /**
     * Handle send message
     */
    async handleSendMessage() {
        const message = this.elements.input.value.trim();
        if (!message || this.isLoading) return;
        
        try {
            this.logger.debug('Sending message:', message);
            
            // Add user message to UI
            const userMessage = {
                id: `user-${Date.now()}`,
                type: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };
            
            this.components.messageList.addMessage(userMessage);
            this.messages.push(userMessage);
            
            // Clear input and disable send button
            this.elements.input.value = '';
            this.updateSendButton();
            
            // Show typing indicator
            this.components.typingIndicator.show();
            this.isLoading = true;
            
            // Send to API
            const response = await this.apiClient.sendMessage(message, this.conversationId);
            
            // Hide typing indicator
            this.components.typingIndicator.hide();
            this.isLoading = false;
            
            // Add AI response to UI
            const aiMessage = {
                id: `ai-${Date.now()}`,
                type: 'bot',
                content: response.response,
                timestamp: new Date().toISOString(),
                tokenCount: response.token_count
            };
            
            this.components.messageList.addMessage(aiMessage);
            this.messages.push(aiMessage);
            
            // Update conversation ID
            this.conversationId = response.conversation_id;
            
            // Track analytics
            this.trackEvent('message_sent', { 
                messageLength: message.length,
                responseLength: response.response.length,
                tokenCount: response.token_count
            });
            
        } catch (error) {
            this.logger.error('Failed to send message:', error);
            
            // Hide typing indicator
            this.components.typingIndicator.hide();
            this.isLoading = false;
            
            // Show error message
            this.showErrorMessage('Sorry, I encountered an error. Please try again.');
        }
    }

    /**
     * Handle input change
     */
    handleInputChange() {
        this.updateSendButton();
        this.autoResizeInput();
    }

    /**
     * Handle input keydown
     */
    handleInputKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendMessage();
        }
    }

    /**
     * Update send button state
     */
    updateSendButton() {
        const hasText = this.elements.input.value.trim().length > 0;
        this.elements.sendButton.disabled = !hasText || this.isLoading;
    }

    /**
     * Auto-resize input textarea
     */
    autoResizeInput() {
        const input = this.elements.input;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        const errorMessage = {
            id: `error-${Date.now()}`,
            type: 'error',
            content: message,
            timestamp: new Date().toISOString()
        };
        
        this.components.messageList.addMessage(errorMessage);
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.isOpen) {
            this.close();
        }
    }

    /**
     * Trap focus within widget
     */
    trapFocus(e) {
        const focusableElements = Array.from(this.focusableElements);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update mobile/desktop layout if needed
        this.updateResponsiveLayout();
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden && this.isOpen) {
            // Pause any ongoing operations when tab becomes hidden
            this.logger.debug('Tab hidden, pausing operations');
        }
    }

    /**
     * Update responsive layout
     */
    updateResponsiveLayout() {
        const isMobile = window.innerWidth <= 768;
        this.elements.widget.classList.toggle('gary-ai-mobile', isMobile);
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.className = 'gary-ai-sr-only';
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Track analytics event
     */
    trackEvent(eventName, data = {}) {
        try {
            // Send to WordPress analytics if available
            if (typeof window !== 'undefined' && window.garyAI?.analytics) {
                window.garyAI.analytics.track(eventName, data);
            }
            
            this.logger.debug('Event tracked:', eventName, data);
        } catch (error) {
            this.logger.warn('Failed to track event:', error);
        }
    }

    /**
     * Destroy the widget
     */
    destroy() {
        try {
            this.logger.info('Destroying ChatWidget');
            
            // Remove event listeners
            window.removeEventListener('resize', this.handleResize);
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            document.removeEventListener('keydown', this.handleKeyDown);
            
            // Destroy components
            Object.values(this.components).forEach(component => {
                if (component && typeof component.destroy === 'function') {
                    component.destroy();
                }
            });
            
            // Remove DOM elements
            if (this.elements.button && this.elements.button.parentNode) {
                this.elements.button.parentNode.removeChild(this.elements.button);
            }
            
            if (this.elements.widget && this.elements.widget.parentNode) {
                this.elements.widget.parentNode.removeChild(this.elements.widget);
            }
            
            // Clear references
            this.elements = {};
            this.components = {};
            this.messages = [];
            
            this.logger.info('ChatWidget destroyed');
        } catch (error) {
            this.logger.error('Error destroying ChatWidget:', error);
        }
    }
}
