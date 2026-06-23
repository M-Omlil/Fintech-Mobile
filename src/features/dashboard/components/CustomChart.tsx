import React, { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, G, Path, Polyline, Rect } from "react-native-svg";

import { AmountText, Text } from "@components/index";
import { makeStyles, useTheme } from "@theme/index";

export type ChartType = "line" | "bar" | "pie";
export type ChartPoint = { label: string; value: number };

export type CustomChartProps = {
  type: ChartType;
  data: ChartPoint[];
  /** Primary stroke/fill colour (defaults to the accent). */
  color?: string;
  height?: number;
};

/** Pie slice palette — themed tints cycled across categories. */
function usePalette(): string[] {
  const theme = useTheme();
  return [
    theme.colors.accent,
    theme.colors.success,
    theme.colors.primary,
    theme.colors.danger,
    theme.colors.surfaceDark,
    theme.colors.textSecondary,
  ];
}

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  const a = (angle - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** SVG arc path for a donut slice between two angles (degrees). */
function arcPath(
  cx: number,
  cy: number,
  r: number,
  rInner: number,
  a0: number,
  a1: number,
): string {
  const [x0, y0] = polar(cx, cy, r, a1);
  const [x1, y1] = polar(cx, cy, r, a0);
  const [x2, y2] = polar(cx, cy, rInner, a0);
  const [x3, y3] = polar(cx, cy, rInner, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return [
    `M ${x0} ${y0}`,
    `A ${r} ${r} 0 ${large} 0 ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${rInner} ${rInner} 0 ${large} 1 ${x3} ${y3}`,
    "Z",
  ].join(" ");
}

/**
 * A single-series chart that renders as a line, a bar, or a pie/donut, driven entirely
 * by the `type` prop (Tableau de bord — graphique personnalisable). Pure react-native-svg
 * so it themes with tokens. Width is measured from the parent; height is fixed.
 */
export function CustomChart({ type, data, color, height = 180 }: CustomChartProps) {
  const theme = useTheme();
  const styles = useStyles();
  const palette = usePalette();
  const [width, setWidth] = useState(0);
  const stroke = color ?? theme.colors.accent;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]} onLayout={onLayout}>
        <Text variant="bodyMd" color="textSecondary">
          {/* Caller localises the surrounding card; keep a neutral dash here. */}—
        </Text>
      </View>
    );
  }

  if (type === "pie") {
    return <Pie data={data} height={height} palette={palette} onLayout={onLayout} />;
  }

  // Line / bar share the same plot maths.
  const padX = 6;
  const padTop = 12;
  const innerW = Math.max(1, width - padX * 2);
  const innerH = height - padTop;
  const values = data.map((d) => d.value);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const x = (i: number) =>
    padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => padTop + innerH - ((v - min) / span) * innerH;

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {/* baseline */}
          <Path
            d={`M ${padX} ${y(min)} L ${width - padX} ${y(min)}`}
            stroke={theme.colors.border}
            strokeWidth={1}
          />
          {type === "line" ? (
            <G>
              <Path
                d={`M ${x(0)} ${y(values[0] ?? 0)} ${data
                  .map((d, i) => `L ${x(i)} ${y(d.value)}`)
                  .join(" ")} L ${x(data.length - 1)} ${y(min)} L ${x(0)} ${y(min)} Z`}
                fill={stroke}
                fillOpacity={0.12}
              />
              <Polyline
                points={data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ")}
                fill="none"
                stroke={stroke}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {data.map((d, i) => (
                <Circle key={d.label + i} cx={x(i)} cy={y(d.value)} r={3} fill={stroke} />
              ))}
            </G>
          ) : (
            <G>
              {data.map((d, i) => {
                const bw = Math.max(3, (innerW / data.length) * 0.55);
                const bx = x(i) - bw / 2;
                const top = y(Math.max(0, d.value));
                const h = Math.abs(y(d.value) - y(0));
                return (
                  <Rect
                    key={d.label + i}
                    x={bx}
                    y={top}
                    width={bw}
                    height={Math.max(2, h)}
                    rx={3}
                    fill={stroke}
                  />
                );
              })}
            </G>
          )}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      <View style={styles.xLabels}>
        {data.map((d, i) =>
          i % Math.ceil(data.length / 6) === 0 || i === data.length - 1 ? (
            <Text key={d.label + i} variant="caption" color="textSecondary" style={styles.xLabel}>
              {d.label}
            </Text>
          ) : null,
        )}
      </View>
    </View>
  );
}

type PieProps = {
  data: ChartPoint[];
  height: number;
  palette: string[];
  onLayout: (e: LayoutChangeEvent) => void;
};

function Pie({ data, height, palette, onLayout }: PieProps) {
  const styles = useStyles();
  const total = data.reduce((s, d) => s + Math.abs(d.value), 0) || 1;
  const size = height;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const rInner = r * 0.58;

  let angle = 0;
  const slices = data.map((d, i) => {
    const sweep = (Math.abs(d.value) / total) * 360;
    const a0 = angle;
    const a1 = angle + sweep;
    angle = a1;
    return { d, a0, a1, color: palette[i % palette.length] as string };
  });

  return (
    <View style={styles.pieRow} onLayout={onLayout}>
      <Svg width={size} height={size}>
        {slices.map((s, i) => (
          <Path key={s.d.label + i} d={arcPath(cx, cy, r, rInner, s.a0, s.a1)} fill={s.color} />
        ))}
      </Svg>
      <View style={styles.legend}>
        {slices.map((s, i) => (
          <View key={s.d.label + i} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text
              variant="caption"
              color="textSecondary"
              numberOfLines={1}
              style={styles.legendLabel}
            >
              {s.d.label}
            </Text>
            <AmountText value={s.d.value} variant="caption" />
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  empty: { alignItems: "center", justifyContent: "center" },
  xLabels: { flexDirection: "row", marginTop: t.spacing.xs },
  xLabel: { flex: 1, textAlign: "center" },
  pieRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.lg },
  legend: { flex: 1, gap: t.spacing.sm },
  legendRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1 },
}));
