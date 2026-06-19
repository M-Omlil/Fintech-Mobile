import React from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { Text } from "@components/Text";
import { makeStyles } from "@theme/index";

export type TabPillSegment = { key: string; label: string };

export type TabPillProps = {
  segments: TabPillSegment[];
  value: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
};

/**
 * Segmented control (Section 7) — e.g. Vos cartes / Flotte de cartes, En cours /
 * Passés. The active segment lifts onto a white pill within a muted track.
 */
export function TabPill({ segments, value, onChange, style }: TabPillProps) {
  const styles = useStyles();
  return (
    <View style={[styles.track, style]} accessibilityRole="tablist">
      {segments.map((segment) => {
        const active = segment.key === value;
        return (
          <Pressable
            key={segment.key}
            onPress={() => onChange(segment.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={segment.label}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text variant="label" color={active ? "textPrimary" : "textSecondary"}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: {
    flexDirection: "row",
    padding: t.spacing.xs,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surfaceMuted,
    gap: t.spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: t.sizing.minTouchTarget - 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radii.pill,
    paddingHorizontal: t.spacing.md,
  },
  segmentActive: {
    backgroundColor: t.colors.surface,
    shadowColor: t.colors.shadow,
    ...t.elevation.card,
  },
}));
