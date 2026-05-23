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
    <div className="flex flex-col items-center w-full animate-in fade-in duration-500">
      {/* Animated Mail Icon Container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl scale-125 animate-pulse pointer-events-none" />
        <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30 transform hover:scale-105 transition-transform duration-300">
          <Mail className="w-8 h-8 animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#0c1e15] p-1 rounded-full border border-gray-150 dark:border-white/10 shadow-md">
          <div className="w-4 h-4 rounded-full bg-amber-500 animate-ping absolute opacity-75" />
          <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[9px] text-white font-bold relative">
            !
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mb-4 uppercase tracking-wider border border-emerald-500/20 shadow-sm backdrop-blur-md">
        Verification Pending
      </div>

      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 text-center leading-tight">
        Confirm your Email
      </h1>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6 max-w-xs leading-relaxed font-normal">
        We sent a secure, one-click verification link to your inbox. Tap the link inside the email to instantly activate your account.
      </p>

      {/* Instruction Checklist */}
      <div className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-2xl p-4 mb-6 text-left space-y-3">
        <h3 className="text-[9px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Next Steps</h3>
        <div className="flex items-start space-x-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Check your Inbox</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-light">Click the link inside the verification email from Eden.</p>
          </div>
        </div>
        <div className="flex items-start space-x-2.5">
          <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Check Spam Folder</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-light">If you don't see it within 2 minutes, check your spam or promotion tabs.</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col gap-2.5 mb-6">
        <Link href="/login" className="w-full">
          <Button className="w-full py-5 text-xs font-bold rounded-xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 shadow-sm transition-all group">
            Back to Login
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>

        <Button
          onClick={handleResend}
          disabled={isResending || countdown > 0}
          variant="outline"
          className="w-full py-5 text-xs font-bold rounded-xl border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-gray-700 dark:text-gray-300"
        >
          {isResending ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Sending...
            </>
          ) : countdown > 0 ? (
            `Resend in ${countdown}s`
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Resend Email
            </>
          )}
        </Button>
      </div>

      {/* Toast-like notifications for Resend status */}
      {resendStatus === "success" && (
        <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-center text-[11px] font-semibold animate-in fade-in duration-300">
          Verification email resent successfully! Please check your inbox.
        </div>
      )}
      {resendStatus === "error" && (
        <div className="w-full p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-center text-[11px] font-semibold animate-in fade-in duration-300">
          Failed to resend. Please check your credentials or register again.
        </div>
      )}
    </div>
  );
}
