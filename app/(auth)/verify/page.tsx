"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/services/supabase/client";
import { Mail, ArrowRight, RefreshCw, CheckCircle, HelpCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");
  const [countdown, setCountdown] = useState(0);
  const supabase = createClient();

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsResending(true);
    setResendStatus("idle");

    try {
      // In a real application, you'd get the email from state or local storage
      const storedEmail = localStorage.getItem("pending_verification_email") || "";
      if (!storedEmail) {
        setResendStatus("error");
        setIsResending(false);
        return;
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: storedEmail,
      });

      if (error) throw error;

      setResendStatus("success");
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Resend error:", err);
      setResendStatus("error");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#030303] flex flex-col transition-all duration-500 selection:bg-emerald-500/30 overflow-x-hidden relative">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center z-10 shrink-0">
        <Logo />
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 z-10">
        <div className="w-full max-w-xl bg-white/40 dark:bg-[#080808]/40 backdrop-blur-3xl border border-gray-200/50 dark:border-white/5 p-8 md:p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center relative overflow-hidden transition-all duration-300 hover:shadow-emerald-500/5">
          {/* Decorative Corner Glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Animated Mail Icon Container */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl scale-125 animate-pulse" />
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30 transform hover:scale-105 transition-transform duration-300">
              <Mail className="w-10 h-10 animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-[#0d0d0d] p-1.5 rounded-full border border-gray-100 dark:border-white/10 shadow-md">
              <div className="w-5 h-5 rounded-full bg-amber-500 animate-ping absolute opacity-75" />
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold relative">
                !
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mb-6 uppercase tracking-wider border border-emerald-500/20 shadow-sm backdrop-blur-md">
            Verification Pending
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4 text-center">
            Confirm your Email
          </h1>

          <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-md leading-relaxed font-light">
            We sent a secure, one-click verification link to your inbox. Tap the link in your email to instantly activate your account.
          </p>

          {/* Instruction Checklist */}
          <div className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-2xl p-6 mb-8 text-left space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">Next Steps</h3>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Check your Inbox</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Click the link inside the verification email from Eden.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Check Spam Folder</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">If you don't see it within 2 minutes, check your spam or promotion tabs.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-4 mb-8">
            <Link href="/login" className="flex-1">
              <Button className="w-full py-6 text-sm font-bold rounded-2xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all group">
                Back to Login
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Button
              onClick={handleResend}
              disabled={isResending || countdown > 0}
              variant="outline"
              className="flex-1 py-6 text-sm font-bold rounded-2xl border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-gray-700 dark:text-gray-300"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Email
                </>
              )}
            </Button>
          </div>

          {/* Toast-like notifications for Resend status */}
          {resendStatus === "success" && (
            <div className="w-full p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-center text-xs font-semibold animate-in fade-in duration-300">
              Verification email resent successfully! Please check your inbox.
            </div>
          )}
          {resendStatus === "error" && (
            <div className="w-full p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-center text-xs font-semibold animate-in fade-in duration-300">
              Failed to resend. Please check your credentials or register again.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
