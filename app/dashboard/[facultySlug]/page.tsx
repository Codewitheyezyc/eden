import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { timeAgo, cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { parseCampuses } from "@/lib/campuses";

export default async function FacultyDashboardPage({
  params,
}: {
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Step 1: Get the faculty by slug
  const { data: faculty } = await supabase
    .from("faculties")
    .select("id")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Step 2: Get user's role in this faculty
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  // Step 3: Fetch Metrics
  const role = facultyAccess?.role || "STUDENT";

  const { count: studentCount } = await supabase.from("user_faculties").select("*", { count: "exact", head: true }).eq("faculty_id", faculty.id).eq("role", "STUDENT");
  const { count: coordinatorCount } = await supabase.from("user_faculties").select("*", { count: "exact", head: true }).eq("faculty_id", faculty.id).eq("role", "COORDINATOR");

  // Fetch dynamic totals for card counts
  const { count: announcementsCount } = await supabase
    .from("announcements")
    .select("*", { count: "exact", head: true })
    .eq("faculty_id", faculty.id);

  const { count: eventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("faculty_id", faculty.id);

  const { count: coursesCount } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("faculty_id", faculty.id);

  // Fetch user profile for campus checks
  const { data: profile } = await supabase
    .from("profiles")
    .select("campus_zone")
    .eq("id", user.id)
    .single();

  const userCampuses = parseCampuses(profile?.campus_zone);

  // Fetch announcements
  const { data: rawAnnouncements } = await supabase
    .from("announcements")
    .select(`
      id,
      title,
      content,
      created_at,
      expires_at,
      target_campuses,
      target_roles,
      sender:users!announcements_sender_id_fkey(
        full_name,
        avatar_url
      )
    `)
    .eq("faculty_id", faculty.id)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  // Filter announcements by target permissions
  const filteredAnnouncements = (rawAnnouncements || []).map((m: any) => {
    const senderObj = Array.isArray(m.sender) ? m.sender[0] : m.sender;
    return {
      id: m.id,
      title: m.title,
      content: m.content,
      created_at: m.created_at,
      expires_at: m.expires_at,
      target_campuses: m.target_campuses,
      target_roles: m.target_roles,
      sender: senderObj || null,
    };
  }).filter((m) => {
    if (role === "ADMIN") return true;

    // Check Role Targeting
    if (m.target_roles) {
      const allowedRoles = m.target_roles.split(",").map((r: string) => r.trim());
      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return false;
      }
    }

    // Check Campus Targeting
    if (m.target_campuses) {
      const targetCampuses = parseCampuses(m.target_campuses);
      if (targetCampuses.length > 0) {
        const hasIntersection = userCampuses.some((c) => targetCampuses.includes(c));
        if (!hasIntersection) return false;
      }
    }

    return true;
  }).slice(0, 3); // Max 3 latest announcements

  // Fetch Lists
  const { data: upcomingEvents } = await supabase.from("events").select("*").eq("faculty_id", faculty.id).order("created_at", { ascending: false }).limit(3);
  
  // Fetch all events for the compact calendar widget
  const { data: monthEvents } = await supabase.from("events").select("id, event_date").eq("faculty_id", faculty.id);

  // Generate days for the current month for the compact calendar widget
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const calendarCells = [];
  // Empty cells for padding
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(new Date(year, month, d));
  }

  
  const { data: recentReports } = await supabase
    .from("reports")
    .select(`
      id, title, created_at,
      author:users!reports_author_id_fkey(full_name)
    `)
    .eq("faculty_id", faculty.id)
    .order("created_at", { ascending: false })
    .limit(3);
  const { data: recentStudents } = await supabase
    .from("user_faculties")
    .select(`
      created_at,
      user_id,
      users:user_id (
        full_name,
        avatar_url,
        email,
        profiles (campus_zone, is_verified)
      )
    `)
    .eq("faculty_id", faculty.id)
    .eq("role", "STUDENT")
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: coordinatorsList } = await supabase
    .from("user_faculties")
    .select(`
      created_at,
      user_id,
      users:user_id (
        full_name,
        avatar_url,
        email,
        profiles (is_verified)
      )
    `)
    .eq("faculty_id", faculty.id)
    .eq("role", "COORDINATOR")
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch General Attendance verified members for widget
  const { data: verifiedMembersData } = await supabase
    .from("user_faculties")
    .select(`
      user_id,
      role,
      users:user_id (
        full_name,
        avatar_url,
        email,
        profiles (
          campus_zone,
          is_verified
        )
      )
    `)
    .eq("faculty_id", faculty.id);

  // Map, filter, and sort: Admins first, then Coordinators, then Students
  const eligibleWidgetUsers = (verifiedMembersData || []).map((m: any) => {
    const userObj = Array.isArray(m.users) ? m.users[0] : m.users;
    const profile = userObj?.profiles ? (Array.isArray(userObj.profiles) ? userObj.profiles[0] : userObj.profiles) : null;
    return {
      id: m.user_id,
      fullName: userObj?.full_name || "Unknown Member",
      avatarUrl: userObj?.avatar_url || null,
      email: userObj?.email || "",
      role: m.role || "STUDENT",
      profile: profile ? {
        campusZone: profile.campus_zone,
        isVerified: !!profile.is_verified
      } : null
    };
  })
  .filter(m => m.profile && m.profile.isVerified);

  const roleWeights: { [key: string]: number } = { ADMIN: 1, COORDINATOR: 2, STUDENT: 3 };
  const widgetUsersList = eligibleWidgetUsers
    .sort((a, b) => roleWeights[a.role] - roleWeights[b.role])
    .slice(0, 10);

  // Fetch HQ Leaders for overview widget
  const { data: hqLeadersData } = await supabase
    .from("user_faculties")
    .select(`
      user_id,
      role,
      users:user_id (
        id,
        full_name,
        avatar_url,
        email,
        profiles (
          campus_zone,
          leadership_role
        )
      )
    `)
    .eq("faculty_id", faculty.id)
    .eq("role", "ADMIN");

  const hqLeadersWidgetList = (hqLeadersData || []).map((m: any) => {
    const userObj = Array.isArray(m.users) ? m.users[0] : m.users;
    const profile = userObj?.profiles ? (Array.isArray(userObj.profiles) ? userObj.profiles[0] : userObj.profiles) : null;
    return {
      id: m.user_id,
      fullName: userObj?.full_name || "HQ Leader",
      avatarUrl: userObj?.avatar_url || null,
      role: m.role || "ADMIN",
      leadershipRole: profile?.leadership_role || ""
    };
  })
  .filter(m => m.leadershipRole) // Only show promoted leaders with actual HQ roles
  .slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      
      {/* Premium Glassmorphic Welcome Banner */}
      <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl shadow-emerald-900/10 dark:shadow-none border border-black/5 dark:border-white/5 bg-gradient-to-br from-emerald-500 to-emerald-700 backdrop-blur-xl">
        {/* Artistic Blurs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 mix-blend-overlay"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-md mb-6 uppercase tracking-widest border border-white/20 shadow-sm">
            {role} Portal
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white drop-shadow-sm">
            Welcome to Eden.
          </h2>
          <p className="text-emerald-50 max-w-2xl text-lg md:text-xl leading-relaxed font-light">
            {role === "ADMIN" 
              ? "You have full administrative access. Oversee faculty performance, manage users, and orchestrate the curriculum." 
              : role === "COORDINATOR"
              ? "Manage your students, review assignments, and oversee daily operations from your command center."
              : "Here is an overview of your recent courses, current progress, and upcoming creative tasks."}
          </p>
        </div>
      </div>

      {/* Coordinator & Admin Command Center */}
      {(role === "ADMIN" || role === "COORDINATOR") && (
        <div className="bg-white/40 dark:bg-[#08080c]/40 backdrop-blur-3xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">Operations Command Center</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5">Quick Actions & Faculty Supervision</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Quick Action 1: Post Announcement */}
            <Link 
              href={`/dashboard/${params.facultySlug}/announcements`}
              className="group flex flex-col items-center justify-center p-6 bg-white/60 dark:bg-white/[0.01] hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 border border-gray-200/50 dark:border-white/5 hover:border-emerald-500/20 rounded-2xl text-center transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
            >
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 13Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
              </div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Post Announcement</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Broadcast Message</span>
            </Link>

            {/* Quick Action 2: Schedule Event */}
            <Link 
              href={`/dashboard/${params.facultySlug}/events`}
              className="group flex flex-col items-center justify-center p-6 bg-white/60 dark:bg-white/[0.01] hover:bg-purple-500/5 dark:hover:bg-purple-500/10 border border-gray-200/50 dark:border-white/5 hover:border-purple-500/20 rounded-2xl text-center transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
            >
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">New Event</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Schedule Class</span>
            </Link>

            {/* Quick Action 3: Submit Report */}
            <Link 
              href={`/dashboard/${params.facultySlug}/reports/new`}
              className="group flex flex-col items-center justify-center p-6 bg-white/60 dark:bg-white/[0.01] hover:bg-blue-500/5 dark:hover:bg-blue-500/10 border border-gray-200/50 dark:border-white/5 hover:border-blue-500/20 rounded-2xl text-center transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Send Report</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Submit Metrics</span>
            </Link>

            {/* Quick Action 4: Manage Students */}
            <Link 
              href={`/dashboard/${params.facultySlug}/students`}
              className="group flex flex-col items-center justify-center p-6 bg-white/60 dark:bg-white/[0.01] hover:bg-amber-500/5 dark:hover:bg-amber-500/10 border border-gray-200/50 dark:border-white/5 hover:border-amber-500/20 rounded-2xl text-center transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
            >
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Supervise Pupils</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Roster & Academics</span>
            </Link>

          </div>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Course Widget (Visible to Everyone) */}
        <div className="group relative bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden transition-all duration-300">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          </div>
          <h3 className="font-medium text-gray-500 dark:text-gray-400 text-xs tracking-widest uppercase mb-1">Active Courses</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{coursesCount || 0}</p>
        </div>

        {/* Announcements Widget (Visible to Everyone) */}
        <div className="group relative bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden transition-all duration-300">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 12a11.05 11.05 0 0 0-22 0V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H3a9 9 0 0 1 18 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2Z"/></svg>
          </div>
          <h3 className="font-medium text-gray-500 dark:text-gray-400 text-xs tracking-widest uppercase mb-1">Announcements</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{announcementsCount || 0}</p>
        </div>

        {/* Total Students */}
        {(role === "ADMIN" || role === "COORDINATOR") && (
          <div className="group relative bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden transition-all duration-300">
            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3 className="font-medium text-gray-500 dark:text-gray-400 text-xs tracking-widest uppercase mb-1">Total Students</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{studentCount || 0}</p>
          </div>
        )}

        {/* Total Coordinators */}
        {role === "ADMIN" && (
          <div className="group relative bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden transition-all duration-300">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3 className="font-medium text-gray-500 dark:text-gray-400 text-xs tracking-widest uppercase mb-1">Coordinators</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{coordinatorCount || 0}</p>
          </div>
        )}

        {/* Upcoming Events Count */}
        <div className="group relative bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden transition-all duration-300">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <h3 className="font-medium text-gray-500 dark:text-gray-400 text-xs tracking-widest uppercase mb-1">Upcoming Events</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{eventsCount || 0}</p>
        </div>
      </div>

      {/* Lists Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Events & Reports */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Announcements Widget */}
          <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  📢
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Latest Announcements</h3>
              </div>
              <Link href={`/dashboard/${params.facultySlug}/announcements`} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                View All &rarr;
              </Link>
            </div>

            <div className="space-y-4">
              {filteredAnnouncements.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No active announcements right now.</p>
              ) : (
                filteredAnnouncements.map((ann: any) => (
                  <div 
                    key={ann.id} 
                    className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col justify-between hover:border-emerald-250 dark:hover:border-emerald-900/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{ann.title}</h4>
                      <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(ann.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                      {ann.content}
                    </p>
                    <div className="flex items-center space-x-2">
                      {ann.sender?.avatar_url ? (
                        <img src={ann.sender.avatar_url} className="w-5 h-5 rounded-full border border-gray-200 dark:border-white/10" alt="" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center text-[9px] font-bold">
                          {ann.sender?.full_name?.charAt(0) || "U"}
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                        {ann.sender?.full_name || "Faculty Member"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* HQ Leaders Overview Widget */}
          <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute right-0 top-0 w-36 h-36 bg-emerald-500/[0.03] rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  👑
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">HQ Leaders</h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">Faculty Guidance & Instructors</p>
                </div>
              </div>
              <Link href={`/dashboard/${params.facultySlug}/hq-leaders`} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                View Directory &rarr;
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hqLeadersWidgetList.length === 0 ? (
                <p className="col-span-full text-xs text-gray-500 py-6 text-center italic">No HQ leaders promoted in this faculty yet.</p>
              ) : (
                hqLeadersWidgetList.map((leader: any) => (
                  <Link 
                    key={leader.id} 
                    href={`/dashboard/${params.facultySlug}/hq-leaders/${leader.id}`}
                    className="flex items-center p-3 bg-gray-50/40 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 rounded-2xl group transition-all hover:scale-[1.02] shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/10 overflow-hidden shadow-inner mr-3 group-hover:scale-105 transition-transform duration-300">
                      {leader.avatarUrl ? (
                        <img src={leader.avatarUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        leader.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{leader.fullName}</p>
                      <p className="text-[10px] text-emerald-650 dark:text-emerald-450 font-bold truncate mt-0.5">{leader.leadershipRole}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* General Attendance Widget */}
          <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  👥
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">General Attendance</h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">Verified Members</p>
                </div>
              </div>
              {(role === "ADMIN" || role === "COORDINATOR") && (
                <Link href={`/dashboard/${params.facultySlug}/attendance`} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                  View Full &rarr;
                </Link>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {widgetUsersList.length === 0 ? (
                <p className="col-span-2 text-sm text-gray-500 py-6 text-center">No verified attendance records yet.</p>
              ) : (
                widgetUsersList.map((m: any) => (
                  <div key={m.id} className="flex items-center p-3 bg-gray-50/40 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl group hover:border-emerald-500/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/10 overflow-hidden shadow-inner mr-3">
                      {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : m.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{m.fullName}</p>
                        {m.role === "ADMIN" ? (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-750 dark:text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded font-bold uppercase tracking-wide">Admin</span>
                        ) : m.role === "COORDINATOR" ? (
                          <span className="text-[8px] bg-amber-500/10 text-amber-750 dark:text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded font-bold uppercase tracking-wide">Coord</span>
                        ) : (
                          <span className="text-[8px] bg-blue-500/10 text-blue-750 dark:text-blue-400 border border-blue-500/20 px-1 py-0.5 rounded font-bold uppercase tracking-wide">Stud</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        {m.profile?.campusZone ? parseCampuses(m.profile.campusZone).join(", ") : "No Campus"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Events List */}
          <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Events</h3>
              <a href={`/dashboard/${params.facultySlug}/events`} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">View All &rarr;</a>
            </div>
            
            <div className="space-y-4">
              {upcomingEvents?.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming events scheduled.</p>
              ) : (
                upcomingEvents?.map((evt: any) => {
                  const d = new Date(evt.event_date);
                  return (
                    <div key={evt.id} className="flex items-center p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 group hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
                      <div className="w-12 h-12 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center shrink-0 shadow-sm mr-4">
                        <span className="text-[10px] font-bold uppercase text-gray-400 leading-none mb-1">{d.toLocaleDateString('en-US', { month: 'short'})}</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-none">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{evt.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{evt.location}</p>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        Added {timeAgo(evt.created_at)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Reports List */}
          {(role === "ADMIN" || role === "COORDINATOR") && (
            <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Reports</h3>
                <a href={`/dashboard/${params.facultySlug}/reports`} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">View All &rarr;</a>
              </div>
              
              <div className="space-y-4">
                {(!recentReports || recentReports.length === 0) ? (
                  <p className="text-sm text-gray-500">No reports submitted yet.</p>
                ) : (
                  recentReports.map((report: any) => (
                    <Link key={report.id} href={`/dashboard/${params.facultySlug}/reports/${report.id}`} className="block p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">{report.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">By {report.author?.full_name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{timeAgo(report.created_at)}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* People List & Compact Calendar */}
        <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col space-y-8">
          
          {/* Compact Calendar Widget */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">📅</span>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Schedule</h3>
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {today.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>

            {/* Calendar Grid */}
            <div className="bg-gray-50/50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                  <div key={idx} className="py-1">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => {
                  if (cell === null) {
                    return <div key={idx} className="aspect-square" />;
                  }
                  
                  const dNum = cell.getDate();
                  const isTod = dNum === today.getDate() && cell.getMonth() === today.getMonth();
                  const hasEvt = (monthEvents || []).some(evt => {
                    const evtDate = new Date(evt.event_date);
                    return evtDate.getDate() === dNum && evtDate.getMonth() === cell.getMonth() && evtDate.getFullYear() === cell.getFullYear();
                  });

                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] font-bold transition-all relative",
                        isTod 
                          ? "bg-emerald-600 text-white shadow-sm" 
                          : "text-gray-700 dark:text-gray-400 hover:bg-gray-150 dark:hover:bg-white/5"
                      )}
                    >
                      <span>{dNum}</span>
                      {hasEvt && !isTod && (
                        <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 dark:bg-emerald-400 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <Link 
              href={`/dashboard/${params.facultySlug}/calendar`}
              className="w-full inline-flex items-center justify-center py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl transition-all border border-emerald-500/15"
            >
              Open Calendar &rarr;
            </Link>
          </div>

          {/* Recent Students */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Newest Students</h3>
            <div className="space-y-4">
              {recentStudents?.length === 0 ? (
                <p className="text-sm text-gray-500">No students yet.</p>
              ) : (
                recentStudents?.map((s: any) => {
                  const userObj = Array.isArray(s.users) ? s.users[0] : s.users;
                  const profile = userObj?.profiles ? (Array.isArray(userObj.profiles) ? userObj.profiles[0] : userObj.profiles) : null;
                  return (
                    <div key={s.user_id} className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border-2 border-white dark:border-[#0a0a0a]">
                        {userObj?.avatar_url ? <img src={userObj.avatar_url} className="w-full h-full rounded-full" /> : userObj?.full_name?.charAt(0) || 'S'}
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userObj?.full_name || 'Anonymous Student'}</p>
                          {profile?.is_verified && <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{profile?.campus_zone ? parseCampuses(profile.campus_zone).join(", ") : userObj?.email}</p>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        Joined {timeAgo(s.created_at)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Coordinators */}
          {(role === "ADMIN" || role === "COORDINATOR") && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Coordinators</h3>
              <div className="space-y-4">
                {coordinatorsList?.length === 0 ? (
                  <p className="text-sm text-gray-500">No coordinators assigned.</p>
                ) : (
                  coordinatorsList?.map((c: any) => {
                    const userObj = Array.isArray(c.users) ? c.users[0] : c.users;
                    const profile = userObj?.profiles ? (Array.isArray(userObj.profiles) ? userObj.profiles[0] : userObj.profiles) : null;
                    return (
                      <div key={c.user_id} className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 border-2 border-white dark:border-[#0a0a0a]">
                          {userObj?.avatar_url ? <img src={userObj.avatar_url} className="w-full h-full rounded-full" /> : userObj?.full_name?.charAt(0) || 'C'}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userObj?.full_name || 'Anonymous Coordinator'}</p>
                            {profile?.is_verified && <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />}
                          </div>
                          <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">Coordinator</p>
                        </div>
                        <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          Joined {timeAgo(c.created_at)}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
