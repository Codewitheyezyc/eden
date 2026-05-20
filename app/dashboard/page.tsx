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

  // 2. Exactly One Faculty (Automatic Redirection)
  if (userFaculties.length === 1) {
    // Type casting because Supabase joins return array or single object depending on relation
    const faculty = Array.isArray(userFaculties[0].faculties) 
      ? userFaculties[0].faculties[0] 
      : userFaculties[0].faculties;
      
    // Redirect to the unified dashboard for their specific faculty
    redirect(`/dashboard/${faculty?.slug}`);
  }

  // 3. Multiple Faculties (Faculty Selector)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303] py-20 px-6 transition-colors">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Select Workspace</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-12 text-lg">You have access to multiple faculties. Where would you like to go?</p>
        
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {userFaculties.map((uf: any) => {
            const faculty = Array.isArray(uf.faculties) ? uf.faculties[0] : uf.faculties;
            return (
              <a 
                key={faculty.slug} 
                href={`/dashboard/${faculty.slug}`}
                className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{faculty.name}</h2>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 capitalize">
                  {uf.role.toLowerCase()} Access
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
