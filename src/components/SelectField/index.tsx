import { Check, ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { Sheet } from "@components/Sheet";
import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";

export type SelectOption = { label: string; value: string };

export type SelectFieldProps = {
  /** Optional label rendered above the control (locale-agnostic; pass translated text). */
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Title for the options sheet (defaults to `label`). */
  sheetTitle?: string;
  style?: ViewStyle;
};

/**
 * Labeled dropdown (Section 7). The control mirrors the `Field` input shell; tapping
 * opens a bottom sheet of options with a check on the active one. Used for source-
 * account selection and any short enumerated choice.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  sheetTitle,
  style,
}: SelectFieldProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

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
        accessibilityLabel={label ?? selected?.label ?? placeholder ?? ""}
        style={({ pressed }) => [styles.control, pressed && styles.pressed]}
      >
        <Text
          variant="bodyLg"
          color={selected ? "textPrimary" : "textSecondary"}
          numberOfLines={1}
          style={styles.controlText}
        >
          {selected?.label ?? placeholder ?? ""}
        </Text>
        <ChevronDown size={20} color={theme.colors.textSecondary} strokeWidth={1.75} />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title={sheetTitle ?? label}>
        <View style={styles.options}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}
              >
                <Text
                  variant="bodyLg"
                  color={active ? "accent" : "textPrimary"}
                  numberOfLines={1}
                  style={styles.optionLabel}
                >
                  {option.label}
                </Text>
                {active ? <Check size={20} color={theme.colors.accent} strokeWidth={2} /> : null}
              </Pressable>
            );
          })}
        </View>
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
  options: { gap: t.spacing.xs },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.sm,
    minHeight: t.sizing.minTouchTarget,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radii.control,
  },
  optionLabel: { flex: 1 },
}));
