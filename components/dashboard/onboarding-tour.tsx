"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/services/supabase/client";

interface TourStep {
  targetId: string | null; // null means centered modal
  title: string;
  content: string;
  position: "right" | "left" | "top" | "bottom" | "center";
}

interface OnboardingTourProps {
  role: string;
  facultySlug: string;
  initialCompletedTour?: boolean;
}

export function OnboardingTour({ role, facultySlug, initialCompletedTour }: OnboardingTourProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  // Tour steps defined per role
  const steps: TourStep[] = (() => {
    switch (role) {
      case "ADMIN":
        return [
          {
            targetId: null,
            title: "Welcome to the Admin Suite! 🌟",
            content: "You have full administrative authority over this faculty. Let's walk through your command center and important tools.",
            position: "center",
          },
          {
            targetId: "tour-overview",
            title: "Administrative Overview",
            content: "Your main dashboard aggregates total students, faculty coordinators, upcoming events, and submitted reports in real-time.",
            position: "right",
          },
          {
            targetId: "tour-messages",
            title: "Broadcast Announcements",
            content: "Send announcements. You can target specific student lists, target particular campuses, or publish faculty-wide notices.",
            position: "right",
          },
          {
            targetId: "tour-courses",
            title: "Curriculum Hub",
            content: "Create, edit, and organize curriculum materials. You can construct rich video modules and text courses.",
            position: "right",
          },
          {
            targetId: "tour-coordinators",
            title: "Coordinate Staff",
            content: "Appoint coordinators, assign campus permissions, and oversee the administrative team directory.",
            position: "right",
          },
          {
            targetId: "tour-settings",
            title: "Faculty Parameters",
            content: "Set global faculty preferences, theme toggles, and edit core metadata easily.",
            position: "right",
          },
        ];
      case "COORDINATOR":
        return [
          {
            targetId: null,
            title: "Welcome, Faculty Coordinator! ⚡",
            content: "You coordinate operations, schedule sessions, and supervise student progress. Let's explore your tools.",
            position: "center",
          },
          {
            targetId: "tour-overview",
            title: "Operations Hub",
            content: "Access quick counters for your student roster, scheduled classes, and new announcements.",
            position: "right",
          },
          {
            targetId: "tour-students",
            title: "Supervise Pupils",
            content: "View student cards, review learning progress inside the Ministerial Academy Tracker, and verify profiles.",
            position: "right",
          },
          {
            targetId: "tour-events",
            title: "Event & Class Schedules",
            content: "Schedule local practices, workshops, and verify attendance proof pictures submitted by students.",
            position: "right",
          },
          {
            targetId: "tour-messages",
            title: "Announcements Portal",
            content: "Read notifications from administration or post notices targeting your assigned campuses.",
            position: "right",
          },
        ];
      default: // STUDENT
        return [
          {
            targetId: null,
            title: "Welcome to Eden Academy! 🎓",
            content: "Your path to creative and ministerial excellence starts here. Let's do a quick tour of your portal.",
            position: "center",
          },
          {
            targetId: "tour-overview",
            title: "My Dashboard",
            content: "Here is your progress overview, active courses, upcoming scheduled workshops, and newest notifications.",
            position: "right",
          },
          {
            targetId: "tour-courses",
            title: "Academy Curriculum",
            content: "Access video lectures and rich text resources. Study at your own pace and earn graduate badges.",
            position: "right",
          },
          {
            targetId: "tour-events",
            title: "Workshops & Showcases",
            content: "Browse upcoming faculty events and mark yourself present to log your attendance hours.",
            position: "right",
          },
          {
            targetId: "tour-messages",
            title: "Stay Notified",
            content: "Check important messages and directives sent directly to your campus by coordinators.",
            position: "right",
          },
        ];
    }
  })();

  useEffect(() => {
    // Check if tour was already completed or skipped (checking database and localStorage for robustness)
    const isLocalCompleted = localStorage.getItem(`eden_tour_completed_${role.toLowerCase()}`);
    if (initialCompletedTour || isLocalCompleted === "true") {
      return;
    }

    // Small delay to let page mount smoothly
    const timer = setTimeout(() => {
      setIsOpen(true);
      setCurrentStep(0);
    }, 1000);
    return () => clearTimeout(timer);
  }, [role, initialCompletedTour]);

  // Recalculate tooltip position on step change
  useEffect(() => {
    if (!isOpen || currentStep >= steps.length) return;

    const step = steps[currentStep];
    if (!step.targetId) {
      return; // Center modal
    }

    const updatePosition = () => {
      const element = document.getElementById(step.targetId!);
      if (!element) {
        // Fallback to center if element not rendered (e.g. mobile hidden sidebar)
        setTooltipPos({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
        return;
      }

      const rect = element.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      // Position logic
      if (step.position === "right") {
        top = rect.top + scrollY + rect.height / 2 - 80;
        left = rect.right + scrollX + 16;
      } else if (step.position === "bottom") {
        top = rect.bottom + scrollY + 16;
        left = rect.left + scrollX + rect.width / 2 - 160;
      } else {
        // center/left/top fallbacks
        top = rect.top + scrollY - 180;
        left = rect.left + scrollX + rect.width / 2 - 160;
      }

      // Check boundaries
      if (left + 350 > window.innerWidth) {
        left = window.innerWidth - 370;
      }
      if (left < 10) left = 10;
      if (top < 10) top = 10;

      setTooltipPos({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    localStorage.setItem(`eden_tour_completed_${role.toLowerCase()}`, "true");
    setIsOpen(false);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ completed_tour: true })
          .eq("id", user.id);
      }
    } catch (e) {
      console.error("Error saving onboarding completion status:", e);
    }
    
    // Redirect to profile setup with completed_tour query parameter
    router.push(`/dashboard/${facultySlug}/profile?completed_tour=true`);
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
      {/* Dimmed Overlay */}
      <div 
        className="absolute inset-0 bg-black/35 dark:bg-black/55 backdrop-blur-[2px] transition-all pointer-events-auto"
        onClick={handleSkip}
      />

      {/* Target Highlight Ring */}
      {currentStepData.targetId && (
        <div 
          className="absolute border-2 border-emerald-500/80 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 pointer-events-none"
          style={{
            top: document.getElementById(currentStepData.targetId)?.getBoundingClientRect().top ? document.getElementById(currentStepData.targetId)!.getBoundingClientRect().top + window.scrollY - 4 : 0,
            left: document.getElementById(currentStepData.targetId)?.getBoundingClientRect().left ? document.getElementById(currentStepData.targetId)!.getBoundingClientRect().left + window.scrollX - 4 : 0,
            width: document.getElementById(currentStepData.targetId)?.getBoundingClientRect().width ? document.getElementById(currentStepData.targetId)!.getBoundingClientRect().width + 8 : 0,
            height: document.getElementById(currentStepData.targetId)?.getBoundingClientRect().height ? document.getElementById(currentStepData.targetId)!.getBoundingClientRect().height + 8 : 0,
          }}
        />
      )}

      {/* Tour Card */}
      <div
        className={`absolute pointer-events-auto w-full max-w-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 rounded-3xl shadow-2xl p-6 transition-all duration-300 transform scale-100 ${
          !currentStepData.targetId 
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
            : ""
        }`}
        style={currentStepData.targetId ? {
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
        } : undefined}
      >
        {/* Design Glow Decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles size={14} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Guided Tour
            </span>
          </div>
          <button 
            onClick={handleSkip}
            className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2 mb-6">
          <h4 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
            {currentStepData.title}
          </h4>
          <p className="text-xs text-gray-700 dark:text-gray-350 font-normal leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-150 dark:border-white/5">
          {/* Progress Indicator */}
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </span>
            <div className="w-16 bg-gray-100 dark:bg-white/5 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {currentStep > 0 ? (
              <button
                onClick={handlePrev}
                className="p-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                <ChevronLeft size={16} />
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="px-3 py-1.5 text-[11px] font-bold text-gray-400 hover:text-rose-500 rounded-xl transition-all"
              >
                Skip
              </button>
            )}

            <button
              onClick={handleNext}
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 size={12} className="mr-1.5" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={12} className="ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
