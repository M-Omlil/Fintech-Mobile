import React from "react";
import { View, type ViewStyle } from "react-native";

import { Text } from "@components/Text";
import { makeStyles } from "@theme/index";

export type SectionHeaderProps = {
  title: string;
  /** Optional trailing action (e.g. an "Afficher tout" link or icon). */
  action?: React.ReactNode;
  style?: ViewStyle;
};

/** Group label above a list/section (Section 7). */
export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  const styles = useStyles();
  return (
    <View style={[styles.row, style]}>
      <Text variant="label" color="textSecondary" accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: t.spacing.sm,
  },
}));
