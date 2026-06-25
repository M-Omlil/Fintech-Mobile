import React, { useEffect, useMemo, useState } from "react";
import { Animated, Easing, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, G, Path, Polyline, Rect } from "react-native-svg";

import { AmountText, Text } from "@components/index";
import { makeStyles, useTheme } from "@theme/index";

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ChartType = "line" | "bar" | "pie";
export type ChartPoint = { label: string; value: number };
export type ChartSeries = { key: string; color: string; data: ChartPoint[] };

export type CustomChartProps = {
  type: ChartType;
  /** One or more series sharing the same x labels (line/bar overlay them; pie uses the first). */
  series: ChartSeries[];
  height?: number;
};

const DRAW_MS = 850;
const STAGGER_MS = 140;
const PAD_X = 6;
const PAD_TOP = 12;

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

/** One progress value per series, restarted (staggered) whenever the data/type changes. */
function useReveal(count: number, signature: string): Animated.Value[] {
  const anims = useMemo(() => Array.from({ length: count }, () => new Animated.Value(0)), [count]);
  useEffect(() => {
    anims.forEach((a) => a.setValue(0));
    Animated.stagger(
      STAGGER_MS,
      anims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: DRAW_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [anims, signature]);
  return anims;
}

/**
 * Multi-series chart that renders as lines, grouped bars, or a pie/donut, driven by `type`
 * (Tableau de bord). Each series draws on with a staggered reveal (line draws, bars grow,
 * pie scales in). Pure react-native-svg so it themes with tokens.
 */
export function CustomChart({ type, series, height = 180 }: CustomChartProps) {
  const theme = useTheme();
  const styles = useStyles();
  const palette = usePalette();
  const [width, setWidth] = useState(0);

  const signature = `${type}|${series.map((s) => `${s.key}:${s.data.map((d) => d.value).join(",")}`).join("|")}`;
  const anims = useReveal(series.length, signature);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const labels = series[0]?.data ?? [];
  const isEmpty = series.length === 0 || labels.length === 0;

  if (isEmpty) {
    return (
      <View style={[styles.empty, { height }]} onLayout={onLayout}>
        <Text variant="bodyMd" color="textSecondary">
          —
        </Text>
      </View>
    );
  }

  if (type === "pie") {
    const first = series[0]!;
    return (
      <Pie
        data={first.data}
        height={height}
        palette={palette}
        onLayout={onLayout}
        progress={anims[0]!}
      />
    );
  }

  // Line / bar share the plot maths; the scale spans every series.
  const n = labels.length;
  const innerW = Math.max(1, width - PAD_X * 2);
  const innerH = height - PAD_TOP;
  const all = series.flatMap((s) => s.data.map((d) => d.value));
  const max = Math.max(1, ...all);
  const min = Math.min(0, ...all);
  const span = max - min || 1;
  const x = (i: number) => PAD_X + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => PAD_TOP + innerH - ((v - min) / span) * innerH;

  const groupW = (innerW / n) * 0.7;
  const barW = Math.max(3, groupW / series.length);

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Path
            d={`M ${PAD_X} ${y(min)} L ${width - PAD_X} ${y(min)}`}
            stroke={theme.colors.border}
            strokeWidth={1}
          />
          {series.map((s, si) => {
            const progress = anims[si]!;
            if (type === "line") {
              const pts = s.data.map((d, i) => [x(i), y(d.value)] as [number, number]);
              let len = 1;
              for (let i = 1; i < pts.length; i += 1) {
                len += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
              }
              const last = pts[pts.length - 1];
              return (
                <G key={s.key}>
                  <AnimatedPath
                    d={`M ${pts[0]![0]} ${pts[0]![1]} ${pts
                      .map((p) => `L ${p[0]} ${p[1]}`)
                      .join(" ")} L ${x(n - 1)} ${y(min)} L ${x(0)} ${y(min)} Z`}
                    fill={s.color}
                    fillOpacity={progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.1],
                    })}
                  />
                  <AnimatedPolyline
                    points={pts.map((p) => `${p[0]},${p[1]}`).join(" ")}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={len}
                    strokeDashoffset={progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [len, 0],
                    })}
                  />
                  {last ? (
                    <AnimatedCircle
                      cx={last[0]}
                      cy={last[1]}
                      r={3.5}
                      fill={s.color}
                      opacity={progress.interpolate({ inputRange: [0.7, 1], outputRange: [0, 1] })}
                    />
                  ) : null}
                </G>
              );
            }
            // Grouped bars.
            return (
              <G key={s.key}>
                {s.data.map((d, i) => {
                  const bx = x(i) - groupW / 2 + si * barW;
                  const top = y(Math.max(0, d.value));
                  const full = Math.max(2, Math.abs(y(d.value) - y(0)));
                  return (
                    <AnimatedRect
                      key={d.label + i}
                      x={bx}
                      y={progress.interpolate({ inputRange: [0, 1], outputRange: [y(0), top] })}
                      width={barW * 0.9}
                      height={progress.interpolate({ inputRange: [0, 1], outputRange: [0, full] })}
                      rx={3}
                      fill={s.color}
                    />
                  );
                })}
              </G>
            );
          })}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      <View style={styles.xLabels}>
        {labels.map((d, i) =>
          i % Math.ceil(n / 6) === 0 || i === n - 1 ? (
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
  progress: Animated.Value;
};

function Pie({ data, height, palette, onLayout, progress }: PieProps) {
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
        <AnimatedG
          opacity={progress}
          scale={progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] })}
          origin={`${cx}, ${cy}`}
        >
          {slices.map((s, i) => (
            <Path key={s.d.label + i} d={arcPath(cx, cy, r, rInner, s.a0, s.a1)} fill={s.color} />
          ))}
        </AnimatedG>
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
