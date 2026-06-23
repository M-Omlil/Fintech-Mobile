import {
  ArrowLeftRight,
  Banknote,
  Boxes,
  Building2,
  CreditCard,
  FileSignature,
  FileSpreadsheet,
  FileText,
  FolderTree,
  Headset,
  Landmark,
  LayoutDashboard,
  Link2,
  type LucideIcon,
  Mail,
  MapPin,
  Nfc,
  Receipt,
  ScrollText,
  ShieldCheck,
  Star,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react-native";

import type { RootStackParamList, StubKey, TabParamList } from "@navigation/types";
import type { TintName } from "@theme/theme";

/** Where a menu row leads — a root-stack screen or one of the bottom tabs. */
export type MenuTarget =
  | { kind: "route"; name: keyof RootStackParamList | keyof TabParamList }
  | { kind: "stub"; key: StubKey }
  | { kind: "external" };

export type MenuItem = {
  /** i18n key under `menu.items.*`. */
  labelKey: string;
  icon: LucideIcon;
  target: MenuTarget;
  /** "Plus tard" — visible but routes to a Bientôt-disponible placeholder (§8). */
  soon?: boolean;
  /** Phase-2 backlog — gated behind `featureFlags.p2` (§8). */
  p2?: boolean;
};

export type MenuGroup = {
  /** i18n key under `menu.*`. */
  titleKey: string;
  tint: TintName;
  items: MenuItem[];
};

/**
 * Menu information architecture (mega-prompt §5). Driven entirely by data so the
 * screen is pure composition. Dropped from the earlier draft: récurrente, projets,
 * e-invoicing, prélèvements, paiement fractionné, automatisations, trésorerie,
 * assurance.
 */
export const menuGroups: MenuGroup[] = [
  {
    titleKey: "menu.groupProAccount",
    tint: "blue",
    items: [
      { labelKey: "accounts", icon: Landmark, target: { kind: "route", name: "Accounts" } },
      { labelKey: "cards", icon: CreditCard, target: { kind: "route", name: "Cards" } },
      {
        labelKey: "transactions",
        icon: ArrowLeftRight,
        target: { kind: "route", name: "Transactions" },
      },
      { labelKey: "transfers", icon: Banknote, target: { kind: "route", name: "Transfers" } },
      { labelKey: "tapToPay", icon: Nfc, target: { kind: "stub", key: "tapToPay" }, soon: true },
      {
        labelKey: "checkDeposit",
        icon: ScrollText,
        target: { kind: "stub", key: "checkDeposit" },
        soon: true,
      },
      {
        labelKey: "paymentLinks",
        icon: Link2,
        target: { kind: "stub", key: "paymentLinks" },
        soon: true,
      },
    ],
  },
  {
    titleKey: "menu.groupBilling",
    tint: "violet",
    items: [
      { labelKey: "quotes", icon: FileText, target: { kind: "route", name: "Devis" } },
      {
        labelKey: "purchaseOrders",
        icon: FileSignature,
        target: { kind: "route", name: "BonsCommande" },
      },
      { labelKey: "billing", icon: Receipt, target: { kind: "route", name: "Facturation" } },
      { labelKey: "classement", icon: FolderTree, target: { kind: "route", name: "Classement" } },
      { labelKey: "clientList", icon: Users, target: { kind: "route", name: "Clients" } },
      { labelKey: "productsServices", icon: Boxes, target: { kind: "route", name: "Products" } },
      {
        labelKey: "supplierInvoices",
        icon: FileSpreadsheet,
        target: { kind: "route", name: "SupplierInvoices" },
      },
      { labelKey: "subscriptions", icon: Wallet, target: { kind: "route", name: "Subscriptions" } },
      { labelKey: "supplierList", icon: Truck, target: { kind: "route", name: "Suppliers" } },
    ],
  },
  {
    titleKey: "menu.groupLegal",
    tint: "navy",
    items: [
      {
        labelKey: "domiciliation",
        icon: Building2,
        target: { kind: "stub", key: "domiciliation" },
      },
      {
        labelKey: "capitalIncrease",
        icon: TrendingUp,
        target: { kind: "stub", key: "capitalIncrease" },
      },
      { labelKey: "changeManager", icon: UserCog, target: { kind: "stub", key: "changeManager" } },
      {
        labelKey: "changeHeadquarters",
        icon: MapPin,
        target: { kind: "stub", key: "changeHeadquarters" },
      },
      {
        labelKey: "trademarkProtection",
        icon: ShieldCheck,
        target: { kind: "stub", key: "trademarkProtection" },
      },
    ],
  },
  {
    titleKey: "menu.groupTeamExpenses",
    tint: "peach",
    items: [
      {
        labelKey: "expenseReports",
        icon: CreditCard,
        target: { kind: "stub", key: "expenseReports" },
        p2: true,
      },
    ],
  },
  {
    titleKey: "menu.groupAnalytics",
    tint: "yellow",
    items: [
      {
        labelKey: "dashboard",
        icon: LayoutDashboard,
        target: { kind: "route", name: "Dashboard" },
      },
    ],
  },
  {
    titleKey: "menu.groupOther",
    tint: "blue",
    items: [
      { labelKey: "rateAmano", icon: Star, target: { kind: "external" } },
      { labelKey: "helpCenter", icon: Headset, target: { kind: "stub", key: "helpCenter" } },
      { labelKey: "contactUs", icon: Mail, target: { kind: "stub", key: "contactUs" } },
    ],
  },
];
