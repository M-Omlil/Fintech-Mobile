import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Building2, Plus, Send, Star } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";

import {
  AmountText,
  Avatar,
  Button,
  Card,
  DateField,
  Field,
  Screen,
  ScreenHeader,
  SectionHeader,
  TabPill,
  Text,
  useToast,
} from "@components/index";
import type { Beneficiary } from "@domain/index";
import { useAccounts, useBeneficiaries, useTransfers } from "@hooks/index";
import type { RootStackParamList } from "@navigation/types";
import { detectBankFromAccount, formatAccountInput } from "@services/format/bank";
import { formatLongDate } from "@services/format/date";
import { makeStyles, useTheme } from "@theme/index";

import { BeneficiarySheet } from "./components/BeneficiarySheet";

type Timing = "immediate" | "scheduled";

function parseAmount(raw: string): number {
  const value = Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function tomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Nouveau virement (Section 6.6) — the full transfer form adapted from the fintech
 * flow into Amano's design system. Beneficiary (typed or picked from favourites),
 * RIB/IBAN with an auto-detected destination bank, motif, immediate/scheduled timing,
 * and amount in dirhams. Favourites and recent transfers sit beneath the form.
 */
export function NouveauVirementScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation();
  const toast = useToast();

  const route = useRoute<RouteProp<RootStackParamList, "NouveauVirement">>();
  const sourceAccountId = route.params?.sourceAccountId;

  const { create, data: recent } = useTransfers("history");
  const { data: beneficiaries, addBeneficiary } = useBeneficiaries();
  const { data: accounts } = useAccounts();

  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [timing, setTiming] = useState<Timing>("immediate");
  const [scheduledDate, setScheduledDate] = useState<Date>(tomorrow);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const sourceAccount = useMemo(() => {
    const list = accounts ?? [];
    return list.find((a) => a.id === sourceAccountId) ?? list.find((a) => a.isMain) ?? list[0];
  }, [accounts, sourceAccountId]);

  const detectedBank = detectBankFromAccount(account);
  const value = parseAmount(amount);
  const canSubmit = name.trim().length > 0 && account.trim().length > 0 && value > 0;

  const applyBeneficiary = (beneficiary: Beneficiary) => {
    setName(beneficiary.name);
    setAccount(beneficiary.account);
    setReason(beneficiary.defaultReason ?? "");
  };

  const presets = [
    { label: t("transfers.form.presetTomorrow"), days: 1 },
    { label: t("transfers.form.presetWeek"), days: 7 },
    { label: t("transfers.form.presetMonth"), days: 30 },
  ];

  const onSubmit = async () => {
    if (!canSubmit) {
      toast.show(t("transfers.form.validationMissing"), "error");
      return;
    }
    setSaving(true);
    try {
      await create({
        beneficiary: name.trim(),
        amount: value,
        reason: reason.trim() || undefined,
        bank: detectedBank,
        account: account.trim(),
        scheduledDate: timing === "scheduled" ? scheduledDate.toISOString() : undefined,
      });
      toast.show(
        timing === "scheduled" ? t("transfers.form.toastScheduled") : t("transfers.form.toastSent"),
        "success",
      );
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const favourites = beneficiaries ?? [];

  return (
    <Screen>
      <ScreenHeader title={t("transfers.form.title")} onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <Text variant="bodyMd" color="textSecondary">
          {t("transfers.form.subtitle")}
        </Text>

        <Card variant="surface" style={styles.form}>
          {sourceAccount ? (
            <View style={styles.fromRow}>
              <Text variant="caption" color="textSecondary">
                {t("transfers.form.from")}
              </Text>
              <Text variant="label" color="textPrimary">
                {sourceAccount.name}
              </Text>
            </View>
          ) : null}

          <View style={styles.beneficiaryBlock}>
            <Field
              label={t("transfers.form.beneficiary")}
              placeholder={t("transfers.form.beneficiaryPlaceholder")}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <Button
              variant="text"
              label={t("transfers.form.choose")}
              fullWidth={false}
              onPress={() => setPickerOpen(true)}
            />
          </View>

          <View style={styles.accountBlock}>
            <Field
              label={t("transfers.form.account")}
              placeholder={t("transfers.form.accountPlaceholder")}
              value={account}
              onChangeText={(text) => setAccount(formatAccountInput(text))}
            />
            <View style={styles.detected}>
              <Building2 size={16} color={theme.colors.textSecondary} strokeWidth={1.75} />
              <Text variant="caption" color="textSecondary">
                {account.trim().length === 0
                  ? t("transfers.form.accountHint")
                  : detectedBank
                    ? t("transfers.form.bankDetected", { bank: detectedBank })
                    : t("transfers.form.bankPending")}
              </Text>
            </View>
          </View>

          <Field
            label={t("transfers.form.reason")}
            placeholder={t("transfers.form.reasonPlaceholder")}
            value={reason}
            onChangeText={setReason}
            autoCapitalize="sentences"
          />

          <View style={styles.timingBlock}>
            <Text variant="label" color="textSecondary">
              {t("transfers.form.timing")}
            </Text>
            <TabPill
              value={timing}
              onChange={(key) => setTiming(key as Timing)}
              segments={[
                { key: "immediate", label: t("transfers.form.immediate") },
                { key: "scheduled", label: t("transfers.form.scheduled") },
              ]}
            />
          </View>

          {timing === "scheduled" ? (
            <DateField
              label={t("transfers.form.executionDate")}
              value={scheduledDate}
              onChange={setScheduledDate}
              confirmLabel={t("transfers.form.executionConfirm")}
              presets={presets}
              minimumDate={tomorrow()}
            />
          ) : null}

          <Field
            label={t("transfers.form.amount")}
            placeholder="0,00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <Button
            label={saving ? t("transfers.form.submitting") : t("transfers.form.submit")}
            leadingIcon={Send}
            onPress={onSubmit}
            loading={saving}
            disabled={!canSubmit}
          />
        </Card>

        <View style={styles.section}>
          <SectionHeader title={t("transfers.form.favorites")} />
          <Card variant="surface">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favRow}
            >
              {favourites.map((beneficiary) => (
                <Pressable
                  key={beneficiary.id}
                  onPress={() => applyBeneficiary(beneficiary)}
                  accessibilityRole="button"
                  accessibilityLabel={beneficiary.name}
                  style={({ pressed }) => [styles.favItem, pressed && styles.pressed]}
                >
                  <Avatar name={beneficiary.name} />
                  <Text variant="caption" color="textSecondary" numberOfLines={1}>
                    {beneficiary.name.split(" ")[0]}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => setPickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={t("transfers.picker.add")}
                style={({ pressed }) => [styles.favItem, pressed && styles.pressed]}
              >
                <View style={styles.favAdd}>
                  <Plus size={20} color={theme.colors.accent} strokeWidth={2} />
                </View>
                <Text variant="caption" color="textSecondary" numberOfLines={1}>
                  {t("transfers.form.addFavorite")}
                </Text>
              </Pressable>
            </ScrollView>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t("transfers.form.recent")} />
          <Card variant="surface" style={styles.recentCard}>
            {recent && recent.length > 0 ? (
              recent.slice(0, 3).map((transfer) => (
                <View key={transfer.id} style={styles.recentRow}>
                  <Star size={16} color={theme.colors.accent} strokeWidth={1.75} />
                  <View style={styles.recentText}>
                    <Text variant="titleMd" color="textPrimary" numberOfLines={1}>
                      {transfer.beneficiary}
                    </Text>
                    <Text variant="caption" color="textSecondary" numberOfLines={1}>
                      {transfer.reference ?? formatLongDate(transfer.date)}
                    </Text>
                  </View>
                  <AmountText value={-transfer.amount} signed variant="titleMd" color="danger" />
                </View>
              ))
            ) : (
              <Text variant="bodyMd" color="textSecondary">
                {t("transfers.form.recentEmpty")}
              </Text>
            )}
          </Card>
        </View>
      </View>

      <BeneficiarySheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        beneficiaries={favourites}
        onSelect={applyBeneficiary}
        onAdd={addBeneficiary}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.lg, marginTop: t.spacing.xs },
  form: { gap: t.spacing.lg },
  fromRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.spacing.sm,
  },
  beneficiaryBlock: { gap: t.spacing.xs },
  accountBlock: { gap: t.spacing.sm },
  detected: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  timingBlock: { gap: t.spacing.xs },
  section: { gap: t.spacing.xs },
  favRow: { flexDirection: "row", gap: t.spacing.lg, alignItems: "flex-start" },
  favItem: { alignItems: "center", gap: t.spacing.xs, width: 64 },
  favAdd: {
    width: t.sizing.iconTile,
    height: t.sizing.iconTile,
    borderRadius: t.radii.control,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: t.sizing.hairline,
    borderColor: t.colors.accent,
    backgroundColor: t.colors.surfaceAccent,
  },
  pressed: { opacity: 0.6 },
  recentCard: { gap: t.spacing.md },
  recentRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  recentText: { flex: 1, gap: 2 },
}));
