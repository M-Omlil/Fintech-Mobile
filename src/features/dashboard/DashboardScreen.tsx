import { ChartColumnBig, ChartLine, ChartPie, type LucideIcon } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { AmountText, Card, Screen, ScreenHeader, Text } from "@components/index";
import type { Invoice, Transaction } from "@domain/index";
import { useAccounts, useInvoices, useTotalAssets, useTransactions } from "@hooks/index";
import { makeStyles, useTheme } from "@theme/index";
import type { ThemeColors } from "@theme/theme";

import { CustomChart, type ChartType } from "./components/CustomChart";

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

type MetricKey = "ca" | "encaissements" | "depenses" | "tresorerie";
type DurationKey = "7j" | "30j" | "6m" | "12m";

const METRIC_COLOR: Record<MetricKey, keyof ThemeColors> = {
  ca: "accent",
  encaissements: "success",
  depenses: "danger",
  tresorerie: "primary",
};

/** Chart type cycles through these on each tap of the single toggle button. */
const CHART_TYPES: ChartType[] = ["line", "bar", "pie"];
const TYPE_ICON: Record<ChartType, LucideIcon> = {
  line: ChartLine,
  bar: ChartColumnBig,
  pie: ChartPie,
};

const DURATIONS: { key: DurationKey; unit: "day" | "month"; count: number }[] = [
  { key: "7j", unit: "day", count: 7 },
  { key: "30j", unit: "day", count: 30 },
  { key: "6m", unit: "month", count: 6 },
  { key: "12m", unit: "month", count: 12 },
];

const vatOf = (inv: Invoice): number => inv.totalTTC - inv.totalHT;

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Time buckets (day or month) ending today, oldest first. */
function buildBuckets(now: Date, unit: "day" | "month", count: number) {
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

/** Tableau de bord — 4 KPIs + one fully customisable chart (type/metric/duration). */
export function DashboardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();

  const { data: transactions } = useTransactions();
  const { data: invoices } = useInvoices();
  const { data: accounts } = useAccounts();
  const { data: totalAssets } = useTotalAssets();

  const [chartType, setChartType] = useState<ChartType>("line");
  const [metric, setMetric] = useState<MetricKey>("ca");
  const [duration, setDuration] = useState<DurationKey>("30j");

  const cycleChartType = () =>
    setChartType(
      (prev) => CHART_TYPES[(CHART_TYPES.indexOf(prev) + 1) % CHART_TYPES.length] ?? "line",
    );

  const kpis = useMemo(() => {
    const txns = transactions ?? [];
    const invs = invoices ?? [];
    const now = new Date();
    const mainBalance = (accounts ?? []).find((a) => a.isMain)?.balance ?? 0;

    const thisMonth = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    };
    // TVA is declared per trimester in Morocco → group by calendar quarter.
    const quarter = Math.floor(now.getMonth() / 3);
    const thisQuarter = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === quarter;
    };
    const since30 = now.getTime() - 30 * 24 * 3600 * 1000;
    const within30 = (iso: string) => new Date(iso).getTime() >= since30;

    const net30 = txns
      .filter((tx) => within30(tx.date))
      .reduce((s, tx) => s + (tx.type === "revenu" ? tx.amount : -tx.amount), 0);

    const caMonth = invs
      .filter((inv) => inv.kind === "vente" && thisMonth(inv.issueDate))
      .reduce((s, inv) => s + inv.totalTTC, 0);

    const tvaCollected = invs
      .filter((inv) => inv.kind === "vente" && thisQuarter(inv.issueDate))
      .reduce((s, inv) => s + vatOf(inv), 0);
    const tvaDeductible = invs
      .filter((inv) => inv.kind === "achat" && thisQuarter(inv.issueDate))
      .reduce((s, inv) => s + vatOf(inv), 0);

    return {
      soldeDispo: mainBalance,
      treasury30: net30,
      caMonth,
      tvaDue: tvaCollected - tvaDeductible,
      totalAssets: totalAssets ?? 0,
    };
  }, [transactions, invoices, accounts, totalAssets]);

  const chartData = useMemo(() => {
    const txns = transactions ?? [];
    const invs = invoices ?? [];
    const now = new Date();
    const cfg = DURATIONS.find((d) => d.key === duration) ?? DURATIONS[1]!;

    // Pie → distribution across the window; line/bar → time series.
    if (chartType === "pie") {
      const windowStart =
        cfg.unit === "day"
          ? now.getTime() - cfg.count * 24 * 3600 * 1000
          : new Date(now.getFullYear(), now.getMonth() - cfg.count + 1, 1).getTime();
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
        const entrees = txns
          .filter((x) => x.type === "revenu" && inWindow(x.date))
          .reduce((s, x) => s + x.amount, 0);
        const sorties = txns
          .filter((x) => x.type === "depense" && inWindow(x.date))
          .reduce((s, x) => s + x.amount, 0);
        group[t("dashboard.inflows")] = entrees;
        group[t("dashboard.outflows")] = sorties;
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

    const buckets = buildBuckets(now, cfg.unit, cfg.count);
    const sumIn = (start: number, end: number, pick: (x: Transaction) => number) =>
      txns
        .filter(
          (x) => x.date && new Date(x.date).getTime() >= start && new Date(x.date).getTime() < end,
        )
        .reduce((s, x) => s + pick(x), 0);

    if (metric === "ca") {
      return buckets.map((b) => ({
        label: b.label,
        value: invs
          .filter(
            (i) =>
              i.kind === "vente" &&
              new Date(i.issueDate).getTime() >= b.start &&
              new Date(i.issueDate).getTime() < b.end,
          )
          .reduce((s, i) => s + i.totalTTC, 0),
      }));
    }
    if (metric === "encaissements") {
      return buckets.map((b) => ({
        label: b.label,
        value: sumIn(b.start, b.end, (x) => (x.type === "revenu" ? x.amount : 0)),
      }));
    }
    if (metric === "depenses") {
      return buckets.map((b) => ({
        label: b.label,
        value: sumIn(b.start, b.end, (x) => (x.type === "depense" ? x.amount : 0)),
      }));
    }
    // tresorerie → cumulative net flow across the window.
    let running = 0;
    return buckets.map((b) => {
      running += sumIn(b.start, b.end, (x) => (x.type === "revenu" ? x.amount : -x.amount));
      return { label: b.label, value: running };
    });
  }, [transactions, invoices, chartType, metric, duration, t]);

  const tk = t as unknown as (key: string) => string;

  const kpi = (
    label: string,
    value: number,
    caption: string,
    color: keyof ThemeColors,
    signed?: boolean,
  ) => (
    <Card variant="surface" style={styles.kpiCard}>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
      <AmountText value={value} signed={signed} variant="titleLg" color={color} />
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {caption}
      </Text>
    </Card>
  );

  const METRICS: MetricKey[] = ["ca", "encaissements", "depenses", "tresorerie"];
  const TypeIcon = TYPE_ICON[chartType];

  return (
    <Screen>
      <ScreenHeader title={t("dashboard.title")} />

      <View style={styles.kpiGrid}>
        <View style={styles.kpiRow}>
          {kpi(
            t("dashboard.kpi.solde"),
            kpis.soldeDispo,
            t("dashboard.kpi.soldeSub"),
            "textPrimary",
          )}
          {kpi(
            t("dashboard.kpi.treasury"),
            kpis.treasury30,
            t("dashboard.kpi.treasurySub"),
            "primary",
            true,
          )}
        </View>
        <View style={styles.kpiRow}>
          {kpi(t("dashboard.kpi.ca"), kpis.caMonth, t("dashboard.kpi.caSub"), "success")}
          {kpi(t("dashboard.kpi.tva"), kpis.tvaDue, t("dashboard.kpi.tvaSub"), "danger")}
        </View>
      </View>

      <Card variant="surface" style={styles.chartCard}>
        <View style={styles.chartHead}>
          <Text variant="titleMd" color="textPrimary">
            {tk(`dashboard.metric.${metric}`)}
          </Text>
          <Pressable
            onPress={cycleChartType}
            accessibilityRole="button"
            accessibilityLabel={t("dashboard.chartTypeToggle")}
            style={({ pressed }) => [styles.typeToggle, pressed && styles.pressed]}
          >
            <TypeIcon size={16} color={theme.colors.accent} strokeWidth={2} />
            <Text variant="label" color="accent">
              {tk(`dashboard.chartType.${chartType}`)}
            </Text>
          </Pressable>
        </View>

        <View style={styles.chips}>
          {METRICS.map((m) => {
            const active = metric === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMetric(m)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="label" color={active ? "textOnPrimary" : "textSecondary"}>
                  {tk(`dashboard.metric.${m}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <CustomChart type={chartType} data={chartData} color={theme.colors[METRIC_COLOR[metric]]} />

        {chartType !== "pie" ? (
          <View style={styles.chips}>
            {DURATIONS.map((d) => {
              const active = duration === d.key;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => setDuration(d.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.durChip,
                    active && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text variant="label" color={active ? "textOnPrimary" : "textSecondary"}>
                    {tk(`dashboard.duration.${d.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  kpiGrid: { gap: t.spacing.sm, marginTop: t.spacing.md },
  kpiRow: { flexDirection: "row", gap: t.spacing.sm },
  kpiCard: { flex: 1, gap: t.spacing.xs },
  chartCard: { gap: t.spacing.md, marginTop: t.spacing.lg },
  chartHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.spacing.sm,
  },
  typeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surfaceAccent,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm },
  chip: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surfaceMuted,
  },
  durChip: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surfaceMuted,
  },
  chipActive: { backgroundColor: t.colors.primary },
  pressed: { opacity: 0.6 },
}));
