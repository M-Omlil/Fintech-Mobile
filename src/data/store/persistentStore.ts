import AsyncStorage from "@react-native-async-storage/async-storage";

import { buildAmanoSeed } from "@data/mocks/amano.seed";
import type {
  Account,
  Beneficiary,
  Business,
  Card,
  Client,
  Invoice,
  Product,
  PurchaseOrder,
  Quote,
  RegisterInput,
  Subscription,
  Supplier,
  TeamMember,
  Transaction,
  Transfer,
} from "@domain/index";

import { genId } from "./ids";

/** All data owned by a single business (the unit scoped by a session). */
export type BusinessData = {
  business: Business;
  accounts: Account[];
  cards: Card[];
  transactions: Transaction[];
  transfers: Transfer[];
  beneficiaries: Beneficiary[];
  quotes: Quote[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  clients: Client[];
  products: Product[];
  suppliers: Supplier[];
  teamMembers: TeamMember[];
  subscriptions: Subscription[];
};

type AuthRecord = { businessId: string; email: string; password: string };

type RootDoc = {
  version: 1;
  users: AuthRecord[];
  data: Record<string, BusinessData>;
};

const STORAGE_KEY = "amano.store.v19";

/** Demo credentials, surfaced on the login screen so the app is usable immediately. */
export const DEMO_CREDENTIALS = { email: "demo@amano.app", password: "amano1234" } as const;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function seedDoc(): RootDoc {
  // Built relative to the launch date so the demo always shows current-month data.
  const demo = buildAmanoSeed(new Date()) as BusinessData;
  return {
    version: 1,
    users: [{ businessId: demo.business.id, ...DEMO_CREDENTIALS }],
    data: { [demo.business.id]: demo },
  };
}

/** Empty starter data for a freshly registered business. */
function newBusinessData(input: RegisterInput): BusinessData {
  const businessId = genId("biz");
  return {
    business: {
      id: businessId,
      name: input.businessName,
      ownerName: input.ownerName,
      rib: "000 000 0000 0000 0000 0000 00",
      iban: "MA64 0000 0000 0000 0000 0000 0000",
      currency: "MAD",
      legal: {},
    },
    accounts: [
      {
        id: genId("acc"),
        name: "Compte principal",
        balance: 0,
        currency: "MAD",
        status: "active",
        isMain: true,
      },
      {
        id: genId("acc"),
        name: "Rémunération",
        balance: 0,
        currency: "MAD",
        status: "inactive",
        isMain: false,
      },
    ],
    cards: [
      {
        id: genId("card"),
        productLabel: "ONE",
        nickname: "One",
        maskedPan: "•• 0000",
        network: "mastercard",
        status: "active",
        monthlyLimit: 20000,
        monthlySpent: 0,
        settings: {
          cashWithdrawal: false,
          foreignPayment: true,
          onlinePayment: true,
          contactlessPayment: true,
        },
        addedToWallet: false,
      },
    ],
    transactions: [],
    transfers: [],
    beneficiaries: [],
    quotes: [],
    purchaseOrders: [],
    invoices: [],
    clients: [],
    products: [],
    suppliers: [],
    teamMembers: [],
    subscriptions: [],
  };
}

/**
 * Persistent, mutable data store (AsyncStorage). Loaded once at startup, kept in
 * memory, and written back on every mutation — so the UI is fully dynamic and data
 * survives restarts. This is the concrete data source behind the repository
 * interfaces (Section 4 — Dependency Inversion).
 */
class PersistentStore {
  private doc: RootDoc | null = null;

  async init(): Promise<void> {
    if (this.doc) return;
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.doc = JSON.parse(raw) as RootDoc;
        return;
      } catch {
        // Corrupt payload — fall through to a fresh seed.
      }
    }
    this.doc = seedDoc();
    await this.persist();
  }

  private get root(): RootDoc {
    if (!this.doc) throw new Error("PersistentStore not initialized");
    return this.doc;
  }

  private async persist(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.root));
  }

  async login(email: string, password: string): Promise<Business> {
    const record = this.root.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!record || record.password !== password) {
      throw new Error("Identifiants invalides");
    }
    const data = this.root.data[record.businessId];
    if (!data) throw new Error("Compte introuvable");
    return clone(data.business);
  }

  async register(input: RegisterInput): Promise<Business> {
    const exists = this.root.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (exists) throw new Error("Cet e-mail est déjà utilisé");
    const data = newBusinessData(input);
    this.root.users.push({
      businessId: data.business.id,
      email: input.email,
      password: input.password,
    });
    this.root.data[data.business.id] = data;
    await this.persist();
    return clone(data.business);
  }

  /** Read a snapshot of a business's data (immutable copy). */
  getData(businessId: string): BusinessData {
    const data = this.root.data[businessId];
    if (!data) throw new Error(`Unknown business: ${businessId}`);
    return clone(data);
  }

  /** Apply a mutation to a business's data and persist it. */
  async update(businessId: string, mutator: (data: BusinessData) => void): Promise<void> {
    const data = this.root.data[businessId];
    if (!data) throw new Error(`Unknown business: ${businessId}`);
    mutator(data);
    await this.persist();
  }
}

/** App-wide singleton. */
export const persistentStore = new PersistentStore();
