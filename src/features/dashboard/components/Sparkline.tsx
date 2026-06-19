import React from "react";
import Svg, { Polyline } from "react-native-svg";

export type SparklineProps = {
  data: number[];
  color: string;
  width?: number;
  height?: number;
};

/**
 * Tiny line chart for a metric trend (per reference — the small card lines are real
 * charts). Normalizes the series to fit; a flat series renders a centered line.
 */
export function Sparkline({ data, color, width = 56, height = 24 }: SparklineProps) {
  if (data.length < 2) {
    return (
      <Svg width={width} height={height}>
        <Polyline
          points={`0,${height / 2} ${width},${height / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;
  const stepX = width / (data.length - 1);

  const points = data
    .map((value, i) => {
      const x = i * stepX;
      const y = pad + (1 - (value - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
