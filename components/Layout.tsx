"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  ArrowLeftRight,
  FileText,
  FolderClosed,
  UserRound,
  LogOut,
  Loader2,
  PlusCircle,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginScreen } from "@/components/screens/login-screen";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { TransferScreen } from "@/components/screens/transfer-screen";
import { InvoiceScreen } from "@/components/screens/invoice-screen";
import { DocumentsScreen } from "@/components/screens/documents-screen";
import { ProfileScreen } from "@/components/screens/profile-screen";
import { CardsScreen } from "@/components/screens/cards-screen";
import { ToastStack } from "@/components/ui/toast-stack";
import { useAppStore } from "@/store/app-store";
import logoLight from "@/app/assets/logos/logo-light.png";

// Structure avec sous-catégories pour Desktop
const navigationGroups = [
  {
    title: "Tableau de bord",
    links: [
      { key: "home", label: "Vue d'ensemble", icon: Home },
    ]
  },
  {
    title: "Opérations courantes",
    links: [
      { key: "transfers", label: "Virements", icon: ArrowLeftRight },
      { key: "invoices", label: "Factures", icon: FileText },
      { key: "invoices-create", label: "Créer une facture", icon: PlusCircle, isSub: true },
    ]
  },
  {
    title: "Gestion entreprise",
    links: [
      { key: "cards", label: "Cartes bancaires", icon: CreditCard },
      { key: "cards-create", label: "Nouvelle carte", icon: PlusCircle, isSub: true },
      { key: "documents", label: "Documents officiels", icon: FolderClosed },
    ]
  },
  {
    title: "Paramètres",
    links: [
      { key: "profile", label: "Mon Profil", icon: UserRound },
    ]
  }
] as const;

// Navigation Mobile
const mobileTabs = [
  { key: "home", label: "Accueil", icon: Home },
  { key: "transfers", label: "Virements", icon: ArrowLeftRight },
  { key: "invoices", label: "Factures", icon: FileText },
  { key: "cards", label: "Cartes", icon: CreditCard }, 
  { key: "profile", label: "Profil", icon: UserRound }
] as const;

export function AppLayout() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const logout = useAppStore((state) => state.logout);

  const content = useMemo(() => {
    if (activeTab === "home") return <DashboardScreen />;
    if (activeTab === "transfers") return <TransferScreen />;
    if (activeTab === "invoices" || activeTab === "invoices-create") 
      return <InvoiceScreen view={activeTab === "invoices-create" ? "create" : "list"} />;
    if (activeTab === "cards" || activeTab === "cards-create") 
      return <CardsScreen view={activeTab === "cards-create" ? "create" : "list"} />;
    if (activeTab === "documents") return <DocumentsScreen />;
    if (activeTab === "profile") return <ProfileScreen />;
    return <DashboardScreen />;
  }, [activeTab]);

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F6F9]">
        <Loader2 className="animate-spin text-[#1D4ED8]" size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <ToastStack />
      </>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#F3F6F9] px-3 pb-28 pt-4 md:h-screen md:overflow-hidden md:p-5 lg:p-6">
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-40 bg-gradient-to-t from-[#F3F6F9] via-[#F3F6F9]/95 via-35% to-transparent md:hidden" />

      <div className="mx-auto flex w-full max-w-[1480px] flex-1 items-stretch gap-3 md:min-h-0 lg:gap-5">
        
        {/* CORRECTION ICI : Ajout de "relative z-[100]" pour passer au-dessus des modales */}
        <aside className="hidden md:flex relative z-[100] md:w-[240px] flex-col justify-between rounded-3xl border border-white/70 bg-white/80 p-3 shadow-soft backdrop-blur-xl shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div>
            <div className="flex items-center justify-center rounded-2xl border border-mylegal-cloud bg-[#F3F6F9] px-2 py-4 mb-6 shadow-inner">
              <Image src={logoLight} alt="MyLegal" width={200} height={70} className="h-auto w-[200px]" />
            </div>

            <nav className="space-y-6 flex-1 px-1">
              {navigationGroups.map((group) => (
                <div key={group.title}>
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {group.title}
                  </p>
                  <ul className="space-y-1">
                    {group.links.map((link) => {
                      const Icon = link.icon;
                      const isActive = link.key === activeTab;
                      const isSub = (link as any).isSub;
                      return (
                        <li key={link.key}>
                          <button
                            onClick={() => setActiveTab(link.key as any)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl py-2.5 font-medium transition-all duration-200",
                              isSub ? "pl-11 pr-3 text-[12px]" : "px-3 text-[13px]",
                              isActive 
                                ? "bg-[#EEF2FF] text-[#3730A3] shadow-sm ring-1 ring-black/5" 
                                : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
                            )}
                          >
                            <Icon size={isSub ? 15 : 18} className={isActive ? "text-[#3730A3]" : "text-gray-400"} />
                            {link.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100 px-1">
            <button 
              onClick={logout} 
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#6B7280] transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} className="text-gray-400 group-hover:text-red-600" />
              Déconnexion
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col md:min-h-0 relative z-0">
          <div className="flex flex-1 flex-col rounded-[1.75rem] border border-white/70 bg-white/80 p-2.5 shadow-soft backdrop-blur-xl md:min-h-0 md:rounded-3xl md:p-4 lg:p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full min-h-[78vh] md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-2"
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>

      <nav className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-1.5rem)] max-w-[390px] -translate-x-1/2 rounded-2xl border border-white/70 bg-white/90 px-1.5 py-1.5 shadow-soft backdrop-blur-2xl md:hidden">
        <ul className="grid grid-cols-5 gap-1">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab.startsWith(tab.key);
            return (
              <li key={tab.key}>
                <button
                  onClick={() => setActiveTab(tab.key as any)}
                  className={cn(
                    "flex w-full flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition",
                    isActive ? "bg-[#EEF2FF] text-[#1D4ED8]" : "text-[#6B7280] hover:text-[#111827]"
                  )}
                >
                  <Icon size={16} />
                  <span className="truncate w-full text-center px-0.5">{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <ToastStack />
    </main>
  );
}