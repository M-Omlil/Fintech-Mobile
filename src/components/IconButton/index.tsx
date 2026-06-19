import React, { useRef } from "react";
import { Animated, Pressable, type ViewStyle } from "react-native";

import type { TileIcon } from "@components/IconTile";
import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";

export type IconButtonVariant = "plain" | "surface" | "accent" | "dark";

export type IconButtonProps = {
  icon: TileIcon;
  onPress?: () => void;
  /** Accessible label (required — icon-only control). */
  label: string;
  variant?: IconButtonVariant;
  /** Optional caption shown beneath the circle (card action row). */
  caption?: string;
  size?: number;
  disabled?: boolean;
  /** Play a celebratory scale "pop" on press (e.g. marquer payée). */
  animateOnPress?: boolean;
  style?: ViewStyle;
};

/**
 * Circular icon control (Section 6.4 action row, headers). With a `caption` it
 * renders as a labeled action stack; otherwise a bare round button. Exactly one
 * Pressable per control.
 */
export function IconButton({
  icon: Icon,
  onPress,
  label,
  variant = "surface",
  caption,
  size,
  disabled = false,
  animateOnPress = false,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const styles = useStyles();
  const dimension = size ?? theme.sizing.actionButton;

  const scale = useRef(new Animated.Value(1)).current;
  const pop = () => {
    scale.setValue(0.82);
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };
  const handlePress = () => {
    if (animateOnPress && !disabled) pop();
    onPress?.();
  };

  const iconColor =
    variant === "dark"
      ? theme.colors.textOnDark
      : variant === "accent"
        ? theme.colors.accent
        : theme.colors.textPrimary;

  const circleStyle = [
    styles.circle,
    styles[variant],
    { width: dimension, height: dimension, borderRadius: dimension / 2 },
    disabled && styles.disabled,
  ];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={caption ? `${label}, ${caption}` : label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        caption ? styles.stack : undefined,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Animated.View style={[circleStyle, { transform: [{ scale }] }]}>
        <Icon size={Math.round(dimension * 0.42)} color={iconColor} strokeWidth={1.75} />
      </Animated.View>
      {caption ? (
        <Text variant="caption" color="textSecondary" style={styles.caption}>
          {caption}
        </Text>
      ) : null}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  stack: { alignItems: "center", gap: t.spacing.xs, width: 88 },
  caption: { textAlign: "center" },
  circle: { alignItems: "center", justifyContent: "center" },
  plain: { backgroundColor: "transparent" },
  surface: {
    backgroundColor: t.colors.surface,
    borderWidth: t.sizing.hairline,
    borderColor: t.colors.border,
  },
  accent: { backgroundColor: t.colors.surfaceAccent },
  dark: { backgroundColor: t.colors.surfaceDark },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
}));
