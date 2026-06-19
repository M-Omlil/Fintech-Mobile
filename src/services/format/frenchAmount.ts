/**
 * French number-to-words, used to spell the invoice total ("Arrêtée la présente facture à
 * la somme de …"). Handles the vingt/cent pluralisation and "et un" rules so e.g.
 * 4680 → "quatre mille six cent quatre-vingts".
 */

const UNITS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

function below100(n: number): string {
  if (n < 20) return UNITS[n] ?? "";
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7 || t === 9) {
    const rem = below100(10 + u); // dix … dix-neuf
    if (t === 7) return u === 1 ? "soixante et onze" : `soixante-${rem}`;
    return `quatre-vingt-${rem}`; // 90–99
  }
  if (t === 8) return u === 0 ? "quatre-vingts" : `quatre-vingt-${UNITS[u]}`;
  const word = TENS[t] ?? "";
  if (u === 0) return word;
  if (u === 1 && t >= 2 && t <= 6) return `${word} et un`;
  return `${word}-${UNITS[u]}`;
}

function below1000(n: number): string {
  if (n < 100) return below100(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  const head = h === 1 ? "cent" : `${UNITS[h]} cent`;
  if (r === 0) return h > 1 ? `${UNITS[h]} cents` : head;
  return `${head} ${below100(r)}`;
}

function toWords(n: number): string {
  if (n === 0) return "zéro";
  const parts: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  if (millions) parts.push(millions === 1 ? "un million" : `${below1000(millions)} millions`);
  if (thousands) parts.push(thousands === 1 ? "mille" : `${below1000(thousands)} mille`);
  if (rest) parts.push(below1000(rest));
  return parts.join(" ");
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

/** Spell a MAD amount, e.g. 4680 → "Quatre mille six cent quatre-vingts DH TTC". */
export function amountToFrenchWords(amount: number): string {
  const rounded = Math.round(amount * 100);
  const dh = Math.floor(rounded / 100);
  const cents = rounded % 100;
  const dhWords = capitalize(toWords(dh));
  if (cents === 0) return `${dhWords} DH TTC`;
  return `${dhWords} DH et ${below100(cents)} centimes TTC`;
}
