import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createInitialProfiles,
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
  type SubAccount
} from "../services/mock-data";
import { createInvoice, createTransfer, handleDocumentAction, loginWithCredentials, loginWithProfile, markInvoicePaid } from "../services/mock-api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
  
export type ToastVariant = "default" | "success" | "warning" | "destructive";

export type ToastItem = {
  id: string;
  title: string;
  description: string;
  variant: ToastVariant;
};

type AppState = {
  isAuthenticated: boolean;
  activeProfileId: string | null;
  activeTab: TabKey;
  profiles: BankingProfile[];
  toasts: ToastItem[];
  loginError: string | null;
  setActiveTab: (tab: TabKey) => void;
  showToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  login: (payload: LoginPayload) => Promise<void>;
  fastLogin: (profileId: string) => Promise<void>;
  logout: () => void;
  addTransfer: (payload: TransferPayload) => Promise<void>;
  addInvoice: (payload: InvoicePayload) => Promise<void>;
  payInvoice: (invoiceId: string) => Promise<void>;
  runDocumentAction: (documentId: string, action: BankingDocumentAction) => Promise<void>;
  getActiveProfile: () => BankingProfile | null;
  getProfileById: (profileId: string) => BankingProfile | undefined;
  addCard: (newCard: BankingCard) => void;
  toggleInsuranceStatus: (insuranceId: string) => void;
  addInsurance: (payload: Omit<EmployeeInsurance, "id">) => Promise<void>;
  
  // NOUVELLE ACTION SOUS-COMPTE
  addSubAccount: (newAccount: SubAccount) => void;
};

const initialProfiles = createInitialProfiles();

function formatAmount(amount: number) {
  return Number(amount.toFixed(2));
}

function updateProfile(state: AppState, profileId: string, updater: (profile: BankingProfile) => BankingProfile) {
  return state.profiles.map((profile) => (profile.id === profileId ? updater(profile) : profile));
}

function buildTransferTransaction(payload: TransferPayload): BankingTransaction {
  return {
    id: generateId(),
    title: "Virement émis",
    counterparty: payload.beneficiary,
    amount: formatAmount(payload.amount),
    currency: payload.currency,
    kind: "debit",
    createdAt: new Date().toISOString(),
    note: `${payload.bank ?? "Bank"} / ${payload.ibanRib}`
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      activeProfileId: null,
      activeTab: "home",
      profiles: initialProfiles,
      toasts: [],
      loginError: null,
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      showToast: (toast) => {
        const id = generateId();
        set((state) => ({ toasts: [...state.toasts, { id, ...toast }] }));
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
        }, 3200);
      },
      
      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
      
      login: async (payload) => {
        try {
          const response = await loginWithCredentials(payload);
          set({ isAuthenticated: true, activeProfileId: response.profileId, activeTab: "home", loginError: null });
          get().showToast({
            title: "Connexion réussie",
            description: "Votre espace est prêt.",
            variant: "success"
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Identifiants invalides.";
          set({ loginError: message });
          get().showToast({
            title: "Échec de connexion",
            description: message,
            variant: "destructive"
          });
          throw error;
        }
      },
      
      fastLogin: async (profileId) => {
        await loginWithProfile(profileId);
        set({ isAuthenticated: true, activeProfileId: profileId, activeTab: "home", loginError: null });
        get().showToast({
          title: "Connexion rapide réussie",
          description: `Profil chargé avec succès.`,
          variant: "success"
        });
      },
      
      logout: () => {
        set({ isAuthenticated: false, activeProfileId: null, activeTab: "home" });
        get().showToast({
          title: "Déconnexion",
          description: "Vous avez été déconnecté en toute sécurité.",
          variant: "default"
        });
      },
      
      addTransfer: async (payload) => {
        const response = await createTransfer(payload);
        const activeProfileId = get().activeProfileId;

        if (!activeProfileId) throw new Error("Aucun profil actif.");

        set((state) => ({
          profiles: updateProfile(state, activeProfileId, (profile) => {
            const cardIndex = profile.cards.findIndex(c => (c.limit - c.spent) >= response.amount);
            const targetCardIndex = cardIndex >= 0 ? cardIndex : 0;

            const updatedCards = [...profile.cards];
            if (updatedCards.length > 0) {
              updatedCards[targetCardIndex] = {
                ...updatedCards[targetCardIndex],
                spent: formatAmount(updatedCards[targetCardIndex].spent + response.amount)
              };
            }

            const newAvailableBalance = formatAmount(
              updatedCards.reduce((sum, card) => sum + (card.limit - card.spent), 0)
            );

            return {
              ...profile,
              cards: updatedCards,
              availableBalance: newAvailableBalance,
              pendingBalance: payload.timing === "scheduled" ? formatAmount(profile.pendingBalance + response.amount) : profile.pendingBalance,
              transactions: [buildTransferTransaction(response), ...profile.transactions]
            };
          })
        }));

        get().showToast({
          title: "Virement envoyé",
          description: `${response.amount.toLocaleString("fr-MA")} ${response.currency} envoyés à ${response.beneficiary}.`,
          variant: "success"
        });
      },
      
      addInvoice: async (payload) => {
        const response = await createInvoice(payload);
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) throw new Error("Aucun profil actif.");

        const invoice: BankingInvoice = { ...response };

        set((state) => ({
          profiles: updateProfile(state, activeProfileId, (profile) => ({
            ...profile,
            invoices: [invoice, ...profile.invoices]
          }))
        }));

        get().showToast({
          title: "Facture créée",
          description: `${invoice.reference} ajoutée à la liste.`,
          variant: "success"
        });
      },
      
      payInvoice: async (invoiceId) => {
        await markInvoicePaid(invoiceId);
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) throw new Error("Aucun profil actif.");

        set((state) => ({
          profiles: updateProfile(state, activeProfileId, (profile) => ({
            ...profile,
            invoices: profile.invoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status: "paid" } : invoice))
          }))
        }));

        get().showToast({
          title: "Facture mise à jour",
          description: "La facture a été marquée comme payée.",
          variant: "success"
        });
      },
      
      runDocumentAction: async (documentId, action) => {
        const profile = get().getActiveProfile();
        if (!profile) throw new Error("Aucun profil actif.");

        const document = profile.documents.find((item) => item.id === documentId);
        if (!document) throw new Error("Document introuvable.");

        const response = await handleDocumentAction(document.name, action);
        get().showToast({
          title: response.action === "download" ? "Téléchargement prêt" : response.action === "share" ? "Partage prêt" : "Email préparé",
          description: `${document.name} - ${response.message}`,
          variant: "default"
        });
      },
      
      addCard: (newCard) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return;

        set((state) => ({
          profiles: updateProfile(state, activeProfileId, (profile) => {
            const updatedCards = [...profile.cards, newCard];
            
            const newAvailableBalance = formatAmount(
              updatedCards.reduce((sum, card) => sum + (card.limit - card.spent), 0)
            );

            return {
              ...profile,
              cards: updatedCards,
              availableBalance: newAvailableBalance
            };
          })
        }));

        get().showToast({
          title: "Nouvelle carte activée",
          description: `La carte "${newCard.name}" est prête à l'emploi.`,
          variant: "success"
        });
      },

      toggleInsuranceStatus: (insuranceId) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return;

        set((state) => ({
          profiles: updateProfile(state, activeProfileId, (profile) => ({
            ...profile,
            employeeInsurances: (profile.employeeInsurances || []).map((ins) => 
              ins.id === insuranceId 
                ? { ...ins, status: ins.status === "active" ? "suspended" : "active" } 
                : ins
            )
          }))
        }));
        get().showToast({ 
          title: "Statut mis à jour", 
          description: "Le statut de couverture a été modifié.", 
          variant: "success" 
        });
      },

      addInsurance: async (payload) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return;

        set((state) => ({
          profiles: updateProfile(state, activeProfileId, (profile) => ({
            ...profile,
            employeeInsurances: [{ ...payload, id: `ins-${Date.now()}` }, ...(profile.employeeInsurances || [])]
          }))
        }));
        get().showToast({ 
          title: "Affiliation réussie", 
          description: `${payload.employeeName} est maintenant couvert.`, 
          variant: "success" 
        });
      },

      // --- NOUVEAU: Logique de création et d'allocation des sous-comptes ---
      addSubAccount: (newAccount) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) return;

        set((state) => ({
          profiles: updateProfile(state, activeProfileId, (profile) => {
            const updatedSubAccounts = [...profile.subAccounts];
            
            // 1. Chercher le compte principal (celui d'où l'argent sera déduit)
            const mainAccountIndex = updatedSubAccounts.findIndex(acc => acc.isMain);
            
            if (mainAccountIndex !== -1) {
              const mainAccount = updatedSubAccounts[mainAccountIndex];
              
              // 2. Déduire le montant du compte principal de manière sécurisée
              const safeDeduction = mainAccount.balance >= newAccount.balance ? newAccount.balance : mainAccount.balance;
              
              updatedSubAccounts[mainAccountIndex] = {
                ...mainAccount,
                balance: formatAmount(mainAccount.balance - safeDeduction)
              };

              // Assurer que le nouveau compte ne reçoit que l'argent effectivement déduit
              newAccount.balance = formatAmount(safeDeduction);
            }

            // 3. Ajouter le nouveau sous-compte à la liste
            updatedSubAccounts.push(newAccount);

            // 4. Mettre à jour le solde global disponible (qui reste le même globalement, l'argent étant juste déplacé)
            const newAvailableBalance = formatAmount(
              updatedSubAccounts.reduce((sum, acc) => sum + acc.balance, 0)
            );

            return {
              ...profile,
              subAccounts: updatedSubAccounts,
              availableBalance: newAvailableBalance
            };
          })
        }));
      },
      
      getActiveProfile: () => {
        const state = get();
        if (!state.activeProfileId) return null;
        return state.profiles.find((profile) => profile.id === state.activeProfileId) ?? null;
      },
      
      getProfileById: (profileId) => get().profiles.find((profile) => profile.id === profileId)
    }),
    {
      name: "fintech-by-mylegal-mobile",
      // THE TWEAK: Tell Zustand to use AsyncStorage for mobile
      storage: createJSONStorage(() => AsyncStorage), 
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        activeProfileId: state.activeProfileId,
        activeTab: state.activeTab,
        profiles: state.profiles
      })
    }
  )
);

export function useActiveProfile() {
  return useAppStore((state) => {
    if (!state.activeProfileId) return null;
    return state.profiles.find((profile) => profile.id === state.activeProfileId) ?? null;
  });
}