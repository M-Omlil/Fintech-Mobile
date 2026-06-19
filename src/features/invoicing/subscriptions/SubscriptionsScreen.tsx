import { useNavigation } from "@react-navigation/native";
import { Plus, RefreshCcw } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AmountText,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  IconTile,
  Screen,
  ScreenHeader,
  Sheet,
  TabPill,
  Text,
  useToast,
  type BadgeTone,
} from "@components/index";
import type { BillingCycle, Subscription, SubscriptionStatus } from "@domain/index";
import { useSubscriptions } from "@hooks/index";
import { formatLongDate } from "@services/format/date";
import { makeStyles } from "@theme/index";

const STATUS_TONE: Record<SubscriptionStatus, BadgeTone> = {
  active: "success",
  paused: "muted",
  cancelled: "danger",
};

/** Monthly-equivalent cost of an active subscription. */
function monthlyEquivalent(sub: Subscription): number {
  if (sub.status !== "active") return 0;
  return sub.cycle === "yearly" ? sub.amount / 12 : sub.amount;
}

/** Abonnements manager — track and manage all recurring subscriptions in one place. */
export function SubscriptionsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation();
  const toast = useToast();
  const { data: subscriptions, add, setStatus, remove } = useSubscriptions();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [saving, setSaving] = useState(false);

  const total = useMemo(
    () => (subscriptions ?? []).reduce((sum, sub) => sum + monthlyEquivalent(sub), 0),
    [subscriptions],
  );

  const tk = t as unknown as (key: string) => string;
  const cycleLabel = (c: BillingCycle) =>
    c === "yearly"
      ? t("invoicing.subscriptions.cycleYearly")
      : t("invoicing.subscriptions.cycleMonthly");

  const onAdd = async () => {
    const value = Number.parseFloat(amount.replace(",", "."));
    if (!name.trim() || !Number.isFinite(value) || value <= 0) return;
    setSaving(true);
    try {
      await add({ name: name.trim(), amount: value, cycle });
      toast.show(t("invoicing.subscriptions.toastAdded"));
      setName("");
      setAmount("");
      setCycle("monthly");
      setSheetOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const hasSubs = subscriptions && subscriptions.length > 0;

  return (
    <Screen scroll={hasSubs}>
      <ScreenHeader
        title={t("invoicing.subscriptions.title")}
        onBack={() => navigation.goBack()}
        rightActions={
          <IconButton
            icon={Plus}
            variant="surface"
            size={40}
            label={t("invoicing.subscriptions.add")}
            onPress={() => setSheetOpen(true)}
          />
        }
      />

      {hasSubs ? (
        <View style={styles.body}>
          <Card variant="dark" style={styles.totalCard}>
            <View style={styles.totalLeft}>
              <Text variant="label" color="textOnDark">
                {t("invoicing.subscriptions.monthlyTotal")}
              </Text>
              <Text variant="caption" color="textOnDark" style={styles.totalSub}>
                {t("invoicing.subscriptions.perMonthEq")}
              </Text>
            </View>
            <AmountText value={total} variant="numericLg" color="textOnDark" />
          </Card>

          {subscriptions.map((sub) => (
            <Card key={sub.id} variant="surface" style={styles.subCard}>
              <View style={styles.subTop}>
                <IconTile icon={RefreshCcw} tint={sub.status === "active" ? "blue" : "navy"} />
                <View style={styles.subInfo}>
                  <Text variant="titleMd" color="textPrimary" numberOfLines={1}>
                    {sub.name}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {cycleLabel(sub.cycle)} ·{" "}
                    {t("invoicing.subscriptions.nextRenewal", {
                      date: formatLongDate(sub.nextRenewal),
                    })}
                  </Text>
                </View>
                <View style={styles.subRight}>
                  <AmountText value={sub.amount} variant="titleMd" />
                  <Badge
                    label={tk(`invoicing.subscriptions.status.${sub.status}`)}
                    tone={STATUS_TONE[sub.status]}
                  />
                </View>
              </View>

              <View style={styles.actions}>
                {sub.status === "active" ? (
                  <Button
                    variant="secondary"
                    label={t("invoicing.subscriptions.pause")}
                    fullWidth={false}
                    style={styles.actionBtn}
                    onPress={() => {
                      setStatus(sub.id, "paused");
                      toast.show(t("invoicing.subscriptions.toastPaused"));
                    }}
                  />
                ) : sub.status === "paused" ? (
                  <Button
                    variant="primary"
                    label={t("invoicing.subscriptions.resume")}
                    fullWidth={false}
                    style={styles.actionBtn}
                    onPress={() => {
                      setStatus(sub.id, "active");
                      toast.show(t("invoicing.subscriptions.toastResumed"));
                    }}
                  />
                ) : null}
                {sub.status !== "cancelled" ? (
                  <Button
                    variant="text"
                    label={t("invoicing.subscriptions.cancel")}
                    fullWidth={false}
                    onPress={() => {
                      setStatus(sub.id, "cancelled");
                      toast.show(t("invoicing.subscriptions.toastCancelled"));
                    }}
                  />
                ) : (
                  <Button
                    variant="text"
                    label={t("invoicing.subscriptions.remove")}
                    fullWidth={false}
                    onPress={() => {
                      remove(sub.id);
                      toast.show(t("invoicing.subscriptions.toastRemoved"));
                    }}
                  />
                )}
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          illustration={<IconTile icon={RefreshCcw} tint="blue" size={64} />}
          title={t("invoicing.subscriptions.emptyTitle")}
          body={t("invoicing.subscriptions.emptyBody")}
          primaryAction={{
            label: t("invoicing.subscriptions.add"),
            onPress: () => setSheetOpen(true),
          }}
        />
      )}

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("invoicing.subscriptions.add")}
      >
        <View style={styles.form}>
          <Field
            label={t("invoicing.subscriptions.formName")}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Field
            label={t("invoicing.subscriptions.formAmount")}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <TabPill
            value={cycle}
            onChange={(key) => setCycle(key as BillingCycle)}
            segments={[
              { key: "monthly", label: t("invoicing.subscriptions.formCycleMonthly") },
              { key: "yearly", label: t("invoicing.subscriptions.formCycleYearly") },
            ]}
          />
          <Button
            label={t("invoicing.subscriptions.add")}
            onPress={onAdd}
            loading={saving}
            disabled={!name.trim() || !amount.trim()}
          />
        </View>
      </Sheet>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.md, marginTop: t.spacing.md },
  totalCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLeft: { gap: 2 },
  totalSub: { opacity: 0.7 },
  subCard: { gap: t.spacing.md },
  subTop: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  subInfo: { flex: 1, gap: 2 },
  subRight: { alignItems: "flex-end", gap: t.spacing.xs },
  actions: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  actionBtn: { flex: 1 },
  form: { gap: t.spacing.md, paddingBottom: t.spacing.md },
}));
