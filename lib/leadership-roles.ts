export const LEADERSHIP_ROLES = [
  "Dean of the Faculty of Performing Arts, Dance Unit",
  "Asst Dean Of the Faculty of Performing Arts, Dance Unit / Operations",
  "Asst Dean Of the Faculty of Performing Arts, Dance Unit / General Studies",
  "Admin of the Faculty of Performing Arts, Dance Unit",
  "Chief Instructor of the Faculty of Performing Arts, Dance Unit",
  "Asst Chief Instructor of the Faculty of Performing Arts, Dance Unit"
] as const;

export type LeadershipRole = typeof LEADERSHIP_ROLES[number];
