# Gary AI Chatbot Widget Design System

**Project**: Gary AI Contextual API WordPress Widget  
**Phase**: UI Design System Implementation  
**Updated**: July 24, 2025  

---

## 1. Design System Overview

This design system provides a comprehensive visual foundation for the Gary AI chatbot widget, featuring a modern teal-based color palette with professional styling and accessibility-first approach.

---

## 2. Design Profile Configuration

```json
{
  "canvas": {
    "padding": 32,
    "backgroundGradient": {
      "type": "linear",
      "angle": "135deg",
      "stops": [
        { "color": "#199ca0", "position": "0%" },
        { "color": "#4fd1cc", "position": "100%" }
      ]
    }
  },
  "colors": {
    "main": "#199ca0",
    "secondary": {
      "accentLight": "#4fd1cc",
      "accentDark": "#126a6c",
      "complement": "#a01919",
      "analogous1": "#19a096",
      "analogous2": "#19c09c"
    },
    "white": "#ffffff",
    "text": "#1f2937",
    "textMuted": "rgba(31,41,55,0.6)",
    "border": "rgba(31,41,55,0.1)"
  },
  "spacing": {
    "baseUnit": 8,
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32,
    "betweenChats": 24
  },
  "grid": {
    "columns": 12,
    "gutter": 24,
    "maxWidth": 1280
  },
  "cards": {
    "background": "var(--color-white)",
    "borderRadius": 12,
    "shadow": "0 8px 24px rgba(0,0,0,0.08)",
    "padding": 16
  },
  "chat": {
    "containerGap": 16,
    "avatar": {
      "size": 48,
      "shape": "circle",
      "backgroundGradient": {
        "type": "radial",
        "stops": [
          { "color": "#199ca0", "position": "0%" },
          { "color": "#4fd1cc", "position": "100%" }
        ]
      }
    },
    "bubble": {
      "borderRadius": 24,
      "paddingVertical": 8,
      "paddingHorizontal": 16,
      "assistant": {
        "background": "var(--color-white)",
        "color": "var(--color-text)",
        "border": "1px solid var(--color-border)"
      },
      "user": {
        "background": "var(--color-main)",
        "color": "var(--color-white)"
      }
    }
  },
  "input": {
    "card": {
      "background": "var(--color-white)",
      "borderRadius": 12,
      "shadow": "0 8px 24px rgba(0,0,0,0.08)",
      "padding": 16,
      "label": {
        "fontWeight": 500,
        "marginBottom": 8,
        "color": "var(--color-text)"
      }
    },
    "field": {
      "height": 40,
      "border": "1px solid var(--color-border)",
      "borderRadius": 8,
      "padding": "8px 16px",
      "fontSize": 15,
      "fontWeight": 400
    }
  },
  "typography": {
    "fonts": {
      "sans": ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      "mono": ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
    },
    "weights": {
      "regular": 400,
      "medium": 500,
      "semiBold": 600
    },
    "tracking": {
      "tight": "-0.005em",
      "wide": "0.12em"
    },
    "sizes": {
      "small": 13,
      "base": 15,
      "large": 17,
      "h1": {
        "size": "clamp(2rem,5vw + 1rem,3rem)",
        "lineHeight": 1.1,
        "weight": 500,
        "tracking": "tight",
        "color": "var(--color-white)"
      }
    }
  },
  "interaction": {
    "hover": {
      "cardShadow": "0 12px 32px rgba(0,0,0,0.12)"
    },
    "focus": {
      "outline": "2px solid rgba(25,156,160,0.4)"
    }
  }
}
```

---

## 3. CSS Variables Implementation

```css
/* Gary AI Design System CSS Variables */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap");

:root {
  /* Colors */
  --color-main: #199ca0;
  --color-accent-light: #4fd1cc;
  --color-accent-dark: #126a6c;
  --color-complement: #a01919;
  --color-analogous-1: #19a096;
  --color-analogous-2: #19c09c;
  --color-white: #ffffff;
  --color-text: #1f2937;
  --color-text-muted: rgba(31, 41, 55, 0.6);
  --color-border: rgba(31, 41, 55, 0.1);

  /* Typography */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semibold: 600;
  --tracking-tight: -0.005em;
  --tracking-wide: 0.12em;
  --font-size-small: 13px;
  --font-size-base: 15px;
  --font-size-large: 17px;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-chat-gap: 24px;

  /* Layout */
  --border-radius: 12px;
  --border-radius-bubble: 24px;
  --border-radius-input: 8px;
  --card-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  --card-shadow-hover: 0 12px 32px rgba(0, 0, 0, 0.12);
  --focus-outline: 2px solid rgba(25, 156, 160, 0.4);

  /* Canvas */
  --canvas-padding: 32px;
  --canvas-gradient: linear-gradient(135deg, #199ca0 0%, #4fd1cc 100%);

  /* Avatar */
  --avatar-size: 48px;
  --avatar-gradient: radial-gradient(circle, #199ca0 0%, #4fd1cc 100%);

  /* Input */
  --input-height: 40px;
  --input-padding: 8px 16px;
}
```

---

## 4. Component Specifications

### Chat Widget Container
- **Background**: Canvas gradient (135deg, #199ca0 to #4fd1cc)
- **Padding**: 32px
- **Border Radius**: 12px
- **Shadow**: 0 8px 24px rgba(0,0,0,0.08)
- **Max Width**: 1280px (grid system)

### Chat Button (Floating)
- **Background**: Main color (#199ca0)
- **Size**: 48px (avatar size)
- **Border Radius**: Circle
- **Shadow**: Card shadow with hover enhancement
- **Position**: Fixed bottom-right

### Chat Header
- **Typography**: H1 style with clamp sizing
- **Color**: White text on gradient background
- **Font Weight**: Medium (500)
- **Letter Spacing**: Tight (-0.005em)

### Message Bubbles
- **Border Radius**: 24px
- **Padding**: 8px vertical, 16px horizontal
- **Gap Between Messages**: 24px
- **User Bubble**: Main color background (#199ca0), white text
- **Assistant Bubble**: White background, text color (#1f2937), border

### Avatar
- **Size**: 48px circle
- **Background**: Radial gradient (#199ca0 to #4fd1cc)
- **Position**: Left-aligned for assistant messages

### Input Area
- **Background**: White card with shadow
- **Border Radius**: 12px
- **Padding**: 16px
- **Input Height**: 40px
- **Input Border**: 1px solid border color
- **Input Border Radius**: 8px
- **Input Padding**: 8px 16px
- **Font Size**: 15px (base)

### Typography Scale
- **Small Text**: 13px (labels, metadata)
- **Base Text**: 15px (body, input)
- **Large Text**: 17px (emphasis)
- **H1**: Responsive clamp(2rem, 5vw + 1rem, 3rem)

---

## 5. Accessibility & Interaction States

### Focus States
- **Outline**: 2px solid rgba(25,156,160,0.4)
- **Applied to**: All interactive elements

### Hover States
- **Cards**: Enhanced shadow (0 12px 32px rgba(0,0,0,0.12))
- **Buttons**: Slight opacity or color shift

### Color Contrast
- **Text on White**: #1f2937 (meets WCAG AA)
- **White on Main**: #ffffff on #199ca0 (meets WCAG AA)
- **Muted Text**: rgba(31,41,55,0.6) for secondary information

### ARIA Implementation
- **Widget Container**: role="dialog" aria-labelledby="chat-header"
- **Message List**: role="log" aria-live="polite"
- **Input**: aria-label="Type your question"
- **Avatar**: aria-hidden="true" (decorative)

---

## 6. Responsive Behavior

### Desktop (≥768px)
- **Widget Width**: Fixed 360px
- **Position**: Bottom-right corner
- **Canvas Padding**: Full 32px

### Mobile (<768px)
- **Widget Width**: 100% viewport width
- **Position**: Full-screen overlay
- **Canvas Padding**: Reduced to 16px
- **Typography**: Maintains responsive clamp scaling
        
    

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
