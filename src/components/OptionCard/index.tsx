import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, View } from "react-native";

import { IconTile, type TileIcon } from "@components/IconTile";
import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";
import type { TintName } from "@theme/theme";

export type OptionCardProps = {
  icon: TileIcon;
  tint?: TintName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

/**
 * Tappable option card (Sections 6.6 / 6.8) — used in chooser sheets and onboarding
 * flows. Icon + title + optional subtitle on a surface with a trailing chevron.
 */
export function OptionCard({ icon, tint = "blue", title, subtitle, onPress }: OptionCardProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <IconTile icon={icon} tint={tint} />
      <View style={styles.text}>
        <Text variant="titleMd" color="textPrimary">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={20} color={theme.colors.textSecondary} strokeWidth={1.75} />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
    padding: t.spacing.lg,
    borderRadius: t.radii.card,
    backgroundColor: t.colors.surface,
    shadowColor: t.colors.shadow,
    ...t.elevation.card,
  },
  text: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
}));
