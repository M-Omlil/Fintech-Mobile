import { EXTRACTION_CONFIG, isVisionEnabled } from "./config";
import type { InvoiceFields } from "./fields";

/**
 * Cloud OCR fallback for scanned/photo factures (no embedded text). Sends the file to
 * a vision model and asks for the same fields as the on-device parser. Disabled unless
 * a key is configured; calling Anthropic directly from the app exposes the key, so a
 * production build should set `visionEndpoint` to a backend proxy instead.
 */
const PROMPT =
  "Tu es un extracteur de factures marocaines. Renvoie UNIQUEMENT un objet JSON valide " +
  "avec les clés: supplierName (raison sociale du fournisseur, string ou null), amount " +
  "(total TTC en nombre, ex 1234.56, ou null), rib (24 chiffres sans espaces ou null), " +
  "ice (15 chiffres ou null). Aucune autre clé, aucun texte hors du JSON.";

type ContentBlock =
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
  | { type: "text"; text: string };

export async function visionExtract(
  base64: string,
  mediaType: string,
): Promise<InvoiceFields | null> {
  if (!isVisionEnabled()) return null;

  const fileBlock: ContentBlock =
    mediaType === "application/pdf"
      ? {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };

  let textOut = "";
  try {
    const res = await fetch(EXTRACTION_CONFIG.visionEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": EXTRACTION_CONFIG.visionApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: EXTRACTION_CONFIG.visionModel,
        max_tokens: 512,
        messages: [{ role: "user", content: [fileBlock, { type: "text", text: PROMPT }] }],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { content?: { type: string; text?: string }[] };
    textOut = json.content?.find((c) => c.type === "text")?.text ?? "";
  } catch {
    return null;
  }

  const match = textOut.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const rib = typeof parsed.rib === "string" ? parsed.rib.replace(/\D/g, "") : undefined;
    const ice = typeof parsed.ice === "string" ? parsed.ice.replace(/\D/g, "") : undefined;
    return {
      supplierName: typeof parsed.supplierName === "string" ? parsed.supplierName : undefined,
      amount: typeof parsed.amount === "number" ? parsed.amount : undefined,
      rib: rib && rib.length >= 20 ? rib.slice(0, 24) : undefined,
      ice: ice && ice.length === 15 ? ice : undefined,
    };
  } catch {
    return null;
  }
}
