import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";

import { AmountText, IconTile, ListItem } from "@components/index";
import type { Transaction } from "@domain/index";
import { formatLongDate } from "@services/format/date";

export type TransactionRowProps = {
  transaction: Transaction;
  onPress?: () => void;
};

/** A single transaction row (Sections 6.2 / 6.3) — reused across Home and the list. */
export function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const { t } = useTranslation();
  const isCredit = transaction.type === "revenu";
  const signedAmount = isCredit ? transaction.amount : -transaction.amount;
  const typeLabel = isCredit ? t("transactions.typeRevenu") : t("transactions.typeDepense");

  return (
    <ListItem
      leading={
        <IconTile
          icon={isCredit ? ArrowDownLeft : ArrowUpRight}
          tint={isCredit ? "green" : "navy"}
        />
      }
      title={transaction.label}
      subtitle={`${typeLabel} · ${formatLongDate(transaction.date)}`}
      trailing={
        <AmountText value={signedAmount} currency={transaction.currency} signed variant="titleMd" />
      }
      onPress={onPress}
    />
  );
}
