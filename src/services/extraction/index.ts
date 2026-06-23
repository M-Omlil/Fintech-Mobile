import * as FileSystem from "expo-file-system/legacy";

import { base64ToBytes } from "./base64";
import { isVisionEnabled } from "./config";
import { parseInvoiceFields, type InvoiceFields } from "./fields";
import { extractPdfText } from "./pdfText";
import { simulateInvoiceFields } from "./simulate";
import { visionExtract } from "./vision";

export type ExtractionSource = "text" | "vision" | "simulated" | "none";
export type ExtractedInvoice = InvoiceFields & { source: ExtractionSource };
export type UploadFile = { uri: string; name?: string; mimeType?: string };

function classify(file: UploadFile) {
  const hint = `${file.name ?? ""} ${file.uri} ${file.mimeType ?? ""}`.toLowerCase();
  return {
    isPdf: hint.includes("pdf"),
    isText: hint.includes(".txt") || hint.includes("text/plain"),
    isImage: hint.includes("image/") || /\.(png|jpe?g|webp|heic|gif)/.test(hint),
  };
}

function guessImageMime(hint: string): string {
  const h = hint.toLowerCase();
  if (h.includes("png")) return "image/png";
  if (h.includes("webp")) return "image/webp";
  if (h.includes("gif")) return "image/gif";
  return "image/jpeg";
}

/** A result is useful once we have at least an amount or a RIB. */
function hasFields(fields: InvoiceFields): boolean {
  return fields.amount != null || !!fields.rib;
}

/**
 * Complete a partial real extraction with simulated values so the review screen is always
 * fully pre-filled (montant + RIB) for the user to validate — real data is kept, only the
 * gaps the OCR couldn't read are filled in.
 */
function complete(
  real: InvoiceFields,
  file: UploadFile,
  source: ExtractionSource,
): ExtractedInvoice {
  // A real name shorter than 3 chars is a parse artifact — prefer the simulated label.
  const goodName = !!real.supplierName && real.supplierName.trim().length >= 3;
  if (real.amount != null && real.rib && goodName) return { ...real, source };
  const sim = simulateInvoiceFields(file);
  return {
    supplierName: goodName ? real.supplierName : sim.supplierName,
    amount: real.amount ?? sim.amount,
    rib: real.rib ?? sim.rib,
    ice: real.ice ?? sim.ice,
    source,
  };
}

/**
 * Hybrid invoice extraction (UC2). On-device text parsing runs first for text-based
 * PDFs/TXT (instant, offline, private); if that finds nothing and a vision key is
 * configured, the file is sent for OCR. If everything real comes up empty, a simulated
 * OCR result is returned so the review screen is always pre-filled for the user to
 * validate — the caller always gets editable fields plus the `source` used.
 */
export async function extractInvoiceData(file: UploadFile): Promise<ExtractedInvoice> {
  const { isPdf, isText, isImage } = classify(file);

  try {
    let text = "";
    if (isText) {
      text = await FileSystem.readAsStringAsync(file.uri);
    } else if (isPdf) {
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: "base64" });
      text = extractPdfText(base64ToBytes(base64));
    }
    if (text) {
      const fields = parseInvoiceFields(text);
      if (hasFields(fields)) return complete(fields, file, "text");
    }
  } catch {
    // fall through to vision / simulated
  }

  if (isVisionEnabled() && (isImage || isPdf)) {
    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: "base64" });
      const mediaType = isPdf
        ? "application/pdf"
        : guessImageMime(`${file.mimeType ?? ""} ${file.name ?? ""} ${file.uri}`);
      const fields = await visionExtract(base64, mediaType);
      if (fields && hasFields(fields)) return complete(fields, file, "vision");
    } catch {
      // fall through to simulated
    }
  }

  // Demo fallback: simulate an OCR read so the facture is always auto-filled to validate.
  return { ...simulateInvoiceFields(file), source: "simulated" };
}
