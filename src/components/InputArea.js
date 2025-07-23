/**
 * InputArea Component - Message Input Interface
 * 
 * Manages the message input area with auto-resize, send button,
 * keyboard shortcuts, and accessibility features.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

export class InputArea {
    constructor(element, options = {}) {
        this.element = element;
        this.onSendMessage = options.onSendMessage || (() => {});
        this.logger = options.logger || console;
        
        // Input state
        this.isDisabled = false;
        this.maxLength = 2000;
        this.minHeight = 40;
        this.maxHeight = 120;
        
        // DOM elements
        this.inputWrapper = null;
        this.textarea = null;
        this.sendButton = null;
        this.charCounter = null;
        this.attachButton = null;
        
        // Typing detection
        this.typingTimer = null;
        this.isTyping = false;
        
        this.init();
    }

    /**
     * Initialize the input area
     */
    init() {
        this.logger.debug('Initializing InputArea');
        
        // Get DOM elements
        this.inputWrapper = this.element.querySelector('.gary-ai-input-wrapper');
        this.textarea = this.element.querySelector('.gary-ai-input');
        this.sendButton = this.element.querySelector('.gary-ai-send-button');
        
        // Create additional elements
        this.createCharCounter();
        this.createAttachButton();
        
        // Setup textarea
        this.setupTextarea();
        
        // Bind events
        this.bindEvents();
        
        // Initialize state
        this.updateSendButton();
        
        this.logger.debug('InputArea initialized');
    }

    /**
     * Create character counter
     */
    createCharCounter() {
        this.charCounter = document.createElement('div');
        this.charCounter.className = 'gary-ai-char-counter';
        this.charCounter.setAttribute('aria-live', 'polite');
        this.charCounter.textContent = `0/${this.maxLength}`;
        
        this.element.appendChild(this.charCounter);
    }

    /**
     * Create attachment button
     */
    createAttachButton() {
        this.attachButton = document.createElement('button');
        this.attachButton.className = 'gary-ai-attach-button';
        this.attachButton.setAttribute('aria-label', 'Attach file');
        this.attachButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
        `;
        
        // Insert before send button
        this.sendButton.parentNode.insertBefore(this.attachButton, this.sendButton);
    }

    /**
     * Setup textarea properties and behavior
     */
    setupTextarea() {
        // Set initial height
        this.textarea.style.height = `${this.minHeight}px`;
        this.textarea.style.minHeight = `${this.minHeight}px`;
        this.textarea.style.maxHeight = `${this.maxHeight}px`;
        
        // Set max length
        this.textarea.setAttribute('maxlength', this.maxLength);
        
        // Add accessibility attributes
        this.textarea.setAttribute('aria-describedby', 'gary-ai-input-help');
        
        // Create help text
        const helpText = document.createElement('div');
        helpText.id = 'gary-ai-input-help';
        helpText.className = 'gary-ai-sr-only';
        helpText.textContent = 'Type your message and press Enter to send, or Shift+Enter for new line';
        
        this.element.appendChild(helpText);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Textarea events
        this.textarea.addEventListener('input', this.handleInput.bind(this));
        this.textarea.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.textarea.addEventListener('keyup', this.handleKeyUp.bind(this));
        this.textarea.addEventListener('paste', this.handlePaste.bind(this));
        this.textarea.addEventListener('focus', this.handleFocus.bind(this));
        this.textarea.addEventListener('blur', this.handleBlur.bind(this));
        
        // Send button events
        this.sendButton.addEventListener('click', this.handleSendClick.bind(this));
        this.sendButton.addEventListener('keydown', this.handleSendKeyDown.bind(this));
        
        // Attach button events
        this.attachButton.addEventListener('click', this.handleAttachClick.bind(this));
        
        // Form submission prevention
        const form = this.textarea.closest('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSend();
            });
        }
    }

    /**
     * Handle textarea input
     */
    handleInput(e) {
        const value = e.target.value;
        
        // Auto-resize textarea
        this.autoResize();
        
        // Update character counter
        this.updateCharCounter(value.length);
        
        // Update send button state
        this.updateSendButton();
        
        // Handle typing indicator
        this.handleTypingStart();
        
        // Validate input length
        if (value.length > this.maxLength) {
            this.showInputError('Message is too long');
        } else {
            this.clearInputError();
        }
    }

    /**
     * Handle keydown events
     */
    handleKeyDown(e) {
        // Send message on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSend();
            return;
        }
        
        // Handle other keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'a':
                    // Allow Ctrl+A (select all)
                    break;
                case 'z':
                    // Allow Ctrl+Z (undo)
                    break;
                case 'y':
                    // Allow Ctrl+Y (redo)
                    break;
                default:
                    // Block other Ctrl combinations
                    if (e.key.length === 1) {
                        e.preventDefault();
                    }
            }
        }
        
        // Handle escape key
        if (e.key === 'Escape') {
            this.textarea.blur();
        }
    }

    /**
     * Handle keyup events for typing detection
     */
    handleKeyUp(e) {
        this.handleTypingEnd();
    }

    /**
     * Handle paste events
     */
    handlePaste(e) {
        // Allow paste but validate length after
        setTimeout(() => {
            const value = this.textarea.value;
            if (value.length > this.maxLength) {
                this.textarea.value = value.substring(0, this.maxLength);
                this.showInputError('Pasted content was truncated');
                this.updateCharCounter(this.maxLength);
            }
            this.autoResize();
            this.updateSendButton();
        }, 0);
    }

    /**
     * Handle textarea focus
     */
    handleFocus() {
        this.element.classList.add('gary-ai-input-focused');
        
        // Announce to screen readers
        this.announceToScreenReader('Message input focused');
    }

    /**
     * Handle textarea blur
     */
    handleBlur() {
        this.element.classList.remove('gary-ai-input-focused');
        this.handleTypingEnd();
    }

    /**
     * Handle send button click
     */
    handleSendClick(e) {
        e.preventDefault();
        this.handleSend();
    }

    /**
     * Handle send button keydown
     */
    handleSendKeyDown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleSend();
        }
    }

    /**
     * Handle attach button click
     */
    handleAttachClick(e) {
        e.preventDefault();
        
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.pdf,.doc,.docx,.md';
        fileInput.multiple = false;
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileAttachment(file);
            }
        });
        
        fileInput.click();
    }

    /**
     * Handle file attachment
     */
    async handleFileAttachment(file) {
        this.logger.debug('File attached:', file.name);
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showInputError('File is too large (max 5MB)');
            return;
        }
        
        // Show file attachment in input
        this.showFileAttachment(file);
        
        // Enable send button
        this.updateSendButton();
    }

    /**
     * Show file attachment in input area
     */
    showFileAttachment(file) {
        // Remove existing attachment
        const existingAttachment = this.element.querySelector('.gary-ai-file-attachment');
        if (existingAttachment) {
            existingAttachment.remove();
        }
        
        // Create attachment display
        const attachment = document.createElement('div');
        attachment.className = 'gary-ai-file-attachment';
        attachment.innerHTML = `
            <div class="gary-ai-file-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="gary-ai-file-name">${file.name}</span>
                <span class="gary-ai-file-size">${this.formatFileSize(file.size)}</span>
            </div>
            <button class="gary-ai-remove-attachment" aria-label="Remove attachment">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;
        
        // Add remove handler
        attachment.querySelector('.gary-ai-remove-attachment').addEventListener('click', () => {
            attachment.remove();
            this.attachedFile = null;
            this.updateSendButton();
        });
        
        // Insert before input wrapper
        this.element.insertBefore(attachment, this.inputWrapper);
        
        // Store file reference
        this.attachedFile = file;
    }

    /**
     * Handle sending message
     */
    async handleSend() {
        if (this.isDisabled) return;
        
        const message = this.textarea.value.trim();
        const hasAttachment = !!this.attachedFile;
        
        // Validate input
        if (!message && !hasAttachment) {
            this.showInputError('Please enter a message or attach a file');
            this.textarea.focus();
            return;
        }
        
        if (message.length > this.maxLength) {
            this.showInputError('Message is too long');
            return;
        }
        
        try {
            this.logger.debug('Sending message:', { message, hasAttachment });
            
            // Disable input during send
            this.setDisabled(true);
            
            // Prepare message data
            const messageData = {
                text: message,
                attachment: this.attachedFile
            };
            
            // Call send handler
            await this.onSendMessage(messageData);
            
            // Clear input on successful send
            this.clearInput();
            
            // Announce to screen readers
            this.announceToScreenReader('Message sent');
            
        } catch (error) {
            this.logger.error('Failed to send message:', error);
            this.showInputError('Failed to send message. Please try again.');
        } finally {
            // Re-enable input
            this.setDisabled(false);
            this.textarea.focus();
        }
    }

    /**
     * Auto-resize textarea based on content
     */
    autoResize() {
        const textarea = this.textarea;
        
        // Reset height to calculate scroll height
        textarea.style.height = `${this.minHeight}px`;
        
        // Calculate new height
        const scrollHeight = textarea.scrollHeight;
        const newHeight = Math.min(Math.max(scrollHeight, this.minHeight), this.maxHeight);
        
        // Apply new height
        textarea.style.height = `${newHeight}px`;
        
        // Update wrapper class for styling
        this.inputWrapper.classList.toggle('gary-ai-input-multiline', newHeight > this.minHeight);
    }

    /**
     * Update character counter
     */
    updateCharCounter(length) {
        this.charCounter.textContent = `${length}/${this.maxLength}`;
        
        // Add warning class when approaching limit
        const isNearLimit = length > this.maxLength * 0.8;
        this.charCounter.classList.toggle('gary-ai-char-warning', isNearLimit);
        
        // Add error class when over limit
        const isOverLimit = length > this.maxLength;
        this.charCounter.classList.toggle('gary-ai-char-error', isOverLimit);
    }

    /**
     * Update send button state
     */
    updateSendButton() {
        const hasText = this.textarea.value.trim().length > 0;
        const hasAttachment = !!this.attachedFile;
        const isValid = (hasText || hasAttachment) && !this.isDisabled;
        
        this.sendButton.disabled = !isValid;
        this.sendButton.classList.toggle('gary-ai-send-enabled', isValid);
        
        // Update aria-label
        if (isValid) {
            this.sendButton.setAttribute('aria-label', 'Send message');
        } else {
            this.sendButton.setAttribute('aria-label', 'Send message (disabled)');
        }
    }

    /**
     * Handle typing start
     */
    handleTypingStart() {
        if (!this.isTyping) {
            this.isTyping = true;
            this.emitTypingEvent('start');
        }
        
        // Reset typing timer
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
        
        this.typingTimer = setTimeout(() => {
            this.handleTypingEnd();
        }, 3000); // Stop typing after 3 seconds of inactivity
    }

    /**
     * Handle typing end
     */
    handleTypingEnd() {
        if (this.isTyping) {
            this.isTyping = false;
            this.emitTypingEvent('stop');
        }
        
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
    }

    /**
     * Emit typing event
     */
    emitTypingEvent(action) {
        const event = new CustomEvent('gary-ai-typing', {
            detail: { action }
        });
        this.element.dispatchEvent(event);
    }

    /**
     * Show input error message
     */
    showInputError(message) {
        // Remove existing error
        this.clearInputError();
        
        // Create error element
        const error = document.createElement('div');
        error.className = 'gary-ai-input-error';
        error.setAttribute('role', 'alert');
        error.textContent = message;
        
        // Insert after input wrapper
        this.inputWrapper.parentNode.insertBefore(error, this.inputWrapper.nextSibling);
        
        // Add error class to input
        this.textarea.classList.add('gary-ai-input-invalid');
        this.textarea.setAttribute('aria-invalid', 'true');
        
        // Announce to screen readers
        this.announceToScreenReader(`Error: ${message}`);
    }

    /**
     * Clear input error
     */
    clearInputError() {
        const error = this.element.querySelector('.gary-ai-input-error');
        if (error) {
            error.remove();
        }
        
        this.textarea.classList.remove('gary-ai-input-invalid');
        this.textarea.setAttribute('aria-invalid', 'false');
    }

    /**
     * Clear input content
     */
    clearInput() {
        this.textarea.value = '';
        this.textarea.style.height = `${this.minHeight}px`;
        this.inputWrapper.classList.remove('gary-ai-input-multiline');
        
        // Remove attachment
        const attachment = this.element.querySelector('.gary-ai-file-attachment');
        if (attachment) {
            attachment.remove();
        }
        this.attachedFile = null;
        
        // Update UI
        this.updateCharCounter(0);
        this.updateSendButton();
        this.clearInputError();
    }

    /**
     * Set input disabled state
     */
    setDisabled(disabled) {
        this.isDisabled = disabled;
        this.textarea.disabled = disabled;
        this.sendButton.disabled = disabled || !this.hasValidInput();
        this.attachButton.disabled = disabled;
        
        // Update visual state
        this.element.classList.toggle('gary-ai-input-disabled', disabled);
        
        // Update placeholder
        if (disabled) {
            this.textarea.placeholder = 'Please wait...';
        } else {
            this.textarea.placeholder = 'Type your message here...';
        }
    }

    /**
     * Check if input has valid content
     */
    hasValidInput() {
        return this.textarea.value.trim().length > 0 || !!this.attachedFile;
    }

    /**
     * Focus the input
     */
    focus() {
        this.textarea.focus();
    }

    /**
     * Get current input value
     */
    getValue() {
        return {
            text: this.textarea.value,
            attachment: this.attachedFile
        };
    }

    /**
     * Set input value
     */
    setValue(text) {
        this.textarea.value = text || '';
        this.autoResize();
        this.updateCharCounter(this.textarea.value.length);
        this.updateSendButton();
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
        this.logger.debug('Mounting InputArea');
        
        // Add CSS for input styling
        const style = document.createElement('style');
        style.textContent = `
            .gary-ai-input-area {
                border-top: 1px solid var(--gary-ai-border);
                padding: 16px;
                background: var(--gary-ai-bg-primary);
            }
            
            .gary-ai-input-wrapper {
                display: flex;
                align-items: flex-end;
                gap: 8px;
                background: var(--gary-ai-bg-secondary);
                border: 1px solid var(--gary-ai-border);
                border-radius: 12px;
                padding: 8px 12px;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }
            
            .gary-ai-input-focused .gary-ai-input-wrapper {
                border-color: var(--gary-ai-primary);
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }
            
            .gary-ai-input {
                flex: 1;
                border: none;
                outline: none;
                background: transparent;
                resize: none;
                font-family: var(--gary-ai-font-primary);
                font-size: 14px;
                line-height: 1.5;
                color: var(--gary-ai-text-primary);
            }
            
            .gary-ai-input::placeholder {
                color: var(--gary-ai-text-secondary);
            }
            
            .gary-ai-input-invalid {
                border-color: #dc2626 !important;
            }
            
            .gary-ai-input-disabled {
                opacity: 0.6;
                pointer-events: none;
            }
            
            .gary-ai-attach-button,
            .gary-ai-send-button {
                background: none;
                border: none;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s ease;
                flex-shrink: 0;
            }
            
            .gary-ai-attach-button {
                color: var(--gary-ai-text-secondary);
            }
            
            .gary-ai-attach-button:hover {
                background: var(--gary-ai-bg-primary);
                color: var(--gary-ai-text-primary);
            }
            
            .gary-ai-send-button {
                color: var(--gary-ai-text-secondary);
            }
            
            .gary-ai-send-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .gary-ai-send-enabled {
                background: var(--gary-ai-primary);
                color: white;
            }
            
            .gary-ai-send-enabled:hover {
                background: var(--gary-ai-primary-dark);
            }
            
            .gary-ai-attach-button svg,
            .gary-ai-send-button svg {
                width: 20px;
                height: 20px;
            }
            
            .gary-ai-char-counter {
                font-size: 12px;
                color: var(--gary-ai-text-secondary);
                text-align: right;
                margin-top: 4px;
            }
            
            .gary-ai-char-warning {
                color: #f59e0b;
            }
            
            .gary-ai-char-error {
                color: #dc2626;
            }
            
            .gary-ai-input-error {
                color: #dc2626;
                font-size: 12px;
                margin-top: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .gary-ai-file-attachment {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: var(--gary-ai-bg-secondary);
                border: 1px solid var(--gary-ai-border);
                border-radius: 8px;
                padding: 8px 12px;
                margin-bottom: 8px;
            }
            
            .gary-ai-file-info {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }
            
            .gary-ai-file-info svg {
                width: 16px;
                height: 16px;
                color: var(--gary-ai-text-secondary);
            }
            
            .gary-ai-file-name {
                font-weight: 500;
                color: var(--gary-ai-text-primary);
            }
            
            .gary-ai-file-size {
                font-size: 12px;
                color: var(--gary-ai-text-secondary);
            }
            
            .gary-ai-remove-attachment {
                background: none;
                border: none;
                padding: 4px;
                border-radius: 4px;
                cursor: pointer;
                color: var(--gary-ai-text-secondary);
                transition: background-color 0.2s ease;
            }
            
            .gary-ai-remove-attachment:hover {
                background: var(--gary-ai-bg-primary);
                color: #dc2626;
            }
            
            .gary-ai-remove-attachment svg {
                width: 16px;
                height: 16px;
            }
        `;
        
        if (!document.querySelector('#gary-ai-input-styles')) {
            style.id = 'gary-ai-input-styles';
            document.head.appendChild(style);
        }
        
        // Focus the input
        this.focus();
        
        this.logger.debug('InputArea mounted');
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.logger.debug('Destroying InputArea');
        
        // Clear timers
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
        
        // Clear input
        this.clearInput();
        
        this.logger.debug('InputArea destroyed');
    }
}
