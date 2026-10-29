import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { CostumesClient, CostumeMember } from "./costumes-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Costume Sizing - Loveworld Arts Academy",
  description: "Member costume measurements and uniform sizing roster",
};

interface CostumesPageProps {
  params: {
    facultySlug: string;
  };
}

export default async function CostumesPage({ params }: CostumesPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Get Faculty
  const { data: faculty } = await supabase
    .from("faculties")
    .select("id, slug")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) {
    redirect("/dashboard");
  }

  // 2. Get Current User's Role & Profile
  const [facultyAccessRes, profileRes] = await Promise.all([
    supabase
      .from("user_faculties")
      .select("role")
      .eq("user_id", user.id)
      .eq("faculty_id", faculty.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("shoe_size, trouser_size, top_size, leadership_role")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const currentUserRole = facultyAccessRes.data?.role || "STUDENT";
  const myProfile = profileRes.data;

  // Leaders, Coordinators, and Admins can view the roster
  const isLeader = !!(
    myProfile?.leadership_role &&
    myProfile.leadership_role.trim().length > 0
  );
  const canViewRoster =
    currentUserRole === "ADMIN" ||
    currentUserRole === "COORDINATOR" ||
    isLeader;

  // 3. Fetch All Members if permitted
  let membersRoster: CostumeMember[] = [];
  if (canViewRoster) {
    const { data: membersData } = await supabase
      .from("user_faculties")
      .select(`
        user_id,
        role,
        users:user_id (
          id,
          full_name,
          avatar_url,
          profiles (
            member_id,
            campus_zone,
            shoe_size,
            trouser_size,
            top_size,
            leadership_role,
            updated_at
          )
        )
      `)
      .eq("faculty_id", faculty.id)
      .order("created_at", { ascending: false });

    membersRoster = (membersData || []).map((m: any) => {
      const u = Array.isArray(m.users) ? m.users[0] : m.users;
      const p = u?.profiles
        ? Array.isArray(u.profiles)
          ? u.profiles[0]
          : u.profiles
        : null;

      return {
        id: m.user_id,
        fullName: u?.full_name || "Member",
        avatarUrl: u?.avatar_url || null,
        role: m.role,
        leadershipRole: p?.leadership_role || null,
        memberId: p?.member_id || "LAA-DNC-PENDING",
        campusZone: p?.campus_zone || "",
        shoeSize: p?.shoe_size || null,
        trouserSize: p?.trouser_size || null,
        topSize: p?.top_size || null,
        updatedAt: p?.updated_at || null,
      };
    });
  }

  return (
    <div className="max-w-7xl mx-auto">
      <CostumesClient
        initialMySizes={{
          shoeSize: myProfile?.shoe_size || "",
          trouserSize: myProfile?.trouser_size || "",
          topSize: myProfile?.top_size || "Medium",
        }}
        membersRoster={membersRoster}
        canViewRoster={canViewRoster}
        facultySlug={params.facultySlug}
      />
    </div>
  );
}

