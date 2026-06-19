import { Eye, EyeOff, MoreHorizontal, Plus } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { AmountText, Card, IconButton, SectionHeader, Text } from "@components/index";
import type { CurrencyCode } from "@domain/index";
import { makeStyles, useTheme } from "@theme/index";

export type BalanceSectionProps = {
  accountName: string;
  balance: number;
  currency: CurrencyCode;
  hidden: boolean;
  onToggleHidden: () => void;
  onPressAccount?: () => void;
  onAddAccount?: () => void;
  onMoreOptions?: () => void;
};

/** Solde section (Section 6.2) — hide/show toggle, balance card, add-account tile. */
export function BalanceSection({
  accountName,
  balance,
  currency,
  hidden,
  onToggleHidden,
  onPressAccount,
  onAddAccount,
  onMoreOptions,
}: BalanceSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t("home.balanceTitle")}
        action={
          <View style={styles.actions}>
            <IconButton
              icon={hidden ? EyeOff : Eye}
              variant="plain"
              size={36}
              label={hidden ? t("home.showBalance") : t("home.hideBalance")}
              onPress={onToggleHidden}
            />
            <IconButton
              icon={MoreHorizontal}
              variant="plain"
              size={36}
              label={t("home.moreOptions")}
              onPress={onMoreOptions}
            />
          </View>
        }
      />
      <View style={styles.tiles}>
        <Pressable
          style={styles.balanceCardWrap}
          onPress={onPressAccount}
          accessibilityRole="button"
          accessibilityLabel={accountName}
        >
          <Card variant="surface" style={styles.balanceCard}>
            <Text variant="label" color="textSecondary">
              {accountName}
            </Text>
            {hidden ? (
              <Text variant="numericLg" color="textPrimary">
                ••••
              </Text>
            ) : (
              <AmountText value={balance} currency={currency} variant="numericLg" />
            )}
          </Card>
        </Pressable>

        <Pressable
          style={styles.addTile}
          onPress={onAddAccount}
          accessibilityRole="button"
          accessibilityLabel={t("home.addAccount")}
        >
          <Plus size={24} color={theme.colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: t.spacing.xs },
  actions: { flexDirection: "row", alignItems: "center", gap: t.spacing.xs },
  tiles: { flexDirection: "row", gap: t.spacing.md },
  balanceCardWrap: { flex: 1 },
  balanceCard: { gap: t.spacing.sm },
  addTile: {
    width: 64,
    borderRadius: t.radii.card,
    borderWidth: t.sizing.hairline,
    borderColor: t.colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
}));
