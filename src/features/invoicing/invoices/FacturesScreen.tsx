import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Check, Download, Plus, Receipt, Send } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AmountText,
  Badge,
  Card,
  EmptyState,
  IconButton,
  IconTile,
  Screen,
  ScreenHeader,
  TabPill,
  Text,
  useToast,
  type BadgeTone,
} from "@components/index";
import type { Invoice, InvoiceStatus } from "@domain/index";
import { useBusiness, useInvoices } from "@hooks/index";
import { exportInvoiceDocument } from "@services/export/invoiceDocument";
import { formatLongDate } from "@services/format/date";
import { makeStyles } from "@theme/index";
import type { TintName } from "@theme/theme";

type Nav = NativeStackNavigationProp<import("@navigation/types").RootStackParamList>;
type FactureTab = "all" | "pending" | "paid";

const STATUS_TONE: Record<InvoiceStatus, BadgeTone> = {
  brouillon: "muted",
  envoyee: "accent",
  payee: "success",
  en_retard: "danger",
  annulee: "muted",
};

/** Status colour on the list icon — blue (en attente), red (en retard), green (réglé). */
const STATUS_TINT: Record<InvoiceStatus, TintName> = {
  brouillon: "blue",
  envoyee: "blue",
  payee: "green",
  en_retard: "red",
  annulee: "navy",
};

/** Effective status: an unpaid invoice past its due date reads as "en_retard". */
function effectiveStatus(invoice: Invoice): InvoiceStatus {
  const unpaid = invoice.status === "brouillon" || invoice.status === "envoyee";
  if (unpaid && new Date(invoice.dueDate) < new Date()) return "en_retard";
  return invoice.status;
}

/** Facturation list (mega-prompt §6 — Facture flow). */
export function FacturesScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const { data: invoices, setInvoiceStatus } = useInvoices();
  const { data: business } = useBusiness();
  const toast = useToast();
  const [tab, setTab] = useState<FactureTab>("all");

  const totals = useMemo(() => {
    const list = invoices ?? [];
    const pending = list.filter(
      (i) => effectiveStatus(i) === "envoyee" || i.status === "brouillon",
    );
    const overdue = list.filter((i) => effectiveStatus(i) === "en_retard");
    const paid = list.filter((i) => i.status === "payee");
    const sum = (arr: Invoice[]) => arr.reduce((s, i) => s + i.totalTTC, 0);
    return { pending: sum(pending), overdue: sum(overdue), paid: sum(paid) };
  }, [invoices]);

  const visible = useMemo(() => {
    const list = invoices ?? [];
    if (tab === "paid") return list.filter((i) => i.status === "payee");
    if (tab === "pending")
      return list.filter((i) => i.status !== "payee" && i.status !== "annulee");
    return list;
  }, [invoices, tab]);

  const tk = t as unknown as (key: string) => string;

  return (
    <Screen>
      <ScreenHeader
        title={t("invoicing.invoices.title")}
        rightActions={
          <IconButton
            icon={Plus}
            variant="surface"
            size={40}
            label={t("invoicing.invoices.create")}
            onPress={() => navigation.navigate("NouvelleFacture")}
          />
        }
      />

      <View style={styles.summary}>
        <Card variant="muted" style={styles.summaryCard}>
          <Text variant="caption" color="textSecondary">
            {t("invoicing.invoices.summaryPending")}
          </Text>
          <AmountText value={totals.pending} variant="titleMd" />
        </Card>
        <Card variant="muted" style={styles.summaryCard}>
          <Text variant="caption" color="danger">
            {t("invoicing.invoices.summaryOverdue")}
          </Text>
          <AmountText value={totals.overdue} variant="titleMd" color="danger" />
        </Card>
        <Card variant="muted" style={styles.summaryCard}>
          <Text variant="caption" color="success">
            {t("invoicing.invoices.summaryPaid")}
          </Text>
          <AmountText value={totals.paid} variant="titleMd" color="success" />
        </Card>
      </View>

      <TabPill
        style={styles.tabs}
        value={tab}
        onChange={(key) => setTab(key as FactureTab)}
        segments={[
          { key: "all", label: t("invoicing.invoices.tabAll") },
          { key: "pending", label: t("invoicing.invoices.tabPending") },
          { key: "paid", label: t("invoicing.invoices.tabPaid") },
        ]}
      />

      {visible.length > 0 ? (
        <View style={styles.list}>
          {visible.map((invoice) => {
            const eff = effectiveStatus(invoice);
            return (
              <Card key={invoice.id} variant="surface" style={styles.invoiceCard}>
                <View style={styles.invoiceTop}>
                  <IconTile icon={Receipt} tint={STATUS_TINT[eff]} />
                  <View style={styles.invoiceInfo}>
                    <Text variant="titleMd" color="textPrimary">
                      {invoice.clientName ?? invoice.number}
                    </Text>
                    <Text variant="caption" color="textSecondary">
                      {invoice.number} · {formatLongDate(invoice.dueDate)}
                    </Text>
                  </View>
                  <View style={styles.invoiceRight}>
                    <AmountText value={invoice.totalTTC} variant="titleMd" />
                    <Badge label={tk(`invoicing.invoices.status.${eff}`)} tone={STATUS_TONE[eff]} />
                  </View>
                </View>
                <View style={styles.actions}>
                  {invoice.status === "brouillon" ? (
                    <IconButton
                      icon={Send}
                      variant="surface"
                      size={48}
                      label={t("invoicing.invoices.markSent")}
                      onPress={() => {
                        setInvoiceStatus(invoice.id, "envoyee");
                        toast.show(t("invoicing.invoices.toastSent"));
                      }}
                    />
                  ) : invoice.status !== "payee" && invoice.status !== "annulee" ? (
                    <IconButton
                      icon={Check}
                      variant="dark"
                      size={48}
                      animateOnPress
                      label={t("invoicing.invoices.markPaid")}
                      onPress={() => {
                        setInvoiceStatus(invoice.id, "payee");
                        toast.show(t("invoicing.invoices.toastPaid"));
                      }}
                    />
                  ) : null}
                  <IconButton
                    icon={Download}
                    variant="surface"
                    size={48}
                    label={t("invoicing.invoices.export")}
                    onPress={() => {
                      if (business) {
                        exportInvoiceDocument(business, invoice).catch(() => undefined);
                        toast.show(t("invoicing.invoices.toastExport"));
                      }
                    }}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <View style={styles.empty}>
          <EmptyState
            illustration={<IconTile icon={Receipt} tint="violet" size={64} />}
            title={t("invoicing.invoices.emptyTitle")}
            body={t("invoicing.invoices.emptyBody")}
            primaryAction={{
              label: t("invoicing.invoices.create"),
              onPress: () => navigation.navigate("NouvelleFacture"),
            }}
          />
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  summary: { flexDirection: "row", gap: t.spacing.sm, marginTop: t.spacing.md },
  summaryCard: { flex: 1, gap: t.spacing.xs },
  tabs: { marginVertical: t.spacing.md },
  list: { gap: t.spacing.md },
  invoiceCard: { gap: t.spacing.md },
  invoiceTop: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  invoiceInfo: { flex: 1, gap: 2 },
  invoiceRight: { alignItems: "flex-end", gap: t.spacing.xs },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: t.spacing.sm,
  },
  empty: { flex: 1, minHeight: 320 },
}));
