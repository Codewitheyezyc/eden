"use client";

import { useState, useMemo } from "react";
import { parseCampuses } from "@/lib/campuses";
import { LEADERSHIP_ROLES } from "@/lib/leadership-roles";
import { createClient } from "@/services/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface LeaderProfile {
  campusZone: string;
  gender: string;
  phone: string;
  kingschat: string;
  bio: string;
  isVerified: boolean;
  leadershipRole: string;
  leadershipMetadata: any;
}

interface FacultyLeader {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: "ADMIN" | "COORDINATOR" | "STUDENT";
  profile: LeaderProfile | null;
}

interface PotentialLeader {
  id: string;
  fullName: string;
  email: string;
  currentRole: string;
}

interface HQLeadersClientProps {
  leaders: FacultyLeader[];
  potentialLeaders: PotentialLeader[];
  viewerRole: string;
  facultySlug: string;
  facultyId: string;
}

export function HQLeadersClient({ leaders, potentialLeaders, viewerRole, facultySlug, facultyId }: HQLeadersClientProps) {
  const supabase = createClient();
  const router = useRouter();

  // Search State
  const [search, setSearch] = useState("");

  // Assign Leader Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleOption, setSelectedRoleOption] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleText, setCustomRoleText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter leaders by search
  const filteredLeaders = useMemo(() => {
    if (search.trim() === "") return leaders;
    const q = search.toLowerCase();
    return leaders.filter(
      l =>
        l.fullName.toLowerCase().includes(q) ||
        l.profile?.leadershipRole.toLowerCase().includes(q) ||
        (l.profile?.campusZone && parseCampuses(l.profile.campusZone).join(" ").toLowerCase().includes(q))
    );
  }, [leaders, search]);

  // Handle Promoting and Assigning HQ Leader
  const handleAssignLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    setMessage(null);

    const finalRole = isCustomRole ? customRoleText : selectedRoleOption;
    if (!finalRole) {
      setMessage({ type: "error", text: "Please specify a leadership role." });
      setLoading(false);
      return;
    }

    try {
      // 1. Elevate user role to ADMIN in user_faculties (if not already)
      const targetUser = potentialLeaders.find(p => p.id === selectedUserId);
      if (targetUser && targetUser.currentRole !== "ADMIN") {
        await supabase
          .from("user_faculties")
          .update({ role: "ADMIN" })
          .eq("user_id", selectedUserId)
          .eq("faculty_id", facultyId);
      }

      // 2. Upsert profile with leadership_role
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: selectedUserId,
          leadership_role: finalRole,
        });

      if (profileError) throw profileError;

      setMessage({ type: "success", text: "Leader assigned successfully!" });
      setTimeout(() => {
        setIsModalOpen(false);
        // Reset state
        setSelectedUserId("");
        setSelectedRoleOption("");
        setIsCustomRole(false);
        setCustomRoleText("");
        setMessage(null);
        router.refresh();
      }, 1500);

    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to assign leader." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      
      {/* Inspirational Banner */}
      <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden shadow-xl border border-black/5 dark:border-white/5 bg-gradient-to-br from-emerald-600/90 to-teal-800 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold bg-white/20 text-white uppercase tracking-widest border border-white/20">
              Dance Faculty
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
              HQ Leaders Directory
            </h2>
            <p className="text-emerald-100 text-sm md:text-base leading-relaxed font-light">
              Meet the inspirational leaders, instructors, and directors guiding our creative faculty. Witness the beauty of structured art, discipline, and outstanding spiritual guidance.
            </p>
          </div>

          {/* Admin Create Control */}
          {viewerRole === "ADMIN" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 hover:shadow-lg rounded-2xl text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-2"
            >
              👑 Promote HQ Leader
            </button>
          )}
        </div>
      </div>

      {/* Directory Search & Filter Controls */}
      <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leaders by name, position, campus..."
            className="w-full bg-white dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
          />
        </div>
        <div className="text-xs text-gray-400 font-bold uppercase tracking-widest shrink-0 pl-2 select-none">
          Showing {filteredLeaders.length} Active Leaders
        </div>
      </div>

      {/* Aesthetic Profile Grid */}
      {filteredLeaders.length === 0 ? (
        <div className="bg-white/40 dark:bg-black/20 border border-dashed border-gray-200 dark:border-white/5 rounded-3xl p-16 text-center">
          <span className="text-4xl">👑</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4">No HQ Leaders Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">No leaders match your search or have been promoted yet. Administrators can add a leadership role above!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeaders.map(leader => {
            const hasSelfie = !!leader.avatarUrl;
            return (
              <a
                key={leader.id}
                href={`/dashboard/${facultySlug}/hq-leaders/${leader.id}`}
                className="group relative bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 hover:border-emerald-500/30 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              >
                {/* Floating Accent Glow */}
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                {/* Leader Photo */}
                <div className="h-64 bg-gray-100 dark:bg-black relative overflow-hidden shrink-0">
                  {leader.avatarUrl ? (
                    <img src={leader.avatarUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 flex items-center justify-center text-5xl font-extrabold text-emerald-600 dark:text-emerald-450 group-hover:scale-105 transition-transform duration-500">
                      {leader.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Subtle glass header badge */}
                  {leader.profile?.campusZone && (
                    <div className="absolute bottom-4 left-4 z-10 bg-white/70 dark:bg-black/70 backdrop-blur-md rounded-xl px-3 py-1 text-[10px] font-bold text-gray-800 dark:text-gray-250 border border-white/20 dark:border-white/5 uppercase tracking-wide">
                      📍 {parseCampuses(leader.profile.campusZone)[0]}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-extrabold text-gray-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                    {leader.fullName}
                  </h3>
                  
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-450 uppercase tracking-widest mt-1.5 truncate">
                    {leader.profile?.leadershipRole}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 font-normal leading-relaxed mt-4 line-clamp-3 flex-1">
                    {leader.profile?.bio || "Dedicated leader guiding creative units with absolute excellence and structural beauty inside Eden."}
                  </p>

                  <div className="pt-4 border-t border-gray-100 dark:border-white/5 mt-6 flex items-center justify-between text-xs text-gray-400 select-none">
                    <span className="font-medium">Faculty Leader</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View Profile &rarr;
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Promotion/Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <form onSubmit={handleAssignLeader} className="p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Promote HQ Leader</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Assign an existing faculty member to a senior HQ leadership position.</p>
              </div>

              {message && (
                <div className={cn("p-4 rounded-xl text-xs font-bold", message.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-red-50 text-red-750 dark:bg-red-950/20 dark:text-red-450")}>
                  {message.text}
                </div>
              )}

              {/* Select User */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Choose Member</label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white"
                >
                  <option value="">Select a member...</option>
                  {potentialLeaders.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.email}) — Current: {p.currentRole}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Role */}
              <div className="space-y-4 bg-gray-50 dark:bg-black/20 border border-gray-150 dark:border-white/5 p-4 rounded-2xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">HQ Position</label>
                  <select
                    value={selectedRoleOption}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedRoleOption(val);
                      if (val === "CUSTOM") {
                        setIsCustomRole(true);
                      } else {
                        setIsCustomRole(false);
                      }
                    }}
                    required
                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white"
                  >
                    <option value="">Select a position...</option>
                    {LEADERSHIP_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="CUSTOM">Custom Position (Scalable)</option>
                  </select>
                </div>

                {isCustomRole && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest block">Custom Position Title</label>
                    <input
                      type="text"
                      value={customRoleText}
                      onChange={e => setCustomRoleText(e.target.value)}
                      required
                      placeholder="E.g., Senior Overseer, Chief Choreographer"
                      className="w-full bg-white dark:bg-black border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-200/50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold text-gray-550 dark:text-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors disabled:opacity-40"
                >
                  {loading ? "Assigning..." : "Assign Position"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
