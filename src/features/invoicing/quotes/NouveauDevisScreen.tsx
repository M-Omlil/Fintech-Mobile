import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Card, Field, Screen, ScreenHeader, useToast } from "@components/index";
import { genId } from "@data/store/ids";
import { useProducts, useQuotes } from "@hooks/index";
import type { RootStackParamList } from "@navigation/types";
import { makeStyles } from "@theme/index";

import { LineItemsCard, type DraftLine } from "../components/LineItemsCard";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Nouveau devis form (mega-prompt §6) — shares the line-item editor with factures. */
export function NouveauDevisScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const { createQuote } = useQuotes();
  const { data: products } = useProducts();
  const toast = useToast();

  const [clientName, setClientName] = useState("");
  const [clientIce, setClientIce] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await createQuote({
        clientName: clientName.trim() || undefined,
        clientIce: clientIce.trim() || undefined,
        lines: lines.map(({ description, quantity, unitPrice, vatRate }) => ({
          description,
          quantity,
          unitPrice,
          vatRate,
        })),
      });
      toast.show(t("invoicing.quotes.toastSaved"));
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={t("invoicing.quotes.form.title")} onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <Card variant="surface" style={styles.clientCard}>
          <Field
            label={t("invoicing.quotes.form.clientSection")}
            value={clientName}
            onChangeText={setClientName}
            autoCapitalize="words"
          />
          <Field
            label={t("invoicing.invoices.form.clientIce")}
            placeholder={t("invoicing.invoices.form.clientIceOptional")}
            value={clientIce}
            onChangeText={setClientIce}
            keyboardType="number-pad"
          />
        </Card>

        <LineItemsCard
          lines={lines}
          products={products ?? []}
          onAdd={(line) => setLines((prev) => [...prev, { id: genId("line"), ...line }])}
          onRemove={(id) => setLines((prev) => prev.filter((l) => l.id !== id))}
        />

        <View style={styles.actions}>
          <Button
            variant="primary"
            label={t("invoicing.quotes.form.save")}
            onPress={onSave}
            loading={saving}
          />
          <Button
            variant="secondary"
            label={t("invoicing.quotes.form.preview")}
            onPress={() => toast.show(t("common.comingSoonToast"), "info")}
          />
        </View>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.lg, marginTop: t.spacing.sm },
  clientCard: { gap: t.spacing.md },
  actions: { gap: t.spacing.sm },
}));
