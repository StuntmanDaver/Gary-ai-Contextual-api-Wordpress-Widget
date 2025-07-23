/**
 * MarkdownRenderer Unit Tests
 * 
 * Comprehensive tests for the MarkdownRenderer utility class.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

import { MarkdownRenderer } from '../../src/utils/MarkdownRenderer.js';

describe('MarkdownRenderer', () => {
  let renderer;
  let mockLogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    renderer = new MarkdownRenderer({
      logger: mockLogger,
      enableCodeCopy: true,
      enableSyntaxHighlighting: true
    });
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      const defaultRenderer = new MarkdownRenderer();
      expect(defaultRenderer.options.enableCodeCopy).toBe(true);
      expect(defaultRenderer.options.enableSyntaxHighlighting).toBe(true);
      expect(defaultRenderer.options.maxCodeBlockLength).toBe(10000);
    });

    test('should initialize with custom options', () => {
      const customRenderer = new MarkdownRenderer({
        enableCodeCopy: false,
        maxCodeBlockLength: 5000,
        logger: mockLogger
      });
      
      expect(customRenderer.options.enableCodeCopy).toBe(false);
      expect(customRenderer.options.maxCodeBlockLength).toBe(5000);
      expect(customRenderer.logger).toBe(mockLogger);
    });

    test('should detect clipboard support', () => {
      expect(renderer.clipboardSupported).toBe(true);
    });
  });

  describe('Basic Markdown Rendering', () => {
    test('should render headers', () => {
      const markdown = '# Header 1\n## Header 2\n### Header 3';
      const html = renderer.render(markdown);
      
      expect(html).toContain('<h1 id="header-1" class="gary-ai-header gary-ai-h1">Header 1</h1>');
      expect(html).toContain('<h2 id="header-2" class="gary-ai-header gary-ai-h2">Header 2</h2>');
      expect(html).toContain('<h3 id="header-3" class="gary-ai-header gary-ai-h3">Header 3</h3>');
    });

    test('should render bold text', () => {
      const markdown = '**bold text** and __also bold__';
      const html = renderer.render(markdown);
      
      expect(html).toContain('<strong class="gary-ai-bold">bold text</strong>');
      expect(html).toContain('<strong class="gary-ai-bold">also bold</strong>');
    });

    test('should render italic text', () => {
      const markdown = '*italic text* and _also italic_';
      const html = renderer.render(markdown);
      
      expect(html).toContain('<em class="gary-ai-italic">italic text</em>');
      expect(html).toContain('<em class="gary-ai-italic">also italic</em>');
    });

    test('should render inline code', () => {
      const markdown = 'Here is `inline code` in text';
      const html = renderer.render(markdown);
      
      expect(html).toContain('<code class="gary-ai-inline-code">inline code</code>');
    });

    test('should render links', () => {
      const markdown = '[Link text](https://example.com) and auto link https://auto.com';
      const html = renderer.render(markdown);
      
      expect(html).toContain('<a href="https://example.com" class="gary-ai-link" target="_blank" rel="noopener noreferrer">Link text</a>');
      expect(html).toContain('<a href="https://auto.com" class="gary-ai-link" target="_blank" rel="noopener noreferrer">https://auto.com</a>');
    });

    test('should render unordered lists', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const html = renderer.render(markdown);
      
      expect(html).toContain('<ul class="gary-ai-list gary-ai-unordered-list">');
      expect(html).toContain('<li class="gary-ai-list-item">Item 1</li>');
      expect(html).toContain('<li class="gary-ai-list-item">Item 2</li>');
    });

    test('should render ordered lists', () => {
      const markdown = '1. First item\n2. Second item\n3. Third item';
      const html = renderer.render(markdown);
      
      expect(html).toContain('<ol class="gary-ai-list gary-ai-ordered-list">');
      expect(html).toContain('<li class="gary-ai-list-item">First item</li>');
      expect(html).toContain('<li class="gary-ai-list-item">Second item</li>');
    });

    test('should render blockquotes', () => {
      const markdown = '> This is a blockquote\n> with multiple lines';
      const html = renderer.render(markdown);
      
      expect(html).toContain('<blockquote class="gary-ai-blockquote">This is a blockquote</blockquote>');
      expect(html).toContain('<blockquote class="gary-ai-blockquote">with multiple lines</blockquote>');
    });
  });

  describe('Code Block Rendering', () => {
    test('should render code blocks without language', () => {
      const markdown = '```\nconst x = 1;\nconsole.log(x);\n```';
      const html = renderer.render(markdown);
      
      expect(html).toContain('<div class="gary-ai-code-block"');
      expect(html).toContain('<span class="gary-ai-code-language">code</span>');
      expect(html).toContain('const x = 1;');
      expect(html).toContain('console.log(x);');
    });

    test('should render code blocks with language', () => {
      const markdown = '```javascript\nfunction hello() {\n  return "world";\n}\n```';
      const html = renderer.render(markdown);
      
      expect(html).toContain('<span class="gary-ai-code-language">javascript</span>');
      expect(html).toContain('class="language-javascript"');
      expect(html).toContain('function hello()');
    });

    test('should include copy button when enabled', () => {
      const markdown = '```\ncode to copy\n```';
      const html = renderer.render(markdown);
      
      expect(html).toContain('class="gary-ai-code-copy"');
      expect(html).toContain('aria-label="Copy code to clipboard"');
      expect(html).toContain('Copy');
    });

    test('should not include copy button when disabled', () => {
      const disabledRenderer = new MarkdownRenderer({ enableCodeCopy: false });
      const markdown = '```\ncode without copy\n```';
      const html = disabledRenderer.render(markdown);
      
      expect(html).not.toContain('class="gary-ai-code-copy"');
    });

    test('should truncate long code blocks', () => {
      const longCode = 'a'.repeat(15000);
      const markdown = `\`\`\`\n${longCode}\n\`\`\``;
      const html = renderer.render(markdown);
      
      expect(html).toContain('(truncated)');
      expect(html.length).toBeLessThan(longCode.length);
    });

    test('should escape HTML in code blocks', () => {
      const markdown = '```\n<script>alert("xss")</script>\n```';
      const html = renderer.render(markdown);
      
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;/script&gt;');
      expect(html).not.toContain('<script>');
    });
  });

  describe('HTML Escaping and Sanitization', () => {
    test('should escape HTML characters', () => {
      const text = '<script>alert("test")</script>';
      const escaped = renderer.escapeHtml(text);
      
      expect(escaped).toBe('&lt;script&gt;alert("test")&lt;/script&gt;');
    });

    test('should sanitize HTML content', () => {
      const html = '<div onclick="alert()">Safe content</div><script>bad()</script>';
      const sanitized = renderer.sanitizeHtml(html);
      
      expect(sanitized).toContain('<div>Safe content</div>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onclick');
    });

    test('should handle malformed HTML gracefully', () => {
      const malformed = '<div><p>Unclosed tags';
      const result = renderer.sanitizeHtml(malformed);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Copy Functionality', () => {
    let container;
    let mockButton;
    let mockCodeElement;

    beforeEach(() => {
      container = document.createElement('div');
      mockButton = document.createElement('button');
      mockCodeElement = document.createElement('code');
      
      mockButton.className = 'gary-ai-code-copy';
      mockButton.setAttribute('data-code-id', 'test-code-123');
      mockCodeElement.id = 'test-code-123';
      mockCodeElement.textContent = 'console.log("test");';
      
      container.appendChild(mockButton);
      container.appendChild(mockCodeElement);
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    test('should setup copy handlers', () => {
      const addEventListenerSpy = jest.spyOn(mockButton, 'addEventListener');
      
      renderer.setupCopyHandlers(container);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should copy code to clipboard', async () => {
      renderer.setupCopyHandlers(container);
      
      // Simulate button click
      const clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'currentTarget', { value: mockButton });
      
      await renderer.handleCodeCopy(clickEvent);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('console.log("test");');
    });

    test('should update button state after copy', async () => {
      renderer.setupCopyHandlers(container);
      
      const clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'currentTarget', { value: mockButton });
      
      await renderer.handleCodeCopy(clickEvent);
      
      expect(mockButton.disabled).toBe(true);
      expect(mockButton.innerHTML).toContain('Copied!');
      expect(mockButton.getAttribute('aria-label')).toBe('Code copied to clipboard');
    });

    test('should handle copy failure gracefully', async () => {
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Copy failed'));
      
      renderer.setupCopyHandlers(container);
      
      const clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'currentTarget', { value: mockButton });
      
      await renderer.handleCodeCopy(clickEvent);
      
      expect(mockButton.innerHTML).toContain('Failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to copy code to clipboard:',
        expect.any(Error)
      );
    });

    test('should use fallback copy method when clipboard API unavailable', async () => {
      // Temporarily disable clipboard API
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', { value: undefined });
      
      const fallbackSpy = jest.spyOn(renderer, 'fallbackCopyToClipboard');
      renderer.clipboardSupported = false;
      
      renderer.setupCopyHandlers(container);
      
      const clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'currentTarget', { value: mockButton });
      
      await renderer.handleCodeCopy(clickEvent);
      
      expect(fallbackSpy).toHaveBeenCalledWith('console.log("test");');
      
      // Restore clipboard API
      Object.defineProperty(navigator, 'clipboard', { value: originalClipboard });
    });
  });

  describe('Message Processing', () => {
    test('should process message with markdown', () => {
      const content = '# Hello\n\nThis is **bold** text with `code`.';
      const result = renderer.processMessage(content);
      
      expect(result).toContain('<h1');
      expect(result).toContain('<strong class="gary-ai-bold">bold</strong>');
      expect(result).toContain('<code class="gary-ai-inline-code">code</code>');
    });

    test('should sanitize message content by default', () => {
      const content = '<script>alert("xss")</script>**Bold text**';
      const result = renderer.processMessage(content);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('<strong class="gary-ai-bold">Bold text</strong>');
    });

    test('should skip sanitization when requested', () => {
      const content = '<div>**Bold**</div>';
      const result = renderer.processMessage(content, { sanitize: false });
      
      expect(result).toContain('<div>');
      expect(result).toContain('<strong class="gary-ai-bold">Bold</strong>');
    });

    test('should handle empty or invalid content', () => {
      expect(renderer.processMessage('')).toBe('');
      expect(renderer.processMessage(null)).toBe('');
      expect(renderer.processMessage(undefined)).toBe('');
    });
  });

  describe('Accessibility Features', () => {
    test('should announce to screen readers', () => {
      const message = 'Code copied successfully';
      renderer.announceToScreenReader(message);
      
      const announcement = document.querySelector('.gary-ai-sr-only');
      expect(announcement).toBeTruthy();
      expect(announcement.textContent).toBe(message);
      expect(announcement.getAttribute('aria-live')).toBe('polite');
    });

    test('should clean up screen reader announcements', (done) => {
      const message = 'Test announcement';
      renderer.announceToScreenReader(message);
      
      const announcement = document.querySelector('.gary-ai-sr-only');
      expect(announcement).toBeTruthy();
      
      // Check that it's removed after timeout
      setTimeout(() => {
        const removedAnnouncement = document.querySelector('.gary-ai-sr-only');
        expect(removedAnnouncement).toBeFalsy();
        done();
      }, 1100);
    });
  });

  describe('Error Handling', () => {
    test('should handle rendering errors gracefully', () => {
      // Mock a rendering error
      const originalRender = renderer.renderCodeBlocks;
      renderer.renderCodeBlocks = jest.fn().mockImplementation(() => {
        throw new Error('Rendering failed');
      });
      
      const result = renderer.render('```\ntest code\n```');
      
      expect(mockLogger.error).toHaveBeenCalledWith('Markdown rendering failed:', expect.any(Error));
      expect(result).toBe('```\ntest code\n```'); // Should return escaped original
      
      // Restore original method
      renderer.renderCodeBlocks = originalRender;
    });

    test('should handle missing code element in copy operation', async () => {
      const mockButton = document.createElement('button');
      mockButton.setAttribute('data-code-id', 'non-existent-code');
      
      const clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'currentTarget', { value: mockButton });
      
      await renderer.handleCodeCopy(clickEvent);
      
      expect(mockLogger.error).toHaveBeenCalledWith('Code element not found for copy operation');
    });
  });

  describe('Performance and Limits', () => {
    test('should respect maximum code block length', () => {
      const shortRenderer = new MarkdownRenderer({ maxCodeBlockLength: 10 });
      const longCode = 'a'.repeat(20);
      const markdown = `\`\`\`\n${longCode}\n\`\`\``;
      
      const result = shortRenderer.render(markdown);
      
      expect(result).toContain('(truncated)');
      expect(result).not.toContain('a'.repeat(15));
    });

    test('should handle large markdown documents', () => {
      const largeMarkdown = '# Header\n\n' + 'Text paragraph. '.repeat(1000);
      
      const startTime = Date.now();
      const result = renderer.render(largeMarkdown);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
