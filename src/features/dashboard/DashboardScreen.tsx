import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { AnimatedAmount, Card, FadeSlideIn, Screen, ScreenHeader, Text } from "@components/index";
import type { Invoice } from "@domain/index";
import { useAccounts, useInvoices, useTransactions } from "@hooks/index";
import { makeStyles } from "@theme/index";
import type { ThemeColors } from "@theme/theme";

import { MetricGraph, type GraphMetric } from "./components/MetricGraph";
import { buildBuckets, DURATION_KEYS, periodConfig, type DurationKey } from "./dashboardData";

const vatOf = (inv: Invoice): number => inv.totalTTC - inv.totalHT;

/**
 * Tableau de bord. A static summary row (Solde dispo · Prélèvement TVA), a single period
 * filter that drives everything below it, two filterable card rows, and two graphs — each
 * graph shows one metric at a time with its own stat + line/bar/pie toggle.
 */
export function DashboardScreen() {
  const { t } = useTranslation();
  const styles = useStyles();

  const { data: transactions } = useTransactions();
  const { data: invoices } = useInvoices();
  const { data: accounts } = useAccounts();

  const [duration, setDuration] = useState<DurationKey>("ytd");

  const txns = useMemo(() => transactions ?? [], [transactions]);
  const invs = useMemo(() => invoices ?? [], [invoices]);

  const model = useMemo(() => {
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
    const start = buckets[0]?.start ?? 0;
    const end = buckets[buckets.length - 1]?.end ?? now.getTime();
    const inRange = (iso: string) => {
      const ts = new Date(iso).getTime();
      return ts >= start && ts < end;
    };

    const caTotal = invs
      .filter((i) => i.kind === "vente" && inRange(i.issueDate))
      .reduce((s, i) => s + i.totalTTC, 0);
    const encTotal = txns
      .filter((x) => x.type === "revenu" && inRange(x.date))
      .reduce((s, x) => s + x.amount, 0);
    const depTotal = txns
      .filter((x) => x.type === "depense" && inRange(x.date))
      .reduce((s, x) => s + x.amount, 0);

    return {
      soldeDispo: mainBalance,
      tvaPrelevement: tvaCollected - tvaDeductible,
      caTotal,
      treTotal: encTotal - depTotal,
      encTotal,
      depTotal,
    };
  }, [txns, invs, accounts, duration]);

  const stat = (label: string, value: number, color: keyof ThemeColors, signed?: boolean) => (
    <Card variant="surface" style={styles.card}>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
      <AnimatedAmount value={value} signed={signed} variant="titleLg" color={color} />
    </Card>
  );

  const revenueMetrics: GraphMetric[] = [
    { key: "ca", label: t("dashboard.metric.ca"), color: "accent", total: model.caTotal },
    {
      key: "tresorerie",
      label: t("dashboard.metric.tresorerie"),
      color: "textPrimary",
      total: model.treTotal,
      signed: true,
    },
  ];
  const flowMetrics: GraphMetric[] = [
    {
      key: "encaissements",
      label: t("dashboard.metric.encaissements"),
      color: "success",
      total: model.encTotal,
    },
    {
      key: "depenses",
      label: t("dashboard.metric.depenses"),
      color: "danger",
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

      {/* Global period filter — drives the cards and both graphs */}
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

      {/* Graphs — one metric at a time, each with its own stat + line/bar/pie toggle */}
      <FadeSlideIn index={4}>
        <MetricGraph
          title={t("dashboard.graph.revenue")}
          metrics={revenueMetrics}
          duration={duration}
          transactions={txns}
          invoices={invs}
        />
      </FadeSlideIn>
      <FadeSlideIn index={5}>
        <MetricGraph
          title={t("dashboard.graph.flows")}
          metrics={flowMetrics}
          duration={duration}
          transactions={txns}
          invoices={invs}
        />
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
  pressed: { opacity: 0.6 },
}));
