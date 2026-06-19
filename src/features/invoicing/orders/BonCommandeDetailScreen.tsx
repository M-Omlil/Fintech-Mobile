import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CheckCircle2, Receipt } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import {
  AmountText,
  Badge,
  Button,
  Card,
  Screen,
  ScreenHeader,
  Text,
  type BadgeTone,
} from "@components/index";
import type { PurchaseOrderStatus } from "@domain/index";
import { useBusiness, useInvoices, usePurchaseOrders } from "@hooks/index";
import type { RootStackParamList } from "@navigation/types";
import { formatLongDate } from "@services/format/date";
import { formatMoney } from "@services/format/money";
import { makeStyles, useTheme } from "@theme/index";

import { clientActionDelay, generateSignatureStrokes } from "../signature";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TONE: Record<PurchaseOrderStatus, BadgeTone> = {
  en_attente_signature: "accent",
  signe: "success",
  annule: "muted",
};

/**
 * Bon de commande detail (UC1) — the document the client signs electronically. Shows the
 * order, hosts the signature, archives the proof (with the drawn signature), and links to
 * the facture generated automatically once signed.
 */
export function BonCommandeDetailScreen() {
  const { t } = useTranslation();
  const tk = t as unknown as (key: string) => string;
  const styles = useStyles();
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const { orderId } = useRoute<RouteProp<RootStackParamList, "BonCommandeDetail">>().params;
  const { data: orders, sign } = usePurchaseOrders();
  const { data: invoices, reload: reloadInvoices } = useInvoices();
  const { data: business } = useBusiness();

  const order = (orders ?? []).find((o) => o.id === orderId);
  const invoice = (invoices ?? []).find((i) => i.id === order?.invoiceId);

  // The signature is produced automatically in the background (no pad, no button): when a
  // pending order is opened, it is signed electronically after a short delay (≤10s).
  const pending = order?.status === "en_attente_signature";
  const signerRef = useRef("");
  signerRef.current = order?.clientName ?? "";

  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => {
      sign(orderId, {
        signerName: signerRef.current || "Client",
        strokes: generateSignatureStrokes(),
      })
        .then(() => reloadInvoices())
        .catch(() => undefined);
    }, clientActionDelay());
    return () => clearTimeout(id);
  }, [pending, orderId, sign, reloadInvoices]);

  if (!order) {
    return (
      <Screen>
        <ScreenHeader
          title={t("invoicing.purchaseOrders.detailTitle")}
          onBack={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const signed = order.status === "signe";

  return (
    <Screen>
      <ScreenHeader
        title={t("invoicing.purchaseOrders.detailTitle")}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.body}>
        <Card variant="surface" style={styles.doc}>
          <View style={styles.docHead}>
            <View style={styles.docIssuer}>
              <Text variant="titleLg" color="textPrimary">
                {business?.name ?? ""}
              </Text>
              <Text variant="caption" color="textSecondary">
                {t("invoicing.purchaseOrders.docLabel")} · {order.number}
              </Text>
            </View>
            <Badge
              label={tk(`invoicing.purchaseOrders.status.${order.status}`)}
              tone={STATUS_TONE[order.status]}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.clientRow}>
            <View style={styles.clientInfo}>
              <Text variant="caption" color="textSecondary">
                {t("invoicing.preview.client")}
              </Text>
              <Text variant="bodyLg" color="textPrimary">
                {order.clientName ?? "—"}
              </Text>
              {order.clientIce ? (
                <Text variant="caption" color="textSecondary">
                  ICE · {order.clientIce}
                </Text>
              ) : null}
            </View>
            <Text variant="caption" color="textSecondary">
              {formatLongDate(order.issueDate)}
            </Text>
          </View>

          <View style={styles.lines}>
            {order.lines.map((line) => (
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
            <Text variant="titleMd" color="textPrimary">
              {t("invoicing.quotes.form.totalTTC")}
            </Text>
            <AmountText value={order.totalTTC} variant="titleMd" />
          </View>
        </Card>

        {signed && order.signature ? (
          <View style={styles.section}>
            <Text variant="label" color="textSecondary">
              {t("invoicing.purchaseOrders.signatureTitle")}
            </Text>
            <Card variant="muted" style={styles.signCard}>
              <View style={styles.signMeta}>
                <CheckCircle2 size={18} color={theme.colors.success} strokeWidth={2} />
                <View style={styles.signInfo}>
                  <Text variant="bodyLg" color="textPrimary">
                    {order.signature.signerName}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {t("invoicing.purchaseOrders.signedOn", {
                      date: formatLongDate(order.signature.signedAt),
                    })}{" "}
                    · {order.signature.reference}
                  </Text>
                </View>
              </View>
              {order.signature.strokes ? (
                <View style={styles.signPreview}>
                  <Svg width="100%" height={120}>
                    <Path
                      d={order.signature.strokes}
                      stroke={theme.colors.textPrimary}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </Svg>
                </View>
              ) : null}
            </Card>
          </View>
        ) : null}

        {invoice ? (
          <Card variant="surface" style={styles.invoiceRow}>
            <View style={styles.invoiceInfo}>
              <Text variant="bodyLg" color="textPrimary">
                {t("invoicing.purchaseOrders.invoiceGenerated", { number: invoice.number })}
              </Text>
              <Text variant="caption" color="textSecondary">
                {t("invoicing.purchaseOrders.invoiceHint")}
              </Text>
            </View>
            <Button
              variant="secondary"
              label={t("invoicing.purchaseOrders.viewInvoice")}
              leadingIcon={Receipt}
              fullWidth={false}
              onPress={() => navigation.navigate("FacturePreview", { invoiceId: invoice.id })}
            />
          </Card>
        ) : null}

        {pending ? (
          <View style={styles.signing}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
            <Text variant="bodyMd" color="textSecondary">
              {t("invoicing.purchaseOrders.signing")}
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.lg, marginTop: t.spacing.sm },
  doc: { gap: t.spacing.md },
  docHead: { flexDirection: "row", justifyContent: "space-between", gap: t.spacing.md },
  docIssuer: { flex: 1, gap: 2 },
  divider: { height: t.sizing.hairline, backgroundColor: t.colors.border },
  clientRow: { flexDirection: "row", justifyContent: "space-between", gap: t.spacing.md },
  clientInfo: { flex: 1, gap: 2 },
  lines: { gap: t.spacing.sm },
  lineRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  lineInfo: { flex: 1, gap: 2 },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  section: { gap: t.spacing.xs },
  signCard: { gap: t.spacing.md },
  signMeta: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  signInfo: { flex: 1, gap: 2 },
  signPreview: {
    height: 120,
    borderRadius: t.radii.control,
    borderWidth: t.sizing.hairline,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    overflow: "hidden",
  },
  invoiceRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  invoiceInfo: { flex: 1, gap: 2 },
  signing: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing.sm,
    paddingVertical: t.spacing.md,
  },
}));
