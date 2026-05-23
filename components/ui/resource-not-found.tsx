"use client";

import Link from "next/link";
import { Compass, ShieldAlert, ArrowLeft, Home, Search } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface ResourceNotFoundProps {
  mode: "faculty" | "access" | "404";
  customSlug?: string;
  customErrorDetail?: string;
}

export function ResourceNotFound({ mode, customSlug, customErrorDetail }: ResourceNotFoundProps) {
  // Setup display attributes per mode
  const config = (() => {
    switch (mode) {
      case "faculty":
        return {
          icon: <Compass className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />,
          title: "Faculty Workspace Not Found",
          subtitle: `We searched the Eden database but couldn't find a faculty under the slug:`,
          slugHighlight: customSlug,
          description: "This workspace may have been permanently archived, renamed, or you might have mistyped the URL address. Double check the address or return to your selector.",
          btnText: "Return to Workspace Selector",
          btnLink: "/dashboard",
        };
      case "access":
        return {
          icon: <ShieldAlert className="w-12 h-12 text-amber-600 dark:text-amber-400 animate-pulse" />,
          title: "Access Restricted",
          subtitle: "You do not have active membership mapping for this faculty.",
          description: "To view courses, submit reports, or supervise students, your account must first be assigned a roll for this workspace by an authorized administrator.",
          btnText: "Go to Onboarding Center",
          btnLink: "/onboarding",
        };
      default: // 404
        return {
          icon: <Search className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-bounce" style={{ animationDuration: '4s' }} />,
          title: "Resource Not Found",
          subtitle: "The path or page you are requesting doesn't exist.",
          description: "We looked everywhere but couldn't find the page. It might have moved, or the link you followed might be broken.",
          btnText: "Go to Main Dashboard",
          btnLink: "/dashboard",
        };
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303] flex flex-col transition-colors selection:bg-emerald-500/30 overflow-x-hidden relative items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Background Neon Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Floating Logo Header */}
      <header className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-20 w-full max-w-7xl mx-auto">
        <Logo />
        <ThemeToggle />
      </header>

      {/* Main defined card container */}
      <div className="w-full max-w-xl bg-white/40 dark:bg-[#080808]/40 backdrop-blur-3xl border border-gray-200/50 dark:border-white/5 p-8 md:p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center relative overflow-hidden transition-all duration-300 hover:shadow-emerald-500/5 animate-in fade-in zoom-in-95 duration-500 mt-12">
        {/* Glow corners */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Dynamic Icon Wrapper */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-emerald-500/15 rounded-full blur-lg scale-125 pointer-events-none" />
          <div className="w-20 h-20 bg-gray-50/50 dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-2xl flex items-center justify-center shadow-md relative z-10">
            {config.icon}
          </div>
        </div>

        {/* Title & Messages */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3 text-center leading-snug">
          {config.title}
        </h1>

        <div className="space-y-4 text-center max-w-md mb-8">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">
            {config.subtitle}
          </p>

          {config.slugHighlight && (
            <div className="inline-block bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-mono font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm">
              "{config.slugHighlight}"
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-light">
            {config.description}
          </p>
        </div>

        {/* Recovery CTA */}
        <div className="w-full flex flex-col sm:flex-row gap-3 relative z-10">
          <Link href={config.btnLink} className="flex-1">
            <button className="w-full inline-flex items-center justify-center px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-xs font-bold rounded-2xl transition-all shadow-md group">
              <Home className="w-3.5 h-3.5 mr-2" />
              <span>{config.btnText}</span>
            </button>
          </Link>
          
          <Link href="/" className="flex-1">
            <button className="w-full inline-flex items-center justify-center px-6 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-2xl border border-gray-250 dark:border-white/5 transition-all">
              <ArrowLeft className="w-3.5 h-3.5 mr-2" />
              <span>Back to Home</span>
            </button>
          </Link>
        </div>

        {/* Technical details accordion if provided */}
        {customErrorDetail && (
          <div className="mt-8 pt-6 border-t border-gray-200/40 dark:border-white/5 w-full text-left">
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Technical Report</span>
            <div className="p-3.5 bg-gray-100/50 dark:bg-black/50 border border-gray-200/50 dark:border-white/5 rounded-xl text-[10px] font-mono text-gray-400 dark:text-gray-500 overflow-x-auto leading-relaxed max-h-32 scrollbar-thin">
              {customErrorDetail}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
