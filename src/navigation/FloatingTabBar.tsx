import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  ChartColumnBig,
  House,
  LayoutGrid,
  ReceiptText,
  type LucideIcon,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
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
    backgroundColor: t.colors.surfaceDark,
    borderWidth: t.sizing.hairline,
    borderColor: t.colors.cardBorder,
    paddingHorizontal: t.spacing.sm,
    shadowColor: t.colors.glow,
    ...t.elevation.tabBar,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
}));
