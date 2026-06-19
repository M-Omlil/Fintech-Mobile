/**
 * Client-side simulation helpers for the commercial cycle (UC1). The client's actions —
 * validating the devis, signing the bon de commande, paying the facture — happen
 * automatically in the background after a short, realistic delay, with no manual buttons.
 */

/** Randomised delay (capped at 10s) standing in for the client acting on their side. */
export function clientActionDelay(): number {
  return 4000 + Math.floor(Math.random() * 5000); // 4–9 s, always < 10 s
}

/**
 * Generates a hand-written-looking signature as SVG path data, so the electronic
 * signature can be produced in the background without showing a drawing pad. Coordinates
 * fit a ~300×120 preview box; slight per-call jitter makes each signature unique.
 */
export function generateSignatureStrokes(): string {
  const rand = () => Math.random();
  const baseY = 66;
  const startX = 24;
  const span = 250 + rand() * 40;
  const loops = 4 + Math.floor(rand() * 3);
  const amp = 22 + rand() * 12;
  const steps = 48;

  const parts: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const tt = i / steps;
    const x = startX + tt * span;
    const y =
      baseY +
      Math.sin(tt * Math.PI * loops + rand() * 0.3) * amp * (1 - tt * 0.25) +
      Math.sin(tt * Math.PI * 2) * 4;
    parts.push(`${i === 0 ? "M" : "L"} ${Math.round(x)} ${Math.round(y)}`);
  }
  // A trailing underline flourish.
  const uy = baseY + amp + 14;
  parts.push(`M ${Math.round(startX + 12)} ${Math.round(uy)}`);
  parts.push(`L ${Math.round(startX + span * 0.78)} ${Math.round(uy - 5)}`);
  return parts.join(" ");
}
