import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import {
  Button,
  Card,
  DateField,
  Field,
  Screen,
  ScreenHeader,
  SectionHeader,
  SelectField,
  TabPill,
  Text,
  useToast,
} from "@components/index";
import { genId } from "@data/store/ids";
import type { InvoiceKind, PaymentMethodKind } from "@domain/index";
import { useClients, useInvoices, useProducts } from "@hooks/index";
import type { RootStackParamList } from "@navigation/types";
import { makeStyles } from "@theme/index";

import { LineItemsCard, type DraftLine } from "../components/LineItemsCard";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAYMENT_KINDS: PaymentMethodKind[] = ["rib", "payment_link", "cashplus", "especes", "cheque"];

/** Nouvelle facture form (UC1) — client + ICE, editable number/date, line items from
 * stored references, and multi-select payment conditions. Leads into the preview. */
export function NouvelleFactureScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const toast = useToast();

  const { data: invoices, createInvoice } = useInvoices();
  const { data: products } = useProducts();
  const { data: clients } = useClients();

  const [kind, setKind] = useState<InvoiceKind>("vente");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientIce, setClientIce] = useState("");
  const [number, setNumber] = useState("");
  const [numberTouched, setNumberTouched] = useState(false);
  const [issueDate, setIssueDate] = useState<Date>(() => new Date());
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [methods, setMethods] = useState<PaymentMethodKind[]>(["rib"]);
  const [saving, setSaving] = useState(false);

  // Suggest the next FAC number once invoices load, unless the user has edited it.
  useEffect(() => {
    if (!numberTouched && invoices) {
      const seq = String(invoices.length + 1).padStart(3, "0");
      setNumber(`FAC-${new Date().getFullYear()}-${seq}`);
    }
  }, [invoices, numberTouched]);

  const minIssueDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 2);
    return date;
  }, []);

  const tk = t as unknown as (key: string) => string;
  const clientOptions = (clients ?? []).map((client) => ({ label: client.name, value: client.id }));

  const onPickClient = (id: string) => {
    setClientId(id);
    const client = (clients ?? []).find((c) => c.id === id);
    if (client) {
      setClientName(client.name);
      setClientIce(client.legal.ice ?? "");
    }
  };

  const toggleMethod = (method: PaymentMethodKind) => {
    setMethods((prev) =>
      prev.includes(method) ? prev.filter((k) => k !== method) : [...prev, method],
    );
  };

  const canPreview = lines.length > 0;

  const onPreview = async () => {
    if (!canPreview) {
      toast.show(t("invoicing.invoices.form.needLine"), "error");
      return;
    }
    setSaving(true);
    try {
      const invoice = await createInvoice({
        kind,
        clientName: clientName.trim() || undefined,
        clientIce: clientIce.trim() || undefined,
        number: number.trim() || undefined,
        issueDate: issueDate.toISOString(),
        paymentMethods: methods,
        lines: lines.map(({ description, quantity, unitPrice, vatRate }) => ({
          description,
          quantity,
          unitPrice,
          vatRate,
        })),
      });
      navigation.navigate("FacturePreview", { invoiceId: invoice.id });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={t("invoicing.invoices.create")} onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <TabPill
          value={kind}
          onChange={(key) => setKind(key as InvoiceKind)}
          segments={[
            { key: "vente", label: t("invoicing.invoices.kindVente") },
            { key: "achat", label: t("invoicing.invoices.kindAchat") },
          ]}
        />

        <Card variant="surface" style={styles.section}>
          {clientOptions.length > 0 ? (
            <SelectField
              label={t("invoicing.invoices.form.clientPicker")}
              placeholder={t("invoicing.invoices.form.clientPickerPlaceholder")}
              value={clientId}
              options={clientOptions}
              onChange={onPickClient}
            />
          ) : null}
          <Field
            label={t("invoicing.invoices.form.clientName")}
            placeholder={t("invoicing.invoices.form.clientNamePlaceholder")}
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

        <Card variant="surface" style={styles.section}>
          <Field
            label={t("invoicing.invoices.form.number")}
            value={number}
            onChangeText={(text) => {
              setNumberTouched(true);
              setNumber(text);
            }}
            autoCapitalize="characters"
          />
          <DateField
            label={t("invoicing.invoices.form.issueDate")}
            value={issueDate}
            onChange={setIssueDate}
            confirmLabel={t("invoicing.invoices.form.dateConfirm")}
            minimumDate={minIssueDate}
          />
        </Card>

        <LineItemsCard
          lines={lines}
          products={products ?? []}
          onAdd={(line) => setLines((prev) => [...prev, { id: genId("line"), ...line }])}
          onRemove={(id) => setLines((prev) => prev.filter((l) => l.id !== id))}
        />

        <View style={styles.payment}>
          <SectionHeader title={t("invoicing.invoices.form.paymentSection")} />
          <Card variant="surface">
            <View style={styles.chips}>
              {PAYMENT_KINDS.map((method) => {
                const active = methods.includes(method);
                return (
                  <Pressable
                    key={method}
                    onPress={() => toggleMethod(method)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={tk(`invoicing.invoices.payment.${method}`)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text variant="label" color={active ? "textOnPrimary" : "textSecondary"}>
                      {tk(`invoicing.invoices.payment.${method}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>

        <Button
          variant="primary"
          label={t("invoicing.invoices.form.preview")}
          onPress={onPreview}
          loading={saving}
          disabled={!canPreview}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.lg, marginTop: t.spacing.sm },
  section: { gap: t.spacing.md },
  payment: { gap: t.spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm },
  chip: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surfaceMuted,
  },
  chipActive: { backgroundColor: t.colors.primary },
  pressed: { opacity: 0.6 },
}));
