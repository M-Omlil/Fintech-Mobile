import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, View } from "react-native";

import { Text } from "@components/Text";
import { formatMonthYear, WEEKDAY_INITIALS_FR } from "@services/format/date";
import { makeStyles, useTheme } from "@theme/index";

export type MonthCalendarProps = {
  /** Currently-selected day. */
  value: Date;
  /** First-of-month currently displayed. */
  visibleMonth: Date;
  onChangeVisibleMonth: (month: Date) => void;
  onSelect: (date: Date) => void;
  /** Days before this are disabled. */
  minimumDate?: Date;
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function capitalize(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/**
 * Branded month grid (Section 7) — the "pick any date" half of the date picker. Built
 * entirely on tokens (no system calendar), Monday-first, with the selected day on a
 * navy disc, today ringed in accent, and past days disabled.
 */
export function MonthCalendar({
  value,
  visibleMonth,
  onChangeVisibleMonth,
  onSelect,
  minimumDate,
}: MonthCalendarProps) {
  const theme = useTheme();
  const styles = useStyles();

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const min = startOfDay(minimumDate ?? new Date());
  const today = startOfDay(new Date());

  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(startOfDay(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const canPrev = startOfMonth(visibleMonth).getTime() > startOfMonth(min).getTime();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => canPrev && onChangeVisibleMonth(addMonths(visibleMonth, -1))}
          disabled={!canPrev}
          accessibilityRole="button"
          accessibilityLabel={formatMonthYear(addMonths(visibleMonth, -1))}
          hitSlop={8}
          style={({ pressed }) => [
            styles.nav,
            pressed && styles.pressed,
            !canPrev && styles.navOff,
          ]}
        >
          <ChevronLeft size={20} color={theme.colors.textPrimary} strokeWidth={1.75} />
        </Pressable>

        <Text variant="titleMd" color="textPrimary">
          {capitalize(formatMonthYear(visibleMonth))}
        </Text>

        <Pressable
          onPress={() => onChangeVisibleMonth(addMonths(visibleMonth, 1))}
          accessibilityRole="button"
          accessibilityLabel={formatMonthYear(addMonths(visibleMonth, 1))}
          hitSlop={8}
          style={({ pressed }) => [styles.nav, pressed && styles.pressed]}
        >
          <ChevronRight size={20} color={theme.colors.textPrimary} strokeWidth={1.75} />
        </Pressable>
      </View>

      <View style={styles.week}>
        {WEEKDAY_INITIALS_FR.map((letter, index) => (
          <View key={`h-${index}`} style={styles.cell}>
            <Text variant="caption" color="textSecondary">
              {letter}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={`w-${wi}`} style={styles.week}>
          {week.map((day, di) => {
            if (!day) return <View key={`d-${wi}-${di}`} style={styles.cell} />;
            const disabled = day.getTime() < min.getTime();
            const selected = sameDay(day, value);
            const isToday = sameDay(day, today);
            return (
              <Pressable
                key={`d-${wi}-${di}`}
                onPress={() => !disabled && onSelect(day)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                accessibilityLabel={String(day.getDate())}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.dayInner,
                    selected && styles.daySelected,
                    isToday && !selected && styles.dayToday,
                  ]}
                >
                  <Text
                    variant="bodyMd"
                    color={selected ? "textOnPrimary" : "textPrimary"}
                    style={disabled ? styles.dayOff : undefined}
                  >
                    {day.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: t.spacing.xs },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: t.spacing.xs,
  },
  nav: {
    width: t.sizing.iconTile,
    height: t.sizing.iconTile,
    borderRadius: t.sizing.iconTile / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.surfaceMuted,
  },
  navOff: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
  week: { flexDirection: "row" },
  cell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  dayInner: {
    width: t.sizing.iconTile,
    height: t.sizing.iconTile,
    borderRadius: t.sizing.iconTile / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: { backgroundColor: t.colors.primary },
  dayToday: { borderWidth: t.sizing.hairline, borderColor: t.colors.accent },
  dayOff: { opacity: 0.35 },
}));
