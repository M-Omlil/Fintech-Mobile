import { ChartColumnBig, ChartLine, ChartPie, type LucideIcon } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { AnimatedAmount, Card, Text } from "@components/index";
import type { Invoice, Transaction } from "@domain/index";
import { makeStyles, useTheme } from "@theme/index";
import type { ThemeColors } from "@theme/theme";

import { computeChartData, type DurationKey, type MetricKey } from "../dashboardData";

import { CustomChart, type ChartType } from "./CustomChart";

export type GraphMetric = {
  key: MetricKey;
  label: string;
  color: keyof ThemeColors;
  /** Headline total for the period (counts up). */
  total: number;
  signed?: boolean;
};

export type MetricGraphProps = {
  title: string;
  /** The metrics this graph can switch between (its "stats"). */
  metrics: GraphMetric[];
  /** Global period filter, applied from outside. */
  duration: DurationKey;
  transactions: Transaction[];
  invoices: Invoice[];
};

const CHART_TYPES: ChartType[] = ["line", "bar", "pie"];
const TYPE_ICON: Record<ChartType, LucideIcon> = {
  line: ChartLine,
  bar: ChartColumnBig,
  pie: ChartPie,
};

/**
 * One dashboard graph: a stat (the selected metric's total, counting up), chips to switch
 * between the graph's metrics (one at a time), and a line/bar/pie toggle. The period is
 * supplied from the screen's global filter, not chosen here.
 */
export function MetricGraph({
  title,
  metrics,
  duration,
  transactions,
  invoices,
}: MetricGraphProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const tk = t as unknown as (k: string) => string;

  const [metricKey, setMetricKey] = useState<MetricKey>(metrics[0]!.key);
  const [chartType, setChartType] = useState<ChartType>("line");
  const selected = metrics.find((m) => m.key === metricKey) ?? metrics[0]!;

  const data = useMemo(
    () =>
      computeChartData(metricKey, chartType, duration, transactions, invoices, new Date(), {
        inflows: t("dashboard.inflows"),
        outflows: t("dashboard.outflows"),
      }),
    [metricKey, chartType, duration, transactions, invoices, t],
  );

  const cycleType = () =>
    setChartType((p) => CHART_TYPES[(CHART_TYPES.indexOf(p) + 1) % CHART_TYPES.length] ?? "line");
  const TypeIcon = TYPE_ICON[chartType];

  return (
    <Card variant="surface" style={styles.card}>
      <View style={styles.head}>
        <Text variant="titleMd" color="textPrimary">
          {title}
        </Text>
        <Pressable
          onPress={cycleType}
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

      {/* Stat stays neutral (white on dark); the metric colour lives in the chart line. */}
      <AnimatedAmount
        value={selected.total}
        signed={selected.signed}
        variant="titleLg"
        color="textPrimary"
      />

      <View style={styles.chips}>
        {metrics.map((m) => {
          const active = m.key === metricKey;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMetricKey(m.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text variant="label" color={active ? "textOnPrimary" : "textSecondary"}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <CustomChart type={chartType} data={data} color={theme.colors[selected.color]} />
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: t.spacing.sm, marginTop: t.spacing.lg },
  head: {
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
  chipActive: { backgroundColor: t.colors.primary },
  pressed: { opacity: 0.6 },
}));
