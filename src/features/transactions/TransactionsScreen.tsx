import { useNavigation } from "@react-navigation/native";
import { SlidersHorizontal } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { EmptyState, IconButton, Screen, ScreenHeader, Sheet } from "@components/index";
import type { TransactionFilter } from "@data/repositories/index";
import { useTransactions } from "@hooks/index";
import { makeStyles } from "@theme/index";

import { FilterSheetContent } from "./components/FilterSheet";
import { TransactionRow } from "./components/TransactionRow";

/** Transactions list (Section 6.3) — list + filter sheet. */
export function TransactionsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation();

  const [filter, setFilter] = useState<TransactionFilter>({});
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: transactions } = useTransactions(filter);

  const applyFilter = (next: TransactionFilter) => {
    setFilter(next);
    setSheetOpen(false);
  };

  return (
    <Screen>
      <ScreenHeader
        title={t("transactions.title")}
        onBack={() => navigation.goBack()}
        rightActions={
          <IconButton
            icon={SlidersHorizontal}
            variant="surface"
            size={40}
            label={t("transactions.filter.title")}
            onPress={() => setSheetOpen(true)}
          />
        }
      />

      {transactions && transactions.length > 0 ? (
        <View style={styles.list}>
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <EmptyState title={t("transactions.empty")} />
        </View>
      )}

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("transactions.filter.title")}
      >
        <FilterSheetContent initial={filter} onApply={applyFilter} />
      </Sheet>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  list: { marginTop: t.spacing.sm },
  empty: { paddingTop: t.spacing.xxl * 2 },
}));
