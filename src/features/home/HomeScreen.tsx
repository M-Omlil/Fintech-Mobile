import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, FadeSlideIn, Screen, SectionHeader, Text, useToast } from "@components/index";
import { useAccounts, useBusiness, useRecentTransactions } from "@hooks/index";
import type { RootStackParamList } from "@navigation/types";
import { makeStyles } from "@theme/index";

import { TransactionRow } from "../transactions/components/TransactionRow";

import { BalanceSection } from "./components/BalanceSection";
import { HomeHeader } from "./components/HomeHeader";
import { QuickActions } from "./components/QuickActions";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const RECENT_LIMIT = 5;

/** Accueil tab (Section 6.2). Composes section components from repository-backed hooks. */
export function HomeScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const toast = useToast();

  const [balanceHidden, setBalanceHidden] = useState(false);

  const { data: business } = useBusiness();
  const { data: accounts } = useAccounts();
  const { data: recent } = useRecentTransactions(RECENT_LIMIT);

  const mainAccount = accounts?.find((account) => account.isMain) ?? accounts?.[0];

  return (
    <Screen>
      <HomeHeader
        name={business?.ownerName ?? ""}
        onOpenInbox={() => toast.show(t("common.comingSoonToast"), "info")}
      />

      <View style={styles.body}>
        {mainAccount ? (
          <BalanceSection
            accountName={mainAccount.name}
            balance={mainAccount.balance}
            currency={mainAccount.currency}
            hidden={balanceHidden}
            onToggleHidden={() => setBalanceHidden((value) => !value)}
            onPressAccount={() => navigation.navigate("Accounts")}
            onAddAccount={() => navigation.navigate("Accounts")}
            onMoreOptions={() => toast.show(t("common.comingSoonToast"), "info")}
          />
        ) : null}

        <View style={styles.shortcuts}>
          <SectionHeader title={t("home.shortcuts")} />
          <QuickActions
            onTransfer={() => navigation.navigate("Transfers")}
            onAddDocument={() => navigation.navigate("Documents")}
            onFactures={() => navigation.navigate("Tabs", { screen: "Facturation" })}
            onCards={() => navigation.navigate("Cards")}
            onRib={() => navigation.navigate("Rib")}
          />
        </View>

        <View style={styles.transactions}>
          <SectionHeader
            title={t("home.lastTransactions")}
            action={
              <Button
                variant="text"
                label={t("common.showAll")}
                fullWidth={false}
                onPress={() => navigation.navigate("Transactions")}
              />
            }
          />
          {recent && recent.length > 0 ? (
            recent.map((transaction, i) => (
              <FadeSlideIn key={transaction.id} index={i}>
                <TransactionRow transaction={transaction} />
              </FadeSlideIn>
            ))
          ) : (
            <Text variant="bodyMd" color="textSecondary">
              {t("transactions.empty")}
            </Text>
          )}
        </View>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.xl, marginTop: t.spacing.md },
  shortcuts: { gap: t.spacing.xs },
  transactions: { gap: t.spacing.xs },
}));
