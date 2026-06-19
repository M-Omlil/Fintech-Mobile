import { useCallback, useEffect, useRef, useState } from "react";

import type {
  NewClientInput,
  NewInvoiceInput,
  NewProductInput,
  NewQuoteInput,
  NewSupplierInput,
  SignatureInput,
} from "@data/repositories/index";
import type {
  Invoice,
  InvoiceStatus,
  PaymentMethodKind,
  PurchaseOrder,
  Quote,
  QuoteStatus,
} from "@domain/index";
import { useRepos } from "@services/di/DIProvider";

import { useAsync } from "./useAsync";

/** Devis (quotes): list + create + status + convert to facture (§6). */
export function useQuotes() {
  const { invoicing } = useRepos();
  const state = useAsync(() => invoicing.getQuotes(), [invoicing]);
  const { reload } = state;

  const createQuote = useCallback(
    async (input?: NewQuoteInput) => {
      const quote = await invoicing.createQuote(input);
      reload();
      return quote;
    },
    [invoicing, reload],
  );

  const setQuoteStatus = useCallback(
    async (id: string, status: QuoteStatus) => {
      await invoicing.updateQuoteStatus(id, status);
      reload();
    },
    [invoicing, reload],
  );

  const convertToInvoice = useCallback(
    async (id: string) => {
      const invoice = await invoicing.convertQuoteToInvoice(id);
      reload();
      return invoice;
    },
    [invoicing, reload],
  );

  return { ...state, createQuote, setQuoteStatus, convertToInvoice };
}

/** Factures (invoices): list + create + status (§6). */
export function useInvoices() {
  const { invoicing } = useRepos();
  const state = useAsync(() => invoicing.getInvoices(), [invoicing]);
  const { reload } = state;

  const createInvoice = useCallback(
    async (input: NewInvoiceInput) => {
      const invoice = await invoicing.createInvoice(input);
      reload();
      return invoice;
    },
    [invoicing, reload],
  );

  const setInvoiceStatus = useCallback(
    async (id: string, status: InvoiceStatus) => {
      await invoicing.updateInvoiceStatus(id, status);
      reload();
    },
    [invoicing, reload],
  );

  return { ...state, createInvoice, setInvoiceStatus };
}

/**
 * Drives the full commercial cycle for one devis (UC1): validation → bon de commande →
 * signature électronique → facture → choix du mode de paiement → encaissement. Holds the
 * derived (quote, order, invoice) triplet and reloads after every step.
 */
export function useCommercialCycle(quoteId: string) {
  const { invoicing } = useRepos();
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | undefined>();
  const [order, setOrder] = useState<PurchaseOrder | undefined>();
  const [invoice, setInvoice] = useState<Invoice | undefined>();

  // Mirror the derived state in refs so the action callbacks can stay stable (no churn),
  // which the auto-advance timers in the screen rely on to fire exactly once per step.
  const orderRef = useRef<PurchaseOrder | undefined>(undefined);
  orderRef.current = order;
  const invoiceRef = useRef<Invoice | undefined>(undefined);
  invoiceRef.current = invoice;

  const load = useCallback(async () => {
    const [quotes, orders, invoices] = await Promise.all([
      invoicing.getQuotes(),
      invoicing.getPurchaseOrders(),
      invoicing.getInvoices(),
    ]);
    const q = quotes.find((x) => x.id === quoteId);
    const o = orders.find((x) => x.quoteId === quoteId);
    const inv = o
      ? invoices.find((x) => x.sourcePurchaseOrderId === o.id || x.id === o.invoiceId)
      : undefined;
    setQuote(q);
    setOrder(o);
    setInvoice(inv);
    setLoading(false);
  }, [invoicing, quoteId]);

  useEffect(() => {
    load();
  }, [load]);

  const validateQuote = useCallback(async () => {
    await invoicing.acceptQuoteAndCreateOrder(quoteId);
    await load();
  }, [invoicing, quoteId, load]);

  const sign = useCallback(
    async (signature: SignatureInput) => {
      const o = orderRef.current;
      if (!o) return;
      await invoicing.signPurchaseOrder(o.id, signature);
      // The signed order is automatically transformed into a facture (UC1 §7).
      await invoicing.convertOrderToInvoice(o.id);
      await load();
    },
    [invoicing, load],
  );

  const choosePayment = useCallback(
    async (methods: PaymentMethodKind[]) => {
      const inv = invoiceRef.current;
      if (!inv) return;
      await invoicing.setInvoicePaymentMethods(inv.id, methods);
      await load();
    },
    [invoicing, load],
  );

  const pay = useCallback(
    async (method: PaymentMethodKind) => {
      const inv = invoiceRef.current;
      if (!inv) return;
      await invoicing.recordInvoicePayment(inv.id, method);
      await load();
    },
    [invoicing, load],
  );

  return { loading, quote, order, invoice, validateQuote, sign, choosePayment, pay, reload: load };
}

/**
 * Bons de commande (UC1) — the documents signed electronically. Lists every order and
 * signs one: signing archives the proof and auto-generates the facture (§6–7).
 */
export function usePurchaseOrders() {
  const { invoicing } = useRepos();
  const state = useAsync(() => invoicing.getPurchaseOrders(), [invoicing]);
  const { reload } = state;

  const sign = useCallback(
    async (orderId: string, signature: SignatureInput) => {
      await invoicing.signPurchaseOrder(orderId, signature);
      // Signed orders are automatically transformed into a facture (UC1 §7).
      await invoicing.convertOrderToInvoice(orderId);
      reload();
    },
    [invoicing, reload],
  );

  return { ...state, sign };
}

/** Clients with creation (legal fields). */
export function useClients() {
  const { invoicing } = useRepos();
  const state = useAsync(() => invoicing.getClients(), [invoicing]);
  const { reload } = state;
  const addClient = useCallback(
    async (input: NewClientInput) => {
      await invoicing.addClient(input);
      reload();
    },
    [invoicing, reload],
  );
  return { ...state, addClient };
}

/** Products & services with creation. */
export function useProducts() {
  const { invoicing } = useRepos();
  const state = useAsync(() => invoicing.getProducts(), [invoicing]);
  const { reload } = state;
  const addProduct = useCallback(
    async (input: NewProductInput) => {
      await invoicing.addProduct(input);
      reload();
    },
    [invoicing, reload],
  );
  return { ...state, addProduct };
}

/** Suppliers with creation (legal fields). */
export function useSuppliers() {
  const { invoicing } = useRepos();
  const state = useAsync(() => invoicing.getSuppliers(), [invoicing]);
  const { reload } = state;
  const addSupplier = useCallback(
    async (input: NewSupplierInput) => {
      await invoicing.addSupplier(input);
      reload();
    },
    [invoicing, reload],
  );
  return { ...state, addSupplier };
}
