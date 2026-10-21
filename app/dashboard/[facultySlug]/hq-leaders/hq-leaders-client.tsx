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
  avatarUrl: string | null;
  campusZone: string;
  currentRole: string;
  isCurrentLeader: boolean;
  leadershipRole?: string;
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

  // Search State for Leaders Directory
  const [search, setSearch] = useState("");

  // Assign Leader Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleOption, setSelectedRoleOption] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleText, setCustomRoleText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & Filter State inside Promotion Modal
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<"ALL" | "STUDENT" | "COORDINATOR" | "ADMIN">("ALL");

  // Selected member object
  const selectedMember = useMemo(() => {
    return potentialLeaders.find(p => p.id === selectedUserId) || null;
  }, [potentialLeaders, selectedUserId]);

  // Filter potential members inside modal
  const filteredPotentialMembers = useMemo(() => {
    let result = potentialLeaders;
    if (memberRoleFilter !== "ALL") {
      result = result.filter(p => p.currentRole === memberRoleFilter);
    }
    if (memberSearch.trim() !== "") {
      const q = memberSearch.toLowerCase();
      result = result.filter(
        p =>
          p.fullName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.campusZone && parseCampuses(p.campusZone).join(" ").toLowerCase().includes(q))
      );
    }
    return result;
  }, [potentialLeaders, memberSearch, memberRoleFilter]);

  // Filter leaders by search on main grid
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

  // Open modal pre-filled to edit an existing leader
  const handleEditLeader = (leader: FacultyLeader) => {
    setSelectedUserId(leader.id);
    const role = leader.profile?.leadershipRole || "";
    if ((LEADERSHIP_ROLES as readonly string[]).includes(role)) {
      setSelectedRoleOption(role);
      setIsCustomRole(false);
      setCustomRoleText("");
    } else {
      setSelectedRoleOption("CUSTOM");
      setIsCustomRole(true);
      setCustomRoleText(role);
    }
    setMessage(null);
    setIsModalOpen(true);
  };

  // Remove leader from HQ leadership role
  const handleRemoveLeader = async (leader: FacultyLeader) => {
    if (!window.confirm(`Are you sure you want to remove "${leader.fullName}" from HQ Leaders? They will remain a member of the faculty.`)) {
      return;
    }

    setIsRemoving(leader.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ leadership_role: null })
        .eq("id", leader.id);

      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert("Failed to remove leader: " + (err.message || "Unknown error"));
    } finally {
      setIsRemoving(null);
    }
  };

  // Handle Promoting and Assigning HQ Leader
  const handleAssignLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setMessage({ type: "error", text: "Please choose a student or member to promote." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const finalRole = isCustomRole ? customRoleText.trim() : selectedRoleOption;
    if (!finalRole) {
      setMessage({ type: "error", text: "Please specify a leadership role." });
      setLoading(false);
      return;
    }

    try {
      // Upsert profile with leadership_role
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
        setMemberSearch("");
        setMemberRoleFilter("ALL");
        setMessage(null);
        router.refresh();
      }, 1200);

    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to assign leader." });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPromoteModal = () => {
    setSelectedUserId("");
    setSelectedRoleOption("");
    setIsCustomRole(false);
    setCustomRoleText("");
    setMemberSearch("");
    setMemberRoleFilter("ALL");
    setMessage(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      
      {/* Inspirational Banner */}
      <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden shadow-xl border border-black/5 dark:border-white/5 bg-gradient-to-br from-emerald-600/95 to-teal-900 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-extrabold bg-white/20 text-white uppercase tracking-widest border border-white/20 shadow-xs">
              Dance Faculty
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
              HQ Leaders Directory
            </h2>
            <p className="text-emerald-100 text-sm md:text-base leading-relaxed font-light">
              Meet the inspirational leaders, instructors, and directors guiding our creative faculty. Witness the beauty of structured art, discipline, and outstanding spiritual guidance.
            </p>
          </div>

          {/* Admin Promote Control */}
          {viewerRole === "ADMIN" && (
            <button
              onClick={handleOpenPromoteModal}
              className="px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 hover:shadow-xl rounded-2xl text-xs font-extrabold transition-all shadow-md shrink-0 flex items-center gap-2 hover:scale-[1.02]"
            >
              <span className="text-base">👑</span>
              <span>Promote HQ Leader</span>
            </button>
          )}
        </div>
      </div>

      {/* Directory Search & Filter Controls */}
      <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
          Showing {filteredLeaders.length} Active {filteredLeaders.length === 1 ? "Leader" : "Leaders"}
        </div>
      </div>

      {/* Aesthetic Profile Grid */}
      {filteredLeaders.length === 0 ? (
        <div className="bg-white/40 dark:bg-black/20 border border-dashed border-gray-200 dark:border-white/5 rounded-3xl p-16 text-center">
          <span className="text-4xl">👑</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4">No HQ Leaders Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            No leaders match your search or have been promoted yet. Administrators can add a leadership role above!
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeaders.map(leader => {
            return (
              <a
                key={leader.id}
                href={`/dashboard/${facultySlug}/hq-leaders/${leader.id}`}
                className="group relative bg-white/70 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border border-gray-200/60 dark:border-white/10 hover:border-emerald-500/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              >
                {/* Floating Accent Glow */}
                <div className="absolute right-0 top-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                {/* Leader Photo */}
                <div className="h-64 bg-gray-100 dark:bg-black relative overflow-hidden shrink-0">
                  {leader.avatarUrl ? (
                    <img src={leader.avatarUrl} alt={leader.fullName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/20 flex items-center justify-center text-5xl font-extrabold text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-500">
                      {leader.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Gradient Shadow Overlay for crisp contrast on any photo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Top-Right HQ Crown Pill */}
                  <div className="absolute top-4 right-4 z-10 bg-black/70 backdrop-blur-md rounded-xl px-2.5 py-1 text-[10px] font-extrabold text-amber-400 border border-amber-400/30 shadow-md uppercase tracking-wider flex items-center gap-1">
                    👑 HQ LEADER
                  </div>

                  {/* Campus Badge (Crystal Clear Contrast on Image) */}
                  {leader.profile?.campusZone && (
                    <div className="absolute bottom-4 left-4 z-10 bg-black/80 backdrop-blur-md rounded-xl px-3 py-1.5 text-[11px] font-bold text-white border border-white/20 uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                      <span className="text-emerald-400">📍</span>
                      <span>{parseCampuses(leader.profile.campusZone)[0]}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors truncate">
                    {leader.fullName}
                  </h3>
                  
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1.5 truncate">
                    {leader.profile?.leadershipRole}
                  </p>

                  <p className="text-xs text-gray-600 dark:text-gray-300 font-normal leading-relaxed mt-4 line-clamp-3 flex-1">
                    {leader.profile?.bio || "Dedicated leader guiding creative units with absolute excellence and structural beauty inside Eden."}
                  </p>

                  <div className="pt-4 border-t border-gray-100 dark:border-white/10 mt-6 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-500 dark:text-gray-400">Faculty Leader</span>
                      {viewerRole === "ADMIN" && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditLeader(leader);
                            }}
                            title="Edit Leadership Position"
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-500 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                          </button>
                          <button
                            type="button"
                            disabled={isRemoving === leader.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveLeader(leader);
                            }}
                            title="Remove from HQ Leaders"
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
                          </button>
                        </div>
                      )}
                    </div>

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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && setIsModalOpen(false)} />
          
          <div className="relative bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <form onSubmit={handleAssignLeader} className="p-6 md:p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>👑</span>
                    <span>Promote HQ Leader</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Assign a student or faculty member to a senior HQ leadership position.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {message && (
                <div className={cn("p-4 rounded-xl text-xs font-bold", message.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400")}>
                  {message.text}
                </div>
              )}

              {/* SEARCHABLE MEMBER PICKER */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                  Choose Member
                </label>

                {selectedMember ? (
                  /* Selected Member Preview Card */
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center justify-center shrink-0 overflow-hidden border border-emerald-500/30">
                        {selectedMember.avatarUrl ? (
                          <img src={selectedMember.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          selectedMember.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                            {selectedMember.fullName}
                          </h4>
                          <span className={cn(
                            "text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider",
                            selectedMember.currentRole === "ADMIN" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                            selectedMember.currentRole === "COORDINATOR" ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" :
                            "bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300"
                          )}>
                            {selectedMember.currentRole === "COORDINATOR" ? "Zonal Leader" : selectedMember.currentRole}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{selectedMember.email}</p>
                        {selectedMember.campusZone && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                            📍 {parseCampuses(selectedMember.campusZone).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId("")}
                      className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all border border-gray-200 dark:border-white/10 shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  /* Interactive Search Box & Member List */
                  <div className="space-y-3">
                    {/* Search input with icon & clear button */}
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      </span>
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                        placeholder="Search student or member by name, email..."
                        className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white transition-all"
                      />
                      {memberSearch && (
                        <button
                          type="button"
                          onClick={() => setMemberSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      )}
                    </div>

                    {/* Filter chips: All, Students, Zonal Leaders, Admins */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                      {(["ALL", "STUDENT", "COORDINATOR", "ADMIN"] as const).map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setMemberRoleFilter(tab)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap shrink-0",
                            memberRoleFilter === tab
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                          )}
                        >
                          {tab === "ALL" && `All (${potentialLeaders.length})`}
                          {tab === "STUDENT" && `Students (${potentialLeaders.filter(p => p.currentRole === "STUDENT").length})`}
                          {tab === "COORDINATOR" && `Zonal Leaders (${potentialLeaders.filter(p => p.currentRole === "COORDINATOR").length})`}
                          {tab === "ADMIN" && `Admins (${potentialLeaders.filter(p => p.currentRole === "ADMIN").length})`}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable Members List */}
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-gray-150 dark:border-white/10 rounded-2xl p-2 bg-gray-50/50 dark:bg-black/30">
                      {filteredPotentialMembers.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          No members found matching &quot;{memberSearch}&quot;
                        </div>
                      ) : (
                        filteredPotentialMembers.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedUserId(m.id)}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/10 hover:shadow-sm border border-transparent hover:border-gray-200/50 dark:hover:border-white/10 transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-emerald-500/20">
                                {m.avatarUrl ? (
                                  <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  m.fullName.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                  {m.fullName}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">{m.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {m.isCurrentLeader && (
                                <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold px-1.5 py-0.5 rounded">
                                  Leader
                                </span>
                              )}
                              <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                m.currentRole === "ADMIN" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                m.currentRole === "COORDINATOR" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                                "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                              )}>
                                {m.currentRole === "COORDINATOR" ? "Zonal" : m.currentRole.toLowerCase()}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Select Position */}
              <div className="space-y-4 bg-gray-50 dark:bg-black/30 border border-gray-150 dark:border-white/10 p-4 rounded-2xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                    HQ Leadership Position
                  </label>
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
                    <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
                      Custom Position Title
                    </label>
                    <input
                      type="text"
                      value={customRoleText}
                      onChange={e => setCustomRoleText(e.target.value)}
                      required
                      placeholder="E.g., Senior Overseer, Chief Choreographer"
                      className="w-full bg-white dark:bg-black border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-900 dark:text-white font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="px-5 py-2.5 border border-gray-200/50 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedUserId}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-40 flex items-center gap-1.5"
                >
                  {loading && (
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  )}
                  <span>{loading ? "Assigning..." : "Assign Position"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
