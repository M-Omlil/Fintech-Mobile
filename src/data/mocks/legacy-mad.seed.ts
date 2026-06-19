export type TabKey =
  | "home"
  | "transfers"
  | "invoices"
  | "invoices-create"
  | "documents"
  | "profile"
  | "cards"
  | "cards-create"
  | "insurances"
  | "insurances-create";

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
  // Coherence links: a card swipe ties to a card; an invoice payment ties to the invoice.
  // Used by the dashboard to avoid double-counting and by the cards screen to filter.
  cardId?: string;
  relatedInvoiceId?: string;
};

export type BankingInvoiceStatus = "draft" | "paid";

export type BankingInvoice = {
  id: string;
  type: "paye" | "achat"; // paye = sale (receivable), achat = purchase (payable)
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
  isMain?: boolean;
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
  type: "paye" | "achat";
  clientName: string;
  invoiceObject: string;
  amountHT: number;
  vat: number;
  dueDate: string;
};

/* -------------------------------------------------------------------------- */
/*  Seed data — Today (per the app) is 2026-05-13.                            */
/*                                                                            */
/*  Coherence invariants enforced in this seed:                               */
/*  1. Every PAID "paye" invoice has a matching credit transaction            */
/*     (same TTC amount, same client, +/- a few days) with relatedInvoiceId.  */
/*  2. Every "achat" invoice that's PAID has a matching debit transaction.    */
/*  3. Each card's `spent` = sum of debit transactions in the CURRENT MONTH   */
/*     where cardId === card.id. Frozen cards count their last cycle's tab.   */
/*  4. pendingBalance = sum of TTC of DRAFT "paye" invoices (receivables).    */
/*  5. Dashboard revenue is paid invoices + credit txns *without*             */
/*     relatedInvoiceId, so the invoice + its payment aren't double-counted.  */
/* -------------------------------------------------------------------------- */

export const mockProfiles: BankingProfile[] = [
  /* ============================== YOUNES ============================== */
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
    availableBalance: 0, // computed from sub-accounts in createInitialProfiles
    pendingBalance: 48000, // = inv-y-3 (only unpaid receivable)
    subAccounts: [
      {
        id: "sub-y-1",
        name: "Compte Principal",
        balance: 145000.5,
        currency: "MAD",
        theme: "navy-gold",
        isMain: true,
      },
      {
        id: "sub-y-2",
        name: "Provision TVA & Impôts",
        balance: 35400.0,
        currency: "MAD",
        theme: "emerald",
      },
    ],
    cards: [
      // spent values are reconciled with May transactions below
      {
        id: "card-y-1",
        name: "Carte Corporate",
        cardholder: "Younes Belhamdounia",
        network: "VISA",
        maskedPan: "•••• 2456",
        expiry: "12/28",
        limit: 50000,
        spent: 12450,
        status: "active",
      },
      {
        id: "card-y-2",
        name: "Dépenses Marketing",
        cardholder: "Younes Belhamdounia",
        network: "Mastercard",
        maskedPan: "•••• 8832",
        expiry: "06/27",
        limit: 20000,
        spent: 18500,
        status: "active",
      },
    ],
    transactions: [
      /* -------------------- MAI 2026 (Ce mois) -------------------- */
      // Credits — encaissements de factures (chacun lié à son invoice)
      {
        id: "tx-y-50",
        title: "Encaissement F-2026-046",
        counterparty: "Banque Populaire",
        amount: 38500,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-05-12T11:20:00.000Z",
        note: "Conseil mensuel Q2",
        relatedInvoiceId: "inv-y-12",
      },
      {
        id: "tx-y-54",
        title: "Encaissement F-2026-045",
        counterparty: "Sothema Pharma",
        amount: 26400,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-05-03T15:45:00.000Z",
        note: "Audit conformité",
        relatedInvoiceId: "inv-y-11",
      },

      // Debits — hors-carte (virements, prélèvements)
      {
        id: "tx-y-51",
        title: "Paiement Fournisseur",
        counterparty: "Maroc Telecom",
        amount: 1250,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-10T14:30:00.000Z",
        note: "Flotte mobile",
      },
      {
        id: "tx-y-52",
        title: "Salaire Mai",
        counterparty: "Amine Bennani",
        amount: 8500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-08T09:00:00.000Z",
      },
      {
        id: "tx-y-53",
        title: "Loyer Bureau",
        counterparty: "Syndic Tour CFC",
        amount: 6500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-05T09:00:00.000Z",
      },
      {
        id: "tx-y-55",
        title: "Achat Fournitures",
        counterparty: "Papeterie Maroc",
        amount: 950,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-02T13:10:00.000Z",
      },
      {
        id: "tx-y-56",
        title: "Frais Bancaires",
        counterparty: "MyLegal Banking",
        amount: 320,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-01T08:00:00.000Z",
        note: "Commissions mensuelles",
      },

      // Debits — Carte Corporate (card-y-1) — somme = 12 450
      {
        id: "tx-y-c1",
        title: "Paiement VISA",
        counterparty: "Restaurant Le Cabestan",
        amount: 1850,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-11T13:20:00.000Z",
        note: "Carte Corporate • •••• 2456",
        cardId: "card-y-1",
      },
      {
        id: "tx-y-c2",
        title: "Paiement VISA",
        counterparty: "Mövenpick Rabat",
        amount: 3200,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-09T08:40:00.000Z",
        note: "Mission Rabat - 2 nuits",
        cardId: "card-y-1",
      },
      {
        id: "tx-y-c3",
        title: "Paiement VISA",
        counterparty: "Total Energies Anfa",
        amount: 650,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-08T17:55:00.000Z",
        note: "Carburant",
        cardId: "card-y-1",
      },
      {
        id: "tx-y-c4",
        title: "Paiement VISA",
        counterparty: "ONCF Casa-Rabat",
        amount: 450,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-07T07:30:00.000Z",
        note: "Aller-retour 1ère classe",
        cardId: "card-y-1",
      },
      {
        id: "tx-y-c5",
        title: "Abonnement VISA",
        counterparty: "Microsoft 365 Business",
        amount: 3000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-05T03:00:00.000Z",
        note: "Renouvellement annuel",
        cardId: "card-y-1",
      },
      {
        id: "tx-y-c6",
        title: "Abonnement VISA",
        counterparty: "Adobe Creative Cloud",
        amount: 1200,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-04T03:00:00.000Z",
        cardId: "card-y-1",
      },
      {
        id: "tx-y-c7",
        title: "Paiement VISA",
        counterparty: "Office Depot Casa",
        amount: 1800,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-02T11:15:00.000Z",
        note: "Fournitures bureau",
        cardId: "card-y-1",
      },
      {
        id: "tx-y-c8",
        title: "Paiement VISA",
        counterparty: "Cabify Casablanca",
        amount: 300,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-01T18:40:00.000Z",
        cardId: "card-y-1",
      },

      // Debits — Dépenses Marketing (card-y-2) — somme = 18 500
      {
        id: "tx-y-m1",
        title: "Paiement Mastercard",
        counterparty: "Google Ads Maroc",
        amount: 4500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-10T03:00:00.000Z",
        note: "Campagne SEM Mai",
        cardId: "card-y-2",
      },
      {
        id: "tx-y-m2",
        title: "Abonnement Mastercard",
        counterparty: "LinkedIn Sales Navigator",
        amount: 3500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-08T03:00:00.000Z",
        cardId: "card-y-2",
      },
      {
        id: "tx-y-m3",
        title: "Paiement Mastercard",
        counterparty: "Cinexil Production",
        amount: 5500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-05T15:00:00.000Z",
        note: "Vidéo corporate",
        cardId: "card-y-2",
      },
      {
        id: "tx-y-m4",
        title: "Paiement Mastercard",
        counterparty: "Salon Avocats Marrakech",
        amount: 5000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-02T10:00:00.000Z",
        note: "Sponsoring stand",
        cardId: "card-y-2",
      },

      /* -------------------- AVRIL 2026 (Mois dernier) -------------------- */
      {
        id: "tx-y-1",
        title: "Apport en compte",
        counterparty: "Younes Belhamdounia",
        amount: 45000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-04-28T10:15:00.000Z",
        note: "Apport associé - trésorerie",
      },
      {
        id: "tx-y-2",
        title: "Prélèvement DGI",
        counterparty: "Trésorerie Générale du Royaume",
        amount: 12500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-26T08:30:00.000Z",
        note: "IS 1er Acompte",
      },
      {
        id: "tx-y-3",
        title: "Paiement Fournisseur",
        counterparty: "Maroc Telecom",
        amount: 1250,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-25T14:20:00.000Z",
        note: "Flotte mobile",
      },
      {
        id: "tx-y-4",
        title: "Salaire Avril",
        counterparty: "Amine Bennani",
        amount: 8500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-24T09:00:00.000Z",
      },
      {
        id: "tx-y-21",
        title: "Encaissement F-2026-041",
        counterparty: "Attijariwafa Bank",
        amount: 30000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-04-18T11:00:00.000Z",
        note: "Règlement consultation RGPD",
        relatedInvoiceId: "inv-y-1",
      },
      {
        id: "tx-y-5",
        title: "Achat Matériel",
        counterparty: "Electroplanet Casa",
        amount: 3499,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-12T16:12:00.000Z",
      },
      {
        id: "tx-y-22",
        title: "Loyer Bureau",
        counterparty: "Syndic Tour CFC",
        amount: 6500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-05T09:00:00.000Z",
      },

      /* -------------------- MARS 2026 -------------------- */
      {
        id: "tx-y-24",
        title: "Encaissement F-2026-038",
        counterparty: "Label'Vie SA",
        amount: 66000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-03-25T10:15:00.000Z",
        note: "Honoraires juridiques",
        relatedInvoiceId: "inv-y-21",
      },
      {
        id: "tx-y-25",
        title: "Salaire Mars",
        counterparty: "Amine Bennani",
        amount: 8500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-03-24T09:00:00.000Z",
      },
      {
        id: "tx-y-26",
        title: "Paiement Fournisseur",
        counterparty: "Maroc Telecom",
        amount: 1250,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-03-20T14:20:00.000Z",
      },
      {
        id: "tx-y-27",
        title: "Prélèvement DGI",
        counterparty: "Trésorerie Générale",
        amount: 4500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-03-15T08:30:00.000Z",
        note: "IR Mensuel",
      },
      {
        id: "tx-y-28",
        title: "Encaissement F-2026-037",
        counterparty: "ONCF",
        amount: 33600,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-03-10T11:45:00.000Z",
        note: "Acompte rédaction statuts",
        relatedInvoiceId: "inv-y-22",
      },

      /* -------------------- FEVRIER 2026 -------------------- */
      {
        id: "tx-y-29",
        title: "Encaissement F-2026-030",
        counterparty: "Holmarcom Group",
        amount: 50400,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-02-20T15:20:00.000Z",
        note: "Consulting RGPD",
        relatedInvoiceId: "inv-y-23",
      },
      {
        id: "tx-y-30",
        title: "Salaire Février",
        counterparty: "Amine Bennani",
        amount: 8500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-02-24T09:00:00.000Z",
      },
    ],
    invoices: [
      /* --- PAYE (ventes) --- */
      // Avril
      {
        id: "inv-y-1",
        type: "paye",
        reference: "F-2026-041",
        clientName: "Attijariwafa Bank",
        invoiceObject: "Consultation RGPD",
        amountHT: 25000,
        vat: 20,
        totalTTC: 30000,
        dueDate: "2026-05-15T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-04-10T10:00:00.000Z",
      },
      {
        id: "inv-y-3",
        type: "paye",
        reference: "F-2026-043",
        clientName: "ONCF",
        invoiceObject: "Rédaction Statuts Filiale",
        amountHT: 40000,
        vat: 20,
        totalTTC: 48000,
        dueDate: "2026-05-25T00:00:00.000Z",
        status: "draft",
        createdAt: "2026-04-25T09:15:00.000Z",
      }, // ← receivable

      // Mai
      {
        id: "inv-y-11",
        type: "paye",
        reference: "F-2026-045",
        clientName: "Sothema Pharma",
        invoiceObject: "Audit Conformité Réglementaire",
        amountHT: 22000,
        vat: 20,
        totalTTC: 26400,
        dueDate: "2026-06-15T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-05-03T10:00:00.000Z",
      },
      {
        id: "inv-y-12",
        type: "paye",
        reference: "F-2026-046",
        clientName: "Banque Populaire",
        invoiceObject: "Conseil Mensuel Q2",
        amountHT: 32083,
        vat: 20,
        totalTTC: 38500,
        dueDate: "2026-06-12T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-05-12T11:00:00.000Z",
      },

      // Mars (historiques pour les credits liés)
      {
        id: "inv-y-21",
        type: "paye",
        reference: "F-2026-038",
        clientName: "Label'Vie SA",
        invoiceObject: "Honoraires juridiques mensuels",
        amountHT: 55000,
        vat: 20,
        totalTTC: 66000,
        dueDate: "2026-04-10T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-03-20T10:00:00.000Z",
      },
      {
        id: "inv-y-22",
        type: "paye",
        reference: "F-2026-037",
        clientName: "ONCF",
        invoiceObject: "Acompte rédaction statuts",
        amountHT: 28000,
        vat: 20,
        totalTTC: 33600,
        dueDate: "2026-04-15T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-03-08T10:00:00.000Z",
      },
      {
        id: "inv-y-23",
        type: "paye",
        reference: "F-2026-030",
        clientName: "Holmarcom Group",
        invoiceObject: "Mission Consulting RGPD",
        amountHT: 42000,
        vat: 20,
        totalTTC: 50400,
        dueDate: "2026-03-15T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-02-15T10:00:00.000Z",
      },

      /* --- ACHAT (achats) --- */
      {
        id: "inv-y-2",
        type: "achat",
        reference: "FACT-DEL-2026",
        clientName: "Cabinet Deloitte",
        invoiceObject: "Audit Financier T1",
        amountHT: 15000,
        vat: 20,
        totalTTC: 18000,
        dueDate: "2026-04-20T00:00:00.000Z",
        status: "draft",
        createdAt: "2026-04-12T11:30:00.000Z",
      }, // en retard
      {
        id: "inv-y-13",
        type: "achat",
        reference: "FACT-PWC-04",
        clientName: "PwC Morocco",
        invoiceObject: "Expertise Comptable Q2",
        amountHT: 22000,
        vat: 20,
        totalTTC: 26400,
        dueDate: "2026-06-01T00:00:00.000Z",
        status: "draft",
        createdAt: "2026-05-06T09:00:00.000Z",
      },
    ],
    documents: [],
    walletNotes: ["Liquidité MAD sécurisée", "Préparation bilan 2025"],
    employeeInsurances: [
      {
        id: "ins-y-1",
        employeeName: "Amine Bennani",
        role: "Développeur",
        coverageType: "premium",
        premium: 450,
        status: "active",
        startDate: "2026-01-01T00:00:00.000Z",
      },
    ],
  },

  /* ============================== KENZA ============================== */
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
    pendingBalance: 132000, // = inv-k-3 (only unpaid receivable)
    subAccounts: [
      {
        id: "sub-k-1",
        name: "Opérations Courantes",
        balance: 285400.0,
        currency: "MAD",
        theme: "ocean-blue",
        isMain: true,
      },
      {
        id: "sub-k-2",
        name: "Fonds de Roulement",
        balance: 150000.0,
        currency: "MAD",
        theme: "navy-gold",
      },
    ],
    cards: [
      {
        id: "card-k-1",
        name: "Carte Hébergement",
        cardholder: "Kenza Berrada",
        network: "Mastercard",
        maskedPan: "•••• 4082",
        expiry: "09/29",
        limit: 100000,
        spent: 45000,
        status: "active",
      },
      {
        id: "card-k-2",
        name: "Frais de Déplacement",
        cardholder: "Mehdi Chraibi",
        network: "VISA",
        maskedPan: "•••• 5011",
        expiry: "03/28",
        limit: 15000,
        spent: 2500,
        status: "active",
      },
      {
        id: "card-k-3",
        name: "Abonnements SaaS",
        cardholder: "Kenza Berrada",
        network: "VISA",
        maskedPan: "•••• 1129",
        expiry: "01/27",
        limit: 30000,
        spent: 29500,
        status: "frozen",
      },
    ],
    transactions: [
      /* -------------------- MAI 2026 (Ce mois) -------------------- */
      // Credits — encaissements de factures
      {
        id: "tx-k-50",
        title: "Encaissement F-2026-104",
        counterparty: "Ministère Industrie",
        amount: 175000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-05-13T10:30:00.000Z",
        note: "Plateforme nationale - Lot 1",
        relatedInvoiceId: "inv-k-11",
      },
      {
        id: "tx-k-54",
        title: "Encaissement F-2026-105",
        counterparty: "BMCI Bank",
        amount: 64000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-05-04T11:15:00.000Z",
        note: "Module e-banking Lot 3",
        relatedInvoiceId: "inv-k-12",
      },
      {
        id: "tx-k-57",
        title: "Encaissement F-2026-106",
        counterparty: "Auto Hall",
        amount: 41000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-05-01T10:00:00.000Z",
        note: "Plateforme dealer",
        relatedInvoiceId: "inv-k-13",
      },

      // Debits — hors-carte
      {
        id: "tx-k-52",
        title: "Salaires Equipe Tech",
        counterparty: "Virements Multiples",
        amount: 28000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-08T09:00:00.000Z",
        note: "4 collaborateurs",
      },
      {
        id: "tx-k-53",
        title: "Paiement TPE",
        counterparty: "Apple Premium Casa",
        amount: 24500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-06T16:20:00.000Z",
        note: "MacBooks équipe",
      },
      {
        id: "tx-k-55",
        title: "Loyer Bureau",
        counterparty: "Gestion Technopark",
        amount: 8500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-05T08:30:00.000Z",
      },
      {
        id: "tx-k-56",
        title: "Campagne Marketing",
        counterparty: "Google Ads",
        amount: 14000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-02T14:00:00.000Z",
      },

      // Debits — Carte Hébergement (card-k-1) — somme = 45 000
      {
        id: "tx-k-c1",
        title: "Abonnement Mastercard",
        counterparty: "Amazon Web Services",
        amount: 18500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-11T12:45:00.000Z",
        note: "Cloud Q2 2026",
        cardId: "card-k-1",
        relatedInvoiceId: "inv-k-14",
      },
      {
        id: "tx-k-c2",
        title: "Abonnement Mastercard",
        counterparty: "DigitalOcean",
        amount: 4500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-10T03:00:00.000Z",
        cardId: "card-k-1",
      },
      {
        id: "tx-k-c3",
        title: "Abonnement Mastercard",
        counterparty: "Vercel Enterprise",
        amount: 3500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-08T03:00:00.000Z",
        cardId: "card-k-1",
      },
      {
        id: "tx-k-c4",
        title: "Abonnement Mastercard",
        counterparty: "Cloudflare Business",
        amount: 2500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-07T03:00:00.000Z",
        cardId: "card-k-1",
      },
      {
        id: "tx-k-c5",
        title: "Abonnement Mastercard",
        counterparty: "Datadog Pro",
        amount: 5000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-05T03:00:00.000Z",
        cardId: "card-k-1",
      },
      {
        id: "tx-k-c6",
        title: "Abonnement Mastercard",
        counterparty: "GitHub Enterprise",
        amount: 4500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-04T03:00:00.000Z",
        cardId: "card-k-1",
      },
      {
        id: "tx-k-c7",
        title: "Abonnement Mastercard",
        counterparty: "MongoDB Atlas",
        amount: 3000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-03T03:00:00.000Z",
        cardId: "card-k-1",
      },
      {
        id: "tx-k-c8",
        title: "Abonnement Mastercard",
        counterparty: "New Relic",
        amount: 3500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-02T03:00:00.000Z",
        cardId: "card-k-1",
      },

      // Debits — Frais de Déplacement (card-k-2) — somme = 2 500
      {
        id: "tx-k-d1",
        title: "Paiement VISA",
        counterparty: "CTM Marrakech",
        amount: 250,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-12T07:20:00.000Z",
        note: "Mission commerciale",
        cardId: "card-k-2",
      },
      {
        id: "tx-k-d2",
        title: "Paiement VISA",
        counterparty: "Hôtel Atlas Tanger",
        amount: 1200,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-08T22:00:00.000Z",
        note: "1 nuit",
        cardId: "card-k-2",
      },
      {
        id: "tx-k-d3",
        title: "Paiement VISA",
        counterparty: "Restaurant Le Riad",
        amount: 450,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-04T20:30:00.000Z",
        note: "Repas client",
        cardId: "card-k-2",
      },
      {
        id: "tx-k-d4",
        title: "Paiement VISA",
        counterparty: "Carburant Total",
        amount: 600,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-05-02T11:00:00.000Z",
        cardId: "card-k-2",
      },

      /* -------------------- AVRIL 2026 -------------------- */
      // Carte Abonnements SaaS (card-k-3) — gelée en fin avril, somme = 29 500
      {
        id: "tx-k-s1",
        title: "Abonnement VISA",
        counterparty: "Atlassian Cloud Suite",
        amount: 5000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-25T03:00:00.000Z",
        cardId: "card-k-3",
      },
      {
        id: "tx-k-s2",
        title: "Abonnement VISA",
        counterparty: "Figma Organization",
        amount: 6000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-22T03:00:00.000Z",
        cardId: "card-k-3",
      },
      {
        id: "tx-k-s3",
        title: "Abonnement VISA",
        counterparty: "Slack Premium",
        amount: 4500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-18T03:00:00.000Z",
        cardId: "card-k-3",
      },
      {
        id: "tx-k-s4",
        title: "Abonnement VISA",
        counterparty: "Notion Enterprise",
        amount: 3500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-15T03:00:00.000Z",
        cardId: "card-k-3",
      },
      {
        id: "tx-k-s5",
        title: "Abonnement VISA",
        counterparty: "Linear Business",
        amount: 3000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-12T03:00:00.000Z",
        cardId: "card-k-3",
      },
      {
        id: "tx-k-s6",
        title: "Abonnement VISA",
        counterparty: "Loom Business",
        amount: 2500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-10T03:00:00.000Z",
        cardId: "card-k-3",
      },
      {
        id: "tx-k-s7",
        title: "Abonnement VISA",
        counterparty: "Calendly Premium",
        amount: 2500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-08T03:00:00.000Z",
        cardId: "card-k-3",
      },
      {
        id: "tx-k-s8",
        title: "Abonnement VISA",
        counterparty: "Canva Pro Team",
        amount: 2500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-05T03:00:00.000Z",
        cardId: "card-k-3",
      },

      // Autres flux d'avril
      {
        id: "tx-k-1",
        title: "Encaissement F-2026-099",
        counterparty: "Groupe OCP",
        amount: 144000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-04-28T14:05:00.000Z",
        note: "Plateforme analytics",
        relatedInvoiceId: "inv-k-21",
      },
      {
        id: "tx-k-21",
        title: "Encaissement F-2026-101",
        counterparty: "Bank of Africa",
        amount: 102000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-04-15T11:00:00.000Z",
        note: "Application iOS livrée",
        relatedInvoiceId: "inv-k-1",
      },
      {
        id: "tx-k-22",
        title: "Campagne Marketing",
        counterparty: "Google Ads",
        amount: 12000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-04-10T14:30:00.000Z",
      },
      {
        id: "tx-k-23",
        title: "Encaissement F-2026-100",
        counterparty: "Client B2B Agadir",
        amount: 34000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-04-05T09:15:00.000Z",
        note: "Site vitrine",
        relatedInvoiceId: "inv-k-22",
      },

      /* -------------------- MARS 2026 -------------------- */
      {
        id: "tx-k-24",
        title: "Encaissement F-2026-095",
        counterparty: "INWI",
        amount: 114000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-03-28T10:00:00.000Z",
        note: "Refonte plateforme web",
        relatedInvoiceId: "inv-k-23",
      },
      {
        id: "tx-k-25",
        title: "Abonnement Mastercard",
        counterparty: "Amazon Web Services",
        amount: 15000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-03-11T12:00:00.000Z",
        note: "Cloud Q1 2026",
        cardId: "card-k-1",
        relatedInvoiceId: "inv-k-2",
      },
      {
        id: "tx-k-26",
        title: "Salaires Equipe Tech",
        counterparty: "Virements Multiples",
        amount: 22000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-03-24T09:00:00.000Z",
      },
      {
        id: "tx-k-27",
        title: "Encaissement F-2026-094",
        counterparty: "Acme Corp EU",
        amount: 54000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-03-12T15:45:00.000Z",
        note: "Licences logiciel",
        relatedInvoiceId: "inv-k-24",
      },
      {
        id: "tx-k-28",
        title: "Loyer Bureau",
        counterparty: "Gestion Technopark",
        amount: 8500,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-03-05T08:30:00.000Z",
      },

      /* -------------------- FEVRIER 2026 -------------------- */
      {
        id: "tx-k-29",
        title: "Encaissement F-2026-090",
        counterparty: "Ministère Transition Numérique",
        amount: 132000,
        currency: "MAD",
        kind: "credit",
        createdAt: "2026-02-15T11:20:00.000Z",
        note: "Acompte projet digital",
        relatedInvoiceId: "inv-k-25",
      },
      {
        id: "tx-k-30",
        title: "Salaires Equipe Tech",
        counterparty: "Virements Multiples",
        amount: 22000,
        currency: "MAD",
        kind: "debit",
        createdAt: "2026-02-24T09:00:00.000Z",
      },
    ],
    invoices: [
      /* --- PAYE (ventes) --- */
      // Mars
      {
        id: "inv-k-1",
        type: "paye",
        reference: "F-2026-101",
        clientName: "Bank of Africa",
        invoiceObject: "Développement Application iOS",
        amountHT: 85000,
        vat: 20,
        totalTTC: 102000,
        dueDate: "2026-04-30T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-03-10T10:00:00.000Z",
      },

      // Avril
      {
        id: "inv-k-3",
        type: "paye",
        reference: "F-2026-102",
        clientName: "Ministère Transition Numérique",
        invoiceObject: "Lot 2 - Plateforme e-Gov",
        amountHT: 110000,
        vat: 20,
        totalTTC: 132000,
        dueDate: "2026-06-30T00:00:00.000Z",
        status: "draft",
        createdAt: "2026-04-28T09:15:00.000Z",
      }, // ← receivable
      {
        id: "inv-k-21",
        type: "paye",
        reference: "F-2026-099",
        clientName: "Groupe OCP",
        invoiceObject: "Plateforme analytics interne",
        amountHT: 120000,
        vat: 20,
        totalTTC: 144000,
        dueDate: "2026-05-15T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-04-15T10:00:00.000Z",
      },
      {
        id: "inv-k-22",
        type: "paye",
        reference: "F-2026-100",
        clientName: "Client B2B Agadir",
        invoiceObject: "Site vitrine et SEO",
        amountHT: 28333,
        vat: 20,
        totalTTC: 34000,
        dueDate: "2026-05-05T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-04-02T10:00:00.000Z",
      },

      // Mai
      {
        id: "inv-k-11",
        type: "paye",
        reference: "F-2026-104",
        clientName: "Ministère Industrie",
        invoiceObject: "Plateforme Nationale - Acompte",
        amountHT: 145833,
        vat: 20,
        totalTTC: 175000,
        dueDate: "2026-06-30T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-05-13T10:00:00.000Z",
      },
      {
        id: "inv-k-12",
        type: "paye",
        reference: "F-2026-105",
        clientName: "BMCI Bank",
        invoiceObject: "Module e-banking Lot 3",
        amountHT: 53333,
        vat: 20,
        totalTTC: 64000,
        dueDate: "2026-06-04T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-05-04T10:00:00.000Z",
      },
      {
        id: "inv-k-13",
        type: "paye",
        reference: "F-2026-106",
        clientName: "Auto Hall",
        invoiceObject: "Plateforme Dealer Network",
        amountHT: 34167,
        vat: 20,
        totalTTC: 41000,
        dueDate: "2026-06-01T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-05-01T09:00:00.000Z",
      },

      // Historiques
      {
        id: "inv-k-23",
        type: "paye",
        reference: "F-2026-095",
        clientName: "INWI",
        invoiceObject: "Refonte plateforme web",
        amountHT: 95000,
        vat: 20,
        totalTTC: 114000,
        dueDate: "2026-04-25T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-03-15T10:00:00.000Z",
      },
      {
        id: "inv-k-24",
        type: "paye",
        reference: "F-2026-094",
        clientName: "Acme Corp EU",
        invoiceObject: "Licences logiciel annuelles",
        amountHT: 45000,
        vat: 20,
        totalTTC: 54000,
        dueDate: "2026-04-10T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-03-01T10:00:00.000Z",
      },
      {
        id: "inv-k-25",
        type: "paye",
        reference: "F-2026-090",
        clientName: "Ministère Transition Numérique",
        invoiceObject: "Acompte projet digital",
        amountHT: 110000,
        vat: 20,
        totalTTC: 132000,
        dueDate: "2026-03-15T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-02-10T10:00:00.000Z",
      },

      /* --- ACHAT (achats) --- */
      // Q1 - payée le 11 mars via card-k-1 (tx-k-25)
      {
        id: "inv-k-2",
        type: "achat",
        reference: "INV-AWS-889",
        clientName: "Amazon Web Services",
        invoiceObject: "Services Cloud Q1",
        amountHT: 15000,
        vat: 0,
        totalTTC: 15000,
        dueDate: "2026-04-15T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-03-01T11:30:00.000Z",
      },
      // Q2 - payée le 11 mai via card-k-1 (tx-k-c1)
      {
        id: "inv-k-14",
        type: "achat",
        reference: "INV-AWS-902",
        clientName: "Amazon Web Services",
        invoiceObject: "Services Cloud Q2",
        amountHT: 18500,
        vat: 0,
        totalTTC: 18500,
        dueDate: "2026-06-11T00:00:00.000Z",
        status: "paid",
        createdAt: "2026-05-01T11:30:00.000Z",
      },
    ],
    documents: [],
    walletNotes: ["Croissance Q2", "Renouvellement parc IT"],
    employeeInsurances: [
      {
        id: "ins-k-1",
        employeeName: "Mehdi Chraibi",
        role: "Directeur Commercial",
        coverageType: "executive",
        premium: 850,
        status: "active",
        startDate: "2025-09-01T00:00:00.000Z",
      },
      {
        id: "ins-k-2",
        employeeName: "Sara El Amrani",
        role: "Lead Developer",
        coverageType: "premium",
        premium: 550,
        status: "active",
        startDate: "2025-11-15T00:00:00.000Z",
      },
      {
        id: "ins-k-3",
        employeeName: "Karim Tazi",
        role: "DevOps Engineer",
        coverageType: "premium",
        premium: 550,
        status: "active",
        startDate: "2026-01-10T00:00:00.000Z",
      },
      {
        id: "ins-k-4",
        employeeName: "Nadia Lahlou",
        role: "Product Manager",
        coverageType: "premium",
        premium: 550,
        status: "pending",
        startDate: "2026-05-01T00:00:00.000Z",
      },
    ],
  },
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
      employeeInsurances: [...profile.employeeInsurances],
    };
  });
}

export function findProfileByEmail(email: string) {
  return mockProfiles.find((profile) => profile.email.toLowerCase() === email.toLowerCase());
}

export function getProfileSeed(profileId: string) {
  return mockProfiles.find((profile) => profile.id === profileId);
}
