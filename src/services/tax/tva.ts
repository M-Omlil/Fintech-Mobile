/**
 * Moroccan TVA engine (mega-prompt §3). Shared by devis and factures so the
 * HT → TVA → TTC computation is never duplicated.
 */

/** Allowed Moroccan VAT rates (percent). */
export const VAT_RATES = [0, 7, 10, 14, 20] as const;
export type VatRate = (typeof VAT_RATES)[number];

export const DEFAULT_VAT_RATE: VatRate = 20;

export type Totals = {
  totalHT: number;
  vatAmount: number;
  totalTTC: number;
};

/** A billable line (quote/invoice). */
export type LineItemInput = {
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Totals for a single HT amount at a given rate. */
export function computeTotals(amountHT: number, vatRate: number): Totals {
  const vatAmount = round2(amountHT * (vatRate / 100));
  return { totalHT: round2(amountHT), vatAmount, totalTTC: round2(amountHT + vatAmount) };
}

/** Totals across line items (each line may carry its own rate). */
export function computeTotalsFromLines(lines: LineItemInput[]): Totals {
  return lines.reduce<Totals>(
    (acc, line) => {
      const lineHT = line.quantity * line.unitPrice;
      const lineVat = lineHT * (line.vatRate / 100);
      return {
        totalHT: round2(acc.totalHT + lineHT),
        vatAmount: round2(acc.vatAmount + lineVat),
        totalTTC: round2(acc.totalTTC + lineHT + lineVat),
      };
    },
    { totalHT: 0, vatAmount: 0, totalTTC: 0 },
  );
}
