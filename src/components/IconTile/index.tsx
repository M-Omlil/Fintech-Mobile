import React from "react";
import { View, type ViewStyle } from "react-native";

import { makeStyles, useTheme } from "@theme/index";
import type { TintName } from "@theme/theme";

/** Single-weight line icon contract (lucide). */
export type TileIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

export type IconTileProps = {
  icon: TileIcon;
  /** Tint token (Section 6.5); defaults to the brand blue tint. */
  tint?: TintName;
  size?: number;
  style?: ViewStyle;
};

/** Rounded tinted square holding a line icon (Section 7). */
export function IconTile({ icon: Icon, tint = "blue", size, style }: IconTileProps) {
  const theme = useTheme();
  const styles = useStyles();
  const dimension = size ?? theme.sizing.iconTile;
  const tintToken = theme.tints[tint];
  return (
    <View
      style={[
        styles.tile,
        { width: dimension, height: dimension, backgroundColor: tintToken.bg },
        style,
      ]}
    >
      <Icon size={Math.round(dimension * 0.5)} color={tintToken.fg} strokeWidth={1.75} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  tile: {
    borderRadius: t.radii.control,
    alignItems: "center",
    justifyContent: "center",
  },
}));
