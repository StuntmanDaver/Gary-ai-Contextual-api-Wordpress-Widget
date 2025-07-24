// Basic Chat Widget bootstrap (placeholder)
(function () {
  const BUTTON_CLASS = 'chatbot-orb';
  const WIDGET_CLASS = 'chatbot-container';

  // Ensure only one instance.
  if (document.querySelector('.' + BUTTON_CLASS)) return;

  // Create floating button
  const btn = document.createElement('div');
  btn.className = BUTTON_CLASS;
  btn.setAttribute('aria-label', 'Open IMI Support Chat');
  document.body.appendChild(btn);

  // Create widget shell
  const widget = document.createElement('div');
  widget.className = WIDGET_CLASS;
  widget.innerHTML = `
    <div class="chatbot-header">IMI Support</div>
    <div class="chat-area" role="log" aria-live="polite"></div>
    <div class="input-area">
      <input type="text" placeholder="Ask a question..." aria-label="Ask a question" />
      <button type="button">Send</button>
    </div>`;
  document.body.appendChild(widget);

  const input = widget.querySelector('input');
  const sendBtn = widget.querySelector('button');
  const messages = widget.querySelector('.chat-area');

  const toggleWidget = () => {
    widget.classList.toggle('open');
    if (widget.classList.contains('open')) {
      input.focus();
    }
  };

  const sendMessage = () => {
    const text = input.value.trim();
    if (!text) return;

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'message user-message';
    userMsg.textContent = text;
    messages.appendChild(userMsg);

    // Show typing indicator
    const typingMsg = document.createElement('div');
    typingMsg.className = 'message bot-message';
    typingMsg.textContent = 'Typing...';
    messages.appendChild(typingMsg);
    messages.scrollTop = messages.scrollHeight;

    input.value = '';

    // Simulate response after delay
    setTimeout(() => {
      messages.removeChild(typingMsg);
      const botMsg = document.createElement('div');
      botMsg.className = 'message bot-message';
      botMsg.textContent = 'This is a simulated response from the AI API.';
      messages.appendChild(botMsg);
      messages.scrollTop = messages.scrollHeight;
    }, 1000);
  };

  // Event listeners
  btn.addEventListener('click', toggleWidget);
  sendBtn.addEventListener('click', sendMessage);
  
  // Enter key support
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Click outside to close
  document.addEventListener('click', (event) => {
    if (!widget.contains(event.target) && !btn.contains(event.target) && widget.classList.contains('open')) {
      widget.classList.remove('open');
    }
  });
})();
