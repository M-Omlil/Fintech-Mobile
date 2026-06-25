import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { AnimatedAmount, Card, FadeSlideIn, Screen, ScreenHeader, Text } from "@components/index";
import type { Invoice, Transaction } from "@domain/index";
import { useAccounts, useInvoices, useTransactions } from "@hooks/index";
import { makeStyles, useTheme } from "@theme/index";
import type { ThemeColors } from "@theme/theme";

import { TrendChart, type TrendSeries } from "./components/TrendChart";

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

type DurationKey = "7j" | "30j" | "6m" | "12m" | "ytd";
const DURATION_KEYS: DurationKey[] = ["7j", "30j", "6m", "12m", "ytd"];

const vatOf = (inv: Invoice): number => inv.totalTTC - inv.totalHT;

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Bucket unit + count for a period. "ytd" = months from January to the current month. */
function periodConfig(now: Date, key: DurationKey): { unit: "day" | "month"; count: number } {
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

/**
 * Tableau de bord. A static summary row (Solde dispo · Prélèvement TVA), a single period
 * filter that drives everything below it, two filterable card rows, and two trend graphs —
 * all with count-up figures and a drawing-on chart reveal.
 */
export function DashboardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();

  const { data: transactions } = useTransactions();
  const { data: invoices } = useInvoices();
  const { data: accounts } = useAccounts();

  const [duration, setDuration] = useState<DurationKey>("ytd");

  const model = useMemo(() => {
    const txns = transactions ?? [];
    const invs = invoices ?? [];
    const now = new Date();
    const mainBalance = (accounts ?? []).find((a) => a.isMain)?.balance ?? 0;

    // TVA is declared per trimester in Morocco → group by calendar quarter.
    const quarter = Math.floor(now.getMonth() / 3);
    const inQuarter = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === quarter;
    };
    const tvaCollected = invs
      .filter((inv) => inv.kind === "vente" && inQuarter(inv.issueDate))
      .reduce((s, inv) => s + vatOf(inv), 0);
    const tvaDeductible = invs
      .filter((inv) => inv.kind === "achat" && inQuarter(inv.issueDate))
      .reduce((s, inv) => s + vatOf(inv), 0);

    const cfg = periodConfig(now, duration);
    const buckets = buildBuckets(now, cfg.unit, cfg.count);
    const labels = buckets.map((b) => b.label);

    const sumTx = (start: number, end: number, pick: (x: Transaction) => number) =>
      txns
        .filter((x) => {
          const ts = x.date ? new Date(x.date).getTime() : NaN;
          return ts >= start && ts < end;
        })
        .reduce((s, x) => s + pick(x), 0);

    const caSeries = buckets.map((b) =>
      invs
        .filter(
          (i) =>
            i.kind === "vente" &&
            new Date(i.issueDate).getTime() >= b.start &&
            new Date(i.issueDate).getTime() < b.end,
        )
        .reduce((s, i) => s + i.totalTTC, 0),
    );
    const encSeries = buckets.map((b) =>
      sumTx(b.start, b.end, (x) => (x.type === "revenu" ? x.amount : 0)),
    );
    const depSeries = buckets.map((b) =>
      sumTx(b.start, b.end, (x) => (x.type === "depense" ? x.amount : 0)),
    );
    let running = 0;
    const treSeries = buckets.map((b) => {
      running += sumTx(b.start, b.end, (x) => (x.type === "revenu" ? x.amount : -x.amount));
      return running;
    });

    const caTotal = caSeries.reduce((a, b) => a + b, 0);
    const encTotal = encSeries.reduce((a, b) => a + b, 0);
    const depTotal = depSeries.reduce((a, b) => a + b, 0);
    const treTotal = treSeries[treSeries.length - 1] ?? 0;

    return {
      soldeDispo: mainBalance,
      tvaPrelevement: tvaCollected - tvaDeductible,
      caTotal,
      treTotal,
      encTotal,
      depTotal,
      labels,
      caSeries,
      treSeries,
      encSeries,
      depSeries,
    };
  }, [transactions, invoices, accounts, duration]);

  const stat = (label: string, value: number, color: keyof ThemeColors, signed?: boolean) => (
    <Card variant="surface" style={styles.card}>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
      <AnimatedAmount value={value} signed={signed} variant="titleLg" color={color} />
    </Card>
  );

  const revenueSeries: TrendSeries[] = [
    {
      key: "ca",
      label: t("dashboard.metric.ca"),
      color: theme.colors.accent,
      values: model.caSeries,
      total: model.caTotal,
    },
    {
      key: "tre",
      label: t("dashboard.metric.tresorerie"),
      color: theme.colors.textPrimary,
      values: model.treSeries,
      total: model.treTotal,
      signed: true,
    },
  ];
  const flowSeries: TrendSeries[] = [
    {
      key: "enc",
      label: t("dashboard.metric.encaissements"),
      color: theme.colors.success,
      values: model.encSeries,
      total: model.encTotal,
    },
    {
      key: "dep",
      label: t("dashboard.metric.depenses"),
      color: theme.colors.danger,
      values: model.depSeries,
      total: model.depTotal,
    },
  ];

  return (
    <Screen>
      <ScreenHeader title={t("dashboard.title")} />

      {/* Static summary */}
      <FadeSlideIn index={0}>
        <View style={styles.row}>
          {stat(t("dashboard.kpi.solde"), model.soldeDispo, "textPrimary")}
          {stat(t("dashboard.prelevementTva"), model.tvaPrelevement, "textPrimary", true)}
        </View>
      </FadeSlideIn>

      {/* Period filter — drives the cards and graphs below */}
      <FadeSlideIn index={1}>
        <View style={styles.filters}>
          {DURATION_KEYS.map((key) => {
            const active = duration === key;
            return (
              <Pressable
                key={key}
                onPress={() => setDuration(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="label" color={active ? "textOnPrimary" : "textSecondary"}>
                  {(t as unknown as (k: string) => string)(`dashboard.duration.${key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FadeSlideIn>

      {/* Filterable cards */}
      <FadeSlideIn index={2}>
        <View style={styles.row}>
          {stat(t("dashboard.metric.ca"), model.caTotal, "accent")}
          {stat(t("dashboard.metric.tresorerie"), model.treTotal, "textPrimary", true)}
        </View>
      </FadeSlideIn>
      <FadeSlideIn index={3}>
        <View style={[styles.row, styles.rowGap]}>
          {stat(t("dashboard.metric.encaissements"), model.encTotal, "success")}
          {stat(t("dashboard.metric.depenses"), model.depTotal, "danger")}
        </View>
      </FadeSlideIn>

      {/* Graphs */}
      <FadeSlideIn index={4}>
        <Card variant="surface" style={styles.chartCard}>
          <Text variant="titleMd" color="textPrimary">
            {t("dashboard.graph.revenue")}
          </Text>
          <TrendChart series={revenueSeries} labels={model.labels} />
        </Card>
      </FadeSlideIn>
      <FadeSlideIn index={5}>
        <Card variant="surface" style={[styles.chartCard, styles.rowGap]}>
          <Text variant="titleMd" color="textPrimary">
            {t("dashboard.graph.flows")}
          </Text>
          <TrendChart series={flowSeries} labels={model.labels} />
        </Card>
      </FadeSlideIn>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: "row", gap: t.spacing.sm, marginTop: t.spacing.md },
  rowGap: { marginTop: t.spacing.sm },
  card: { flex: 1, gap: t.spacing.xs },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.spacing.xs,
    marginTop: t.spacing.lg,
  },
  filterChip: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surfaceMuted,
  },
  filterChipActive: { backgroundColor: t.colors.primary },
  chartCard: { gap: t.spacing.md, marginTop: t.spacing.lg },
  pressed: { opacity: 0.6 },
}));
