import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type BankingDocumentAction,
  type BankingInvoice,
  type BankingProfile,
  type BankingTransaction,
  type BankingCard,
  type InvoicePayload,
  type LoginPayload,
  type TabKey,
  type TransferPayload,
  type EmployeeInsurance,
  type SubAccount,
} from "../services/mock-data";
import {
  createInvoice,
  createTransfer,
  handleDocumentAction,
  loginWithCredentials,
  loginWithProfile,
  markInvoicePaid,
} from "../services/mock-api";
import { getDb } from "../db";
import {
  insertCard,
  insertInsurance,
  insertInvoice,
  insertSubAccount,
  insertTransaction,
  loadAllProfiles,
  loadProfileById,
  markInvoicePaidDb,
  updateCardLimit,
  updateCardSpent,
  updateCardStatus,
  updateInsuranceStatus,
  updatePendingBalance,
  updateSubAccountBalance,
} from "../db/repository";

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export type ToastVariant = "default" | "success" | "warning" | "destructive";

export type ToastItem = {
  id: string;
  title: string;
  description: string;
  variant: ToastVariant;
};

type AppState = {
  // Session
  isAuthenticated: boolean;
  activeProfileId: string | null;
  activeTab: TabKey;
  loginError: string | null;

  // DB-backed cache
  isHydrated: boolean;
  profiles: BankingProfile[];

  // Ephemeral UI
  toasts: ToastItem[];

  // Lifecycle
  hydrate: () => Promise<void>;
  refreshActiveProfile: () => Promise<void>;
  refreshAllProfiles: () => Promise<void>;

  // Navigation & toasts
  setActiveTab: (tab: TabKey) => void;
  showToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;

  // Auth
  login: (payload: LoginPayload) => Promise<void>;
  fastLogin: (profileId: string) => Promise<void>;
  logout: () => void;

  // Domain mutations
  addTransfer: (payload: TransferPayload) => Promise<void>;
  addInvoice: (payload: InvoicePayload) => Promise<void>;
  payInvoice: (invoiceId: string) => Promise<void>;
  runDocumentAction: (documentId: string, action: BankingDocumentAction) => Promise<void>;
  addCard: (newCard: BankingCard) => Promise<void>;
  setCardStatus: (cardId: string, status: BankingCard["status"]) => Promise<void>;
  setCardLimit: (cardId: string, limit: number) => Promise<void>;
  spendOnCard: (cardId: string, amount: number, merchant: string) => Promise<{ ok: boolean; reason?: string }>;
  resetCardSpent: (cardId: string) => Promise<void>;
  toggleInsuranceStatus: (insuranceId: string) => Promise<void>;
  addInsurance: (payload: Omit<EmployeeInsurance, "id">) => Promise<void>;
  addSubAccount: (newAccount: SubAccount) => Promise<void>;

  // Lookups
  getActiveProfile: () => BankingProfile | null;
  getProfileById: (profileId: string) => BankingProfile | undefined;
};

function formatAmount(amount: number) {
  return Number(amount.toFixed(2));
}

function buildTransferTransaction(payload: TransferPayload, response: { amount: number }): BankingTransaction {
  return {
    id: generateId(),
    title: "Virement émis",
    counterparty: payload.beneficiary,
    amount: formatAmount(response.amount),
    currency: payload.currency,
    kind: "debit",
    createdAt: new Date().toISOString(),
    note: `${payload.bank ?? "Bank"} / ${payload.ibanRib}`,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- Session (persisted) ---
      isAuthenticated: false,
      activeProfileId: null,
      activeTab: "home",
      loginError: null,

      // --- DB-backed (not persisted in AsyncStorage; SQLite is source of truth) ---
      isHydrated: false,
      profiles: [],

      // --- Ephemeral ---
      toasts: [],

      // --------------------------- Lifecycle ---------------------------
      hydrate: async () => {
        const db = await getDb();
        const profiles = await loadAllProfiles(db);
        set({ profiles, isHydrated: true });
      },

      refreshActiveProfile: async () => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return;
        const db = await getDb();
        const fresh = await loadProfileById(db, activeProfileId);
        if (!fresh) return;
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === activeProfileId ? fresh : p)),
        }));
      },

      refreshAllProfiles: async () => {
        const db = await getDb();
        const profiles = await loadAllProfiles(db);
        set({ profiles });
      },

      // --------------------------- UI helpers ---------------------------
      setActiveTab: (tab) => set({ activeTab: tab }),

      showToast: (toast) => {
        const id = generateId();
        set((state) => ({ toasts: [...state.toasts, { id, ...toast }] }));
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
        }, 3200);
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      // --------------------------- Auth ---------------------------
      login: async (payload) => {
        try {
          const response = await loginWithCredentials(payload);
          set({
            isAuthenticated: true,
            activeProfileId: response.profileId,
            activeTab: "home",
            loginError: null,
          });
          get().showToast({
            title: "Connexion réussie",
            description: "Votre espace est prêt.",
            variant: "success",
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Identifiants invalides.";
          set({ loginError: message });
          get().showToast({
            title: "Échec de connexion",
            description: message,
            variant: "destructive",
          });
          throw error;
        }
      },

      fastLogin: async (profileId) => {
        await loginWithProfile(profileId);
        set({
          isAuthenticated: true,
          activeProfileId: profileId,
          activeTab: "home",
          loginError: null,
        });
        get().showToast({
          title: "Connexion rapide réussie",
          description: "Profil chargé avec succès.",
          variant: "success",
        });
      },

      logout: () => {
        set({ isAuthenticated: false, activeProfileId: null, activeTab: "home" });
        get().showToast({
          title: "Déconnexion",
          description: "Vous avez été déconnecté en toute sécurité.",
          variant: "default",
        });
      },

      // --------------------------- Domain mutations ---------------------------
      addTransfer: async (payload) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) throw new Error("Aucun profil actif.");

        const response = await createTransfer(payload);
        const profile = get().getActiveProfile();
        if (!profile) throw new Error("Profil introuvable.");

        const db = await getDb();
        const amount = formatAmount(response.amount);
        const tx = buildTransferTransaction(payload, response);

        // Pick the first active card with enough remaining headroom.
        // Falls back to any active card, then to undefined if none.
        const activeCards = profile.cards.filter((c) => c.status === "active");
        const targetCard =
          activeCards.find((c) => c.limit - c.spent >= amount) ?? activeCards[0];

        await db.withTransactionAsync(async () => {
          await insertTransaction(db, activeProfileId, tx);
          if (targetCard) {
            await updateCardSpent(db, targetCard.id, targetCard.spent + amount);
          }
          if (payload.timing === "scheduled") {
            await updatePendingBalance(db, activeProfileId, profile.pendingBalance + amount);
          }
        });

        await get().refreshActiveProfile();

        get().showToast({
          title: "Virement envoyé",
          description: `${amount.toLocaleString("fr-MA")} ${response.currency} envoyés à ${response.beneficiary}.`,
          variant: "success",
        });
      },

      addInvoice: async (payload) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) throw new Error("Aucun profil actif.");

        const response = await createInvoice(payload);
        const invoice: BankingInvoice = { ...response };

        const db = await getDb();
        await insertInvoice(db, activeProfileId, invoice);
        await get().refreshActiveProfile();

        get().showToast({
          title: "Facture créée",
          description: `${invoice.reference} ajoutée à la liste.`,
          variant: "success",
        });
      },

      payInvoice: async (invoiceId) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) throw new Error("Aucun profil actif.");
        await markInvoicePaid(invoiceId);
        const db = await getDb();
        await markInvoicePaidDb(db, invoiceId);
        await get().refreshActiveProfile();

        get().showToast({
          title: "Facture mise à jour",
          description: "La facture a été marquée comme payée.",
          variant: "success",
        });
      },

      runDocumentAction: async (documentId, action) => {
        const profile = get().getActiveProfile();
        if (!profile) throw new Error("Aucun profil actif.");
        const doc = profile.documents.find((d) => d.id === documentId);
        if (!doc) throw new Error("Document introuvable.");
        const response = await handleDocumentAction(doc.name, action);
        get().showToast({
          title:
            response.action === "download"
              ? "Téléchargement prêt"
              : response.action === "share"
              ? "Partage prêt"
              : "Email préparé",
          description: `${doc.name} - ${response.message}`,
          variant: "default",
        });
      },

      addCard: async (newCard) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return;
        const db = await getDb();
        await insertCard(db, activeProfileId, newCard);
        await get().refreshActiveProfile();

        get().showToast({
          title: "Nouvelle carte activée",
          description: `La carte "${newCard.name}" est prête à l'emploi.`,
          variant: "success",
        });
      },

      setCardStatus: async (cardId, status) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return;
        const db = await getDb();
        await updateCardStatus(db, cardId, status);
        await get().refreshActiveProfile();
      },

      setCardLimit: async (cardId, limit) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId || limit <= 0) return;
        const db = await getDb();
        await updateCardLimit(db, cardId, limit);
        await get().refreshActiveProfile();
      },

      spendOnCard: async (cardId, amount, merchant) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return { ok: false, reason: "Aucun profil actif" };
        const profile = get().getActiveProfile();
        if (!profile) return { ok: false, reason: "Profil introuvable" };

        const card = profile.cards.find((c) => c.id === cardId);
        if (!card) return { ok: false, reason: "Carte introuvable" };
        if (card.status !== "active") return { ok: false, reason: "Carte non active" };
        if (amount <= 0) return { ok: false, reason: "Montant invalide" };
        const remaining = card.limit - card.spent;
        if (amount > remaining) return { ok: false, reason: "Plafond dépassé" };

        const mainAccount =
          profile.subAccounts.find((acc) => acc.isMain) || profile.subAccounts[0];
        if (!mainAccount) return { ok: false, reason: "Aucun compte source" };

        const tx: BankingTransaction = {
          id: generateId(),
          title: `Paiement ${card.network}`,
          counterparty: merchant,
          amount: formatAmount(amount),
          currency: profile.currency,
          kind: "debit",
          createdAt: new Date().toISOString(),
          note: `${card.name} • ${card.maskedPan}`,
          cardId: card.id,
        };

        const db = await getDb();
        await db.withTransactionAsync(async () => {
          await insertTransaction(db, activeProfileId, tx);
          await updateCardSpent(db, cardId, card.spent + amount);
          await updateSubAccountBalance(
            db,
            mainAccount.id,
            Math.max(0, mainAccount.balance - amount)
          );
        });

        await get().refreshActiveProfile();
        return { ok: true };
      },

      resetCardSpent: async (cardId) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return;
        const db = await getDb();
        await updateCardSpent(db, cardId, 0);
        await get().refreshActiveProfile();
      },

      toggleInsuranceStatus: async (insuranceId) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return;
        const profile = get().getActiveProfile();
        if (!profile) return;
        const current = profile.employeeInsurances.find((i) => i.id === insuranceId);
        if (!current) return;
        const next: EmployeeInsurance["status"] =
          current.status === "active" ? "suspended" : "active";
        const db = await getDb();
        await updateInsuranceStatus(db, insuranceId, next);
        await get().refreshActiveProfile();
        get().showToast({
          title: "Statut mis à jour",
          description: "Le statut de couverture a été modifié.",
          variant: "success",
        });
      },

      addInsurance: async (payload) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return;
        const ins: EmployeeInsurance = { ...payload, id: `ins-${Date.now()}` };
        const db = await getDb();
        await insertInsurance(db, activeProfileId, ins);
        await get().refreshActiveProfile();
        get().showToast({
          title: "Affiliation réussie",
          description: `${payload.employeeName} est maintenant couvert.`,
          variant: "success",
        });
      },

      addSubAccount: async (newAccount) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return;
        const profile = get().getActiveProfile();
        if (!profile) return;

        const mainAccount =
          profile.subAccounts.find((acc) => acc.isMain) || profile.subAccounts[0];

        let deducted = newAccount.balance;
        if (mainAccount) {
          const safe = mainAccount.balance >= newAccount.balance ? newAccount.balance : mainAccount.balance;
          deducted = safe;
        }

        const seeded: SubAccount = { ...newAccount, balance: formatAmount(deducted) };
        const db = await getDb();

        await db.withTransactionAsync(async () => {
          if (mainAccount) {
            await updateSubAccountBalance(
              db,
              mainAccount.id,
              Math.max(0, mainAccount.balance - deducted)
            );
          }
          await insertSubAccount(db, activeProfileId, seeded);
        });

        await get().refreshActiveProfile();
      },

      // --------------------------- Lookups ---------------------------
      getActiveProfile: () => {
        const state = get();
        if (!state.activeProfileId) return null;
        return state.profiles.find((p) => p.id === state.activeProfileId) ?? null;
      },

      getProfileById: (profileId) =>
        get().profiles.find((p) => p.id === profileId),
    }),
    {
      name: "fintech-by-mylegal-session",
      storage: createJSONStorage(() => AsyncStorage),
      // Only session info — DB is source of truth for all profile data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        activeProfileId: state.activeProfileId,
        activeTab: state.activeTab,
      }),
    }
  )
);

export function useActiveProfile() {
  return useAppStore((state) => {
    if (!state.activeProfileId) return null;
    return state.profiles.find((p) => p.id === state.activeProfileId) ?? null;
  });
}
