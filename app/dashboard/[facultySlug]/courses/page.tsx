import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { CoursesClient } from "./courses-client";

export default async function CoursesPage({
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
    .select("id")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Fetch access & role
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  const role = facultyAccess?.role || "STUDENT";

  return (
    <CoursesClient role={role} facultySlug={params.facultySlug} />
  );
}
