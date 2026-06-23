import type { InvoiceFields } from "./fields";

/**
 * Demo OCR simulation. When real on-device parsing/vision finds nothing usable in an
 * uploaded facture, we fall back to a believable Moroccan supplier so the review screen
 * is always pre-filled for the user to validate (UC2 demo). Deterministic per file so the
 * same upload always yields the same suggestion.
 */
const SAMPLES: Required<InvoiceFields>[] = [
  {
    supplierName: "Disway SA",
    amount: 12480,
    rib: "011810000077889900112233",
    ice: "001542300000099",
  },
  {
    supplierName: "Sage Maroc",
    amount: 4200,
    rib: "007450000122000304005812",
    ice: "001998200000055",
  },
  {
    supplierName: "Marjane Business",
    amount: 2375.5,
    rib: "230450000021480195100022",
    ice: "000556677000012",
  },
  {
    supplierName: "Sonasid Distribution",
    amount: 18650,
    rib: "021780000124001009310044",
    ice: "002648130000071",
  },
  {
    supplierName: "Papeterie El Manar",
    amount: 860,
    rib: "007780000123456789010144",
    ice: "001084710000034",
  },
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) % 1_000_000_007;
  return h;
}

/** A plausible, fully-populated facture inferred from the uploaded file's identity. */
export function simulateInvoiceFields(file: { name?: string; uri: string }): InvoiceFields {
  const key = file.name && file.name.length > 0 ? file.name : file.uri;
  return { ...(SAMPLES[hash(key) % SAMPLES.length] ?? SAMPLES[0]!) };
}
