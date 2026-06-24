import React, { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";

import { useTheme } from "@theme/index";

export type FadeSlideInProps = {
  children: React.ReactNode;
  /** Position in a list — staggers the entrance (capped so long lists stay snappy). */
  index?: number;
  /** Travel distance in px for the upward slide (default 12). */
  offset?: number;
  style?: ViewStyle;
};

/**
 * Subtle Apple-style entrance: fade + short upward slide, staggered by `index`. Wrap list
 * rows / cards so screens settle in rather than snapping. Native-driven, so it's cheap.
 */
export function FadeSlideIn({ children, index = 0, offset = 12, style }: FadeSlideInProps) {
  const theme = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: theme.durations.base,
      delay: Math.min(index, 8) * 55,
      useNativeDriver: true,
    }).start();
  }, [progress, index, theme.durations.base]);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
