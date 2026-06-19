import { Building2, Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";

import { Avatar, Button, Field, Sheet, Text } from "@components/index";
import type { NewBeneficiaryInput } from "@data/repositories/index";
import type { Beneficiary } from "@domain/index";
import { detectBankFromAccount, formatAccountInput } from "@services/format/bank";
import { makeStyles, useTheme } from "@theme/index";

export type BeneficiarySheetProps = {
  visible: boolean;
  onClose: () => void;
  beneficiaries: Beneficiary[];
  onSelect: (beneficiary: Beneficiary) => void;
  onAdd: (input: NewBeneficiaryInput) => Promise<Beneficiary>;
};

/**
 * Beneficiary picker + creation in one sheet (Section 6.6). Picking pre-fills the
 * transfer form; adding captures only name + RIB/IBAN — the destination bank is
 * resolved automatically from the account number, never chosen by hand.
 */
export function BeneficiarySheet({
  visible,
  onClose,
  beneficiaries,
  onSelect,
  onAdd,
}: BeneficiarySheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();

  const [mode, setMode] = useState<"list" | "add">("list");
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [saving, setSaving] = useState(false);

  // Always reopen on the list; clear any half-typed beneficiary.
  useEffect(() => {
    if (visible) {
      setMode("list");
      setName("");
      setAccount("");
    }
  }, [visible]);

  const detectedBank = detectBankFromAccount(account);
  const canAdd = name.trim().length > 0 && account.trim().length > 0;

  const handleAdd = async () => {
    if (!canAdd) return;
    setSaving(true);
    try {
      const created = await onAdd({
        name: name.trim(),
        account: account.trim(),
        bank: detectedBank ?? "",
      });
      onSelect(created);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "add" ? t("transfers.newBeneficiary.title") : t("transfers.picker.title");

  const footer =
    mode === "add" ? (
      <View style={styles.footer}>
        <Button
          variant="secondary"
          label={t("transfers.newBeneficiary.cancel")}
          fullWidth={false}
          style={styles.footerBtn}
          onPress={() => setMode("list")}
        />
        <Button
          label={t("transfers.newBeneficiary.add")}
          leadingIcon={Building2}
          fullWidth={false}
          style={styles.footerBtn}
          loading={saving}
          disabled={!canAdd}
          onPress={handleAdd}
        />
      </View>
    ) : undefined;

  return (
    <Sheet visible={visible} onClose={onClose} title={title} footer={footer}>
      {mode === "list" ? (
        <View style={styles.list}>
          <Pressable
            onPress={() => setMode("add")}
            accessibilityRole="button"
            accessibilityLabel={t("transfers.picker.add")}
            style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
          >
            <Plus size={18} color={theme.colors.accent} strokeWidth={2} />
            <Text variant="label" color="accent">
              {t("transfers.picker.add")}
            </Text>
          </Pressable>

          {beneficiaries.length > 0 ? (
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
              {beneficiaries.map((beneficiary) => (
                <Pressable
                  key={beneficiary.id}
                  onPress={() => {
                    onSelect(beneficiary);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={beneficiary.name}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                  <Avatar name={beneficiary.name} size={theme.sizing.iconTile} />
                  <View style={styles.rowText}>
                    <Text variant="titleMd" color="textPrimary" numberOfLines={1}>
                      {beneficiary.name}
                    </Text>
                    <Text variant="caption" color="textSecondary" numberOfLines={1}>
                      {beneficiary.account}
                    </Text>
                    {beneficiary.bank ? (
                      <Text variant="caption" color="textSecondary" numberOfLines={1}>
                        {beneficiary.bank}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text variant="bodyMd" color="textSecondary" style={styles.empty}>
              {t("transfers.picker.empty")}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.form}>
          <Text variant="caption" color="textSecondary">
            {t("transfers.newBeneficiary.subtitle")}
          </Text>
          <Field
            label={t("transfers.newBeneficiary.name")}
            placeholder={t("transfers.newBeneficiary.namePlaceholder")}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Field
            label={t("transfers.newBeneficiary.account")}
            placeholder={t("transfers.form.accountPlaceholder")}
            value={account}
            onChangeText={(text) => setAccount(formatAccountInput(text))}
          />
          <View style={styles.detected}>
            <Building2 size={16} color={theme.colors.textSecondary} strokeWidth={1.75} />
            <Text variant="caption" color="textSecondary">
              {detectedBank
                ? t("transfers.form.bankDetected", { bank: detectedBank })
                : t("transfers.form.bankPending")}
            </Text>
          </View>
        </View>
      )}
    </Sheet>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.sm },
  scroll: { maxHeight: 360 },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing.sm,
    paddingVertical: t.spacing.md,
    borderRadius: t.radii.control,
    borderWidth: t.sizing.hairline,
    borderColor: t.colors.accent,
    backgroundColor: t.colors.surfaceAccent,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
    paddingVertical: t.spacing.sm,
  },
  rowText: { flex: 1, gap: 2 },
  empty: { textAlign: "center", paddingVertical: t.spacing.lg },
  pressed: { opacity: 0.6 },
  form: { gap: t.spacing.md, paddingBottom: t.spacing.md },
  detected: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  footer: { flexDirection: "row", gap: t.spacing.md },
  footerBtn: { flex: 1 },
}));
