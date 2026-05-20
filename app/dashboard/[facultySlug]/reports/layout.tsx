import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";

export default async function ReportsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get faculty ID
  const { data: facultyData } = await supabase
    .from("faculties")
    .select("id")
    .eq("slug", params.facultySlug)
    .single();

  if (!facultyData) redirect("/dashboard");

  // Get user role
  const { data: roleData } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyData.id)
    .single();

  // If student, deny access and redirect to dashboard
  if (roleData?.role === "STUDENT") {
    redirect(`/dashboard/${params.facultySlug}`);
  }

  return <>{children}</>;
}
