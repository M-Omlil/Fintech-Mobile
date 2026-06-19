import { useNavigation } from "@react-navigation/native";
import { Settings } from "lucide-react-native";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AmountText,
  Card,
  IconButton,
  Screen,
  ScreenHeader,
  SectionHeader,
  Text,
  useToast,
} from "@components/index";
import { useInvoices, useTotalAssets, useTransactions } from "@hooks/index";
import { makeStyles, useTheme } from "@theme/index";
import type { ThemeColors } from "@theme/theme";

import { BarChart, type BarDatum } from "./components/BarChart";
import { Sparkline } from "./components/Sparkline";

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

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/** Tableau de bord — flows, monthly cash chart, and revenue by source (per reference). */
export function DashboardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation();
  const toast = useToast();

  const { data: transactions } = useTransactions();
  const { data: invoices } = useInvoices();
  const { data: totalAssets } = useTotalAssets();

  const {
    inflows,
    outflows,
    variation,
    months,
    sources,
    inflowsSeries,
    outflowsSeries,
    variationSeries,
    balanceSeries,
  } = useMemo(() => {
    const txns = transactions ?? [];
    const now = new Date();
    const thisKey = monthKey(now);
    const inThisMonth = (iso: string) => monthKey(new Date(iso)) === thisKey;

    const inAmt = txns
      .filter((tx) => tx.type === "revenu" && inThisMonth(tx.date))
      .reduce((s, tx) => s + tx.amount, 0);
    const outAmt = txns
      .filter((tx) => tx.type === "depense" && inThisMonth(tx.date))
      .reduce((s, tx) => s + tx.amount, 0);

    // Last 6 months series.
    const series: BarDatum[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const monthTx = txns.filter((tx) => monthKey(new Date(tx.date)) === key);
      series.push({
        label: MONTHS_SHORT[d.getMonth()] ?? "",
        inflows: monthTx.filter((tx) => tx.type === "revenu").reduce((s, tx) => s + tx.amount, 0),
        outflows: monthTx.filter((tx) => tx.type === "depense").reduce((s, tx) => s + tx.amount, 0),
      });
    }

    // Revenue by source (this month): credit transactions + paid invoices.
    const grouped: Record<string, number> = {};
    txns
      .filter((tx) => tx.type === "revenu" && inThisMonth(tx.date))
      .forEach((tx) => {
        const key = tx.counterparty || tx.label;
        grouped[key] = (grouped[key] ?? 0) + tx.amount;
      });
    (invoices ?? [])
      .filter((inv) => inv.status === "payee" && inThisMonth(inv.issueDate))
      .forEach((inv) => {
        const key = inv.clientName ?? inv.number;
        grouped[key] = (grouped[key] ?? 0) + inv.totalTTC;
      });
    const sourceList = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, amount]) => ({ label, amount }));

    // Per-metric 6-month trend series for the sparklines.
    const inTrend = series.map((s) => s.inflows);
    const outTrend = series.map((s) => s.outflows);
    const varTrend = series.map((s) => s.inflows - s.outflows);
    const total = totalAssets ?? 0;
    const balTrend: number[] = new Array(series.length).fill(0);
    let running = total;
    for (let i = series.length - 1; i >= 0; i -= 1) {
      balTrend[i] = running;
      running -= varTrend[i] ?? 0;
    }

    return {
      inflows: inAmt,
      outflows: outAmt,
      variation: inAmt - outAmt,
      months: series,
      sources: sourceList,
      inflowsSeries: inTrend,
      outflowsSeries: outTrend,
      variationSeries: varTrend,
      balanceSeries: balTrend,
    };
  }, [transactions, invoices, totalAssets]);

  const metric = (
    label: string,
    subtitle: string,
    value: number,
    accent: keyof ThemeColors,
    series: number[],
    signed?: boolean,
  ) => (
    <Card variant="surface" style={styles.metricCard}>
      <View style={styles.metricLeft}>
        <Text variant="titleMd" color="textPrimary">
          {label}
        </Text>
        <Text variant="caption" color="textSecondary">
          {subtitle}
        </Text>
      </View>
      <Sparkline data={series} color={theme.colors[accent]} />
      <AmountText value={value} signed={signed} variant="titleMd" />
    </Card>
  );

  const monthlySub = `${t("dashboard.monthlyCumul")} · ${t("dashboard.allAccounts")}`;

  return (
    <Screen>
      <ScreenHeader
        title={t("dashboard.title")}
        onBack={() => navigation.goBack()}
        rightActions={
          <IconButton
            icon={Settings}
            variant="surface"
            size={40}
            label={t("common.settings")}
            onPress={() => toast.show(t("common.settingsToast"), "info")}
          />
        }
      />

      <View style={styles.metrics}>
        {metric(
          t("dashboard.balance"),
          `${t("dashboard.today")} · ${t("dashboard.allAccounts")}`,
          totalAssets ?? 0,
          "accent",
          balanceSeries,
        )}
        {metric(t("dashboard.inflows"), monthlySub, inflows, "success", inflowsSeries)}
        {metric(t("dashboard.outflows"), monthlySub, outflows, "danger", outflowsSeries)}
        {metric(
          t("dashboard.treasuryVariation"),
          monthlySub,
          variation,
          "primary",
          variationSeries,
          true,
        )}
      </View>

      <Card variant="surface" style={styles.chartCard}>
        <View style={styles.chartHead}>
          <Text variant="titleMd" color="textPrimary">
            {t("dashboard.fluxTitle")}
          </Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
              <Text variant="caption" color="textSecondary">
                {t("dashboard.inflows")}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: theme.colors.danger }]} />
              <Text variant="caption" color="textSecondary">
                {t("dashboard.outflows")}
              </Text>
            </View>
          </View>
        </View>
        <BarChart data={months} />
      </Card>

      <View style={styles.sources}>
        <SectionHeader title={t("dashboard.bySource")} />
        <Card variant="surface" style={styles.sourcesCard}>
          {sources.length > 0 ? (
            sources.map((source) => (
              <View key={source.label} style={styles.sourceRow}>
                <Text
                  variant="bodyLg"
                  color="textPrimary"
                  numberOfLines={1}
                  style={styles.sourceLabel}
                >
                  {source.label}
                </Text>
                <AmountText value={source.amount} signed variant="titleMd" color="success" />
              </View>
            ))
          ) : (
            <Text variant="bodyMd" color="textSecondary">
              {t("dashboard.noData")}
            </Text>
          )}
        </Card>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  metrics: { gap: t.spacing.sm, marginTop: t.spacing.md },
  metricCard: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  metricLeft: { flex: 1, gap: 2 },
  chartCard: { gap: t.spacing.lg, marginTop: t.spacing.lg },
  chartHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  legend: { flexDirection: "row", gap: t.spacing.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: t.spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sources: { gap: t.spacing.xs, marginTop: t.spacing.lg },
  sourcesCard: { gap: t.spacing.md },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.spacing.sm,
  },
  sourceLabel: { flex: 1 },
}));
