import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
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
  PieChart,
} from "lucide-react-native";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useActiveProfile, useAppStore } from "../../store/app-store";
import { cn } from "../../lib/utils";

const getIconForTransaction = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("virement") || t.includes("transfer") || t.includes("reçu")) return ArrowDownToLine;
  if (t.includes("fournisseur") || t.includes("supplier") || t.includes("achat") || t.includes("facture")) return Landmark;
  if (t.includes("salaire") || t.includes("salary") || t.includes("paie")) return BadgeDollarSign;
  if (t.includes("carte") || t.includes("card") || t.includes("paiement") || t.includes("pos")) return CreditCard;
  return ArrowDownToLine;
};

const CHART_COLORS = ["#2563EB", "#C26B2F", "#9E7D07", "#15803D", "#4F46E5", "#0891B2", "#BE123C"];
const CHART_BG_COLORS = ["#D9EEFF", "#FFE7D5", "#FFF7CC", "#DCFCE7", "#E0E7FF", "#CFFAFE", "#FFE4E6"];

const themeBg = (theme: string) =>
  theme === "navy-gold" ? "bg-slate-900" : theme === "ocean-blue" ? "bg-blue-600" : "bg-emerald-600";

export function DashboardScreen() {
  const profile = useActiveProfile();
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const showToast = useAppStore((s) => s.showToast);
  const addSubAccount = useAppStore((s) => s.addSubAccount);

  const [searchQuery, setSearchQuery] = useState("");
  const [chartMode, setChartMode] = useState<"debit" | "credit">("debit");
  const [financePeriod, setFinancePeriod] = useState<"thisMonth" | "lastMonth" | "year">("thisMonth");

  const [isSubAccountModalOpen, setIsSubAccountModalOpen] = useState(false);
  const [newSubAccountName, setNewSubAccountName] = useState("");
  const [allocationAmount, setAllocationAmount] = useState("");
  const [newSubAccountTheme, setNewSubAccountTheme] = useState<"navy-gold" | "ocean-blue" | "emerald">("ocean-blue");
  const [isCreatingSubAccount, setIsCreatingSubAccount] = useState(false);

  const safeTransactions = profile?.transactions || [];

  const sortedTransactions = useMemo(() => {
    return [...safeTransactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [safeTransactions]);

  const displayedTransactions = useMemo(() => {
    let list = sortedTransactions;
    if (searchQuery) {
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.counterparty.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list.slice(0, 8);
  }, [sortedTransactions, searchQuery]);

  const filteredFinanceData = useMemo(() => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const isDateInPeriod = (dateStr: string) => {
      const d = new Date(dateStr);
      if (financePeriod === "thisMonth") return d >= startOfThisMonth;
      if (financePeriod === "lastMonth") return d >= startOfLastMonth && d <= endOfLastMonth;
      if (financePeriod === "year") return d >= startOfYear;
      return true;
    };

    const expenses = safeTransactions
      .filter((t) => t.kind === "debit" && isDateInPeriod(t.createdAt))
      .reduce((sum, t) => sum + t.amount, 0);

    const paidInvoicesRevenue = (profile?.invoices || [])
      .filter((inv) => inv.type === "paye" && inv.status === "paid" && isDateInPeriod(inv.createdAt))
      .reduce((sum, inv) => sum + inv.totalTTC, 0);

    const creditTransactionsRevenue = safeTransactions
      .filter((t) => t.kind === "credit" && isDateInPeriod(t.createdAt))
      .reduce((sum, t) => sum + t.amount, 0);

    const revenues = paidInvoicesRevenue + creditTransactionsRevenue;

    return { revenues, expenses };
  }, [safeTransactions, profile?.invoices, financePeriod]);

  const tresoreriePeriodique = filteredFinanceData.revenues - filteredFinanceData.expenses;

  const getPeriodLabel = () => {
    if (financePeriod === "thisMonth") return "Ce mois";
    if (financePeriod === "lastMonth") return "Mois dernier";
    return "Cette année";
  };

  const { chartTags, chartTotal } = useMemo(() => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const isDateInPeriod = (dateStr: string) => {
      const d = new Date(dateStr);
      if (financePeriod === "thisMonth") return d >= startOfThisMonth;
      if (financePeriod === "lastMonth") return d >= startOfLastMonth && d <= endOfLastMonth;
      if (financePeriod === "year") return d >= startOfYear;
      return true;
    };

    let total = 0;
    let grouped: Record<string, number> = {};

    if (chartMode === "debit") {
      const targetTxns = safeTransactions.filter((t) => t.kind === "debit" && isDateInPeriod(t.createdAt));
      total = targetTxns.reduce((sum, t) => sum + t.amount, 0);
      grouped = targetTxns.reduce((acc, t) => {
        const cat = t.title || "Autre";
        acc[cat] = (acc[cat] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    } else {
      const paidInvoices = (profile?.invoices || []).filter(
        (inv) => inv.type === "paye" && inv.status === "paid" && isDateInPeriod(inv.createdAt)
      );
      const creditTransactions = safeTransactions.filter((t) => t.kind === "credit" && isDateInPeriod(t.createdAt));

      paidInvoices.forEach((inv) => {
        const cat = inv.clientName || "Client Divers";
        grouped[cat] = (grouped[cat] || 0) + inv.totalTTC;
      });

      creditTransactions.forEach((t) => {
        const cat = t.title || "Virement reçu";
        grouped[cat] = (grouped[cat] || 0) + t.amount;
      });

      total =
        paidInvoices.reduce((sum, inv) => sum + inv.totalTTC, 0) +
        creditTransactions.reduce((sum, t) => sum + t.amount, 0);
    }

    if (total === 0) return { chartTags: [], chartTotal: 0 };

    const sortedCategories = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    const tags = sortedCategories.map(([label, amount], index) => {
      const percentage = (amount / total) * 100;
      const color = CHART_COLORS[index % CHART_COLORS.length];
      const bgColor = CHART_BG_COLORS[index % CHART_BG_COLORS.length];
      return { label: `${label} ${Math.round(percentage)}%`, textColor: color, bgColor };
    });

    return { chartTags: tags, chartTotal: total };
  }, [safeTransactions, profile?.invoices, chartMode, financePeriod]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("fr-MA", { day: "2-digit", month: "short" }) +
      ", " +
      d.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const mainAccount = profile?.subAccounts?.find((acc: any) => acc.isMain) || profile?.subAccounts?.[0];
  const maxAllocation = mainAccount?.balance || 0;

  const handleCreateSubAccount = () => {
    const amount = Number(allocationAmount);
    if (!newSubAccountName.trim() || isNaN(amount) || amount < 0 || amount > maxAllocation) {
      showToast({
        title: "Erreur",
        description: "Veuillez vérifier les informations saisies.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingSubAccount(true);
    setTimeout(() => {
      const newAccount = {
        id: `sub-${Date.now()}`,
        name: newSubAccountName,
        balance: amount,
        currency: profile!.currency,
        theme: newSubAccountTheme,
        isMain: false,
      };
      addSubAccount(newAccount);
      showToast({
        title: "Sous-compte ouvert",
        description: `Le compte "${newSubAccountName}" est provisionné avec ${amount.toLocaleString("fr-MA")} ${profile!.currency}.`,
        variant: "success",
      });
      setIsCreatingSubAccount(false);
      setIsSubAccountModalOpen(false);
      setNewSubAccountName("");
      setAllocationAmount("");
    }, 600);
  };

  if (!profile) return null;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="px-4 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-indigo-600">
              <Text className="text-white font-bold text-lg">{profile.firstName[0]}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bienvenue</Text>
              <Text className="text-lg font-black text-slate-900" numberOfLines={1}>
                {profile.companyName}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="rounded-full border border-slate-100 bg-white p-2.5">
            <Bell size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3 h-12 mb-4">
          <Search size={16} color="#94A3B8" />
          <TextInput
            placeholder="Rechercher une transaction..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-sm text-slate-900"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-5"
          contentContainerStyle={{ paddingRight: 8 }}
        >
          {[
            { key: "transfers", label: "Virement", Icon: ArrowUpRight },
            { key: "invoices-create", label: "Facture", Icon: Plus },
            { key: "cards", label: "Cartes", Icon: CreditCard },
            { key: "documents", label: "RIB", Icon: FileText },
            { key: "home", label: "Historique", Icon: History },
          ].map(({ key, label, Icon }) => (
            <TouchableOpacity
              key={key}
              activeOpacity={0.7}
              onPress={() => setActiveTab(key as any)}
              className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 mr-2"
            >
              <Icon size={16} color="#4338CA" />
              <Text className="ml-2 text-sm font-bold text-slate-900">{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Solde global */}
        <Card className="mb-4 p-5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Solde global disponible
            </Text>
            <View className="rounded-md bg-slate-100 px-2 py-1">
              <Text className="text-[10px] font-bold text-slate-500">{profile.currency}</Text>
            </View>
          </View>
          <View className="flex-row items-baseline gap-1.5">
            <Text className="text-3xl font-black text-slate-900">
              {profile.availableBalance.toLocaleString("fr-MA")}
            </Text>
            <Text className="text-sm font-bold text-slate-400">{profile.currency}</Text>
          </View>

          <View className="mt-5 pt-5 border-t border-slate-100">
            <Text className="text-xs font-bold text-slate-900 mb-3">Vos comptes</Text>
            {profile.subAccounts?.map((acc) => (
              <View
                key={acc.id}
                className={cn(
                  "rounded-xl p-4 mb-2 flex-row items-center justify-between",
                  themeBg(acc.theme)
                )}
              >
                <View className="flex-row items-center flex-1 gap-3">
                  <View className="h-10 w-10 rounded-full bg-white/20 items-center justify-center">
                    <Wallet size={18} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-white">{acc.name}</Text>
                    <Text className="text-[10px] text-white/80 uppercase tracking-widest mt-0.5">
                      {(acc as any).isMain ? "Compte Principal" : "Sous-compte"}
                    </Text>
                  </View>
                </View>
                <View>
                  <Text className="text-base font-black text-white text-right">
                    {acc.balance.toLocaleString("fr-MA")}
                  </Text>
                  <Text className="text-[10px] text-white/80 uppercase tracking-wider text-right mt-0.5">
                    {acc.currency}
                  </Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setIsSubAccountModalOpen(true)}
              activeOpacity={0.7}
              className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-3.5 flex-row items-center justify-center"
            >
              <Plus size={18} color="#4338CA" />
              <Text className="ml-2 text-xs font-bold text-slate-600">Ouvrir un nouveau compte</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Dernières transactions */}
        <Card className="mb-4 p-5">
          <Text className="text-sm font-bold text-slate-900 mb-3">Dernières transactions</Text>
          {displayedTransactions.length > 0 ? (
            displayedTransactions.map((item) => {
              const Icon = getIconForTransaction(item.title);
              return (
                <View key={item.id} className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center flex-1 gap-3">
                    <View className="h-10 w-10 rounded-xl bg-slate-50 items-center justify-center">
                      <Icon size={18} color="#475569" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[13px] font-bold text-slate-900" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text className="text-[11px] font-medium text-slate-400 mt-0.5" numberOfLines={1}>
                        {item.counterparty} • {formatDate(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className={cn(
                      "text-sm font-black ml-2",
                      item.kind === "debit" ? "text-red-600" : "text-green-600"
                    )}
                  >
                    {item.kind === "debit" ? "-" : "+"}
                    {item.amount.toLocaleString("fr-MA")}
                  </Text>
                </View>
              );
            })
          ) : (
            <View className="items-center py-8">
              <History size={32} color="#CBD5E1" />
              <Text className="text-xs font-medium text-slate-400 mt-2">Aucune opération trouvée.</Text>
            </View>
          )}
        </Card>

        {/* Résumé des Flux */}
        <Card className="mb-4 p-5">
          <View className="mb-4">
            <Text className="text-sm font-bold text-slate-900">Résumé des Flux</Text>
            <Text className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mt-0.5">
              Performance financière
            </Text>
          </View>
          <View className="flex-row bg-slate-100 rounded-lg p-1 mb-5">
            {(["thisMonth", "lastMonth", "year"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setFinancePeriod(p)}
                className={cn(
                  "flex-1 rounded-md py-1.5 items-center",
                  financePeriod === p ? "bg-white" : "bg-transparent"
                )}
              >
                <Text
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    financePeriod === p ? "text-indigo-600" : "text-slate-500"
                  )}
                >
                  {p === "thisMonth" ? "Ce mois" : p === "lastMonth" ? "Mois dernier" : "Année"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="mb-4">
            <View className="flex-row items-center mb-1">
              <View className="h-2 w-2 rounded-full bg-green-500 mr-2" />
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Revenus (Facturé)
              </Text>
            </View>
            <Text className="text-2xl font-black text-slate-900">
              +{filteredFinanceData.revenues.toLocaleString("fr-MA")}{" "}
              <Text className="text-xs text-slate-400">{profile.currency}</Text>
            </Text>
          </View>
          <View className="mb-4">
            <View className="flex-row items-center mb-1">
              <View className="h-2 w-2 rounded-full bg-red-500 mr-2" />
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Dépenses (Payé)
              </Text>
            </View>
            <Text className="text-2xl font-black text-slate-900">
              -{filteredFinanceData.expenses.toLocaleString("fr-MA")}{" "}
              <Text className="text-xs text-slate-400">{profile.currency}</Text>
            </Text>
          </View>

          <View className="border-t border-slate-100 pt-4 mt-2">
            <Text className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">
              Trésorerie ({getPeriodLabel()})
            </Text>
            <View
              className={cn(
                "self-start px-2.5 py-1 rounded-md mb-2",
                tresoreriePeriodique >= 0 ? "bg-green-50" : "bg-red-50"
              )}
            >
              <Text
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider",
                  tresoreriePeriodique >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {tresoreriePeriodique >= 0 ? "Excédentaire" : "Déficitaire"}
              </Text>
            </View>
            <Text
              className={cn(
                "text-3xl font-black",
                tresoreriePeriodique >= 0 ? "text-slate-900" : "text-red-600"
              )}
            >
              {tresoreriePeriodique >= 0 ? "+" : ""}
              {tresoreriePeriodique.toLocaleString("fr-MA")}{" "}
              <Text className="text-sm text-slate-400">{profile.currency}</Text>
            </Text>
          </View>
        </Card>

        {/* Analytique par catégorie */}
        <Card className="mb-4 p-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-bold text-slate-900 flex-1">
              Analytique <Text className="font-normal text-slate-500">({getPeriodLabel()})</Text>
            </Text>
          </View>
          <View className="flex-row bg-slate-100 rounded-lg p-1 mb-4">
            {(["debit", "credit"] as const).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setChartMode(m)}
                className={cn(
                  "flex-1 rounded-md py-1.5 items-center",
                  chartMode === m ? "bg-white" : "bg-transparent"
                )}
              >
                <Text
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    chartMode === m ? "text-slate-900" : "text-slate-500"
                  )}
                >
                  {m === "debit" ? "Dépenses" : "Revenus"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="items-center mb-4">
            <View className="h-32 w-32 rounded-full bg-indigo-100 items-center justify-center">
              <PieChart size={24} color="#4338CA" />
              <Text className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                {chartMode === "debit" ? "Dépenses" : "Revenus"}
              </Text>
              <Text className="text-lg font-black text-slate-900">
                {chartTotal.toLocaleString("fr-MA")}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {chartTags.length > 0 ? (
              chartTags.map((tag) => (
                <View
                  key={tag.label}
                  style={{ backgroundColor: tag.bgColor }}
                  className="rounded-lg px-3 py-1.5"
                >
                  <Text style={{ color: tag.textColor }} className="text-[11px] font-bold uppercase">
                    {tag.label}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-xs text-slate-400 italic">Aucune donnée pour cette période.</Text>
            )}
          </View>
        </Card>
      </View>

      {/* Modal de création de sous-compte */}
      <Modal
        visible={isSubAccountModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSubAccountModalOpen(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-4"
          onPress={() => setIsSubAccountModalOpen(false)}
        >
          <Pressable className="w-full max-w-md">
            <Card className="p-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-black text-slate-900">Nouveau sous-compte</Text>
                <TouchableOpacity
                  onPress={() => setIsSubAccountModalOpen(false)}
                  className="p-1.5 rounded-full bg-slate-50"
                >
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <Text className="text-xs font-medium text-slate-500 mb-4">
                Séparez votre trésorerie pour mieux gérer vos budgets (ex: TVA, Salaires).
              </Text>

              <View className="mb-4">
                <Label>Nom du sous-compte</Label>
                <Input
                  placeholder="Ex: Provision Impôts"
                  value={newSubAccountName}
                  onChangeText={setNewSubAccountName}
                  className="mt-1"
                />
              </View>

              <View className="mb-4">
                <View className="flex-row justify-between mb-1">
                  <Label>Montant alloué ({profile.currency})</Label>
                  <Text className="text-[11px] font-bold text-indigo-600">
                    Max: {maxAllocation.toLocaleString("fr-MA")}
                  </Text>
                </View>
                <Input
                  placeholder="Ex: 50000"
                  keyboardType="numeric"
                  value={allocationAmount}
                  onChangeText={setAllocationAmount}
                />
                {Number(allocationAmount) > maxAllocation && (
                  <Text className="text-[10px] text-red-500 font-bold mt-1.5">
                    Fonds insuffisants sur le compte principal.
                  </Text>
                )}
              </View>

              <View className="mb-4">
                <Label>Couleur du compte</Label>
                <View className="flex-row gap-2 mt-1">
                  {[
                    { id: "navy-gold", bg: "bg-slate-900", label: "Navy" },
                    { id: "ocean-blue", bg: "bg-blue-600", label: "Océan" },
                    { id: "emerald", bg: "bg-emerald-600", label: "Émeraude" },
                  ].map((theme) => (
                    <TouchableOpacity
                      key={theme.id}
                      onPress={() => setNewSubAccountTheme(theme.id as any)}
                      activeOpacity={0.7}
                      className={cn(
                        "flex-1 items-center gap-1.5 rounded-xl border-2 p-2",
                        newSubAccountTheme === theme.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-100 bg-white"
                      )}
                    >
                      <View className={cn("h-8 w-full rounded-lg", theme.bg)} />
                      <Text className="text-[10px] font-bold text-slate-600">{theme.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="flex-row gap-3 mt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onPress={() => {
                    setIsSubAccountModalOpen(false);
                    setAllocationAmount("");
                    setNewSubAccountName("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-indigo-600"
                  onPress={handleCreateSubAccount}
                  disabled={
                    !newSubAccountName.trim() ||
                    isCreatingSubAccount ||
                    Number(allocationAmount) > maxAllocation ||
                    Number(allocationAmount) < 0 ||
                    allocationAmount === ""
                  }
                  loading={isCreatingSubAccount}
                >
                  <PieChart size={16} color="#FFFFFF" />
                  <Text className="text-white text-sm font-bold">Ouvrir</Text>
                </Button>
              </View>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
