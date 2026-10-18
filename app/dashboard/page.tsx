import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";

export default async function DashboardRootPage() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Query user's faculties and their specific roles
  const { data: userFaculties, error } = await supabase
    .from("user_faculties")
    .select(`
      role,
      faculties (
        name,
        slug
      )
    `)
    .eq("user_id", user.id);

  // If there's a database query error, show it immediately so we can debug!
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#030303] p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-xl font-mono text-sm max-w-2xl w-full border border-red-200 dark:border-red-800 shadow-sm overflow-auto">
          <h2 className="font-bold mb-2">Database Error:</h2>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    );
  }

  // 1. Zero Faculties (Redirect to Onboarding)
  if (!userFaculties || userFaculties.length === 0) {
    redirect("/onboarding");
  }

  // 2. Direct to Dance faculty or first available
  const danceAccess = userFaculties.find((uf: any) => {
    const faculty = Array.isArray(uf.faculties) ? uf.faculties[0] : uf.faculties;
    return faculty?.slug === "dance";
  });

  if (danceAccess) {
    redirect("/dashboard/dance");
  }

  // Fallback to first faculty or onboarding
  const firstFaculty = Array.isArray(userFaculties[0].faculties)
    ? userFaculties[0].faculties[0]
    : userFaculties[0].faculties;

  if (firstFaculty?.slug) {
    redirect(`/dashboard/${firstFaculty.slug}`);
  }

  redirect("/onboarding");
}
