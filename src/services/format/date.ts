/**
 * Date formatting (Section 1 — French long format `26 mai 2026`). Falls back to a
 * manual month table when the runtime lacks the fr-FR locale.
 */
const LOCALE = "fr-FR";

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

const WEEKDAYS_FR = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
] as const;

function hasIntlDate(): boolean {
  try {
    const probe = new Intl.DateTimeFormat(LOCALE, { month: "long" }).format(new Date(2026, 4, 26));
    return probe.toLowerCase().includes("mai");
  } catch {
    return false;
  }
}

const intlSupported = hasIntlDate();

/** Accepts an ISO string or Date; returns e.g. `26 mai 2026`. */
export function formatLongDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  if (intlSupported) {
    return new Intl.DateTimeFormat(LOCALE, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }
  const month = MONTHS_FR[date.getMonth()] ?? "";
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

/** French weekday name, e.g. `mercredi`. Mirrors the date fallback table. */
export function formatWeekday(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  if (intlSupported) {
    return new Intl.DateTimeFormat(LOCALE, { weekday: "long" }).format(date);
  }
  return WEEKDAYS_FR[date.getDay()] ?? "";
}

/** French month + year, e.g. `juillet 2026` (calendar header). */
export function formatMonthYear(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  if (intlSupported) {
    return new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" }).format(date);
  }
  const month = MONTHS_FR[date.getMonth()] ?? "";
  return `${month} ${date.getFullYear()}`;
}

/** Single-letter weekday headers, Monday-first (fr) — for the calendar grid. */
export const WEEKDAY_INITIALS_FR = ["L", "M", "M", "J", "V", "S", "D"] as const;

/** Capitalised French month name for a 0-based month index (classement headers). */
export function formatMonthName(monthIndex: number): string {
  const name = MONTHS_FR[monthIndex] ?? "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}
