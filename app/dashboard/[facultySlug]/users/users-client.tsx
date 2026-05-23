"use client";

import { useState, useMemo } from "react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { createPortal } from "react-dom";
import { 
  Search, Shield, ShieldAlert, ShieldCheck, UserCheck, 
  Trash2, UserMinus, Loader2, ChevronRight, Info 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DirectoryUser } from "@/components/dashboard/directory-grid";
import { 
  updateUserRole, 
  deleteUserAccount, 
  deleteUserAccounts, 
  deleteAllUsersByRole 
} from "@/app/dashboard/[facultySlug]/directory-actions";
import { parseCampuses } from "@/lib/campuses";

interface UsersManagementClientProps {
  initialUsers: DirectoryUser[];
  facultyId: string;
  facultySlug: string;
  currentAdminId: string;
}

export function UsersManagementClient({ initialUsers, facultyId, facultySlug, currentAdminId }: UsersManagementClientProps) {
  const [users, setUsers] = useState<DirectoryUser[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleTab, setSelectedRoleTab] = useState<"ALL" | "ADMIN" | "COORDINATOR" | "STUDENT">("ALL");
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null);
  
  // Selection and Deletion State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safety Confirmation Modals State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<DirectoryUser | null>(null);
  const [deleteConfirmBulk, setDeleteConfirmBulk] = useState<boolean>(false);
  const [deleteConfirmClear, setDeleteConfirmClear] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState("");

  // Role modification confirmation
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ user: DirectoryUser, role: "STUDENT" | "COORDINATOR" | "ADMIN" } | null>(null);

  // Search & Filter Logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch = 
        (user.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.profile?.campus_zone || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRole = selectedRoleTab === "ALL" ? true : user.role === selectedRoleTab;

      return matchSearch && matchRole;
    });
  }, [users, searchTerm, selectedRoleTab]);

  // Actions
  const handleRoleChange = async (targetUser: DirectoryUser, newRole: "STUDENT" | "COORDINATOR" | "ADMIN") => {
    if (targetUser.id === currentAdminId) {
      alert("You cannot change your own role!");
      return;
    }
    setIsUpdating(true);
    setError(null);
    const result = await updateUserRole(targetUser.id, facultyId, newRole, facultySlug);
    
    if (result.error) {
      setError(result.error);
      alert(result.error);
    } else {
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      setRoleChangeTarget(null);
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
      }
      alert(`User role elevated/updated to ${newRole} successfully!`);
    }
    setIsUpdating(false);
  };

  const handleDeleteSingleUser = async () => {
    if (!deleteConfirmUser) return;
    setIsRemoving(true);
    setError(null);
    const result = await deleteUserAccount(deleteConfirmUser.id, facultyId, facultySlug);
    if (result.error) {
      setError(result.error);
      alert(result.error);
    } else {
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
      setSelectedUserIds(prev => prev.filter(id => id !== deleteConfirmUser.id));
      setDeleteConfirmUser(null);
      setSelectedUser(null);
      alert("User account and profile deleted completely from the system!");
    }
    setIsRemoving(false);
  };

  const handleDeleteBulkUsers = async () => {
    if (selectedUserIds.length === 0) return;
    setIsRemoving(true);
    setError(null);
    const result = await deleteUserAccounts(selectedUserIds, facultyId, facultySlug);
    if (result.error) {
      setError(result.error);
      alert(result.error);
    } else {
      setUsers(prev => prev.filter(u => !selectedUserIds.includes(u.id)));
      setSelectedUserIds([]);
      setDeleteConfirmBulk(false);
      alert("Selected user accounts deleted completely from the system!");
    }
    setIsRemoving(false);
  };

  const handleDeleteAllUsersByRole = async () => {
    if (confirmText !== "DELETE ALL") {
      alert("Please type 'DELETE ALL' to confirm!");
      return;
    }
    setIsRemoving(true);
    setError(null);
    
    // We clear students or coordinators based on current tab selection
    const roleFilter = selectedRoleTab === "COORDINATOR" ? "COORDINATOR" : "STUDENT";

    const result = await deleteAllUsersByRole(roleFilter, facultyId, facultySlug);
    if (result.error) {
      setError(result.error);
      alert(result.error);
    } else {
      setUsers(prev => prev.filter(u => u.role !== roleFilter));
      setSelectedUserIds([]);
      setConfirmText("");
      setDeleteConfirmClear(false);
      alert(`All registered ${roleFilter.toLowerCase()} accounts deleted completely from the system!`);
    }
    setIsRemoving(false);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.charAt(0).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Header */}
      <div className="bg-white/40 dark:bg-[#08080c]/40 backdrop-blur-3xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative w-full md:max-w-md shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name, email, or campus..."
            className="w-full bg-white/60 dark:bg-[#050505]/60 border border-gray-200/50 dark:border-white/5 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
          />
        </div>

        {/* Filters and Selection Header */}
        <div className="flex flex-wrap items-center gap-2 w-full justify-end">
          {["ALL", "ADMIN", "COORDINATOR", "STUDENT"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedRoleTab(tab as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                selectedRoleTab === tab 
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white border-transparent"
              )}
            >
              {tab === "ALL" ? "All Roles" : tab + "S"}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Actions Panel */}
      {selectedUserIds.length > 0 && (
        <div className="bg-white/40 dark:bg-[#0c0c0c]/40 backdrop-blur-md border border-gray-200/50 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md animate-in fade-in duration-300">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
              {selectedUserIds.length} users selected for bulk actions
            </span>
            <button
              onClick={() => setSelectedUserIds([])}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Deselect All
            </button>
          </div>
          <button
            onClick={() => setDeleteConfirmBulk(true)}
            disabled={isRemoving}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all border border-rose-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected Accounts ({selectedUserIds.length})</span>
          </button>
        </div>
      )}

      {/* Directory Table View (Responsive) */}
      <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUserIds([]);
                      }
                    }}
                    className="rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User Profile</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Campus / Zone</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Role Type</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Quick Assignments / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150/40 dark:divide-white/5">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <tr 
                    key={user.id} 
                    className={cn(
                      "hover:bg-gray-50/40 dark:hover:bg-white/[0.01] transition-all",
                      isSelected && "bg-emerald-500/[0.02] dark:bg-emerald-500/[0.02]"
                    )}
                  >
                    {/* Checkbox Selector */}
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds([...selectedUserIds, user.id]);
                          } else {
                            setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                          }
                        }}
                        className="rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>

                    {/* Roster Profile Info */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setSelectedUser(user)}>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center justify-center border-2 border-white dark:border-[#0a0a0a] shadow-sm overflow-hidden shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(user.full_name, user.email)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                              {user.full_name || "Anonymous User"}
                            </span>
                            {user.profile?.is_verified && <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 truncate block">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Campus Mapping */}
                    <td className="p-4">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {user.profile?.campus_zone ? parseCampuses(user.profile.campus_zone).join(", ") : <span className="text-gray-400 italic">Not set</span>}
                      </span>
                    </td>

                    {/* Role Badges */}
                    <td className="p-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border",
                        user.role === "ADMIN"
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400"
                          : user.role === "COORDINATOR"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      )}>
                        {user.role}
                      </span>
                    </td>

                    {/* Roster Assignment Actions */}
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {user.id !== currentAdminId ? (
                        <>
                          {user.role !== "STUDENT" && (
                            <button
                              onClick={() => setRoleChangeTarget({ user, role: "STUDENT" })}
                              className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5 hover:border-emerald-500/20 transition-all shadow-sm"
                              title="Demote to Student"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          {user.role !== "COORDINATOR" && (
                            <button
                              onClick={() => setRoleChangeTarget({ user, role: "COORDINATOR" })}
                              className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5 hover:border-amber-500/20 transition-all shadow-sm"
                              title="Promote to Coordinator"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}
                          {user.role !== "ADMIN" && (
                            <button
                              onClick={() => setRoleChangeTarget({ user, role: "ADMIN" })}
                              className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5 hover:border-purple-500/20 transition-all shadow-sm"
                              title="Promote to Admin"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirmUser(user)}
                            className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-rose-500 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5 hover:border-rose-500/20 transition-all shadow-sm"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pr-4">You (Owner)</span>
                      )}
                      
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5 hover:border-gray-400 transition-all shadow-sm"
                        title="View Full Profile"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-20 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-b-3xl">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No users match your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Directory Clearing Header Button for specific selections */}
      {selectedRoleTab !== "ALL" && users.some(u => u.role === selectedRoleTab) && (
        <div className="flex justify-end pr-2">
          <button
            onClick={() => {
              setConfirmText("");
              setDeleteConfirmClear(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-2xl border border-amber-500/20 transition-all shadow-sm"
          >
            <UserMinus className="w-4 h-4" />
            <span>Delete All {selectedRoleTab.toLowerCase()}s</span>
          </button>
        </div>
      )}

      {/* User Detail Modal (React Portal) */}
      {selectedUser && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#080808] border border-gray-200/50 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="flex-1 overflow-y-auto relative">
              
              {/* Banner */}
              <div className="h-32 sm:h-40 bg-gradient-to-br from-emerald-500 to-emerald-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px]" />
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-4 right-6 font-black text-white/10 text-4xl sm:text-5xl uppercase tracking-[0.2em] pointer-events-none select-none font-mono">
                  EDEN
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors z-20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              {/* Profile Info */}
              <div className="px-6 pb-6 sm:px-10 sm:pb-10 relative">
                <div className="flex flex-col sm:flex-row gap-6 -mt-12 sm:-mt-16 mb-6 relative z-10">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-[#080808] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-3xl shrink-0 shadow-xl relative z-20">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
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
                      {selectedUser.id !== currentAdminId ? (
                        <div className="flex items-center gap-3 flex-wrap">
                          <select
                            value={selectedUser.role}
                            onChange={(e) => handleRoleChange(selectedUser, e.target.value as any)}
                            disabled={isUpdating}
                            className="appearance-none bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold tracking-widest uppercase px-3 py-1.5 pr-8 rounded-lg border border-emerald-200 dark:border-emerald-900/50 cursor-pointer focus:outline-none"
                          >
                            <option value="STUDENT" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white">Student</option>
                            <option value="COORDINATOR" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white">Coordinator</option>
                            <option value="ADMIN" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white">Admin</option>
                          </select>
                          
                          <button
                            onClick={() => setDeleteConfirmUser(selectedUser)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 transition-all shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Account</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-purple-650 uppercase tracking-widest">
                          Primary Faculty Owner
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">{selectedUser.email}</p>
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
                    {selectedUser.profile?.bio || <span className="text-gray-400 italic">This user hasn't written a biography yet.</span>}
                  </div>
                </div>

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
              <h3 className="text-lg font-extrabold tracking-tight">Confirm Account Deletion</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to permanently delete the account of <span className="font-bold text-gray-900 dark:text-white">{deleteConfirmUser.full_name || "this user"}</span>? This action is <span className="text-rose-500 font-bold">irreversible</span> and will permanently erase their login credentials, profile, and database records from the system.
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
                onClick={handleDeleteSingleUser}
                disabled={isRemoving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
              >
                {isRemoving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Account</span>
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
              <h3 className="text-lg font-extrabold tracking-tight">Confirm Bulk Account Deletion</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to permanently delete the <span className="font-bold text-rose-600 dark:text-rose-400">{selectedUserIds.length} selected user accounts</span>? This action is <span className="text-rose-500 font-bold">irreversible</span> and will wipe out all corresponding logins and details from the system.
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
                onClick={handleDeleteBulkUsers}
                disabled={isRemoving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
              >
                {isRemoving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Selected</span>
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
              You are about to permanently delete <span className="font-bold text-red-500 font-mono">ALL registered {selectedRoleTab.toLowerCase()} accounts</span>. This action is irreversible and will permanently wipe out all profiles and credentials from the system database.
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
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
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
                onClick={handleDeleteAllUsersByRole}
                disabled={isRemoving || confirmText !== "DELETE ALL"}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-30 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
              >
                {isRemoving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete All Members</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Role Change Modal Confirmation */}
      {roleChangeTarget && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRoleChangeTarget(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0b0b0d] border border-gray-200/50 dark:border-white/10 shadow-2xl rounded-3xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-emerald-500 mb-4">
              <UserCheck className="w-8 h-8" />
              <h3 className="text-lg font-extrabold tracking-tight">Confirm Role Assignment</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to change the role of <span className="font-bold text-gray-900 dark:text-white">{roleChangeTarget.user.full_name || "this user"}</span> to <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{roleChangeTarget.role}</span>? This will immediately reconfigure their permissions and access areas.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRoleChangeTarget(null)}
                disabled={isUpdating}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRoleChange(roleChangeTarget.user, roleChangeTarget.role)}
                disabled={isUpdating}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Assignment</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
