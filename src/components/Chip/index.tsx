import React from "react";
import { Pressable, type ViewStyle } from "react-native";

import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional leading node (e.g. a small Avatar for member chips). */
  leading?: React.ReactNode;
  style?: ViewStyle;
};

/** Selectable pill (Section 7) — used in filters and segmented choices. */
export function Chip({ label, selected = false, onPress, leading, style }: ChipProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {leading}
      <Text
        variant="label"
        color={selected ? "accent" : "textSecondary"}
        style={{ color: selected ? theme.colors.accent : theme.colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.xs,
    minHeight: 36,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radii.pill,
    borderWidth: t.sizing.hairline,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  chipSelected: {
    borderColor: t.colors.accent,
    backgroundColor: t.colors.surfaceAccent,
  },
  pressed: { opacity: 0.7 },
}));
