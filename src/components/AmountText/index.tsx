import React from "react";

import { Text, type TextProps } from "@components/Text";
import { formatMoney, formatSignedMoney, type CurrencyCode } from "@services/format/money";
import type { ThemeColors } from "@theme/theme";

export type AmountTextProps = Omit<TextProps, "children" | "color"> & {
  value: number;
  currency?: CurrencyCode;
  /** Show an explicit +/- sign and color positives as success (Section 7). */
  signed?: boolean;
  /** Override the auto color (success for positive signed, otherwise primary). */
  color?: keyof ThemeColors;
};

/**
 * Money display primitive. Tabular figures come from the `numericLg`/numeric
 * variants; positive signed amounts render in the success color automatically.
 */
export function AmountText({
  value,
  currency = "MAD",
  signed = false,
  variant = "bodyLg",
  color,
  ...rest
}: AmountTextProps) {
  const text = signed ? formatSignedMoney(value, currency) : formatMoney(value, currency);
  const autoColor: keyof ThemeColors = signed && value > 0 ? "success" : "textPrimary";
  return (
    <Text variant={variant} color={color ?? autoColor} {...rest}>
      {text}
    </Text>
  );
}
