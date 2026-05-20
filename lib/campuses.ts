export const CAMPUSES = [
  "Headquarters Dancers",
  "Lagos Zone 1",
  "Lagos Zone 2",
  "Lagos Zone 3",
  "Lagos Zone 4",
  "Lagos Zone 5",
  "Lagos Zone 6",
  "Lagos Sub-zone C",
  "Lagos Sub-zone D"
] as const;

export type Campus = typeof CAMPUSES[number];

/**
 * Parsed campuses from the profile string (which can be a JSON array or a comma-separated string)
 */
export function parseCampuses(campusZoneStr: string | null | undefined): string[] {
  if (!campusZoneStr) return [];
  try {
    const parsed = JSON.parse(campusZoneStr);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    // Treat as comma separated
  }
  return campusZoneStr.split(",").map(c => c.trim()).filter(Boolean);
}

/**
 * Formats a list of campuses back to a JSON string for database storage
 */
export function formatCampusesForDb(campuses: string[]): string {
  return JSON.stringify(campuses);
}

/**
 * Checks if a user's campus list targets a specific campus target
 */
export function isUserTargetedByCampus(
  userCampuses: string[],
  targetCampusesStr: string | null | undefined
): boolean {
  if (!targetCampusesStr) return true; // targeted to all
  const targets = parseCampuses(targetCampusesStr);
  if (targets.length === 0) return true;
  return userCampuses.some(c => targets.includes(c));
}
