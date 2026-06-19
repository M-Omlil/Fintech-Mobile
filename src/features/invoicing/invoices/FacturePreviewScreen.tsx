import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Share2 } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AmountText,
  Badge,
  Button,
  Card,
  Screen,
  ScreenHeader,
  Text,
  useToast,
} from "@components/index";
import { useBusiness, useInvoices } from "@hooks/index";
import type { RootStackParamList } from "@navigation/types";
import { exportInvoiceDocument } from "@services/export/invoiceDocument";
import { formatLongDate } from "@services/format/date";
import { formatMoney } from "@services/format/money";
import { makeStyles } from "@theme/index";

/** Facture preview (UC1) — see the document, validate (send), and share it with the
 * chosen payment modalities. The draft was persisted by the form before navigating. */
export function FacturePreviewScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation();
  const toast = useToast();

  const route = useRoute<RouteProp<RootStackParamList, "FacturePreview">>();
  const { invoiceId } = route.params;

  const { data: invoices, setInvoiceStatus } = useInvoices();
  const { data: business } = useBusiness();
  const [sharing, setSharing] = useState(false);

  const tk = t as unknown as (key: string) => string;
  const invoice = (invoices ?? []).find((i) => i.id === invoiceId);

  if (!invoice) {
    return (
      <Screen>
        <ScreenHeader title={t("invoicing.preview.title")} onBack={() => navigation.goBack()} />
      </Screen>
    );
  }

  const legalLine = [
    business?.legal.ice && `ICE ${business.legal.ice}`,
    business?.legal.if && `IF ${business.legal.if}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const methods = invoice.paymentMethods ?? [];
  const validated = invoice.status !== "brouillon";

  const onValidate = () => {
    setInvoiceStatus(invoice.id, "envoyee");
    toast.show(t("invoicing.preview.toastValidated"), "success");
  };

  const onShare = async () => {
    if (!business) return;
    setSharing(true);
    try {
      await exportInvoiceDocument(business, invoice);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={t("invoicing.preview.title")} onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <Card variant="surface" style={styles.doc}>
          <View style={styles.docHead}>
            <View style={styles.docIssuer}>
              <Text variant="titleLg" color="textPrimary">
                {business?.name ?? ""}
              </Text>
              {legalLine ? (
                <Text variant="caption" color="textSecondary">
                  {legalLine}
                </Text>
              ) : null}
              {business?.rib ? (
                <Text variant="caption" color="textSecondary">
                  RIB · {business.rib}
                </Text>
              ) : null}
            </View>
            <View style={styles.docMeta}>
              <Text variant="label" color="textSecondary">
                {t("invoicing.preview.docLabel")}
              </Text>
              <Text variant="titleMd" color="textPrimary">
                {invoice.number}
              </Text>
              <Badge
                label={tk(`invoicing.invoices.status.${invoice.status}`)}
                tone={validated ? "accent" : "muted"}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.clientRow}>
            <View style={styles.clientInfo}>
              <Text variant="caption" color="textSecondary">
                {t("invoicing.preview.client")}
              </Text>
              <Text variant="bodyLg" color="textPrimary">
                {invoice.clientName ?? "—"}
              </Text>
              {invoice.clientIce ? (
                <Text variant="caption" color="textSecondary">
                  ICE · {invoice.clientIce}
                </Text>
              ) : null}
            </View>
            <View style={styles.dates}>
              <Text variant="caption" color="textSecondary">
                {t("invoicing.preview.issuedOn", { date: formatLongDate(invoice.issueDate) })}
              </Text>
              <Text variant="caption" color="textSecondary">
                {t("invoicing.preview.dueOn", { date: formatLongDate(invoice.dueDate) })}
              </Text>
            </View>
          </View>

          <View style={styles.lines}>
            {invoice.lines.map((line) => (
              <View key={line.id} style={styles.lineRow}>
                <View style={styles.lineInfo}>
                  <Text variant="bodyMd" color="textPrimary" numberOfLines={1}>
                    {line.description}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {line.quantity} × {formatMoney(line.unitPrice)} · TVA {line.vatRate}%
                  </Text>
                </View>
                <AmountText value={line.quantity * line.unitPrice} variant="bodyLg" />
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text variant="bodyMd" color="textSecondary">
              {t("invoicing.quotes.form.totalHT")}
            </Text>
            <AmountText value={invoice.totalHT} variant="bodyLg" />
          </View>
          <View style={styles.totalRow}>
            <Text variant="bodyMd" color="textSecondary">
              {t("invoicing.quotes.form.vatAmount")}
            </Text>
            <AmountText value={invoice.vatAmount} variant="bodyLg" />
          </View>
          <View style={styles.totalRow}>
            <Text variant="titleMd" color="textPrimary">
              {t("invoicing.quotes.form.totalTTC")}
            </Text>
            <AmountText value={invoice.totalTTC} variant="titleMd" />
          </View>
        </Card>

        {methods.length > 0 ? (
          <View style={styles.section}>
            <Text variant="label" color="textSecondary">
              {t("invoicing.preview.paymentTitle")}
            </Text>
            <Card variant="muted" style={styles.payCard}>
              {methods.map((kind) => (
                <View key={kind} style={styles.payRow}>
                  <Text variant="bodyLg" color="textPrimary">
                    {tk(`invoicing.invoices.payment.${kind}`)}
                  </Text>
                  {kind === "rib" && business?.rib ? (
                    <Text variant="caption" color="textSecondary">
                      {business.rib}
                    </Text>
                  ) : null}
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            variant="primary"
            label={validated ? t("invoicing.preview.validated") : t("invoicing.preview.validate")}
            disabled={validated}
            onPress={onValidate}
          />
          <Button
            variant="secondary"
            label={t("invoicing.preview.share")}
            leadingIcon={Share2}
            loading={sharing}
            onPress={onShare}
          />
        </View>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.lg, marginTop: t.spacing.sm },
  doc: { gap: t.spacing.md },
  docHead: { flexDirection: "row", justifyContent: "space-between", gap: t.spacing.md },
  docIssuer: { flex: 1, gap: 2 },
  docMeta: { alignItems: "flex-end", gap: t.spacing.xs },
  divider: { height: t.sizing.hairline, backgroundColor: t.colors.border },
  clientRow: { flexDirection: "row", justifyContent: "space-between", gap: t.spacing.md },
  clientInfo: { flex: 1, gap: 2 },
  dates: { alignItems: "flex-end", gap: 2 },
  lines: { gap: t.spacing.sm },
  lineRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  lineInfo: { flex: 1, gap: 2 },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  section: { gap: t.spacing.xs },
  payCard: { gap: t.spacing.sm },
  payRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.spacing.sm,
  },
  actions: { gap: t.spacing.sm },
}));
