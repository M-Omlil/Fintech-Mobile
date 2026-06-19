import { Calendar } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, View, type ViewStyle } from "react-native";

import { Button } from "@components/Button";
import { Sheet } from "@components/Sheet";
import { Text } from "@components/Text";
import { formatLongDate, formatWeekday } from "@services/format/date";
import { makeStyles, useTheme } from "@theme/index";

import { MonthCalendar } from "./MonthCalendar";

/** A quick relative-date choice (e.g. "Demain" → +1 day). Label is passed translated. */
export type DatePreset = { label: string; days: number };

export type DateFieldProps = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  /** CTA label for the picker sheet (translated by the caller). */
  confirmLabel: string;
  /** Relative shortcuts shown as chips, counted from today. */
  presets?: DatePreset[];
  /** Earliest selectable day (defaults to today). */
  minimumDate?: Date;
  style?: ViewStyle;
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return startOfDay(copy);
}

function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function capitalize(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/**
 * In-app date picker (Section 7) — fully branded, so it reads as part of Amano rather
 * than a system dialog. A dark "selected day" hero sits above quick relative-date chips
 * and a tokenised month calendar for picking any custom date. Dependency-free, so it
 * behaves identically on every build.
 */
export function DateField({
  label,
  value,
  onChange,
  confirmLabel,
  presets = [],
  minimumDate,
  style,
}: DateFieldProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => startOfDay(value));
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(value));

  useEffect(() => {
    if (open) setDraft(startOfDay(value));
  }, [open, value]);

  // Keep the calendar on the month of the selected day (browsing months won't trigger
  // this, since that only moves `visibleMonth`).
  useEffect(() => {
    setVisibleMonth(startOfMonth(draft));
  }, [draft]);

  const today = startOfDay(new Date());

  const commit = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <View style={[styles.root, style]}>
      {label ? (
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? ""} ${formatLongDate(value)}`.trim()}
        style={({ pressed }) => [styles.control, pressed && styles.pressed]}
      >
        <Text variant="bodyLg" color="textPrimary" numberOfLines={1} style={styles.controlText}>
          {formatLongDate(value)}
        </Text>
        <Calendar size={20} color={theme.colors.textSecondary} strokeWidth={1.75} />
      </Pressable>

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        footer={<Button label={confirmLabel} onPress={commit} />}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <View style={styles.hero}>
            <Text variant="caption" color="textOnDark" style={styles.heroWeekday}>
              {capitalize(formatWeekday(draft))}
            </Text>
            <Text variant="titleLg" color="textOnDark" numberOfLines={1}>
              {formatLongDate(draft)}
            </Text>
          </View>

          {presets.length > 0 ? (
            <View style={styles.presets}>
              {presets.map((preset) => {
                const presetDate = addDays(today, preset.days);
                const active = sameDay(presetDate, draft);
                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => setDraft(presetDate)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={preset.label}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text variant="label" color={active ? "textOnPrimary" : "textSecondary"}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <MonthCalendar
            value={draft}
            visibleMonth={visibleMonth}
            onChangeVisibleMonth={setVisibleMonth}
            onSelect={setDraft}
            minimumDate={minimumDate}
          />
        </ScrollView>
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: t.spacing.xs },
  control: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.sm,
    minHeight: t.sizing.minTouchTarget,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radii.control,
    borderWidth: t.sizing.hairline,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  controlText: { flex: 1 },
  pressed: { opacity: 0.7 },
  body: { gap: t.spacing.lg, paddingBottom: t.spacing.xs },
  hero: {
    alignItems: "center",
    gap: 2,
    paddingVertical: t.spacing.lg,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radii.card,
    backgroundColor: t.colors.surfaceDark,
  },
  heroWeekday: { opacity: 0.7 },
  presets: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: t.spacing.sm },
  chip: {
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surfaceMuted,
  },
  chipActive: { backgroundColor: t.colors.primary },
}));
