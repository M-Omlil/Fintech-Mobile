import { ArrowLeftRight, CreditCard, FilePlus2, Landmark, Receipt } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

import { IconButton } from "@components/index";
import type { TileIcon } from "@components/index";
import { makeStyles } from "@theme/index";

export type QuickActionsProps = {
  onTransfer?: () => void;
  onAddDocument?: () => void;
  onFactures?: () => void;
  onCards?: () => void;
  onRib?: () => void;
};

/** Raccourcis row (mega-prompt §4) — Virement · Ajouter doc (P2) · Factures · Cartes · RIB. */
export function QuickActions({
  onTransfer,
  onAddDocument,
  onFactures,
  onCards,
  onRib,
}: QuickActionsProps) {
  const { t } = useTranslation();
  const styles = useStyles();

  const actions: { key: string; icon: TileIcon; label: string; onPress?: () => void }[] = [
    { key: "transfer", icon: ArrowLeftRight, label: t("home.makeTransfer"), onPress: onTransfer },
    { key: "document", icon: FilePlus2, label: t("home.addDocument"), onPress: onAddDocument },
    { key: "factures", icon: Receipt, label: t("home.factures"), onPress: onFactures },
    { key: "cards", icon: CreditCard, label: t("home.cards"), onPress: onCards },
    { key: "rib", icon: Landmark, label: t("home.rib"), onPress: onRib },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {actions.map((action) => (
        <IconButton
          key={action.key}
          icon={action.icon}
          variant="surface"
          label={action.label}
          caption={action.label}
          onPress={action.onPress}
        />
      ))}
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  row: { gap: t.spacing.lg, paddingVertical: t.spacing.xs, paddingRight: t.spacing.lg },
}));
