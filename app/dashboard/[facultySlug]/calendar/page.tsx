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

  // Get Faculty
  const { data: faculty } = await supabase
    .from("faculties")
    .select("id, name, slug")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Get Role
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  const role = facultyAccess?.role || "STUDENT";

  // Fetch all Events for this faculty
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("faculty_id", faculty.id)
    .order("event_date", { ascending: true });

  // Fetch user attendance for these events
  const { data: attendance } = await supabase
    .from("event_attendance")
    .select("*")
    .eq("user_id", user.id);

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
