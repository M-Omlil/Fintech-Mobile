import React, { useEffect, useMemo, useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Search, Star, Loader2, Send, Plus, X, Building2 } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CompactSelect } from "@/components/ui/compact-select";
import { CompactDatePicker } from "@/components/ui/compact-date-picker";
import { useActiveProfile, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

type Beneficiary = {
  id: string;
  name: string;
  initials: string;
  bank: string;
  accountLabel: "IBAN" | "RIB";
  accountValue: string;
  defaultReason: string;
};

const initialBeneficiaries: Beneficiary[] = [
  { id: "atlas", name: "Atlas Consulting SARL", initials: "AC", bank: "Attijariwafa Bank", accountLabel: "IBAN", accountValue: "MA64 0058 1220 0304", defaultReason: "Prestation juridique" },
  { id: "telecom", name: "Maroc Telecom", initials: "MT", bank: "BMCE Bank of Africa", accountLabel: "RIB", accountValue: "021 780 000 124 001 009 31", defaultReason: "Facture télécom" },
  { id: "office", name: "OfficePro Equipement", initials: "OP", bank: "Banque Populaire", accountLabel: "IBAN", accountValue: "MA78 1370 0012 0555 0160", defaultReason: "Fournitures" }
];

export function TransferScreen() {
  const profile = useActiveProfile();
  const { addTransfer, setActiveTab, showToast } = useAppStore();
  
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialBeneficiaries);
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [ibanRib, setIbanRib] = useState("");
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("Attijariwafa Bank");
  const [timing, setTiming] = useState<"immediate" | "scheduled">("immediate");
  const [reason, setReason] = useState("");
  const [executionDate, setExecutionDate] = useState<Date | null>(new Date());
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Logic Helpers (Copy-pasted from your web logic)
  const normalize = (val: string) => val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  
  const formatAccount = (val: string) => {
    const n = normalize(val);
    if (n.startsWith("MA")) return n.match(/.{1,4}/g)?.join(" ") || n;
    return n.match(/.{1,3}/g)?.join(" ") || n; // Simple RIB format
  };

  const filteredBens = useMemo(() => {
    if (!beneficiaryName) return [];
    return beneficiaries.filter(b => b.name.toLowerCase().includes(beneficiaryName.toLowerCase()));
  }, [beneficiaryName, beneficiaries]);

  const applyBen = (item: Beneficiary) => {
    setBeneficiaryName(item.name);
    setIbanRib(item.accountValue);
    setBank(item.bank);
    setReason(item.defaultReason);
  };

  const handleConfirm = async () => {
    if (!beneficiaryName || !ibanRib || !amount) return;
    setIsSubmitting(true);
    try {
      await addTransfer({ beneficiary: beneficiaryName, ibanRib, amount: Number(amount), currency: "MAD", bank, timing, reason });
      setActiveTab("home");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <ScrollView className="flex-1 bg-[#F3F6F9]" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-5">
          
          <View>
            <Text className="text-2xl font-black text-[#061438]">Virement</Text>
            <Text className="text-sm text-slate-500 mt-1">Envoyez des fonds en toute sécurité.</Text>
          </View>

          {/* FORMULAIRE */}
          <Card className="p-5 space-y-5">
            <View>
              <Label>Bénéficiaire</Label>
              <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-3 h-12">
                <Search size={16} color="#94a3b8" />
                <Input 
                  className="flex-1 ml-2 border-0 h-full"
                  placeholder="Nom du bénéficiaire"
                  value={beneficiaryName}
                  onChangeText={setBeneficiaryName}
                />
                <TouchableOpacity onPress={() => setIsAddModalOpen(true)}>
                  <Plus size={20} color="#4f46e5" />
                </TouchableOpacity>
              </View>
              
              {/* Suggestion List (Mobile optimization) */}
              {filteredBens.length > 0 && beneficiaryName !== filteredBens[0].name && (
                <View className="mt-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                  {filteredBens.map(b => (
                    <TouchableOpacity key={b.id} className="p-3 border-b border-slate-50" onPress={() => applyBen(b)}>
                      <Text className="font-bold text-slate-900">{b.name}</Text>
                      <Text className="text-[10px] text-slate-400">{b.bank} • {b.accountValue}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View>
              <Label>IBAN / RIB</Label>
              <Input 
                placeholder="MA64..." 
                value={ibanRib} 
                onChangeText={(t) => setIbanRib(formatAccount(t))}
              />
            </View>

            <View>
              <Label>Banque</Label>
              <CompactSelect 
                value={bank} 
                onChange={setBank} 
                options={[
                  { label: "Attijariwafa Bank", value: "Attijariwafa Bank" },
                  { label: "BMCE Bank", value: "BMCE Bank" },
                  { label: "CIH Bank", value: "CIH Bank" }
                ]} 
              />
            </View>

            <View>
              <Label>Exécution</Label>
              <View className="flex-row bg-slate-100 p-1 rounded-xl">
                <TouchableOpacity 
                  onPress={() => setTiming("immediate")}
                  className={cn("flex-1 py-2.5 rounded-lg items-center", timing === "immediate" ? "bg-white shadow-sm" : "")}
                >
                  <Text className={cn("text-xs font-bold", timing === "immediate" ? "text-indigo-600" : "text-slate-500")}>Immédiat</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setTiming("scheduled")}
                  className={cn("flex-1 py-2.5 rounded-lg items-center", timing === "scheduled" ? "bg-white shadow-sm" : "")}
                >
                  <Text className={cn("text-xs font-bold", timing === "scheduled" ? "text-indigo-600" : "text-slate-500")}>Différé</Text>
                </TouchableOpacity>
              </View>
            </View>

            {timing === "scheduled" && <CompactDatePicker value={executionDate} onChange={setExecutionDate} />}

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Label>Montant</Label>
                <Input keyboardType="numeric" placeholder="0.00" value={amount} onChangeText={setAmount} />
              </View>
              <View className="w-20">
                <Label>Devise</Label>
                <View className="h-12 bg-slate-100 items-center justify-center rounded-xl border border-slate-200">
                  <Text className="font-black text-slate-500">MAD</Text>
                </View>
              </View>
            </View>

            <Button className="h-14 mt-2" onPress={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="white" /> : <><Send size={18} color="white" /><Text>Confirmer le virement</Text></>}
            </Button>
          </Card>

          {/* FAVORIS HORIZONTAUX */}
          <View>
            <Text className="text-sm font-bold text-slate-900 mb-3 ml-1">Favoris</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {beneficiaries.map(b => (
                <TouchableOpacity key={b.id} className="items-center mr-5" onPress={() => applyBen(b)}>
                  <View className="h-14 w-14 rounded-full bg-indigo-50 items-center justify-center border border-indigo-100">
                    <Text className="text-indigo-600 font-black">{b.initials}</Text>
                  </View>
                  <Text className="text-[10px] font-bold text-slate-600 mt-2">{b.name.split(" ")[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="h-20" />
        </View>
      </ScrollView>

      {/* MODAL AJOUT BÉNÉFICIAIRE */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6 space-y-5 pb-10">
            <View className="flex-row justify-between">
              <Text className="text-xl font-black text-slate-900">Nouveau Bénéficiaire</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}><X color="#000" /></TouchableOpacity>
            </View>
            <View className="space-y-4">
              <View><Label>Nom complet</Label><Input placeholder="Ex: Atlas SARL" /></View>
              <View><Label>Compte (IBAN/RIB)</Label><Input placeholder="MA64..." /></View>
              <Button className="h-12" onPress={() => setIsAddModalOpen(false)}>Enregistrer</Button>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}