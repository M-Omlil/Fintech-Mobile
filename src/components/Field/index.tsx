import React from "react";
import {
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";

export type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  style?: ViewStyle;
};

/** Labeled text input used across forms (auth, creation flows). */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "none",
  autoComplete,
  style,
}: FieldProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.root, style]}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        accessibilityLabel={label}
        style={[theme.typography.bodyLg, styles.input]}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: t.spacing.xs },
  input: {
    minHeight: t.sizing.minTouchTarget,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radii.control,
    borderWidth: t.sizing.hairline,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    color: t.colors.textPrimary,
  },
}));
