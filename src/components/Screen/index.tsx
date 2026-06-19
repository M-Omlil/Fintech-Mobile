import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { makeStyles, useTheme } from "@theme/index";

export type ScreenProps = {
  children: React.ReactNode;
  /** Scroll the content (default) or render a fixed flex container. */
  scroll?: boolean;
  /** Horizontal screen padding (default true). */
  padded?: boolean;
  /** Reserve bottom space so content clears the floating tab bar (default true). */
  tabBarClearance?: boolean;
  /** Play a subtle entrance animation on mount (default true). */
  animated?: boolean;
  edges?: readonly Edge[];
  contentStyle?: ViewStyle;
};

/**
 * Screen scaffold — fogWhite background, safe-area top, consistent horizontal
 * padding, clearance for the floating tab bar, and a subtle fade/slide entrance.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  tabBarClearance = true,
  animated = true,
  edges = ["top"],
  contentStyle,
}: ScreenProps) {
  const theme = useTheme();
  const styles = useStyles();

  const progress = useRef(new Animated.Value(animated ? 0 : 1)).current;
  useEffect(() => {
    if (!animated) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: theme.durations.base,
      useNativeDriver: true,
    }).start();
  }, [animated, progress, theme.durations.base]);

  const entrance = {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  };

  const padding: ViewStyle = {
    paddingHorizontal: padded ? theme.spacing.lg : 0,
    paddingBottom: tabBarClearance ? theme.sizing.tabBarClearance : theme.spacing.lg,
  };

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <Animated.View style={[styles.flex, entrance]}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[padding, contentStyle]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, padding, contentStyle]}>{children}</View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
}));
