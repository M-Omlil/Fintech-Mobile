import React, { useEffect, useRef, useState } from "react";
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

export type CustomChartProps = {
  type: ChartType;
  data: ChartPoint[];
  /** Primary stroke/fill colour (defaults to the accent). */
  color?: string;
  height?: number;
};

const DRAW_MS = 850;

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

/** Progress value (0→1) restarted whenever `signature` changes — drives the entrance. */
function useReveal(signature: string): Animated.Value {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: DRAW_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, signature]);
  return progress;
}

/**
 * Single-series chart that renders as a line, bars, or a pie/donut, driven by `type`
 * (Tableau de bord). Animates on mount and whenever the data/type changes: the line draws
 * on, the bars grow from the baseline, the pie scales in. Pure react-native-svg.
 */
export function CustomChart({ type, data, color, height = 180 }: CustomChartProps) {
  const theme = useTheme();
  const styles = useStyles();
  const palette = usePalette();
  const [width, setWidth] = useState(0);
  const stroke = color ?? theme.colors.accent;
  const signature = `${type}|${data.map((d) => d.value).join(",")}`;
  const progress = useReveal(signature);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]} onLayout={onLayout}>
        <Text variant="bodyMd" color="textSecondary">
          —
        </Text>
      </View>
    );
  }

  if (type === "pie") {
    return (
      <Pie data={data} height={height} palette={palette} onLayout={onLayout} progress={progress} />
    );
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

  const pts = data.map((d, i) => [x(i), y(d.value)] as [number, number]);
  let lineLen = 1;
  for (let i = 1; i < pts.length; i += 1) {
    lineLen += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  }

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Path
            d={`M ${padX} ${y(min)} L ${width - padX} ${y(min)}`}
            stroke={theme.colors.border}
            strokeWidth={1}
          />
          {type === "line" ? (
            <G>
              <AnimatedPath
                d={`M ${pts[0]![0]} ${pts[0]![1]} ${pts
                  .map((p) => `L ${p[0]} ${p[1]}`)
                  .join(" ")} L ${x(data.length - 1)} ${y(min)} L ${x(0)} ${y(min)} Z`}
                fill={stroke}
                fillOpacity={progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] })}
              />
              <AnimatedPolyline
                points={pts.map((p) => `${p[0]},${p[1]}`).join(" ")}
                fill="none"
                stroke={stroke}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={lineLen}
                strokeDashoffset={progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [lineLen, 0],
                })}
              />
              {pts.map((p, i) => (
                <AnimatedCircle
                  key={(data[i]?.label ?? "") + i}
                  cx={p[0]}
                  cy={p[1]}
                  r={3}
                  fill={stroke}
                  opacity={progress.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1] })}
                />
              ))}
            </G>
          ) : (
            <G>
              {data.map((d, i) => {
                const bw = Math.max(3, (innerW / data.length) * 0.55);
                const bx = x(i) - bw / 2;
                const top = y(Math.max(0, d.value));
                const full = Math.max(2, Math.abs(y(d.value) - y(0)));
                return (
                  <AnimatedRect
                    key={d.label + i}
                    x={bx}
                    y={progress.interpolate({ inputRange: [0, 1], outputRange: [y(0), top] })}
                    width={bw}
                    height={progress.interpolate({ inputRange: [0, 1], outputRange: [0, full] })}
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
