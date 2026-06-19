import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";

export type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  /** Trailing action nodes (icon buttons), laid out right-aligned. */
  rightActions?: React.ReactNode;
  /** Use a smaller title (sheets/sub-screens). Defaults to the large screen title. */
  compact?: boolean;
  style?: ViewStyle;
};

/** Standard screen title bar (Section 7) — back affordance + trailing actions. */
export function ScreenHeader({
  title,
  onBack,
  rightActions,
  compact = false,
  style,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.root, style]}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
            style={styles.back}
          >
            <ChevronLeft size={26} color={theme.colors.textPrimary} strokeWidth={1.75} />
          </Pressable>
        ) : null}
        <Text variant={compact ? "titleLg" : "titleXl"} color="textPrimary" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightActions ? <View style={styles.actions}>{rightActions}</View> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: t.sizing.minTouchTarget,
    paddingVertical: t.spacing.sm,
    gap: t.spacing.sm,
  },
  left: { flexDirection: "row", alignItems: "center", gap: t.spacing.xs, flex: 1 },
  back: { marginLeft: -t.spacing.xs },
  actions: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
}));
