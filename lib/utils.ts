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

/**
 * Formats phone numbers consistently with international country codes and clean spacing.
 * Converts local Nigerian numbers (e.g. "08064962125" -> "+234 806 496 2125"),
 * standardizes "+2349074241741" -> "+234 907 424 1741",
 * and preserves international numbers (+1, +44, +27, +233, etc.) with clean readability.
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "—";
  const trimmed = String(phone).trim();
  if (!trimmed || trimmed === "—") return "—";

  // Check if starts with +
  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (!digitsOnly) return trimmed;

  // Case 1: Nigeria international with 234 prefix (e.g. 2348064962125 or +2348064962125)
  if (digitsOnly.startsWith("234") && digitsOnly.length >= 12) {
    const rest = digitsOnly.slice(3);
    if (rest.length === 10) {
      return `+234 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
    }
    return `+234 ${rest}`;
  }

  // Case 2: Local Nigerian number with leading 0 (e.g. 08064962125 or 09023456782, 11 digits)
  if (digitsOnly.startsWith("0") && digitsOnly.length === 11) {
    const rest = digitsOnly.slice(1); // 10 digits
    return `+234 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  }

  // Case 3: Other international numbers
  if (hasPlus) {
    if (digitsOnly.startsWith("1") && digitsOnly.length === 11) {
      // US / Canada: +1 (555) 123-4567
      return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
    }
    if (digitsOnly.startsWith("44") && digitsOnly.length >= 11) {
      // UK: +44 7123 456789
      return `+44 ${digitsOnly.slice(2, 6)} ${digitsOnly.slice(6)}`;
    }
    if (digitsOnly.startsWith("233") && digitsOnly.length >= 11) {
      // Ghana: +233 24 123 4567
      return `+233 ${digitsOnly.slice(3, 5)} ${digitsOnly.slice(5, 8)} ${digitsOnly.slice(8)}`;
    }
    if (digitsOnly.startsWith("27") && digitsOnly.length >= 11) {
      // South Africa: +27 82 123 4567
      return `+27 ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4, 7)} ${digitsOnly.slice(7)}`;
    }
    return `+${digitsOnly}`;
  }

  // Case 4: 10 digits without leading 0 (assume Nigeria mobile)
  if (digitsOnly.length === 10) {
    return `+234 ${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
  }

  return trimmed;
}
