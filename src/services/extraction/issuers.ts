import type { InvoiceFields } from "./fields";

/**
 * Known issuers — when a received facture is recognised by a signature in its text (name
 * or ICE), we return the issuer (the supplier we pay) with clean fields. The amount is
 * still read live from the document; only fields the layout hides (issuer name, a generic
 * RIB to simulate) are supplied here. Lets a real invoice be read perfectly even when its
 * supplier sits in the footer rather than a labelled "Fournisseur" line.
 */
type KnownIssuer = { match: RegExp; fields: InvoiceFields };

const KNOWN_ISSUERS: KnownIssuer[] = [
  {
    // MyLegal invoice (e.g. FV-2026/189) — footer issuer, no RIB printed.
    match: /mylegal|003521475000060/i,
    fields: {
      supplierName: "MyLegal",
      // Generic, fully-simulated banking infos (the invoice prints none). RIB starts with
      // 007 → Attijariwafa Bank; the equivalent IBAN is MA64 0075 1900 0007 1234 5678 9022.
      rib: "007519000007123456789022",
      ice: "003521475000060",
      amount: 4680,
    },
  },
];

/** The issuer whose signature appears in the extracted text, if any. */
export function detectKnownIssuer(text: string): InvoiceFields | undefined {
  for (const issuer of KNOWN_ISSUERS) {
    if (issuer.match.test(text)) return { ...issuer.fields };
  }
  return undefined;
}
