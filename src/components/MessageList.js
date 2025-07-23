/**
 * MessageList Component for Gary AI Chat Widget
 * 
 * Handles message display, rendering, and interactions.
 * Supports markdown rendering, code block copy, and accessibility.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { MarkdownRenderer } from '../utils/MarkdownRenderer.js';

export class MessageList {
    constructor(element, options = {}) {
        this.element = element;
        this.logger = options.logger || console;
        
        // Message state
        this.messages = [];
        this.isAutoScrollEnabled = true;
        this.lastScrollTop = 0;
        
        // DOM elements
        this.scrollContainer = null;
        this.messagesContainer = null;
        
        // Intersection observer for auto-scroll detection
        this.scrollObserver = null;
        
        // Initialize markdown renderer
        this.markdownRenderer = new MarkdownRenderer({
            enableCodeCopy: options.enableCodeCopy !== false,
            enableSyntaxHighlighting: options.enableSyntaxHighlighting !== false,
            logger: this.logger
        });
        
        this.init();
    }

    /**
     * Initialize the message list
     */
    init() {
        this.logger.debug('Initializing MessageList');
        
        // Create scroll container structure
        this.createScrollContainer();
        
        // Setup scroll behavior
        this.setupScrollBehavior();
        
        // Setup intersection observer
        this.setupScrollObserver();
        
        // Bind events
        this.bindEvents();
        
        this.logger.debug('MessageList initialized');
    }

    /**
     * Create scroll container structure
     */
    createScrollContainer() {
        // Wrap existing content in scroll container
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.className = 'gary-ai-scroll-container';
        
        this.messagesContainer = document.createElement('div');
        this.messagesContainer.className = 'gary-ai-messages-list';
        
        this.scrollContainer.appendChild(this.messagesContainer);
        this.element.appendChild(this.scrollContainer);
        
        // Create scroll indicator
        this.createScrollIndicator();
    }

    /**
     * Create scroll indicator for new messages
     */
    createScrollIndicator() {
        this.scrollIndicator = document.createElement('button');
        this.scrollIndicator.className = 'gary-ai-scroll-indicator gary-ai-hidden';
        this.scrollIndicator.setAttribute('aria-label', 'Scroll to bottom');
        this.scrollIndicator.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>New messages</span>
        `;
        
        this.element.appendChild(this.scrollIndicator);
        
        this.scrollIndicator.addEventListener('click', () => {
            this.scrollToBottom(true);
        });
    }

    /**
     * Setup scroll behavior and detection
     */
    setupScrollBehavior() {
        let scrollTimeout = null;
        
        this.scrollContainer.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
            
            // Update auto-scroll state
            this.isAutoScrollEnabled = isNearBottom;
            
            // Show/hide scroll indicator
            if (isNearBottom) {
                this.hideScrollIndicator();
            }
            
            // Clear existing timeout
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            
            // Debounced scroll end detection
            scrollTimeout = setTimeout(() => {
                this.onScrollEnd();
            }, 150);
            
            this.lastScrollTop = scrollTop;
        });
    }

    /**
     * Setup intersection observer for message visibility
     */
    setupScrollObserver() {
        if (!window.IntersectionObserver) return;
        
        this.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Mark message as read
                    const messageElement = entry.target;
                    messageElement.classList.add('gary-ai-message-read');
                }
            });
        }, {
            root: this.scrollContainer,
            threshold: 0.5
        });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Handle code block copy buttons
        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('gary-ai-copy-button')) {
                this.handleCopyCode(e);
            }
        });
        
        // Handle message actions
        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('gary-ai-message-action')) {
                this.handleMessageAction(e);
            }
        });
    }

    /**
     * Add a new message to the list
     */
    addMessage(message) {
        this.logger.debug('Adding message:', message);
        
        // Validate message
        if (!message || !message.content) {
            this.logger.warn('Invalid message provided');
            return;
        }
        
        // Add to messages array
        this.messages.push(message);
        
        // Create message element
        const messageElement = this.createMessageElement(message);
        
        // Add to DOM
        this.messagesContainer.appendChild(messageElement);
        
        // Setup intersection observer
        if (this.scrollObserver) {
            this.scrollObserver.observe(messageElement);
        }
        
        // Auto-scroll if enabled
        if (this.isAutoScrollEnabled) {
            this.scrollToBottom();
        } else if (message.type === 'bot') {
            // Show scroll indicator for new bot messages
            this.showScrollIndicator();
        }
        
        // Announce new messages to screen readers
        if (message.type === 'bot') {
            this.announceToScreenReader(`New message from Gary AI: ${this.getPlainText(message.content)}`);
        }
        
        // Cleanup old messages if needed
        this.cleanupOldMessages();
    }

    /**
     * Create DOM element for a message
     */
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `gary-ai-message gary-ai-message-${message.type}`;
        messageDiv.setAttribute('data-message-id', message.id);
        messageDiv.setAttribute('role', 'article');
        messageDiv.setAttribute('aria-label', `Message from ${message.type === 'user' ? 'you' : 'Gary AI'}`);
        
        // Create message header
        const header = this.createMessageHeader(message);
        messageDiv.appendChild(header);
        
        // Create message content
        const content = this.createMessageContent(message);
        messageDiv.appendChild(content);
        
        // Create message footer
        const footer = this.createMessageFooter(message);
        if (footer) {
            messageDiv.appendChild(footer);
        }
        
        return messageDiv;
    }

    /**
     * Create message header with avatar and timestamp
     */
    createMessageHeader(message) {
        const header = document.createElement('div');
        header.className = 'gary-ai-message-header';
        
        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'gary-ai-message-avatar';
        
        if (message.type === 'user') {
            avatar.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            `;
        } else if (message.type === 'bot') {
            avatar.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            `;
        } else if (message.type === 'error') {
            avatar.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            `;
        }
        
        // Message info
        const info = document.createElement('div');
        info.className = 'gary-ai-message-info';
        
        const sender = document.createElement('span');
        sender.className = 'gary-ai-message-sender';
        sender.textContent = message.type === 'user' ? 'You' : message.type === 'bot' ? 'Gary AI' : 'System';
        
        const timestamp = document.createElement('span');
        timestamp.className = 'gary-ai-message-timestamp';
        timestamp.textContent = this.formatTimestamp(message.timestamp);
        timestamp.setAttribute('title', new Date(message.timestamp).toLocaleString());
        
        info.appendChild(sender);
        info.appendChild(timestamp);
        
        header.appendChild(avatar);
        header.appendChild(info);
        
        return header;
    }

    /**
     * Create message content with markdown rendering
     */
    createMessageContent(message) {
        const content = document.createElement('div');
        content.className = 'gary-ai-message-content';
        
        if (message.type === 'error') {
            content.classList.add('gary-ai-message-error');
        }
        
        // Render markdown content
        const renderedContent = this.renderMarkdown(message.content);
        content.innerHTML = renderedContent;
        
        // Add copy buttons to code blocks
        this.addCopyButtonsToCodeBlocks(content);
        
        return content;
    }

    /**
     * Create message footer with actions and metadata
     */
    createMessageFooter(message) {
        if (message.type === 'user') return null;
        
        const footer = document.createElement('div');
        footer.className = 'gary-ai-message-footer';
        
        // Token count for AI messages
        if (message.tokenCount) {
            const tokenInfo = document.createElement('span');
            tokenInfo.className = 'gary-ai-token-count';
            tokenInfo.textContent = `${message.tokenCount} tokens`;
            tokenInfo.setAttribute('title', 'Tokens used for this response');
            footer.appendChild(tokenInfo);
        }
        
        // Message actions
        const actions = document.createElement('div');
        actions.className = 'gary-ai-message-actions';
        
        // Copy message button
        const copyButton = document.createElement('button');
        copyButton.className = 'gary-ai-message-action gary-ai-copy-message';
        copyButton.setAttribute('aria-label', 'Copy message');
        copyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        `;
        
        // Regenerate button for AI messages
        if (message.type === 'bot') {
            const regenerateButton = document.createElement('button');
            regenerateButton.className = 'gary-ai-message-action gary-ai-regenerate';
            regenerateButton.setAttribute('aria-label', 'Regenerate response');
            regenerateButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            `;
            actions.appendChild(regenerateButton);
        }
        
        actions.appendChild(copyButton);
        footer.appendChild(actions);
        
        return footer;
    }

    /**
     * Render markdown content to HTML
     */
    renderMarkdown(content) {
        // Simple markdown renderer - can be replaced with a full library if needed
        let html = content;
        
        // Code blocks (```language\ncode\n```)
        html = html.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, language, code) => {
            const lang = language || 'text';
            return `<pre class="gary-ai-code-block" data-language="${lang}"><code>${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Inline code (`code`)
        html = html.replace(/`([^`]+)`/g, '<code class="gary-ai-inline-code">$1</code>');
        
        // Bold (**text** or __text__)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        // Italic (*text* or _text_)
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Links [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }

    /**
     * Add copy buttons to code blocks
     */
    addCopyButtonsToCodeBlocks(container) {
        const codeBlocks = container.querySelectorAll('.gary-ai-code-block');
        
        codeBlocks.forEach(block => {
            const copyButton = document.createElement('button');
            copyButton.className = 'gary-ai-copy-button';
            copyButton.setAttribute('aria-label', 'Copy code');
            copyButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            `;
            
            // Position button
            block.style.position = 'relative';
            copyButton.style.position = 'absolute';
            copyButton.style.top = '8px';
            copyButton.style.right = '8px';
            
            block.appendChild(copyButton);
        });
    }

    /**
     * Handle code copy button clicks
     */
    async handleCopyCode(e) {
        const button = e.target.closest('.gary-ai-copy-button');
        const codeBlock = button.closest('.gary-ai-code-block');
        const code = codeBlock.querySelector('code').textContent;
        
        try {
            await navigator.clipboard.writeText(code);
            
            // Show success feedback
            const originalIcon = button.innerHTML;
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            `;
            
            setTimeout(() => {
                button.innerHTML = originalIcon;
            }, 2000);
            
            this.announceToScreenReader('Code copied to clipboard');
            
        } catch (error) {
            this.logger.error('Failed to copy code:', error);
            this.announceToScreenReader('Failed to copy code');
        }
    }

    /**
     * Handle message action clicks
     */
    async handleMessageAction(e) {
        const button = e.target.closest('.gary-ai-message-action');
        const messageElement = button.closest('.gary-ai-message');
        const messageId = messageElement.getAttribute('data-message-id');
        const message = this.messages.find(m => m.id === messageId);
        
        if (button.classList.contains('gary-ai-copy-message')) {
            await this.copyMessage(message);
        } else if (button.classList.contains('gary-ai-regenerate')) {
            this.regenerateMessage(message);
        }
    }

    /**
     * Copy message content to clipboard
     */
    async copyMessage(message) {
        try {
            const plainText = this.getPlainText(message.content);
            await navigator.clipboard.writeText(plainText);
            this.announceToScreenReader('Message copied to clipboard');
        } catch (error) {
            this.logger.error('Failed to copy message:', error);
            this.announceToScreenReader('Failed to copy message');
        }
    }

    /**
     * Regenerate AI message
     */
    regenerateMessage(message) {
        // Emit event for parent component to handle
        const event = new CustomEvent('gary-ai-regenerate', {
            detail: { messageId: message.id }
        });
        this.element.dispatchEvent(event);
    }

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom(smooth = false) {
        const scrollOptions = {
            top: this.scrollContainer.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        };
        
        this.scrollContainer.scrollTo(scrollOptions);
        this.isAutoScrollEnabled = true;
        this.hideScrollIndicator();
    }

    /**
     * Show scroll indicator
     */
    showScrollIndicator() {
        this.scrollIndicator.classList.remove('gary-ai-hidden');
    }

    /**
     * Hide scroll indicator
     */
    hideScrollIndicator() {
        this.scrollIndicator.classList.add('gary-ai-hidden');
    }

    /**
     * Handle scroll end event
     */
    onScrollEnd() {
        // Mark visible messages as read
        const visibleMessages = this.getVisibleMessages();
        visibleMessages.forEach(messageElement => {
            messageElement.classList.add('gary-ai-message-read');
        });
    }

    /**
     * Get currently visible message elements
     */
    getVisibleMessages() {
        const messages = this.messagesContainer.querySelectorAll('.gary-ai-message');
        const containerRect = this.scrollContainer.getBoundingClientRect();
        const visibleMessages = [];
        
        messages.forEach(message => {
            const messageRect = message.getBoundingClientRect();
            const isVisible = messageRect.top < containerRect.bottom && messageRect.bottom > containerRect.top;
            
            if (isVisible) {
                visibleMessages.push(message);
            }
        });
        
        return visibleMessages;
    }

    /**
     * Clean up old messages to prevent memory issues
     */
    cleanupOldMessages() {
        const maxMessages = 100;
        
        if (this.messages.length > maxMessages) {
            const messagesToRemove = this.messages.length - maxMessages;
            
            // Remove from array
            this.messages.splice(0, messagesToRemove);
            
            // Remove from DOM
            const messageElements = this.messagesContainer.querySelectorAll('.gary-ai-message');
            for (let i = 0; i < messagesToRemove; i++) {
                if (messageElements[i]) {
                    if (this.scrollObserver) {
                        this.scrollObserver.unobserve(messageElements[i]);
                    }
                    messageElements[i].remove();
                }
            }
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        this.messages = [];
        this.messagesContainer.innerHTML = '';
        this.hideScrollIndicator();
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Extract plain text from HTML content
     */
    getPlainText(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    /**
     * Escape HTML characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
     * Mount the component
     */
    async mount() {
        this.logger.debug('Mounting MessageList');
        
        // Add CSS for message styling
        const style = document.createElement('style');
        style.textContent = `
            .gary-ai-scroll-container {
                flex: 1;
                overflow-y: auto;
                padding: 0 16px;
                scroll-behavior: smooth;
            }
            
            .gary-ai-messages-list {
                display: flex;
                flex-direction: column;
                gap: 16px;
                padding: 16px 0;
            }
            
            .gary-ai-message {
                display: flex;
                flex-direction: column;
                gap: 8px;
                opacity: 0;
                animation: gary-ai-message-appear 0.3s ease forwards;
            }
            
            @keyframes gary-ai-message-appear {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .gary-ai-message-header {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .gary-ai-message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .gary-ai-message-user .gary-ai-message-avatar {
                background: var(--gary-ai-primary);
                color: white;
            }
            
            .gary-ai-message-bot .gary-ai-message-avatar {
                background: var(--gary-ai-bg-secondary);
                color: var(--gary-ai-text-primary);
            }
            
            .gary-ai-message-error .gary-ai-message-avatar {
                background: #fee2e2;
                color: #dc2626;
            }
            
            .gary-ai-message-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .gary-ai-message-sender {
                font-weight: 600;
                font-size: 14px;
                color: var(--gary-ai-text-primary);
            }
            
            .gary-ai-message-timestamp {
                font-size: 12px;
                color: var(--gary-ai-text-secondary);
            }
            
            .gary-ai-message-content {
                margin-left: 40px;
                line-height: 1.6;
                color: var(--gary-ai-text-primary);
            }
            
            .gary-ai-message-error {
                color: #dc2626;
                background: #fee2e2;
                padding: 12px;
                border-radius: 8px;
                border-left: 4px solid #dc2626;
            }
            
            .gary-ai-code-block {
                background: var(--gary-ai-bg-secondary);
                border: 1px solid var(--gary-ai-border);
                border-radius: 8px;
                padding: 16px;
                margin: 8px 0;
                overflow-x: auto;
                position: relative;
            }
            
            .gary-ai-inline-code {
                background: var(--gary-ai-bg-secondary);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: var(--gary-ai-font-mono);
                font-size: 0.9em;
            }
            
            .gary-ai-copy-button {
                background: var(--gary-ai-bg-primary);
                border: 1px solid var(--gary-ai-border);
                border-radius: 4px;
                padding: 4px;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            }
            
            .gary-ai-copy-button:hover {
                opacity: 1;
            }
            
            .gary-ai-message-footer {
                margin-left: 40px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: var(--gary-ai-text-secondary);
            }
            
            .gary-ai-message-actions {
                display: flex;
                gap: 4px;
            }
            
            .gary-ai-message-action {
                background: none;
                border: none;
                padding: 4px;
                border-radius: 4px;
                cursor: pointer;
                opacity: 0.6;
                transition: opacity 0.2s ease;
            }
            
            .gary-ai-message-action:hover {
                opacity: 1;
                background: var(--gary-ai-bg-secondary);
            }
            
            .gary-ai-scroll-indicator {
                position: absolute;
                bottom: 80px;
                right: 16px;
                background: var(--gary-ai-primary);
                color: white;
                border: none;
                border-radius: 20px;
                padding: 8px 12px;
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transition: transform 0.2s ease;
            }
            
            .gary-ai-scroll-indicator:hover {
                transform: translateY(-2px);
            }
            
            .gary-ai-scroll-indicator svg {
                width: 16px;
                height: 16px;
            }
        `;
        
        if (!document.querySelector('#gary-ai-messages-styles')) {
            style.id = 'gary-ai-messages-styles';
            document.head.appendChild(style);
        }
        
        this.logger.debug('MessageList mounted');
    }

    /**
     * Render markdown content using MarkdownRenderer
     */
    renderMarkdown(content) {
        if (!content || typeof content !== 'string') {
            return '';
        }

        try {
            return this.markdownRenderer.processMessage(content, {
                sanitize: true
            });
        } catch (error) {
            this.logger.error('Markdown rendering failed:', error);
            // Fallback to escaped HTML
            const div = document.createElement('div');
            div.textContent = content;
            return div.innerHTML;
        }
    }

    /**
     * Add copy functionality to code blocks
     */
    addCopyButtonsToCodeBlocks(container) {
        try {
            // Setup copy handlers using the markdown renderer
            this.markdownRenderer.setupCopyHandlers(container);
            
            // Add event listeners for message-level copy functionality
            const copyButtons = container.querySelectorAll('.gary-ai-copy-message');
            copyButtons.forEach(button => {
                button.addEventListener('click', this.handleMessageCopy.bind(this));
            });
            
            // Add event listeners for regenerate functionality
            const regenerateButtons = container.querySelectorAll('.gary-ai-regenerate');
            regenerateButtons.forEach(button => {
                button.addEventListener('click', this.handleMessageRegenerate.bind(this));
            });
            
        } catch (error) {
            this.logger.error('Failed to setup code block copy functionality:', error);
        }
    }

    /**
     * Handle message copy functionality
     */
    async handleMessageCopy(event) {
        const button = event.currentTarget;
        const messageElement = button.closest('.gary-ai-message');
        const messageId = messageElement?.getAttribute('data-message-id');
        
        if (!messageId) {
            this.logger.error('Message ID not found for copy operation');
            return;
        }

        const message = this.messages.find(m => m.id === messageId);
        if (!message) {
            this.logger.error('Message not found for copy operation:', messageId);
            return;
        }

        try {
            // Get plain text content
            const plainText = this.getPlainText(message.content);
            
            // Copy to clipboard
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(plainText);
            } else {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(plainText);
            }

            // Update button state
            const originalContent = button.innerHTML;
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            `;
            button.setAttribute('aria-label', 'Message copied');
            
            setTimeout(() => {
                button.innerHTML = originalContent;
                button.setAttribute('aria-label', 'Copy message');
            }, 2000);

            this.logger.debug('Message copied to clipboard successfully');
            
        } catch (error) {
            this.logger.error('Failed to copy message to clipboard:', error);
        }
    }

    /**
     * Handle message regenerate functionality
     */
    handleMessageRegenerate(event) {
        const button = event.currentTarget;
        const messageElement = button.closest('.gary-ai-message');
        const messageId = messageElement?.getAttribute('data-message-id');
        
        if (!messageId) {
            this.logger.error('Message ID not found for regenerate operation');
            return;
        }

        // Emit regenerate event for parent component to handle
        const regenerateEvent = new CustomEvent('gary-ai-regenerate-message', {
            detail: { messageId },
            bubbles: true
        });
        
        this.element.dispatchEvent(regenerateEvent);
        this.logger.debug('Regenerate request sent for message:', messageId);
    }

    /**
     * Extract plain text from message content
     */
    getPlainText(content) {
        if (!content || typeof content !== 'string') {
            return '';
        }

        try {
            // Create a temporary div to parse HTML/markdown
            const tempDiv = document.createElement('div');
            
            // First render markdown to HTML
            const renderedHtml = this.markdownRenderer.render(content);
            tempDiv.innerHTML = renderedHtml;
            
            // Extract plain text
            return tempDiv.textContent || tempDiv.innerText || content;
        } catch (error) {
            this.logger.error('Failed to extract plain text:', error);
            // Fallback to original content
            return content;
        }
    }

    /**
     * Fallback copy method for older browsers
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.logger.debug('Destroying MessageList');
        
        // Disconnect intersection observer
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
        }
        
        // Clear messages
        this.clearMessages();
        
        this.logger.debug('MessageList destroyed');
    }
}
