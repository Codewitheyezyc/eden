"use client";

import { useState } from "react";
import { completeOnboarding } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { CAMPUSES } from "@/lib/campuses";
import { Sparkles, MapPin, User, Phone, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

interface OnboardingProps {
  initialFullName?: string;
  initialCampusZone?: string;
  initialPhone?: string;
}

export function FacultySelector({
  initialFullName = "",
  initialCampusZone = "",
  initialPhone = "",
}: OnboardingProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [campusZone, setCampusZone] = useState(initialCampusZone || CAMPUSES[0]);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusZone) {
      setError("Please select your campus or zone.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await completeOnboarding({
        fullName,
        campusZone,
        phone,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Academy Header */}
      <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Loveworld Arts Academy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-3">
          Dance Faculty Enrollment
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto font-normal leading-relaxed">
          Welcome to the creative digital hub of the Loveworld Arts Academy. Finalize your member profile to enter the Dance Faculty portal.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full bg-white/80 dark:bg-[#080808]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none -z-10" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Faculty Confirmation Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                  Enrolling Faculty
                </div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">
                  Dance Faculty
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Student</span>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Brother John Doe"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/30 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>

          {/* Campus Zone Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Campus / Zonal Location <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <div className="relative">
              <select
                value={campusZone}
                onChange={(e) => setCampusZone(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/30 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
              >
                {CAMPUSES.map((campus) => (
                  <option key={campus} value={campus} className="bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100">
                    {campus}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                </svg>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Targeted announcements and attendance logs will synchronize with your selected zone.
            </p>
          </div>

          {/* Phone / Contact */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Phone / WhatsApp / KingsChat (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +234 800 000 0000"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/30 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold text-center animate-in fade-in">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full h-14 rounded-2xl text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span>Completing Enrollment...</span>
            ) : (
              <>
                <span>Enter Dance Faculty</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        Loveworld Arts Academy &bull; Dance Faculty &bull; Empowering Creative Excellence
      </div>
    </div>
  );
}
