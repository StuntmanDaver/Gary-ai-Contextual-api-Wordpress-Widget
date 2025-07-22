# UI Development Plan

**Project**: Contextual FAQ Chatbot for WordPress  
**Phase**: Front-end / Widget Styling & Integration  
**Lead**: Front-end Engineer  
**Date**: 19 Jul 2025  

---

## 1. Overview  
We'll build and style the chat widget using the provided CSS variables and font imports. The goal is a clean, accessible chat UI that matches our brand, is responsive across viewports, and plugs seamlessly into WordPress via a header-injected script or shortcode.

---

## 2. CSS Foundation  
```css
/* --------------  font faces -------------- */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap");

:root {
  /* font families */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
               Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  /* font weights */
  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semibold: 600;

  /* letter spacing */
  --tracking-tight: -0.005em;
  --tracking-wide: 0.12em;
}

/* Display styles */
h1 {
  font: var(--fw-medium) clamp(2.75rem,5vw + 1rem,4.5rem)/1.08 var(--font-sans);
  letter-spacing: var(--tracking-tight);
}
h2 {
  font: var(--fw-medium) clamp(2.125rem,3vw + 0.5rem,3rem)/1.15 var(--font-sans);
  letter-spacing: var(--tracking-tight);
}

/* Body copy */
body, p, li {
  font: var(--fw-regular) 1rem/1.6 var(--font-sans);
}

/* Upper-nav / small labels */
.nav-label {
  font: var(--fw-semibold) 0.75rem/1.3 var(--font-sans);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

/* Monospace snippets */
code, pre, .metric {
  font: var(--fw-regular) 0.9375rem/1.5 var(--font-mono);
}
```

---

## **3. Component Breakdown**

|**Component**|**Description**|**CSS Hooks / Classes**|
|---|---|---|
|**Chat Button**|Floating action button—opens widget|.chat-button|
|**Chat Header**|Title bar with close icon and branding|h2, .nav-label, .close-btn|
|**Message List**|Scrollable container for user & bot messages|.messages, .message|
|**User Bubble**|Right-aligned text bubble for user inputs|.message.user|
|**Bot Bubble**|Left-aligned bubble; includes citations tooltip|.message.bot, .citation|
|**Input Area**|Text input, send button, styling|.input-area, input, button|
|**Loading Spinner**|Inline spinner while waiting for SSE stream|.spinner (use <pre> fallback)|

---

## **4. Accessibility & Responsiveness**

- **Contrast & Colors**: ensure ≥ 4.5:1 contrast on text.
    
- **Keyboard Nav**: tab order: open button → input → send → citations → close.
    
- **ARIA**:
    
    - Widget container: role="dialog" aria-labelledby="chat-header"
        
    - Input: aria-label="Type your question"
        
    
- **Responsive**:
    
    - Mobile: widget 100% width, full-screen overlay.
        
    - Desktop: fixed 360 px width in bottom-right corner.
        
    

---

## **5. Integration Steps & Timeline**

|**Week**|**Tasks**|**Owner**|
|---|---|---|
|1|- Scaffold React/Vanilla-JS widget <ChatWidget />                  - Embed root container and AMP safe script loader|Front-end Eng|
|2|- Apply font imports & :root variables                              - Style header, bubbles, input using provided CSS|Front-end Eng|
|3|- Implement SSE proxy connection & streaming render loop            - Hook up send button and enter-key handler|Full-stack Eng|
|4|- Build citations tooltip component (hover + click to expand)       - Wire feedback buttons (thumbs up/down)|Front-end Eng|
|5|- Accessibility audit & keyboard navigation                         - Mobile responsive tweaks|QA / UX|
|6|- WordPress snippet: wrap widget in WP REST proxy shortcode        - Final testing on staging across themes|DevOps / QA|
|7|- Documentation: CSS variables, HTML hooks, JS init options        - Handoff to Content Ops & Training|Tech Writer|

---

## **6. Deliverables**

1. **chat-widget.css** – with imported fonts and variable definitions.
    
2. **chat-widget.js** – builds DOM, handles events, streams SSE.
    
3. **WordPress Snippet** – PHP/JS installer (one-line script include).
    
4. **Component Library** – markdown + Storybook examples for: header, bubbles, input, tooltip.
    
5. **Accessibility Report** – WCAG 2.1 AA compliance checklist.
    

---

## **7. Success Criteria**

- Widget loads in < 200 ms (CSS + JS).
    
- All component states covered in Storybook.
    
- Manual audit: 0 critical accessibility violations.
    
- Embed works on three major WP themes (Twenty Twenty, Astra, Divi).
    
- Font fallback works offline (no FOIT/FOUT).
    

---

## **8. Risks & Mitigations**

- **Font loading delays** → use font-display: swap.
    
- **CSS conflicts with theme** → wrap all selectors under a .ctx-chat namespace.
    
- **SSE unsupported** → polyfill with polling fallback.
    
- **Mobile small screens** → test on devices < 320 px width.
    

---

_End of UI Development Plan_
