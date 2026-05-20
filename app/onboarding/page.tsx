import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { FacultySelector } from "@/components/onboarding/faculty-selector";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has a faculty assigned
  const { data: userFaculties } = await supabase
    .from("user_faculties")
    .select("faculty_id, faculties(slug)")
    .eq("user_id", user.id);

  if (userFaculties && userFaculties.length > 0) {
    // Already assigned, redirect to their first dashboard
    const firstSlug = Array.isArray(userFaculties[0].faculties) 
      ? userFaculties[0].faculties[0]?.slug 
      : (userFaculties[0].faculties as any)?.slug;
    
    if (firstSlug) {
      redirect(`/dashboard/${firstSlug}`);
    }
  }

  // Fetch available faculties
  const { data: faculties } = await supabase
    .from("faculties")
    .select("id, name, slug")
    .order("name");

  return (
    <div className="min-h-screen bg-white dark:bg-[#030303] flex flex-col transition-colors selection:bg-emerald-500/30">
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden pt-24 pb-12">
        {/* Subtle background effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <FacultySelector faculties={faculties || []} />
      </main>
    </div>
  );
}
