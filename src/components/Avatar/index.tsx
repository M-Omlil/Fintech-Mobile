import React from "react";
import { View, type ViewStyle } from "react-native";

import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";

export type AvatarProps = {
  /** Display name; the first letter becomes the monogram. */
  name: string;
  size?: number;
  style?: ViewStyle;
};

function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? (trimmed[0] ?? "").toUpperCase() : "?";
}

/** Square monogram avatar (Section 6.2 header). */
export function Avatar({ name, size, style }: AvatarProps) {
  const theme = useTheme();
  const styles = useStyles();
  const dimension = size ?? theme.sizing.iconTile;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[styles.root, { width: dimension, height: dimension }, style]}
    >
      <Text variant="titleMd" color="textOnPrimary">
        {initialOf(name)}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    borderRadius: t.radii.control,
    backgroundColor: t.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
}));
