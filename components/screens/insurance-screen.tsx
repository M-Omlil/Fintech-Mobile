import React, { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { ShieldCheck, Users, Search, Plus, ArrowLeft, HeartPulse, Loader2, AlertCircle } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CompactSelect } from "@/components/ui/compact-select";
import { useActiveProfile, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function InsuranceScreen({ view }: { view: "list" | "create" }) {
  const profile = useActiveProfile();
  const { toggleInsuranceStatus, addInsurance, setActiveTab } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [role, setRole] = useState("");
  const [coverageType, setCoverageType] = useState<string>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fallback safe access
  const insurances = (profile as any)?.employeeInsurances || [];

  const filteredInsurances = useMemo(() => {
    if (!searchQuery) return insurances;
    return insurances.filter((ins: any) => 
      ins.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ins.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [insurances, searchQuery]);

  const activeCount = useMemo(() => insurances.filter((i: any) => i.status === "active").length, [insurances]);
  
  const totalMonthlyPremium = useMemo(() => 
    insurances.filter((i: any) => i.status === "active").reduce((sum: number, i: any) => sum + i.premium, 0), 
  [insurances]);

  const handleAddEmployee = () => {
    if (!employeeName || !role) return;
    setIsSubmitting(true);
    
    setTimeout(async () => {
      const premium = coverageType === "basic" ? 250 : coverageType === "premium" ? 450 : 850;
      
      if (addInsurance) {
        await addInsurance({
          employeeName,
          role,
          coverageType: coverageType as any,
          premium,
          status: "active",
          startDate: new Date().toISOString()
        });
      }
      setIsSubmitting(false);
      setActiveTab("insurances");
    }, 800);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active": return { text: "text-green-600", bg: "bg-green-50", border: "border-green-100", label: "Couvert" };
      case "suspended": return { text: "text-red-600", bg: "bg-red-50", border: "border-red-100", label: "Suspendu" };
      default: return { text: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", label: "En attente" };
    }
  };

  if (!profile) return null;

  if (view === "list") {
    return (
      <ScrollView className="flex-1 bg-[#F3F6F9]" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-5">
          
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-2xl font-black text-[#061438]">Assurance Santé</Text>
              <Text className="text-sm text-slate-500">Mutuelle d'entreprise</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setActiveTab("insurances-create")}
              className="h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-sm"
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* STATS */}
          <View className="flex-row gap-3">
            <Card className="flex-1 p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Users size={14} color="#4F46E5" />
                <Text className="text-[10px] font-bold text-slate-500 uppercase">Employés</Text>
              </View>
              <Text className="text-xl font-black text-slate-900">{activeCount} / {insurances.length}</Text>
            </Card>
            <Card className="flex-1 p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <ShieldCheck size={14} color="#16A34A" />
                <Text className="text-[10px] font-bold text-slate-500 uppercase">Prime/mois</Text>
              </View>
              <Text className="text-xl font-black text-slate-900">{totalMonthlyPremium} {profile.currency}</Text>
            </Card>
          </View>

          {/* SEARCH */}
          <View className="flex-row h-12 items-center bg-white rounded-xl border border-slate-200 px-4 shadow-sm">
            <Search size={18} color="#94a3b8" />
            <TextInput 
              className="flex-1 ml-2 text-slate-700 h-full"
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* LIST */}
          <Card className="p-0 overflow-hidden">
            {filteredInsurances.length > 0 ? (
              filteredInsurances.map((ins: any, idx: number) => {
                const status = getStatusStyle(ins.status);
                return (
                  <View key={ins.id} className={cn("p-4 flex-row items-center justify-between", idx !== 0 && "border-t border-slate-50")}>
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="h-10 w-10 rounded-full bg-indigo-50 items-center justify-center">
                        <Text className="text-indigo-700 font-bold">{ins.employeeName.charAt(0)}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[14px] font-bold text-slate-900" numberOfLines={1}>{ins.employeeName}</Text>
                        <Text className="text-[11px] text-slate-500">{ins.role}</Text>
                      </View>
                    </View>

                    <View className="items-end gap-2">
                      <View className={cn("px-2 py-0.5 rounded-full border", status.bg, status.border)}>
                        <Text className={cn("text-[9px] font-bold uppercase", status.text)}>{status.label}</Text>
                      </View>
                      <TouchableOpacity onPress={() => toggleInsuranceStatus?.(ins.id)}>
                        <Text className={cn("text-[11px] font-bold", ins.status === 'active' ? "text-red-500" : "text-indigo-600")}>
                          {ins.status === 'active' ? 'Suspendre' : 'Activer'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="p-10 items-center">
                <HeartPulse size={32} color="#CBD5E1" />
                <Text className="text-slate-400 text-xs mt-2">Aucun résultat</Text>
              </View>
            )}
          </Card>
        </View>
        <View className="h-24" />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#F3F6F9]">
      <View className="p-4 space-y-5">
        <TouchableOpacity onPress={() => setActiveTab("insurances")} className="flex-row items-center gap-2">
          <ArrowLeft size={16} color="#64748b" />
          <Text className="text-slate-500 font-bold">Retour</Text>
        </TouchableOpacity>

        <View>
          <Text className="text-2xl font-black text-[#061438]">Affiliation</Text>
          <Text className="text-sm text-slate-500 mt-1">Ajouter un employé à la couverture.</Text>
        </View>

        <Card className="p-5 space-y-4">
          <View>
            <Label>Nom complet</Label>
            <Input value={employeeName} onChangeText={setEmployeeName} placeholder="Nom de l'employé" />
          </View>
          <View>
            <Label>Poste</Label>
            <Input value={role} onChangeText={setRole} placeholder="ex: Analyste financier" />
          </View>
          <View>
            <Label>Formule</Label>
            <CompactSelect 
              value={coverageType} 
              onChange={setCoverageType}
              options={[
                { label: "Basic (250 MAD)", value: "basic" },
                { label: "Premium (450 MAD)", value: "premium" },
                { label: "Executive (850 MAD)", value: "executive" }
              ]}
            />
          </View>

          <View className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex-row gap-3">
            <AlertCircle size={18} color="#4F46E5" />
            <Text className="flex-1 text-[11px] text-indigo-700 leading-4">
              La prime sera prélevée automatiquement sur votre solde global le 1er de chaque mois.
            </Text>
          </View>

          <Button className="h-14 mt-4" onPress={handleAddEmployee} disabled={isSubmitting || !employeeName || !role}>
            {isSubmitting ? <ActivityIndicator color="white" /> : <><ShieldCheck size={18} color="white" /><Text>Confirmer l'affiliation</Text></>}
          </Button>
        </Card>
      </View>
    </ScrollView>
  );
}