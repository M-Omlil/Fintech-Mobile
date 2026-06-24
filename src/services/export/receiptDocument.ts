import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { Business, CurrencyCode } from "@domain/index";
import { amountToFrenchWords } from "@services/format/frenchAmount";

/** A confirmed transaction, rendered as a bank-style "avis d'opération". */
export type TransactionReceipt = {
  direction: "out" | "in";
  /** Headline, e.g. "Virement émis" / "Encaissement reçu". */
  title: string;
  /** Counterparty (beneficiary for an outgoing transfer). */
  party: string;
  amount: number;
  currency: CurrencyCode;
  /** ISO date of the operation. */
  date: string;
  reference: string;
  method: string;
  account?: string;
  bank?: string;
};

function fmt(n: number): string {
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const grouped = (int ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped},${dec ?? "00"}`;
}
const dh = (n: number): string => `${fmt(n)} DH`;

function ddmmyyyyhhmm(iso: string): string {
  const d = new Date(iso);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} à ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const STYLE = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #1B2A3D;
         font-size: 22px; line-height: 1.5; padding: 44px 46px; -webkit-print-color-adjust: exact; }
  .brand { font-size: 44px; font-weight: 800; color: #27ABFC; letter-spacing: -1px; }
  .doc { color: #51657A; font-size: 18px; margin-top: 2px; }
  .badge { display: inline-block; margin-top: 26px; padding: 9px 20px; border-radius: 999px;
           background: #1FA971; color: #fff; font-weight: 700; font-size: 19px; }
  .amount { font-size: 52px; font-weight: 800; margin: 26px 0 4px; letter-spacing: -1px; }
  .words { color: #51657A; font-size: 18px; margin-bottom: 30px; }
  table.rows { width: 100%; border-collapse: collapse; margin-top: 10px; }
  table.rows td { padding: 16px 4px; border-bottom: 1px solid #E4EBF2; vertical-align: top; font-size: 20px; }
  table.rows td.k { color: #8A9BAC; width: 42%; }
  table.rows td.v { text-align: right; font-weight: 600; }
  .ref { margin-top: 30px; padding: 18px 22px; background: #F2F6FA; border-radius: 16px;
         color: #51657A; font-size: 18px; }
  .footer { margin-top: 54px; text-align: center; color: #8A9BAC; font-size: 15px; line-height: 1.7;
            border-top: 1px solid #E4EBF2; padding-top: 18px; }
`;

function receiptHtml(business: Business, r: TransactionReceipt): string {
  const sign = r.direction === "out" ? "-" : "+";
  const rows = [
    [r.direction === "out" ? "Bénéficiaire" : "Émetteur", r.party],
    ["Compte émetteur", business.name],
    r.account ? ["RIB / IBAN", r.account] : null,
    r.bank ? ["Banque destinataire", r.bank] : null,
    ["Mode", r.method],
    ["Date d'exécution", ddmmyyyyhhmm(r.date)],
    ["Statut", "Exécuté"],
  ]
    .filter(Boolean)
    .map((row) => {
      const [k, v] = row as [string, string];
      return `<tr><td class="k">${k}</td><td class="v">${v}</td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${STYLE}</style></head><body>
    <div class="brand">${business.name}</div>
    <div class="doc">Avis d'opération · ${r.title}</div>
    <div class="badge">✓ Opération exécutée</div>
    <div class="amount">${sign}${dh(r.amount)}</div>
    <div class="words">${amountToFrenchWords(r.amount)}</div>
    <table class="rows">${rows}</table>
    <div class="ref">Référence de l'opération : <b>${r.reference}</b></div>
    <div class="footer">
      <div>${business.name}${business.address ? " — " + business.address : ""}</div>
      <div>Document généré électroniquement — ne nécessite pas de signature.</div>
    </div>
  </body></html>`;
}

/**
 * Render the receipt to a real PDF (expo-print) and open the native share sheet, which
 * offers see / download (save to Files) / share — like a Moroccan bank's transfer notice.
 */
export async function shareTransactionReceipt(
  business: Business,
  receipt: TransactionReceipt,
): Promise<void> {
  const fileName = `Recu-${receipt.reference.replace(/[^A-Za-z0-9]+/g, "-")}.pdf`;
  const { uri } = await Print.printToFileAsync({
    html: receiptHtml(business, receipt),
    width: 595,
    height: 842,
  });
  let target = uri;
  try {
    const dest = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.deleteAsync(dest, { idempotent: true });
    await FileSystem.copyAsync({ from: uri, to: dest });
    target = dest;
  } catch {
    target = uri;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target, {
      mimeType: "application/pdf",
      dialogTitle: receipt.title,
      UTI: "com.adobe.pdf",
    });
  }
}
