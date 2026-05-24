"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserDropdown } from "@/components/layout/user-dropdown";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NotificationsDropdown } from "@/components/dashboard/notifications-dropdown";
import { OnboardingTour } from "@/components/dashboard/onboarding-tour";

interface DashboardShellProps {
  children: React.ReactNode;
  facultyName: string;
  facultySlug: string;
  role: string;
  userEmail: string;
  userName?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  completedTour?: boolean;
}

export function DashboardShell({ children, facultyName, facultySlug, role, userEmail, userName, avatarUrl, isVerified, completedTour }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Navigation Items with explicit roles
  const navItems = [
    { name: "Overview", href: `/dashboard/${facultySlug}`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>, roles: ["STUDENT", "COORDINATOR", "ADMIN"] },
    { name: "My Profile", href: `/dashboard/${facultySlug}/profile`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, roles: ["STUDENT", "COORDINATOR", "ADMIN"] },
    { name: "Events", href: `/dashboard/${facultySlug}/events`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, roles: ["STUDENT", "COORDINATOR", "ADMIN"] },
    { name: "Calendar", href: `/dashboard/${facultySlug}/calendar`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/><path d="M15 21V9"/></svg>, roles: ["STUDENT", "COORDINATOR", "ADMIN"] },
    { name: "Courses", href: `/dashboard/${facultySlug}/courses`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>, roles: ["STUDENT", "COORDINATOR", "ADMIN"] },
    { name: "Announcements", href: `/dashboard/${facultySlug}/announcements`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 12a11.05 11.05 0 0 0-22 0V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H3a9 9 0 0 1 18 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2Z"/></svg>, roles: ["STUDENT", "COORDINATOR", "ADMIN"] },
    { name: "General Attendance", href: `/dashboard/${facultySlug}/attendance`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, roles: ["COORDINATOR", "ADMIN"] },
    { name: "HQ Leaders", href: `/dashboard/${facultySlug}/hq-leaders`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"/></svg>, roles: ["STUDENT", "COORDINATOR", "ADMIN"] },
    { name: "Students", href: `/dashboard/${facultySlug}/students`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, roles: ["COORDINATOR", "ADMIN"] },
    { name: "Coordinators", href: `/dashboard/${facultySlug}/coordinators`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, roles: ["ADMIN"] },
    { name: "User Management", href: `/dashboard/${facultySlug}/users`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, roles: ["ADMIN"] },
    { name: "Settings", href: `/dashboard/${facultySlug}/settings`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>, roles: ["STUDENT", "COORDINATOR", "ADMIN"] },
  ];

  return (
    <div className="flex h-screen bg-[#fcfdfd] dark:bg-[#030303] transition-colors relative overflow-hidden">
      {/* Onboarding Tour Interactive Layer */}
      <OnboardingTour role={role} facultySlug={facultySlug} initialCompletedTour={completedTour} isVerified={isVerified} />

      {/* Mobile Sidebar Overlay (Glassmorphism) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Glassmorphism) */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white/70 dark:bg-[#080808]/70 backdrop-blur-2xl border-r border-gray-200/50 dark:border-white/5 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 lg:static lg:flex-shrink-0 shadow-2xl lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center space-x-2">
            <Logo className="h-6 w-auto" />
            <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase shrink-0">
              Beta
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        {/* Context Area */}
        <div className="p-6">
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
            Workspace
          </div>
          <div className="font-semibold text-gray-900 dark:text-white truncate text-lg tracking-tight">
            {facultyName}
          </div>
          <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mt-2 uppercase tracking-widest border border-emerald-500/20">
            {role}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-4">
          {navItems.filter(item => item.roles.includes(role)).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                id={`tour-${item.name.toLowerCase() === "my profile" ? "profile" : item.name.toLowerCase()}`}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-sm" 
                    : "text-gray-600 hover:bg-white dark:hover:bg-white/5 hover:shadow-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-transparent hover:border-gray-200/50 dark:hover:border-white/5"
                )}
              >
                <div className={cn(
                  "mr-3 transition-colors duration-200", 
                  isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400"
                )}>
                  {item.icon}
                </div>
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        {/* Footer Area (User & Theme) */}
        <div className="p-4 m-4 rounded-2xl border border-gray-200/50 dark:border-white/5 flex flex-col space-y-3 bg-white/50 dark:bg-black/20 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Theme</span>
            <ThemeToggle />
          </div>
          <div className="pt-3 border-t border-gray-200/50 dark:border-white/5 flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-300 dark:from-emerald-600 dark:to-emerald-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 text-xs font-medium text-gray-900 dark:text-gray-200 truncate" title={userEmail}>
              {userEmail}
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200/30 dark:border-white/5 flex items-center justify-center text-[9px] text-gray-400 dark:text-gray-500 font-light tracking-wide">
            Developed by <span className="font-semibold text-gray-600 dark:text-gray-300 ml-1">CreedTech</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle Decorative Background Blur Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/5 dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-lighten" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-400/5 dark:bg-blue-500/5 rounded-full blur-[80px] pointer-events-none mix-blend-multiply dark:mix-blend-lighten" />

        {/* Top Navbar (Glassmorphism) */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-gray-200/50 dark:border-white/5 bg-white/90 dark:bg-[#030303]/80 backdrop-blur-xl shrink-0 relative z-10 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="mr-4 lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-white/80 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 rounded-xl transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight hidden sm:block">
              {facultyName}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notifications Dropdown (Fully Dynamic & Realtime) */}
            <NotificationsDropdown facultySlug={facultySlug} />
            
            {/* User Profile Dropdown */}
            <UserDropdown 
              userEmail={userEmail} 
              userName={userName} 
              avatarUrl={avatarUrl} 
              facultySlug={facultySlug} 
              isVerified={isVerified}
            />
          </div>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-28 lg:pb-8 relative z-0">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>

        {/* Floating Bottom Tab Bar on Mobile */}
        <div className="lg:hidden fixed bottom-5 left-4 right-4 z-40 bg-white/80 dark:bg-[#08080c]/85 backdrop-blur-2xl border border-gray-200/50 dark:border-white/5 rounded-3xl px-4 py-2 shadow-2xl shadow-emerald-950/10 flex items-center justify-around">
          {/* Item 1: Courses */}
          <Link 
            href={`/dashboard/${facultySlug}/courses`}
            id="tour-courses"
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300",
              pathname === `/dashboard/${facultySlug}/courses` 
                ? "text-emerald-600 dark:text-emerald-400 scale-110" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            <span className="text-[9px] font-bold mt-1 tracking-tight">Courses</span>
          </Link>

          {/* Item 2: Events */}
          <Link 
            href={`/dashboard/${facultySlug}/events`}
            id="tour-events"
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300",
              pathname === `/dashboard/${facultySlug}/events` 
                ? "text-emerald-600 dark:text-emerald-400 scale-110" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span className="text-[9px] font-bold mt-1 tracking-tight">Events</span>
          </Link>

          {/* Item 3: Overview (Center prominent Home base!) */}
          <Link 
            href={`/dashboard/${facultySlug}`}
            id="tour-overview"
            className={cn(
              "flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-650 text-white rounded-full transition-all duration-300 shadow-lg shadow-emerald-500/20 -translate-y-4 border-4 border-[#fcfdfd] dark:border-[#030303] scale-110",
              pathname === `/dashboard/${facultySlug}` 
                ? "shadow-emerald-500/40 ring-4 ring-emerald-500/20 scale-125" 
                : "opacity-95"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </Link>

          {/* Item 4: Announcements */}
          <Link 
            href={`/dashboard/${facultySlug}/announcements`}
            id="tour-messages"
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300",
              pathname === `/dashboard/${facultySlug}/announcements` 
                ? "text-emerald-600 dark:text-emerald-400 scale-110" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 12a11.05 11.05 0 0 0-22 0V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H3a9 9 0 0 1 18 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2Z"/></svg>
            <span className="text-[9px] font-bold mt-1 tracking-tight">Notices</span>
          </Link>

          {/* Item 5: Profile */}
          <Link 
            href={`/dashboard/${facultySlug}/profile`}
            id="tour-profile"
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300",
              pathname === `/dashboard/${facultySlug}/profile` 
                ? "text-emerald-600 dark:text-emerald-400 scale-110" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="text-[9px] font-bold mt-1 tracking-tight">Profile</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
