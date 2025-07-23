/**
 * ChatButton Component - Floating Action Button
 * 
 * Manages the floating chat button that opens/closes the widget.
 * Handles animations, accessibility, and user interactions.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

export class ChatButton {
    constructor(element, options = {}) {
        this.element = element;
        this.onClick = options.onClick || (() => {});
        this.logger = options.logger || console;
        
        // Button state
        this.isVisible = true;
        this.isExpanded = false;
        this.hasNotification = false;
        
        // Animation properties
        this.animationDuration = 200;
        this.pulseInterval = null;
        
        this.init();
    }

    /**
     * Initialize the chat button
     */
    init() {
        this.logger.debug('Initializing ChatButton');
        
        // Set initial attributes
        this.element.setAttribute('type', 'button');
        this.element.setAttribute('aria-expanded', 'false');
        this.element.setAttribute('aria-haspopup', 'dialog');
        
        // Bind events
        this.bindEvents();
        
        // Setup intersection observer for scroll behavior
        this.setupScrollBehavior();
        
        this.logger.debug('ChatButton initialized');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Click handler
        this.element.addEventListener('click', this.handleClick.bind(this));
        
        // Keyboard handler
        this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Mouse events for hover effects
        this.element.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Focus events
        this.element.addEventListener('focus', this.handleFocus.bind(this));
        this.element.addEventListener('blur', this.handleBlur.bind(this));
    }

    /**
     * Setup scroll behavior to hide/show button
     */
    setupScrollBehavior() {
        let lastScrollY = window.scrollY;
        let scrollTimeout = null;
        
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollingDown = currentScrollY > lastScrollY;
            const scrolledDistance = Math.abs(currentScrollY - lastScrollY);
            
            // Only hide/show if scrolled a significant distance
            if (scrolledDistance > 50) {
                if (scrollingDown && currentScrollY > 200) {
                    this.hide();
                } else {
                    this.show();
                }
                lastScrollY = currentScrollY;
            }
            
            // Clear existing timeout
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            
            // Show button after scrolling stops
            scrollTimeout = setTimeout(() => {
                this.show();
            }, 1000);
        };
        
        // Throttled scroll listener
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    /**
     * Handle button click
     */
    handleClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.logger.debug('ChatButton clicked');
        
        // Add click animation
        this.addClickAnimation();
        
        // Clear notification if present
        if (this.hasNotification) {
            this.clearNotification();
        }
        
        // Call the onClick handler
        this.onClick();
        
        // Toggle expanded state
        this.isExpanded = !this.isExpanded;
        this.element.setAttribute('aria-expanded', this.isExpanded.toString());
    }

    /**
     * Handle keyboard events
     */
    handleKeyDown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleClick(e);
        }
    }

    /**
     * Handle mouse enter
     */
    handleMouseEnter() {
        this.element.classList.add('gary-ai-chat-button-hover');
        
        // Show tooltip if configured
        this.showTooltip();
    }

    /**
     * Handle mouse leave
     */
    handleMouseLeave() {
        this.element.classList.remove('gary-ai-chat-button-hover');
        
        // Hide tooltip
        this.hideTooltip();
    }

    /**
     * Handle focus
     */
    handleFocus() {
        this.element.classList.add('gary-ai-chat-button-focused');
        this.showTooltip();
    }

    /**
     * Handle blur
     */
    handleBlur() {
        this.element.classList.remove('gary-ai-chat-button-focused');
        this.hideTooltip();
    }

    /**
     * Show the button with animation
     */
    show() {
        if (this.isVisible) return;
        
        this.logger.debug('Showing ChatButton');
        
        this.isVisible = true;
        this.element.style.display = 'flex';
        
        // Trigger reflow
        this.element.offsetHeight;
        
        // Add show animation
        this.element.classList.add('gary-ai-chat-button-show');
        this.element.classList.remove('gary-ai-chat-button-hide');
        
        // Update accessibility
        this.element.setAttribute('aria-hidden', 'false');
    }

    /**
     * Hide the button with animation
     */
    hide() {
        if (!this.isVisible) return;
        
        this.logger.debug('Hiding ChatButton');
        
        this.isVisible = false;
        
        // Add hide animation
        this.element.classList.add('gary-ai-chat-button-hide');
        this.element.classList.remove('gary-ai-chat-button-show');
        
        // Update accessibility
        this.element.setAttribute('aria-hidden', 'true');
        
        // Hide after animation
        setTimeout(() => {
            if (!this.isVisible) {
                this.element.style.display = 'none';
            }
        }, this.animationDuration);
    }

    /**
     * Add click animation effect
     */
    addClickAnimation() {
        this.element.classList.add('gary-ai-chat-button-clicked');
        
        setTimeout(() => {
            this.element.classList.remove('gary-ai-chat-button-clicked');
        }, 150);
    }

    /**
     * Show notification indicator
     */
    showNotification() {
        if (this.hasNotification) return;
        
        this.logger.debug('Showing notification on ChatButton');
        
        this.hasNotification = true;
        
        // Create notification dot
        const notificationDot = document.createElement('div');
        notificationDot.className = 'gary-ai-notification-dot';
        notificationDot.setAttribute('aria-label', 'New message');
        
        this.element.appendChild(notificationDot);
        
        // Start pulse animation
        this.startPulseAnimation();
        
        // Update accessibility
        this.element.setAttribute('aria-label', 'Open Gary AI Chat (new message)');
    }

    /**
     * Clear notification indicator
     */
    clearNotification() {
        if (!this.hasNotification) return;
        
        this.logger.debug('Clearing notification on ChatButton');
        
        this.hasNotification = false;
        
        // Remove notification dot
        const notificationDot = this.element.querySelector('.gary-ai-notification-dot');
        if (notificationDot) {
            notificationDot.remove();
        }
        
        // Stop pulse animation
        this.stopPulseAnimation();
        
        // Update accessibility
        this.element.setAttribute('aria-label', 'Open Gary AI Chat');
    }

    /**
     * Start pulse animation for notifications
     */
    startPulseAnimation() {
        this.element.classList.add('gary-ai-chat-button-pulse');
        
        this.pulseInterval = setInterval(() => {
            this.element.classList.toggle('gary-ai-chat-button-pulse-active');
        }, 2000);
    }

    /**
     * Stop pulse animation
     */
    stopPulseAnimation() {
        this.element.classList.remove('gary-ai-chat-button-pulse', 'gary-ai-chat-button-pulse-active');
        
        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
            this.pulseInterval = null;
        }
    }

    /**
     * Show tooltip
     */
    showTooltip() {
        // Create tooltip if it doesn't exist
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'gary-ai-tooltip';
            this.tooltip.textContent = 'Chat with Gary AI';
            this.tooltip.setAttribute('role', 'tooltip');
            document.body.appendChild(this.tooltip);
        }
        
        // Position tooltip
        this.positionTooltip();
        
        // Show tooltip
        this.tooltip.classList.add('gary-ai-tooltip-visible');
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.remove('gary-ai-tooltip-visible');
        }
    }

    /**
     * Position tooltip relative to button
     */
    positionTooltip() {
        if (!this.tooltip) return;
        
        const buttonRect = this.element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        // Position to the left of the button
        const left = buttonRect.left - tooltipRect.width - 10;
        const top = buttonRect.top + (buttonRect.height - tooltipRect.height) / 2;
        
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    /**
     * Update button icon
     */
    updateIcon(iconSvg) {
        this.element.innerHTML = iconSvg;
    }

    /**
     * Set button state (loading, error, etc.)
     */
    setState(state) {
        // Remove existing state classes
        this.element.classList.remove(
            'gary-ai-chat-button-loading',
            'gary-ai-chat-button-error',
            'gary-ai-chat-button-success'
        );
        
        // Add new state class
        if (state && state !== 'default') {
            this.element.classList.add(`gary-ai-chat-button-${state}`);
        }
        
        // Update icon based on state
        switch (state) {
            case 'loading':
                this.updateIcon(`
                    <div class="gary-ai-spinner"></div>
                `);
                break;
            case 'error':
                this.updateIcon(`
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                `);
                break;
            default:
                this.updateIcon(`
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.471L3 21l2.471-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                    </svg>
                `);
        }
    }

    /**
     * Mount the component
     */
    async mount() {
        this.logger.debug('Mounting ChatButton');
        
        // Add CSS classes for animations
        const style = document.createElement('style');
        style.textContent = `
            .gary-ai-chat-button-show {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            
            .gary-ai-chat-button-hide {
                transform: translateY(20px) scale(0.8);
                opacity: 0;
            }
            
            .gary-ai-chat-button-clicked {
                transform: scale(0.95);
            }
            
            .gary-ai-chat-button-pulse {
                animation: gary-ai-button-pulse 2s infinite;
            }
            
            @keyframes gary-ai-button-pulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
                50% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
            }
            
            .gary-ai-notification-dot {
                position: absolute;
                top: -2px;
                right: -2px;
                width: 12px;
                height: 12px;
                background: #ef4444;
                border: 2px solid white;
                border-radius: 50%;
                animation: gary-ai-notification-bounce 1s infinite;
            }
            
            @keyframes gary-ai-notification-bounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
            
            .gary-ai-tooltip {
                position: fixed;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 14px;
                white-space: nowrap;
                z-index: 999999;
                opacity: 0;
                transform: translateX(10px);
                transition: all 0.2s ease;
                pointer-events: none;
            }
            
            .gary-ai-tooltip-visible {
                opacity: 1;
                transform: translateX(0);
            }
        `;
        
        if (!document.querySelector('#gary-ai-button-styles')) {
            style.id = 'gary-ai-button-styles';
            document.head.appendChild(style);
        }
        
        // Show the button
        this.show();
        
        this.logger.debug('ChatButton mounted');
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.logger.debug('Destroying ChatButton');
        
        // Stop animations
        this.stopPulseAnimation();
        
        // Remove tooltip
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        
        // Remove event listeners (they'll be cleaned up when element is removed)
        
        this.logger.debug('ChatButton destroyed');
    }
}
