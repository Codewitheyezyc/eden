"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSupport } from "@/providers/support-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Send, CheckCircle2, AlertCircle, LifeBuoy } from "lucide-react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

export function SupportModal() {
  const { isOpen, closeSupport, userEmail, userName } = useSupport();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Question",
    priority: "Medium" as "Low" | "Medium" | "High",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Pre-fill form when user session changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: userName || prev.name,
      email: userEmail || prev.email,
    }));
  }, [userName, userEmail]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeSupport();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeSupport]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      // Reset form states on close
      setTimeout(() => {
        setStatus("idle");
        setErrorMessage("");
        setFormData((prev) => ({
          ...prev,
          subject: "General Question",
          priority: "Medium",
          message: "",
        }));
      }, 300);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrioritySelect = (priority: "Low" | "Medium" | "High") => {
    setFormData((prev) => ({ ...prev, priority }));
  };

  const triggerConfetti = () => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!formData.name.trim()) {
      setStatus("error");
      setErrorMessage("Please enter your name.");
      toast.error("Please enter your name.");
      return;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }
    if (formData.message.trim().length < 10) {
      setStatus("error");
      setErrorMessage("Message must be at least 10 characters long.");
      toast.error("Message must be at least 10 characters long.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    // Check if configuration exists
    if (!serviceId || !templateId || !publicKey) {
      // SANDBOX MODE DEMO FLOW
      console.log("%c[Eden Support - DEV MODE/SANDBOX] Form submitted successfully!", "color: #10b981; font-weight: bold; font-size: 14px;");
      console.log("Transmission Data:", formData);
      console.log("To fully connect, set NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, and NEXT_PUBLIC_EMAILJS_PUBLIC_KEY in your .env.local");

      const loadToast = toast.loading("Simulating transmission (Sandbox)...");
      // Simulate a high-fidelity loading transmission
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.dismiss(loadToast);
      
      setStatus("success");
      toast.success("Sandbox ticket simulated successfully!");
      triggerConfetti();
      return;
    }

    // LIVE EMAILJS TRANSMISSION
    const submitToast = toast.loading("Transmitting ticket to support team...");
    try {
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            from_name: formData.name,
            from_email: formData.email,
            subject: formData.subject,
            priority: formData.priority,
            message: formData.message,
            to_name: "Loveworld Arts Academy Admin",
          },
        }),
      });

      toast.dismiss(submitToast);

      if (response.ok) {
        setStatus("success");
        toast.success("Support ticket registered successfully!");
        triggerConfetti();
      } else {
        const errText = await response.text();
        throw new Error(errText || "Failed to send message via EmailJS.");
      }
    } catch (err: any) {
      toast.dismiss(submitToast);
      console.error("EmailJS Transmission Error:", err);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
      toast.error(err.message || "An unexpected transmission error occurred.");
    }
  };

  const priorityColors = {
    Low: {
      bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
      activeBg: "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]",
      dot: "bg-emerald-500",
    },
    Medium: {
      bg: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-450",
      activeBg: "bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]",
      dot: "bg-amber-500",
    },
    High: {
      bg: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
      activeBg: "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]",
      dot: "bg-rose-500",
    },
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Glassmorphic Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[6px] transition-opacity"
        onClick={closeSupport}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200/50 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:border-white/5 dark:bg-[#07130d]/85 transition-all duration-300 transform scale-100 flex flex-col max-h-[90vh] md:max-h-[85vh]"
      >
        {/* Subtle interior glow decorations */}
        <div className="absolute -left-20 -top-20 -z-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 -z-10 h-40 w-40 rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-150 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <LifeBuoy className="h-5 w-5 animate-[spin_6s_linear_infinite]" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Eden Support Hub
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Direct creative portal help desk
              </p>
            </div>
          </div>
          <button
            onClick={closeSupport}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Content Body */}
        <div className="flex-1 overflow-y-auto pt-6 pr-1 -mr-2">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-6">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500">
                <CheckCircle2 className="h-12 w-12" />
                <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Message Transmitted!
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                  Thank you for reaching out. Your ticket has been registered in our console. Our administrative team will review your request and reply to <strong>{formData.email}</strong> within 24 hours.
                </p>
              </div>
              <div className="w-full pt-4">
                <Button onClick={closeSupport} className="w-full rounded-2xl py-6 font-bold shadow-md shadow-emerald-500/10">
                  Close Help Desk
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === "error" && (
                <div className="flex items-start gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-600 dark:text-rose-450 text-sm animate-shake">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Transmission Blocked: </span>
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Dev mode notice */}
              {(!process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 
                !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 
                !process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) && (
                <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-3 text-[11px] text-emerald-600 dark:text-emerald-450 flex items-center gap-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Sandbox Demo Mode Active: Submissions will simulate successful sending!</span>
                </div>
              )}

              {/* Name & Email Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    disabled={status === "sending"}
                    className="rounded-xl border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/30 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Your Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    disabled={status === "sending"}
                    className="rounded-xl border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/30 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Subject dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Subject Category
                </Label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  disabled={status === "sending"}
                  className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:border-gray-700 dark:bg-[#0c1e15] dark:text-gray-100 rounded-xl border-gray-200 dark:border-gray-800 h-10 w-full"
                >
                  <option value="General Question">General Question</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Admission Inquiry">Admission Inquiry</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Roster / Leadership Role Change">Roster / Leadership Role Change</option>
                </select>
              </div>

              {/* Priority Selectors */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">
                  Priority Urgency
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["Low", "Medium", "High"] as const).map((p) => {
                    const isSelected = formData.priority === p;
                    const colors = priorityColors[p];
                    return (
                      <button
                        type="button"
                        key={p}
                        disabled={status === "sending"}
                        onClick={() => handlePrioritySelect(p)}
                        className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 border text-xs font-semibold tracking-wide transition-all ${
                          isSelected ? colors.activeBg : `${colors.bg} hover:bg-opacity-80`
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : colors.dot} shrink-0`} />
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Detail Message
                </Label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Describe your issue or question in detail (min 10 characters)..."
                  disabled={status === "sending"}
                  rows={4}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:border-gray-700 dark:bg-[#0c1e15] dark:text-gray-100 dark:placeholder:text-gray-400 rounded-xl border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-6 font-bold shadow-lg transition-transform active:scale-[0.98]"
                >
                  {status === "sending" ? (
                    <>
                      <span className="h-4 w-4 shrink-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Transmitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
