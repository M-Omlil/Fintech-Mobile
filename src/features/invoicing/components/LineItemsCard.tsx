import { Check, Plus, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import {
  AmountText,
  Button,
  Card,
  Field,
  IconButton,
  SectionHeader,
  Sheet,
  Text,
} from "@components/index";
import type { Product } from "@domain/index";
import { formatMoney } from "@services/format/money";
import { computeTotalsFromLines, DEFAULT_VAT_RATE, VAT_RATES } from "@services/tax/tva";
import { makeStyles, useTheme } from "@theme/index";

/** A draft line being edited on a quote/invoice form. */
export type DraftLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export type LineItemsCardProps = {
  lines: DraftLine[];
  onAdd: (line: Omit<DraftLine, "id">) => void;
  onRemove: (id: string) => void;
  /** Stored product/service catalog to pick references from (UC1). */
  products?: Product[];
};

function parseNumber(raw: string, fallback: number): number {
  const value = Number.parseFloat((raw ?? "").replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/**
 * Line-item editor + live TVA totals (mega-prompt §6 DRY substrate). Shared by the
 * devis and facture forms. The add sheet lets the user pick a stored reference
 * (pre-filling the line) or enter one manually, then set the quantity (UC1).
 */
export function LineItemsCard({ lines, onAdd, onRemove, products = [] }: LineItemsCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [vatRate, setVatRate] = useState<number>(DEFAULT_VAT_RATE);
  const [pickedId, setPickedId] = useState<string>();

  useEffect(() => {
    if (sheetOpen) {
      setDescription("");
      setQuantity("1");
      setUnitPrice("");
      setVatRate(DEFAULT_VAT_RATE);
      setPickedId(undefined);
    }
  }, [sheetOpen]);

  const totals = computeTotalsFromLines(lines);
  const canAdd = description.trim().length > 0 && parseNumber(unitPrice, -1) >= 0;

  const pickProduct = (product: Product) => {
    setPickedId(product.id);
    setDescription(product.name);
    setUnitPrice(String(product.unitPrice));
    setVatRate(product.vatRate);
  };

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({
      description: description.trim(),
      quantity: parseNumber(quantity, 1) || 1,
      unitPrice: parseNumber(unitPrice, 0),
      vatRate,
    });
    setSheetOpen(false);
  };

  return (
    <View style={styles.root}>
      <SectionHeader title={t("invoicing.quotes.form.productsSection")} />
      <Card variant="surface" style={styles.card}>
        {lines.length === 0 ? (
          <Text variant="bodyMd" color="textSecondary">
            {t("invoicing.products.emptyTitle")}
          </Text>
        ) : (
          lines.map((line) => (
            <View key={line.id} style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <Text variant="bodyLg" color="textPrimary" numberOfLines={1}>
                  {line.description}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {line.quantity} × {formatMoney(line.unitPrice)} · TVA {line.vatRate}%
                </Text>
              </View>
              <AmountText value={line.quantity * line.unitPrice} variant="titleMd" />
              <IconButton
                icon={Trash2}
                variant="plain"
                size={36}
                label={t("common.cancel")}
                onPress={() => onRemove(line.id)}
              />
            </View>
          ))
        )}
        <Button
          variant="text"
          label={t("forms.addLine")}
          leadingIcon={Plus}
          fullWidth={false}
          onPress={() => setSheetOpen(true)}
        />
      </Card>

      <Card variant="surface" style={styles.totals}>
        <View style={styles.totalRow}>
          <Text variant="bodyMd" color="textSecondary">
            {t("invoicing.quotes.form.totalHT")}
          </Text>
          <AmountText value={totals.totalHT} variant="bodyLg" />
        </View>
        <View style={styles.totalRow}>
          <Text variant="bodyMd" color="textSecondary">
            {t("invoicing.quotes.form.vatAmount")}
          </Text>
          <AmountText value={totals.vatAmount} variant="bodyLg" />
        </View>
        <View style={styles.totalRow}>
          <Text variant="titleMd" color="textPrimary">
            {t("invoicing.quotes.form.totalTTC")}
          </Text>
          <AmountText value={totals.totalTTC} variant="titleMd" />
        </View>
      </Card>

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("forms.addLine")}
        footer={<Button label={t("common.add")} onPress={handleAdd} disabled={!canAdd} />}
      >
        <View style={styles.form}>
          {products.length > 0 ? (
            <View style={styles.refs}>
              <Text variant="label" color="textSecondary">
                {t("invoicing.quotes.form.references")}
              </Text>
              {products.map((product) => {
                const active = product.id === pickedId;
                return (
                  <Pressable
                    key={product.id}
                    onPress={() => pickProduct(product)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={product.name}
                    style={({ pressed }) => [
                      styles.refRow,
                      active && styles.refRowActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.refInfo}>
                      <Text variant="bodyLg" color="textPrimary" numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text variant="caption" color="textSecondary">
                        {formatMoney(product.unitPrice)} · TVA {product.vatRate}%
                      </Text>
                    </View>
                    {active ? (
                      <Check size={20} color={theme.colors.accent} strokeWidth={2} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Field
            label={t("forms.lineDescription")}
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
          />
          <View style={styles.amountRow}>
            <Field
              style={styles.amountField}
              label={t("forms.lineQuantity")}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
            <Field
              style={styles.amountField}
              label={t("forms.lineUnitPrice")}
              value={unitPrice}
              onChangeText={setUnitPrice}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.vatBlock}>
            <Text variant="label" color="textSecondary">
              {t("forms.lineVat")}
            </Text>
            <View style={styles.vatChips}>
              {VAT_RATES.map((rate) => {
                const active = rate === vatRate;
                return (
                  <Pressable
                    key={rate}
                    onPress={() => setVatRate(rate)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`TVA ${rate}%`}
                    style={({ pressed }) => [
                      styles.vatChip,
                      active && styles.vatChipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text variant="label" color={active ? "textOnPrimary" : "textSecondary"}>
                      {rate}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: t.spacing.xs },
  card: { gap: t.spacing.md },
  lineRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  lineInfo: { flex: 1, gap: 2 },
  totals: { gap: t.spacing.sm },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  form: { gap: t.spacing.md, paddingBottom: t.spacing.md },
  refs: { gap: t.spacing.xs },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.sm,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radii.control,
    backgroundColor: t.colors.surfaceMuted,
  },
  refRowActive: { backgroundColor: t.colors.surfaceAccent },
  refInfo: { flex: 1, gap: 2 },
  amountRow: { flexDirection: "row", gap: t.spacing.md },
  amountField: { flex: 1 },
  vatBlock: { gap: t.spacing.xs },
  vatChips: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm },
  vatChip: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surfaceMuted,
  },
  vatChipActive: { backgroundColor: t.colors.primary },
  pressed: { opacity: 0.6 },
}));
