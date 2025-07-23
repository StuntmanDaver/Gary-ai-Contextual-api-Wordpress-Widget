/**
 * ChatHeader Component - Widget Header
 * 
 * Manages the chat widget header with title, status, and close button.
 * Handles user interactions and displays connection status.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

export class ChatHeader {
    constructor(element, options = {}) {
        this.element = element;
        this.onClose = options.onClose || (() => {});
        this.logger = options.logger || console;
        
        // Header state
        this.connectionStatus = 'connected';
        this.isMinimized = false;
        
        // DOM elements
        this.titleElement = null;
        this.subtitleElement = null;
        this.statusElement = null;
        this.closeButton = null;
        this.minimizeButton = null;
        
        this.init();
    }

    /**
     * Initialize the chat header
     */
    init() {
        this.logger.debug('Initializing ChatHeader');
        
        // Get DOM elements
        this.titleElement = this.element.querySelector('.gary-ai-chat-title');
        this.subtitleElement = this.element.querySelector('.gary-ai-chat-subtitle');
        this.closeButton = this.element.querySelector('.gary-ai-close-button');
        
        // Create status indicator
        this.createStatusIndicator();
        
        // Create minimize button
        this.createMinimizeButton();
        
        // Bind events
        this.bindEvents();
        
        // Setup drag functionality
        this.setupDragFunctionality();
        
        this.logger.debug('ChatHeader initialized');
    }

    /**
     * Create connection status indicator
     */
    createStatusIndicator() {
        this.statusElement = document.createElement('div');
        this.statusElement.className = 'gary-ai-status-indicator';
        this.statusElement.setAttribute('aria-label', 'Connection status');
        
        // Create status dot
        const statusDot = document.createElement('div');
        statusDot.className = 'gary-ai-status-dot';
        
        // Create status text
        const statusText = document.createElement('span');
        statusText.className = 'gary-ai-status-text';
        statusText.textContent = 'Online';
        
        this.statusElement.appendChild(statusDot);
        this.statusElement.appendChild(statusText);
        
        // Insert after subtitle
        if (this.subtitleElement) {
            this.subtitleElement.parentNode.insertBefore(this.statusElement, this.subtitleElement.nextSibling);
        } else {
            this.titleElement.parentNode.appendChild(this.statusElement);
        }
    }

    /**
     * Create minimize button
     */
    createMinimizeButton() {
        this.minimizeButton = document.createElement('button');
        this.minimizeButton.className = 'gary-ai-minimize-button';
        this.minimizeButton.setAttribute('aria-label', 'Minimize chat');
        this.minimizeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
        `;
        
        // Insert before close button
        this.closeButton.parentNode.insertBefore(this.minimizeButton, this.closeButton);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Close button
        if (this.closeButton) {
            this.closeButton.addEventListener('click', this.handleClose.bind(this));
            this.closeButton.addEventListener('keydown', this.handleCloseKeyDown.bind(this));
        }
        
        // Minimize button
        if (this.minimizeButton) {
            this.minimizeButton.addEventListener('click', this.handleMinimize.bind(this));
            this.minimizeButton.addEventListener('keydown', this.handleMinimizeKeyDown.bind(this));
        }
        
        // Status indicator click for connection info
        if (this.statusElement) {
            this.statusElement.addEventListener('click', this.showConnectionInfo.bind(this));
        }
    }

    /**
     * Setup drag functionality for repositioning
     */
    setupDragFunctionality() {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        const handleMouseDown = (e) => {
            // Only allow dragging from title area, not buttons
            if (e.target.closest('button')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const widget = this.element.closest('.gary-ai-widget-container');
            const rect = widget.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            this.element.style.cursor = 'grabbing';
            widget.style.transition = 'none';
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            e.preventDefault();
        };
        
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const widget = this.element.closest('.gary-ai-widget-container');
            const newLeft = Math.max(0, Math.min(window.innerWidth - widget.offsetWidth, startLeft + deltaX));
            const newTop = Math.max(0, Math.min(window.innerHeight - widget.offsetHeight, startTop + deltaY));
            
            widget.style.left = `${newLeft}px`;
            widget.style.top = `${newTop}px`;
            widget.style.right = 'auto';
            widget.style.bottom = 'auto';
        };
        
        const handleMouseUp = () => {
            isDragging = false;
            this.element.style.cursor = '';
            
            const widget = this.element.closest('.gary-ai-widget-container');
            widget.style.transition = '';
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // Save position to localStorage
            this.savePosition();
        };
        
        // Only enable drag on desktop
        if (window.innerWidth > 768) {
            this.element.addEventListener('mousedown', handleMouseDown);
            this.element.style.cursor = 'grab';
        }
    }

    /**
     * Handle close button click
     */
    handleClose(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.logger.debug('ChatHeader close button clicked');
        this.onClose();
    }

    /**
     * Handle close button keyboard events
     */
    handleCloseKeyDown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleClose(e);
        }
    }

    /**
     * Handle minimize button click
     */
    handleMinimize(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.logger.debug('ChatHeader minimize button clicked');
        this.toggleMinimize();
    }

    /**
     * Handle minimize button keyboard events
     */
    handleMinimizeKeyDown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleMinimize(e);
        }
    }

    /**
     * Toggle minimize state
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        
        const widget = this.element.closest('.gary-ai-widget-container');
        widget.classList.toggle('gary-ai-widget-minimized', this.isMinimized);
        
        // Update minimize button icon and label
        if (this.isMinimized) {
            this.minimizeButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
            `;
            this.minimizeButton.setAttribute('aria-label', 'Restore chat');
        } else {
            this.minimizeButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
            `;
            this.minimizeButton.setAttribute('aria-label', 'Minimize chat');
        }
        
        // Announce to screen readers
        const announcement = this.isMinimized ? 'Chat minimized' : 'Chat restored';
        this.announceToScreenReader(announcement);
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(status, message = null) {
        if (this.connectionStatus === status) return;
        
        this.logger.debug(`Connection status changed: ${status}`);
        
        this.connectionStatus = status;
        
        // Update status indicator
        const statusDot = this.statusElement.querySelector('.gary-ai-status-dot');
        const statusText = this.statusElement.querySelector('.gary-ai-status-text');
        
        // Remove existing status classes
        statusDot.classList.remove('gary-ai-status-connected', 'gary-ai-status-connecting', 'gary-ai-status-disconnected', 'gary-ai-status-error');
        
        // Add new status class and update text
        switch (status) {
            case 'connected':
                statusDot.classList.add('gary-ai-status-connected');
                statusText.textContent = 'Online';
                this.statusElement.setAttribute('aria-label', 'Connected');
                break;
            case 'connecting':
                statusDot.classList.add('gary-ai-status-connecting');
                statusText.textContent = 'Connecting...';
                this.statusElement.setAttribute('aria-label', 'Connecting');
                break;
            case 'disconnected':
                statusDot.classList.add('gary-ai-status-disconnected');
                statusText.textContent = 'Offline';
                this.statusElement.setAttribute('aria-label', 'Disconnected');
                break;
            case 'error':
                statusDot.classList.add('gary-ai-status-error');
                statusText.textContent = 'Error';
                this.statusElement.setAttribute('aria-label', 'Connection error');
                break;
        }
        
        // Show custom message if provided
        if (message) {
            statusText.textContent = message;
        }
        
        // Announce status change to screen readers
        this.announceToScreenReader(`Connection status: ${statusText.textContent}`);
    }

    /**
     * Update title and subtitle
     */
    updateTitle(title, subtitle = null) {
        if (this.titleElement && title) {
            this.titleElement.textContent = title;
        }
        
        if (this.subtitleElement && subtitle !== null) {
            this.subtitleElement.textContent = subtitle;
        }
    }

    /**
     * Show typing indicator in subtitle
     */
    showTypingIndicator() {
        if (this.subtitleElement) {
            this.subtitleElement.innerHTML = `
                <span class="gary-ai-typing-indicator-text">
                    Gary AI is typing
                    <span class="gary-ai-typing-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </span>
                </span>
            `;
            this.subtitleElement.classList.add('gary-ai-typing');
        }
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        if (this.subtitleElement) {
            this.subtitleElement.textContent = 'How can I help you today?';
            this.subtitleElement.classList.remove('gary-ai-typing');
        }
    }

    /**
     * Show connection info modal
     */
    showConnectionInfo() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'gary-ai-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'gary-ai-connection-title');
        
        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'gary-ai-modal';
        modal.innerHTML = `
            <div class="gary-ai-modal-header">
                <h3 id="gary-ai-connection-title">Connection Information</h3>
                <button class="gary-ai-modal-close" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="gary-ai-modal-body">
                <div class="gary-ai-connection-details">
                    <div class="gary-ai-connection-item">
                        <span class="gary-ai-connection-label">Status:</span>
                        <span class="gary-ai-connection-value gary-ai-status-${this.connectionStatus}">${this.getStatusText()}</span>
                    </div>
                    <div class="gary-ai-connection-item">
                        <span class="gary-ai-connection-label">Server:</span>
                        <span class="gary-ai-connection-value">${window.location.hostname}</span>
                    </div>
                    <div class="gary-ai-connection-item">
                        <span class="gary-ai-connection-label">Last Updated:</span>
                        <span class="gary-ai-connection-value">${new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Close handlers
        const closeModal = () => {
            document.body.removeChild(overlay);
        };
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        
        modal.querySelector('.gary-ai-modal-close').addEventListener('click', closeModal);
        
        // Keyboard handler
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Focus management
        modal.querySelector('.gary-ai-modal-close').focus();
    }

    /**
     * Get human-readable status text
     */
    getStatusText() {
        switch (this.connectionStatus) {
            case 'connected': return 'Connected';
            case 'connecting': return 'Connecting...';
            case 'disconnected': return 'Disconnected';
            case 'error': return 'Connection Error';
            default: return 'Unknown';
        }
    }

    /**
     * Save widget position to localStorage
     */
    savePosition() {
        try {
            const widget = this.element.closest('.gary-ai-widget-container');
            const rect = widget.getBoundingClientRect();
            
            const position = {
                left: rect.left,
                top: rect.top,
                timestamp: Date.now()
            };
            
            localStorage.setItem('gary-ai-widget-position', JSON.stringify(position));
        } catch (error) {
            this.logger.warn('Failed to save widget position:', error);
        }
    }

    /**
     * Restore widget position from localStorage
     */
    restorePosition() {
        try {
            const savedPosition = localStorage.getItem('gary-ai-widget-position');
            if (!savedPosition) return;
            
            const position = JSON.parse(savedPosition);
            
            // Check if position is recent (within 7 days)
            if (Date.now() - position.timestamp > 7 * 24 * 60 * 60 * 1000) {
                return;
            }
            
            const widget = this.element.closest('.gary-ai-widget-container');
            
            // Validate position is within viewport
            if (position.left >= 0 && position.left < window.innerWidth - widget.offsetWidth &&
                position.top >= 0 && position.top < window.innerHeight - widget.offsetHeight) {
                
                widget.style.left = `${position.left}px`;
                widget.style.top = `${position.top}px`;
                widget.style.right = 'auto';
                widget.style.bottom = 'auto';
            }
        } catch (error) {
            this.logger.warn('Failed to restore widget position:', error);
        }
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
        this.logger.debug('Mounting ChatHeader');
        
        // Restore saved position
        this.restorePosition();
        
        // Add CSS for animations and styles
        const style = document.createElement('style');
        style.textContent = `
            .gary-ai-status-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-top: 4px;
                cursor: pointer;
                font-size: 12px;
                color: var(--gary-ai-text-secondary);
            }
            
            .gary-ai-status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                transition: background-color 0.2s ease;
            }
            
            .gary-ai-status-connected {
                background-color: #10b981;
            }
            
            .gary-ai-status-connecting {
                background-color: #f59e0b;
                animation: gary-ai-pulse 1.5s infinite;
            }
            
            .gary-ai-status-disconnected {
                background-color: #6b7280;
            }
            
            .gary-ai-status-error {
                background-color: #ef4444;
            }
            
            @keyframes gary-ai-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .gary-ai-typing-indicator-text {
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            
            .gary-ai-typing-dots span {
                animation: gary-ai-typing-dot 1.4s infinite;
            }
            
            .gary-ai-typing-dots span:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .gary-ai-typing-dots span:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes gary-ai-typing-dot {
                0%, 60%, 100% { opacity: 0.3; }
                30% { opacity: 1; }
            }
            
            .gary-ai-widget-minimized .gary-ai-messages-container,
            .gary-ai-widget-minimized .gary-ai-input-area,
            .gary-ai-widget-minimized .gary-ai-typing-indicator {
                display: none;
            }
            
            .gary-ai-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000000;
            }
            
            .gary-ai-modal {
                background: var(--gary-ai-bg-primary);
                border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
            }
            
            .gary-ai-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--gary-ai-border);
            }
            
            .gary-ai-modal-body {
                padding: 20px;
            }
            
            .gary-ai-connection-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid var(--gary-ai-border);
            }
            
            .gary-ai-connection-item:last-child {
                border-bottom: none;
            }
            
            .gary-ai-connection-label {
                font-weight: 500;
                color: var(--gary-ai-text-secondary);
            }
            
            .gary-ai-connection-value {
                font-weight: 600;
            }
        `;
        
        if (!document.querySelector('#gary-ai-header-styles')) {
            style.id = 'gary-ai-header-styles';
            document.head.appendChild(style);
        }
        
        this.logger.debug('ChatHeader mounted');
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.logger.debug('Destroying ChatHeader');
        
        // Save current position before destroying
        this.savePosition();
        
        this.logger.debug('ChatHeader destroyed');
    }
}
