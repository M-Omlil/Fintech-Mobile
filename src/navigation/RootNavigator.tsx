import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { TransactionFeedbackProvider } from "@components/index";
import { AccountsScreen } from "@features/accounts/AccountsScreen";
import { RibScreen } from "@features/accounts/RibScreen";
import { CardsScreen } from "@features/cards/CardsScreen";
import { StubScreen } from "@features/common/StubScreen";
import { ClassementScreen } from "@features/documents/ClassementScreen";
import { DocumentsScreen } from "@features/documents/DocumentsScreen";
import { ClientsScreen } from "@features/invoicing/clients/ClientsScreen";
import { CommercialCycleScreen } from "@features/invoicing/cycle/CommercialCycleScreen";
import { FacturePreviewScreen } from "@features/invoicing/invoices/FacturePreviewScreen";
import { NouvelleFactureScreen } from "@features/invoicing/invoices/NouvelleFactureScreen";
import { BonCommandeDetailScreen } from "@features/invoicing/orders/BonCommandeDetailScreen";
import { BonsCommandeScreen } from "@features/invoicing/orders/BonsCommandeScreen";
import { ProductsScreen } from "@features/invoicing/products/ProductsScreen";
import { DevisScreen } from "@features/invoicing/quotes/DevisScreen";
import { NouveauDevisScreen } from "@features/invoicing/quotes/NouveauDevisScreen";
import { SubscriptionsScreen } from "@features/invoicing/subscriptions/SubscriptionsScreen";
import { SupplierInvoicesScreen } from "@features/invoicing/suppliers/SupplierInvoicesScreen";
import { SupplierPaymentScreen } from "@features/invoicing/suppliers/SupplierPaymentScreen";
import { SuppliersScreen } from "@features/invoicing/suppliers/SuppliersScreen";
import { TransactionsScreen } from "@features/transactions/TransactionsScreen";
import { NouveauVirementScreen } from "@features/transfers/NouveauVirementScreen";
import { TransfersScreen } from "@features/transfers/TransfersScreen";
import { useSession } from "@services/auth/SessionProvider";
import { makeStyles, useTheme } from "@theme/index";

import { AuthNavigator } from "./AuthNavigator";
import { BottomTabs } from "./BottomTabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigation. Gates on the session: a loader while restoring, the auth flow for
 * guests, and the app (tabs + sub-screens) once authenticated.
 */
export function RootNavigator() {
  const { status } = useSession();
  const theme = useTheme();
  const styles = useStyles();

  if (status === "loading") {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  if (status === "guest") return <AuthNavigator />;

  return (
    <TransactionFeedbackProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="Tabs" component={BottomTabs} options={{ animation: "fade" }} />
        <Stack.Screen name="Accounts" component={AccountsScreen} />
        <Stack.Screen name="Rib" component={RibScreen} />
        <Stack.Screen name="Cards" component={CardsScreen} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} />
        <Stack.Screen name="Documents" component={DocumentsScreen} />
        <Stack.Screen name="Classement" component={ClassementScreen} />
        <Stack.Screen name="Transfers" component={TransfersScreen} />
        <Stack.Screen name="NouveauVirement" component={NouveauVirementScreen} />
        <Stack.Screen name="Devis" component={DevisScreen} />
        <Stack.Screen name="NouveauDevis" component={NouveauDevisScreen} />
        <Stack.Screen name="CommercialCycle" component={CommercialCycleScreen} />
        <Stack.Screen name="BonsCommande" component={BonsCommandeScreen} />
        <Stack.Screen name="BonCommandeDetail" component={BonCommandeDetailScreen} />
        <Stack.Screen name="NouvelleFacture" component={NouvelleFactureScreen} />
        <Stack.Screen name="FacturePreview" component={FacturePreviewScreen} />
        <Stack.Screen name="Clients" component={ClientsScreen} />
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="Suppliers" component={SuppliersScreen} />
        <Stack.Screen name="SupplierInvoices" component={SupplierInvoicesScreen} />
        <Stack.Screen name="SupplierPayment" component={SupplierPaymentScreen} />
        <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
        <Stack.Screen name="Stub" component={StubScreen} />
      </Stack.Navigator>
    </TransactionFeedbackProvider>
  );
}

const useStyles = makeStyles((t) => ({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.background,
  },
}));
