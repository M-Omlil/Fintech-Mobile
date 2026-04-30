export type TabKey = "home" | "transfers" | "invoices" | "invoices-create" | "documents" | "profile" | "cards" | "cards-create" | "insurances" | "insurances-create";

export type CurrencyCode = "MAD";

export type TransactionKind = "credit" | "debit";

export type BankingTransaction = {
  id: string;
  title: string;
  counterparty: string;
  amount: number;
  currency: CurrencyCode;
  kind: TransactionKind;
  createdAt: string;
  note?: string;
};

export type BankingInvoiceStatus = "draft" | "paid";

export type BankingInvoice = {
  id: string;
  type: "paye" | "achat"; // NOUVEAU: Différencie Vente (Client) et Achat (Fournisseur)
  reference: string;
  clientName: string;
  invoiceObject: string;
  amountHT: number;
  vat: number;
  totalTTC: number;
  dueDate: string;
  status: BankingInvoiceStatus;
  createdAt: string;
};

export type BankingDocumentAction = "download" | "share" | "email";

export type BankingDocument = {
  id: string;
  name: string;
  fileName: string;
  description: string;
};

export type SubAccount = {
  id: string;
  name: string;
  balance: number;
  currency: CurrencyCode;
  theme: "navy-gold" | "ocean-blue" | "emerald";
  isMain?: boolean; // Permet d'identifier le compte source
};

export type CardStatus = "active" | "frozen" | "canceled";

export type BankingCard = {
  id: string;
  name: string;
  cardholder: string;
  network: string;
  maskedPan: string;
  expiry: string;
  limit: number;
  spent: number;
  status: CardStatus;
};

export type InsuranceCoverage = "basic" | "premium" | "executive";
export type InsuranceStatus = "active" | "pending" | "suspended";

export type EmployeeInsurance = {
  id: string;
  employeeName: string;
  role: string;
  coverageType: InsuranceCoverage;
  premium: number;
  status: InsuranceStatus;
  startDate: string;
};

export type BankingProfile = {
  id: string;
  firstName: string;
  displayName: string;
  greeting: string;
  gender: string | "Male" | "Female";
  companyName: string;
  companyAddress: string;
  companyICE: string;
  accountIBAN: string;
  role: string;
  email: string;
  password: string;
  currency: CurrencyCode;
  availableBalance: number;
  pendingBalance: number;
  subAccounts: SubAccount[];
  cards: BankingCard[];
  transactions: BankingTransaction[];
  invoices: BankingInvoice[];
  documents: BankingDocument[];
  walletNotes: string[];
  employeeInsurances: EmployeeInsurance[];
};

export type TransferPayload = {
  beneficiary: string;
  ibanRib: string;
  amount: number;
  currency: CurrencyCode;
  reason?: string;
  bank?: string;
  timing?: "immediate" | "scheduled";
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type InvoicePayload = {
  type: "paye" | "achat"; // NOUVEAU
  clientName: string;
  invoiceObject: string;
  amountHT: number;
  vat: number;
  dueDate: string;
};

export const mockProfiles: BankingProfile[] = [
  {
    id: "younes",
    firstName: "Younes",
    displayName: "Belhamdounia",
    gender: "Male",
    companyName: "MyLegal SARL",
    companyAddress: "Tour CFC, Casablanca Finance City, Casablanca",
    companyICE: "001542369000081",
    accountIBAN: "MA64 0077 8000 0123 4567 8901 0144",
    role: "Gérant Fondateur",
    email: "younes@mylegal.ma",
    password: "mylegal123",
    currency: "MAD",
    greeting: "Bonjour Younes",
    availableBalance: 0, 
    pendingBalance: 18000,
    subAccounts: [
      { id: "sub-y-1", name: "Compte Principal", balance: 145000.50, currency: "MAD", theme: "navy-gold", isMain: true },
      { id: "sub-y-2", name: "Provision TVA & Impôts", balance: 35400.00, currency: "MAD", theme: "emerald" }
    ],
    cards: [
      { id: "card-y-1", name: "Carte Corporate", cardholder: "Younes Omlil", network: "VISA", maskedPan: "•••• 2456", expiry: "12/28", limit: 50000, spent: 12450, status: "active" },
      { id: "card-y-2", name: "Dépenses Marketing", cardholder: "Younes Omlil", network: "Mastercard", maskedPan: "•••• 8832", expiry: "06/27", limit: 20000, spent: 18500, status: "active" }
    ],
    transactions: [
      // --- AVRIL 2026 (Ce mois) ---
      { id: "tx-y-1", title: "Virement Reçu", counterparty: "Groupe ONA holding", amount: 45000, currency: "MAD", kind: "credit", createdAt: "2026-04-28T10:15:00.000Z", note: "Paiement facture Conseil" },
      { id: "tx-y-2", title: "Prélèvement DGI", counterparty: "Trésorerie Générale du Royaume", amount: 12500, currency: "MAD", kind: "debit", createdAt: "2026-04-26T08:30:00.000Z", note: "IS 1er Acompte" },
      { id: "tx-y-3", title: "Paiement Fournisseur", counterparty: "Maroc Telecom", amount: 1250, currency: "MAD", kind: "debit", createdAt: "2026-04-25T14:20:00.000Z", note: "Flotte mobile" },
      { id: "tx-y-4", title: "Salaire Avril", counterparty: "Amine Bennani", amount: 8500, currency: "MAD", kind: "debit", createdAt: "2026-04-24T09:00:00.000Z" },
      { id: "tx-y-21", title: "Virement Reçu", counterparty: "Attijariwafa Bank", amount: 30000, currency: "MAD", kind: "credit", createdAt: "2026-04-18T11:00:00.000Z", note: "Règlement Facture F-2026-041" },
      { id: "tx-y-5", title: "Achat Matériel", counterparty: "Electroplanet Casa", amount: 3499, currency: "MAD", kind: "debit", createdAt: "2026-04-12T16:12:00.000Z" },
      { id: "tx-y-22", title: "Loyer Bureau", counterparty: "Syndic Tour CFC", amount: 6500, currency: "MAD", kind: "debit", createdAt: "2026-04-05T09:00:00.000Z" },
      { id: "tx-y-23", title: "Virement Reçu", counterparty: "Client Particulier", amount: 15000, currency: "MAD", kind: "credit", createdAt: "2026-04-02T14:30:00.000Z" },
      // --- MARS 2026 (Mois dernier) ---
      { id: "tx-y-24", title: "Honoraires Juridiques", counterparty: "Label'Vie SA", amount: 55000, currency: "MAD", kind: "credit", createdAt: "2026-03-25T10:15:00.000Z" },
      { id: "tx-y-25", title: "Salaire Mars", counterparty: "Amine Bennani", amount: 8500, currency: "MAD", kind: "debit", createdAt: "2026-03-24T09:00:00.000Z" },
      { id: "tx-y-26", title: "Paiement Fournisseur", counterparty: "Maroc Telecom", amount: 1250, currency: "MAD", kind: "debit", createdAt: "2026-03-20T14:20:00.000Z" },
      { id: "tx-y-27", title: "Prélèvement DGI", counterparty: "Trésorerie Générale", amount: 4500, currency: "MAD", kind: "debit", createdAt: "2026-03-15T08:30:00.000Z", note: "IR Mensuel" },
      { id: "tx-y-28", title: "Acompte Rédaction Statuts", counterparty: "ONCF", amount: 28000, currency: "MAD", kind: "credit", createdAt: "2026-03-10T11:45:00.000Z" },
      // --- FEVRIER 2026 (Année) ---
      { id: "tx-y-29", title: "Consulting RGPD", counterparty: "Holmarcom Group", amount: 42000, currency: "MAD", kind: "credit", createdAt: "2026-02-20T15:20:00.000Z" },
      { id: "tx-y-30", title: "Salaire Février", counterparty: "Amine Bennani", amount: 8500, currency: "MAD", kind: "debit", createdAt: "2026-02-24T09:00:00.000Z" }
    ],
    invoices: [
      { id: "inv-y-1", type: "paye", reference: "F-2026-041", clientName: "Attijariwafa Bank", invoiceObject: "Consultation RGPD", amountHT: 25000, vat: 20, totalTTC: 30000, dueDate: "2026-05-15T00:00:00.000Z", status: "paid", createdAt: "2026-04-10T10:00:00.000Z" },
      { id: "inv-y-2", type: "achat", reference: "FACT-DEL-2026", clientName: "Cabinet Deloitte", invoiceObject: "Audit Financier T1", amountHT: 15000, vat: 20, totalTTC: 18000, dueDate: "2026-04-20T00:00:00.000Z", status: "draft", createdAt: "2026-04-12T11:30:00.000Z" }, // Achat en retard
      { id: "inv-y-3", type: "paye", reference: "F-2026-043", clientName: "ONCF", invoiceObject: "Rédaction Statuts", amountHT: 40000, vat: 20, totalTTC: 48000, dueDate: "2026-05-25T00:00:00.000Z", status: "draft", createdAt: "2026-04-25T09:15:00.000Z" }
    ],
    documents: [],
    walletNotes: ["Liquidité MAD sécurisée", "Préparation bilan 2025"],
    employeeInsurances: [
      { id: "ins-1", employeeName: "Amine Bennani", role: "Développeur", coverageType: "premium", premium: 450, status: "active", startDate: "2026-01-01T00:00:00.000Z" }
    ]
  },
  {
    id: "kenza",
    firstName: "Kenza",
    displayName: "Berrada",
    companyName: "Tech Solutions Digital",
    companyAddress: "Technopark, Route de Nouasseur, Casablanca",
    companyICE: "002241587000032",
    accountIBAN: "MA64 0012 5000 0987 6543 2100 0566",
    gender: "Female",
    role: "Directrice Financière",
    email: "kenza@techsolutions.ma",
    password: "tech2026",
    currency: "MAD",
    greeting: "Bonjour Kenza",
    availableBalance: 0,
    pendingBalance: 12500,
    subAccounts: [
      { id: "sub-k-1", name: "Opérations Courantes", balance: 285400.00, currency: "MAD", theme: "ocean-blue", isMain: true },
      { id: "sub-k-2", name: "Fonds de Roulement", balance: 150000.00, currency: "MAD", theme: "navy-gold" }
    ],
    cards: [
      { id: "card-k-1", name: "Carte Hébergement", cardholder: "Kenza Berrada", network: "Mastercard", maskedPan: "•••• 4082", expiry: "09/29", limit: 100000, spent: 45000, status: "active" },
      { id: "card-k-2", name: "Frais de Déplacement", cardholder: "Mehdi Chraibi", network: "VISA", maskedPan: "•••• 5011", expiry: "03/28", limit: 15000, spent: 2500, status: "active" },
      { id: "card-k-3", name: "Abonnements SaaS", cardholder: "Kenza Berrada", network: "VISA", maskedPan: "•••• 1129", expiry: "01/27", limit: 30000, spent: 29500, status: "frozen" }
    ],
    transactions: [
      // --- AVRIL 2026 (Ce mois) ---
      { id: "tx-k-1", title: "Virement Reçu", counterparty: "Groupe OCP", amount: 120000, currency: "MAD", kind: "credit", createdAt: "2026-04-28T14:05:00.000Z" },
      { id: "tx-k-2", title: "Paiement en ligne", counterparty: "Amazon Web Services", amount: 15400, currency: "MAD", kind: "debit", createdAt: "2026-04-27T12:55:00.000Z" },
      { id: "tx-k-3", title: "Paiement TPE", counterparty: "Boutique Apple Casablanca", amount: 18500, currency: "MAD", kind: "debit", createdAt: "2026-04-22T08:40:00.000Z" },
      { id: "tx-k-4", title: "Frais Déplacement", counterparty: "Royal Air Maroc", amount: 4200, currency: "MAD", kind: "debit", createdAt: "2026-04-20T10:20:00.000Z" },
      { id: "tx-k-21", title: "Prestation Dev Mobile", counterparty: "Bank of Africa", amount: 85000, currency: "MAD", kind: "credit", createdAt: "2026-04-15T11:00:00.000Z" },
      { id: "tx-k-22", title: "Campagne Marketing", counterparty: "Google Ads", amount: 12000, currency: "MAD", kind: "debit", createdAt: "2026-04-10T14:30:00.000Z" },
      { id: "tx-k-23", title: "Virement Entrant", counterparty: "Client B2B Agadir", amount: 34000, currency: "MAD", kind: "credit", createdAt: "2026-04-05T09:15:00.000Z" },
      // --- MARS 2026 (Mois dernier) ---
      { id: "tx-k-24", title: "Refonte Plateforme Web", counterparty: "INWI", amount: 95000, currency: "MAD", kind: "credit", createdAt: "2026-03-28T10:00:00.000Z" },
      { id: "tx-k-25", title: "Hébergement Cloud", counterparty: "Amazon Web Services", amount: 15000, currency: "MAD", kind: "debit", createdAt: "2026-03-26T12:00:00.000Z" },
      { id: "tx-k-26", title: "Salaires Equipe Tech", counterparty: "Virements Multiples", amount: 22000, currency: "MAD", kind: "debit", createdAt: "2026-03-24T09:00:00.000Z" },
      { id: "tx-k-27", title: "Licences Logiciel", counterparty: "Acme Corp EU", amount: 45000, currency: "MAD", kind: "credit", createdAt: "2026-03-12T15:45:00.000Z" },
      { id: "tx-k-28", title: "Loyer Bureau", counterparty: "Gestion Technopark", amount: 8500, currency: "MAD", kind: "debit", createdAt: "2026-03-05T08:30:00.000Z" },
      // --- FEVRIER 2026 (Année) ---
      { id: "tx-k-29", title: "Acompte Projet Digital", counterparty: "Ministère Transition Numérique", amount: 110000, currency: "MAD", kind: "credit", createdAt: "2026-02-15T11:20:00.000Z" },
      { id: "tx-k-30", title: "Salaires Equipe Tech", counterparty: "Virements Multiples", amount: 22000, currency: "MAD", kind: "debit", createdAt: "2026-02-24T09:00:00.000Z" }
    ],
    invoices: [
      { id: "inv-k-1", type: "paye", reference: "F-2026-101", clientName: "Bank of Africa", invoiceObject: "Développement Application iOS", amountHT: 85000, vat: 20, totalTTC: 102000, dueDate: "2026-04-10T00:00:00.000Z", status: "paid", createdAt: "2026-03-10T10:00:00.000Z" },
      { id: "inv-k-2", type: "achat", reference: "INV-AWS-889", clientName: "Amazon Web Services", invoiceObject: "Services Cloud Q1", amountHT: 15400, vat: 0, totalTTC: 15400, dueDate: "2026-04-15T00:00:00.000Z", status: "draft", createdAt: "2026-04-01T11:30:00.000Z" }, // Achat en retard
      { id: "inv-k-3", type: "paye", reference: "F-2026-102", clientName: "Ministère Transition Numérique", invoiceObject: "Lot 2 - Plateforme e-Gov", amountHT: 110000, vat: 20, totalTTC: 132000, dueDate: "2026-06-30T00:00:00.000Z", status: "draft", createdAt: "2026-04-28T09:15:00.000Z" }
    ],
    documents: [],
    walletNotes: ["Croissance Q2", "Renouvellement parc IT"],
    employeeInsurances: []
  }
];

export function createInitialProfiles() {
  return mockProfiles.map((profile) => {
    const computedGlobalBalance = profile.subAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    return {
      ...profile,
      availableBalance: computedGlobalBalance,
      subAccounts: profile.subAccounts.map((acc) => ({ ...acc })),
      cards: profile.cards.map((card) => ({ ...card })),
      transactions: profile.transactions.map((transaction) => ({ ...transaction })),
      invoices: profile.invoices.map((invoice) => ({ ...invoice })),
      documents: profile.documents.map((document) => ({ ...document })),
      walletNotes: [...profile.walletNotes],
      employeeInsurances: [...profile.employeeInsurances]
    };
  });
}

export function findProfileByEmail(email: string) {
  return mockProfiles.find((profile) => profile.email.toLowerCase() === email.toLowerCase());
}

export function getProfileSeed(profileId: string) {
  return mockProfiles.find((profile) => profile.id === profileId);
}