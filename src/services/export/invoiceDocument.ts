import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { Business, Invoice, LineItem } from "@domain/index";
import { amountToFrenchWords } from "@services/format/frenchAmount";

/** French amount without currency, dot thousands + comma decimals ("2.657,50"). */
function fmt(n: number): string {
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const grouped = (int ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "-" : ""}${grouped},${dec ?? "00"}`;
}
const dh = (n: number): string => `${fmt(n)} DH`;

function ddmmyyyy(iso: string): string {
  const d = new Date(iso);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function lineHT(l: LineItem): number {
  return l.quantity * l.unitPrice;
}

/** Group VAT by rate so the totals box can show "TVA (0%)", "TVA (20%)", … */
function vatByRate(lines: LineItem[]): { rate: number; amount: number }[] {
  const map = new Map<number, number>();
  for (const l of lines)
    map.set(l.vatRate, (map.get(l.vatRate) ?? 0) + (lineHT(l) * l.vatRate) / 100);
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([rate, amount]) => ({ rate, amount }));
}

function rowsHtml(lines: LineItem[]): string {
  return lines
    .map(
      (l) => `<tr>
        <td class="desc">${l.description}<span class="vat">TVA ${l.vatRate}%</span></td>
        <td class="c">${l.quantity}</td>
        <td class="r">${fmt(l.unitPrice)}</td>
        <td class="r">${fmt(lineHT(l))}</td>
      </tr>`,
    )
    .join("");
}

function totalsHtml(invoice: Invoice): string {
  const vat = vatByRate(invoice.lines);
  const vatRows = vat
    .map(
      (v) => `<tr><td class="lbl">TVA (${v.rate}%)</td><td class="val">${dh(v.amount)}</td></tr>`,
    )
    .join("");
  return `<table class="totals">
      <tr><td class="lbl">Total HT</td><td class="val">${dh(invoice.totalHT)}</td></tr>
      ${vatRows}
      <tr class="grand"><td class="lbl">TOTAL TTC</td><td class="val">${dh(invoice.totalTTC)}</td></tr>
    </table>`;
}

function footerHtml(b: Business): string {
  const contact = [b.name, b.address].filter(Boolean).join(" - ");
  const email = b.email ? ` | ${b.email}` : "";
  const legal = [
    b.legal.rc && `RC : ${b.legal.rc}`,
    b.legal.if && `IF : ${b.legal.if}`,
    b.legal.ice && `ICE : ${b.legal.ice}`,
    b.phone,
  ]
    .filter(Boolean)
    .join("| ");
  return `<div class="footer"><div>${contact}${email}</div><div>${legal}</div></div>`;
}

const STYLE = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #1B2A3D;
         font-size: 21px; line-height: 1.5; padding: 36px 38px; -webkit-print-color-adjust: exact; }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .brand { font-size: 46px; font-weight: 800; color: #27ABFC; letter-spacing: -1px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 22px; margin-top: 30px; }
  .facture-no { font-size: 31px; font-weight: 800; color: #1F6FB2; margin: 0; line-height: 1.2; }
  .date { color: #51657A; margin: 8px 0 0; font-size: 20px; }
  .client { border: 2px solid #DBE6F0; border-radius: 16px; padding: 18px 24px; min-width: 47%; text-align: center; }
  .client .label { color: #8A9BAC; font-size: 16px; letter-spacing: 1.5px; text-transform: uppercase; }
  .client .name { font-weight: 800; font-size: 24px; margin-top: 5px; }
  .client .meta { color: #51657A; margin-top: 5px; font-size: 19px; line-height: 1.5; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 36px; font-size: 20px; }
  table.items thead th { background: #1F6FB2; color: #fff; text-align: left; padding: 15px 14px;
                         font-size: 17px; font-weight: 700; letter-spacing: 0.4px; }
  table.items thead th.c { text-align: center; } table.items thead th.r { text-align: right; }
  table.items tbody td { padding: 16px 14px; border-bottom: 1px solid #E4EBF2; vertical-align: top; }
  table.items tbody tr:nth-child(even) td { background: #F7FAFD; }
  td.desc { font-weight: 600; }
  td.desc .vat { display: block; color: #8A9BAC; font-size: 16px; font-weight: 400; margin-top: 3px; }
  td.c { text-align: center; } td.r { text-align: right; white-space: nowrap; }
  .summary { display: flex; justify-content: space-between; align-items: flex-start; gap: 22px; margin-top: 36px; }
  .words { max-width: 47%; }
  .words .lead { color: #51657A; font-size: 18px; }
  .words .amount { font-weight: 800; font-size: 22px; margin-top: 7px; line-height: 1.4; }
  table.totals { border-collapse: collapse; min-width: 47%; font-size: 20px; }
  table.totals td { padding: 13px 18px; border: 1px solid #E4EBF2; }
  table.totals td.lbl { background: #F2F6FA; color: #1F6FB2; font-weight: 700; }
  table.totals td.val { text-align: right; white-space: nowrap; }
  table.totals tr.grand td { background: #1F6FB2; color: #fff; font-weight: 800; font-size: 23px; }
  .footer { margin-top: 64px; text-align: center; color: #51657A; font-size: 16px; line-height: 1.8;
            border-top: 1px solid #E4EBF2; padding-top: 16px; }
`;

/** One invoice's body (header, client box, table, totals, footer) — matches invoice.pdf. */
function invoiceBody(b: Business, invoice: Invoice): string {
  const docTitle = invoice.kind === "achat" ? "Facture d'achat" : "Facture";
  const clientLines = [invoice.clientIce ? `ICE : ${invoice.clientIce}` : "", "Casablanca - Maroc"]
    .filter(Boolean)
    .join("<br/>");
  return `<div class="page">
      <div class="brand">${b.name}</div>
      <div class="head">
        <div>
          <p class="facture-no">${docTitle} N° ${invoice.number}</p>
          <p class="date">Date : ${ddmmyyyy(invoice.issueDate)}</p>
        </div>
        <div class="client">
          <div class="label">Facturé à</div>
          <div class="name">${invoice.clientName ?? "—"}</div>
          <div class="meta">${clientLines}</div>
        </div>
      </div>
      <table class="items">
        <thead><tr>
          <th>Désignation</th><th class="c">Qté</th>
          <th class="r">P.U. HT</th><th class="r">Total HT</th>
        </tr></thead>
        <tbody>${rowsHtml(invoice.lines)}</tbody>
      </table>
      <div class="summary">
        <div class="words">
          <div class="lead">Arrêtée la présente facture à la somme de :</div>
          <div class="amount">${amountToFrenchWords(invoice.totalTTC)}</div>
        </div>
        ${totalsHtml(invoice)}
      </div>
      ${footerHtml(b)}
    </div>`;
}

function wrapDoc(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${STYLE}</style></head><body>${body}</body></html>`;
}

function defaultFileName(invoice: Invoice): string {
  return `${invoice.number.replace(/[^A-Za-z0-9]+/g, "-")}.pdf`;
}

/** Render the given HTML to a PDF, give it a name, and open the native share sheet. */
async function sharePdf(html: string, fileName: string, dialogTitle: string): Promise<void> {
  // A4 page in points (72 dpi) so the document reads cleanly on a phone at fit-to-width.
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
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
      dialogTitle,
      UTI: "com.adobe.pdf",
    });
  }
}

/**
 * Generate the invoice as a real PDF (expo-print) following the shared invoice.pdf
 * structure, name it, and open the native share sheet.
 */
export async function exportInvoiceDocument(
  business: Business,
  invoice: Invoice,
  fileName?: string,
): Promise<void> {
  await sharePdf(
    wrapDoc(invoiceBody(business, invoice)),
    fileName ?? defaultFileName(invoice),
    invoice.number,
  );
}

/**
 * "Partager au comptable" — bundle several invoices into a single multi-page PDF (one
 * facture per page) and share it, e.g. a whole year or month of documents at once.
 */
export async function exportAccountantBundle(
  business: Business,
  invoices: Invoice[],
  fileName: string,
): Promise<void> {
  if (invoices.length === 0) return;
  const body = invoices.map((inv) => invoiceBody(business, inv)).join("");
  await sharePdf(wrapDoc(body), fileName, fileName.replace(/\.pdf$/i, ""));
}
