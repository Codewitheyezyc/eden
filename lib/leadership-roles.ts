export const DEFAULT_LEADERSHIP_ROLES = [
  "Dean of the Faculty of Performing Arts, Dance Unit",
  "Asst Dean Of the Faculty of Performing Arts, Dance Unit / Operations",
  "Asst Dean Of the Faculty of Performing Arts, Dance Unit / General Studies",
  "Admin of the Faculty of Performing Arts, Dance Unit",
  "Chief Instructor of the Faculty of Performing Arts, Dance Unit",
  "Asst Chief Instructor of the Faculty of Performing Arts, Dance Unit",
  "Dance Instructor",
  "Asst Sound Engineer",
  "Asst. Head of Media",
  "Asst. Head of Welfare",
  "Head of Medics",
  "Hospitality",
  "Projects and Innovations"
] as const;

export const LEADERSHIP_ROLES = DEFAULT_LEADERSHIP_ROLES;
export type LeadershipRole = typeof DEFAULT_LEADERSHIP_ROLES[number];

/**
 * Dynamically fetches active leadership roles from the database.
 * Falls back to DEFAULT_LEADERSHIP_ROLES if unavailable.
 */
export async function getActiveLeadershipRoles(supabaseClient?: any): Promise<string[]> {
  try {
    if (!supabaseClient) {
      const { createClient } = await import("@/services/supabase/client");
      supabaseClient = createClient();
    }
    const { data, error } = await supabaseClient
      .from("leadership_roles")
      .select("title")
      .eq("is_active", true)
      .order("title", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => d.title);
    }
  } catch (e) {
    console.error("Error fetching dynamic leadership roles:", e);
  }
  return [...DEFAULT_LEADERSHIP_ROLES];
}
