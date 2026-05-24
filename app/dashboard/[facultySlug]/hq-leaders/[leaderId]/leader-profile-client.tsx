"use client";

import { useState } from "react";
import { parseCampuses } from "@/lib/campuses";
import { LEADERSHIP_ROLES } from "@/lib/leadership-roles";
import { createClient } from "@/services/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface LeaderMetadata {
  responsibilities?: string;
  vision?: string;
  oversight?: string;
  unit?: string;
  yearsOfService?: number;
  experience?: string;
  skills?: string[];
  achievements?: string[];
  focusAreas?: string[];
  currentAssignments?: string[];
}

interface LeaderProfile {
  campusZone: string;
  gender: string;
  phone: string;
  kingschat: string;
  bio: string;
  isVerified: boolean;
  leadershipRole: string;
  metadata: LeaderMetadata;
}

interface FacultyLeader {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: "ADMIN" | "COORDINATOR" | "STUDENT";
  profile: LeaderProfile;
}

interface LeaderProfileClientProps {
  leader: FacultyLeader;
  viewerRole: string;
  facultySlug: string;
  facultyId: string;
  facultyName: string;
}

export function LeaderProfileClient({ leader, viewerRole, facultySlug, facultyId, facultyName }: LeaderProfileClientProps) {
  const supabase = createClient();
  const router = useRouter();

  // Mode: View vs Edit
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State variables
  const [fullName, setFullName] = useState(leader.fullName);
  const [phone, setPhone] = useState(leader.profile.phone);
  const [kingschat, setKingschat] = useState(leader.profile.kingschat);
  const [bio, setBio] = useState(leader.profile.bio);
  
  const [selectedRoleOption, setSelectedRoleOption] = useState(() => {
    return LEADERSHIP_ROLES.includes(leader.profile.leadershipRole as any) ? leader.profile.leadershipRole : "CUSTOM";
  });
  const [isCustomRole, setIsCustomRole] = useState(() => {
    return !LEADERSHIP_ROLES.includes(leader.profile.leadershipRole as any);
  });
  const [customRoleText, setCustomRoleText] = useState(leader.profile.leadershipRole);

  // Metadata form states
  const [responsibilities, setResponsibilities] = useState(leader.profile.metadata.responsibilities || "");
  const [vision, setVision] = useState(leader.profile.metadata.vision || "");
  const [oversight, setOversight] = useState(leader.profile.metadata.oversight || "");
  const [unit, setUnit] = useState(leader.profile.metadata.unit || "");
  const [yearsOfService, setYearsOfService] = useState(leader.profile.metadata.yearsOfService || 0);
  const [experience, setExperience] = useState(leader.profile.metadata.experience || "");

  // Scalable Array states
  const [skills, setSkills] = useState<string[]>(leader.profile.metadata.skills || []);
  const [newSkill, setNewSkill] = useState("");

  const [achievements, setAchievements] = useState<string[]>(leader.profile.metadata.achievements || []);
  const [newAchievement, setNewAchievement] = useState("");

  const [focusAreas, setFocusAreas] = useState<string[]>(leader.profile.metadata.focusAreas || []);
  const [newFocusArea, setNewFocusArea] = useState("");

  const [assignments, setAssignments] = useState<string[]>(leader.profile.metadata.currentAssignments || []);
  const [newAssignment, setNewAssignment] = useState("");

  // Handles adding item to lists
  const handleAddListItem = (item: string, setter: React.Dispatch<React.SetStateAction<string[]>>, itemClearer: () => void) => {
    if (!item.trim()) return;
    setter(prev => [...prev, item.trim()]);
    itemClearer();
  };

  const handleRemoveListItem = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter((_, idx) => idx !== index));
  };

  // Save changes to database
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const finalRole = isCustomRole ? customRoleText : selectedRoleOption;
    if (!finalRole) {
      setMessage({ type: "error", text: "Leadership role is required." });
      setLoading(false);
      return;
    }

    try {
      // 1. Update basic user table (full_name)
      await supabase.from("users").update({ full_name: fullName }).eq("id", leader.id);

      // 2. Build metadata JSON structure
      const metadataPayload: LeaderMetadata = {
        responsibilities,
        vision,
        oversight,
        unit,
        yearsOfService: Number(yearsOfService),
        experience,
        skills,
        achievements,
        focusAreas,
        currentAssignments: assignments,
      };

      // 3. Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          phone,
          kingschat_handle: kingschat,
          bio,
          leadership_role: finalRole,
          leadership_metadata: metadataPayload as any, // Cast to any to fit JSON typing
        })
        .eq("id", leader.id);

      if (profileError) throw profileError;

      setMessage({ type: "success", text: "Leadership profile updated successfully!" });
      setTimeout(() => {
        setIsEditing(false);
        setMessage(null);
        router.refresh();
      }, 1200);

    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to save leadership details." });
    } finally {
      setLoading(false);
    }
  };

  const isUserAdmin = viewerRole === "ADMIN";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Dynamic Navigation & Title controls */}
      <div className="flex items-center justify-between gap-4">
        <a 
          href={`/dashboard/${facultySlug}/hq-leaders`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#0a0a0a] hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-2xl text-xs font-bold text-gray-650 dark:text-gray-400 transition-colors shadow-sm"
        >
          &larr; Back to Directory
        </a>

        {/* Admin Edit Trigger */}
        {isUserAdmin && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5",
              isEditing 
                ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10"
            )}
          >
            {isEditing ? "✕ Cancel Editing" : "📝 Edit Profile Properties"}
          </button>
        )}
      </div>

      {message && (
        <div className={cn("p-4 rounded-2xl text-xs font-bold", message.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-red-50 text-red-750 dark:bg-red-950/20 dark:text-red-450")}>
          {message.text}
        </div>
      )}

      {/* RENDER VIEW MODE */}
      {!isEditing ? (
        <div className="space-y-8">
          
          {/* SECTION A: PREMIUM HERO HEADER */}
          <div className="relative bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-10 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8 overflow-hidden">
            {/* Glowing Accent */}
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Leader Portrait */}
            <div className="w-36 h-36 rounded-3xl bg-gray-100 dark:bg-black overflow-hidden border border-gray-200/60 dark:border-white/10 shrink-0 shadow-lg relative flex items-center justify-center text-4xl font-extrabold text-emerald-600 dark:text-emerald-450">
              {leader.avatarUrl ? (
                <img src={leader.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                leader.fullName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Hero Main details */}
            <div className="flex-1 space-y-4 text-center md:text-left min-w-0">
              <div className="space-y-2">
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
                    {leader.fullName}
                  </h2>
                  <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest leading-none mt-1">
                    HQ LEADER
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  {/* Dynamic Gold glowing title */}
                  <span className="inline-flex bg-gradient-to-tr from-amber-500/10 to-amber-600/5 border border-amber-500/20 dark:border-amber-500/10 px-3 py-1 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-450 tracking-wider shadow-inner uppercase">
                    👑 {leader.profile.leadershipRole}
                  </span>
                  
                  {leader.profile.campusZone && (
                    <span className="inline-flex bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 px-3 py-1 rounded-xl text-xs font-semibold text-gray-550 dark:text-gray-300">
                      📍 {parseCampuses(leader.profile.campusZone).join(", ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Bio Block */}
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light max-w-3xl">
                {leader.profile.bio || "This leader guides departments and students of Eden with absolute visual excellence, spiritual devotion, and deep creative mandate."}
              </p>
            </div>
          </div>

          {/* SECTION B: LEADERSHIP PILLARS */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Leadership Vision */}
            <div className="md:col-span-2 bg-gradient-to-tr from-emerald-500/[0.03] to-teal-500/[0.03] backdrop-blur-xl border border-emerald-500/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-sm">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-3">
                <span className="text-3xl select-none opacity-50 block leading-none font-serif">“</span>
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest">Leadership Vision & Mandate</h4>
                <p className="text-base font-light text-gray-800 dark:text-gray-250 italic leading-relaxed pt-2">
                  {responsibilities || "To pioneer artistic structures, establish technical mastery within learning cadres, and mentor creative stars inside the Loveworld Arts Academy."}
                </p>
              </div>
              <div className="pt-4 border-t border-emerald-500/10 flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                <span>Faculty: {facultyName}</span>
                <span>Active Oversight</span>
              </div>
            </div>

            {/* General Oversight Details */}
            <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block pb-2 border-b border-gray-250/20 dark:border-white/5">Details of Service</h4>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-150/15 dark:border-white/5">
                    <span className="text-gray-450">Department/Unit</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{unit || "Choreography & Dance Team"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-150/15 dark:border-white/5">
                    <span className="text-gray-450">Area of Oversight</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{oversight || "National Dance Faculty"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-150/15 dark:border-white/5">
                    <span className="text-gray-450">Years of Service</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{yearsOfService} Years</span>
                  </div>
                </div>
              </div>

              {/* Social contact tags */}
              <div className="pt-6">
                <div className="flex gap-2">
                  <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/15 px-2.5 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider block text-center flex-1">
                    💬 KingsChat: @{leader.profile.kingschat || "handle"}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* SECTION C: PROFESSIONAL & PORTFOLIO */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Skills & Specialties */}
            <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <h4 className="text-xs font-bold text-gray-450 dark:text-gray-500 uppercase tracking-widest block pb-2 border-b border-gray-250/20 dark:border-white/5">Skills & Area Focus</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Specialties</span>
                  <div className="flex flex-wrap gap-2">
                    {skills.length === 0 ? (
                      <span className="text-xs text-gray-450 italic">None logged</span>
                    ) : (
                      skills.map((s, idx) => (
                        <span key={idx} className="bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border border-emerald-500/15 px-2.5 py-1 rounded-xl text-xs font-semibold">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Leadership Focus Areas</span>
                  <div className="flex flex-wrap gap-2">
                    {focusAreas.length === 0 ? (
                      <span className="text-xs text-gray-450 italic">None logged</span>
                    ) : (
                      focusAreas.map((f, idx) => (
                        <span key={idx} className="bg-blue-500/5 text-blue-700 dark:text-blue-400 border border-blue-500/15 px-2.5 py-1 rounded-xl text-xs font-semibold">
                          {f}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements & Assignments */}
            <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <h4 className="text-xs font-bold text-gray-450 dark:text-gray-500 uppercase tracking-widest block pb-2 border-b border-gray-250/20 dark:border-white/5">Achievements & Projects</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Certifications & Milestones</span>
                  <div className="space-y-2">
                    {achievements.length === 0 ? (
                      <span className="text-xs text-gray-450 italic">None logged</span>
                    ) : (
                      achievements.map((a, idx) => (
                        <div key={idx} className="flex items-center text-xs text-gray-700 dark:text-gray-300 font-medium">
                          <span className="mr-2">🏆</span> {a}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Current Faculty Assignments</span>
                  <div className="space-y-2">
                    {assignments.length === 0 ? (
                      <span className="text-xs text-gray-450 italic">None logged</span>
                    ) : (
                      assignments.map((as, idx) => (
                        <div key={idx} className="flex items-center text-xs text-gray-700 dark:text-gray-300 font-medium">
                          <span className="mr-2 text-emerald-500">✓</span> {as}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* RENDER EDIT MODE (INLINE SaaS FORM EDITOR) */
        <form onSubmit={handleSaveProfile} className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-md space-y-8 animate-in fade-in duration-300">
          
          {/* Header Indicator */}
          <div className="border-b border-gray-200/50 dark:border-white/5 pb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Leader Profile Panel</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Authorized admins can alter leadervision, portfolios, and contact properties below.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-250/50 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white font-medium"
              />
            </div>

            {/* Predefined select position */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Leadership Role</label>
              <select
                value={selectedRoleOption}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedRoleOption(val);
                  if (val === "CUSTOM") {
                    setIsCustomRole(true);
                  } else {
                    setIsCustomRole(false);
                    setCustomRoleText(val);
                  }
                }}
                className="w-full bg-white dark:bg-black border border-gray-250/50 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white"
              >
                {LEADERSHIP_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
                <option value="CUSTOM">Custom Position (Scalable)</option>
              </select>
            </div>

            {/* Custom role conditional input */}
            {isCustomRole && (
              <div className="space-y-2 sm:col-span-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Custom Leadership Role Title</label>
                <input 
                  type="text" 
                  value={customRoleText}
                  onChange={e => setCustomRoleText(e.target.value)}
                  placeholder="Enter dynamic position title..."
                  className="w-full bg-white dark:bg-black border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white font-semibold"
                />
              </div>
            )}

            {/* Biography */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Short Biography</label>
              <textarea 
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={500}
                className="w-full bg-white dark:bg-black border border-gray-250/50 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none min-h-[100px] text-gray-900 dark:text-white"
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Oversight Department</label>
              <input 
                type="text" 
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="E.g., Senior Choreography Unit"
                className="w-full bg-white dark:bg-black border border-gray-250/50 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white font-medium"
              />
            </div>

            {/* Area of Oversight */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Area of Oversight</label>
              <input 
                type="text" 
                value={oversight}
                onChange={e => setOversight(e.target.value)}
                placeholder="E.g., National Creative Arts Division"
                className="w-full bg-white dark:bg-black border border-gray-250/50 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white font-medium"
              />
            </div>

            {/* Years of Service */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Years of Leadership Service</label>
              <input 
                type="number" 
                value={yearsOfService}
                onChange={e => setYearsOfService(Number(e.target.value))}
                className="w-full bg-white dark:bg-black border border-gray-250/50 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white font-medium"
              />
            </div>

            {/* KingsChat */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">KingsChat Username</label>
              <input 
                type="text" 
                value={kingschat}
                onChange={e => setKingschat(e.target.value.replace("@", ""))}
                placeholder="username"
                className="w-full bg-white dark:bg-black border border-gray-250/50 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white font-medium"
              />
            </div>

            {/* Vision Mandate */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Leadership Vision Statement</label>
              <textarea 
                value={responsibilities}
                onChange={e => setResponsibilities(e.target.value)}
                placeholder="Enter vision mandate..."
                className="w-full bg-white dark:bg-black border border-gray-250/50 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none min-h-[80px] text-gray-900 dark:text-white"
              />
            </div>

          </div>

          {/* DYNAMIC SCALABLE ARRAY SECTIONS */}
          <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-gray-200/50 dark:border-white/5">
            
            {/* Skills & Specialties */}
            <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-5 rounded-2xl border border-gray-200/20 dark:border-white/5">
              <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block">Manage Skills & Specialties</label>
              
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  placeholder="E.g., Choreography, Stage Design"
                  className="flex-1 bg-white dark:bg-black border border-gray-200/50 dark:border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleAddListItem(newSkill, setSkills, () => setNewSkill(""))}
                  className="px-3 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((s, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-lg">
                    {s}
                    <button type="button" onClick={() => handleRemoveListItem(idx, setSkills)} className="text-[10px] text-rose-500 font-bold hover:text-rose-700">✕</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Focus Areas */}
            <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-5 rounded-2xl border border-gray-200/20 dark:border-white/5">
              <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block">Manage Focus Areas</label>
              
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newFocusArea}
                  onChange={e => setNewFocusArea(e.target.value)}
                  placeholder="E.g., Spiritual Discipline, Youth Grooming"
                  className="flex-1 bg-white dark:bg-black border border-gray-200/50 dark:border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleAddListItem(newFocusArea, setFocusAreas, () => setNewFocusArea(""))}
                  className="px-3 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {focusAreas.map((f, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-lg">
                    {f}
                    <button type="button" onClick={() => handleRemoveListItem(idx, setFocusAreas)} className="text-[10px] text-rose-500 font-bold hover:text-rose-700">✕</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-5 rounded-2xl border border-gray-200/20 dark:border-white/5">
              <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block">Manage Certifications / Achievements</label>
              
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newAchievement}
                  onChange={e => setNewAchievement(e.target.value)}
                  placeholder="E.g., National Choreography Award 2025"
                  className="flex-1 bg-white dark:bg-black border border-gray-200/50 dark:border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleAddListItem(newAchievement, setAchievements, () => setNewAchievement(""))}
                  className="px-3 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>

              <div className="space-y-1.5 pt-2">
                {achievements.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white dark:bg-black border border-gray-200/50 dark:border-white/5 p-2 rounded-xl text-xs">
                    <span className="truncate max-w-[240px]">🏆 {a}</span>
                    <button type="button" onClick={() => handleRemoveListItem(idx, setAchievements)} className="text-[10px] text-rose-500 font-bold hover:text-rose-700">✕ Remove</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignments */}
            <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-5 rounded-2xl border border-gray-200/20 dark:border-white/5">
              <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block">Manage Current Assignments</label>
              
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newAssignment}
                  onChange={e => setNewAssignment(e.target.value)}
                  placeholder="E.g., Overseeing Faculty Exhibition 2026"
                  className="flex-1 bg-white dark:bg-black border border-gray-200/50 dark:border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleAddListItem(newAssignment, setAssignments, () => setNewAssignment(""))}
                  className="px-3 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>

              <div className="space-y-1.5 pt-2">
                {assignments.map((as, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white dark:bg-black border border-gray-200/50 dark:border-white/5 p-2 rounded-xl text-xs">
                    <span className="truncate max-w-[240px]">✓ {as}</span>
                    <button type="button" onClick={() => handleRemoveListItem(idx, setAssignments)} className="text-[10px] text-rose-500 font-bold hover:text-rose-700">✕ Remove</button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200/50 dark:border-white/5">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 border border-gray-200/50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 transition-colors"
            >
              Cancel Changes
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors disabled:opacity-40"
            >
              {loading ? "Saving Details..." : "💾 Save Changes"}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
