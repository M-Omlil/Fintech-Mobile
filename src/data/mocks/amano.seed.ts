import type {
  Account,
  Beneficiary,
  Business,
  Card,
  Client,
  Invoice,
  LineItem,
  Product,
  PurchaseOrder,
  Quote,
  Subscription,
  Supplier,
  TeamMember,
  Transaction,
  Transfer,
} from "@domain/index";
import { computeTotalsFromLines } from "@services/tax/tva";

/**
 * Amano demo seed (MAD). Built relative to "now" so the Tableau de bord, lists and
 * charts always show current-month data — a fully functional demo. Moroccan identity:
 * RIB + ICE/IF/RC/CNSS.
 */

/** ISO date n days before "now". The company was created ~15 days ago, so all demo data
 * is recent (issued within the last two weeks). */
function daysBack(now: Date, n: number): string {
  const d = new Date(now.getTime());
  d.setDate(d.getDate() - n);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

const lines = (items: Omit<LineItem, "id">[]): LineItem[] =>
  items.map((item, i) => ({ id: `line-${i}`, ...item }));

function quoteOf(
  id: string,
  number: string,
  clientName: string,
  now: Date,
  issuedDaysAgo: number,
  status: Quote["status"],
  items: Omit<LineItem, "id">[],
): Quote {
  const ls = lines(items);
  const totals = computeTotalsFromLines(ls);
  return {
    id,
    number,
    clientName,
    issueDate: daysBack(now, issuedDaysAgo),
    expiryDate: daysBack(now, issuedDaysAgo - 30),
    status,
    lines: ls,
    ...totals,
  };
}

function invoiceOf(
  id: string,
  number: string,
  clientName: string,
  now: Date,
  issuedDaysAgo: number,
  dueDaysAgo: number,
  status: Invoice["status"],
  legal: Business["legal"],
  items: Omit<LineItem, "id">[],
  kind: Invoice["kind"] = "vente",
): Invoice {
  const ls = lines(items);
  const totals = computeTotalsFromLines(ls);
  const issueDate = daysBack(now, issuedDaysAgo);
  return {
    id,
    number,
    kind,
    clientName,
    issueDate,
    dueDate: daysBack(now, dueDaysAgo),
    status,
    lines: ls,
    ...totals,
    legal: { ...legal },
    // Paid invoices carry a payment reference → drives the justificatifs de paiement.
    ...(status === "payee" ? { paidAt: issueDate, paidMethod: "rib" as const } : {}),
  };
}

export function buildAmanoSeed(now: Date = new Date()) {
  const business: Business = {
    id: "amano-ei",
    name: "Amano",
    ownerName: "Younes Belhamdounia",
    rib: "007 780 0001 2345 6789 0101 44",
    iban: "MA64 0077 8000 0123 4567 8901 0144",
    currency: "MAD",
    legal: { ice: "001542369000081", if: "40512378", rc: "284531", cnss: "1234567" },
    email: "contact@amano.ma",
    phone: "+212 6 00 71 00 60",
    address: "Oasis Offices Latitudes, Route de l'Oasis, Bureau 304, Maarif, Casablanca - Maroc",
  };

  const accounts: Account[] = [
    {
      id: "acc-main",
      name: "Compte principal",
      balance: 100000,
      currency: "MAD",
      status: "active",
      isMain: true,
    },
    {
      id: "acc-tva",
      name: "Provision TVA & Impôts",
      balance: 35400,
      currency: "MAD",
      status: "active",
      isMain: false,
    },
    {
      id: "acc-remuneration",
      name: "Rémunération",
      balance: 0,
      currency: "MAD",
      status: "inactive",
      isMain: false,
    },
  ];

  const cards: Card[] = [
    {
      id: "card-one",
      productLabel: "ONE",
      nickname: "Carte Pro",
      maskedPan: "•• 6624",
      network: "mastercard",
      status: "active",
      monthlyLimit: 50000,
      monthlySpent: 12450,
      settings: {
        cashWithdrawal: false,
        foreignPayment: true,
        onlinePayment: true,
        contactlessPayment: true,
      },
      addedToWallet: false,
    },
    {
      id: "card-mkt",
      productLabel: "PLUS",
      nickname: "Dépenses Marketing",
      maskedPan: "•• 8832",
      network: "visa",
      status: "active",
      monthlyLimit: 20000,
      monthlySpent: 8500,
      settings: {
        cashWithdrawal: false,
        foreignPayment: true,
        onlinePayment: true,
        contactlessPayment: true,
      },
      addedToWallet: true,
    },
  ];

  const clients: Client[] = [
    {
      id: "cli-ilyasse",
      name: "Ilyasse Belhamdounia",
      email: "ilyasse.belhamdounia@gmail.com",
      legal: {},
    },
    {
      id: "cli-clinique",
      name: "Clinique Al Madina",
      email: "achats@clinique-almadina.ma",
      legal: { ice: "001084710000034" },
    },
    {
      id: "cli-cabinet",
      name: "Cabinet Comptable Bennani",
      email: "contact@cabinet-bennani.ma",
      legal: { ice: "000112233000045" },
    },
    {
      id: "cli-ecole",
      name: "École Al Khawarizmi",
      email: "direction@alkhawarizmi.ma",
      legal: { ice: "000556677000012" },
    },
    {
      id: "cli-riad",
      name: "Riad Zitoun (Hôtellerie)",
      email: "reservation@riadzitoun.ma",
      legal: { ice: "000998877000088" },
    },
  ];

  // IT hardware retail catalogue (revente + prestations). Prices HT in MAD.
  const products: Product[] = [
    {
      id: "prd-1",
      name: "PC portable Dell Latitude 5440 (i5/16Go/512Go)",
      unitPrice: 11500,
      vatRate: 20,
    },
    {
      id: "prd-2",
      name: "PC bureau HP ProDesk 400 G9 (i5/8Go/256Go)",
      unitPrice: 8900,
      vatRate: 20,
    },
    { id: "prd-3", name: "Écran Dell 24'' P2422H Full HD", unitPrice: 1850, vatRate: 20 },
    { id: "prd-4", name: "Imprimante laser HP LaserJet Pro M404dn", unitPrice: 2400, vatRate: 20 },
    { id: "prd-5", name: "Switch Cisco Catalyst 1000 24 ports", unitPrice: 6800, vatRate: 20 },
    { id: "prd-6", name: "Onduleur APC Back-UPS 650VA", unitPrice: 720, vatRate: 20 },
    { id: "prd-7", name: "Disque SSD Samsung 870 EVO 1 To", unitPrice: 1150, vatRate: 20 },
    { id: "prd-8", name: "Installation & configuration (sur site)", unitPrice: 1500, vatRate: 20 },
    { id: "prd-9", name: "Contrat de maintenance IT (mensuel)", unitPrice: 2500, vatRate: 20 },
  ];

  // Fournisseurs — les contreparties des dépenses (factures d'achat).
  const suppliers: Supplier[] = [
    { id: "sup-mylegal", name: "MyLegal", status: "active", legal: { ice: "003521475000060" } },
    {
      id: "sup-uptoconnect",
      name: "Uptoconnect SARL",
      status: "active",
      legal: { ice: "002648130000071" },
    },
    { id: "sup-iam", name: "Maroc Telecom", status: "active", legal: { ice: "001998200000055" } },
    { id: "sup-disway", name: "Disway", status: "active", legal: { ice: "001542300000099" } },
  ];

  const beneficiaries: Beneficiary[] = [
    {
      id: "ben-mylegal",
      name: "MyLegal",
      bank: "Attijariwafa Bank",
      account: "007 450 0001 2200 0304 0058 12",
      defaultReason: "Règlement facture d'achat",
    },
    {
      id: "ben-uptoconnect",
      name: "Uptoconnect SARL",
      bank: "BMCE Bank of Africa",
      account: "021 780 000 124 001 009 31",
      defaultReason: "Abonnement & intégration",
    },
    {
      id: "ben-iam",
      name: "Maroc Telecom",
      bank: "CIH Bank",
      account: "230 450 000 021 480 195 10",
      defaultReason: "Abonnement Fibre optique",
    },
    {
      id: "ben-disway",
      name: "Disway SA",
      bank: "Bank of Africa",
      account: "011 810 0000 7788 9900 1122 33",
      defaultReason: "Achat matériel informatique",
    },
  ];

  // Transaction feed — only the headline movements (demo brief).
  const tx = (
    id: string,
    label: string,
    counterparty: string,
    type: Transaction["type"],
    amount: number,
    n: number,
    receipt: Transaction["receipt"] = "added",
  ): Transaction => ({
    id,
    label,
    counterparty,
    type,
    amount,
    currency: "MAD",
    date: daysBack(now, n),
    status: "executed",
    receipt,
    method: "transfer",
    accountId: "acc-main",
  });
  const transactions: Transaction[] = [
    tx(
      "tx-v-ilyasse",
      "Virement Ilyasse Belhamdounia",
      "Ilyasse Belhamdounia",
      "revenu",
      100000,
      0,
    ),
    tx("tx-v-mylegal", "Virement MyLegal", "MyLegal", "depense", 4680, 1),
    tx("tx-v-uptoconnect", "Virement Uptoconnect SARL", "Uptoconnect SARL", "depense", 20000, 2),
    tx("tx-iam-fibre", "Maroc Telecom — Fibre optique", "Maroc Telecom", "depense", 1000, 3),
    tx(
      "tx-achat-materiel",
      "Achat matériel informatique",
      "Disway SA",
      "depense",
      8500,
      4,
      "missing",
    ),
  ];

  // Virements — règlements des factures d'achat (mêmes contreparties que les dépenses).
  const transfers: Transfer[] = [
    {
      id: "trf-mylegal",
      beneficiary: "MyLegal",
      amount: 4680,
      currency: "MAD",
      status: "past",
      date: daysBack(now, 1),
      reference: "Règlement FA-2026/001",
    },
    {
      id: "trf-uptoconnect",
      beneficiary: "Uptoconnect SARL",
      amount: 20000,
      currency: "MAD",
      status: "past",
      date: daysBack(now, 2),
      reference: "Règlement FA-2026/002",
    },
    {
      id: "trf-iam",
      beneficiary: "Maroc Telecom",
      amount: 1000,
      currency: "MAD",
      status: "past",
      date: daysBack(now, 3),
      reference: "Règlement FA-2026/003",
    },
    {
      id: "trf-disway",
      beneficiary: "Disway SA",
      amount: 8500,
      currency: "MAD",
      status: "ongoing",
      date: daysBack(now, 4),
      reference: "Règlement FA-2026/004",
    },
  ];

  const quotes: Quote[] = [
    quoteOf("q-1", "DEV-2026-001", "Clinique Al Madina", now, 10, "en_attente", [
      {
        description: "PC bureau HP ProDesk 400 G9 (i5/8Go/256Go)",
        quantity: 6,
        unitPrice: 8900,
        vatRate: 20,
      },
      { description: "Écran Dell 24'' P2422H Full HD", quantity: 6, unitPrice: 1850, vatRate: 20 },
      {
        description: "Installation & configuration (sur site)",
        quantity: 1,
        unitPrice: 1500,
        vatRate: 20,
      },
    ]),
    quoteOf("q-2", "DEV-2026-002", "École Al Khawarizmi", now, 13, "accepte", [
      {
        description: "Switch Cisco Catalyst 1000 24 ports",
        quantity: 2,
        unitPrice: 6800,
        vatRate: 20,
      },
      { description: "Onduleur APC Back-UPS 650VA", quantity: 4, unitPrice: 720, vatRate: 20 },
    ]),
  ];

  // Bons de commande are generated live through the cycle commercial (devis → signature
  // → facture), so the demo starts with none.
  const purchaseOrders: PurchaseOrder[] = [];

  // Factures liées aux transactions : les 4 dépenses sont des factures d'achat réglées,
  // l'encaissement de 100 000 est une facture de vente réglée. Les autres FV (Clinique,
  // École, Cabinet) sont des ventes en attente de règlement (pipeline → couleurs de statut).
  const invoices: Invoice[] = [
    // Facture de vente réglée → "Virement Ilyasse Belhamdounia +100 000".
    invoiceOf(
      "inv-fv-ilyasse",
      "FV-2026/001",
      "Ilyasse Belhamdounia",
      now,
      10,
      -20,
      "payee",
      business.legal,
      [
        {
          description: "Vente PC portables Dell Latitude & accessoires (lot)",
          quantity: 1,
          unitPrice: 83333.33,
          vatRate: 20,
        },
      ],
    ),
    // Ventes en attente / en retard (pas encore encaissées → pas de transaction).
    invoiceOf(
      "inv-fv-clinique",
      "FV-2026/002",
      "Clinique Al Madina",
      now,
      5,
      -25,
      "envoyee",
      business.legal,
      [
        {
          description: "Imprimante laser HP LaserJet Pro M404dn",
          quantity: 4,
          unitPrice: 2400,
          vatRate: 20,
        },
        {
          description: "Disque SSD Samsung 870 EVO 1 To",
          quantity: 6,
          unitPrice: 1150,
          vatRate: 20,
        },
      ],
    ),
    invoiceOf(
      "inv-fv-ecole",
      "FV-2026/003",
      "École Al Khawarizmi",
      now,
      13,
      3,
      "envoyee",
      business.legal,
      [
        {
          description: "Switch Cisco Catalyst 1000 24 ports",
          quantity: 2,
          unitPrice: 6800,
          vatRate: 20,
        },
      ],
    ),
    invoiceOf(
      "inv-fv-cabinet",
      "FV-2026/004",
      "Cabinet Comptable Bennani",
      now,
      2,
      -28,
      "brouillon",
      business.legal,
      [
        {
          description: "PC portable Dell Latitude 5440 (i5/16Go/512Go)",
          quantity: 3,
          unitPrice: 11500,
          vatRate: 20,
        },
      ],
    ),
    // Factures d'achat réglées → les 4 dépenses du relevé.
    invoiceOf(
      "inv-fa-mylegal",
      "FA-2026/001",
      "MyLegal",
      now,
      9,
      -21,
      "payee",
      business.legal,
      [
        {
          description: "Création d'entreprise en ligne & domiciliation (12 mois)",
          quantity: 1,
          unitPrice: 3900,
          vatRate: 20,
        },
      ],
      "achat",
    ),
    invoiceOf(
      "inv-fa-uptoconnect",
      "FA-2026/002",
      "Uptoconnect SARL",
      now,
      8,
      -22,
      "payee",
      business.legal,
      [
        {
          description: "Abonnement plateforme & intégration CRM",
          quantity: 1,
          unitPrice: 16666.67,
          vatRate: 20,
        },
      ],
      "achat",
    ),
    invoiceOf(
      "inv-fa-iam",
      "FA-2026/003",
      "Maroc Telecom",
      now,
      7,
      -23,
      "payee",
      business.legal,
      [
        {
          description: "Abonnement Fibre optique Pro (12 mois)",
          quantity: 1,
          unitPrice: 833.33,
          vatRate: 20,
        },
      ],
      "achat",
    ),
    invoiceOf(
      "inv-fa-disway",
      "FA-2026/004",
      "Disway SA",
      now,
      6,
      -24,
      "payee",
      business.legal,
      [
        {
          description: "Achat matériel informatique (lot)",
          quantity: 1,
          unitPrice: 7083.33,
          vatRate: 20,
        },
      ],
      "achat",
    ),
  ];

  const teamMembers: TeamMember[] = [];

  const inDays = (days: number): string => {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const subscriptions: Subscription[] = [
    {
      id: "sub-sage",
      name: "Sage Gestion Commerciale",
      amount: 750,
      currency: "MAD",
      cycle: "monthly",
      nextRenewal: inDays(4),
      status: "active",
      category: "Gestion",
    },
    {
      id: "sub-m365",
      name: "Microsoft 365 Business",
      amount: 300,
      currency: "MAD",
      cycle: "monthly",
      nextRenewal: inDays(11),
      status: "active",
      category: "Logiciels",
    },
    {
      id: "sub-bitdefender",
      name: "Bitdefender GravityZone",
      amount: 480,
      currency: "MAD",
      cycle: "monthly",
      nextRenewal: inDays(18),
      status: "active",
      category: "Sécurité",
    },
    {
      id: "sub-shopify",
      name: "Boutique en ligne (Shopify)",
      amount: 390,
      currency: "MAD",
      cycle: "monthly",
      nextRenewal: inDays(25),
      status: "paused",
      category: "E-commerce",
    },
    {
      id: "sub-gsuite",
      name: "Google Workspace",
      amount: 1440,
      currency: "MAD",
      cycle: "yearly",
      nextRenewal: inDays(120),
      status: "active",
      category: "Logiciels",
    },
  ];

  return {
    business,
    accounts,
    cards,
    transactions,
    transfers,
    beneficiaries,
    quotes,
    purchaseOrders,
    invoices,
    clients,
    products,
    suppliers,
    teamMembers,
    subscriptions,
  };
}

/** Snapshot at module load (kept for any direct importers). */
export const amanoSeed = buildAmanoSeed();

export type AmanoSeed = ReturnType<typeof buildAmanoSeed>;
