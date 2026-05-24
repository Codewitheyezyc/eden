"use client";

import { useState, useMemo } from "react";
import { parseCampuses } from "@/lib/campuses";
import { cn } from "@/lib/utils";

interface MemberProfile {
  phone: string;
  gender: string;
  kingschat: string;
  campusZone: string;
  dateOfBirth: string;
  bio: string;
  isVerified: boolean;
  leadershipRole: string;
}

interface FacultyMember {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: "ADMIN" | "COORDINATOR" | "STUDENT";
  createdAt: string;
  profile: MemberProfile | null;
}

interface AttendanceClientProps {
  initialMembers: FacultyMember[];
  viewerRole: string;
  facultySlug: string;
}

export function AttendanceClient({ initialMembers, viewerRole, facultySlug }: AttendanceClientProps) {
  // Search and Filter State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [campusFilter, setCampusFilter] = useState<string>("ALL");
  const [genderFilter, setGenderFilter] = useState<string>("ALL");
  
  // View mode state: Grouped vs Flat (Searchable/Sortable)
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  
  // Sorting State (Applicable to Flat View)
  const [sortField, setSortField] = useState<"name" | "campus" | "role">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Pagination State (Applicable to Flat View)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 1. Gather all unique campuses from the data to populate the campus filter dropdown dynamically!
  const uniqueCampuses = useMemo(() => {
    const campuses = new Set<string>();
    initialMembers.forEach(m => {
      if (m.profile?.campusZone) {
        const parsed = parseCampuses(m.profile.campusZone);
        parsed.forEach(c => campuses.add(c));
      }
    });
    return Array.from(campuses).sort();
  }, [initialMembers]);

  // 2. Perform searching, filtering, and flat sorting in a single memo
  const filteredAndSortedMembers = useMemo(() => {
    let result = [...initialMembers];

    // Search Filter
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        m =>
          m.fullName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.profile?.phone && m.profile.phone.includes(q)) ||
          (m.profile?.kingschat && m.profile.kingschat.toLowerCase().includes(q))
      );
    }

    // Role Filter
    if (roleFilter !== "ALL") {
      result = result.filter(m => m.role === roleFilter);
    }

    // Gender Filter
    if (genderFilter !== "ALL") {
      result = result.filter(m => m.profile?.gender === genderFilter);
    }

    // Campus Filter (Checks if user belongs to selected campus)
    if (campusFilter !== "ALL") {
      result = result.filter(m => {
        if (!m.profile?.campusZone) return false;
        const parsed = parseCampuses(m.profile.campusZone);
        return parsed.includes(campusFilter);
      });
    }

    // Apply Sorting (for Flat View)
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.fullName.localeCompare(b.fullName);
      } else if (sortField === "campus") {
        const cA = a.profile?.campusZone ? parseCampuses(a.profile.campusZone).join(", ") : "";
        const cB = b.profile?.campusZone ? parseCampuses(b.profile.campusZone).join(", ") : "";
        comparison = cA.localeCompare(cB);
      } else if (sortField === "role") {
        const roleWeights = { ADMIN: 1, COORDINATOR: 2, STUDENT: 3 };
        comparison = roleWeights[a.role] - roleWeights[b.role];
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [initialMembers, search, roleFilter, campusFilter, genderFilter, sortField, sortDirection]);

  // 3. Hierarchical Grouping Logic
  const groupedData = useMemo(() => {
    // We group from the CURRENT FILTERED list, so filters are respected in Grouped mode too!
    const list = filteredAndSortedMembers;

    // A. Extract Admins
    const admins = list.filter(m => m.role === "ADMIN");

    // B. Group Coordinators by campus
    // Since a coordinator could theoretically have multiple campuses, we index them under each campus they belong to
    const coordinatorsByCampus: { [campus: string]: FacultyMember[] } = {};
    const coordinatorsList = list.filter(m => m.role === "COORDINATOR");

    coordinatorsList.forEach(coord => {
      const campuses = coord.profile?.campusZone ? parseCampuses(coord.profile.campusZone) : ["No Campus Specified"];
      campuses.forEach(c => {
        if (!coordinatorsByCampus[c]) {
          coordinatorsByCampus[c] = [];
        }
        coordinatorsByCampus[c].push(coord);
      });
    });

    // C. Group Students by campus
    const studentsByCampus: { [campus: string]: FacultyMember[] } = {};
    const studentsList = list.filter(m => m.role === "STUDENT");

    studentsList.forEach(student => {
      const campuses = student.profile?.campusZone ? parseCampuses(student.profile.campusZone) : ["No Campus Specified"];
      campuses.forEach(c => {
        if (!studentsByCampus[c]) {
          studentsByCampus[c] = [];
        }
        studentsByCampus[c].push(student);
      });
    });

    return {
      admins,
      coordinatorsByCampus,
      studentsByCampus,
    };
  }, [filteredAndSortedMembers]);

  // 4. Flat View Pagination Calculation
  const totalItems = filteredAndSortedMembers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedMembers.slice(start, start + itemsPerPage);
  }, [filteredAndSortedMembers, currentPage, itemsPerPage]);

  // 5. Functional client-side Export to CSV
  const handleExportCSV = () => {
    if (filteredAndSortedMembers.length === 0) return;

    // Headers
    const headers = [
      "Full Name",
      "Email",
      "Phone",
      "Kingschat Handle",
      "Gender",
      "Date of Birth",
      "Campuses",
      "Role",
    ];

    if (viewerRole === "ADMIN") {
      headers.push("Leadership Role");
    }

    // Rows
    const rows = filteredAndSortedMembers.map(m => {
      const row = [
        m.fullName,
        m.email,
        m.profile?.phone || "",
        m.profile?.kingschat ? `@${m.profile.kingschat}` : "",
        m.profile?.gender || "",
        m.profile?.dateOfBirth || "",
        m.profile?.campusZone ? parseCampuses(m.profile.campusZone).join("; ") : "",
        m.role,
      ];

      if (viewerRole === "ADMIN") {
        row.push(m.profile?.leadershipRole || "");
      }

      // Escape quotes in fields
      return row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Eden_General_Attendance_${facultySlug}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset page when search or filters change
  const handleFilterChange = (filterSetter: (val: string) => void, val: string) => {
    filterSetter(val);
    setCurrentPage(1);
  };

  // Render Role Badge helper
  const renderRoleBadge = (role: "ADMIN" | "COORDINATOR" | "STUDENT") => {
    const styles = {
      ADMIN: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      COORDINATOR: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      STUDENT: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    };
    return (
      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize tracking-wide shrink-0", styles[role])}>
        {role.toLowerCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Control Panel: Search & Filters (Glassmorphic) */}
      <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Field */}
          <div className="relative md:col-span-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => handleFilterChange(setSearch, e.target.value)}
              placeholder="Search members by name, email, phone, KingsChat..."
              className="w-full bg-white dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/30 dark:border-white/5 md:col-span-2 justify-between">
            <button
              onClick={() => setViewMode("grouped")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all",
                viewMode === "grouped"
                  ? "bg-white dark:bg-[#0f0f15] text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200/30 dark:border-white/5"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/></svg>
              Hierarchical Groups
            </button>
            <button
              onClick={() => setViewMode("flat")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all",
                viewMode === "flat"
                  ? "bg-white dark:bg-[#0f0f15] text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200/30 dark:border-white/5"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
              Flat Data Table
            </button>
          </div>
        </div>

        {/* Dropdown Filters & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-150 dark:border-white/5">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Campus Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Campus</label>
              <select
                value={campusFilter}
                onChange={e => handleFilterChange(setCampusFilter, e.target.value)}
                className="bg-white dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-gray-250 outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Campuses</option>
                {uniqueCampuses.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter (Only show to Admins, coordinators only see coordinators/students anyway) */}
            {viewerRole === "ADMIN" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Role</label>
                <select
                  value={roleFilter}
                  onChange={e => handleFilterChange(setRoleFilter, e.target.value)}
                  className="bg-white dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-gray-250 outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admins</option>
                  <option value="COORDINATOR">Coordinators</option>
                  <option value="STUDENT">Students</option>
                </select>
              </div>
            )}

            {/* Gender Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Gender</label>
              <select
                value={genderFilter}
                onChange={e => handleFilterChange(setGenderFilter, e.target.value)}
                className="bg-white dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-gray-250 outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Export Action */}
          <div className="flex gap-2 self-end">
            <button
              onClick={handleExportCSV}
              disabled={filteredAndSortedMembers.length === 0}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-600/10 hover:shadow-md disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* 2. Content Display Container */}
      <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Flat View Table Rendering */}
        {viewMode === "flat" && (
          <div className="overflow-x-auto relative min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest select-none z-10">
                  <th className="py-4 px-6">Avatar</th>
                  <th className="py-4 px-4 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => {
                    setSortDirection(sortField === "name" && sortDirection === "asc" ? "desc" : "asc");
                    setSortField("name");
                  }}>
                    <div className="flex items-center gap-1">
                      Full Name
                      {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                    </div>
                  </th>
                  <th className="py-4 px-4">Email</th>
                  <th className="py-4 px-4">Phone</th>
                  <th className="py-4 px-4">KingsChat</th>
                  <th className="py-4 px-4">Gender</th>
                  <th className="py-4 px-4 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => {
                    setSortDirection(sortField === "campus" && sortDirection === "asc" ? "desc" : "asc");
                    setSortField("campus");
                  }}>
                    <div className="flex items-center gap-1">
                      Campus
                      {sortField === "campus" && (sortDirection === "asc" ? "▲" : "▼")}
                    </div>
                  </th>
                  <th className="py-4 px-4 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => {
                    setSortDirection(sortField === "role" && sortDirection === "asc" ? "desc" : "asc");
                    setSortField("role");
                  }}>
                    <div className="flex items-center gap-1">
                      Role
                      {sortField === "role" && (sortDirection === "asc" ? "▲" : "▼")}
                    </div>
                  </th>
                  {viewerRole === "ADMIN" && <th className="py-4 px-6 text-emerald-600 dark:text-emerald-400">HQ Leadership Role</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/30 dark:divide-white/5 text-sm text-gray-700 dark:text-gray-300">
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={viewerRole === "ADMIN" ? 9 : 8} className="py-16 text-center">
                      {renderEmptyState()}
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50/40 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-6">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/10 overflow-hidden shadow-inner">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" />
                          ) : (
                            m.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-950 dark:text-white whitespace-nowrap">{m.fullName}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-450">{m.email}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">{m.profile?.phone || "—"}</td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-medium">
                        {m.profile?.kingschat ? `@${m.profile.kingschat}` : "—"}
                      </td>
                      <td className="py-3 px-4">{m.profile?.gender || "—"}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {m.profile?.campusZone ? (
                            parseCampuses(m.profile.campusZone).map(c => (
                              <span key={c} className="inline-flex bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 px-2 py-0.5 rounded text-[10px] font-semibold text-gray-650 dark:text-gray-300">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{renderRoleBadge(m.role)}</td>
                      {viewerRole === "ADMIN" && (
                        <td className="py-3 px-6 text-emerald-700 dark:text-emerald-300 font-bold whitespace-nowrap">
                          {m.profile?.leadershipRole || <span className="text-gray-400 dark:text-gray-500 font-normal italic">None</span>}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Grouped View Hierarchy Rendering */}
        {viewMode === "grouped" && (
          <div className="p-6 md:p-8 space-y-8 min-h-[300px]">
            {filteredAndSortedMembers.length === 0 ? (
              <div className="py-12">{renderEmptyState()}</div>
            ) : (
              <>
                {/* GROUP 1: ADMINS */}
                {viewerRole === "ADMIN" && groupedData.admins.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-white/5">
                      <span className="text-lg">🛡️</span>
                      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                        Administrators ({groupedData.admins.length})
                      </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {groupedData.admins.map(admin => renderGroupedCard(admin))}
                    </div>
                  </div>
                )}

                {/* GROUP 2: COORDINATORS BY CAMPUS */}
                {Object.keys(groupedData.coordinatorsByCampus).length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-white/5">
                      <span className="text-lg">🎗️</span>
                      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                        Coordinators by Campus
                      </h3>
                    </div>
                    <div className="space-y-6 pl-2">
                      {Object.entries(groupedData.coordinatorsByCampus).map(([campusName, coords]) => (
                        <div key={campusName} className="space-y-3">
                          <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest pl-1">
                            📍 {campusName} ({coords.length})
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {coords.map(coord => renderGroupedCard(coord))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GROUP 3: STUDENTS BY CAMPUS */}
                {Object.keys(groupedData.studentsByCampus).length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-white/5">
                      <span className="text-lg">🎓</span>
                      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                        Students by Campus
                      </h3>
                    </div>
                    <div className="space-y-6 pl-2">
                      {Object.entries(groupedData.studentsByCampus).map(([campusName, students]) => (
                        <div key={campusName} className="space-y-3">
                          <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest pl-1">
                            📍 {campusName} ({students.length})
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {students.map(student => renderGroupedCard(student))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Flat View Pagination Controls (Only flat view) */}
      {viewMode === "flat" && totalItems > 0 && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-gray-200/30 dark:border-white/5">
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Showing <span className="font-bold text-gray-800 dark:text-gray-200">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to{" "}
            <span className="font-bold text-gray-800 dark:text-gray-200">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
            <span className="font-bold text-gray-800 dark:text-gray-200">{totalItems}</span> members
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200/40 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 dark:text-gray-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={cn(
                  "w-8 h-8 font-bold text-xs rounded-xl border transition-all",
                  currentPage === idx + 1
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10"
                    : "border-gray-200/40 dark:border-white/5 text-gray-700 hover:bg-gray-50 dark:text-gray-450 dark:hover:bg-white/5"
                )}
              >
                {idx + 1}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200/40 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 dark:text-gray-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Grouped Card Renderer helper (renders a beautiful glassmorphic contact card)
  function renderGroupedCard(m: FacultyMember) {
    const isViewerAdmin = viewerRole === "ADMIN";
    return (
      <div
        key={m.id}
        className="bg-white/70 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 hover:border-emerald-500/30 hover:shadow-md hover:-translate-y-0.5 rounded-2xl p-5 flex items-start gap-4 transition-all duration-300 relative group overflow-hidden"
      >
        {/* Glowing micro-animation background element */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/10 overflow-hidden shadow-inner">
          {m.avatarUrl ? (
            <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            m.fullName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-gray-950 dark:text-white truncate" title={m.fullName}>
              {m.fullName}
            </h4>
            {renderRoleBadge(m.role)}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={m.email}>{m.email}</p>
          
          {m.profile?.phone && (
            <div className="flex items-center gap-1.5 text-xs text-gray-650 dark:text-gray-300">
              <span>📞</span>
              <span className="font-mono">{m.profile.phone}</span>
            </div>
          )}

          {m.profile?.kingschat && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>💬</span>
              <span>@{m.profile.kingschat}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1 pt-1.5">
            {m.profile?.campusZone ? (
              parseCampuses(m.profile.campusZone).map(c => (
                <span key={c} className="inline-flex items-center gap-0.5 bg-gray-150 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 text-[9px] font-bold text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                  📍 {c}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-gray-400 italic">No Campus</span>
            )}
          </div>

          {/* Admin HQ Leadership Role Display */}
          {isViewerAdmin && m.role === "ADMIN" && m.profile?.leadershipRole && (
            <div className="mt-2.5 pt-2 border-t border-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-450 tracking-wider uppercase flex items-center justify-between bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
              <span>HQ Leader:</span>
              <span className="text-gray-800 dark:text-white font-extrabold normal-case text-xs">{m.profile.leadershipRole}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Beautiful empty state block
  function renderEmptyState() {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 border border-gray-200/30 dark:border-white/5 text-gray-400 dark:text-gray-550 rounded-2xl flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h4 className="font-bold text-gray-900 dark:text-white text-base">No attendance data found</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1.5 leading-relaxed">
          No verified members match the active search filters. Ensure candidates have set up 100% of their profile variables.
        </p>
      </div>
    );
  }
}
