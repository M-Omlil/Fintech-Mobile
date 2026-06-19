/**
 * Heuristic field detection over extracted invoice text. Tuned for Moroccan/French
 * factures: French money, a 24-digit RIB, a 15-digit ICE. Everything is optional —
 * whatever isn't found cleanly is left for the user to fill.
 */
export type InvoiceFields = {
  supplierName?: string;
  amount?: number;
  rib?: string;
  ice?: string;
};

// French money: grouped thousands (space/nbsp/dot) then a 2-digit comma decimal, or a
// plain "1234,56". `\s` already covers the non-breaking space common in PDF money.
const MONEY = /\d{1,3}(?:[.\s]\d{3})+,\d{2}|\d+,\d{2}/g;
// Digit separators inside a RIB/ICE — space, dot, nbsp only (never a newline).
const SEP = " .\\u00a0";

/** Parse a French-formatted money token ("1 234,56" / "1.234,56") into a number. */
function parseFrenchAmount(token: string): number {
  const normalized = token.replace(/[.\s]/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

/** Prefer an amount near a "TTC" mention; otherwise the largest money token. */
function detectAmount(text: string): number | undefined {
  const matches = [...text.matchAll(MONEY)].map((m) => ({
    value: parseFrenchAmount(m[0]),
    index: m.index ?? 0,
  }));
  if (matches.length === 0) return undefined;

  let best: number | undefined;
  let bestDistance = Infinity;
  for (const marker of text.matchAll(/t\.?\s*t\.?\s*c/gi)) {
    const markerIndex = marker.index ?? 0;
    for (const money of matches) {
      const distance = money.index - markerIndex;
      if (distance >= 0 && distance < 40 && distance < bestDistance) {
        bestDistance = distance;
        best = money.value;
      }
    }
  }
  if (best != null && best > 0) return best;

  return matches.reduce((max, m) => (m.value > max ? m.value : max), 0) || undefined;
}

/** First 24-digit run (the RIB), tolerating spaces/dots between digits. */
function detectRib(text: string): string | undefined {
  const candidates = text.match(new RegExp(`\\d[\\d${SEP}]{20,}\\d`, "g")) ?? [];
  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length >= 24 && digits.length <= 27) return digits.slice(0, 24);
  }
  return undefined;
}

/** 15-digit ICE, preferentially the one labelled "ICE". */
function detectIce(text: string): string | undefined {
  const labelled = text.match(new RegExp(`ICE[^0-9]{0,12}((?:\\d[${SEP}]?){15})`, "i"));
  const digits = labelled?.[1]?.replace(/\D/g, "");
  return digits && digits.length === 15 ? digits : undefined;
}

/** Issuer name from a labelled line — captured up to the next label/number. */
function detectSupplier(text: string): string | undefined {
  const m = text.match(
    /(?:Fournisseur|Raison sociale|[ÉE]metteur|Vendeur|Soci[ée]t[ée])\s*[-:]?\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'&-]{1,58}?)(?=\s+(?:ICE|RIB|IF|RC|TVA|Total|N°|Date)|\d|$)/i,
  );
  const name = m?.[1]?.trim();
  return name && name.length > 1 ? name : undefined;
}

export function parseInvoiceFields(text: string): InvoiceFields {
  return {
    supplierName: detectSupplier(text),
    amount: detectAmount(text),
    rib: detectRib(text),
    ice: detectIce(text),
  };
}
