import type {
  AccountsRepository,
  CardsRepository,
  InvoicingRepository,
  NewAccountInput,
  NewBeneficiaryInput,
  NewClientInput,
  NewInvoiceInput,
  NewLineInput,
  NewProductInput,
  NewQuoteInput,
  NewSubscriptionInput,
  NewSupplierInput,
  NewTransferInput,
  ProfileRepository,
  Repositories,
  SignatureInput,
  SubscriptionsRepository,
  TeamRepository,
  TransactionFilter,
  TransactionsRepository,
  TransfersRepository,
  TransferTab,
} from "@data/repositories/index";
import { genId } from "@data/store/ids";
import { persistentStore } from "@data/store/persistentStore";
import { computeTotalsFromLines } from "@services/tax/tva";
import type {
  Account,
  Beneficiary,
  Card,
  CardSettings,
  Client,
  Invoice,
  InvoiceKind,
  InvoiceStatus,
  LineItem,
  PaymentMethodKind,
  Product,
  PurchaseOrder,
  Quote,
  QuoteStatus,
  Subscription,
  SubscriptionStatus,
  Supplier,
  Transaction,
  Transfer,
} from "@domain/index";

/** A virement settles automatically 24h after it is issued: "en cours" → "exécuté". */
const TRANSFER_SETTLE_MS = 24 * 60 * 60 * 1000;
function settleTransfer(t: Transfer): Transfer {
  if (t.status === "ongoing" && Date.now() - new Date(t.date).getTime() >= TRANSFER_SETTLE_MS) {
    return { ...t, status: "past" };
  }
  return t;
}

function matchesFilter(tx: Transaction, filter?: TransactionFilter): boolean {
  if (!filter) return true;
  if (filter.accountId && tx.accountId !== filter.accountId) return false;
  if (filter.status && tx.status !== filter.status) return false;
  if (filter.receipt && tx.receipt !== filter.receipt) return false;
  if (filter.method && tx.method !== filter.method) return false;
  if (filter.memberId && tx.memberId !== filter.memberId) return false;
  return true;
}

function nextNumber(prefix: string, existing: { number: string }[]): string {
  const year = new Date().getFullYear();
  const seq = existing.length + 1;
  return `${prefix}-${year}-${String(seq).padStart(3, "0")}`;
}

/** Per-kind invoice number, e.g. FV-2026/004 (vente) or FA-2026/004 (achat). */
function nextInvoiceNumber(kind: InvoiceKind, existing: Invoice[]): string {
  const code = kind === "achat" ? "FA" : "FV";
  const year = new Date().getFullYear();
  const seq = existing.filter((i) => i.kind === kind).length + 1;
  return `${code}-${year}/${String(seq).padStart(3, "0")}`;
}

function toLineItems(lines: NewLineInput[]): LineItem[] {
  return lines.map((line) => ({ id: genId("line"), ...line }));
}

/**
 * Concrete repositories backed by the persistent store, scoped to one business.
 * Reads return live snapshots; writes mutate + persist. Devis and Factures share the
 * tax engine, client list, and product catalog (no duplication).
 */
export function createPersistentRepositories(businessId: string): Repositories {
  const read = () => persistentStore.getData(businessId);

  const profile: ProfileRepository = {
    async getBusiness() {
      return read().business;
    },
  };

  const accounts: AccountsRepository = {
    async getAccounts() {
      return read().accounts;
    },
    async getTotalAssets() {
      return read().accounts.reduce((sum, acc) => sum + acc.balance, 0);
    },
    async addAccount(input: NewAccountInput) {
      const account: Account = {
        id: genId("acc"),
        name: input.name,
        balance: 0,
        currency: "MAD",
        status: "active",
        isMain: false,
      };
      await persistentStore.update(businessId, (data) => {
        data.accounts.push(account);
      });
      return account;
    },
    async activate(accountId) {
      let updated: Account | undefined;
      await persistentStore.update(businessId, (data) => {
        const account = data.accounts.find((a) => a.id === accountId);
        if (!account) throw new Error(`Account not found: ${accountId}`);
        account.status = "active";
        updated = account;
      });
      return updated as Account;
    },
  };

  const transactions: TransactionsRepository = {
    async getTransactions(filter) {
      return read()
        .transactions.filter((tx) => matchesFilter(tx, filter))
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    async getRecent(limit) {
      return read()
        .transactions.slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, limit);
    },
  };

  const cards: CardsRepository = {
    async getCards() {
      return read().cards;
    },
    async setStatus(cardId, status: Card["status"]) {
      let updated: Card | undefined;
      await persistentStore.update(businessId, (data) => {
        const card = data.cards.find((c) => c.id === cardId);
        if (!card) throw new Error(`Card not found: ${cardId}`);
        card.status = status;
        updated = card;
      });
      return updated as Card;
    },
    async updateSettings(cardId, settings: Partial<CardSettings>) {
      let updated: Card | undefined;
      await persistentStore.update(businessId, (data) => {
        const card = data.cards.find((c) => c.id === cardId);
        if (!card) throw new Error(`Card not found: ${cardId}`);
        card.settings = { ...card.settings, ...settings };
        updated = card;
      });
      return updated as Card;
    },
    async rename(cardId, nickname) {
      let updated: Card | undefined;
      await persistentStore.update(businessId, (data) => {
        const card = data.cards.find((c) => c.id === cardId);
        if (!card) throw new Error(`Card not found: ${cardId}`);
        card.nickname = nickname;
        updated = card;
      });
      return updated as Card;
    },
    async remove(cardId) {
      await persistentStore.update(businessId, (data) => {
        data.cards = data.cards.filter((c) => c.id !== cardId);
      });
    },
  };

  const transfers: TransfersRepository = {
    async getTransfers(tab: TransferTab) {
      const all = read()
        .transfers.map(settleTransfer)
        .sort((a, b) => b.date.localeCompare(a.date));
      return tab === "ongoing"
        ? all.filter((t) => t.status === "ongoing")
        : all.filter((t) => t.status !== "ongoing");
    },
    async create(input: NewTransferInput) {
      const date = input.scheduledDate ?? new Date().toISOString();
      const reference = input.reason?.trim() || undefined;
      const transfer: Transfer = {
        id: genId("trf"),
        beneficiary: input.beneficiary,
        amount: input.amount,
        currency: "MAD",
        status: "ongoing",
        date,
        reference,
        bank: input.bank,
      };
      const mainId = read().accounts.find((a) => a.isMain)?.id;
      const transaction: Transaction = {
        id: genId("tx"),
        label: reference || input.beneficiary,
        counterparty: input.beneficiary,
        type: "depense",
        amount: input.amount,
        currency: "MAD",
        date,
        status: "pending",
        receipt: "none",
        method: "transfer",
        accountId: mainId,
      };
      await persistentStore.update(businessId, (data) => {
        data.transfers.push(transfer);
        data.transactions.push(transaction);
        const main = data.accounts.find((a) => a.isMain);
        if (main) main.balance = Math.max(0, main.balance - input.amount);
      });
      return transfer;
    },
    async getBeneficiaries() {
      return read().beneficiaries;
    },
    async addBeneficiary(input: NewBeneficiaryInput) {
      const beneficiary: Beneficiary = { id: genId("ben"), ...input };
      await persistentStore.update(businessId, (data) => {
        data.beneficiaries.unshift(beneficiary);
      });
      return beneficiary;
    },
  };

  const invoicing: InvoicingRepository = {
    async getQuotes() {
      return read().quotes;
    },
    async createQuote(input?: NewQuoteInput) {
      const lines = toLineItems(input?.lines ?? []);
      const totals = computeTotalsFromLines(lines);
      const now = new Date();
      const expiry = new Date(now.getTime());
      expiry.setDate(expiry.getDate() + 90);
      const quote: Quote = {
        id: genId("quote"),
        number: nextNumber("DEV", read().quotes),
        clientName: input?.clientName,
        clientIce: input?.clientIce,
        issueDate: now.toISOString(),
        expiryDate: expiry.toISOString(),
        status: "en_attente",
        lines,
        ...totals,
      };
      await persistentStore.update(businessId, (data) => {
        data.quotes.push(quote);
      });
      return quote;
    },
    async updateQuoteStatus(quoteId, status: QuoteStatus) {
      let updated: Quote | undefined;
      await persistentStore.update(businessId, (data) => {
        const quote = data.quotes.find((q) => q.id === quoteId);
        if (!quote) throw new Error(`Quote not found: ${quoteId}`);
        quote.status = status;
        updated = quote;
      });
      return updated as Quote;
    },
    async convertQuoteToInvoice(quoteId) {
      let invoice: Invoice | undefined;
      await persistentStore.update(businessId, (data) => {
        const quote = data.quotes.find((q) => q.id === quoteId);
        if (!quote) throw new Error(`Quote not found: ${quoteId}`);
        const now = new Date();
        const due = new Date(now.getTime());
        due.setDate(due.getDate() + 30);
        invoice = {
          id: genId("inv"),
          number: nextInvoiceNumber("vente", data.invoices),
          kind: "vente",
          clientId: quote.clientId,
          clientName: quote.clientName,
          clientIce: quote.clientIce,
          issueDate: now.toISOString(),
          dueDate: due.toISOString(),
          status: "brouillon",
          lines: quote.lines.map((l) => ({ ...l, id: genId("line") })),
          totalHT: quote.totalHT,
          vatAmount: quote.vatAmount,
          totalTTC: quote.totalTTC,
          paymentMethods: [],
          legal: { ...data.business.legal },
          sourceQuoteId: quote.id,
        };
        data.invoices.push(invoice);
        quote.status = "accepte";
        quote.convertedInvoiceId = invoice.id;
      });
      return invoice as Invoice;
    },
    async getPurchaseOrders() {
      return read().purchaseOrders;
    },
    async acceptQuoteAndCreateOrder(quoteId) {
      let order: PurchaseOrder | undefined;
      await persistentStore.update(businessId, (data) => {
        const quote = data.quotes.find((q) => q.id === quoteId);
        if (!quote) throw new Error(`Quote not found: ${quoteId}`);
        // A bon de commande may already exist for this devis — reuse it (idempotent).
        const existing = data.purchaseOrders.find((p) => p.quoteId === quoteId);
        if (existing) {
          order = existing;
          return;
        }
        quote.status = "accepte";
        order = {
          id: genId("po"),
          number: nextNumber("BC", data.purchaseOrders),
          quoteId: quote.id,
          clientName: quote.clientName,
          clientIce: quote.clientIce,
          issueDate: new Date().toISOString(),
          lines: quote.lines.map((l) => ({ ...l, id: genId("line") })),
          totalHT: quote.totalHT,
          vatAmount: quote.vatAmount,
          totalTTC: quote.totalTTC,
          status: "en_attente_signature",
        };
        data.purchaseOrders.push(order);
      });
      return order as PurchaseOrder;
    },
    async signPurchaseOrder(orderId, signature: SignatureInput) {
      let updated: PurchaseOrder | undefined;
      await persistentStore.update(businessId, (data) => {
        const order = data.purchaseOrders.find((p) => p.id === orderId);
        if (!order) throw new Error(`Purchase order not found: ${orderId}`);
        // Idempotent: a background auto-sign may fire from more than one screen.
        if (order.status === "signe") {
          updated = order;
          return;
        }
        order.status = "signe";
        order.signature = {
          signerName: signature.signerName,
          signedAt: new Date().toISOString(),
          strokes: signature.strokes,
          reference: `SIGN-${genId("s").split("-")[2]?.toUpperCase() ?? "000000"}`,
        };
        updated = order;
      });
      return updated as PurchaseOrder;
    },
    async convertOrderToInvoice(orderId) {
      let invoice: Invoice | undefined;
      await persistentStore.update(businessId, (data) => {
        const order = data.purchaseOrders.find((p) => p.id === orderId);
        if (!order) throw new Error(`Purchase order not found: ${orderId}`);
        // Idempotent: if already converted, return the same facture.
        const already = order.invoiceId
          ? data.invoices.find((i) => i.id === order.invoiceId)
          : undefined;
        if (already) {
          invoice = already;
          return;
        }
        const now = new Date();
        const due = new Date(now.getTime());
        due.setDate(due.getDate() + 30);
        invoice = {
          id: genId("inv"),
          number: nextInvoiceNumber("vente", data.invoices),
          kind: "vente",
          clientName: order.clientName,
          clientIce: order.clientIce,
          issueDate: now.toISOString(),
          dueDate: due.toISOString(),
          status: "brouillon",
          lines: order.lines.map((l) => ({ ...l, id: genId("line") })),
          totalHT: order.totalHT,
          vatAmount: order.vatAmount,
          totalTTC: order.totalTTC,
          paymentMethods: [],
          legal: { ...data.business.legal },
          sourceQuoteId: order.quoteId,
          sourcePurchaseOrderId: order.id,
        };
        data.invoices.push(invoice);
        order.invoiceId = invoice.id;
        const quote = data.quotes.find((q) => q.id === order.quoteId);
        if (quote) quote.convertedInvoiceId = invoice.id;
      });
      return invoice as Invoice;
    },
    async getInvoices() {
      return read().invoices;
    },
    async createInvoice(input: NewInvoiceInput) {
      const lines = toLineItems(input.lines);
      const totals = computeTotalsFromLines(lines);
      const issue = input.issueDate ? new Date(input.issueDate) : new Date();
      const due = input.dueDate ? new Date(input.dueDate) : new Date(issue.getTime());
      if (!input.dueDate) due.setDate(due.getDate() + 30);
      const data = read();
      const kind: InvoiceKind = input.kind ?? "vente";
      const invoice: Invoice = {
        id: genId("inv"),
        number: input.number?.trim() || nextInvoiceNumber(kind, data.invoices),
        kind,
        clientName: input.clientName,
        clientIce: input.clientIce,
        issueDate: issue.toISOString(),
        dueDate: due.toISOString(),
        status: "brouillon",
        lines,
        ...totals,
        paymentMethods: input.paymentMethods ?? [],
        legal: { ...data.business.legal },
      };
      await persistentStore.update(businessId, (d) => {
        d.invoices.push(invoice);
      });
      return invoice;
    },
    async updateInvoiceStatus(invoiceId, status: InvoiceStatus) {
      let updated: Invoice | undefined;
      await persistentStore.update(businessId, (data) => {
        const invoice = data.invoices.find((i) => i.id === invoiceId);
        if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);
        invoice.status = status;
        updated = invoice;
      });
      return updated as Invoice;
    },
    async setInvoicePaymentMethods(invoiceId, methods: PaymentMethodKind[]) {
      let updated: Invoice | undefined;
      await persistentStore.update(businessId, (data) => {
        const invoice = data.invoices.find((i) => i.id === invoiceId);
        if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);
        invoice.paymentMethods = methods;
        // Leaving "brouillon" → it is now issued to the client awaiting payment.
        if (invoice.status === "brouillon") invoice.status = "envoyee";
        updated = invoice;
      });
      return updated as Invoice;
    },
    async recordInvoicePayment(invoiceId, method: PaymentMethodKind) {
      let updated: Invoice | undefined;
      await persistentStore.update(businessId, (data) => {
        const invoice = data.invoices.find((i) => i.id === invoiceId);
        if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);
        invoice.status = "payee";
        invoice.paidAt = new Date().toISOString();
        invoice.paidMethod = method;
        // Reconciliation: a matching encaissement appears in the live transaction feed.
        const mainId = data.accounts.find((a) => a.isMain)?.id;
        const transaction: Transaction = {
          id: genId("tx"),
          label: `Encaissement ${invoice.number}`,
          counterparty: invoice.clientName ?? invoice.number,
          type: "revenu",
          amount: invoice.totalTTC,
          currency: "MAD",
          date: invoice.paidAt,
          status: "executed",
          receipt: "added",
          method: method === "rib" ? "transfer" : "other",
          accountId: mainId,
        };
        data.transactions.push(transaction);
        const main = data.accounts.find((a) => a.isMain);
        if (main) main.balance += invoice.totalTTC;
        updated = invoice;
      });
      return updated as Invoice;
    },
    async getClients() {
      return read().clients;
    },
    async addClient(input: NewClientInput) {
      const client: Client = {
        id: genId("cli"),
        name: input.name,
        email: input.email,
        phone: input.phone,
        legal: input.legal ?? {},
      };
      await persistentStore.update(businessId, (data) => {
        data.clients.push(client);
      });
      return client;
    },
    async getProducts() {
      return read().products;
    },
    async addProduct(input: NewProductInput) {
      const product: Product = { id: genId("prd"), ...input };
      await persistentStore.update(businessId, (data) => {
        data.products.push(product);
      });
      return product;
    },
    async getSuppliers() {
      return read().suppliers;
    },
    async addSupplier(input: NewSupplierInput) {
      const supplier: Supplier = {
        id: genId("sup"),
        name: input.name,
        status: "active",
        legal: input.legal ?? {},
      };
      await persistentStore.update(businessId, (data) => {
        data.suppliers.push(supplier);
      });
      return supplier;
    },
  };

  const team: TeamRepository = {
    async getMembers() {
      return read().teamMembers;
    },
  };

  const subscriptions: SubscriptionsRepository = {
    async getSubscriptions() {
      return read().subscriptions;
    },
    async addSubscription(input: NewSubscriptionInput) {
      const next = new Date();
      next.setMonth(next.getMonth() + (input.cycle === "yearly" ? 12 : 1));
      const subscription: Subscription = {
        id: genId("sub"),
        name: input.name,
        amount: input.amount,
        currency: "MAD",
        cycle: input.cycle,
        nextRenewal: next.toISOString(),
        status: "active",
      };
      await persistentStore.update(businessId, (data) => {
        data.subscriptions.unshift(subscription);
      });
      return subscription;
    },
    async setStatus(id, status: SubscriptionStatus) {
      let updated: Subscription | undefined;
      await persistentStore.update(businessId, (data) => {
        const sub = data.subscriptions.find((s) => s.id === id);
        if (!sub) throw new Error(`Subscription not found: ${id}`);
        sub.status = status;
        updated = sub;
      });
      return updated as Subscription;
    },
    async remove(id) {
      await persistentStore.update(businessId, (data) => {
        data.subscriptions = data.subscriptions.filter((s) => s.id !== id);
      });
    },
  };

  return {
    profile,
    accounts,
    transactions,
    cards,
    transfers,
    invoicing,
    team,
    subscriptions,
  };
}
