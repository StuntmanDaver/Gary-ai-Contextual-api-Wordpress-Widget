/**
 * TypingIndicator Component - AI Typing Animation
 * 
 * Displays animated typing indicator when AI is processing a response.
 * Includes accessibility features and smooth animations.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

export class TypingIndicator {
    constructor(element, options = {}) {
        this.element = element;
        this.logger = options.logger || console;
        
        // Animation state
        this.isVisible = false;
        this.animationFrameId = null;
        this.dotElements = [];
        
        // Timing configuration
        this.animationDuration = 1400; // Total animation cycle duration
        this.dotDelay = 200; // Delay between each dot animation
        
        this.init();
    }

    /**
     * Initialize the typing indicator
     */
    init() {
        this.logger.debug('Initializing TypingIndicator');
        
        // Get dot elements
        this.dotElements = Array.from(this.element.querySelectorAll('.gary-ai-typing-dot'));
        
        // Setup accessibility
        this.setupAccessibility();
        
        // Initially hidden
        this.hide();
        
        this.logger.debug('TypingIndicator initialized');
    }

    /**
     * Setup accessibility attributes
     */
    setupAccessibility() {
        this.element.setAttribute('role', 'status');
        this.element.setAttribute('aria-live', 'polite');
        this.element.setAttribute('aria-label', 'Gary AI is typing');
        
        // Hide decorative dots from screen readers
        this.dotElements.forEach(dot => {
            dot.setAttribute('aria-hidden', 'true');
        });
    }

    /**
     * Show the typing indicator with animation
     */
    show() {
        if (this.isVisible) return;
        
        this.logger.debug('Showing typing indicator');
        
        this.isVisible = true;
        this.element.classList.remove('gary-ai-hidden');
        this.element.classList.add('gary-ai-typing-visible');
        
        // Start animation
        this.startAnimation();
        
        // Announce to screen readers
        this.announceToScreenReader('Gary AI is typing');
        
        // Update accessibility
        this.element.setAttribute('aria-hidden', 'false');
    }

    /**
     * Hide the typing indicator
     */
    hide() {
        if (!this.isVisible) return;
        
        this.logger.debug('Hiding typing indicator');
        
        this.isVisible = false;
        this.element.classList.add('gary-ai-hidden');
        this.element.classList.remove('gary-ai-typing-visible');
        
        // Stop animation
        this.stopAnimation();
        
        // Update accessibility
        this.element.setAttribute('aria-hidden', 'true');
    }

    /**
     * Start dot animation
     */
    startAnimation() {
        // Stop any existing animation
        this.stopAnimation();
        
        // Start CSS animation
        this.element.classList.add('gary-ai-typing-animated');
        
        // Optional: Add custom animation logic if needed
        this.animateDotsSequence();
    }

    /**
     * Stop dot animation
     */
    stopAnimation() {
        this.element.classList.remove('gary-ai-typing-animated');
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Reset dot states
        this.dotElements.forEach(dot => {
            dot.style.animationDelay = '';
            dot.classList.remove('gary-ai-dot-active');
        });
    }

    /**
     * Animate dots in sequence (alternative to CSS animation)
     */
    animateDotsSequence() {
        let currentDot = 0;
        let startTime = Date.now();
        
        const animate = () => {
            if (!this.isVisible) return;
            
            const elapsed = Date.now() - startTime;
            const cyclePosition = (elapsed % this.animationDuration) / this.animationDuration;
            
            // Calculate which dot should be active
            const activeDot = Math.floor(cyclePosition * this.dotElements.length * 2) % this.dotElements.length;
            
            // Update dot states
            this.dotElements.forEach((dot, index) => {
                const isActive = index === activeDot;
                dot.classList.toggle('gary-ai-dot-active', isActive);
            });
            
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        // Start animation loop
        this.animationFrameId = requestAnimationFrame(animate);
    }

    /**
     * Set custom typing message
     */
    setMessage(message) {
        const textElement = this.element.querySelector('span');
        if (textElement) {
            textElement.textContent = message;
            this.element.setAttribute('aria-label', message);
        }
    }

    /**
     * Show with custom message
     */
    showWithMessage(message) {
        this.setMessage(message);
        this.show();
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Check if currently visible
     */
    isShowing() {
        return this.isVisible;
    }

    /**
     * Set animation speed
     */
    setAnimationSpeed(speed) {
        // speed: 'slow', 'normal', 'fast'
        const speeds = {
            slow: 2000,
            normal: 1400,
            fast: 1000
        };
        
        this.animationDuration = speeds[speed] || speeds.normal;
        
        // Update CSS custom property if using CSS animations
        this.element.style.setProperty('--gary-ai-typing-duration', `${this.animationDuration}ms`);
        
        // Restart animation if currently visible
        if (this.isVisible) {
            this.startAnimation();
        }
    }

    /**
     * Create enhanced typing indicator with avatar
     */
    createEnhancedIndicator() {
        // Clear existing content
        this.element.innerHTML = '';
        
        // Create avatar
        const avatar = document.createElement('div');
        avatar.className = 'gary-ai-typing-avatar';
        avatar.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        `;
        
        // Create content container
        const content = document.createElement('div');
        content.className = 'gary-ai-typing-content';
        
        // Create dots container
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'gary-ai-typing-dots';
        
        // Create individual dots
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'gary-ai-typing-dot';
            dot.style.animationDelay = `${i * this.dotDelay}ms`;
            dotsContainer.appendChild(dot);
        }
        
        // Create text
        const text = document.createElement('span');
        text.textContent = 'Gary AI is typing...';
        
        // Assemble structure
        content.appendChild(dotsContainer);
        content.appendChild(text);
        this.element.appendChild(avatar);
        this.element.appendChild(content);
        
        // Update dot elements reference
        this.dotElements = Array.from(dotsContainer.querySelectorAll('.gary-ai-typing-dot'));
        
        // Reapply accessibility
        this.setupAccessibility();
    }

    /**
     * Pulse effect for emphasis
     */
    pulse() {
        this.element.classList.add('gary-ai-typing-pulse');
        
        setTimeout(() => {
            this.element.classList.remove('gary-ai-typing-pulse');
        }, 600);
    }

    /**
     * Show temporary status message
     */
    showStatus(message, duration = 3000) {
        const originalMessage = this.element.querySelector('span')?.textContent;
        
        this.setMessage(message);
        this.show();
        
        setTimeout(() => {
            if (originalMessage) {
                this.setMessage(originalMessage);
            }
            this.hide();
        }, duration);
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        // Use the element's aria-live region
        const announcement = document.createElement('span');
        announcement.className = 'gary-ai-sr-only';
        announcement.textContent = message;
        
        this.element.appendChild(announcement);
        
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }

    /**
     * Mount the component
     */
    async mount() {
        this.logger.debug('Mounting TypingIndicator');
        
        // Add CSS for typing animations
        const style = document.createElement('style');
        style.textContent = `
            .gary-ai-typing-indicator {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                background: var(--gary-ai-bg-secondary);
                border-top: 1px solid var(--gary-ai-border);
                transition: opacity 0.3s ease, transform 0.3s ease;
                --gary-ai-typing-duration: 1400ms;
            }
            
            .gary-ai-typing-indicator.gary-ai-hidden {
                opacity: 0;
                transform: translateY(-10px);
                pointer-events: none;
            }
            
            .gary-ai-typing-visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .gary-ai-typing-avatar {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: var(--gary-ai-bg-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                color: var(--gary-ai-text-secondary);
            }
            
            .gary-ai-typing-avatar svg {
                width: 14px;
                height: 14px;
            }
            
            .gary-ai-typing-content {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }
            
            .gary-ai-typing-dots {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .gary-ai-typing-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--gary-ai-text-secondary);
                opacity: 0.4;
                animation: gary-ai-typing-dot var(--gary-ai-typing-duration) infinite ease-in-out;
            }
            
            .gary-ai-typing-dot:nth-child(1) {
                animation-delay: 0ms;
            }
            
            .gary-ai-typing-dot:nth-child(2) {
                animation-delay: 200ms;
            }
            
            .gary-ai-typing-dot:nth-child(3) {
                animation-delay: 400ms;
            }
            
            @keyframes gary-ai-typing-dot {
                0%, 60%, 100% {
                    opacity: 0.4;
                    transform: scale(1);
                }
                30% {
                    opacity: 1;
                    transform: scale(1.2);
                }
            }
            
            .gary-ai-typing-animated .gary-ai-typing-dot {
                animation-play-state: running;
            }
            
            .gary-ai-typing-indicator:not(.gary-ai-typing-animated) .gary-ai-typing-dot {
                animation-play-state: paused;
            }
            
            .gary-ai-typing-indicator span {
                font-size: 14px;
                color: var(--gary-ai-text-secondary);
                font-style: italic;
            }
            
            .gary-ai-typing-pulse {
                animation: gary-ai-typing-pulse 0.6s ease;
            }
            
            @keyframes gary-ai-typing-pulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.05);
                }
            }
            
            .gary-ai-dot-active {
                opacity: 1 !important;
                transform: scale(1.3) !important;
                background: var(--gary-ai-primary) !important;
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .gary-ai-typing-dot {
                    background: var(--gary-ai-text-primary);
                    opacity: 0.6;
                }
                
                .gary-ai-dot-active {
                    opacity: 1 !important;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .gary-ai-typing-dot {
                    animation: none;
                }
                
                .gary-ai-typing-indicator {
                    transition: opacity 0.2s ease;
                }
                
                .gary-ai-typing-pulse {
                    animation: none;
                }
            }
            
            /* Dark mode adjustments */
            [data-gary-ai-theme="dark"] .gary-ai-typing-indicator {
                background: var(--gary-ai-bg-secondary);
            }
            
            [data-gary-ai-theme="dark"] .gary-ai-typing-avatar {
                background: var(--gary-ai-bg-tertiary);
            }
        `;
        
        if (!document.querySelector('#gary-ai-typing-styles')) {
            style.id = 'gary-ai-typing-styles';
            document.head.appendChild(style);
        }
        
        this.logger.debug('TypingIndicator mounted');
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.logger.debug('Destroying TypingIndicator');
        
        // Stop any running animations
        this.stopAnimation();
        
        // Hide the indicator
        this.hide();
        
        this.logger.debug('TypingIndicator destroyed');
    }
}
