import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Home,
  ArrowLeftRight,
  FileText,
  UserRound,
  CreditCard,
} from "lucide-react-native";
import { cn } from "../lib/utils";
import { LoginScreen } from "./screens/login-screen";
import { DashboardScreen } from "./screens/dashboard-screen";
import { TransferScreen } from "./screens/transfer-screen";
import { InvoiceScreen } from "./screens/invoice-screen";
import { DocumentsScreen } from "./screens/documents-screen";
import { ProfileScreen } from "./screens/profile-screen";
import { CardsScreen } from "./screens/cards-screen";
import { InsuranceScreen } from "./screens/insurance-screen";
import { ToastStack } from "./ui/toast-stack";
import { useAppStore } from "../store/app-store";

const mobileTabs = [
  { key: "home", label: "Accueil", icon: Home },
  { key: "transfers", label: "Virements", icon: ArrowLeftRight },
  { key: "invoices", label: "Factures", icon: FileText },
  { key: "cards", label: "Cartes", icon: CreditCard },
  { key: "profile", label: "Profil", icon: UserRound },
] as const;

export function AppLayout() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const content = useMemo(() => {
    if (activeTab === "home") return <DashboardScreen />;
    if (activeTab === "transfers") return <TransferScreen />;
    if (activeTab === "invoices" || activeTab === "invoices-create")
      return <InvoiceScreen view={activeTab === "invoices-create" ? "create" : "list"} />;
    if (activeTab === "cards" || activeTab === "cards-create")
      return <CardsScreen view={activeTab === "cards-create" ? "create" : "list"} />;
    if (activeTab === "insurances" || activeTab === "insurances-create")
      return <InsuranceScreen view={activeTab === "insurances-create" ? "create" : "list"} />;
    if (activeTab === "documents") return <DocumentsScreen />;
    if (activeTab === "profile") return <ProfileScreen />;
    return <DashboardScreen />;
  }, [activeTab]);

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-slate-50">
        <LoginScreen />
        <ToastStack />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="flex-1">{content}</View>

      <SafeAreaView edges={["bottom"]} className="bg-white border-t border-slate-100">
        <View className="flex-row px-2 py-2">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab.startsWith(tab.key);
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                activeOpacity={0.7}
                className={cn(
                  "flex-1 items-center justify-center py-2 rounded-xl mx-1",
                  isActive ? "bg-indigo-50" : "bg-transparent"
                )}
              >
                <Icon size={20} color={isActive ? "#4338CA" : "#6B7280"} />
                <Text
                  className={cn(
                    "text-[10px] mt-1 font-bold",
                    isActive ? "text-indigo-700" : "text-slate-500"
                  )}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
      <ToastStack />
    </SafeAreaView>
  );
}
