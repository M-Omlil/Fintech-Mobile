import * as FileSystem from "expo-file-system/legacy";

import { base64ToBytes } from "./base64";
import { isVisionEnabled } from "./config";
import { parseInvoiceFields, type InvoiceFields } from "./fields";
import { extractPdfText } from "./pdfText";
import { visionExtract } from "./vision";

export type ExtractionSource = "text" | "vision" | "none";
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
 * Hybrid invoice extraction (UC2). On-device text parsing runs first for text-based
 * PDFs/TXT (instant, offline, private); if that finds nothing and a vision key is
 * configured, the file is sent for OCR. Anything still missing is left for manual
 * entry — the caller always gets editable fields plus the `source` used.
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
      if (hasFields(fields)) return { ...fields, source: "text" };
    }
  } catch {
    // fall through to vision / manual
  }

  if (isVisionEnabled() && (isImage || isPdf)) {
    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: "base64" });
      const mediaType = isPdf
        ? "application/pdf"
        : guessImageMime(`${file.mimeType ?? ""} ${file.name ?? ""} ${file.uri}`);
      const fields = await visionExtract(base64, mediaType);
      if (fields && hasFields(fields)) return { ...fields, source: "vision" };
    } catch {
      // fall through to manual
    }
  }

  return { source: "none" };
}
