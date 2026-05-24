"use client";

import { useState, useMemo } from "react";
import { parseCampuses } from "@/lib/campuses";
import { cn } from "@/lib/utils";

interface AttendeeProfile {
  phone: string;
  gender: string;
  kingschat: string;
  campusZone: string;
  isVerified: boolean;
  leadershipRole: string;
}

interface EventAttendee {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  checkInTime: string;
  status: string;
  proofImageUrl: string | null;
  role: "ADMIN" | "COORDINATOR" | "STUDENT";
  profile: AttendeeProfile | null;
}

interface EventData {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string | null;
}

interface EventAttendanceClientProps {
  event: EventData;
  initialAttendees: EventAttendee[];
  viewerRole: string;
  facultySlug: string;
}

type TabType = "attendees" | "qr_scanner" | "history" | "analytics";

export function EventAttendanceClient({ event, initialAttendees, viewerRole, facultySlug }: EventAttendanceClientProps) {
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<TabType>("attendees");

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Flat Table pagination & sorting
  const [sortField, setSortField] = useState<"name" | "campus" | "time">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State for viewing Selfie Proofs!
  const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);

  // Format Event Date beautifully
  const eventDateStr = useMemo(() => {
    const d = new Date(event.event_date);
    return {
      full: d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
  }, [event.event_date]);

  // Aggregate dynamically all unique campuses from attendees list
  const uniqueCampuses = useMemo(() => {
    const campuses = new Set<string>();
    initialAttendees.forEach(a => {
      if (a.profile?.campusZone) {
        parseCampuses(a.profile.campusZone).forEach(c => campuses.add(c));
      }
    });
    return Array.from(campuses).sort();
  }, [initialAttendees]);

  // Calculate Key Event metrics
  const metrics = useMemo(() => {
    const total = initialAttendees.length;
    const studentsCount = initialAttendees.filter(a => a.role === "STUDENT").length;
    const coordCount = initialAttendees.filter(a => a.role === "COORDINATOR").length;
    const adminCount = initialAttendees.filter(a => a.role === "ADMIN").length;
    
    // Group present count by campus
    const campusDistribution: { [key: string]: number } = {};
    initialAttendees.forEach(a => {
      if (a.profile?.campusZone) {
        parseCampuses(a.profile.campusZone).forEach(c => {
          campusDistribution[c] = (campusDistribution[c] || 0) + 1;
        });
      }
    });

    return {
      total,
      studentsCount,
      coordCount,
      adminCount,
      campusDistribution,
    };
  }, [initialAttendees]);

  // Dynamic search, filter, and sort attendees
  const processedAttendees = useMemo(() => {
    let result = [...initialAttendees];

    // Search query
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        a =>
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.profile?.kingschat && a.profile.kingschat.toLowerCase().includes(q))
      );
    }

    // Role filter
    if (roleFilter !== "ALL") {
      result = result.filter(a => a.role === roleFilter);
    }

    // Gender filter
    if (genderFilter !== "ALL") {
      result = result.filter(a => a.profile?.gender === genderFilter);
    }

    // Campus filter
    if (campusFilter !== "ALL") {
      result = result.filter(a => {
        if (!a.profile?.campusZone) return false;
        return parseCampuses(a.profile.campusZone).includes(campusFilter);
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.fullName.localeCompare(b.fullName);
      } else if (sortField === "campus") {
        const cA = a.profile?.campusZone ? parseCampuses(a.profile.campusZone).join(", ") : "";
        const cB = b.profile?.campusZone ? parseCampuses(b.profile.campusZone).join(", ") : "";
        comparison = cA.localeCompare(cB);
      } else if (sortField === "time") {
        comparison = new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [initialAttendees, search, roleFilter, genderFilter, campusFilter, sortField, sortDirection]);

  // Paginate list
  const totalItems = processedAttendees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedAttendees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedAttendees.slice(start, start + itemsPerPage);
  }, [processedAttendees, currentPage, itemsPerPage]);

  // Functional client-side Export to CSV
  const handleExportCSV = () => {
    if (processedAttendees.length === 0) return;

    const headers = ["Full Name", "Email", "Role", "Check-In Date/Time", "Status", "Campuses", "KingsChat"];
    if (viewerRole === "ADMIN") {
      headers.push("HQ Leadership Role");
    }

    const rows = processedAttendees.map(a => {
      const row = [
        a.fullName,
        a.email,
        a.role,
        a.checkInTime,
        a.status,
        a.profile?.campusZone ? parseCampuses(a.profile.campusZone).join("; ") : "",
        a.profile?.kingschat ? `@${a.profile.kingschat}` : "",
      ];
      if (viewerRole === "ADMIN") {
        row.push(a.profile?.leadershipRole || "");
      }
      return row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Eden_Event_${event.title.replace(/\s+/g, "_")}_Attendance_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterChange = (filterSetter: (val: string) => void, val: string) => {
    filterSetter(val);
    setCurrentPage(1);
  };

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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* SECTION 1: Event Summary Banner & Analytics */}
      <div className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent backdrop-blur-xl border border-emerald-500/10 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start gap-6 relative overflow-hidden">
        {/* Glowing Decorative Backgrounds */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Event Thumbnail */}
        <div className="w-full md:w-48 h-32 rounded-2xl bg-gray-100 dark:bg-black overflow-hidden border border-gray-200/50 dark:border-white/10 shrink-0">
          {event.image_url ? (
            <img src={event.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center font-bold text-3xl text-emerald-600 dark:text-emerald-400">
              📅
            </div>
          )}
        </div>

        {/* Summary Info */}
        <div className="flex-1 space-y-3 min-w-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">{event.title}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{event.description || "No description provided."}</p>
          </div>
          
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 pt-1">
            <span className="flex items-center gap-1.5">
              📅 {eventDateStr.full}
            </span>
            <span className="flex items-center gap-1.5">
              ⏰ {eventDateStr.time}
            </span>
            <span className="flex items-center gap-1.5 truncate">
              📍 {event.location || "No Location Specified"}
            </span>
          </div>
        </div>

        {/* High-Level Count Indicators */}
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-200/50 dark:border-white/5">
          <div className="bg-white/50 dark:bg-[#060608]/40 border border-gray-200/30 dark:border-white/5 p-4 rounded-2xl text-center shadow-sm">
            <h4 className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Total Present</h4>
            <p className="text-3xl font-extrabold text-emerald-650 dark:text-emerald-400 mt-1">{metrics.total}</p>
          </div>
          <div className="bg-white/50 dark:bg-[#060608]/40 border border-gray-200/30 dark:border-white/5 p-4 rounded-2xl text-center shadow-sm">
            <h4 className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Active Campuses</h4>
            <p className="text-3xl font-extrabold text-blue-650 dark:text-blue-400 mt-1">
              {Object.keys(metrics.campusDistribution).length}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Future-Ready Tab Navigation */}
      <div className="flex border-b border-gray-200/60 dark:border-white/5 p-1 bg-gray-50 dark:bg-white/5 rounded-2xl md:max-w-xl shadow-inner border">
        {(["attendees", "qr_scanner", "history", "analytics"] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize select-none text-center flex items-center justify-center gap-1.5",
              activeTab === tab
                ? "bg-white dark:bg-[#0f0f15] text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-250/20 dark:border-white/5"
                : "text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
            )}
          >
            {tab === "attendees" && "👥 Attendees"}
            {tab === "qr_scanner" && "⚡ QR check-in"}
            {tab === "history" && "🕒 History"}
            {tab === "analytics" && "📊 Analytics"}
          </button>
        ))}
      </div>

      {/* SECTION 3: Content rendering depending on the selected Tab */}
      
      {/* TAB 1: ATTENDEES TABLE */}
      {activeTab === "attendees" && (
        <div className="space-y-6">
          {/* Controls Card */}
          <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={e => handleFilterChange(setSearch, e.target.value)}
                  placeholder="Search attendee by name, email, kingschat..."
                  className="w-full bg-white dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
                />
              </div>

              {/* CSV Export */}
              <button
                onClick={handleExportCSV}
                disabled={processedAttendees.length === 0}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-3 rounded-2xl transition-all shadow-sm disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV list
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-200/50 dark:border-white/5">
              {/* Campus */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Campus</label>
                <select
                  value={campusFilter}
                  onChange={e => handleFilterChange(setCampusFilter, e.target.value)}
                  className="bg-white dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-gray-250 outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">All Campuses</option>
                  {uniqueCampuses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Gender</label>
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

              {/* Role (Only visible to admin) */}
              {viewerRole === "ADMIN" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Role</label>
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
            </div>
          </div>

          {/* Attendees Table Card */}
          <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto relative">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest select-none z-10">
                    <th className="py-4 px-6 w-16">Selfie</th>
                    <th className="py-4 px-4 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => {
                      setSortDirection(sortField === "name" && sortDirection === "asc" ? "desc" : "asc");
                      setSortField("name");
                    }}>
                      <div className="flex items-center gap-1">
                        Attendee
                        {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                      </div>
                    </th>
                    <th className="py-4 px-4 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => {
                      setSortDirection(sortField === "campus" && sortDirection === "asc" ? "desc" : "asc");
                      setSortField("campus");
                    }}>
                      <div className="flex items-center gap-1">
                        Campus
                        {sortField === "campus" && (sortDirection === "asc" ? "▲" : "▼")}
                      </div>
                    </th>
                    <th className="py-4 px-4">Role</th>
                    <th className="py-4 px-4 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => {
                      setSortDirection(sortField === "time" && sortDirection === "asc" ? "desc" : "asc");
                      setSortField("time");
                    }}>
                      <div className="flex items-center gap-1">
                        Check-in Time
                        {sortField === "time" && (sortDirection === "asc" ? "▲" : "▼")}
                      </div>
                    </th>
                    <th className="py-4 px-4">KingsChat</th>
                    {viewerRole === "ADMIN" && <th className="py-4 px-6 text-emerald-600 dark:text-emerald-400">HQ Leadership Role</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/5 text-sm text-gray-700 dark:text-gray-300">
                  {paginatedAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={viewerRole === "ADMIN" ? 7 : 6} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-3xl mb-3">👻</span>
                          <h4 className="font-bold text-gray-900 dark:text-white">No Attendees Present</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">No verified users match this request. Remind members to mark present in events card!</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedAttendees.map(a => (
                      <tr key={a.userId} className="hover:bg-gray-50/40 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-6">
                          <div 
                            onClick={() => a.proofImageUrl && setSelectedSelfie(a.proofImageUrl)}
                            className={cn(
                              "w-10 h-10 rounded-xl overflow-hidden border bg-gray-105 border-gray-200/50 dark:border-white/5 shrink-0 shadow-inner flex items-center justify-center text-lg cursor-pointer transition-transform hover:scale-105 active:scale-95 relative group",
                              !a.proofImageUrl && "cursor-default hover:scale-100"
                            )}
                          >
                            {a.proofImageUrl ? (
                              <>
                                <img src={a.proofImageUrl} alt="Selfie" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold select-none">
                                  🔍
                                </div>
                              </>
                            ) : (
                              "👤"
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mr-3 border border-emerald-500/10 overflow-hidden">
                              {a.avatarUrl ? <img src={a.avatarUrl} className="w-full h-full object-cover" /> : a.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-950 dark:text-white truncate max-w-[150px]">{a.fullName}</p>
                              <p className="text-[10px] text-gray-400 truncate max-w-[150px] mt-0.5">{a.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {a.profile?.campusZone ? (
                              parseCampuses(a.profile.campusZone).map(c => (
                                <span key={c} className="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-[10px] font-semibold text-gray-650 dark:text-gray-300 border border-gray-200 dark:border-white/5">
                                  {c}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">{renderRoleBadge(a.role)}</td>
                        <td className="py-3 px-4 font-mono text-xs whitespace-nowrap text-gray-500">
                          {new Date(a.checkInTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                          {a.profile?.kingschat ? `@${a.profile.kingschat}` : "—"}
                        </td>
                        {viewerRole === "ADMIN" && (
                          <td className="py-3 px-6 text-emerald-700 dark:text-emerald-300 font-bold whitespace-nowrap">
                            {a.role === "ADMIN" && a.profile?.leadershipRole ? (
                              a.profile.leadershipRole
                            ) : (
                              <span className="text-gray-400 font-normal italic">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination block */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between px-6 py-4 bg-white/40 dark:bg-black/20 backdrop-blur-md border-t border-gray-200/50 dark:border-white/5">
                <span className="text-xs text-gray-400 font-medium">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} attendees
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-gray-200/50 dark:border-white/5 rounded-lg disabled:opacity-30"
                  >
                    ◀
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        "w-6 h-6 rounded-md text-xs font-bold",
                        currentPage === i + 1 ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-gray-200/50 dark:border-white/5 rounded-lg disabled:opacity-30"
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QR CHECK-IN SCANNER (FUTURE INTEGRATION MOCKUP) */}
      {activeTab === "qr_scanner" && (
        <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col items-center max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 flex items-center justify-center font-bold text-2xl animate-pulse">
            ⚡
          </div>
          <div>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-md uppercase font-extrabold tracking-widest text-[8px]">
              Future System Architecture
            </span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-3">Advanced QR Attendance Scanner</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md leading-relaxed">
              Future releases will support automated check-in terminals. Facilitators can instantly log students present by scanning their custom KingsChat ticket.
            </p>
          </div>

          {/* Scanner Viewfinder Simulation */}
          <div className="w-64 h-64 border-4 border-emerald-500/25 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center bg-black/40 border-dashed animate-pulse shadow-inner p-4">
            {/* Corner Bracket decorations */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />
            
            {/* Scan animation line */}
            <div className="absolute left-0 w-full h-1 bg-emerald-500/80 blur-xs top-1/2 -translate-y-1/2 animate-bounce" />

            <div className="text-white text-xs font-semibold z-10 flex flex-col items-center gap-2">
              <span className="text-3xl">📷</span>
              <span className="opacity-80">Waiting for QR Code...</span>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl w-full text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            🚀 System is pre-configured with secure UUID-matched verification pipelines to support rapid QR hardware scanners.
          </div>
        </div>
      )}

      {/* TAB 3: TIMELINE HISTORY (FUTURE INTEGRATION MOCKUP) */}
      {activeTab === "history" && (
        <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕒</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Check-In Chronology Log</h3>
              <p className="text-xs text-gray-400">Chronological history log of event registrations.</p>
            </div>
          </div>

          {/* Timeline points */}
          <div className="space-y-6 pl-4 border-l-2 border-emerald-500/20 py-2">
            {[
              { time: "09:12 AM", action: "Coordinator check-in", detail: "Lagos Zone 1 coordinator logs 12 students present." },
              { time: "08:55 AM", action: "Admin System Sync", detail: "Automatic verification job synced 4 accounts." },
              { time: "08:30 AM", action: "Attendance Gates Opened", detail: "General gates unlocked for verified student selfies." }
            ].map((hist, idx) => (
              <div key={idx} className="relative space-y-1 pl-6">
                {/* Timeline dot */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-[#0a0a0a] shadow-sm" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest">{hist.time}</span>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">{hist.action}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-450 font-normal leading-relaxed">{hist.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS & CHARTS (FUTURE INTEGRATION MOCKUP) */}
      {activeTab === "analytics" && (
        <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-gray-250/20 dark:border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Realtime Analytics & Insights</h3>
                <p className="text-xs text-gray-400">Deep campus distribution and time-density tracking logs.</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest">
              Live Mockup
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Campus charts mockup */}
            <div className="bg-gray-50/50 dark:bg-white/5 border border-gray-200/20 dark:border-white/5 p-5 rounded-2xl space-y-4 shadow-inner">
              <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Top Campuses</h4>
              <div className="space-y-3">
                {Object.entries(metrics.campusDistribution).slice(0, 4).map(([name, count]) => {
                  const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                  return (
                    <div key={name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                        <span className="truncate max-w-[180px]">📍 {name}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-150 dark:bg-white/5 rounded-full h-2 overflow-hidden shadow-inner">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attendance density mockup */}
            <div className="bg-gray-50/50 dark:bg-white/5 border border-gray-200/20 dark:border-white/5 p-5 rounded-2xl space-y-4 shadow-inner flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Attendee Demographics</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Breakdown of attendees by academy role classifications.</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-4">
                {[
                  { label: "Students", count: metrics.studentsCount, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
                  { label: "Coordinators", count: metrics.coordCount, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
                  { label: "Admins", count: metrics.adminCount, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" }
                ].map((item, idx) => (
                  <div key={idx} className={cn("p-3 rounded-xl border flex flex-col items-center justify-center shadow-sm", item.color)}>
                    <span className="text-xl font-extrabold">{item.count}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest mt-1 block leading-none">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: High-Quality Fullscreen Selfie View Modal */}
      {selectedSelfie && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay glass */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity" onClick={() => setSelectedSelfie(null)} />
          
          <div className="relative bg-white dark:bg-[#060608] border border-gray-200/40 dark:border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header close button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setSelectedSelfie(null)}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center font-bold shadow transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Selfie Picture */}
            <div className="aspect-square bg-black overflow-hidden relative">
              <img src={selectedSelfie} alt="Verified Selfie Proof" className="w-full h-full object-cover" />
            </div>

            <div className="p-5 text-center">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Verified Selfie Check-In Proof</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">✓ Attendance Authenticated via Image Upload</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
