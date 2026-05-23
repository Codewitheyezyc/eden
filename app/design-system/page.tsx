"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  ArrowLeft,
  Code,
  Palette,
  Type,
  Sparkles,
  Layers,
  Terminal,
  Search,
  ExternalLink
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MouseGlow } from "@/components/ui/mouse-glow";
import { AnimatedPattern } from "@/components/ui/animated-pattern";
import {
  edenColors,
  getButtonClass,
  getCardClass,
  getInputClass,
  getBadgeClass,
  getTypographyClass
} from "../../lib/design-system";

export default function DesignSystemPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  const copyToClipboard = (text: string, tokenName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(tokenName);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const colorsShowcase = [
    {
      name: "Deep Forest Green",
      token: "bg-eden-green-deep",
      hex: edenColors.brand.forestGreen,
      type: "Brand Core",
      desc: "Represents growth, harmony, and academic excellence. Used for primary branding, header backgrounds, and prominent solid buttons.",
    },
    {
      name: "Emerald Accent",
      token: "bg-eden-emerald",
      hex: edenColors.brand.emerald,
      type: "Interactive Accent",
      desc: "Represents creativity and energy. Used for active navigation links, secondary focus states, interactive highlights, and success badges.",
    },
    {
      name: "Soft Gold Accent",
      token: "bg-eden-gold",
      hex: edenColors.brand.gold,
      type: "Premium Accent",
      desc: "Represents luxury and fine craftsmanship. Used for premium accounts, certifications, warnings, and highlighting high-tier academy elements.",
    },
    {
      name: "Dark Background",
      token: "bg-eden-bg-dark",
      hex: edenColors.dark.background,
      type: "Dark Theme",
      desc: "A rich, deeply dark green-black formula that ensures stunning contrast and premium depth. Used as the main backdrop in dark mode.",
    },
    {
      name: "Dark Surface",
      token: "bg-eden-surface-dark",
      hex: edenColors.dark.surface,
      type: "Dark Theme",
      desc: "Forest dark slate. Used for cards, form fields, and elevated surface layers in dark mode.",
    },
    {
      name: "Light Background",
      token: "bg-eden-bg-light",
      hex: edenColors.light.background,
      type: "Light Theme",
      desc: "A super soft, crisp off-white with organic green undertones. Calm and anti-glare, used as the main backdrop in light mode.",
    },
    {
      name: "Light Surface",
      token: "bg-eden-surface-light",
      hex: edenColors.light.surface,
      type: "Light Theme",
      desc: "Pure white surface for high-contrast card grids, tables, and dashboards in light mode.",
    },
  ];

  return (
    <div className="relative min-h-screen font-sans overflow-x-hidden selection:bg-eden-emerald selection:text-white">
      {/* Background decorations */}
      <AnimatedPattern />
      <MouseGlow />

      {/* Header Bar */}
      <header className="sticky top-0 z-50 w-full bg-white/60 dark:bg-eden-background/60 backdrop-blur-md border-b border-eden-border-light dark:border-eden-border-dark transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center justify-center p-2 rounded-xl bg-eden-green-deep/5 dark:bg-eden-emerald/10 text-eden-green-deep dark:text-eden-emerald hover:scale-105 active:scale-95 transition-all"
              title="Return Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-eden-green-deep dark:text-white">
                Eden<span className="text-eden-emerald">.</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider bg-eden-emerald/10 text-eden-emerald border border-eden-emerald/20 uppercase shrink-0">
                Design System v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="#integration"
              className={getButtonClass("glass", "sm", "gap-1.5")}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Use in Community</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="mb-16 text-center md:text-left md:flex md:items-center md:justify-between gap-8 pb-12 border-b border-eden-border-light dark:border-eden-border-dark animate-eden-fade-up">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eden-emerald/10 text-eden-emerald text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Modern Brand Ecosystem</span>
            </div>
            <h1 className={getTypographyClass("h1", "mb-4 font-serif text-4xl sm:text-5xl lg:text-6xl")}>
              Eden Brand Design System
            </h1>
            <p className={getTypographyClass("body", "text-lg text-eden-text-light-secondary dark:text-eden-text-dark-secondary")}>
              A beautiful, highly cohesive, and reusable framework for building Loveworld Arts Academy products. Built with minimalist aesthetics, tactile glassmorphism, clean typography, and organic details to guarantee consistency in apps like <strong>Eden Community</strong>.
            </p>
          </div>
          <div className="mt-8 md:mt-0 flex flex-wrap gap-3 justify-center md:justify-end shrink-0">
            <Link href="#colors" className={getButtonClass("primary", "lg")}>Explore Palettes</Link>
            <Link href="#components" className={getButtonClass("glass", "lg")}>Interactive Components</Link>
          </div>
        </section>

        {/* 1. Identity & Colors Matrix */}
        <section id="colors" className="mb-20 scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-eden-green-deep/5 dark:bg-eden-emerald/10 text-eden-green-deep dark:text-eden-emerald">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className={getTypographyClass("h2")}>Branding & Color Spectrum</h2>
              <p className={getTypographyClass("caption")}>Strict identity hues combined with lightweight interfaces.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colorsShowcase.map((color) => (
              <div
                key={color.token}
                className={getCardClass("glass", "flex flex-col overflow-hidden group")}
              >
                {/* Visual Swatch */}
                <div className="relative h-32 w-full flex items-end p-4 overflow-hidden">
                  <div className={`absolute inset-0 transition-transform duration-500 group-hover:scale-105 ${color.token}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  {/* Copy Swatch action */}
                  <button
                    onClick={() => copyToClipboard(color.hex, color.token)}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100"
                    title={`Copy Hex Code: ${color.hex}`}
                  >
                    {copiedToken === color.token ? (
                      <Check className="w-4 h-4 text-eden-emerald" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <div className="relative z-10 text-white">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 uppercase tracking-widest">
                      {color.type}
                    </span>
                    <h3 className="font-semibold mt-1">{color.name}</h3>
                  </div>
                </div>

                {/* Swatch Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <p className={getTypographyClass("caption", "mb-4 leading-relaxed")}>
                    {color.desc}
                  </p>

                  <div className="space-y-2">
                    <div
                      onClick={() => copyToClipboard(color.hex, color.token + "_hex")}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-eden-green-deep/5 dark:bg-white/5 border border-eden-border-light dark:border-eden-border-dark cursor-pointer hover:border-eden-emerald/40 transition-colors"
                    >
                      <span className="font-mono text-gray-500">HEX</span>
                      <span className="font-mono font-semibold flex items-center gap-1.5 text-eden-text-light-primary dark:text-eden-text-dark-primary">
                        {color.hex}
                        {copiedToken === color.token + "_hex" ? <Check className="w-3 h-3 text-eden-emerald" /> : <Copy className="w-3 h-3 text-gray-400" />}
                      </span>
                    </div>

                    <div
                      onClick={() => copyToClipboard(color.token, color.token + "_token")}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-eden-green-deep/5 dark:bg-white/5 border border-eden-border-light dark:border-eden-border-dark cursor-pointer hover:border-eden-emerald/40 transition-colors"
                    >
                      <span className="font-mono text-gray-500">Tailwind</span>
                      <span className="font-mono font-semibold flex items-center gap-1.5 text-eden-emerald">
                        {color.token.replace("bg-", "")}
                        {copiedToken === color.token + "_token" ? <Check className="w-3 h-3 text-eden-emerald" /> : <Copy className="w-3 h-3 text-gray-400" />}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Glassmorphism Arena */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-eden-green-deep/5 dark:bg-eden-emerald/10 text-eden-green-deep dark:text-eden-emerald">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className={getTypographyClass("h2")}>Glassmorphism & Depth</h2>
              <p className={getTypographyClass("caption")}>Organic layouts that blend dynamically with background colors.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={getCardClass("glass", "p-6 flex flex-col justify-between")}>
              <div>
                <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-eden-emerald/10 text-eden-emerald border border-eden-emerald/20 uppercase tracking-widest">
                  Static Panel
                </span>
                <h3 className={getTypographyClass("h3", "mt-3 mb-2")}>Standard Glass Card</h3>
                <p className={getTypographyClass("caption", "leading-relaxed")}>
                  A premium container utilizing backdrop-filters, custom borders, and subtle shadows. Perfect for informational content panels, static dashboards, and details.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-eden-border-light dark:border-eden-border-dark">
                <code className="text-[10px] font-mono text-eden-green-deep dark:text-eden-emerald">
                  className="eden-glass-card"
                </code>
              </div>
            </div>

            <div className={getCardClass("glassInteractive", "p-6 flex flex-col justify-between group")}>
              <div>
                <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-eden-emerald/10 text-eden-emerald border border-eden-emerald/20 uppercase tracking-widest">
                  Interactive Panel
                </span>
                <h3 className={getTypographyClass("h3", "mt-3 mb-2 group-hover:text-eden-emerald transition-colors")}>
                  Interactive Glass Card
                </h3>
                <p className={getTypographyClass("caption", "leading-relaxed")}>
                  Responsive card optimized with micro-interactions. On hover, it shifts upwards slightly, increases border illumination, and projects a premium green glow.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-eden-border-light dark:border-eden-border-dark">
                <code className="text-[10px] font-mono text-eden-green-deep dark:text-eden-emerald">
                  className="eden-glass-card eden-glass-card-hover"
                </code>
              </div>
            </div>

            <div className="relative p-6 rounded-2xl overflow-hidden border border-eden-border-light dark:border-eden-border-dark bg-white dark:bg-eden-surface-dark shadow-eden-subtle flex flex-col justify-between">
              {/* Radial gradient background to represent active states */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-eden-emerald/10 via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10">
                <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-eden-gold/10 text-eden-gold border border-eden-gold/20 uppercase tracking-widest">
                  Special Layer
                </span>
                <h3 className={getTypographyClass("h3", "mt-3 mb-2")}>Radial Glow Surface</h3>
                <p className={getTypographyClass("caption", "leading-relaxed")}>
                  A standard solid layout overlaid with a soft central radial gradient. Designed to draw student focus to onboarding elements, courses, or highlights.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-eden-border-light dark:border-eden-border-dark relative z-10">
                <code className="text-[10px] font-mono text-eden-green-deep dark:text-eden-emerald">
                  from-eden-emerald/10 ...
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Typography specimens */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-eden-green-deep/5 dark:bg-eden-emerald/10 text-eden-green-deep dark:text-eden-emerald">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className={getTypographyClass("h2")}>Typographic Scale</h2>
              <p className={getTypographyClass("caption")}>Elegant font configurations using the standard Inter font family.</p>
            </div>
          </div>

          <div className={getCardClass("glass", "overflow-hidden")}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-eden-border-light dark:border-eden-border-dark bg-eden-green-deep/5 dark:bg-white/5">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Example Token</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Size & Weight</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tailwind Utility class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eden-border-light dark:divide-eden-border-dark">
                  <tr>
                    <td className="p-4">
                      <h1 className={getTypographyClass("h1", "font-serif text-3xl")}>Eden Main Display</h1>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      30px (1.875rem) / Serif / Bold
                    </td>
                    <td className="p-4 font-mono text-xs text-eden-emerald">
                      getTypographyClass("h1")
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4">
                      <h2 className={getTypographyClass("h2")}>Section Heading</h2>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      24px (1.5rem) / Sans / Semibold
                    </td>
                    <td className="p-4 font-mono text-xs text-eden-emerald">
                      getTypographyClass("h2")
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4">
                      <h3 className={getTypographyClass("h3")}>Subsection Title</h3>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      18px (1.125rem) / Sans / Medium
                    </td>
                    <td className="p-4 font-mono text-xs text-eden-emerald">
                      getTypographyClass("h3")
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4">
                      <p className={getTypographyClass("body")}>Body regular paragraph text</p>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      14px (0.875rem) / Sans / Regular
                    </td>
                    <td className="p-4 font-mono text-xs text-eden-emerald">
                      getTypographyClass("body")
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4">
                      <span className={getTypographyClass("caption")}>Small captions & meta descriptors</span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      12px (0.75rem) / Sans / Regular
                    </td>
                    <td className="p-4 font-mono text-xs text-eden-emerald">
                      getTypographyClass("caption")
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. Interactive Components Sandbox */}
        <section id="components" className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-eden-green-deep/5 dark:bg-eden-emerald/10 text-eden-green-deep dark:text-eden-emerald">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className={getTypographyClass("h2")}>UI Components Sandbox</h2>
              <p className={getTypographyClass("caption")}>Test interactive button states, inputs, and indicators.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Buttons & Badges */}
            <div className={getCardClass("glass", "p-6 space-y-8")}>
              <div>
                <h3 className={getTypographyClass("h3", "mb-2")}>Button Variants & Scales</h3>
                <p className={getTypographyClass("caption", "mb-4")}>
                  Buttons use soft custom shapes (rounded-xl) and active scale transitions.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className={getButtonClass("primary", "md")}>Primary</button>
                  <button className={getButtonClass("accent", "md")}>Accent</button>
                  <button className={getButtonClass("gold", "md")}>Gold</button>
                  <button className={getButtonClass("glass", "md")}>Glass Panel</button>
                  <button className={getButtonClass("outline", "md")}>Outline</button>
                  <button className={getButtonClass("ghost", "md")}>Ghost Link</button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                  Sizes Comparison
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  <button className={getButtonClass("accent", "sm")}>Small (sm)</button>
                  <button className={getButtonClass("accent", "md")}>Medium (md)</button>
                  <button className={getButtonClass("accent", "lg")}>Large (lg)</button>
                </div>
              </div>

              <div className="pt-4 border-t border-eden-border-light dark:border-eden-border-dark">
                <h3 className={getTypographyClass("h3", "mb-3")}>Indicators & Badges</h3>
                <div className="flex flex-wrap gap-2.5">
                  <span className={getBadgeClass("success")}>Active</span>
                  <span className={getBadgeClass("gold")}>Premium</span>
                  <span className={getBadgeClass("error")}>Overdue</span>
                  <span className={getBadgeClass("info")}>Updates</span>
                  <span className={getBadgeClass("neutral")}>Draft</span>
                </div>
              </div>
            </div>

            {/* Inputs & Forms */}
            <div className={getCardClass("glass", "p-6 flex flex-col justify-between")}>
              <div className="space-y-6">
                <div>
                  <h3 className={getTypographyClass("h3", "mb-2")}>Form inputs & Validation</h3>
                  <p className={getTypographyClass("caption", "mb-4")}>
                    Designed with standard text colors, custom borders, icon alignment, and smooth focusing glows.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Standard Text Input
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your registered name..."
                      className={getInputClass()}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Input with Left Icon
                    </label>
                    <div className="relative flex items-center w-full">
                      <Search className="absolute left-4 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={searchVal}
                        onChange={(e) => setSearchVal(e.target.value)}
                        placeholder="Search for faculties, courses, or users..."
                        className={getInputClass(false, true)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Validation Error State
                    </label>
                    <input
                      type="email"
                      value="invalid-email-format"
                      readOnly
                      className={getInputClass(true)}
                    />
                    <span className="text-xs text-red-500 mt-1 block">
                      Please specify a valid Loveworld Arts Academy email.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-eden-border-light dark:border-eden-border-dark flex items-center justify-between">
                <span className={getTypographyClass("caption")}>
                  Fully mapped to next-themes support.
                </span>
                <button
                  onClick={() => {
                    setIsSubmitDisabled(true);
                    setTimeout(() => setIsSubmitDisabled(false), 2000);
                  }}
                  disabled={isSubmitDisabled}
                  className={getButtonClass("primary", "md", "gap-1.5")}
                >
                  {isSubmitDisabled ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Developer integration guidelines */}
        <section id="integration" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-eden-green-deep/5 dark:bg-eden-emerald/10 text-eden-green-deep dark:text-eden-emerald">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className={getTypographyClass("h2")}>Developer Integration Guide</h2>
              <p className={getTypographyClass("caption")}>Reusing these tokens, CSS assets, and component builders in your next extension like <strong>Eden Community</strong>.</p>
            </div>
          </div>

          <div className={getCardClass("glass", "p-8 space-y-8")}>
            <div className="space-y-4">
              <h3 className={getTypographyClass("h3", "flex items-center gap-2")}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-eden-emerald/20 text-eden-emerald text-xs font-bold font-mono">1</span>
                Folder Integration
              </h3>
              <p className={getTypographyClass("body")}>
                Copy the complete <code className="text-xs px-1.5 py-0.5 rounded bg-eden-green-deep/5 dark:bg-white/5 text-eden-emerald font-mono">lib/design-system</code> directory from this workspace directly into your new application's root library folder.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className={getTypographyClass("h3", "flex items-center gap-2")}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-eden-emerald/20 text-eden-emerald text-xs font-bold font-mono">2</span>
                Configure your Tailwind Config Preset
              </h3>
              <p className={getTypographyClass("body")}>
                Import the pre-configured theme extensions from the design system and merge them directly in your new application's <code className="text-xs px-1.5 py-0.5 rounded bg-eden-green-deep/5 dark:bg-white/5 text-eden-emerald font-mono">tailwind.config.ts</code>:
              </p>

              <div className="relative">
                <button
                  onClick={() => copyToClipboard(`import { edenTailwindTheme } from "./lib/design-system/tailwind-preset";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      ...edenTailwindTheme,
    }
  }
}`, "tailwind_snippet")}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all"
                  title="Copy Code Snippet"
                >
                  {copiedToken === "tailwind_snippet" ? (
                    <Check className="w-4 h-4 text-eden-emerald" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto border border-gray-800">
                  {`import { edenTailwindTheme } from "./lib/design-system/tailwind-preset";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      ...edenTailwindTheme,
    }
  }
}`}
                </pre>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={getTypographyClass("h3", "flex items-center gap-2")}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-eden-emerald/20 text-eden-emerald text-xs font-bold font-mono">3</span>
                Register global stylesheet
              </h3>
              <p className={getTypographyClass("body")}>
                Ensure the design system's CSS stylesheet is loaded. Simply import it at the top of your global CSS sheet (e.g. <code className="text-xs px-1.5 py-0.5 rounded bg-eden-green-deep/5 dark:bg-white/5 text-eden-emerald font-mono">globals.css</code>):
              </p>
              <div className="relative">
                <button
                  onClick={() => copyToClipboard(`@tailwind base;
@tailwind components;

@import "./lib/design-system/styles.css";

@tailwind utilities;`, "css_snippet")}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all"
                  title="Copy Code Snippet"
                >
                  {copiedToken === "css_snippet" ? (
                    <Check className="w-4 h-4 text-eden-emerald" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto border border-gray-800">
                  {`@tailwind base;
@tailwind components;

@import "./lib/design-system/styles.css";

@tailwind utilities;`}
                </pre>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={getTypographyClass("h3", "flex items-center gap-2")}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-eden-emerald/20 text-eden-emerald text-xs font-bold font-mono">4</span>
                Write consistent, brand-compliant UI
              </h3>
              <p className={getTypographyClass("body")}>
                Import the pre-composed style selectors or helper utilities directly in your React components. This guarantees identical typography sizes, inputs, and premium hover scales:
              </p>
              <div className="relative">
                <button
                  onClick={() => copyToClipboard(`import { getButtonClass, getCardClass, getTypographyClass } from "@/lib/design-system";

export default function FacultyCard() {
  return (
    <div className={getCardClass("glassInteractive", "p-6")}>
      <h3 className={getTypographyClass("h3", "mb-2")}>
        Dance Faculty
      </h3>
      <p className={getTypographyClass("body", "mb-4")}>
        Explore creative movements and contemporary choreography.
      </p>
      <button className={getButtonClass("primary", "sm")}>
        Apply Today
      </button>
    </div>
  );
}`, "react_snippet")}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all"
                  title="Copy Code Snippet"
                >
                  {copiedToken === "react_snippet" ? (
                    <Check className="w-4 h-4 text-eden-emerald" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto border border-gray-800">
                  {`import { getButtonClass, getCardClass, getTypographyClass } from "@/lib/design-system";

export default function FacultyCard() {
  return (
    <div className={getCardClass("glassInteractive", "p-6")}>
      <h3 className={getTypographyClass("h3", "mb-2")}>
        Dance Faculty
      </h3>
      <p className={getTypographyClass("body", "mb-4")}>
        Explore creative movements and contemporary choreography.
      </p>
      <button className={getButtonClass("primary", "sm")}>
        Apply Today
      </button>
    </div>
  );
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-eden-border-light dark:border-eden-border-dark py-12 mt-20 bg-white/20 dark:bg-eden-background/40 backdrop-blur-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Loveworld Arts Academy. Designed and engineered for premium creative governance.
          </p>
          <div className="mt-4 sm:mt-0 flex justify-center gap-6 text-xs text-gray-400">
            <Link href="/" className="hover:text-eden-emerald transition-colors">Academy Portal</Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-eden-emerald transition-colors flex items-center gap-1">
              Github Reference
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
