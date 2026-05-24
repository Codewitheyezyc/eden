export const LEADERSHIP_ROLES = [
  "Dean of the Dance Faculty",
  "Asst Dean Of the Dance Faculty / Operations",
  "Asst Dean Of the Dance Faculty / General Studies",
  "Admin of the Dance Faculty",
  "Chief Instructor of the Dance Faculty",
  "Asst Chief Instructor of the Dance Faculty"
] as const;

export type LeadershipRole = typeof LEADERSHIP_ROLES[number];
