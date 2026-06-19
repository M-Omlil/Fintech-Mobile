/**
 * Moroccan bank identifier formatting (mega-prompt §3). The RIB (Relevé d'Identité
 * Bancaire) is 24 digits: bank (3) · city/agency (3) · account (16) · key (2). The
 * IBAN is the secondary identifier (MA + 2 check digits + the 24-digit RIB).
 */

const RIB_GROUPS = [3, 3, 4, 4, 4, 4, 2]; // sums to 24

/** Strip to digits only. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** A valid Moroccan RIB is exactly 24 digits. */
export function isValidRib(value: string): boolean {
  return /^\d{24}$/.test(digitsOnly(value));
}

/** Group a RIB for display, e.g. `007 780 0001 2345 6789 0101 44`. */
export function formatRib(value: string): string {
  const digits = digitsOnly(value).slice(0, 24);
  const parts: string[] = [];
  let cursor = 0;
  for (const size of RIB_GROUPS) {
    const chunk = digits.slice(cursor, cursor + size);
    if (!chunk) break;
    parts.push(chunk);
    cursor += size;
  }
  return parts.join(" ");
}

/** Group an IBAN in blocks of 4, e.g. `MA64 0077 8000 0123 ...`. */
export function formatIban(value: string): string {
  const normalized = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return normalized.match(/.{1,4}/g)?.join(" ") ?? normalized;
}

/** Derive the IBAN from a 24-digit RIB (check digits are not recomputed here). */
export function ribToIban(rib: string, checkDigits = "64"): string {
  const digits = digitsOnly(rib).slice(0, 24);
  return formatIban(`MA${checkDigits}${digits}`);
}

/**
 * Smart formatter for a free-text account field that accepts either an IBAN (starts
 * with MA) or a raw RIB. Used by the transfer beneficiary input.
 */
export function formatAccountInput(value: string): string {
  const normalized = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!normalized) return "";
  if (normalized.startsWith("MA")) return formatIban(normalized);
  if (/^\d+$/.test(normalized)) return formatRib(normalized);
  return normalized.match(/.{1,4}/g)?.join(" ") ?? normalized;
}

/**
 * The first three RIB digits are the Moroccan bank code (code établissement). For an
 * IBAN we skip the `MA` + 2 check digits to reach the embedded RIB. The destination
 * bank is resolved from this code — the app never asks the user to pick it (a real
 * deployment would confirm it server-side from the same code).
 */
const BANK_BY_CODE: Record<string, string> = {
  "005": "Attijariwafa Bank",
  "007": "Attijariwafa Bank",
  "011": "Banque Populaire",
  "013": "BMCI",
  "021": "Bank of Africa",
  "022": "Société Générale Maroc",
  "050": "Crédit du Maroc",
  "145": "Al Barid Bank",
  "190": "CFG Bank",
  "225": "CIH Bank",
  "230": "Bank Al-Maghrib",
  "350": "Crédit Agricole du Maroc",
};

/** Extract the 3-digit bank code from a RIB or IBAN, or `undefined` if too short. */
function bankCode(account: string): string | undefined {
  const normalized = account.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const rib = normalized.startsWith("MA") ? normalized.slice(4) : normalized;
  const digits = rib.replace(/\D/g, "");
  return digits.length >= 3 ? digits.slice(0, 3) : undefined;
}

/**
 * Resolve the destination bank from a RIB/IBAN (auto-detected, never user-entered).
 * Returns `undefined` until enough digits are present or when the code is unknown.
 */
export function detectBankFromAccount(account: string): string | undefined {
  const code = bankCode(account);
  return code ? BANK_BY_CODE[code] : undefined;
}
