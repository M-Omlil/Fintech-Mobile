import React from "react";
import { Switch, View, type ViewStyle } from "react-native";

import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";

export type ToggleRowProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  subtitle?: string;
  disabled?: boolean;
  style?: ViewStyle;
};

/** Labeled switch row (Section 7 — card payment settings). */
export function ToggleRow({
  label,
  value,
  onChange,
  subtitle,
  disabled = false,
  style,
}: ToggleRowProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.row, style]}>
      <View style={styles.text}>
        <Text variant="bodyLg" color={disabled ? "textSecondary" : "textPrimary"}>
          {label}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
        thumbColor={theme.colors.surface}
        ios_backgroundColor={theme.colors.border}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: t.sizing.minTouchTarget,
    paddingVertical: t.spacing.sm,
    gap: t.spacing.md,
  },
  text: { flex: 1, gap: 2 },
}));
