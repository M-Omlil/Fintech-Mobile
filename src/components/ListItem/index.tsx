import React from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { Text } from "@components/Text";
import { makeStyles } from "@theme/index";

export type ListItemProps = {
  /** Leading slot — IconTile, Avatar, logo, etc. */
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Trailing slot — chevron, amount, switch, etc. */
  trailing?: React.ReactNode;
  /** Small inline badge after the title (e.g. "Nouveau"). */
  badge?: React.ReactNode;
  onPress?: () => void;
  /** Render the title in the danger color (destructive rows). */
  danger?: boolean;
  style?: ViewStyle;
};

/**
 * Generic row primitive (Section 4 — Open/Closed). One implementation, driven by
 * props, backs every list row in the app. Becomes pressable only when `onPress` is
 * provided.
 */
export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  badge,
  onPress,
  danger = false,
  style,
}: ListItemProps) {
  const styles = useStyles();

  const body = (
    <View style={[styles.row, style]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.center}>
        <View style={styles.titleRow}>
          <Text variant="titleMd" color={danger ? "danger" : "textPrimary"} numberOfLines={1}>
            {title}
          </Text>
          {badge ? <View style={styles.badge}>{badge}</View> : null}
        </View>
        {subtitle ? (
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: t.sizing.minTouchTarget,
    paddingVertical: t.spacing.sm,
    gap: t.spacing.md,
  },
  leading: { justifyContent: "center" },
  center: { flex: 1, justifyContent: "center", gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  badge: { flexShrink: 0 },
  trailing: { marginLeft: t.spacing.sm },
  pressed: { opacity: 0.6 },
}));
