/**
 * Markdown Renderer Utility for Gary AI Chat Widget
 * 
 * Provides lightweight markdown parsing and rendering with code block support.
 * Includes copy-to-clipboard functionality for code blocks.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

export class MarkdownRenderer {
    constructor(options = {}) {
        this.options = {
            enableCodeCopy: options.enableCodeCopy !== false,
            enableSyntaxHighlighting: options.enableSyntaxHighlighting !== false,
            maxCodeBlockLength: options.maxCodeBlockLength || 10000,
            ...options
        };
        
        this.logger = options.logger || console;
        
        // Initialize copy functionality
        this.initializeCopySupport();
    }

    /**
     * Initialize clipboard copy support
     */
    initializeCopySupport() {
        this.clipboardSupported = !!(navigator.clipboard && navigator.clipboard.writeText);
        
        if (!this.clipboardSupported) {
            this.logger.warn('Clipboard API not supported, code copy will use fallback');
        }
    }

    /**
     * Render markdown content to HTML
     * 
     * @param {string} markdown - Markdown content to render
     * @return {string} Rendered HTML content
     */
    render(markdown) {
        if (!markdown || typeof markdown !== 'string') {
            return '';
        }

        try {
            let html = markdown;

            // Process in order of precedence
            html = this.renderCodeBlocks(html);
            html = this.renderInlineCode(html);
            html = this.renderHeaders(html);
            html = this.renderBold(html);
            html = this.renderItalic(html);
            html = this.renderLinks(html);
            html = this.renderLists(html);
            html = this.renderBlockquotes(html);
            html = this.renderLineBreaks(html);

            return html;
        } catch (error) {
            this.logger.error('Markdown rendering failed:', error);
            return this.escapeHtml(markdown);
        }
    }

    /**
     * Render code blocks with syntax highlighting and copy functionality
     */
    renderCodeBlocks(text) {
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
        
        return text.replace(codeBlockRegex, (match, language, code) => {
            if (code.length > this.options.maxCodeBlockLength) {
                code = code.substring(0, this.options.maxCodeBlockLength) + '\n... (truncated)';
            }

            const escapedCode = this.escapeHtml(code.trim());
            const languageClass = language ? ` class="language-${this.escapeHtml(language)}"` : '';
            const languageLabel = language ? this.escapeHtml(language) : 'code';
            const copyId = 'code-' + Math.random().toString(36).substr(2, 9);

            return `
                <div class="gary-ai-code-block" role="region" aria-label="Code block">
                    <div class="gary-ai-code-header">
                        <span class="gary-ai-code-language">${languageLabel}</span>
                        ${this.options.enableCodeCopy ? `
                            <button 
                                class="gary-ai-code-copy" 
                                data-code-id="${copyId}"
                                aria-label="Copy code to clipboard"
                                title="Copy code"
                                type="button"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                            </button>
                        ` : ''}
                    </div>
                    <pre${languageClass}><code id="${copyId}">${escapedCode}</code></pre>
                </div>
            `;
        });
    }

    /**
     * Render inline code
     */
    renderInlineCode(text) {
        return text.replace(/`([^`]+)`/g, '<code class="gary-ai-inline-code">$1</code>');
    }

    /**
     * Render headers
     */
    renderHeaders(text) {
        // H1-H6 headers
        return text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
            const level = hashes.length;
            const id = content.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return `<h${level} id="${id}" class="gary-ai-header gary-ai-h${level}">${content.trim()}</h${level}>`;
        });
    }

    /**
     * Render bold text
     */
    renderBold(text) {
        return text.replace(/\*\*(.*?)\*\*/g, '<strong class="gary-ai-bold">$1</strong>')
                  .replace(/__(.*?)__/g, '<strong class="gary-ai-bold">$1</strong>');
    }

    /**
     * Render italic text
     */
    renderItalic(text) {
        return text.replace(/\*(.*?)\*/g, '<em class="gary-ai-italic">$1</em>')
                  .replace(/_(.*?)_/g, '<em class="gary-ai-italic">$1</em>');
    }

    /**
     * Render links
     */
    renderLinks(text) {
        // Markdown links [text](url)
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            const escapedUrl = this.escapeHtml(url);
            const escapedText = this.escapeHtml(text);
            return `<a href="${escapedUrl}" class="gary-ai-link" target="_blank" rel="noopener noreferrer">${escapedText}</a>`;
        });

        // Auto-link URLs
        text = text.replace(/(https?:\/\/[^\s<>"]+)/g, (match, url) => {
            const escapedUrl = this.escapeHtml(url);
            return `<a href="${escapedUrl}" class="gary-ai-link" target="_blank" rel="noopener noreferrer">${escapedUrl}</a>`;
        });

        return text;
    }

    /**
     * Render lists
     */
    renderLists(text) {
        // Unordered lists
        text = text.replace(/^(\s*[-*+]\s+.+)(\n\s*[-*+]\s+.+)*/gm, (match) => {
            const items = match.split('\n').map(line => {
                const itemMatch = line.match(/^\s*[-*+]\s+(.+)$/);
                return itemMatch ? `<li class="gary-ai-list-item">${itemMatch[1]}</li>` : '';
            }).filter(Boolean).join('\n');
            
            return `<ul class="gary-ai-list gary-ai-unordered-list">\n${items}\n</ul>`;
        });

        // Ordered lists
        text = text.replace(/^(\s*\d+\.\s+.+)(\n\s*\d+\.\s+.+)*/gm, (match) => {
            const items = match.split('\n').map(line => {
                const itemMatch = line.match(/^\s*\d+\.\s+(.+)$/);
                return itemMatch ? `<li class="gary-ai-list-item">${itemMatch[1]}</li>` : '';
            }).filter(Boolean).join('\n');
            
            return `<ol class="gary-ai-list gary-ai-ordered-list">\n${items}\n</ol>`;
        });

        return text;
    }

    /**
     * Render blockquotes
     */
    renderBlockquotes(text) {
        return text.replace(/^>\s*(.+)$/gm, '<blockquote class="gary-ai-blockquote">$1</blockquote>');
    }

    /**
     * Render line breaks
     */
    renderLineBreaks(text) {
        return text.replace(/\n\n/g, '</p><p class="gary-ai-paragraph">')
                  .replace(/^\s*/, '<p class="gary-ai-paragraph">')
                  .replace(/\s*$/, '</p>')
                  .replace(/\n/g, '<br>');
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
     * Setup copy functionality for code blocks
     */
    setupCopyHandlers(container) {
        if (!this.options.enableCodeCopy) {
            return;
        }

        const copyButtons = container.querySelectorAll('.gary-ai-code-copy');
        
        copyButtons.forEach(button => {
            button.addEventListener('click', this.handleCodeCopy.bind(this));
        });
    }

    /**
     * Handle code copy button click
     */
    async handleCodeCopy(event) {
        const button = event.currentTarget;
        const codeId = button.getAttribute('data-code-id');
        const codeElement = document.getElementById(codeId);
        
        if (!codeElement) {
            this.logger.error('Code element not found for copy operation');
            return;
        }

        const code = codeElement.textContent;
        const originalContent = button.innerHTML;

        try {
            // Update button state
            button.disabled = true;
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
            `;
            button.setAttribute('aria-label', 'Code copied to clipboard');

            // Copy to clipboard
            if (this.clipboardSupported) {
                await navigator.clipboard.writeText(code);
            } else {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(code);
            }

            this.logger.debug('Code copied to clipboard successfully');

            // Announce to screen readers
            this.announceToScreenReader('Code copied to clipboard');

            // Reset button after delay
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = originalContent;
                button.setAttribute('aria-label', 'Copy code to clipboard');
            }, 2000);

        } catch (error) {
            this.logger.error('Failed to copy code to clipboard:', error);
            
            // Reset button on error
            button.disabled = false;
            button.innerHTML = originalContent;
            button.setAttribute('aria-label', 'Copy code to clipboard');
            
            // Show error feedback
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Failed
            `;
            
            setTimeout(() => {
                button.innerHTML = originalContent;
            }, 2000);
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
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'gary-ai-sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Sanitize HTML content
     */
    sanitizeHtml(html) {
        // Basic HTML sanitization - remove script tags and dangerous attributes
        const div = document.createElement('div');
        div.innerHTML = html;
        
        // Remove script tags
        const scripts = div.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Remove dangerous attributes
        const allElements = div.querySelectorAll('*');
        allElements.forEach(element => {
            const dangerousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'];
            dangerousAttrs.forEach(attr => {
                if (element.hasAttribute(attr)) {
                    element.removeAttribute(attr);
                }
            });
        });
        
        return div.innerHTML;
    }

    /**
     * Process message content with markdown rendering
     */
    processMessage(content, options = {}) {
        if (!content) {
            return '';
        }

        // Render markdown
        let html = this.render(content);
        
        // Sanitize if requested
        if (options.sanitize !== false) {
            html = this.sanitizeHtml(html);
        }
        
        return html;
    }
}
