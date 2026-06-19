import React from "react";
import { View } from "react-native";

import { Text } from "@components/index";
import { makeStyles, useTheme } from "@theme/index";

export type BarDatum = { label: string; inflows: number; outflows: number };

export type BarChartProps = {
  data: BarDatum[];
  height?: number;
};

/**
 * Grouped monthly bar chart (Flux de trésorerie). Pure View-based so it themes with
 * tokens and needs no SVG. Two bars per month: entrées (success) / sorties (danger).
 */
export function BarChart({ data, height = 140 }: BarChartProps) {
  const theme = useTheme();
  const styles = useStyles();

  const max = Math.max(1, ...data.map((d) => Math.max(d.inflows, d.outflows)));

  const barHeight = (value: number) => Math.max(value > 0 ? 4 : 0, (value / max) * height);

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {data.map((datum) => (
          <View key={datum.label} style={styles.column}>
            <View style={styles.bars}>
              <View
                style={[
                  styles.bar,
                  { height: barHeight(datum.inflows), backgroundColor: theme.colors.success },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  { height: barHeight(datum.outflows), backgroundColor: theme.colors.danger },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {data.map((datum) => (
          <Text key={datum.label} variant="caption" color="textSecondary" style={styles.label}>
            {datum.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  plot: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: t.sizing.hairline,
    borderBottomColor: t.colors.border,
  },
  column: { flex: 1, alignItems: "center" },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: "100%" },
  bar: { width: 9, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  labels: { flexDirection: "row", marginTop: t.spacing.xs },
  label: { flex: 1, textAlign: "center" },
}));
