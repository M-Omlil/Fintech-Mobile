import type {
  Account,
  Beneficiary,
  BillingCycle,
  Business,
  Card,
  CardSettings,
  Client,
  Credentials,
  Invoice,
  InvoiceKind,
  InvoiceStatus,
  LegalIdentifiers,
  PaymentMethodKind,
  Product,
  PurchaseOrder,
  Quote,
  QuoteStatus,
  RegisterInput,
  Subscription,
  SubscriptionStatus,
  Supplier,
  TeamMember,
  Transaction,
  Transfer,
} from "@domain/index";

/**
 * Repository contracts (Dependency Inversion + Interface Segregation). Features depend
 * on these interfaces; the concrete data source (persistent store now, SQLite/API
 * later) is injected via the DI container.
 */

export type AuthRepository = {
  login(credentials: Credentials): Promise<Business>;
  register(input: RegisterInput): Promise<Business>;
};

export type ProfileRepository = {
  getBusiness(): Promise<Business>;
};

export type NewAccountInput = { name: string };

export type AccountsRepository = {
  getAccounts(): Promise<Account[]>;
  getTotalAssets(): Promise<number>;
  addAccount(input: NewAccountInput): Promise<Account>;
  /** Activate an account (e.g. start the Rémunération account). */
  activate(accountId: string): Promise<Account>;
};

export type TransactionFilter = {
  accountId?: string;
  status?: Transaction["status"];
  receipt?: Transaction["receipt"];
  method?: Transaction["method"];
  memberId?: string;
};

export type TransactionsRepository = {
  getTransactions(filter?: TransactionFilter): Promise<Transaction[]>;
  getRecent(limit: number): Promise<Transaction[]>;
};

export type CardsRepository = {
  getCards(): Promise<Card[]>;
  setStatus(cardId: string, status: Card["status"]): Promise<Card>;
  updateSettings(cardId: string, settings: Partial<CardSettings>): Promise<Card>;
  rename(cardId: string, nickname: string): Promise<Card>;
  remove(cardId: string): Promise<void>;
};

export type NewTransferInput = {
  beneficiary: string;
  amount: number;
  reason?: string;
  bank?: string;
  account?: string;
  /** ISO date for a scheduled (différé) virement; omitted ⇒ executed immediately. */
  scheduledDate?: string;
};
export type NewBeneficiaryInput = {
  name: string;
  bank: string;
  account: string;
  defaultReason?: string;
};

/** UI grouping for the Virements tabs: in-progress vs. everything else (past/annulé). */
export type TransferTab = "ongoing" | "history";

export type TransfersRepository = {
  getTransfers(tab: TransferTab): Promise<Transfer[]>;
  create(input: NewTransferInput): Promise<Transfer>;
  getBeneficiaries(): Promise<Beneficiary[]>;
  addBeneficiary(input: NewBeneficiaryInput): Promise<Beneficiary>;
};

/** A line being added to a quote/invoice (id + totals are derived by the repo). */
export type NewLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export type NewQuoteInput = { clientName?: string; clientIce?: string; lines?: NewLineInput[] };
export type NewInvoiceInput = {
  clientName?: string;
  clientIce?: string;
  /** Document nature — facture de vente (default) or facture d'achat. */
  kind?: InvoiceKind;
  lines: NewLineInput[];
  /** Editable facture number (UC1) — defaults to the next FAC-YYYY-NNN. */
  number?: string;
  /** Editable issue date (UC1) — defaults to now. */
  issueDate?: string;
  dueDate?: string;
  /** Chosen payment conditions (UC1). */
  paymentMethods?: PaymentMethodKind[];
};
export type NewClientInput = {
  name: string;
  email?: string;
  phone?: string;
  legal?: LegalIdentifiers;
};
/** Hand-drawn / typed signature captured on a bon de commande (UC1 e-sign). */
export type SignatureInput = { signerName: string; strokes: string };
export type NewProductInput = { name: string; unitPrice: number; vatRate: number };
export type NewSupplierInput = { name: string; legal?: LegalIdentifiers };

/** Devis (quotes) + Factures (invoices) over a shared client/product substrate. */
export type InvoicingRepository = {
  // Devis
  getQuotes(): Promise<Quote[]>;
  createQuote(input?: NewQuoteInput): Promise<Quote>;
  updateQuoteStatus(quoteId: string, status: QuoteStatus): Promise<Quote>;
  convertQuoteToInvoice(quoteId: string): Promise<Invoice>;
  // Cycle commercial : devis validé → bon de commande → signature → facture → paiement
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  /** Validate the devis (status → accepté) and auto-generate the bon de commande. */
  acceptQuoteAndCreateOrder(quoteId: string): Promise<PurchaseOrder>;
  /** Sign the bon de commande electronically (status → signé, proof archived). */
  signPurchaseOrder(orderId: string, signature: SignatureInput): Promise<PurchaseOrder>;
  /** Transform a signed bon de commande into a facture (auto). */
  convertOrderToInvoice(orderId: string): Promise<Invoice>;
  // Factures
  getInvoices(): Promise<Invoice[]>;
  createInvoice(input: NewInvoiceInput): Promise<Invoice>;
  updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<Invoice>;
  /** Set the accepted payment conditions on an existing facture (cycle step 8). */
  setInvoicePaymentMethods(invoiceId: string, methods: PaymentMethodKind[]): Promise<Invoice>;
  /** Record a payment: marks payée, archives the method, and reconciles a revenu. */
  recordInvoicePayment(invoiceId: string, method: PaymentMethodKind): Promise<Invoice>;
  // Shared substrate
  getClients(): Promise<Client[]>;
  addClient(input: NewClientInput): Promise<Client>;
  getProducts(): Promise<Product[]>;
  addProduct(input: NewProductInput): Promise<Product>;
  getSuppliers(): Promise<Supplier[]>;
  addSupplier(input: NewSupplierInput): Promise<Supplier>;
};

export type TeamRepository = {
  getMembers(): Promise<TeamMember[]>;
};

export type NewSubscriptionInput = { name: string; amount: number; cycle: BillingCycle };

export type SubscriptionsRepository = {
  getSubscriptions(): Promise<Subscription[]>;
  addSubscription(input: NewSubscriptionInput): Promise<Subscription>;
  setStatus(id: string, status: SubscriptionStatus): Promise<Subscription>;
  remove(id: string): Promise<void>;
};

/** The full set of repositories exposed by the DI container for a session. */
export type Repositories = {
  profile: ProfileRepository;
  accounts: AccountsRepository;
  transactions: TransactionsRepository;
  cards: CardsRepository;
  transfers: TransfersRepository;
  invoicing: InvoicingRepository;
  team: TeamRepository;
  subscriptions: SubscriptionsRepository;
};
