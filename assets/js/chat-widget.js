// Basic Chat Widget bootstrap (placeholder)
(function () {
  const BUTTON_CLASS = 'ctx-chat-button';
  const WIDGET_CLASS = 'ctx-chat-widget';

  // Ensure only one instance.
  if (document.querySelector('.' + BUTTON_CLASS)) return;

  // Create floating button
  const btn = document.createElement('div');
  btn.className = BUTTON_CLASS;
  btn.innerHTML = '<svg width="24" height="24" fill="#fff" viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-9 9c0 4 2.64 7.38 6.32 8.47L9 22l3-2 3 2-.32-1.53A9 9 0 0 0 21 12a9 9 0 0 0-9-9z"/></svg>';
  document.body.appendChild(btn);

  // Create widget shell
  const widget = document.createElement('div');
  widget.className = WIDGET_CLASS;
  widget.innerHTML = `\n    <div class="ctx-chat-header">\n      <span>Gary AI</span>\n      <button aria-label="Close" style="background:none;border:none;color:#fff;font-size:1.25rem;">&times;</button>\n    </div>\n    <div class="ctx-chat-messages" role="log" aria-live="polite"></div>\n    <form class="ctx-chat-input">\n      <input type="text" placeholder="Type your question" aria-label="Type your question" required />\n      <button type="submit">Send</button>\n    </form>`;
  document.body.appendChild(widget);

  const closeBtn = widget.querySelector('button[aria-label="Close"]');
  const form = widget.querySelector('form');
  const input = widget.querySelector('input');
  const messages = widget.querySelector('.ctx-chat-messages');

  const toggleWidget = () => {
    widget.style.display = widget.style.display === 'flex' ? 'none' : 'flex';
    if (widget.style.display === 'flex') {
      input.focus();
    }
  };

  btn.addEventListener('click', toggleWidget);
  closeBtn.addEventListener('click', toggleWidget);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.textContent = text;
    userMsg.style.textAlign = 'right';
    messages.appendChild(userMsg);
    input.value = '';

    // TODO: Replace with real AJAX call to WordPress REST → Contextual AI.
    const botMsg = document.createElement('div');
    botMsg.textContent = '...thinking';
    messages.appendChild(botMsg);
  });
})();
