import React from "react";
import { ActivityIndicator, Pressable, View, type ViewStyle } from "react-native";

import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";

export type ButtonVariant = "primary" | "secondary" | "text";

/** Minimal icon contract so any single-weight line icon (lucide) can be injected. */
export type ButtonIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

export type ButtonProps = {
  variant?: ButtonVariant;
  label: string;
  onPress?: () => void;
  leadingIcon?: ButtonIcon;
  loading?: boolean;
  disabled?: boolean;
  /** Defaults to stretching to the container width. */
  fullWidth?: boolean;
  style?: ViewStyle;
};

/**
 * Brand button (Section 2.3 / 7). Variants honor one contract (Liskov) — swapping a
 * variant never changes the call site. `primary` is the filled navy CTA, `secondary`
 * an outline, `text` an underlined accent link.
 */
export function Button({
  variant = "primary",
  label,
  onPress,
  leadingIcon: Icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const styles = useStyles();
  const isDisabled = disabled || loading;

  const contentColor =
    variant === "primary"
      ? theme.colors.textOnPrimary
      : variant === "secondary"
        ? theme.colors.textPrimary
        : theme.colors.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon size={20} color={contentColor} strokeWidth={1.75} /> : null}
          <Text
            variant="titleMd"
            style={[{ color: contentColor }, variant === "text" && styles.linkLabel]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    minHeight: t.sizing.buttonHeight,
    borderRadius: t.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: t.spacing.xl,
  },
  fullWidth: { alignSelf: "stretch" },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.sm,
  },
  primary: { backgroundColor: t.colors.primary },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: t.sizing.hairline,
    borderColor: t.colors.border,
  },
  text: {
    minHeight: undefined,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
  },
  linkLabel: { textDecorationLine: "underline" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
}));
