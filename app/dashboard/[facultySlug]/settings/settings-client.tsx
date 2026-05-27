"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { 
  User, Shield, Bell, Moon, Sun, Laptop, Users, Trash2, 
  HelpCircle, Settings, Check, Save, Sparkles, RefreshCw, Volume2 
} from "lucide-react";
import { updateProfile, updateFaculty, updateUserRoleInFaculty } from "./actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FacultyMember {
  user_id: string;
  role: "ADMIN" | "COORDINATOR" | "STUDENT";
  user: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

interface SettingsClientProps {
  facultyId: string;
  facultyName: string;
  facultySlug: string;
  role: string;
  currentUser: {
    id: string;
    fullName: string;
    phone: string;
    gender: string;
    kingschatHandle: string;
    campusZone: string;
    dateOfBirth: string;
    bio: string;
  };
  members: FacultyMember[];
}

type TabType = 
  | "profile" 
  | "faculty" 
  | "notifications" 
  | "appearance" 
  | "security" 
  | "roles" 
  | "account";

export function SettingsClient({ 
  facultyId, 
  facultyName, 
  facultySlug, 
  role, 
  currentUser, 
  members: initialMembers 
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [members, setMembers] = useState<FacultyMember[]>(initialMembers);
  const isAdmin = role === "ADMIN";

  // State Profile
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone);
  const [gender, setGender] = useState(currentUser.gender);
  const [kingschatHandle, setKingschatHandle] = useState(currentUser.kingschatHandle);
  const [campusZone, setCampusZone] = useState(currentUser.campusZone);
  const [dateOfBirth, setDateOfBirth] = useState(currentUser.dateOfBirth);
  const [bio, setBio] = useState(currentUser.bio);
  
  // State Faculty
  const [facName, setFacName] = useState(facultyName);

  // State Notifications Preferences
  const [emailNotif, setEmailNotif] = useState(true);
  const [announcementNotif, setAnnouncementNotif] = useState(true);
  const [soundNotif, setSoundNotif] = useState(true);

  // General Status States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const tabs: { id: TabType; label: string; icon: any; roles?: string[] }[] = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "faculty", label: "Faculty Settings", icon: Settings, roles: ["ADMIN"] },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Moon },
    { id: "security", label: "Security & 2FA", icon: Shield },
    { id: "roles", label: "Roles & Permissions", icon: Users, roles: ["ADMIN"] },
    { id: "account", label: "Account Options", icon: Trash2 },
  ];

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await updateProfile({
        fullName,
        phone,
        gender,
        kingschatHandle,
        campusZone,
        dateOfBirth,
        bio
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update profile settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFacultySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await updateFaculty(facultyId, facName);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update faculty settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: "ADMIN" | "COORDINATOR" | "STUDENT") => {
    try {
      await updateUserRoleInFaculty(facultyId, targetUserId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === targetUserId ? { ...m, role: newRole } : m))
      );
      toast.success("Role updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    }
  };

  // Notification Sound Generator (Web Audio API)
  const testNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6
      osc1.frequency.exponentialRampToValueAtTime(1567.98, ctx.currentTime + 0.08); // G6
      osc1.connect(masterGain);

      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.connect(masterGain);

      masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4 relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin & Portal Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-light leading-relaxed">
          Manage your personal profile, customize notifications, tweak themes, and manage faculty roles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Side: Frosted Glass Tab Sidebar */}
        <div className="col-span-1 bg-white/40 dark:bg-[#080808]/40 backdrop-blur-2xl border border-gray-200/50 dark:border-white/5 p-4 rounded-3xl space-y-1 shadow-lg">
          {tabs.map((tab) => {
            // Render only if tab doesn't specify roles OR if user matches specified roles
            if (tab.roles && !tab.roles.includes(role)) return null;
            
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSaveSuccess(false);
                  setSaveError(null);
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
                  isTabActive 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                )}
              >
                <Icon size={18} className={cn("shrink-0", isTabActive ? "text-white" : "text-gray-400 dark:text-gray-500")} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab Panel Content (Glassmorphic Container) */}
        <div className="col-span-1 lg:col-span-3 bg-white/60 dark:bg-[#080808]/60 backdrop-blur-3xl border border-gray-200/50 dark:border-white/5 p-8 md:p-10 rounded-[2rem] shadow-2xl relative">
          
          {/* Ornamental corner gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Feedback states */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center animate-in fade-in duration-300">
              <Check className="w-4 h-4 mr-2" />
              <span>Settings updated successfully!</span>
            </div>
          )}
          {saveError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center animate-in fade-in duration-300">
              <HelpCircle className="w-4 h-4 mr-2" />
              <span>{saveError}</span>
            </div>
          )}

          {/* 1. MY PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="text-emerald-500" /> Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold text-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-light text-gray-800 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-gray-800 dark:text-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">KingsChat Handle</label>
                  <input
                    type="text"
                    value={kingschatHandle}
                    onChange={(e) => setKingschatHandle(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-light text-gray-800 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Campus Zone</label>
                  <input
                    type="text"
                    value={campusZone}
                    onChange={(e) => setCampusZone(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-light text-gray-800 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Short Biography</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-light text-gray-800 dark:text-white min-h-[100px] leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all duration-300 shadow-xl shadow-emerald-500/10 inline-flex items-center"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* 2. FACULTY SETTINGS */}
          {activeTab === "faculty" && isAdmin && (
            <form onSubmit={handleFacultySave} className="space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="text-emerald-500" /> Faculty Administration
              </h2>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-2xl text-xs leading-relaxed font-semibold">
                Note: Renaming the faculty will update it across all users, courses, and event profiles instantly. Be careful when updating tenant metadata.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Faculty Name</label>
                <input
                  type="text"
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold text-gray-800 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all duration-300 shadow-xl shadow-emerald-500/10 inline-flex items-center"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save Faculty Info
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* 3. NOTIFICATION PREFERENCES */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="text-emerald-500" /> Notifications & Sound
              </h2>

              <p className="text-sm font-light text-gray-500 dark:text-gray-400 leading-relaxed">
                Control the channels through which you receive updates and alerts inside the Eden platform.
              </p>

              <div className="divide-y divide-gray-100 dark:divide-white/5">
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-950 dark:text-gray-50">Announcement Notifications</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Get alerted when admins post new messages.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={announcementNotif}
                    onChange={(e) => setAnnouncementNotif(e.target.checked)}
                    className="w-10 h-5 rounded-full text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                </div>

                <div className="py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-950 dark:text-gray-50">Email Notifications</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Receive weekly reports and updates in your mailbox.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="w-10 h-5 rounded-full text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                </div>

                <div className="py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-950 dark:text-gray-50">Notification Sound</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">
                      Play a subtle, non-intrusive synthesized ping when a new notification arrives.
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={testNotificationSound}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors flex items-center space-x-1.5 text-xs font-bold"
                    >
                      <Volume2 size={14} />
                      <span>Test Sound</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={soundNotif}
                      onChange={(e) => setSoundNotif(e.target.checked)}
                      className="w-10 h-5 rounded-full text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Sound Best Practices</span>
                  Browsers protect you from sudden autoplay sound. By clicking the "Test Sound" button, you authorize the browser to play subtle acoustic alerts when announcements appear.
                </div>
              </div>
            </div>
          )}

          {/* 4. APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Moon className="text-emerald-500" /> Interface Styling
              </h2>

              <p className="text-sm font-light text-gray-500 dark:text-gray-400 leading-relaxed">
                Personalize how the dashboard looks. Toggle between light mode, dark mode, or follow system default settings.
              </p>

              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => document.documentElement.classList.remove("dark")}
                  className="p-6 bg-white dark:bg-white/5 border border-emerald-500/20 rounded-2xl hover:border-emerald-500 flex flex-col items-center justify-center space-y-3 transition-all"
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <span className="text-xs font-bold">Light</span>
                </button>
                <button 
                  onClick={() => document.documentElement.classList.add("dark")}
                  className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl hover:border-emerald-500 flex flex-col items-center justify-center space-y-3 transition-all"
                >
                  <Moon className="w-6 h-6 text-indigo-400" />
                  <span className="text-xs font-bold">Dark</span>
                </button>
                <button 
                  onClick={() => {
                    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                    if (isDark) document.documentElement.classList.add("dark");
                    else document.documentElement.classList.remove("dark");
                  }}
                  className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl hover:border-emerald-500 flex flex-col items-center justify-center space-y-3 transition-all"
                >
                  <Laptop className="w-6 h-6 text-gray-500" />
                  <span className="text-xs font-bold">System</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="text-emerald-500" /> Security & Protection
              </h2>

              <p className="text-sm font-light text-gray-500 dark:text-gray-400 leading-relaxed">
                Protect your account credentials by resetting passwords or setting up Multi-Factor Authentication.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Password Update</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Reset your access password securely.</p>
                  </div>
                  <button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-xl text-xs font-bold transition-all shadow-md">
                    Reset Password
                  </button>
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Multi-Factor Authentication (MFA)</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Add an extra layer of protection to your profile.</p>
                  </div>
                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/5 transition-all">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. ROLE & PERMISSION MANAGEMENT */}
          {activeTab === "roles" && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="text-emerald-500" /> Roles & Permissions
              </h2>

              <p className="text-sm font-light text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                Administrate user permissions. Change user roles between **Admin**, **Coordinator**, or **Student** instantly.
              </p>

              {/* Members Table */}
              <div className="bg-gray-50/50 dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-100/50 dark:bg-white/[0.02] border-b border-gray-150 dark:border-white/5 grid grid-cols-12 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <div className="col-span-6">Member Profile</div>
                  <div className="col-span-6 text-right">Assigned Role</div>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {members.map((member) => (
                    <div key={member.user_id} className="p-4 grid grid-cols-12 items-center gap-4 hover:bg-white/40 dark:hover:bg-white/[0.01] transition-colors">
                      {/* Left side profile info */}
                      <div className="col-span-6 flex items-center space-x-3 min-w-0">
                        {member.user?.avatar_url ? (
                          <img src={member.user.avatar_url} alt="" className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shadow-inner shrink-0">
                            {member.user?.full_name?.charAt(0) || "U"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{member.user?.full_name || "Unknown User"}</p>
                          <p className="text-[10px] text-gray-400 truncate">{member.user?.email || "No email"}</p>
                        </div>
                      </div>

                      {/* Right side role assignment dropdown */}
                      <div className="col-span-6 text-right">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value as any)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none transition-all cursor-pointer bg-white dark:bg-black",
                            member.role === "ADMIN" && "border-rose-500/20 text-rose-500 bg-rose-500/5",
                            member.role === "COORDINATOR" && "border-blue-500/20 text-blue-500 bg-blue-500/5",
                            member.role === "STUDENT" && "border-emerald-500/20 text-emerald-500 bg-emerald-500/5"
                          )}
                          disabled={member.user_id === currentUser.id} // Don't let users lock themselves out
                          title={member.user_id === currentUser.id ? "Cannot change your own role" : ""}
                        >
                          <option value="STUDENT">Student</option>
                          <option value="COORDINATOR">Coordinator</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. ACCOUNT OPTIONS */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-red-500 flex items-center gap-2">
                <Trash2 className="text-red-500" /> Account Management
              </h2>

              <p className="text-sm font-light text-gray-500 dark:text-gray-400 leading-relaxed">
                Danger Zone options. Perform tasks regarding your account lifecycle.
              </p>

              <div className="space-y-4">
                <div className="p-5 bg-gray-50/50 dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-2xl flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Export Information</h4>
                    <p className="text-xs text-gray-400 font-light mt-0.5">Download a structured copy of your Eden profile details.</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-250 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all text-gray-700 dark:text-gray-300">
                    Export Data
                  </button>
                </div>

                <div className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-rose-500">Deactivate Account</h4>
                    <p className="text-xs text-rose-500/80 font-light mt-0.5">Permanently delete your profile and faculty records.</p>
                  </div>
                  <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/10">
                    Delete Profile
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
