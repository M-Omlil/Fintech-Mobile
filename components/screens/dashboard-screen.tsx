import React, { useState, useMemo, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator,
  Platform
} from "react-native";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  BadgeDollarSign,
  CreditCard,
  Landmark,
  Search,
  Plus,
  History,
  FileText,
  Wallet,
  X,
  Loader2,
  PieChart
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveProfile, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#2563EB", "#C26B2F", "#9E7D07", "#15803D", "#4F46E5", "#0891B2", "#BE123C"];

export function DashboardScreen() {
  const profile = useActiveProfile();
  const { setActiveTab, showToast } = useAppStore();
  const addSubAccount = useAppStore(state => (state as any).addSubAccount);

  const [searchQuery, setSearchQuery] = useState("");
  const [chartMode, setChartMode] = useState<"debit" | "credit">("debit");
  const [financePeriod, setFinancePeriod] = useState<"thisMonth" | "lastMonth" | "year">("thisMonth");

  // --- ÉTATS CRÉATION SOUS-COMPTE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [allocation, setAllocation] = useState("");
  const [theme, setTheme] = useState<"navy-gold" | "ocean-blue" | "emerald">("ocean-blue");
  const [isCreating, setIsCreating] = useState(false);

  const safeTransactions = profile?.transactions || [];

  const displayedTransactions = useMemo(() => {
    let list = [...safeTransactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (searchQuery) {
      list = list.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.counterparty.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list.slice(0, 8);
  }, [safeTransactions, searchQuery]);

  const filteredFinanceData = useMemo(() => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const txns = safeTransactions.filter(t => {
      const d = new Date(t.createdAt);
      if (financePeriod === "thisMonth") return d >= startOfThisMonth;
      if (financePeriod === "lastMonth") return d >= startOfLastMonth && d <= endOfLastMonth;
      if (financePeriod === "year") return d >= startOfYear;
      return true;
    });

    const revenues = txns.filter(t => t.kind === "credit").reduce((sum, t) => sum + t.amount, 0);
    const expenses = txns.filter(t => t.kind === "debit").reduce((sum, t) => sum + t.amount, 0);
    return { revenues, expenses };
  }, [safeTransactions, financePeriod]);

  const tresoreriePeriodique = useMemo(() => filteredFinanceData.revenues - filteredFinanceData.expenses, [filteredFinanceData]);

  const mainAccount = profile?.subAccounts?.find((acc: any) => acc.isMain) || profile?.subAccounts?.[0];
  const maxAllocation = mainAccount?.balance || 0;

  const handleCreate = () => {
    const amount = Number(allocation);
    if (!newName.trim() || isNaN(amount) || amount < 0 || amount > maxAllocation) return;

    setIsCreating(true);
    setTimeout(() => {
      addSubAccount?.({
        id: `sub-${Date.now()}`,
        name: newName,
        balance: amount,
        currency: profile!.currency,
        theme: theme,
        isMain: false
      });
      showToast({ title: "Succès", description: "Sous-compte ouvert.", variant: "success" });
      setIsCreating(false);
      setIsModalOpen(false);
      setNewName("");
      setAllocation("");
    }, 800);
  };

  if (!profile) return null;

  return (
    <ScrollView className="flex-1 bg-[#F3F6F9]" showsVerticalScrollIndicator={false}>
      <View className="p-4 space-y-6">
        
        {/* HEADER */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#1D4ED8]">
              <Text className="text-white font-bold">{profile.firstName[0]}</Text>
            </View>
            <View>
              <Text className="text-[10px] font-bold text-slate-400 uppercase">Bienvenue</Text>
              <Text className="text-lg font-black text-slate-900">{profile.companyName}</Text>
            </View>
          </View>
          <TouchableOpacity className="rounded-full bg-white p-2 border border-slate-100 shadow-sm">
            <Bell size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View className="flex-row h-12 items-center bg-white rounded-xl border border-slate-200 px-4 shadow-sm">
          <Search size={18} color="#94a3b8" />
          <TextInput 
            className="flex-1 ml-2 text-slate-700 h-full"
            placeholder="Rechercher..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* QUICK ACTIONS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
          <Button variant="outline" className="mr-2" onPress={() => setActiveTab("transfers")}>
            <ArrowUpRight size={16} color="#4f46e5" /> <Text>Virement</Text>
          </Button>
          <Button variant="outline" className="mr-2" onPress={() => setActiveTab("invoices-create")}>
            <Plus size={16} color="#4f46e5" /> <Text>Facture</Text>
          </Button>
          <Button variant="outline" className="mr-2" onPress={() => setActiveTab("cards")}>
            <CreditCard size={16} color="#4f46e5" /> <Text>Cartes</Text>
          </Button>
        </ScrollView>

        {/* SOLDE GLOABLE & COMPTES */}
        <Card className="p-5">
          <Text className="text-[10px] font-bold text-slate-500 uppercase mb-1">Solde Global</Text>
          <View className="flex-row items-baseline gap-2 mb-6">
            <Text className="text-3xl font-black text-slate-900">{profile.availableBalance.toLocaleString("fr-MA")}</Text>
            <Text className="text-sm font-bold text-slate-400">{profile.currency}</Text>
          </View>
          
          <View className="space-y-3">
            {profile.subAccounts?.map((acc) => (
              <View key={acc.id} className={cn("p-4 rounded-xl flex-row justify-between items-center", acc.theme === "navy-gold" ? "bg-slate-900" : acc.theme === "ocean-blue" ? "bg-blue-600" : "bg-emerald-600")}>
                <View className="flex-row items-center gap-3">
                  <Wallet size={18} color="white" />
                  <View>
                    <Text className="text-white font-bold text-sm">{acc.name}</Text>
                    <Text className="text-white/60 text-[9px] uppercase">{(acc as any).isMain ? "Principal" : "Sous-compte"}</Text>
                  </View>
                </View>
                <Text className="text-white font-black">{acc.balance.toLocaleString("fr-MA")} {acc.currency}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={() => setIsModalOpen(true)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl items-center flex-row justify-center gap-2">
              <Plus size={16} color="#6366f1" />
              <Text className="text-indigo-600 font-bold text-xs">Ouvrir un compte</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* RECENT ACTIVITY */}
        <Card className="p-5 space-y-4">
          <Text className="text-sm font-bold text-slate-900">Dernières transactions</Text>
          <View>
            {displayedTransactions.map((tx) => (
              <View key={tx.id} className="flex-row items-center justify-between py-3 border-b border-slate-50">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 bg-slate-50 rounded-lg items-center justify-center">
                    <History size={18} color="#64748b" />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>{tx.title}</Text>
                    <Text className="text-[10px] text-slate-400">{tx.counterparty}</Text>
                  </View>
                </View>
                <Text className={cn("font-black text-sm", tx.kind === "debit" ? "text-red-600" : "text-green-600")}>
                  {tx.kind === "debit" ? "-" : "+"}{tx.amount.toLocaleString("fr-MA")}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* FLUX & ANALYTICS */}
        <Card className="p-5 space-y-6">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-bold text-slate-900">Résumé des flux</Text>
            <View className="flex-row bg-slate-100 p-1 rounded-lg">
              <TouchableOpacity onPress={() => setFinancePeriod("thisMonth")} className={cn("px-2 py-1 rounded-md", financePeriod === "thisMonth" && "bg-white shadow-sm")}>
                <Text className="text-[9px] font-bold">Mois</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFinancePeriod("year")} className={cn("px-2 py-1 rounded-md", financePeriod === "year" && "bg-white shadow-sm")}>
                <Text className="text-[9px] font-bold">Année</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row justify-between">
            <View>
              <Text className="text-[10px] text-green-500 font-bold uppercase">Revenus</Text>
              <Text className="text-xl font-black">+{filteredFinanceData.revenues.toLocaleString("fr-MA")}</Text>
            </View>
            <View>
              <Text className="text-[10px] text-red-500 font-bold uppercase">Dépenses</Text>
              <Text className="text-xl font-black">-{filteredFinanceData.expenses.toLocaleString("fr-MA")}</Text>
            </View>
          </View>
          
          <View className="pt-4 border-t border-slate-100">
            <Text className="text-[10px] text-indigo-500 font-bold uppercase mb-1">Trésorerie Net</Text>
            <Text className={cn("text-2xl font-black", tresoreriePeriodique >= 0 ? "text-slate-900" : "text-red-600")}>
              {tresoreriePeriodique >= 0 ? "+" : ""}{tresoreriePeriodique.toLocaleString("fr-MA")} {profile.currency}
            </Text>
          </View>
        </Card>

      </View>

      {/* MODAL CRÉATION */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6 space-y-6 pb-10">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-black text-slate-900">Nouveau compte</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}><X color="#000" /></TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Label>Nom du compte</Label>
                <Input value={newName} onChangeText={setNewName} placeholder="Ex: Provision TVA" />
              </View>
              <View>
                <Label>Montant à allouer (Max: {maxAllocation})</Label>
                <Input value={allocation} onChangeText={setAllocation} keyboardType="numeric" placeholder="0.00" />
              </View>
              
              <View className="flex-row gap-2">
                <Button variant="secondary" className="flex-1" onPress={() => setIsModalOpen(false)}>Annuler</Button>
                <Button className="flex-1" onPress={handleCreate} disabled={isCreating || !newName}>
                  {isCreating ? <ActivityIndicator color="white" /> : <Text>Confirmer</Text>}
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Espace pour ne pas être caché par la bottom nav */}
      <View className="h-24" />
    </ScrollView>
  );
}