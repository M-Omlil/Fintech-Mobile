import React, { useEffect, useMemo, useState } from "react";
import { Animated, Easing, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";

import { AnimatedAmount, Text } from "@components/index";
import { makeStyles, useTheme } from "@theme/index";

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type TrendSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
  /** Headline figure shown in the legend (counts up). Decoupled from `values` because a
   * cumulative series' total is its last point, not the sum of points. */
  total: number;
  /** Render the legend total with a +/- sign (e.g. trésorerie). */
  signed?: boolean;
};

export type TrendChartProps = {
  series: TrendSeries[];
  labels: string[];
  height?: number;
};

const PAD_X = 6;
const PAD_TOP = 14;
const DRAW_MS = 900;
const STAGGER_MS = 160;

function lengthOf(points: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return Math.max(1, total);
}

/**
 * Animated multi-series line chart (Tableau de bord). Each line draws on with a staggered
 * stroke reveal, its area fades in, and the legend value counts up — the dashboard's "wow"
 * entrance. Re-animates whenever the data changes (e.g. a period-filter switch). Pure
 * react-native-svg so it themes with tokens.
 */
export function TrendChart({ series, labels, height = 180 }: TrendChartProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [width, setWidth] = useState(0);

  // One progress value per series (stable while the series count is stable).
  const anims = useMemo(
    () => series.map(() => new Animated.Value(0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series.length],
  );

  const signature = series.map((s) => s.values.join(",")).join("|");
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

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const n = labels.length;
  const innerW = Math.max(1, width - PAD_X * 2);
  const innerH = height - PAD_TOP;
  const all = series.flatMap((s) => s.values);
  const max = Math.max(1, ...all);
  const min = Math.min(0, ...all);
  const span = max - min || 1;
  const x = (i: number) => PAD_X + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => PAD_TOP + innerH - ((v - min) / span) * innerH;

  return (
    <View>
      <View onLayout={onLayout}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Path
              d={`M ${PAD_X} ${y(min)} L ${width - PAD_X} ${y(min)}`}
              stroke={theme.colors.border}
              strokeWidth={1}
            />
            {series.map((s, si) => {
              const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
              const len = lengthOf(pts);
              const progress = anims[si]!;
              const last = pts[pts.length - 1];
              const areaD =
                `M ${pts[0]?.[0] ?? PAD_X} ${pts[0]?.[1] ?? y(min)} ` +
                pts.map((p) => `L ${p[0]} ${p[1]}`).join(" ") +
                ` L ${x(n - 1)} ${y(min)} L ${x(0)} ${y(min)} Z`;
              return (
                <React.Fragment key={s.key}>
                  <AnimatedPath
                    d={areaD}
                    fill={s.color}
                    fillOpacity={progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.12],
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
                </React.Fragment>
              );
            })}
          </Svg>
        ) : (
          <View style={{ height }} />
        )}

        <View style={styles.xLabels}>
          {labels.map((label, i) =>
            i % Math.ceil(n / 6) === 0 || i === n - 1 ? (
              <Text key={label + i} variant="caption" color="textSecondary" style={styles.xLabel}>
                {label}
              </Text>
            ) : null,
          )}
        </View>
      </View>

      <View style={styles.legend}>
        {series.map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text variant="caption" color="textSecondary">
              {s.label}
            </Text>
            <AnimatedAmount value={s.total} signed={s.signed} variant="label" />
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  xLabels: { flexDirection: "row", marginTop: t.spacing.xs },
  xLabel: { flex: 1, textAlign: "center" },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.spacing.lg,
    marginTop: t.spacing.sm,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: t.spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
}));
