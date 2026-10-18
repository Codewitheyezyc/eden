"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MouseGlow } from "@/components/ui/mouse-glow";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AnimatedPattern } from "@/components/ui/animated-pattern";
import { 
  Sparkles, 
  Users, 
  Calendar as CalendarIcon, 
  Megaphone, 
  Bell, 
  Shield, 
  Layers, 
  Layout, 
  ArrowRight, 
  Check, 
  HelpCircle, 
  Laptop, 
  Globe,
  Cpu
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is Eden and how does it support Loveworld Arts Academy?",
      a: "Eden is the dedicated digital operations portal engineered for the Loveworld Arts Academy Dance Faculty. It provides complete administrative operations, rehearsal and event registers, targeted zonal notice distributions, and structured creative learning."
    },
    {
      q: "How does the multi-campus registry scale?",
      a: "Eden is designed for complete zone-wide scalability. During onboarding, students and zonal leaders register their respective campus locations (such as Headquarters, Lagos Zone 1 through 6, and Sub-zones). Admins can dynamically append new campuses in the registry, and audience targeting cascades automatically."
    },
    {
      q: "Is there support for attendance check-ins?",
      a: "Yes! Zonal Leaders and Admins can schedule workshops and events on the calendar. Students check in to verify attendance, uploading creative proof directly inside their portal. The system instantly marks logs, offering real-time progress supervision."
    },
    {
      q: "How are announcements targeted?",
      a: "Our targeting system allows creators to broadcast notifications either to 'Everyone' or 'Zonal Leaders'. If zonal leaders are selected, the sender can specify a target campus (e.g. Lagos Zone 3) or target all zonal leaders, ensuring that high-level operational directives only reach the intended audience."
    },
    {
      q: "What future features are coming to Eden?",
      a: "We are actively developing an AI Creative Assistant for natural language scheduling and automated report summaries, advanced offline synchronizations for media rosters, and a zone-wide student creative directory."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc] dark:bg-[#030303] text-gray-900 dark:text-gray-100 transition-colors selection:bg-emerald-500/30 overflow-x-hidden">
      <MouseGlow />
      <MarketingNavbar />
      
      <main className="flex-1 relative z-10">
        
        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-8 pt-36 pb-20 md:pt-48 md:pb-28 flex flex-col items-center justify-center min-h-[85vh]">
          {/* Neon Gradient Background Glows */}
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[70%] h-[30%] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 dark:bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
          
          <AnimatedPattern />
          
          <div className="container mx-auto max-w-5xl text-center flex flex-col items-center relative z-10">
            <ScrollReveal delay={100}>
              <div className="inline-flex items-center rounded-full border border-emerald-500/10 dark:border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-8 backdrop-blur-md transition-all shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
                Eden System Beta &bull; Live & Evolving
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-gray-900 dark:text-white mb-6 leading-[1.05] transition-colors">
                The Creative Hub <br className="hidden md:block"/> for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500 dark:from-emerald-400 dark:to-emerald-200">Loveworld Arts Academy</span>
              </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={300}>
              <p className="text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed font-light transition-colors">
                The dedicated digital workspace for the Loveworld Arts Academy Dance Faculty, featuring zonal campus registries, targeted announcements, attendance verification, and interactive learning.
              </p>
            </ScrollReveal>
            
            <ScrollReveal delay={400}>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/register" className="w-full sm:w-auto group">
                  <Button size="lg" className="w-full sm:w-auto text-sm h-13 px-8 shadow-lg shadow-emerald-500/10 dark:shadow-emerald-950/20 transition-all hover:scale-[1.02] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl">
                    Get Started Free
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm h-13 px-8 bg-white/50 dark:bg-transparent border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-gray-700 dark:text-gray-300 font-bold rounded-2xl">
                    Explore Platform
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CORE CAPABILITIES & IMPLEMENTED FEATURES */}
        <section id="features" className="py-24 px-4 sm:px-8 border-t border-gray-200/30 dark:border-white/5 bg-gray-50/50 dark:bg-[#050505] transition-colors relative">
          <div className="container mx-auto max-w-6xl">
            <ScrollReveal delay={100}>
              <div className="text-center mb-20">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-md">Engineered Architecture</span>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-4 mb-4">Harmony in Structure & Isolation</h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                  Eden reflects the actual tools implemented inside the student and coordinator consoles. Absolute performance meets dynamic utility.
                </p>
              </div>
            </ScrollReveal>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Multi-Tenant isolated Faculties */}
              <ScrollReveal delay={200} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl blur opacity-0 group-hover:opacity-30 dark:group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-white dark:bg-[#080808] p-8 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm h-full flex flex-col group-hover:border-emerald-500/50 dark:group-hover:border-emerald-500/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                    <Layers size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Dance Faculty Workspace</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-light text-sm">
                    Dedicated digital workspace for the Dance Faculty. Complete administrative governance, rehearsal coordination, and zonal registers.
                  </p>
                </div>
              </ScrollReveal>

              {/* Card 2: Role-based Dashboards */}
              <ScrollReveal delay={300} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl blur opacity-0 group-hover:opacity-30 dark:group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-white dark:bg-[#080808] p-8 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm h-full flex flex-col group-hover:border-emerald-500/50 dark:group-hover:border-emerald-500/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                    <Layout size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Role-Based Dashboard Layouts</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-light text-sm">
                    Tailored control centers dynamically adapted to Admins, Zonal Leaders, and Students. Clean modular layout structure.
                  </p>
                </div>
              </ScrollReveal>

              {/* Card 3: Targeted Announcements */}
              <ScrollReveal delay={400} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl blur opacity-0 group-hover:opacity-30 dark:group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-white dark:bg-[#080808] p-8 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm h-full flex flex-col group-hover:border-emerald-500/50 dark:group-hover:border-emerald-500/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                    <Megaphone size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Targeted Announcement Feed</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-light text-sm">
                    Broadcasting portal supporting Everyone or Zonal Leaders-only configurations with fine-grained campus filtering.
                  </p>
                </div>
              </ScrollReveal>

              {/* Card 4: Event Calendar System */}
              <ScrollReveal delay={200} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl blur opacity-0 group-hover:opacity-30 dark:group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-white dark:bg-[#080808] p-8 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm h-full flex flex-col group-hover:border-emerald-500/50 dark:group-hover:border-emerald-500/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                    <CalendarIcon size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Event Schedules & Calendar</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-light text-sm">
                    Interactive monthly calendar mapping scheduled classes. Role-aware editing triggers for Admins and zonal leaders.
                  </p>
                </div>
              </ScrollReveal>

              {/* Card 5: Real-time Notifications */}
              <ScrollReveal delay={300} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl blur opacity-0 group-hover:opacity-30 dark:group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-white dark:bg-[#080808] p-8 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm h-full flex flex-col group-hover:border-emerald-500/50 dark:group-hover:border-emerald-500/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                    <Bell size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Real-time Notification Alerts</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-light text-sm">
                    Instant user notifications with visual indicators for unread alerts. Direct links to relevant action sheets.
                  </p>
                </div>
              </ScrollReveal>

              {/* Card 6: Dynamic Onboarding Tour */}
              <ScrollReveal delay={400} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl blur opacity-0 group-hover:opacity-30 dark:group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-white dark:bg-[#080808] p-8 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm h-full flex flex-col group-hover:border-emerald-500/50 dark:group-hover:border-emerald-500/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                    <Laptop size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Dynamic Onboarding Guides</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-light text-sm">
                    Interactive guided walkthroughs customized per role with dimming backdrops and visual checkpoint celebration.
                  </p>
                </div>
              </ScrollReveal>

            </div>
          </div>
        </section>

        {/* FUTURE VISION SECTION (AI CREATIVE ASSISTANT & ROBUST LOGS) */}
        <section className="py-24 px-4 sm:px-8 border-t border-gray-200/30 dark:border-white/5 transition-colors relative overflow-hidden">
          {/* Radial grid ornament */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.015),transparent)] pointer-events-none" />
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              
              <ScrollReveal delay={100}>
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-md">Future Ecosystem</span>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-4 mb-6 leading-tight">
                    AI Creative Assistant & Smart Automations
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed mb-6">
                    In upcoming releases, Eden will introduce custom AI capabilities directly in your panel. From automated attendance report summarization to natural language event scheduling.
                  </p>
                  
                  <ul className="space-y-3">
                    <li className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center mr-3 text-emerald-500 shrink-0">&bull;</span>
                      Natural language class scheduling (e.g. "Schedule class this Friday at 4 PM")
                    </li>
                    <li className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center mr-3 text-emerald-500 shrink-0">&bull;</span>
                      Creative report analysis & attendance statistics summaries
                    </li>
                    <li className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center mr-3 text-emerald-500 shrink-0">&bull;</span>
                      Smart targeted notification distributions
                    </li>
                  </ul>
                </div>
              </ScrollReveal>

              {/* Graphical AI Assistant Prompt Mockup */}
              <ScrollReveal delay={200}>
                <div className="bg-gradient-to-tr from-[#0a0a0a] to-[#121212] border border-white/5 rounded-3xl p-6 shadow-2xl relative">
                  <div className="absolute top-3 right-3 text-[9px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Future AI</div>
                  <div className="flex items-center space-x-2 text-white pb-4 border-b border-white/5 mb-4">
                    <Cpu size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold font-mono">eden-assistant.ai</span>
                  </div>
                  <div className="space-y-4 text-[11px] font-light leading-relaxed text-gray-400">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="font-bold text-white block mb-1">User Query:</span>
                      "Create an event called Design Review on May 25th at 3 PM and alert zonal leaders of Zone 1"
                    </div>
                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/15">
                      <span className="font-bold text-emerald-400 block mb-1">Eden AI:</span>
                      "Processing... Event scheduled on May 25th, 2026. Notification dispatched to target group (Zonal Leaders &bull; Lagos Zone 1)."
                    </div>
                  </div>
                </div>
              </ScrollReveal>

            </div>
          </div>
        </section>

        {/* HOW IT WORKS (ONBOARDING PIPELINE) */}
        <section id="how-it-works" className="py-24 px-4 sm:px-8 bg-gray-50/50 dark:bg-[#050505] transition-colors border-t border-gray-200/30 dark:border-white/5">
          <div className="container mx-auto max-w-5xl">
            <ScrollReveal delay={100}>
              <div className="text-center mb-16">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-md">Workflow</span>
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-4 mb-2">Simplicity in Steps</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Get set up and verified inside Eden in a few short steps.</p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <ScrollReveal delay={200} className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Role Registration</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  Join Loveworld Arts Academy, enroll in the Dance Faculty, and select your campus zone.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={300} className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">2</div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Guided Onboarding Tour</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  Take the dynamic tutorial corresponding to your specific access level to master the environment instantly.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={400} className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">3</div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Active Collaboration</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  Participate in schedules, broadcast targeted zone alerts, complete projects, and track progress logs.
                </p>
              </ScrollReveal>

            </div>
          </div>
        </section>

        {/* WHY CHOOSE EDEN (MINIMALIST GRAPHIC CAROUSEL OR MATRIX) */}
        <section className="py-24 px-4 sm:px-8 border-t border-gray-200/30 dark:border-white/5 transition-colors">
          <div className="container mx-auto max-w-5xl">
            <div className="bg-white/40 dark:bg-[#070707]/40 backdrop-blur-xl border border-gray-250/50 dark:border-white/5 rounded-[2.5rem] p-8 sm:p-16 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-12">
              
              <ScrollReveal delay={100} className="max-w-md">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-md">Why Eden</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-4 mb-4">Enterprise Grade Security & Partition</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light mb-6">
                  Eden ensures strict separation between academy disciplines. Your faculty operations are strictly isolated on the database using row-level policies, ensuring total security and containment.
                </p>
                <div className="flex items-center space-x-6 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <Shield size={14} className="text-emerald-500" />
                    <span>RLS Protected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe size={14} className="text-emerald-500" />
                    <span>Multi-tenant</span>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200} className="w-full max-w-xs space-y-3 font-semibold text-xs">
                <div className="p-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/30 dark:border-white/5 rounded-2xl flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-650 dark:text-emerald-400">✓</div>
                  <span className="text-gray-800 dark:text-gray-200 font-bold">100% Data Confidentiality</span>
                </div>
                <div className="p-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/30 dark:border-white/5 rounded-2xl flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-650 dark:text-emerald-400">✓</div>
                  <span className="text-gray-800 dark:text-gray-200 font-bold">Lagos Zone Multi-campus Registry</span>
                </div>
                <div className="p-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/30 dark:border-white/5 rounded-2xl flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-650 dark:text-emerald-400">✓</div>
                  <span className="text-gray-800 dark:text-gray-200 font-bold">High performance dark UI mode</span>
                </div>
              </ScrollReveal>

            </div>
          </div>
        </section>

        {/* PRICING & ROLE ACCESS MATRIX (Hidden) */}
        {false && (
        <section id="pricing" className="py-24 px-4 sm:px-8 bg-gray-50/50 dark:bg-[#050505] transition-colors border-t border-gray-200/30 dark:border-white/5">
          <div className="container mx-auto max-w-5xl">
            <ScrollReveal delay={100}>
              <div className="text-center mb-16">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-md">Academy Rollout</span>
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-4 mb-2">100% Free & Open Access</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-light max-w-md mx-auto">
                  Eden is fully subsidized for the Loveworld Art Academy. Explore the tailored capabilities unlocked for each role immediately upon signup.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Plan 1: Student Access */}
              <ScrollReveal delay={200} className="bg-white/50 dark:bg-black/35 border border-gray-200/50 dark:border-white/5 p-6 rounded-3xl flex flex-col justify-between h-full shadow-sm">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Academy Student</h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1 font-bold">100% Free & Complimentary</p>
                  <div className="my-6">
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-white">Free</span>
                    <span className="text-xs text-gray-500 font-light"> / permanent access</span>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 font-light">
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Watch video and text lessons</li>
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Class check-ins with proof uploads</li>
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Targeted announcements & alerts</li>
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Dynamic interactive onboarding tour</li>
                  </ul>
                </div>
                <div className="mt-8">
                  <Link href="/register" className="w-full block">
                    <Button variant="outline" className="w-full text-xs font-bold py-3 border-gray-250 dark:border-white/5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200">Join as Student</Button>
                  </Link>
                </div>
              </ScrollReveal>

              {/* Plan 2: Coordinator Command */}
              <ScrollReveal delay={300} className="bg-white dark:bg-[#070707] border-2 border-emerald-500/50 p-6 rounded-3xl flex flex-col justify-between h-full relative shadow-2xl">
                <div className="absolute top-3 right-3 text-[8px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Core Roster</div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Campus Coordinator</h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1 font-bold">100% Free & Complimentary</p>
                  <div className="my-6">
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-white">Free</span>
                    <span className="text-xs text-gray-500 font-light"> / staff registration</span>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 font-light">
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Targeted announcements broadcasting</li>
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Interactive course calendar coordinating</li>
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Student check-in reviews & proof marking</li>
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Multi-campus Zone select registry</li>
                  </ul>
                </div>
                <div className="mt-8">
                  <Link href="/register" className="w-full block">
                    <Button className="w-full text-xs font-bold py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 border-0">Join as Coordinator</Button>
                  </Link>
                </div>
              </ScrollReveal>

              {/* Plan 3: Zone Administration */}
              <ScrollReveal delay={400} className="bg-white/50 dark:bg-black/35 border border-gray-200/50 dark:border-white/5 p-6 rounded-3xl flex flex-col justify-between h-full shadow-sm">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Faculty Admin</h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1 font-bold">100% Free & Complimentary</p>
                  <div className="my-6">
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-white">Free</span>
                    <span className="text-xs text-gray-500 font-light"> / full governance</span>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 font-light">
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Complete multi-tenant faculty isolation</li>
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Global coordinator & student registrations</li>
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Edit & delete anything in the portal</li>
                    <li className="flex items-center"><Check size={12} className="text-emerald-500 mr-2 shrink-0" /> Advanced data metrics & security logs</li>
                  </ul>
                </div>
                <div className="mt-8">
                  <Link href="/register" className="w-full block">
                    <Button variant="outline" className="w-full text-xs font-bold py-3 border-gray-250 dark:border-white/5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200">Register Faculty Admin</Button>
                  </Link>
                </div>
              </ScrollReveal>

            </div>
          </div>
        </section>
        )}

        {/* FREQUENTLY ASKED QUESTIONS (FAQ ACCORDIONS) */}
        <section id="faq" className="py-24 px-4 sm:px-8 border-t border-gray-200/30 dark:border-white/5 transition-colors">
          <div className="container mx-auto max-w-4xl">
            <ScrollReveal delay={100}>
              <div className="text-center mb-16">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-md">FAQ</span>
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-4 mb-2">Common Inquiries</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Get quick answers regarding the Eden creative workspace.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200} className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index}
                    className="bg-white/50 dark:bg-black/35 border border-gray-200/50 dark:border-white/5 rounded-2xl overflow-hidden transition-all shadow-sm"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-200 focus:outline-none"
                    >
                      <span className="pr-4">{faq.q}</span>
                      <span className={`transform transition-transform text-emerald-500 ${isOpen ? "rotate-90" : ""}`}>&rarr;</span>
                    </button>
                    
                    {isOpen && (
                      <div className="p-5 pt-0 border-t border-gray-150 dark:border-white/5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed leading-normal animate-in slide-in-from-top-1 duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </ScrollReveal>
          </div>
        </section>

        {/* CTA CONVERSION BOOSTER */}
        <section className="py-24 px-4 sm:px-8 border-t border-gray-200/30 dark:border-white/5 transition-colors">
          <div className="container mx-auto max-w-5xl">
            <ScrollReveal>
              <div className="bg-white/40 dark:bg-[#070707]/40 backdrop-blur-xl border border-gray-250/50 dark:border-white/5 rounded-[2.5rem] p-10 md:p-20 text-center overflow-hidden relative shadow-2xl">
                {/* Visual glows */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white leading-tight">Elevate Creative Governance Today</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-10 max-w-xl mx-auto font-light leading-relaxed">
                    Join the Loveworld Art Academy digital ecosystem today. Experience structured, high-performance administrative separation first hand.
                  </p>
                  <Link href="/register">
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 px-10 text-sm shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105 rounded-2xl border-0">
                      Create a Workspace Account
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}
