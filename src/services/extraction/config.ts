/**
 * Document-extraction configuration. The on-device text parser always runs and needs
 * nothing here. Cloud vision (for scanned/photo factures, which have no embedded text)
 * stays disabled until a key is provided — paste an Anthropic key below, or point
 * `endpoint` at your own backend proxy so the key never ships in the app.
 */
export const EXTRACTION_CONFIG = {
  /** Anthropic API key — leave empty to keep cloud vision OFF (on-device + manual only). */
  visionApiKey: "",
  /** Vision-capable model used for OCR-style extraction. */
  visionModel: "claude-sonnet-4-6",
  /** Messages endpoint (override to route through your backend). */
  visionEndpoint: "https://api.anthropic.com/v1/messages",
};

/** True when a key is configured, so the hybrid pipeline may fall back to vision. */
export function isVisionEnabled(): boolean {
  return EXTRACTION_CONFIG.visionApiKey.trim().length > 0;
}
