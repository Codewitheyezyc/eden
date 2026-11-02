"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "react-hot-toast";
import { 
  User, Shield, Bell, Moon, Sun, Laptop, Users, Trash2, 
  HelpCircle, Settings, Check, Save, Sparkles, RefreshCw, Volume2,
  MapPin, Award, Plus, Edit3, Search, X, AlertTriangle, Loader2
} from "lucide-react";
import { 
  updateProfile, 
  updateFaculty, 
  updateUserRoleInFaculty, 
  manageCampusAction, 
  manageLeadershipRoleAction 
} from "./actions";
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

export interface CampusItem {
  id: string;
  name: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
}

export interface LeadershipRoleItem {
  id: string;
  title: string;
  isActive: boolean;
  leaderCount: number;
  createdAt: string;
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
    kingschatUsername: string;
    campusZone: string;
    dateOfBirth: string;
    bio: string;
  };
  members: FacultyMember[];
  campuses: CampusItem[];
  leadershipRoles: LeadershipRoleItem[];
}

type TabType = 
  | "profile" 
  | "faculty" 
  | "campuses"
  | "leadership"
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
  members: initialMembers,
  campuses: initialCampuses,
  leadershipRoles: initialRoles
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [members, setMembers] = useState<FacultyMember[]>(initialMembers);
  const { setTheme } = useTheme();
  const isAdmin = role === "ADMIN";

  // State Profile
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone);
  const [gender, setGender] = useState(currentUser.gender);
  const [kingschatUsername, setKingschatUsername] = useState(currentUser.kingschatUsername);
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

  // Campuses Management State
  const [campuses, setCampuses] = useState<CampusItem[]>(initialCampuses || []);
  const [campusSearch, setCampusSearch] = useState("");
  const [newCampusName, setNewCampusName] = useState("");
  const [isAddingCampus, setIsAddingCampus] = useState(false);
  const [editingCampus, setEditingCampus] = useState<{ id: string; name: string; oldName: string } | null>(null);
  const [isCampusLoading, setIsCampusLoading] = useState(false);

  // Leadership Roles Management State
  const [leadershipRoles, setLeadershipRoles] = useState<LeadershipRoleItem[]>(initialRoles || []);
  const [roleSearch, setRoleSearch] = useState("");
  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<{ id: string; title: string; oldTitle: string } | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  const tabs: { id: TabType; label: string; icon: any; roles?: string[] }[] = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "faculty", label: "Faculty Settings", icon: Settings, roles: ["ADMIN"] },
    { id: "campuses", label: "Campuses & Zones", icon: MapPin, roles: ["ADMIN"] },
    { id: "leadership", label: "Leadership Positions", icon: Award, roles: ["ADMIN"] },
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

    if (kingschatUsername && !/^[a-zA-Z0-9_]+$/.test(kingschatUsername)) {
      setSaveError("Kingschat username cannot contain spaces or special characters (only letters, numbers, and underscores).");
      setIsSaving(false);
      return;
    }

    try {
      await updateProfile({
        fullName,
        phone,
        gender,
        kingschatUsername,
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
    if (!isAdmin) return;
    try {
      await updateUserRoleInFaculty(facultyId, targetUserId, newRole);
      setMembers(prev => prev.map(m => m.user_id === targetUserId ? { ...m, role: newRole } : m));
      toast.success("Role updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update member role");
    }
  };

  // -------------------------------------------------------------
  // CAMPUS MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleAddCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampusName.trim()) return;

    setIsCampusLoading(true);
    const res = await manageCampusAction({
      action: "add",
      name: newCampusName.trim(),
    });
    setIsCampusLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Campus "${newCampusName.trim()}" added successfully!`);
      setCampuses(prev => [
        ...prev,
        {
          id: res.data?.id || String(Date.now()),
          name: newCampusName.trim(),
          isActive: true,
          memberCount: 0,
          createdAt: new Date().toISOString(),
        }
      ].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCampusName("");
      setIsAddingCampus(false);
    }
  };

  const handleUpdateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampus || !editingCampus.name.trim()) return;

    setIsCampusLoading(true);
    const res = await manageCampusAction({
      action: "update",
      id: editingCampus.id,
      name: editingCampus.name.trim(),
      oldName: editingCampus.oldName,
    });
    setIsCampusLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Campus renamed to "${editingCampus.name.trim()}"!`);
      setCampuses(prev =>
        prev.map(c =>
          c.id === editingCampus.id
            ? { ...c, name: editingCampus.name.trim() }
            : c
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingCampus(null);
    }
  };

  const handleDeleteCampus = async (campus: CampusItem) => {
    if (campus.memberCount > 0) {
      if (!window.confirm(
        `Warning: There are currently ${campus.memberCount} member(s) assigned to "${campus.name}". Deleting this campus will remove it from future selection. Continue?`
      )) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete "${campus.name}"?`)) {
        return;
      }
    }

    setIsCampusLoading(true);
    const res = await manageCampusAction({
      action: "delete",
      id: campus.id,
    });
    setIsCampusLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Campus "${campus.name}" deleted.`);
      setCampuses(prev => prev.filter(c => c.id !== campus.id));
    }
  };

  // -------------------------------------------------------------
  // LEADERSHIP ROLES MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim()) return;

    setIsRoleLoading(true);
    const res = await manageLeadershipRoleAction({
      action: "add",
      title: newRoleTitle.trim(),
    });
    setIsRoleLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Leadership position "${newRoleTitle.trim()}" added!`);
      setLeadershipRoles(prev => [
        ...prev,
        {
          id: res.data?.id || String(Date.now()),
          title: newRoleTitle.trim(),
          isActive: true,
          leaderCount: 0,
          createdAt: new Date().toISOString(),
        }
      ].sort((a, b) => a.title.localeCompare(b.title)));
      setNewRoleTitle("");
      setIsAddingRole(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !editingRole.title.trim()) return;

    setIsRoleLoading(true);
    const res = await manageLeadershipRoleAction({
      action: "update",
      id: editingRole.id,
      title: editingRole.title.trim(),
      oldTitle: editingRole.oldTitle,
    });
    setIsRoleLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Leadership position renamed to "${editingRole.title.trim()}"!`);
      setLeadershipRoles(prev =>
        prev.map(r =>
          r.id === editingRole.id
            ? { ...r, title: editingRole.title.trim() }
            : r
        ).sort((a, b) => a.title.localeCompare(b.title))
      );
      setEditingRole(null);
    }
  };

  const handleDeleteRole = async (roleItem: LeadershipRoleItem) => {
    if (roleItem.leaderCount > 0) {
      if (!window.confirm(
        `Warning: There are currently ${roleItem.leaderCount} leader(s) holding the title "${roleItem.title}". Are you sure you want to delete this position?`
      )) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete "${roleItem.title}"?`)) {
        return;
      }
    }

    setIsRoleLoading(true);
    const res = await manageLeadershipRoleAction({
      action: "delete",
      id: roleItem.id,
    });
    setIsRoleLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Leadership position "${roleItem.title}" deleted.`);
      setLeadershipRoles(prev => prev.filter(r => r.id !== roleItem.id));
    }
  };

  // Filtered lists
  const filteredCampuses = campuses.filter(c =>
    c.name.toLowerCase().includes(campusSearch.toLowerCase().trim())
  );

  const filteredRoles = leadershipRoles.filter(r =>
    r.title.toLowerCase().includes(roleSearch.toLowerCase().trim())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-52 lg:pb-16 max-w-6xl mx-auto">
      {/* Settings Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-emerald-500" /> Settings & Administration
        </h1>
        <p className="text-sm font-light text-gray-500 dark:text-gray-400 mt-1">
          Manage your personal preferences, faculty configuration, campuses, and leadership roles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Tabs (Sidebar style) */}
        <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 p-2 rounded-3xl shadow-sm flex md:flex-col overflow-x-auto gap-1">
          {tabs.map((tab) => {
            if (tab.roles && !tab.roles.includes(role)) return null;
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left whitespace-nowrap md:w-full",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-gray-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panes */}
        <div className="md:col-span-3 bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm">
          
          {/* Notifications banner */}
          {saveSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
              <Check className="w-4 h-4" /> Changes saved successfully!
            </div>
          )}
          {saveError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-500/20 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
              <Shield className="w-4 h-4" /> {saveError}
            </div>
          )}

          {/* 1. PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="text-emerald-500" /> Personal Profile
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Update your contact details, KingsChat handle, and public bio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">KingsChat Handle</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">@</span>
                    <input
                      type="text"
                      value={kingschatUsername}
                      onChange={(e) => setKingschatUsername(e.target.value)}
                      placeholder="username"
                      className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Short Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Share your background, passions, or ministry focus..."
                  className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  {isSaving ? "Saving Changes..." : "Save Profile"}
                </Button>
              </div>
            </form>
          )}

          {/* 2. FACULTY SETTINGS */}
          {activeTab === "faculty" && isAdmin && (
            <form onSubmit={handleFacultySave} className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="text-emerald-500" /> Faculty Configuration
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Adjust global names and attributes for this faculty workspace.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Faculty Workspace Name</label>
                <input
                  type="text"
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  {isSaving ? "Updating..." : "Update Faculty"}
                </Button>
              </div>
            </form>
          )}

          {/* 3. CAMPUSES & ZONES MANAGER */}
          {activeTab === "campuses" && isAdmin && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="text-emerald-500 w-5 h-5 shrink-0" />
                    <span>Campuses & Zones Manager</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Add new ministry campuses, rename existing zones, or remove obsolete locations. Updates reflect instantly across all registration forms.
                  </p>
                </div>

                {!isAddingCampus && !editingCampus && (
                  <Button
                    onClick={() => setIsAddingCampus(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Campus</span>
                  </Button>
                )}
              </div>

              {/* Add New Campus Form */}
              {isAddingCampus && (
                <form onSubmit={handleAddCampus} className="p-4 sm:p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add New Campus / Zone
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingCampus(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      required
                      value={newCampusName}
                      onChange={(e) => setNewCampusName(e.target.value)}
                      placeholder="e.g. Lagos Zone 7, Texas Campus, Mid-West Sub-zone"
                      className="flex-1 bg-white dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={isCampusLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
                      >
                        {isCampusLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Campus"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCampus(false)}
                        className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Edit Campus Form */}
              {editingCampus && (
                <form onSubmit={handleUpdateCampus} className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Edit Campus Name: &ldquo;{editingCampus.oldName}&rdquo;
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingCampus(null)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Renaming this campus will automatically update the records of all members currently registered under this name.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      required
                      value={editingCampus.name}
                      onChange={(e) => setEditingCampus({ ...editingCampus, name: e.target.value })}
                      className="flex-1 bg-white dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={isCampusLoading}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
                      >
                        {isCampusLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update Name"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setEditingCampus(null)}
                        className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Search filter for campuses */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={campusSearch}
                  onChange={(e) => setCampusSearch(e.target.value)}
                  placeholder="Search campuses or zones..."
                  className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Campuses List (Responsive Card Rows) */}
              <div className="space-y-2">
                {filteredCampuses.map((campus) => (
                  <div
                    key={campus.id}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-gray-50/70 dark:bg-white/[0.02] hover:bg-gray-100/70 dark:hover:bg-white/[0.05] border border-gray-200/60 dark:border-white/5 transition-all gap-2.5 sm:gap-4"
                  >
                    {/* Left: MapPin Icon + Campus Name */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                        {campus.name}
                      </span>
                    </div>

                    {/* Right: Badge + Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                        {campus.memberCount} {campus.memberCount === 1 ? "Member" : "Members"}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingCampus({ id: campus.id, name: campus.name, oldName: campus.name })}
                          className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                          title="Edit Campus Name"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampus(campus)}
                          className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Delete Campus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredCampuses.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-xs bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl border border-dashed border-gray-200 dark:border-white/5">
                    No campuses match your search. Click &ldquo;Add New Campus&rdquo; to create one.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. LEADERSHIP POSITIONS MANAGER */}
          {activeTab === "leadership" && isAdmin && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <Award className="text-emerald-500 w-5 h-5 shrink-0" />
                    <span>Leadership Positions Manager</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Manage all standardized and custom leadership roles. Any role added here is permanently selectable when promoting leaders.
                  </p>
                </div>

                {!isAddingRole && !editingRole && (
                  <Button
                    onClick={() => setIsAddingRole(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Position</span>
                  </Button>
                )}
              </div>

              {/* Add New Role Form */}
              {isAddingRole && (
                <form onSubmit={handleAddRole} className="p-4 sm:p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add New Leadership Role
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingRole(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      required
                      value={newRoleTitle}
                      onChange={(e) => setNewRoleTitle(e.target.value)}
                      placeholder="e.g. Costume Director, Senior Choreographer, Logistics Head"
                      className="flex-1 bg-white dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={isRoleLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
                      >
                        {isRoleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Position"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setIsAddingRole(false)}
                        className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Edit Role Form */}
              {editingRole && (
                <form onSubmit={handleUpdateRole} className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Edit Position Title: &ldquo;{editingRole.oldTitle}&rdquo;
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingRole(null)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Renaming this role will automatically update the official title on the profiles of all leaders currently assigned to it.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      required
                      value={editingRole.title}
                      onChange={(e) => setEditingRole({ ...editingRole, title: e.target.value })}
                      className="flex-1 bg-white dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={isRoleLoading}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
                      >
                        {isRoleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update Title"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setEditingRole(null)}
                        className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Search filter for roles */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Search leadership positions..."
                  className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Roles List (Responsive Card Rows) */}
              <div className="space-y-2">
                {filteredRoles.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-gray-50/70 dark:bg-white/[0.02] hover:bg-gray-100/70 dark:hover:bg-white/[0.05] border border-gray-200/60 dark:border-white/5 transition-all gap-2.5 sm:gap-4"
                  >
                    {/* Left: Award Icon + Position Title */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                        {r.title}
                      </span>
                    </div>

                    {/* Right: Badge + Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
                        {r.leaderCount} {r.leaderCount === 1 ? "Leader" : "Leaders"}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingRole({ id: r.id, title: r.title, oldTitle: r.title })}
                          className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                          title="Edit Position Title"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(r)}
                          className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Delete Position"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredRoles.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-xs bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl border border-dashed border-gray-200 dark:border-white/5">
                    No positions match your search. Click &ldquo;Add New Position&rdquo; to create one.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="text-emerald-500" /> Notifications & Communication
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Email Notifications</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Receive real-time alerts for faculty events and assignments.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 rounded"
                  />
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Announcement Broadcasts</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Show popups for high-priority news sent by HQ leaders.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={announcementNotif}
                    onChange={(e) => setAnnouncementNotif(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 rounded"
                  />
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">System Sound Effects</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Play gentle chimes when actions succeed.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundNotif}
                    onChange={(e) => setSoundNotif(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Moon className="text-emerald-500" /> Interface Appearance
              </h2>

              <p className="text-sm font-light text-gray-500 dark:text-gray-400 leading-relaxed">
                Choose your visual theme preference. The Eden UI dynamically adapts with glassmorphism in light and dark modes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                  onClick={() => setTheme("light")}
                  className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl hover:border-emerald-500 flex flex-col items-center justify-center space-y-3 transition-all"
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <span className="text-xs font-bold">Light</span>
                </button>
                <button 
                  onClick={() => setTheme("dark")}
                  className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl hover:border-emerald-500 flex flex-col items-center justify-center space-y-3 transition-all"
                >
                  <Moon className="w-6 h-6 text-emerald-500" />
                  <span className="text-xs font-bold">Dark</span>
                </button>
                <button 
                  onClick={() => setTheme("system")}
                  className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl hover:border-emerald-500 flex flex-col items-center justify-center space-y-3 transition-all"
                >
                  <Laptop className="w-6 h-6 text-gray-500" />
                  <span className="text-xs font-bold">System</span>
                </button>
              </div>
            </div>
          )}

          {/* 7. SECURITY */}
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

          {/* 8. ROLES & PERMISSIONS */}
          {activeTab === "roles" && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="text-emerald-500" /> Roles & Permissions
              </h2>

              <p className="text-sm font-light text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                Administrate user permissions. Change user roles between <strong>Admin</strong>, <strong>Coordinator</strong>, or <strong>Student</strong> instantly.
              </p>

              {/* Members Table */}
              <div className="bg-gray-50/50 dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-150 dark:divide-white/5 max-h-[500px] overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.user_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center justify-center shrink-0 border border-emerald-500/20">
                          {member.user?.full_name ? member.user.full_name[0].toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {member.user?.full_name || "Anonymous Member"}
                          </p>
                          <p className="text-xs text-gray-400 font-light truncate max-w-xs">{member.user?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value as any)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer outline-none",
                            member.role === "ADMIN" 
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-500" 
                              : member.role === "COORDINATOR" 
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                          )}
                        >
                          <option value="STUDENT" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white">Student</option>
                          <option value="COORDINATOR" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white">Coordinator</option>
                          <option value="ADMIN" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white">Admin</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 9. ACCOUNT OPTIONS */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Trash2 className="text-rose-500" /> Account Management
              </h2>

              <p className="text-sm font-light text-gray-500 dark:text-gray-400 leading-relaxed">
                Options to export your profile archives or permanently remove your access keys.
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
