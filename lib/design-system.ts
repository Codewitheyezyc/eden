/**
 * Eden Design System Constants and Utility Functions
 * Based on the Eden Design System Specification
 */

export const edenColors = {
  brand: {
    forestGreen: "#14532D",
    emerald: "#10B981",
    gold: "#F59E0B",
  },
  light: {
    background: "#F8FAF7",
    surface: "#FFFFFF",
  },
  dark: {
    background: "#07130D",
    surface: "#0C1E15",
  }
};

export type ButtonVariant = "primary" | "accent" | "gold" | "glass" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export function getButtonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extraClass: string = ""
) {
  const base = "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 select-none";
  
  const variants = {
    primary: "bg-eden-green-deep hover:bg-green-800 text-white shadow-md shadow-green-900/10 focus:ring-eden-green-deep dark:bg-eden-emerald dark:hover:bg-emerald-600 dark:shadow-emerald-950/20",
    accent: "bg-eden-emerald hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 focus:ring-eden-emerald",
    gold: "bg-eden-gold hover:bg-amber-600 text-white shadow-md shadow-amber-500/10 focus:ring-eden-gold",
    glass: "bg-white/10 dark:bg-[#0c1e15]/40 backdrop-blur-md border border-eden-border-light dark:border-eden-border-dark text-eden-text-light-primary dark:text-eden-text-dark-primary hover:bg-white/20 dark:hover:bg-[#0c1e15]/80 hover:border-eden-emerald focus:ring-eden-emerald",
    outline: "border-2 border-eden-green-deep text-eden-green-deep hover:bg-eden-green-deep hover:text-white dark:border-eden-emerald dark:text-eden-emerald dark:hover:bg-eden-emerald dark:hover:text-white focus:ring-eden-emerald",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-750 dark:text-gray-350 focus:ring-gray-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  return [base, variants[variant], sizes[size], extraClass].filter(Boolean).join(" ");
}

export type CardVariant = "glass" | "interactive" | "glassInteractive";

export function getCardClass(variant: CardVariant = "glass", extraClass: string = "") {
  let base = "bg-white/10 dark:bg-white/5 backdrop-blur-eden-glass border border-eden-border-light dark:border-eden-border-dark shadow-eden-subtle rounded-2xl transition-all duration-500";
  if (variant === "interactive" || variant === "glassInteractive" || extraClass.includes("group")) {
    base += " hover:border-eden-emerald hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-0.5 hover:scale-[1.01] cursor-pointer";
  }
  return [base, extraClass].filter(Boolean).join(" ");
}

export function getInputClass(isError: boolean = false, hasLeftIcon: boolean = false, extraClass: string = "") {
  let base = "w-full bg-white dark:bg-eden-surface-dark border border-eden-border-light dark:border-eden-border-dark rounded-xl px-4 py-3 text-sm text-eden-text-light-primary dark:text-eden-text-dark-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-eden-emerald/50 dark:focus:ring-eden-emerald/50 focus:border-eden-emerald dark:focus:border-eden-emerald transition-all duration-200";
  if (isError) {
    base += " border-red-500 focus:ring-red-500/30 focus:border-red-500";
  }
  if (hasLeftIcon) {
    base = base.replace("px-4", "pl-10 pr-4");
  }
  return [base, extraClass].filter(Boolean).join(" ");
}

export type BadgeVariant = "success" | "gold" | "error" | "info" | "neutral";

export function getBadgeClass(
  variant: BadgeVariant = "neutral",
  extraClass: string = ""
) {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 border";
  const variants = {
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    gold: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    neutral: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  };
  return [base, variants[variant], extraClass].filter(Boolean).join(" ");
}

export type TypographyVariant = "h1" | "h2" | "h3" | "body" | "caption";

export function getTypographyClass(
  variant: TypographyVariant = "body",
  extraClass: string = ""
) {
  const variants = {
    h1: "font-sans text-[30px] font-bold tracking-tight text-eden-text-light-primary dark:text-eden-text-dark-primary",
    h2: "font-sans text-[24px] font-semibold tracking-tight text-eden-text-light-primary dark:text-eden-text-dark-primary",
    h3: "font-sans text-[18px] font-medium tracking-tight text-eden-text-light-primary dark:text-eden-text-dark-primary",
    body: "font-sans text-[14px] font-normal leading-relaxed text-eden-text-light-primary dark:text-eden-text-dark-primary",
    caption: "font-sans text-[12px] font-normal text-gray-400 dark:text-gray-500",
  };
  return [variants[variant], extraClass].filter(Boolean).join(" ");
}
