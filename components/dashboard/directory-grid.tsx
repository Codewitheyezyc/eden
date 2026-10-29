"use client";

import { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { createPortal } from "react-dom";
import { 
  Loader2, 
  Trash2, 
  UserMinus, 
  ShieldAlert, 
  CheckSquare, 
  Square,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  MapPin,
  Sparkles
} from "lucide-react";
import { 
  updateUserRole,
  deleteUserAccount,
  deleteUserAccounts,
  deleteAllUsersByRole
} from "@/app/dashboard/[facultySlug]/directory-actions";
import { parseCampuses } from "@/lib/campuses";
import { cn } from "@/lib/utils";
import { IdCardModal } from "./id-card-modal";
import { EnrollMemberModal } from "./enroll-member-modal";
import { CreditCard, UserPlus, Lock } from "lucide-react";

export interface DirectoryUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  kingschat_username: string | null;
  role: string;
  profile: {
    member_id?: string | null;
    phone: string | null;
    gender: string | null;
    kingschat_handle: string | null;
    campus_zone: string | null;
    date_of_birth: string | null;
    bio: string | null;
    is_verified: boolean;
    leadership_role?: string | null;
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

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LEADERS" | "VERIFIED">("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(16);

  // Admin User Management State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<DirectoryUser | null>(null);
  const [deleteConfirmBulk, setDeleteConfirmBulk] = useState<boolean>(false);
  const [deleteConfirmClear, setDeleteConfirmClear] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedUserForId, setSelectedUserForId] = useState<DirectoryUser | null>(null);

  // Available unique campuses
  const availableCampuses = useMemo(() => {
    const campusSet = new Set<string>();
    users.forEach((u) => {
      if (u.profile?.campus_zone) {
        parseCampuses(u.profile.campus_zone).forEach((c) => campusSet.add(c));
      }
    });
    return Array.from(campusSet).sort();
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const nameMatch = user.full_name?.toLowerCase().includes(q) || false;
        const emailMatch = user.email.toLowerCase().includes(q);
        const kingschatMatch =
          user.kingschat_username?.toLowerCase().includes(q) ||
          user.profile?.kingschat_handle?.toLowerCase().includes(q) ||
          false;
        const campusMatch = user.profile?.campus_zone?.toLowerCase().includes(q) || false;
        const phoneMatch = user.profile?.phone?.toLowerCase().includes(q) || false;
        const leaderMatch = user.profile?.leadership_role?.toLowerCase().includes(q) || false;

        if (!nameMatch && !emailMatch && !kingschatMatch && !campusMatch && !phoneMatch && !leaderMatch) {
          return false;
        }
      }

      // 2. Campus Filter
      if (selectedCampus !== "ALL") {
        if (!user.profile?.campus_zone) return false;
        const userCampuses = parseCampuses(user.profile.campus_zone);
        if (!userCampuses.includes(selectedCampus)) return false;
      }

      // 3. Status Filter
      if (statusFilter === "LEADERS" && !user.profile?.leadership_role) {
        return false;
      }
      if (statusFilter === "VERIFIED" && !user.profile?.is_verified) {
        return false;
      }

      return true;
    });
  }, [users, searchTerm, selectedCampus, statusFilter]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleCampusChange = (val: string) => {
    setSelectedCampus(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: "ALL" | "LEADERS" | "VERIFIED") => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // Selection helpers
  const isAllPageSelected =
    paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.includes(u.id));

  const handleToggleSelectPage = () => {
    if (isAllPageSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !paginatedUsers.some((u) => u.id === id)));
    } else {
      const pageIds = paginatedUsers.map((u) => u.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleDeleteSingleUser = async () => {
    if (!deleteConfirmUser || !facultyId || !facultySlug) return;
    setIsRemoving(true);
    setError(null);
    const result = await deleteUserAccount(deleteConfirmUser.id, facultyId, facultySlug);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      setSelectedUser(null);
      setDeleteConfirmUser(null);
      setSelectedUserIds(selectedUserIds.filter((id) => id !== deleteConfirmUser.id));
      toast.success("User account and profile deleted completely from the system!");
      window.location.reload();
    }
    setIsRemoving(false);
  };

  const handleDeleteBulkUsers = async () => {
    if (selectedUserIds.length === 0 || !facultyId || !facultySlug) return;
    setIsRemoving(true);
    setError(null);
    const result = await deleteUserAccounts(selectedUserIds, facultyId, facultySlug);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      setSelectedUserIds([]);
      setDeleteConfirmBulk(false);
      toast.success("Selected user accounts deleted completely from the system!");
      window.location.reload();
    }
    setIsRemoving(false);
  };

  const handleDeleteAllUsersByRole = async () => {
    if (!facultyId || !facultySlug) return;
    if (confirmText !== "DELETE ALL") {
      toast.error("Please type 'DELETE ALL' to confirm!");
      return;
    }
    setIsRemoving(true);
    setError(null);

    const roleFilter = title.toLowerCase().includes("student") ? "STUDENT" : "COORDINATOR";

    const result = await deleteAllUsersByRole(roleFilter, facultyId, facultySlug);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      setSelectedUserIds([]);
      setConfirmText("");
      setDeleteConfirmClear(false);
      toast.success(`All registered ${roleFilter.toLowerCase()} accounts deleted completely from the system!`);
      window.location.reload();
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
      toast.error(result.error);
    } else {
      setSelectedUser({ ...selectedUser, role: newRole });
      toast.success("Role updated successfully!");
    }
    setIsUpdatingRole(false);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.charAt(0).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  // Generate pagination page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6 pb-28 lg:pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 p-6 md:p-8 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20 shadow-xs">
              {filteredUsers.length} {filteredUsers.length === 1 ? "Member" : "Members"}
              {filteredUsers.length !== users.length && ` (of ${users.length})`}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse, manage, and inspect all enrolled members in this faculty.
          </p>
        </div>

        {/* Actions & View Mode Toggle */}
        <div className="flex items-center gap-3">
          {(currentUserRole === "ADMIN" || currentUserRole === "COORDINATOR") && facultyId && (
            <button
              onClick={() => setShowEnrollModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Enroll Member</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-white/5 w-fit">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
              viewMode === "grid"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
            title="Card Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
              viewMode === "table"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
            title="Compact Table View"
          >
            <List className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>
    </div>

      {/* 2. Search & Filter Toolbar */}
      <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name, email, campus, phone, or KingsChat..."
              className="w-full bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Campus Selector */}
            {availableCampuses.length > 0 && (
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <select
                  value={selectedCampus}
                  onChange={(e) => handleCampusChange(e.target.value)}
                  className="bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl pl-8 pr-8 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="ALL" className="bg-white dark:bg-[#111]">All Campuses ({availableCampuses.length})</option>
                  {availableCampuses.map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-[#111]">
                      {c}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            )}

            {/* Quick Status Chips */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-white/5">
              <button
                onClick={() => handleStatusChange("ALL")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  statusFilter === "ALL"
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                All
              </button>
              <button
                onClick={() => handleStatusChange("LEADERS")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1",
                  statusFilter === "LEADERS"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 shadow-xs"
                    : "text-gray-500 hover:text-amber-600 dark:hover:text-amber-400"
                )}
              >
                <span>👑</span>
                <span>Leaders</span>
              </button>
              <button
                onClick={() => handleStatusChange("VERIFIED")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1",
                  statusFilter === "VERIFIED"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-xs"
                    : "text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                )}
              >
                <span>✓</span>
                <span>Verified</span>
              </button>
            </div>

            {/* Per-Page Selector */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="hidden sm:inline">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
              >
                <option value={12} className="bg-white dark:bg-[#111]">12</option>
                <option value={16} className="bg-white dark:bg-[#111]">16</option>
                <option value={24} className="bg-white dark:bg-[#111]">24</option>
                <option value={48} className="bg-white dark:bg-[#111]">48</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Admin Actions Bar */}
      {currentUserRole === "ADMIN" && filteredUsers.length > 0 && (
        <div className="bg-white/60 dark:bg-[#0c0c0c]/60 backdrop-blur-md border border-gray-200/50 dark:border-white/5 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleSelectPage}
              className="inline-flex items-center space-x-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {isAllPageSelected ? (
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span>{isAllPageSelected ? `Deselect Page (${paginatedUsers.length})` : `Select Page (${paginatedUsers.length})`}</span>
            </button>

            {filteredUsers.length > paginatedUsers.length && (
              <button
                onClick={() => {
                  if (selectedUserIds.length === filteredUsers.length) {
                    setSelectedUserIds([]);
                  } else {
                    setSelectedUserIds(filteredUsers.map((u) => u.id));
                  }
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {selectedUserIds.length === filteredUsers.length
                  ? "Deselect All"
                  : `Select All ${filteredUsers.length}`}
              </button>
            )}

            {selectedUserIds.length > 0 && (
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                • {selectedUserIds.length} Selected
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {selectedUserIds.length > 0 && (
              <button
                onClick={() => setDeleteConfirmBulk(true)}
                disabled={isRemoving}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all border border-rose-500/20 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedUserIds.length})</span>
              </button>
            )}
            <button
              onClick={() => {
                setConfirmText("");
                setDeleteConfirmClear(true);
              }}
              disabled={isRemoving}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl transition-all border border-amber-500/20"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>Delete All {title.toLowerCase().includes("student") ? "Students" : "Zonal Leaders"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Directory Content: Grid View or Table View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedUsers.map((user) => {
            const isSelected = selectedUserIds.includes(user.id);
            return (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={cn(
                  "group relative bg-white/70 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden",
                  isSelected
                    ? "border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/10 ring-2 ring-emerald-500/20"
                    : "border-gray-200/70 dark:border-white/[0.08] hover:border-emerald-500/40"
                )}
              >
                {/* Top Corner Controls */}
                <div className="flex items-center justify-between w-full mb-3 z-10">
                  {currentUserRole === "ADMIN" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSelected) {
                          setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id));
                        } else {
                          setSelectedUserIds([...selectedUserIds, user.id]);
                        }
                      }}
                      className={cn(
                        "p-1.5 rounded-xl border transition-all shadow-xs",
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white/90 dark:bg-black/60 text-gray-400 hover:text-emerald-500 border-gray-200 dark:border-white/10"
                      )}
                      title={isSelected ? "Deselect member" : "Select member"}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-white" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <div />
                  )}

                  {/* Leader Badge */}
                  {user.profile?.leadership_role ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 uppercase tracking-wider select-none shadow-xs">
                      <span>👑</span>
                      <span className="truncate max-w-[110px]" title={user.profile.leadership_role}>
                        {user.profile.leadership_role}
                      </span>
                    </span>
                  ) : user.profile?.is_verified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 select-none">
                      <VerifiedBadge className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  ) : null}
                </div>

                {/* Avatar and Main Info */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white dark:border-[#141416] shadow-md bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950/60 dark:to-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-2xl mb-3.5 group-hover:scale-105 transition-transform duration-300 shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(user.full_name, user.email)
                    )}
                  </div>

                  <h3
                    className="font-bold text-gray-950 dark:text-white text-base tracking-tight line-clamp-1 w-full px-2"
                    title={user.full_name || "Anonymous Member"}
                  >
                    {user.full_name || "Anonymous Member"}
                  </h3>

                  {/* Subtitle / KingsChat Handle */}
                  {user.kingschat_username ? (
                    <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <img src="/kingschat.png" alt="" className="w-3 h-3 rounded-xs shrink-0" />
                      <span className="truncate max-w-[180px]">@{user.kingschat_username}</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={user.email}>
                      {user.email}
                    </p>
                  )}

                  {/* Campus Badge (Never cramped) */}
                  <div className="mt-3 flex flex-wrap gap-1 justify-center max-w-full">
                    {user.profile?.campus_zone ? (
                      parseCampuses(user.profile.campus_zone).map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-gray-100 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 text-gray-700 dark:text-gray-300"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs italic">Unassigned</span>
                    )}
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="mt-5 pt-3.5 border-t border-gray-150 dark:border-white/5 w-full flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/15 whitespace-nowrap">
                    {user.role === "COORDINATOR" ? "Zonal Leader" : user.role === "ADMIN" ? "Admin" : "Student"}
                  </span>

                  <span className="inline-flex items-center text-xs font-bold text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    View &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-white/95 dark:bg-[#0a0a0a]/95 border-b border-gray-200/60 dark:border-white/5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest select-none">
                  {currentUserRole === "ADMIN" && (
                    <th className="py-4 pl-6 pr-2 w-10">
                      <button onClick={handleToggleSelectPage} className="p-1 hover:text-emerald-500">
                        {isAllPageSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="py-4 px-4 w-12 text-gray-400">#</th>
                  <th className="py-4 px-4">Member</th>
                  <th className="py-4 px-4">Email</th>
                  <th className="py-4 px-4">KingsChat</th>
                  <th className="py-4 px-4">Campus / Zone</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/30 dark:divide-white/5 text-sm text-gray-700 dark:text-gray-300">
                {paginatedUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    {currentUserRole === "ADMIN" && (
                      <td className="py-3.5 pl-6 pr-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedUserIds.includes(user.id)) {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id));
                            } else {
                              setSelectedUserIds([...selectedUserIds, user.id]);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-emerald-500"
                        >
                          {selectedUserIds.includes(user.id) ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-xs font-mono text-gray-400">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/10">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(user.full_name, user.email)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                            <span>{user.full_name || "Anonymous Member"}</span>
                            {user.profile?.is_verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                          </div>
                          {user.profile?.leadership_role && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              👑 {user.profile.leadership_role}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                      {user.kingschat_username ? `@${user.kingschat_username}` : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.profile?.campus_zone ? (
                          parseCampuses(user.profile.campus_zone).map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold border capitalize tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                        {user.role === "COORDINATOR" ? "Zonal Leader" : user.role === "ADMIN" ? "Admin" : "Student"}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                        View Details &rarr;
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-16 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No matching members found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            No enrolled members match your current search query or filter selection.
          </p>
          {(searchTerm || selectedCampus !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCampus("ALL");
                setStatusFilter("ALL");
                setCurrentPage(1);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm"
            >
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      )}

      {/* 6. Pagination Footer Controls */}
      {filteredUsers.length > 0 && (
        <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-4 md:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Summary */}
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Showing <strong className="text-gray-900 dark:text-white font-bold">{startIndex + 1}</strong> to{" "}
            <strong className="text-gray-900 dark:text-white font-bold">{endIndex}</strong> of{" "}
            <strong className="text-gray-900 dark:text-white font-bold">{filteredUsers.length}</strong> {title.toLowerCase()}
          </p>

          {/* Page Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Prev Button */}
            <button
              onClick={() => handlePageChange(validCurrentPage - 1)}
              disabled={validCurrentPage === 1}
              className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum, i) => {
                if (pageNum === "...") {
                  return (
                    <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-gray-400 select-none">
                      ...
                    </span>
                  );
                }
                const pageNumber = Number(pageNum);
                const isActive = pageNumber === validCurrentPage;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={cn(
                      "w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center",
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-extrabold"
                        : "border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                    )}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(validCurrentPage + 1)}
              disabled={validCurrentPage === totalPages}
              className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{selectedUser.full_name || "Anonymous User"}</h2>
                      {selectedUser.profile?.is_verified && <VerifiedBadge className="w-6 h-6" />}
                      {selectedUser.profile?.leadership_role && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-widest shrink-0 select-none animate-pulse">
                          👑 Leader
                        </span>
                      )}
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
                              <option value="COORDINATOR" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white font-sans text-sm">Zonal Leader</option>
                              <option value="ADMIN" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white font-sans text-sm">Admin</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-emerald-600 dark:text-emerald-400">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                            {isUpdatingRole && (
                              <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-450" />
                              </div>
                            )}
                          </div>
                          
                          <button
                             onClick={() => setDeleteConfirmUser(selectedUser)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 transition-all shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Account</span>
                          </button>

                          {selectedUser.profile?.is_verified || selectedUser.role === "ADMIN" ? (
                            <button
                              onClick={() => setSelectedUserForId(selectedUser)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 transition-all shadow-sm"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>ID Card</span>
                            </button>
                          ) : (
                            <div 
                              title="Member profile is incomplete/unverified"
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 text-xs font-bold rounded-lg border border-gray-200 dark:border-white/5 cursor-not-allowed"
                            >
                              <Lock className="w-3 h-3 text-amber-500/70" />
                              <span>ID Card (Unverified)</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">
                            {selectedUser.role === "COORDINATOR" ? "Zonal Leader" : selectedUser.role}
                          </p>
                          {selectedUser.profile?.is_verified || selectedUser.role === "ADMIN" ? (
                            <button
                              onClick={() => setSelectedUserForId(selectedUser)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 transition-all shadow-sm"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>ID Card</span>
                            </button>
                          ) : (
                            <div 
                              title="Member profile is incomplete/unverified"
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 text-xs font-bold rounded-lg border border-gray-200 dark:border-white/5 cursor-not-allowed"
                            >
                              <Lock className="w-3 h-3 text-amber-500/70" />
                              <span>ID Card (Unverified)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedUser.profile?.leadership_role && (
                      <div className="mt-2 text-xs font-extrabold text-amber-650 dark:text-amber-500 uppercase tracking-widest">
                        👑 HQ Position: {selectedUser.profile.leadership_role}
                      </div>
                    )}
                    {error && (
                      <p className="text-xs text-rose-500 mb-2">{error}</p>
                    )}
                    <p className="text-gray-550 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>

              {/* Details Grid */}
              <div className="grid sm:grid-cols-2 gap-6 mb-8 px-6 sm:px-10">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Campus / Zone</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedUser.profile?.campus_zone ? parseCampuses(selectedUser.profile.campus_zone).join(", ") : "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <img src="/kingschat.png" alt="" className="w-3.5 h-3.5 shrink-0 rounded-sm" />
                    <span>Kingschat Follow</span>
                  </span>
                  {selectedUser.kingschat_username ? (
                    <a
                      href={`https://kingschat.online/user/${selectedUser.kingschat_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25 px-2.5 py-1 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all scale-100 hover:scale-[1.02] transform"
                    >
                      <span>@{selectedUser.kingschat_username}</span>
                      <span className="text-[10px] opacity-75 font-normal">&rarr; Follow</span>
                    </a>
                  ) : (
                    <p className="font-medium text-gray-400 italic text-xs mt-1">Not provided</p>
                  )}
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

              {/* Zonal Leader/Admin Exclusive: Student Academy progress tracker */}
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
              You are about to permanently delete <span className="font-bold text-red-500 font-mono">ALL registered {title.toLowerCase()} accounts</span>. This action is irreversible and will permanently wipe out all profiles and credentials from the system database.
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

      {/* Enroll Member Modal */}
      {showEnrollModal && facultyId && (
        <EnrollMemberModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          facultyId={facultyId}
        />
      )}

      {/* ID Card Modal */}
      {selectedUserForId && (
        <IdCardModal
          isOpen={!!selectedUserForId}
          onClose={() => setSelectedUserForId(null)}
          member={{
            fullName: selectedUserForId.full_name || "Member",
            memberId: selectedUserForId.profile?.member_id || "LAA-DNC-PENDING",
            campusZone: selectedUserForId.profile?.campus_zone,
            avatarUrl: selectedUserForId.avatar_url,
            role: selectedUserForId.role,
            isVerified: selectedUserForId.profile?.is_verified ?? false,
          }}
        />
      )}
    </div>
  );
}
