"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error securely for telemetry or dev inspections
    console.error("Dashboard Boundary Caught Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/85 dark:bg-[#080808]/85 backdrop-blur-xl border border-red-200/55 dark:border-red-950/20 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 dark:bg-red-500/5 flex items-center justify-center text-red-500">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Portal Operation Failure
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">
            An unexpected error occurred while communicating with the database. Access profile privileges or layout segments failed to load.
          </p>
          {error.digest && (
            <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/[0.02] py-1 px-2 rounded-md inline-block">
              Ref: {error.digest}
            </div>
          )}
        </div>

        {/* Button Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-850 dark:hover:bg-white/90 gap-2 h-11"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
          <a
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center rounded-2xl border border-gray-250/30 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.02] text-sm font-semibold text-gray-600 dark:text-gray-300 transition-colors h-11 gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </a>
        </div>
      </div>
    </div>
  );
}
