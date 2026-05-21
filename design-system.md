# Eden Design System Specification

Welcome to the **Eden Design System**. This document defines the core branding, color palettes, typographic scales, glassmorphism specs, and UI component standards for the **Eden App** ecosystem. 

If you are building an extension app—such as **Eden Community**—use this specification to ensure absolute visual harmony, premium aesthetic styling, and brand consistency.

---

## 1. Brand Concept & Theme

Eden is inspired by the "Garden of Eden" — a symbol of growth, creative beauty, structured learning, and harmony. 

### Visual Tone
- **Minimalist SaaS Grid Layouts**: Spacious margins, high-contrast text, clear visual hierarchy.
- **Glassmorphism**: Soft glass surfaces with frosted blurs and subtle borders that interact beautifully with light/dark layers.
- **Micro-Animations**: Ultra-smooth hover transitions and gentle click scales to make pages feel alive.

---

## 2. Color System

Our color system is built to convey growth (Deep Green), creativity (Emerald Accent), and premium excellence (Soft Gold) across light and dark modes.

| Color Role | Color Name | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Brand Core** | Deep Forest Green | `#14532D` | Primary branding, solid backgrounds, major headers, solid buttons. |
| **Accent Primary** | Emerald Accent | `#10B981` | Interactive elements, active links, success highlights, click CTAs. |
| **Accent Gold** | Soft Gold | `#F59E0B` | Premium accounts, certifications, highlights, warning alerts. |
| **Light Backdrop** | Light Background | `#F8FAF7` | Anti-glare, organic off-white background in light mode. |
| **Light Card Layer**| Light Surface | `#FFFFFF` | Solid white cards, panels, and tables. |
| **Dark Backdrop** | Dark Background | `#07130D` | Rich, deeply dark green-black formula for dark mode backdrop. |
| **Dark Card Layer** | Dark Surface | `#0C1E15` | Elevated forest slate cards, inputs, and sidebars. |
| **Light Text Core** | Light Text Primary | `#111827` | High contrast charcoal text for light mode body & titles. |
| **Dark Text Core** | Dark Text Primary | `#F8FAF7` | Off-white text for dark mode body & titles. |
| **Secondary Gray** | Text Secondary | `#6B7280` | Muted subtitle paragraphs, captions, and placeholders. |

---

## 3. Global CSS Custom Properties

Include these variables in your global stylesheet (e.g. `globals.css`) to use standard CSS tokens:

```css
:root {
  /* Brand Constants */
  --eden-forest-green: #14532D;
  --eden-emerald: #10B981;
  --eden-gold: #F59E0B;
  --eden-error: #EF4444;
  --eden-success: #10B981;
  --eden-warning: #F59E0B;
  --eden-info: #3B82F6;

  /* Theme Defaults (Light Mode) */
  --eden-background: #F8FAF7;
  --eden-surface: #FFFFFF;
  --eden-border: #E2E8F0;
  --eden-text-primary: #111827;
  --eden-text-secondary: #6B7280;
  --eden-glass-bg: rgba(20, 83, 45, 0.03);
  --eden-glass-border: rgba(20, 83, 45, 0.08);
  --eden-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  --eden-glow-green: 0 0 20px rgba(16, 185, 129, 0.1);
}

.dark {
  /* Theme Overrides (Dark Mode) */
  --eden-background: #07130D;
  --eden-surface: #0C1E15;
  --eden-border: rgba(16, 185, 129, 0.15);
  --eden-text-primary: #F8FAF7;
  --eden-text-secondary: #94A3B8;
  --eden-glass-bg: rgba(255, 255, 255, 0.06);
  --eden-glass-border: rgba(255, 255, 255, 0.08);
  --eden-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  --eden-glow-green: 0 0 20px rgba(16, 185, 129, 0.2);
}

/* Premium Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--eden-border);
  border-radius: 9999px;
  transition: background 0.2s ease;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--eden-emerald);
}
```

---

## 4. Tailwind Theme Preset

To configure Tailwind CSS for your extension project (e.g. `tailwind.config.ts`), merge these extensions to access brand-compliant utility classes:

```typescript
export const edenTailwindTheme = {
  theme: {
    extend: {
      colors: {
        eden: {
          "green-deep": "#14532D",
          "emerald": "#10B981",
          "gold": "#F59E0B",
          
          "bg-light": "#F8FAF7",
          "surface-light": "#FFFFFF",
          "border-light": "#E2E8F0",
          "text-light-primary": "#111827",
          "text-light-secondary": "#6B7280",
          "glass-light": "rgba(20, 83, 45, 0.03)",
          
          "bg-dark": "#07130D",
          "surface-dark": "#0C1E15",
          "border-dark": "rgba(16, 185, 129, 0.15)",
          "text-dark-primary": "#F8FAF7",
          "text-dark-secondary": "#94A3B8",
          "glass-dark": "rgba(255, 255, 255, 0.06)",
        }
      },
      borderRadius: {
        "eden-sm": "0.375rem",  // 6px
        "eden-md": "0.5rem",    // 8px
        "eden-lg": "0.75rem",   // 12px
        "eden-xl": "1rem",      // 16px
        "eden-xxl": "1.5rem",   // 24px
      },
      boxShadow: {
        "eden-subtle": "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        "eden-premium": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "eden-glow-green": "0 0 20px rgba(16, 185, 129, 0.15)",
        "eden-glow-gold": "0 0 20px rgba(245, 158, 11, 0.15)",
      },
      fontFamily: {
        eden: ["Inter", "sans-serif"],
      },
      animation: {
        "eden-fade-up": "edenFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "eden-fade-in": "edenFadeIn 0.8s ease-out forwards",
        "eden-pulse-glow": "edenPulseGlow 3s ease-in-out infinite",
      },
      keyframes: {
        edenFadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        edenFadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        edenPulseGlow: {
          "0%, 100%": { opacity: "0.4", filter: "brightness(1)" },
          "50%": { opacity: "0.8", filter: "brightness(1.2)" },
        }
      },
      backdropBlur: {
        "eden-glass": "16px",
      }
    }
  }
};
```

---

## 5. Typography Specs

Always use the **Inter** font family, structured using the size hierarchy below:

```text
h1 (Page Title)       --> Size: 30px (1.875rem)  | Weight: Bold (700)     | tracking-tight
h2 (Section Header)   --> Size: 24px (1.5rem)     | Weight: Semibold (600) | tracking-tight
h3 (Card Title)       --> Size: 18px (1.125rem)   | Weight: Medium (500)   | tracking-tight
body (Main Content)   --> Size: 14px (0.875rem)   | Weight: Regular (400)  | leading-relaxed
caption (Metadata)    --> Size: 12px (0.75rem)    | Weight: Regular (400)  | text-gray-400
```

---

## 6. Composed CSS UI Component Library

To enforce absolute aesthetic consistency in your frontend, use these pre-composed Tailwind utility class combinations:

### A. Buttons System
- **Base styles for all buttons**:
  `inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 select-none`
- **Variants**:
  - **Primary**: `bg-eden-green-deep hover:bg-green-800 text-white shadow-md shadow-green-900/10 focus:ring-eden-green-deep dark:bg-eden-emerald dark:hover:bg-emerald-600 dark:shadow-emerald-950/20`
  - **Accent**: `bg-eden-emerald hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 focus:ring-eden-emerald`
  - **Gold**: `bg-eden-gold hover:bg-amber-600 text-white shadow-md shadow-amber-500/10 focus:ring-eden-gold`
  - **Glass Panel**: `bg-white/10 dark:bg-[#0c1e15]/40 backdrop-blur-md border border-eden-border-light dark:border-eden-border-dark text-eden-text-light-primary dark:text-eden-text-dark-primary hover:bg-white/20 dark:hover:bg-[#0c1e15]/80 hover:border-eden-emerald focus:ring-eden-emerald`
  - **Outline**: `border-2 border-eden-green-deep text-eden-green-deep hover:bg-eden-green-deep hover:text-white dark:border-eden-emerald dark:text-eden-emerald dark:hover:bg-eden-emerald dark:hover:text-white focus:ring-eden-emerald`
- **Sizes**:
  - **Small (sm)**: `px-3 py-1.5 text-xs`
  - **Medium (md)**: `px-5 py-2.5 text-sm`
  - **Large (lg)**: `px-7 py-3 text-base`

### B. Form Inputs
- **Base text field**:
  `w-full bg-white dark:bg-eden-surface-dark border border-eden-border-light dark:border-eden-border-dark rounded-xl px-4 py-3 text-sm text-eden-text-light-primary dark:text-eden-text-dark-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-eden-emerald/50 dark:focus:ring-eden-emerald/50 focus:border-eden-emerald dark:focus:border-eden-emerald transition-all duration-200`
- **Validation Error state**:
  `border-red-500 focus:ring-red-500/30 focus:border-red-500`

### C. Glassmorphism Panels & Cards
- **Frosted Glass Panel**:
  `background: var(--eden-glass-bg); backdrop-filter: blur(16px) saturate(120%); -webkit-backdrop-filter: blur(16px) saturate(120%); border: 1px solid var(--eden-glass-border); box-shadow: var(--eden-shadow); border-radius: 1rem; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);`
- **Interactive Frosted Card (with Hover Glow)**:
  `hover:border-eden-emerald hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-0.5 hover:scale-[1.01] cursor-pointer`

### D. Badges & Indicators
- **Base styles for all badges**:
  `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 border`
- **Status Variants**:
  - **Success / Active**: `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20`
  - **Gold / Premium**: `bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20`
  - **Error / Danger**: `bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20`
  - **Info / Announcement**: `bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20`
  - **Neutral / Draft**: `bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20`

---

## 7. Developer Integration Steps for Extensions

When starting your extension app (e.g. **Eden Community**):

1. **Setup Theme Custom CSS Variables**:
   Copy the CSS rules from **Section 3** directly into your main stylesheet (e.g., `globals.css` or `styles/main.css`).
2. **Setup Tailwind Configurations**:
   Import or copy the configuration extensions from **Section 4** and spread them inside the `theme.extend` property of your new project's `tailwind.config.ts`.
3. **Ensure Theme Providers are Aligned**:
   Map your application's light/dark selectors to add or remove the `.dark` class to the container `<html>` element, which binds perfectly with the CSS Variables mapping.
4. **Use Composed Component Classes**:
   Construct buttons, inputs, glass layouts, and status badges in your React components using the specific CSS utility strings provided in **Section 6** to guarantee identical visual presentation.
