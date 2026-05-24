import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { parseCampuses } from "@/lib/campuses";
import { EventAttendanceClient } from "./attendance-client";

export default async function EventAttendancePage({
  params,
}: {
  params: { facultySlug: string; eventId: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Step 1: Get Faculty
  const { data: faculty } = await supabase
    .from("faculties")
    .select("id, name, slug")
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

  const userRole = facultyAccess?.role;

  // RBAC Access Control: Students cannot view the attendee tracking screen
  if (!userRole || userRole === "STUDENT") {
    redirect(`/dashboard/${params.facultySlug}/events`);
  }

  // Step 3: Fetch Event Details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.eventId)
    .eq("faculty_id", faculty.id)
    .single();

  if (eventError || !event) {
    redirect(`/dashboard/${params.facultySlug}/events`);
  }

  // Step 4: Fetch event attendees joining profiles and users
  const { data: attendanceRecords, error: attendanceError } = await supabase
    .from("event_attendance")
    .select(`
      created_at,
      status,
      proof_image_url,
      user_id,
      users:user_id (
        id,
        full_name,
        avatar_url,
        email,
        profiles (
          campus_zone,
          gender,
          phone,
          kingschat_handle,
          is_verified,
          leadership_role
        )
      )
    `)
    .eq("event_id", params.eventId);

  if (attendanceError) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h3 className="font-bold">Database Error</h3>
        <p className="text-sm mt-1">{attendanceError.message}</p>
      </div>
    );
  }

  // Step 5: Map attendees into a clean format
  let attendees = (attendanceRecords || []).map((record: any) => {
    const userObj = Array.isArray(record.users) ? record.users[0] : record.users;
    const profile = userObj?.profiles ? (Array.isArray(userObj.profiles) ? userObj.profiles[0] : userObj.profiles) : null;

    return {
      userId: record.user_id,
      fullName: userObj?.full_name || "Unknown Member",
      email: userObj?.email || "No Email Provided",
      avatarUrl: userObj?.avatar_url || null,
      checkInTime: record.created_at,
      status: record.status || "PRESENT",
      proofImageUrl: record.proof_image_url || null,
      role: "STUDENT" as "ADMIN" | "COORDINATOR" | "STUDENT",
      profile: profile ? {
        phone: profile.phone || "",
        gender: profile.gender || "",
        kingschat: profile.kingschat_handle || "",
        campusZone: profile.campus_zone || "",
        isVerified: !!profile.is_verified,
        leadershipRole: profile.leadership_role || "",
      } : null
    };
  });

  // Step 6: Query user roles for all attendees to keep them role-aware
  // We extract all unique user IDs from attendees and query their roles in user_faculties
  const attendeeUserIds = attendees.map(a => a.userId);
  let userRolesMap: { [userId: string]: "ADMIN" | "COORDINATOR" | "STUDENT" } = {};

  if (attendeeUserIds.length > 0) {
    const { data: rolesData } = await supabase
      .from("user_faculties")
      .select("user_id, role")
      .eq("faculty_id", faculty.id)
      .in("user_id", attendeeUserIds);

    (rolesData || []).forEach(r => {
      userRolesMap[r.user_id] = r.role;
    });
  }

  // Map roles back into attendees
  attendees = attendees.map(a => ({
    ...a,
    role: userRolesMap[a.userId] || "STUDENT"
  }));

  // Step 7: Coordinator Campus Filtering
  if (userRole === "COORDINATOR") {
    // Get coordinator's own profile to identify their campus
    const { data: coordProfile } = await supabase
      .from("profiles")
      .select("campus_zone")
      .eq("id", user.id)
      .single();

    const coordinatorCampuses = parseCampuses(coordProfile?.campus_zone);

    attendees = attendees.filter(a => {
      // 1. Coordinators should NOT see admins in their event attendance view
      if (a.role === "ADMIN") return false;

      // 2. Coordinators should ONLY see attendees within their own campus
      const attendeeCampuses = parseCampuses(a.profile?.campusZone);
      const sharesCampus = coordinatorCampuses.some(c => attendeeCampuses.includes(c));

      return sharesCampus;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a 
          href={`/dashboard/${params.facultySlug}/events`}
          className="p-2 bg-white dark:bg-[#0a0a0a] hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </a>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Event Attendance Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track, verify, and export attendance records for this specific event.</p>
        </div>
      </div>

      <EventAttendanceClient 
        event={event}
        initialAttendees={attendees}
        viewerRole={userRole}
        facultySlug={params.facultySlug}
      />
    </div>
  );
}
