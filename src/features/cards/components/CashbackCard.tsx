import { Check, X } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { Button, Card, Text } from "@components/index";
import { makeStyles, useTheme } from "@theme/index";

export type CashbackCardProps = {
  onChangeCard?: () => void;
  onDismiss?: () => void;
};

/** Cashback promo (Section 6.4) — dark surface, bullet list, link + close. */
export function CashbackCard({ onChangeCard, onDismiss }: CashbackCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();

  const bullets = [
    t("cards.cashback.bullet1"),
    t("cards.cashback.bullet2"),
    t("cards.cashback.bullet3"),
  ];

  return (
    <Card variant="dark" style={styles.card}>
      <View style={styles.header}>
        <Text variant="titleMd" color="textOnDark" style={styles.title}>
          {t("cards.cashback.title")}
        </Text>
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
        >
          <X size={20} color={theme.colors.textOnDark} strokeWidth={1.75} />
        </Pressable>
      </View>

      <View style={styles.bullets}>
        {bullets.map((bullet) => (
          <View key={bullet} style={styles.bullet}>
            <Check size={16} color={theme.colors.accent} strokeWidth={2} />
            <Text variant="bodyMd" color="textOnDark" style={styles.bulletText}>
              {bullet}
            </Text>
          </View>
        ))}
      </View>

      <Button
        variant="text"
        label={t("cards.cashback.changeCard")}
        fullWidth={false}
        onPress={onChangeCard}
      />
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: t.spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: t.spacing.md,
  },
  title: { flex: 1 },
  bullets: { gap: t.spacing.sm },
  bullet: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  bulletText: { flex: 1 },
}));
