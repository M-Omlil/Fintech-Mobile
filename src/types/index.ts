/**
 * Shared domain types for Amano (MAD business banking). Kept presentation-agnostic;
 * repositories return these shapes and screens render them.
 */

export type CurrencyCode = "MAD";

/**
 * Moroccan legal/fiscal identifiers (mega-prompt §3). Attached to the business and to
 * clients/suppliers, and snapshotted onto invoices/quotes headers & footers.
 */
export type LegalIdentifiers = {
  /** Identifiant Commun de l'Entreprise. */
  ice?: string;
  /** Identifiant Fiscal. */
  if?: string;
  /** Registre de Commerce. */
  rc?: string;
  /** Caisse Nationale de Sécurité Sociale. */
  cnss?: string;
};

/** The signed-in sole-proprietor identity. */
export type Business = {
  id: string;
  /** Legal/display name, e.g. "EI - Belhamdounia You…". */
  name: string;
  ownerName: string;
  /** Moroccan RIB (24 digits) — the primary bank identifier. */
  rib: string;
  /** IBAN (secondary identifier, derived from the RIB). */
  iban: string;
  currency: CurrencyCode;
  legal: LegalIdentifiers;
  /** Contact block, shown in the invoice document footer. */
  email?: string;
  phone?: string;
  address?: string;
};

export type AccountStatus = "active" | "inactive";

/** A money pot under the business (main account, rémunération, …). */
export type Account = {
  id: string;
  name: string;
  balance: number;
  currency: CurrencyCode;
  status: AccountStatus;
  isMain: boolean;
};

export type CardNetwork = "visa" | "mastercard";
export type CardStatus = "active" | "blocked";

/** Per-card payment capability switches (Cartes). */
export type CardSettings = {
  cashWithdrawal: boolean;
  foreignPayment: boolean;
  onlinePayment: boolean;
  contactlessPayment: boolean;
};

export type Card = {
  id: string;
  productLabel: string;
  nickname: string;
  maskedPan: string;
  network: CardNetwork;
  status: CardStatus;
  monthlyLimit: number;
  monthlySpent: number;
  settings: CardSettings;
  addedToWallet: boolean;
};

export type TransactionType = "revenu" | "depense";
export type TransactionStatus = "executed" | "pending" | "refused";
export type ReceiptState = "none" | "missing" | "added";
export type PaymentMethod = "transfer" | "card" | "direct_debit" | "other";

export type Transaction = {
  id: string;
  label: string;
  counterparty: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  date: string; // ISO
  status: TransactionStatus;
  receipt: ReceiptState;
  method: PaymentMethod;
  /** Account this operation belongs to (for "Filtrer par compte"). */
  accountId?: string;
  memberId?: string;
};

export type TransferStatus = "ongoing" | "past" | "cancelled";

export type Transfer = {
  id: string;
  beneficiary: string;
  amount: number;
  currency: CurrencyCode;
  status: TransferStatus;
  /** Execution date (ISO) — in the future when the virement is scheduled (différé). */
  date: string;
  /** Optional payment reference / motif shown on the list and statement. */
  reference?: string;
  /** Destination bank captured at creation time (display only). */
  bank?: string;
};

/** A saved transfer beneficiary (Virements). */
export type Beneficiary = {
  id: string;
  name: string;
  bank: string;
  /** Stored as a RIB or IBAN string (formatted). */
  account: string;
  defaultReason?: string;
};

/** A billable line, shared by devis and factures (DRY substrate, §6). */
export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

/**
 * Accepted payment conditions on a facture (UC1). A facture may carry several at once
 * (e.g. RIB + lien de paiement). `rib` resolves to the business RIB on the document.
 * - `rib`          → Virement bancaire (RIB)
 * - `payment_link` → Lien de paiement en ligne
 * - `cashplus`     → Cashplus (cash transfer network)
 * - `especes`      → Espèces
 * - `cheque`       → Chèque
 */
export type PaymentMethodKind = "rib" | "payment_link" | "cashplus" | "especes" | "cheque";

/** Devis (quote) lifecycle — pre-sale, non-binding. */
export type QuoteStatus = "en_attente" | "accepte" | "refuse" | "expire";

export type Quote = {
  id: string;
  /** DEV-YYYY-NNN. */
  number: string;
  clientId?: string;
  clientName?: string;
  /** Optional client ICE captured on the devis (UC1). */
  clientIce?: string;
  issueDate: string; // ISO
  expiryDate: string; // ISO
  status: QuoteStatus;
  lines: LineItem[];
  totalHT: number;
  vatAmount: number;
  totalTTC: number;
  /** Set once converted via "Convertir en facture". */
  convertedInvoiceId?: string;
};

/** Facture (invoice) lifecycle — post-agreement, legally binding. */
export type InvoiceStatus = "brouillon" | "envoyee" | "payee" | "en_retard" | "annulee";

/**
 * Document nature (classement): facture de vente (FV), facture d'achat (FA), or a
 * payment justificatif. Drives numbering, the document filename, and the classement tree.
 */
export type InvoiceKind = "vente" | "achat" | "justificatif";

export type Invoice = {
  id: string;
  /** FV-YYYY/NNN, FA-YYYY/NNN, or a justificatif reference. */
  number: string;
  /** Document nature (defaults to "vente"). */
  kind: InvoiceKind;
  clientId?: string;
  clientName?: string;
  /** Optional client ICE captured on the facture (UC1). */
  clientIce?: string;
  issueDate: string; // ISO
  dueDate: string; // ISO
  status: InvoiceStatus;
  lines: LineItem[];
  totalHT: number;
  vatAmount: number;
  totalTTC: number;
  /** Accepted payment conditions (UC1) — empty until chosen on the form. */
  paymentMethods?: PaymentMethodKind[];
  /** Legal identifiers snapshotted at issue time (header/footer). */
  legal: LegalIdentifiers;
  /** Set when generated from a quote. */
  sourceQuoteId?: string;
  /** Set when generated from a signed bon de commande (UC1 e-sign chain). */
  sourcePurchaseOrderId?: string;
  /** Reconciliation: when the payment was recorded + by which method. */
  paidAt?: string;
  paidMethod?: PaymentMethodKind;
};

/** Bon de commande (purchase order) lifecycle — sits between a validated devis and the
 * facture, and is the document the client signs electronically (UC1). */
export type PurchaseOrderStatus = "en_attente_signature" | "signe" | "annule";

/** Tamper-evident record archived when a bon de commande is signed (UC1 §6). */
export type SignatureProof = {
  signerName: string;
  /** When the signature was captured (ISO). */
  signedAt: string;
  /** SVG path data of the hand-drawn signature ("" when only typed/consented). */
  strokes: string;
  /** Human-readable proof/archive reference, e.g. "SIGN-AB12CD34". */
  reference: string;
};

export type PurchaseOrder = {
  id: string;
  /** BC-YYYY-NNN. */
  number: string;
  /** The validated devis this order was generated from. */
  quoteId: string;
  clientName?: string;
  clientIce?: string;
  issueDate: string; // ISO
  lines: LineItem[];
  totalHT: number;
  vatAmount: number;
  totalTTC: number;
  status: PurchaseOrderStatus;
  /** Present once signed electronically. */
  signature?: SignatureProof;
  /** The facture generated from this signed order. */
  invoiceId?: string;
};

export type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  legal: LegalIdentifiers;
};

export type Product = {
  id: string;
  name: string;
  unitPrice: number;
  vatRate: number;
};

export type SupplierStatus = "active" | "archived";

export type Supplier = {
  id: string;
  name: string;
  status: SupplierStatus;
  legal: LegalIdentifiers;
};

/** A teammate that can hold a fleet card (Cartes — empty by default). */
export type TeamMember = {
  id: string;
  name: string;
  email: string;
};

export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "paused" | "cancelled";

/** A recurring subscription tracked in the Abonnements manager. */
export type Subscription = {
  id: string;
  name: string;
  /** Amount per `cycle`, in the business currency. */
  amount: number;
  currency: CurrencyCode;
  cycle: BillingCycle;
  /** Next renewal/charge date. */
  nextRenewal: string; // ISO
  status: SubscriptionStatus;
  /** Free-text category (e.g. "Logiciels", "Marketing"). */
  category?: string;
};

/** Credentials for signing in. */
export type Credentials = {
  email: string;
  password: string;
};

/** Input for creating a new business account. */
export type RegisterInput = {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
};
