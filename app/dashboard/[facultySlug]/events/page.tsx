import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { EventCard } from "@/components/dashboard/event-card";
import { CreateEventButton } from "@/components/dashboard/create-event-button";

export default async function EventsPage({ params }: { params: { facultySlug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get Faculty
  const { data: faculty } = await supabase.from("faculties").select("id").eq("slug", params.facultySlug).single();
  if (!faculty) redirect("/dashboard");

  // Get Role
  const { data: facultyAccess } = await supabase.from("user_faculties").select("role").eq("user_id", user.id).eq("faculty_id", faculty.id).single();
  const role = facultyAccess?.role || "STUDENT";

  // Fetch Events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("faculty_id", faculty.id)
    .order("event_date", { ascending: true });

  // Fetch User's Attendance
  const { data: attendance } = await supabase
    .from("event_attendance")
    .select("*")
    .eq("user_id", user.id);

  // Map attendance by event_id for quick lookup
  const attendanceMap = (attendance || []).reduce((acc: any, curr: any) => {
    acc[curr.event_id] = curr;
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 p-6 md:p-8 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Upcoming Events</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5">View and mark your attendance for faculty events.</p>
        </div>

        {/* Admin Only Create Button */}
        {role === "ADMIN" && (
          <CreateEventButton facultyId={faculty.id} />
        )}
      </div>

      {/* Events Grid */}
      {(!events || events.length === 0) ? (
        <div className="bg-white/40 dark:bg-black/20 border border-dashed border-gray-300 dark:border-gray-800 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Upcoming Events</h3>
          <p className="text-gray-500 dark:text-gray-400">There are no events scheduled for this faculty yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              userId={user.id}
              attendanceRecord={attendanceMap[event.id]}
            />
          ))}
        </div>
      )}

    </div>
  );
}
