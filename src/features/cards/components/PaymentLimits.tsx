import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AmountText, Card, ProgressBar, SectionHeader, Text } from "@components/index";
import type { CurrencyCode } from "@domain/index";
import { formatMoney } from "@services/format/money";
import { makeStyles } from "@theme/index";

export type PaymentLimitsProps = {
  spent: number;
  limit: number;
  currency: CurrencyCode;
};

/** Card payment limits with progress (Section 6.4). */
export function PaymentLimits({ spent, limit, currency }: PaymentLimitsProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const available = Math.max(0, limit - spent);

  return (
    <View style={styles.section}>
      <SectionHeader title={t("cards.limits.title")} />
      <Card variant="surface" style={styles.card}>
        <View style={styles.row}>
          <Text variant="bodyLg" color="textPrimary">
            {t("cards.limits.monthly")}
          </Text>
          <Text variant="label" color="textSecondary">
            {`${formatMoney(spent, currency)} / ${formatMoney(limit, currency)}`}
          </Text>
        </View>
        <ProgressBar value={spent} max={limit} />
        <View style={styles.row}>
          <Text variant="caption" color="textSecondary">
            {t("cards.limits.availableThisMonth")}
          </Text>
          <AmountText value={available} currency={currency} variant="label" />
        </View>
      </Card>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: t.spacing.xs },
  card: { gap: t.spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
}));
