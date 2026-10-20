// Utility functions go here
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 10) return "now";
  if (seconds < 60) return "few seconds ago";
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

/**
 * Formats a YYYY-MM-DD date of birth into day and month only (e.g. "14 May")
 */
export function formatBirthday(dobStr: string | null | undefined): string {
  if (!dobStr) return "—";
  try {
    const parts = String(dobStr).split("-");
    if (parts.length >= 3) {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(monthIndex) && !isNaN(day) && monthIndex >= 0 && monthIndex < 12) {
        return `${day} ${monthNames[monthIndex]}`;
      }
    }
  } catch (e) {
    // fallback
  }
  return dobStr;
}
