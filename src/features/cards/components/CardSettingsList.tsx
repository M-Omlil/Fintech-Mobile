import { Lock } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Badge, Card, ListItem, SectionHeader, ToggleRow } from "@components/index";
import type { CardSettings } from "@domain/index";
import { makeStyles } from "@theme/index";

export type CardSettingsListProps = {
  settings: CardSettings;
  onToggle: (key: keyof CardSettings, value: boolean) => void;
};

/** Card payment settings + locked advanced options (Section 6.4). */
export function CardSettingsList({ settings, onToggle }: CardSettingsListProps) {
  const { t } = useTranslation();
  const styles = useStyles();

  const rows: { key: keyof CardSettings; label: string }[] = [
    { key: "cashWithdrawal", label: t("cards.settings.cashWithdrawal") },
    { key: "foreignPayment", label: t("cards.settings.foreignPayment") },
    { key: "onlinePayment", label: t("cards.settings.onlinePayment") },
    { key: "contactlessPayment", label: t("cards.settings.contactlessPayment") },
  ];

  const lockedBadge = <Badge label={t("cards.advanced.locked")} tone="muted" icon={Lock} />;

  return (
    <View style={styles.section}>
      <SectionHeader title={t("cards.settings.title")} />
      <Card variant="surface">
        {rows.map((row) => (
          <ToggleRow
            key={row.key}
            label={row.label}
            value={settings[row.key]}
            onChange={(value) => onToggle(row.key, value)}
          />
        ))}
      </Card>

      <SectionHeader title={t("cards.advanced.title")} />
      <Card variant="surface">
        <ListItem title={t("cards.advanced.usageDays")} trailing={lockedBadge} />
        <ListItem title={t("cards.advanced.spendCategories")} trailing={lockedBadge} />
      </Card>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: t.spacing.xs },
}));
