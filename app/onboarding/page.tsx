import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { FacultySelector } from "@/components/onboarding/faculty-selector";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding - Loveworld Arts Academy",
};

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has Dance faculty assigned
  const { data: userFaculties } = await supabase
    .from("user_faculties")
    .select("faculty_id, faculties(slug)")
    .eq("user_id", user.id);

  if (userFaculties && userFaculties.length > 0) {
    const hasDance = userFaculties.some((uf: any) => {
      const f = Array.isArray(uf.faculties) ? uf.faculties[0] : uf.faculties;
      return f?.slug === "dance";
    });

    if (hasDance) {
      redirect("/dashboard/dance");
    }
  }

  // Fetch existing user record and profile for pre-filling
  const [userRecordRes, profileRes] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("campus_zone, phone").eq("id", user.id).maybeSingle(),
  ]);

  const initialFullName = userRecordRes.data?.full_name || "";
  const initialCampusZone = profileRes.data?.campus_zone || "";
  const initialPhone = profileRes.data?.phone || "";

  return (
    <div className="min-h-screen bg-white dark:bg-[#030303] flex flex-col transition-colors selection:bg-emerald-500/30">
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden pt-24 pb-12">
        {/* Subtle background effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <FacultySelector
          initialFullName={initialFullName}
          initialCampusZone={initialCampusZone}
          initialPhone={initialPhone}
        />
      </main>
    </div>
  );
}
