import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import EditReportClient from "../../edit-client";

export default async function EditReportPage({ params }: { params: { facultySlug: string, reportId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: faculty } = await supabase
    .from("faculties")
    .select("id")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Fetch Viewer Role and Report in parallel
  const [roleRes, reportRes] = await Promise.all([
    supabase
      .from("user_faculties")
      .select("role")
      .eq("user_id", user.id)
      .eq("faculty_id", faculty.id)
      .single(),
    supabase
      .from("reports")
      .select("*")
      .eq("id", params.reportId)
      .eq("faculty_id", faculty.id)
      .single()
  ]);

  const roleData = roleRes.data;
  const report = reportRes.data;

  if (roleData?.role !== "ADMIN" && roleData?.role !== "COORDINATOR") {
    redirect(`/dashboard/${params.facultySlug}/reports`);
  }

  if (!report) redirect(`/dashboard/${params.facultySlug}/reports`);

  return <EditReportClient facultyId={faculty.id} facultySlug={params.facultySlug} report={report} />;
}
