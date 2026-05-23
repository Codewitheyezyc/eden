"use client";

import { useState } from "react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { createPortal } from "react-dom";
import { Loader2, Trash2, UserMinus, ShieldAlert, CheckSquare, Square } from "lucide-react";
import { 
  updateUserRole,
  removeUserFromFaculty,
  removeUsersFromFaculty,
  clearAllUsersFromFaculty
} from "@/app/dashboard/[facultySlug]/directory-actions";
import { parseCampuses } from "@/lib/campuses";

export interface DirectoryUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  role: string;
  profile: {
    phone: string | null;
    gender: string | null;
    kingschat_handle: string | null;
    campus_zone: string | null;
    date_of_birth: string | null;
    bio: string | null;
    is_verified: boolean;
  } | null;
}

interface DirectoryGridProps {
  title: string;
  users: DirectoryUser[];
  currentUserRole?: string;
  facultyId?: string;
  facultySlug?: string;
}

export function DirectoryGrid({ title, users, currentUserRole, facultyId, facultySlug }: DirectoryGridProps) {
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin User Management State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<DirectoryUser | null>(null);
  const [deleteConfirmBulk, setDeleteConfirmBulk] = useState<boolean>(false);
  const [deleteConfirmClear, setDeleteConfirmClear] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveSingleUser = async () => {
    if (!deleteConfirmUser || !facultyId || !facultySlug) return;
    setIsRemoving(true);
    setError(null);
    const result = await removeUserFromFaculty(deleteConfirmUser.id, facultyId, facultySlug);
    if (result.error) {
      setError(result.error);
      alert(result.error);
    } else {
      setSelectedUser(null);
      setDeleteConfirmUser(null);
      setSelectedUserIds(selectedUserIds.filter(id => id !== deleteConfirmUser.id));
      alert("User removed from faculty successfully!");
    }
    setIsRemoving(false);
  };

  const handleRemoveBulkUsers = async () => {
    if (selectedUserIds.length === 0 || !facultyId || !facultySlug) return;
    setIsRemoving(true);
    setError(null);
    const result = await removeUsersFromFaculty(selectedUserIds, facultyId, facultySlug);
    if (result.error) {
      setError(result.error);
      alert(result.error);
    } else {
      setSelectedUserIds([]);
      setDeleteConfirmBulk(false);
      alert(`${selectedUserIds.length} users removed from faculty successfully!`);
    }
    setIsRemoving(false);
  };

  const handleClearDirectory = async () => {
    if (!facultyId || !facultySlug) return;
    if (confirmText !== "DELETE ALL") {
      alert("Please type 'DELETE ALL' to confirm!");
      return;
    }
    setIsRemoving(true);
    setError(null);

    const roleFilter = title.toLowerCase().includes("student") ? "STUDENT" : "COORDINATOR";

    const result = await clearAllUsersFromFaculty(roleFilter, facultyId, facultySlug);
    if (result.error) {
      setError(result.error);
      alert(result.error);
    } else {
      setSelectedUserIds([]);
      setConfirmText("");
      setDeleteConfirmClear(false);
      alert(`Directory cleared successfully!`);
    }
    setIsRemoving(false);
  };

  const handleRoleChange = async (newRole: "STUDENT" | "COORDINATOR" | "ADMIN") => {
    if (!selectedUser || !facultyId || !facultySlug) return;
    
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    setIsUpdatingRole(true);
    setError(null);
    const result = await updateUserRole(selectedUser.id, facultyId, newRole, facultySlug);
    
    if (result.error) {
      setError(result.error);
    } else {
      setSelectedUser({ ...selectedUser, role: newRole });
      alert("Role updated successfully!");
    }
    setIsUpdatingRole(false);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.charAt(0).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-full text-sm font-semibold border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
          {users.length} Total
        </span>
      </div>

      {/* Admin Actions Bar */}
      {currentUserRole === "ADMIN" && users.length > 0 && (
        <div className="bg-white/40 dark:bg-[#0c0c0c]/40 backdrop-blur-md border border-gray-200/50 dark:border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => {
                if (selectedUserIds.length === users.length) {
                  setSelectedUserIds([]);
                } else {
                  setSelectedUserIds(users.map(u => u.id));
                }
              }}
              className="inline-flex items-center space-x-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {selectedUserIds.length === users.length ? (
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>{selectedUserIds.length === users.length ? "Deselect All" : "Select All"}</span>
            </button>
            {selectedUserIds.length > 0 && (
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                • {selectedUserIds.length} Selected
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {selectedUserIds.length > 0 && (
              <button
                onClick={() => setDeleteConfirmBulk(true)}
                disabled={isRemoving}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all border border-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Selected</span>
              </button>
            )}
            <button
              onClick={() => {
                setConfirmText("");
                setDeleteConfirmClear(true);
              }}
              disabled={isRemoving}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl transition-all border border-amber-500/20"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>Clear Directory</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map((user) => (
          <div 
            key={user.id} 
            onClick={() => setSelectedUser(user)}
            className="group relative bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 dark:hover:border-emerald-900/50 overflow-hidden transition-all duration-300 cursor-pointer flex flex-col items-center text-center animate-in fade-in duration-500"
          >
            {/* Admin Checkbox Selector */}
            {currentUserRole === "ADMIN" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const isSel = selectedUserIds.includes(user.id);
                  if (isSel) {
                    setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                  } else {
                    setSelectedUserIds([...selectedUserIds, user.id]);
                  }
                }}
                className="absolute top-4 left-4 z-10 p-1.5 rounded-lg bg-white/80 dark:bg-black/80 hover:scale-105 border border-gray-200/50 dark:border-white/10 text-gray-500 hover:text-emerald-500 dark:text-gray-400 transition-all shadow-sm"
              >
                {selectedUserIds.includes(user.id) ? (
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
              </button>
            )}
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-[#0a0a0a] shadow-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-105 transition-transform duration-300">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name || "User"} className="w-full h-full object-cover" />
              ) : (
                getInitials(user.full_name, user.email)
              )}
            </div>
            
            <div className="flex flex-col items-center min-w-0 w-full px-2">
              <div className="flex items-center gap-1.5 mb-1 max-w-full justify-center">
                <h3 className="font-bold text-gray-900 dark:text-white truncate">{user.full_name || "Anonymous User"}</h3>
                {user.profile?.is_verified && <VerifiedBadge className="w-4 h-4 shrink-0" />}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-full">{user.profile?.campus_zone ? parseCampuses(user.profile.campus_zone).join(", ") : user.email}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 w-full flex justify-between items-center px-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                {user.role}
              </span>
              <span className="text-xs font-semibold text-gray-400 group-hover:text-emerald-500 transition-colors">
                View Profile &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-20 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No users found in this directory.</p>
        </div>
      )}

      {/* User Detail Modal (React Portal) */}
      {selectedUser && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setSelectedUser(null); setError(null); }}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#080808] border border-gray-200/50 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Scrollable Container for both Banner and Info so avatar doesn't get clipped by overflow */}
            <div className="flex-1 overflow-y-auto relative">
              
              {/* Header / Banner decorated with premium SaaS assets */}
              <div className="h-32 sm:h-40 bg-gradient-to-br from-emerald-500 to-emerald-800 relative overflow-hidden">
                {/* Glowing Geometric & Abstract SaaS Grids */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px]" />
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                
                {/* Sleek Translucent Watermark */}
                <div className="absolute bottom-4 right-6 font-black text-white/10 text-4xl sm:text-5xl uppercase tracking-[0.2em] pointer-events-none select-none font-mono">
                  EDEN
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => { setSelectedUser(null); setError(null); }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors z-20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              {/* Profile Info */}
              <div className="px-6 pb-6 sm:px-10 sm:pb-10 relative">
                <div className="flex flex-col sm:flex-row gap-6 -mt-12 sm:-mt-16 mb-6 relative z-10">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-[#080808] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-3xl shrink-0 shadow-xl relative z-20">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(selectedUser.full_name, selectedUser.email)
                    )}
                  </div>
                <div className="pt-2 sm:pt-16">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{selectedUser.full_name || "Anonymous User"}</h2>
                    {selectedUser.profile?.is_verified && <VerifiedBadge className="w-6 h-6" />}
                  </div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {currentUserRole === "ADMIN" ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative">
                          <select
                            value={selectedUser.role}
                            onChange={(e) => handleRoleChange(e.target.value as any)}
                            disabled={isUpdatingRole}
                            className="appearance-none bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold tracking-widest uppercase px-3 py-1.5 pr-8 rounded-lg border border-emerald-200 dark:border-emerald-900/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                          >
                            <option value="STUDENT" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white font-sans text-sm">Student</option>
                            <option value="COORDINATOR" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white font-sans text-sm">Coordinator</option>
                            <option value="ADMIN" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white font-sans text-sm">Admin</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-emerald-600 dark:text-emerald-400">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                          </div>
                          {isUpdatingRole && (
                            <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => setDeleteConfirmUser(selectedUser)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 transition-all shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove User</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">
                        {selectedUser.role}
                      </p>
                    )}
                  </div>
                  {error && (
                    <p className="text-xs text-rose-500 mb-2">{error}</p>
                  )}
                  <p className="text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Campus / Zone</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedUser.profile?.campus_zone ? parseCampuses(selectedUser.profile.campus_zone).join(", ") : "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kingschat Handle</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedUser.profile?.kingschat_handle ? `@${selectedUser.profile.kingschat_handle}` : "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedUser.profile?.phone || "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gender & DOB</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedUser.profile?.gender || "Not provided"} 
                    {selectedUser.profile?.date_of_birth ? ` • ${new Date(selectedUser.profile.date_of_birth).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Biography</span>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300 text-sm leading-relaxed min-h-[80px]">
                  {selectedUser.profile?.bio ? (
                    selectedUser.profile.bio
                  ) : (
                    <span className="text-gray-400 italic">This user hasn't written a biography yet.</span>
                  )}
                </div>
              </div>

              {/* Coordinator/Admin Exclusive: Student Academy progress tracker */}
              {selectedUser.role === "STUDENT" && (currentUserRole === "ADMIN" || currentUserRole === "COORDINATOR") && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">Ministerial Academy Tracker</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">LMS Learning Progress</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Courses List */}
                    <div className="bg-gray-50/50 dark:bg-white/[0.01] border border-gray-200/50 dark:border-white/5 p-4 rounded-2xl space-y-3">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Academic Coursework</span>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 truncate pr-2">Effective Leadership in Ministry</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">100%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-white/5 rounded-full h-1 overflow-hidden">
                            <div className="bg-emerald-500 h-full w-full" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 truncate pr-2">Advanced Digital Evangelism</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">65%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-white/5 rounded-full h-1 overflow-hidden">
                            <div className="bg-amber-500 h-full w-[65%]" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 truncate pr-2">Theology & Creative Worship</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">100%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-white/5 rounded-full h-1 overflow-hidden">
                            <div className="bg-emerald-500 h-full w-full" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Achievements/Badges */}
                    <div className="bg-gray-50/50 dark:bg-white/[0.01] border border-gray-200/50 dark:border-white/5 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2.5">Earned Badges & Rank</span>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-bold">
                            🏆 Leadership Grad
                          </span>
                          <span className="inline-flex items-center px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-bold">
                            🔥 Active Evangelist
                          </span>
                          <span className="inline-flex items-center px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold">
                            ✨ Worship Scholar
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-150 dark:border-white/5 flex items-center justify-between text-xs">
                        <span className="text-gray-400 text-[10px]">Rank:</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px]">Tier 2 Scholar</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

      {/* Safety Confirmation Modal: Single Deletion */}
      {deleteConfirmUser && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmUser(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0b0b0d] border border-gray-200/50 dark:border-white/10 shadow-2xl rounded-3xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-500 mb-4">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
              <h3 className="text-lg font-extrabold tracking-tight">Confirm User Removal</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-gray-900 dark:text-white">{deleteConfirmUser.full_name || "this user"}</span> from the faculty? This action will revoke all their workspace access privileges.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                disabled={isRemoving}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveSingleUser}
                disabled={isRemoving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
              >
                {isRemoving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Removal</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Safety Confirmation Modal: Bulk Deletion */}
      {deleteConfirmBulk && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmBulk(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0b0b0d] border border-gray-200/50 dark:border-white/10 shadow-2xl rounded-3xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-500 mb-4">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
              <h3 className="text-lg font-extrabold tracking-tight">Confirm Bulk Removal</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to remove the <span className="font-bold text-rose-600 dark:text-rose-400">{selectedUserIds.length} selected users</span> from this faculty? This will revoke workspace access for all selected members simultaneously.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmBulk(false)}
                disabled={isRemoving}
                className="px-4 py-2 bg-gray-150 hover:bg-gray-250 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveBulkUsers}
                disabled={isRemoving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
              >
                {isRemoving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Bulk Removal</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Safety Confirmation Modal: Clear Directory */}
      {deleteConfirmClear && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmClear(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0b0b0d] border border-gray-200/50 dark:border-white/10 shadow-2xl rounded-3xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-amber-500 mb-4">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
              <h3 className="text-lg font-extrabold tracking-tight">HIGHLY DESTRUCTIVE ACTION</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              You are about to remove <span className="font-bold text-red-500 font-mono">ALL registered {title.toLowerCase()}</span> from this faculty. This action is irreversible and will wipe out all corresponding membership mappings.
            </p>
            
            <div className="space-y-2 mb-6">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Type <span className="font-mono text-amber-600 dark:text-amber-400 select-all font-bold">DELETE ALL</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE ALL"
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-205 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmClear(false)}
                disabled={isRemoving}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleClearDirectory}
                disabled={isRemoving || confirmText !== "DELETE ALL"}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-30 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
              >
                {isRemoving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Clear All Members</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
