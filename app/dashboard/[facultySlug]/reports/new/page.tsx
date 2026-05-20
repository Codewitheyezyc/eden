import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import EditReportClient from "../edit-client";

export default async function NewReportPage({ params }: { params: { facultySlug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: faculty } = await supabase
    .from("faculties")
    .select("id")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Verify role
  const { data: roleData } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  if (roleData?.role !== "ADMIN" && roleData?.role !== "COORDINATOR") {
    redirect(`/dashboard/${params.facultySlug}/reports`);
  }

  return <EditReportClient facultyId={faculty.id} facultySlug={params.facultySlug} />;
}
