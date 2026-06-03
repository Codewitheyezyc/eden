import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage({
  params,
}: {
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch Faculty and user's attendance details in parallel
  const [facultyRes, attendanceRes] = await Promise.all([
    supabase
      .from("faculties")
      .select("id, name, slug")
      .eq("slug", params.facultySlug)
      .single(),
    supabase
      .from("event_attendance")
      .select("*")
      .eq("user_id", user.id)
  ]);

  const faculty = facultyRes.data;
  const attendance = attendanceRes.data;

  if (!faculty) redirect("/dashboard");

  // Fetch Viewer Role and Events in parallel
  const [accessRes, eventsRes] = await Promise.all([
    supabase
      .from("user_faculties")
      .select("role")
      .eq("user_id", user.id)
      .eq("faculty_id", faculty.id)
      .single(),
    supabase
      .from("events")
      .select("*")
      .eq("faculty_id", faculty.id)
      .order("event_date", { ascending: true })
  ]);

  const role = accessRes.data?.role || "STUDENT";
  const events = eventsRes.data;

  const attendanceMap = (attendance || []).reduce((acc: any, curr: any) => {
    acc[curr.event_id] = curr;
    return acc;
  }, {});

  return (
    <CalendarClient
      initialEvents={events || []}
      attendanceMap={attendanceMap}
      role={role}
      userId={user.id}
      facultyId={faculty.id}
      facultySlug={faculty.slug}
    />
  );
}
