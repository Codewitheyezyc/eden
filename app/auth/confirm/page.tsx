"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/services/supabase/client";
import { ShieldAlert, CheckCircle, Loader2, Sparkles, Trophy, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/onboarding";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function verifyToken() {
      if (!tokenHash || !type) {
        setStatus("error");
        setErrorMsg("Missing verification parameters. Please use the link sent to your email.");
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });

        if (error) {
          throw error;
        }

        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "The verification link is invalid or has expired.");
      }
    }

    verifyToken();
  }, [tokenHash, type, supabase]);

  if (status === "loading") {
    return (
      <div className="text-center space-y-6 animate-in fade-in duration-300">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping pointer-events-none" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Confirming Academy Registration
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-light max-w-sm mx-auto leading-relaxed">
            Please wait while we secure your connection and activate your Loveworld Arts Academy credentials...
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center rounded-full mx-auto shadow-inner relative">
          <Trophy size={36} className="animate-bounce" />
          <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-1 border-2 border-white dark:border-[#0a0a0a]">
            <CheckCircle size={12} />
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase block mb-1">
            Verification Successful
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Welcome to Eden!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-light max-w-md mx-auto leading-relaxed">
            Your email has been verified. You now have full, secure access to your creative faculty learning resources, events, and dashboards.
          </p>
        </div>

        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 max-w-sm mx-auto">
          <Sparkles size={16} className="text-emerald-500 shrink-0" />
          <span>Your account is now activated. Ready to begin your growth journey?</span>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => window.location.replace(next)}
            className="w-full max-w-sm py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2"
          >
            <span>Proceed to Onboarding</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    );
  }

  // Error State
  return (
    <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center rounded-full mx-auto shadow-inner relative">
        <ShieldAlert size={36} className="animate-pulse" />
      </div>

      <div>
        <span className="text-[10px] font-bold tracking-widest text-rose-600 dark:text-rose-400 uppercase block mb-1">
          Verification Failed
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
          Invalid Link
        </h2>
        <p className="text-sm text-gray-500 dark:text-rose-455 mt-2 font-light max-w-md mx-auto leading-relaxed">
          {errorMsg}
        </p>
      </div>

      <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-xs text-gray-500 dark:text-gray-400 text-left space-y-1 max-w-sm mx-auto">
        <span className="font-bold text-gray-700 dark:text-gray-300 block">Troubleshooting tips:</span>
        <ul className="list-disc list-inside space-y-1 font-light text-[11px]">
          <li>The link might have already been clicked/used. Try logging in.</li>
          <li>Supabase confirmation links expire within 24 hours.</li>
          <li>Make sure you copy the entire link from your email client.</li>
        </ul>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
        >
          <Home size={14} />
          <span>Go Home</span>
        </button>
        <Button
          onClick={() => router.push("/login")}
          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
        >
          Return to Login
        </Button>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-[#f8faf7] dark:bg-[#040806] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      {/* Premium background blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative w-full max-w-lg bg-white/60 dark:bg-[#070c09]/60 backdrop-blur-2xl border border-gray-200/50 dark:border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <Suspense
          fallback={
            <div className="text-center space-y-6">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
              <p className="text-xs text-gray-400">Loading auth context...</p>
            </div>
          }
        >
          <ConfirmContent />
        </Suspense>
      </div>
    </div>
  );
}
