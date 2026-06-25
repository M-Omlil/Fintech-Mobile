import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import {
  ChartColumnBig,
  House,
  LayoutGrid,
  ReceiptText,
  type LucideIcon,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@components/index";
import { makeStyles, useTheme } from "@theme/index";

import type { TabParamList } from "./types";

const TAB_ICONS: Record<keyof TabParamList, LucideIcon> = {
  Home: House,
  Facturation: ReceiptText,
  Dashboard: ChartColumnBig,
  Menu: LayoutGrid,
};

type TabBarItemProps = {
  focused: boolean;
  icon: LucideIcon;
  label: string;
  color: string;
  onPress: () => void;
};

/** A single animated tab — lifts and scales the icon when focused. */
function TabBarItem({ focused, icon: Icon, label, color, onPress }: TabBarItemProps) {
  const styles = useStyles();
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      stiffness: 220,
      damping: 16,
      mass: 0.6,
    }).start();
  }, [focused, anim]);

  const iconStyle = {
    transform: [
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
    ],
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={styles.item}
    >
      <Animated.View style={iconStyle}>
        <Icon size={22} color={color} strokeWidth={focused ? 2.2 : 1.75} />
      </Animated.View>
      <Text variant="caption" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Floating pill tab bar (Section 6.1). Active item uses the accent color and lifts;
 * inactive uses steel gray.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + theme.spacing.sm }]}
    >
      <View style={styles.pill}>
        {/* Frosted glass: blur the scrolling content, then a strong navy tint so the
            bar reads solid (no bleed-through) even where Android blur is weak. */}
        <BlurView
          intensity={theme.scheme === "dark" ? 90 : 95}
          tint={theme.scheme === "dark" ? "dark" : "light"}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.tint]} pointerEvents="none" />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key] ?? {};
          const label = typeof options?.tabBarLabel === "string" ? options.tabBarLabel : route.name;
          const icon = TAB_ICONS[route.name as keyof TabParamList] ?? House;
          const color = focused ? theme.colors.accent : theme.colors.textSecondary;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TabBarItem
              key={route.key}
              focused={focused}
              icon={icon}
              label={label}
              color={color}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrapper: { position: "absolute", left: t.spacing.lg, right: t.spacing.lg, alignItems: "center" },
  pill: {
    flexDirection: "row",
    width: "100%",
    height: t.sizing.tabBarHeight,
    borderRadius: t.radii.pill,
    overflow: "hidden",
    borderWidth: t.sizing.hairline,
    borderColor: t.scheme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(39,171,252,0.22)",
    paddingHorizontal: t.spacing.sm,
    shadowColor: t.colors.glow,
    ...t.elevation.tabBar,
  },
  // Light wash over the blur — kept low so the frosted blur clearly reads; the strong
  // blur smear is what hides scrolling content (not this tint).
  tint: {
    backgroundColor: t.scheme === "dark" ? "rgba(9,12,38,0.30)" : "rgba(247,250,253,0.40)",
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
}));
