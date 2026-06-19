/**
 * Money formatting — Moroccan Dirham by default (mega-prompt §3). French-Moroccan
 * style: space thousands separator, comma decimal, `DH` symbol → `1 234,56 DH`.
 * Currency is a parameter (default MAD) so a foreign-currency flow can pass EUR.
 */
export type CurrencyCode = "MAD" | "EUR";

const LOCALE = "fr-MA";
const NBSP = " "; // non-breaking space for French thousands grouping

/** Display symbol per currency. MAD shows the local `DH` rather than the ISO code. */
const currencySymbol: Record<CurrencyCode, string> = { MAD: "DH", EUR: "€" };

function hasIntlDecimal(): boolean {
  try {
    const probe = new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(1234.5);
    return probe.includes(",");
  } catch {
    return false;
  }
}

const intlSupported = hasIntlDecimal();

function groupManually(value: number): string {
  const fixed = Math.abs(value).toFixed(2);
  const [integer = "0", decimals = "00"] = fixed.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${grouped},${decimals}`;
}

function formatNumber(value: number): string {
  if (intlSupported) {
    return new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
  }
  return groupManually(value);
}

/** Format an absolute amount, e.g. `1 234,56 DH`. Sign handling lives in callers. */
export function formatMoney(value: number, currency: CurrencyCode = "MAD"): string {
  return `${formatNumber(value)}${NBSP}${currencySymbol[currency]}`;
}

/** Format with an explicit leading `+`/`-` sign, e.g. `+50,00 DH`. */
export function formatSignedMoney(value: number, currency: CurrencyCode = "MAD"): string {
  const sign = value < 0 ? "-" : "+";
  return `${sign}${formatMoney(value, currency)}`;
}
