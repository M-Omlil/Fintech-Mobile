import {
  Banknote,
  Boxes,
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
  Nfc,
  Receipt,
  Repeat,
  ScrollText,
  Star,
  Truck,
  Users,
  Wallet,
} from "lucide-react-native";

import type { RootStackParamList, StubKey } from "@navigation/types";
import type { TintName } from "@theme/theme";

/** Where a menu row leads. */
export type MenuTarget =
  | { kind: "route"; name: keyof RootStackParamList }
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
      {
        labelKey: "domiciliation",
        icon: Repeat,
        target: { kind: "stub", key: "domiciliation" },
        p2: true,
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
