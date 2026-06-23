import type { NavigatorScreenParams } from "@react-navigation/native";

/** Keys into the i18n `stubs.*` namespace for the generic placeholder screen. */
export type StubKey =
  | "tapToPay"
  | "checkDeposit"
  | "paymentLinks"
  | "domiciliation"
  | "capitalIncrease"
  | "changeManager"
  | "changeHeadquarters"
  | "trademarkProtection"
  | "expenseReports"
  | "helpCenter"
  | "contactUs";

/** Auth flow shown when there is no active session. */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/** The four bottom tabs. */
export type TabParamList = {
  Home: undefined;
  Facturation: undefined;
  Dashboard: undefined;
  Menu: undefined;
};

/**
 * Root stack hosting the tabs plus every full-screen sub-page. Sub-pages push above
 * the tabs (tab bar hidden) and carry a back affordance.
 */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Accounts: undefined;
  Rib: undefined;
  Documents: undefined;
  Classement: undefined;
  Transactions: undefined;
  Cards: undefined;
  Transfers: undefined;
  NouveauVirement: { sourceAccountId?: string } | undefined;
  Devis: undefined;
  NouveauDevis: undefined;
  CommercialCycle: { quoteId: string };
  BonsCommande: undefined;
  BonCommandeDetail: { orderId: string };
  NouvelleFacture: { quoteId?: string } | undefined;
  FacturePreview: { invoiceId: string };
  Clients: undefined;
  Products: undefined;
  Suppliers: undefined;
  SupplierInvoices: undefined;
  SupplierPayment:
    | {
        prefill?: { supplierName?: string; amount?: number; rib?: string; source?: string };
      }
    | undefined;
  Subscriptions: undefined;
  /** Generic placeholder for "Plus tard" / phased screens (§8). */
  Stub: { titleKey: StubKey };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
