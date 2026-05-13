import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Search, Star, Send, Plus, X, Building2 } from "lucide-react-native";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { CompactSelect } from "../ui/compact-select";
import { CompactDatePicker } from "../ui/compact-date-picker";
import { useActiveProfile, useAppStore } from "../../store/app-store";
import { CurrencyCode } from "../../services/mock-data";
import { cn } from "../../lib/utils";

type Beneficiary = {
  id: string;
  name: string;
  initials: string;
  bank: string;
  accountLabel: "IBAN" | "RIB";
  accountValue: string;
  preferredCurrency: string;
  defaultReason: string;
};

const initialBeneficiaries: Beneficiary[] = [
  { id: "atlas-consulting", name: "Atlas Consulting SARL", initials: "AC", bank: "Attijariwafa Bank", accountLabel: "IBAN", accountValue: "MA64 0058 1220 0304", preferredCurrency: "MAD", defaultReason: "Règlement prestation juridique" },
  { id: "maroc-telecom", name: "Maroc Telecom", initials: "MT", bank: "BMCE Bank of Africa", accountLabel: "RIB", accountValue: "021 780 000 124 001 009 31", preferredCurrency: "MAD", defaultReason: "Paiement facture télécom" },
  { id: "office-pro", name: "OfficePro Equipement", initials: "OP", bank: "Banque Populaire", accountLabel: "IBAN", accountValue: "MA78 1370 0012 0555 0160", preferredCurrency: "MAD", defaultReason: "Fournitures de bureau" },
  { id: "dgi-tresor", name: "Trésorerie Générale", initials: "TGR", bank: "Bank Al-Maghrib", accountLabel: "RIB", accountValue: "230 450 000 021 480 195 10", preferredCurrency: "MAD", defaultReason: "Paiement TVA" },
];

function normalizeAccount(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}
function formatIban(raw: string) {
  const normalized = normalizeAccount(raw);
  const head = normalized.slice(0, 4);
  const tail = normalized.slice(4).match(/.{1,4}/g) ?? [];
  return [head, ...tail].filter(Boolean).join(" ").trim();
}
function formatRib(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 20);
  const schema = [3, 3, 3, 3, 3, 3, 2];
  const parts: string[] = [];
  let cursor = 0;
  for (const size of schema) {
    const chunk = digits.slice(cursor, cursor + size);
    if (!chunk) break;
    parts.push(chunk);
    cursor += size;
  }
  return parts.join(" ");
}
function formatAccountInput(value: string) {
  const normalized = normalizeAccount(value);
  if (!normalized) return "";
  if (normalized.startsWith("MA")) return formatIban(normalized);
  if (/^\d+$/.test(normalized)) return formatRib(normalized);
  return normalized.match(/.{1,4}/g)?.join(" ") ?? normalized;
}

export function TransferScreen() {
  const profile = useActiveProfile();
  const addTransfer = useAppStore((s) => s.addTransfer);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const showToast = useAppStore((s) => s.showToast);

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialBeneficiaries);
  const [beneficiary, setBeneficiary] = useState("");
  const [ibanRib, setIbanRib] = useState("");
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("Attijariwafa Bank");
  const [timing, setTiming] = useState<"immediate" | "scheduled">("immediate");
  const [reason, setReason] = useState("");
  const currency: CurrencyCode = "MAD";
  const [executionDate, setExecutionDate] = useState<Date | null>(new Date());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBeneficiaryPickerOpen, setIsBeneficiaryPickerOpen] = useState(false);
  const [isAddBeneficiaryModalOpen, setIsAddBeneficiaryModalOpen] = useState(false);
  const [newBenName, setNewBenName] = useState("");
  const [newBenAccount, setNewBenAccount] = useState("");
  const [newBenBank, setNewBenBank] = useState("Attijariwafa Bank");
  const [isAddingBen, setIsAddingBen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("fintech.transfer-form");
        if (stored) {
          const parsed = JSON.parse(stored);
          setBeneficiary(parsed.beneficiary ?? "");
          setIbanRib(parsed.ibanRib ?? "");
          setAmount(parsed.amount ?? "");
          setBank(parsed.bank ?? "Attijariwafa Bank");
          setTiming(parsed.timing ?? "immediate");
          setReason(parsed.reason ?? "");
          setExecutionDate(parsed.executionDateIso ? new Date(parsed.executionDateIso) : new Date());
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      "fintech.transfer-form",
      JSON.stringify({
        beneficiary,
        ibanRib,
        amount,
        bank,
        timing,
        reason,
        currency,
        executionDateIso: executionDate ? executionDate.toISOString() : null,
      })
    ).catch(() => {});
  }, [beneficiary, ibanRib, amount, bank, timing, reason, currency, executionDate]);

  const recentTransfers = useMemo(() => {
    if (!profile) return [];
    return profile.transactions
      .filter((t) => t.kind === "debit")
      .slice(0, 3)
      .map((t) => ({
        name: t.counterparty,
        account: t.note || "Virement bancaire",
        amount: `${t.amount.toLocaleString("fr-MA")} ${t.currency}`,
      }));
  }, [profile]);

  const bankValues = useMemo(
    () =>
      Array.from(
        new Set([
          "Attijariwafa Bank",
          "BMCE Bank of Africa",
          "Banque Populaire",
          "CIH Bank",
          "Crédit Agricole du Maroc",
          "Société Générale Maroc",
          "Bank Al-Maghrib",
          ...beneficiaries.map((item) => item.bank),
        ])
      ),
    [beneficiaries]
  );

  function applyBeneficiary(item: Beneficiary) {
    setBeneficiary(item.name);
    setIbanRib(item.accountValue);
    setBank(item.bank);
    setReason(item.defaultReason);
    setIsBeneficiaryPickerOpen(false);
  }

  const handleAddNewBeneficiary = () => {
    if (!newBenName.trim() || !newBenAccount.trim()) return;
    setIsAddingBen(true);
    setTimeout(() => {
      const newInitials = newBenName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
      const isIban = normalizeAccount(newBenAccount).startsWith("MA");
      const newBen: Beneficiary = {
        id: `ben-${Date.now()}`,
        name: newBenName,
        initials: newInitials || "NA",
        bank: newBenBank,
        accountLabel: isIban ? "IBAN" : "RIB",
        accountValue: formatAccountInput(newBenAccount),
        preferredCurrency: "MAD",
        defaultReason: "Virement",
      };
      setBeneficiaries((prev) => [newBen, ...prev]);
      applyBeneficiary(newBen);
      showToast({
        title: "Bénéficiaire ajouté",
        description: `${newBenName} a été enregistré avec succès.`,
        variant: "success",
      });
      setIsAddingBen(false);
      setIsAddBeneficiaryModalOpen(false);
      setNewBenName("");
      setNewBenAccount("");
    }, 600);
  };

  async function handleConfirmTransfer() {
    const numericAmount = Number(amount);
    if (!beneficiary.trim() || !ibanRib.trim() || !numericAmount || numericAmount <= 0) return;
    try {
      setIsSubmitting(true);
      await addTransfer({ beneficiary, ibanRib, amount: numericAmount, currency, bank, timing, reason });
      setBeneficiary("");
      setIbanRib("");
      setAmount("");
      setReason("");
      setActiveTab("home");
    } catch {
      // toast handled
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!profile) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-slate-50"
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-4">
          <View className="mb-4">
            <Text className="text-xl font-black text-slate-900">Effectuer un virement</Text>
            <Text className="text-sm text-slate-500 mt-1">
              Exécution rapide et sécurisée vers vos bénéficiaires.
            </Text>
          </View>

          <Card className="mb-4 p-5">
            <View className="mb-4">
              <Label>Bénéficiaire</Label>
              <View className="relative mt-1">
                <View
                  pointerEvents="none"
                  style={{ position: "absolute", left: 12, top: 0, bottom: 0, justifyContent: "center", zIndex: 1 }}
                >
                  <Search size={16} color="#94A3B8" />
                </View>
                <Input
                  placeholder="Nom ou raison sociale"
                  value={beneficiary}
                  onChangeText={setBeneficiary}
                  onFocus={() => setIsBeneficiaryPickerOpen(true)}
                  className="pl-10"
                />
              </View>
            </View>

            <View className="mb-4">
              <Label>IBAN / RIB</Label>
              <Input
                placeholder="Ex: MA64 0000..."
                value={ibanRib}
                onChangeText={(v) => setIbanRib(formatAccountInput(v))}
                className="font-mono mt-1"
              />
              <Text className="text-[10px] font-medium text-slate-400 mt-1">
                Ce champ accepte les formats IBAN (MA…) et RIB marocains.
              </Text>
            </View>

            <View className="mb-4">
              <Label>Banque destinataire</Label>
              <View className="mt-1">
                <CompactSelect
                  value={bank}
                  onChange={setBank}
                  options={bankValues.map((b) => ({ label: b, value: b }))}
                />
              </View>
            </View>

            <View className="mb-4">
              <Label>Motif du virement</Label>
              <Input
                placeholder="Ex: Facture #874"
                value={reason}
                onChangeText={setReason}
                className="mt-1"
              />
            </View>

            <View className="mb-4">
              <Label>Type d'exécution</Label>
              <View className="flex-row bg-slate-100 rounded-xl p-1.5 mt-1">
                <TouchableOpacity
                  onPress={() => setTiming("immediate")}
                  className={cn(
                    "flex-1 rounded-lg py-2.5 items-center",
                    timing === "immediate" ? "bg-white" : "bg-transparent"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-bold uppercase",
                      timing === "immediate" ? "text-indigo-600" : "text-slate-500"
                    )}
                  >
                    Immédiat
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTiming("scheduled")}
                  className={cn(
                    "flex-1 rounded-lg py-2.5 items-center",
                    timing === "scheduled" ? "bg-white" : "bg-transparent"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-bold uppercase",
                      timing === "scheduled" ? "text-indigo-600" : "text-slate-500"
                    )}
                  >
                    Différé
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {timing === "scheduled" && (
              <View className="mb-4">
                <Label>Date d'exécution</Label>
                <View className="mt-1">
                  <CompactDatePicker value={executionDate} onChange={setExecutionDate} />
                </View>
              </View>
            )}

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Label>Montant</Label>
                <Input
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  className="text-lg font-black mt-1"
                />
              </View>
              <View style={{ width: 80 }}>
                <Label>Devise</Label>
                <View className="h-12 mt-1 bg-slate-100 rounded-xl items-center justify-center">
                  <Text className="text-slate-500 font-black">MAD</Text>
                </View>
              </View>
            </View>

            <Button
              className="h-12 bg-indigo-600 mt-2"
              onPress={handleConfirmTransfer}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              <Send size={16} color="#FFFFFF" />
              <Text className="text-white text-sm font-bold">
                {isSubmitting ? "Traitement..." : "Confirmer le virement"}
              </Text>
            </Button>
          </Card>

          <Card className="mb-4 p-5">
            <Text className="text-sm font-bold text-slate-900 mb-4">Bénéficiaires favoris</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {beneficiaries.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => applyBeneficiary(item)}
                  className="items-center mr-4"
                  activeOpacity={0.7}
                >
                  <View className="h-12 w-12 rounded-full bg-indigo-50 items-center justify-center">
                    <Text className="text-sm font-black text-indigo-600">{item.initials}</Text>
                  </View>
                  <Text className="text-[11px] font-bold text-slate-600 mt-1.5 max-w-[70px]" numberOfLines={1}>
                    {item.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setIsAddBeneficiaryModalOpen(true)}
                className="items-center mr-4"
                activeOpacity={0.7}
              >
                <View className="h-12 w-12 rounded-full bg-slate-100 items-center justify-center border-2 border-dashed border-slate-300">
                  <Plus size={18} color="#4338CA" />
                </View>
                <Text className="text-[11px] font-bold text-slate-600 mt-1.5">Nouveau</Text>
              </TouchableOpacity>
            </ScrollView>
          </Card>

          <Card className="mb-4 p-5">
            <View className="flex-row items-center mb-3">
              <Star size={16} color="#4338CA" />
              <Text className="ml-2 text-sm font-bold text-slate-900">Virements récents</Text>
            </View>
            {recentTransfers.length > 0 ? (
              recentTransfers.map((item, idx) => (
                <View key={`${item.name}-${idx}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3 mb-2">
                  <Text className="text-xs font-bold text-slate-900">{item.name}</Text>
                  <Text className="text-[10px] font-medium text-slate-500 mt-0.5" numberOfLines={1}>
                    {item.account}
                  </Text>
                  <Text className="mt-2 text-sm font-black text-red-600">-{item.amount}</Text>
                </View>
              ))
            ) : (
              <Text className="text-xs font-medium text-slate-500 text-center py-4">
                Aucun virement récent trouvé.
              </Text>
            )}
          </Card>
        </View>
      </ScrollView>

      {/* Beneficiary picker modal */}
      <Modal
        visible={isBeneficiaryPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsBeneficiaryPickerOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setIsBeneficiaryPickerOpen(false)}
        >
          <Pressable className="bg-white rounded-t-3xl p-5 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-black text-slate-900">Choisir un bénéficiaire</Text>
              <TouchableOpacity
                onPress={() => setIsBeneficiaryPickerOpen(false)}
                className="p-1.5 rounded-full bg-slate-50"
              >
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setIsBeneficiaryPickerOpen(false);
                setIsAddBeneficiaryModalOpen(true);
              }}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50 py-3 mb-3"
            >
              <Plus size={16} color="#4338CA" />
              <Text className="text-sm font-bold text-indigo-600">Ajouter un nouveau bénéficiaire</Text>
            </TouchableOpacity>

            <ScrollView>
              {beneficiaries.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => applyBeneficiary(item)}
                  activeOpacity={0.7}
                  className="rounded-xl py-3 px-3 mb-1 bg-white border border-slate-100"
                >
                  <Text className="text-sm font-bold text-slate-900">{item.name}</Text>
                  <Text className="text-xs font-medium text-slate-500 mt-0.5">
                    {item.accountLabel}: {item.accountValue}
                  </Text>
                  <Text className="text-[10px] font-bold text-slate-400 uppercase mt-1">{item.bank}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add beneficiary modal */}
      <Modal
        visible={isAddBeneficiaryModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddBeneficiaryModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            className="flex-1 items-center justify-center bg-black/40 px-4"
            onPress={() => setIsAddBeneficiaryModalOpen(false)}
          >
            <Pressable className="w-full max-w-md">
              <Card className="p-5">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-black text-slate-900">Nouveau bénéficiaire</Text>
                  <TouchableOpacity
                    onPress={() => setIsAddBeneficiaryModalOpen(false)}
                    className="p-1.5 rounded-full bg-slate-50"
                  >
                    <X size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
                <Text className="text-xs font-medium text-slate-500 mb-4">
                  Enregistrez un nouveau compte pour vos futurs virements.
                </Text>
                <View className="mb-3">
                  <Label>Raison sociale / Nom complet</Label>
                  <Input
                    placeholder="Ex: Atlas Consulting SARL"
                    value={newBenName}
                    onChangeText={setNewBenName}
                    className="mt-1"
                  />
                </View>
                <View className="mb-3">
                  <Label>IBAN ou RIB Marocain</Label>
                  <Input
                    placeholder="Ex: MA64..."
                    value={newBenAccount}
                    onChangeText={(v) => setNewBenAccount(formatAccountInput(v))}
                    className="font-mono mt-1"
                  />
                </View>
                <View className="mb-4">
                  <Label>Banque</Label>
                  <View className="mt-1">
                    <CompactSelect
                      value={newBenBank}
                      onChange={setNewBenBank}
                      options={bankValues.map((b) => ({ label: b, value: b }))}
                    />
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onPress={() => setIsAddBeneficiaryModalOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1 bg-indigo-600"
                    onPress={handleAddNewBeneficiary}
                    disabled={!newBenName.trim() || !newBenAccount.trim() || isAddingBen}
                    loading={isAddingBen}
                  >
                    <Building2 size={16} color="#FFFFFF" />
                    <Text className="text-white text-sm font-bold">Ajouter</Text>
                  </Button>
                </View>
              </Card>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}
