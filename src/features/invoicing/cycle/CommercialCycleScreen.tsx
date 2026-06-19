import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CheckCircle2, Circle, CircleDot, ShieldCheck } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import {
  AmountText,
  Badge,
  Button,
  Card,
  Screen,
  ScreenHeader,
  Text,
  useToast,
  type BadgeTone,
} from "@components/index";
import type { PaymentMethodKind } from "@domain/index";
import { useCommercialCycle } from "@hooks/index";
import type { RootStackParamList } from "@navigation/types";
import { formatLongDate } from "@services/format/date";
import { makeStyles, useTheme } from "@theme/index";

import { clientActionDelay, generateSignatureStrokes } from "../signature";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAYMENT_KINDS: PaymentMethodKind[] = ["rib", "payment_link", "cashplus", "especes", "cheque"];

type StepStatus = "done" | "active" | "pending";

/**
 * Cycle commercial (UC1) — the centralised, automated chain from a validated devis to the
 * encaissement: validation → bon de commande → signature électronique → facture → mode de
 * paiement → paiement rapproché. Each step advances the persisted state and reveals the
 * next action.
 */
export function CommercialCycleScreen() {
  const { t } = useTranslation();
  const tk = t as unknown as (key: string) => string;
  const styles = useStyles();
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const toast = useToast();

  const { quoteId } = useRoute<RouteProp<RootStackParamList, "CommercialCycle">>().params;
  const { loading, quote, order, invoice, validateQuote, sign, choosePayment, pay, reload } =
    useCommercialCycle(quoteId);

  // Re-read whenever the screen regains focus.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const [busy, setBusy] = useState(false);
  const [methods, setMethods] = useState<PaymentMethodKind[]>(["rib"]);

  const hasOrder = !!order;
  const signed = order?.status === "signe";
  const hasInvoice = !!invoice;
  const paymentChosen = (invoice?.paymentMethods?.length ?? 0) > 0;
  const paid = invoice?.status === "payee";
  const quoteLoaded = !!quote;

  // Latest values for the background timers, kept in refs so the timer effects never churn.
  const signerRef = useRef("");
  signerRef.current = order?.clientName ?? quote?.clientName ?? "";
  const firstMethodRef = useRef<PaymentMethodKind | undefined>(undefined);
  firstMethodRef.current = invoice?.paymentMethods?.[0];

  // Step 2 — the client validates the devis on their side (≤10s) → bon de commande (auto).
  useEffect(() => {
    if (loading || hasOrder || !quoteLoaded) return;
    const id = setTimeout(() => validateQuote().catch(() => undefined), clientActionDelay());
    return () => clearTimeout(id);
  }, [loading, hasOrder, quoteLoaded, validateQuote]);

  // Step 5 — the bon de commande is signed electronically in the background → facture (auto).
  useEffect(() => {
    if (!hasOrder || signed) return;
    const id = setTimeout(() => {
      sign({
        signerName: signerRef.current || "Client",
        strokes: generateSignatureStrokes(),
      }).catch(() => undefined);
    }, clientActionDelay());
    return () => clearTimeout(id);
  }, [hasOrder, signed, sign]);

  // Step 9 — once the modalities are set, the client pays (≤10s) → encaissement (auto).
  useEffect(() => {
    if (!paymentChosen || paid) return;
    const id = setTimeout(() => {
      const method = firstMethodRef.current;
      if (method) pay(method).catch(() => undefined);
    }, clientActionDelay());
    return () => clearTimeout(id);
  }, [paymentChosen, paid, pay]);

  const toggleMethod = (kind: PaymentMethodKind) =>
    setMethods((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]));

  const onConfirmPayment = () => {
    setBusy(true);
    choosePayment(methods)
      .then(() => toast.show(t("invoicing.cycle.toastPaymentSet"), "success"))
      .finally(() => setBusy(false));
  };

  const overall = useMemo((): { label: string; tone: BadgeTone } => {
    if (paid) return { label: t("invoicing.cycle.badgePaid"), tone: "success" };
    if (hasInvoice) return { label: t("invoicing.cycle.badgeInvoiced"), tone: "accent" };
    if (signed) return { label: t("invoicing.cycle.badgeSigned"), tone: "accent" };
    if (hasOrder) return { label: t("invoicing.cycle.badgeToSign"), tone: "muted" };
    return { label: t("invoicing.cycle.badgeToValidate"), tone: "muted" };
  }, [paid, hasInvoice, signed, hasOrder, t]);

  if (loading || !quote) {
    return (
      <Screen>
        <ScreenHeader title={t("invoicing.cycle.title")} onBack={() => navigation.goBack()} />
        <View style={styles.loader}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      </Screen>
    );
  }

  const clientName = quote.clientName ?? order?.clientName ?? "—";

  return (
    <Screen>
      <ScreenHeader title={t("invoicing.cycle.title")} onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <Card variant="surface" style={styles.docCard}>
          <View style={styles.docTop}>
            <View style={styles.docInfo}>
              <Text variant="titleMd" color="textPrimary" numberOfLines={1}>
                {clientName}
              </Text>
              <Text variant="caption" color="textSecondary">
                {quote.number}
                {order ? ` · ${order.number}` : ""}
                {invoice ? ` · ${invoice.number}` : ""}
              </Text>
            </View>
            <View style={styles.docRight}>
              <AmountText value={quote.totalTTC} variant="titleMd" />
              <Badge label={overall.label} tone={overall.tone} />
            </View>
          </View>
        </Card>

        <Card variant="surface" style={styles.steps}>
          <Step
            status="done"
            title={t("invoicing.cycle.stepQuote")}
            subtitle={t("invoicing.cycle.stepQuoteSub", { date: formatLongDate(quote.issueDate) })}
          />

          <Step
            status={hasOrder ? "done" : "active"}
            title={t("invoicing.cycle.stepValidate")}
            subtitle={
              hasOrder
                ? t("invoicing.cycle.stepValidateDone")
                : t("invoicing.cycle.stepValidatePending")
            }
          >
            {!hasOrder ? <Waiting label={t("invoicing.cycle.waitValidation")} /> : null}
          </Step>

          <Step
            status={hasOrder ? "done" : "pending"}
            title={t("invoicing.cycle.stepOrder")}
            subtitle={
              order ? t("invoicing.cycle.stepOrderSent") : t("invoicing.cycle.stepOrderPending")
            }
          />

          <Step
            status={signed ? "done" : hasOrder ? "active" : "pending"}
            title={t("invoicing.cycle.stepSign")}
            subtitle={
              signed ? t("invoicing.cycle.stepSignDone") : t("invoicing.cycle.stepSignPending")
            }
          >
            {hasOrder && !signed ? <Waiting label={t("invoicing.cycle.waitSignature")} /> : null}
          </Step>

          <Step
            status={signed ? "done" : "pending"}
            title={t("invoicing.cycle.stepSigned")}
            subtitle={
              order?.signature
                ? t("invoicing.cycle.stepSignedProof", {
                    ref: order.signature.reference,
                    name: order.signature.signerName,
                  })
                : t("invoicing.cycle.stepSignedPending")
            }
          />

          <Step
            status={hasInvoice ? "done" : "pending"}
            title={t("invoicing.cycle.stepInvoice")}
            subtitle={
              invoice
                ? t("invoicing.cycle.stepInvoiceDone", { number: invoice.number })
                : t("invoicing.cycle.stepInvoicePending")
            }
          />

          <Step
            status={paymentChosen ? "done" : hasInvoice ? "active" : "pending"}
            title={t("invoicing.cycle.stepPayment")}
            subtitle={
              paymentChosen
                ? (invoice?.paymentMethods ?? [])
                    .map((k) => tk(`invoicing.invoices.payment.${k}`))
                    .join(" · ")
                : t("invoicing.cycle.stepPaymentPending")
            }
          >
            {hasInvoice && !paymentChosen ? (
              <View style={styles.actionCol}>
                <View style={styles.chips}>
                  {PAYMENT_KINDS.map((kind) => {
                    const active = methods.includes(kind);
                    return (
                      <Pressable
                        key={kind}
                        onPress={() => toggleMethod(kind)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={tk(`invoicing.invoices.payment.${kind}`)}
                        style={({ pressed }) => [
                          styles.chip,
                          active && styles.chipActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text variant="label" color={active ? "textOnPrimary" : "textSecondary"}>
                          {tk(`invoicing.invoices.payment.${kind}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Button
                  variant="primary"
                  label={t("invoicing.cycle.actionPayment")}
                  loading={busy}
                  disabled={methods.length === 0}
                  onPress={onConfirmPayment}
                />
              </View>
            ) : null}
          </Step>

          <Step
            status={paid ? "done" : paymentChosen ? "active" : "pending"}
            title={t("invoicing.cycle.stepPaid")}
            subtitle={
              paid
                ? t("invoicing.cycle.stepPaidDone", {
                    method: invoice?.paidMethod
                      ? tk(`invoicing.invoices.payment.${invoice.paidMethod}`)
                      : "",
                  })
                : t("invoicing.cycle.stepPaidPending")
            }
            last
          >
            {paymentChosen && !paid ? <Waiting label={t("invoicing.cycle.waitPayment")} /> : null}
          </Step>
        </Card>

        {paid ? (
          <Card variant="muted" style={styles.doneCard}>
            <ShieldCheck size={20} color={theme.colors.success} strokeWidth={2} />
            <Text variant="bodyMd" color="textPrimary">
              {t("invoicing.cycle.completed")}
            </Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

type StepProps = {
  status: StepStatus;
  title: string;
  subtitle: string;
  last?: boolean;
  children?: React.ReactNode;
};

/** Inline "the client is acting…" indicator shown on an auto-advancing step (no button). */
function Waiting({ label }: { label: string }) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View style={styles.waiting}>
      <ActivityIndicator size="small" color={theme.colors.accent} />
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

/** One row of the vertical cycle stepper: status dot + connector + content + action. */
function Step({ status, title, subtitle, last, children }: StepProps) {
  const styles = useStyles();
  const theme = useTheme();

  const dot =
    status === "done" ? (
      <CheckCircle2 size={22} color={theme.colors.success} strokeWidth={2} />
    ) : status === "active" ? (
      <CircleDot size={22} color={theme.colors.accent} strokeWidth={2} />
    ) : (
      <Circle size={22} color={theme.colors.border} strokeWidth={2} />
    );

  return (
    <View style={styles.step}>
      <View style={styles.rail}>
        {dot}
        {!last ? (
          <View
            style={[
              styles.connector,
              status === "done" && { backgroundColor: theme.colors.success },
            ]}
          />
        ) : null}
      </View>
      <View style={styles.stepContent}>
        <Text variant="titleMd" color={status === "pending" ? "textSecondary" : "textPrimary"}>
          {title}
        </Text>
        <Text variant="caption" color="textSecondary">
          {subtitle}
        </Text>
        {children ? <View style={styles.stepAction}>{children}</View> : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.lg, marginTop: t.spacing.sm },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  docCard: { gap: t.spacing.sm },
  docTop: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  docInfo: { flex: 1, gap: 2 },
  docRight: { alignItems: "flex-end", gap: t.spacing.xs },
  steps: { gap: 0 },
  step: { flexDirection: "row", gap: t.spacing.md },
  rail: { alignItems: "center", width: 22 },
  connector: {
    flex: 1,
    width: t.sizing.hairline + 1,
    backgroundColor: t.colors.border,
    marginVertical: t.spacing.xs,
  },
  stepContent: { flex: 1, paddingBottom: t.spacing.lg, gap: 2 },
  stepAction: { marginTop: t.spacing.sm },
  actionCol: { gap: t.spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm },
  chip: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surfaceMuted,
  },
  chipActive: { backgroundColor: t.colors.primary },
  pressed: { opacity: 0.6 },
  waiting: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  doneCard: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
}));
