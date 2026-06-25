import type { Invoice, Transaction } from "@domain/index";

import type { ChartPoint, ChartType } from "./components/CustomChart";

export type MetricKey = "ca" | "encaissements" | "depenses" | "tresorerie";
export type DurationKey = "7j" | "30j" | "6m" | "12m" | "ytd";
export const DURATION_KEYS: DurationKey[] = ["7j", "30j", "6m", "12m", "ytd"];

const MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
] as const;

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Bucket unit + count for a period. "ytd" = months from January to the current month. */
export function periodConfig(
  now: Date,
  key: DurationKey,
): { unit: "day" | "month"; count: number } {
  switch (key) {
    case "7j":
      return { unit: "day", count: 7 };
    case "30j":
      return { unit: "day", count: 30 };
    case "6m":
      return { unit: "month", count: 6 };
    case "12m":
      return { unit: "month", count: 12 };
    case "ytd":
      return { unit: "month", count: now.getMonth() + 1 };
  }
}

/** Time buckets (day or month) ending today, oldest first. */
export function buildBuckets(now: Date, unit: "day" | "month", count: number) {
  const buckets: { start: number; end: number; label: string }[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    if (unit === "day") {
      const s = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
      const e = new Date(s);
      e.setDate(e.getDate() + 1);
      buckets.push({
        start: s.getTime(),
        end: e.getTime(),
        label: `${s.getDate()}/${s.getMonth() + 1}`,
      });
    } else {
      const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({
        start: s.getTime(),
        end: e.getTime(),
        label: MONTHS_SHORT[s.getMonth()] ?? "",
      });
    }
  }
  return buckets;
}

/**
 * Chart points for a single metric over a period. Line/bar → a time series across the
 * buckets; pie → the top-5 distribution across the window (by client / counterparty, or
 * inflows vs outflows for trésorerie). Shared by both dashboard graphs.
 */
export function computeChartData(
  metric: MetricKey,
  chartType: ChartType,
  duration: DurationKey,
  txns: Transaction[],
  invs: Invoice[],
  now: Date,
  flowLabels: { inflows: string; outflows: string },
): ChartPoint[] {
  const cfg = periodConfig(now, duration);
  const buckets = buildBuckets(now, cfg.unit, cfg.count);

  if (chartType === "pie") {
    const windowStart = buckets[0]?.start ?? 0;
    const inWindow = (iso: string) => new Date(iso).getTime() >= windowStart;
    const group: Record<string, number> = {};
    if (metric === "ca") {
      invs
        .filter((i) => i.kind === "vente" && inWindow(i.issueDate))
        .forEach((i) => {
          const k = i.clientName ?? i.number;
          group[k] = (group[k] ?? 0) + i.totalTTC;
        });
    } else if (metric === "tresorerie") {
      group[flowLabels.inflows] = txns
        .filter((x) => x.type === "revenu" && inWindow(x.date))
        .reduce((s, x) => s + x.amount, 0);
      group[flowLabels.outflows] = txns
        .filter((x) => x.type === "depense" && inWindow(x.date))
        .reduce((s, x) => s + x.amount, 0);
    } else {
      const type: Transaction["type"] = metric === "encaissements" ? "revenu" : "depense";
      txns
        .filter((x) => x.type === type && inWindow(x.date))
        .forEach((x) => {
          const k = x.counterparty || x.label;
          group[k] = (group[k] ?? 0) + x.amount;
        });
    }
    return Object.entries(group)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));
  }

  const sumTx = (start: number, end: number, pick: (x: Transaction) => number) =>
    txns
      .filter((x) => {
        const ts = x.date ? new Date(x.date).getTime() : NaN;
        return ts >= start && ts < end;
      })
      .reduce((s, x) => s + pick(x), 0);

  if (metric === "ca") {
    // Cumulative revenue billed across the window (a steadily building curve).
    let running = 0;
    return buckets.map((b) => {
      running += invs
        .filter(
          (i) =>
            i.kind === "vente" &&
            new Date(i.issueDate).getTime() >= b.start &&
            new Date(i.issueDate).getTime() < b.end,
        )
        .reduce((s, i) => s + i.totalTTC, 0);
      return { label: b.label, value: running };
    });
  }
  if (metric === "encaissements") {
    return buckets.map((b) => ({
      label: b.label,
      value: sumTx(b.start, b.end, (x) => (x.type === "revenu" ? x.amount : 0)),
    }));
  }
  if (metric === "depenses") {
    return buckets.map((b) => ({
      label: b.label,
      value: sumTx(b.start, b.end, (x) => (x.type === "depense" ? x.amount : 0)),
    }));
  }
  // tresorerie → per-period net flow (the treasury variation each bucket).
  return buckets.map((b) => ({
    label: b.label,
    value: sumTx(b.start, b.end, (x) => (x.type === "revenu" ? x.amount : -x.amount)),
  }));
}
