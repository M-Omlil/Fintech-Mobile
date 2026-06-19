import type { Invoice } from "@domain/index";

/**
 * Document classement model. Every document in the app is derived here so the classement
 * tree (catégorie → année → mois → fichiers) and the file names stay consistent:
 *   - facture de vente  → yyyymmdd-FV-Nom-Client-numero.pdf
 *   - facture d'achat   → yyyymmdd-FA-Nom-Client-numero.pdf
 *   - justificatif paie → yyyymmdd-randomID.pdf
 */
export type DocCategory = "vente" | "achat" | "justificatif";

export type DocItem = {
  id: string;
  category: DocCategory;
  /** ISO date the document is classed under (issue date, or payment date). */
  date: string;
  fileName: string;
  title: string;
  amount: number;
  /** Source invoice — used to render/export the PDF. */
  invoiceId: string;
};

const CODE: Record<"vente" | "achat", string> = { vente: "FV", achat: "FA" };

const pad2 = (n: number): string => String(n).padStart(2, "0");

function yyyymmdd(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

function slug(value: string): string {
  const COMBINING = new RegExp("[\\u0300-\\u036f]", "g");
  return value
    .normalize("NFD")
    .replace(COMBINING, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Stable short id from a seed (no Math.random → consistent across renders). */
function shortId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h.toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
}

function fileNameFor(
  category: DocCategory,
  date: string,
  title: string,
  number: string,
  invoiceId: string,
): string {
  const day = yyyymmdd(date);
  if (category === "justificatif") return `${day}-${shortId(invoiceId)}.pdf`;
  const numero = slug(number.replace(/^(FV|FA)-/i, ""));
  return `${day}-${CODE[category]}-${slug(title)}-${numero}.pdf`;
}

/** Build the full document list from invoices (sales, purchases, and payment receipts). */
export function buildDocuments(invoices: Invoice[]): DocItem[] {
  const docs: DocItem[] = [];
  for (const inv of invoices) {
    const title = inv.clientName ?? inv.number;
    if (inv.kind === "vente" || inv.kind === "achat") {
      docs.push({
        id: `doc-${inv.id}`,
        category: inv.kind,
        date: inv.issueDate,
        title,
        amount: inv.totalTTC,
        invoiceId: inv.id,
        fileName: fileNameFor(inv.kind, inv.issueDate, title, inv.number, inv.id),
      });
    }
    if (inv.paidAt) {
      docs.push({
        id: `just-${inv.id}`,
        category: "justificatif",
        date: inv.paidAt,
        title,
        amount: inv.totalTTC,
        invoiceId: inv.id,
        fileName: fileNameFor("justificatif", inv.paidAt, title, inv.number, inv.id),
      });
    }
  }
  return docs;
}
