import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Chip, SectionHeader } from "@components/index";
import type { TransactionFilter } from "@data/repositories/index";
import type { ReceiptState, TransactionStatus } from "@domain/index";
import { useAccounts } from "@hooks/index";
import { makeStyles } from "@theme/index";

export type FilterSheetContentProps = {
  initial: TransactionFilter;
  onApply: (filter: TransactionFilter) => void;
};

const STATUS_OPTIONS: TransactionStatus[] = ["executed", "pending", "refused"];
const RECEIPT_OPTIONS: ReceiptState[] = ["missing", "added"];

/**
 * Filter sheet body (mega-prompt §4 — Filtrer par compte / Statut / Justificatifs).
 * Toggle chips build a `TransactionFilter`; "Appliquer" commits it.
 */
export function FilterSheetContent({ initial, onApply }: FilterSheetContentProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const { data: accounts } = useAccounts();

  const [accountId, setAccountId] = useState<string | undefined>(initial.accountId);
  const [status, setStatus] = useState<TransactionStatus | undefined>(initial.status);
  const [receipt, setReceipt] = useState<ReceiptState | undefined>(initial.receipt);

  const statusLabel: Record<TransactionStatus, string> = {
    executed: t("transactions.filter.statusExecuted"),
    pending: t("transactions.filter.statusPending"),
    refused: t("transactions.filter.statusRefused"),
  };
  const receiptLabel: Record<ReceiptState, string> = {
    none: "",
    missing: t("transactions.filter.receiptsMissing"),
    added: t("transactions.filter.receiptsAdded"),
  };

  const toggle = <T,>(current: T | undefined, value: T): T | undefined =>
    current === value ? undefined : value;

  return (
    <View style={styles.root}>
      <SectionHeader title={t("transactions.filter.account")} />
      <View style={styles.chips}>
        <Chip
          label={t("transactions.filter.allAccounts")}
          selected={accountId === undefined}
          onPress={() => setAccountId(undefined)}
        />
        {(accounts ?? []).map((account) => (
          <Chip
            key={account.id}
            label={account.name}
            selected={accountId === account.id}
            onPress={() => setAccountId((current) => toggle(current, account.id))}
          />
        ))}
      </View>

      <SectionHeader title={t("transactions.filter.status")} />
      <View style={styles.chips}>
        {STATUS_OPTIONS.map((option) => (
          <Chip
            key={option}
            label={statusLabel[option]}
            selected={status === option}
            onPress={() => setStatus((current) => toggle(current, option))}
          />
        ))}
      </View>

      <SectionHeader title={t("transactions.filter.receipts")} />
      <View style={styles.chips}>
        {RECEIPT_OPTIONS.map((option) => (
          <Chip
            key={option}
            label={receiptLabel[option]}
            selected={receipt === option}
            onPress={() => setReceipt((current) => toggle(current, option))}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          variant="primary"
          label={t("common.apply")}
          onPress={() => onApply({ accountId, status, receipt })}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: t.spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm, paddingBottom: t.spacing.md },
  footer: { paddingTop: t.spacing.sm },
}));
