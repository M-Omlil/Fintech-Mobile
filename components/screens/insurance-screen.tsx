import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ShieldCheck, Users, Search, Plus, ArrowLeft, HeartPulse, AlertCircle } from "lucide-react-native";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { CompactSelect } from "../ui/compact-select";
import { useActiveProfile, useAppStore } from "../../store/app-store";
import type { InsuranceCoverage } from "../../services/mock-data";
import { cn } from "../../lib/utils";

export function InsuranceScreen({ view }: { view: "list" | "create" }) {
  const profile = useActiveProfile();
  const toggleInsuranceStatus = useAppStore((s) => s.toggleInsuranceStatus);
  const addInsurance = useAppStore((s) => s.addInsurance);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const [searchQuery, setSearchQuery] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [role, setRole] = useState("");
  const [coverageType, setCoverageType] = useState<InsuranceCoverage>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const insurances = (profile as any)?.employeeInsurances || [];

  const filteredInsurances = useMemo(() => {
    if (!searchQuery) return insurances;
    return insurances.filter(
      (ins: any) =>
        ins.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ins.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [insurances, searchQuery]);

  const activeCount = useMemo(() => insurances.filter((i: any) => i.status === "active").length, [insurances]);
  const totalMonthlyPremium = useMemo(
    () => insurances.filter((i: any) => i.status === "active").reduce((sum: number, i: any) => sum + i.premium, 0),
    [insurances]
  );

  const handleAddEmployee = () => {
    if (!employeeName || !role) return;
    setIsSubmitting(true);
    setTimeout(async () => {
      const premium = coverageType === "basic" ? 250 : coverageType === "premium" ? 450 : 850;
      await addInsurance({
        employeeName,
        role,
        coverageType,
        premium,
        status: "active",
        startDate: new Date().toISOString(),
      });
      setEmployeeName("");
      setRole("");
      setCoverageType("basic");
      setIsSubmitting(false);
      setActiveTab("insurances");
    }, 600);
  };

  if (!profile) return null;

  const getCoverageBadgeStyle = (type: string) => {
    if (type === "executive") return { bg: "bg-purple-100", text: "text-purple-700", label: "Executive" };
    if (type === "premium") return { bg: "bg-blue-100", text: "text-blue-700", label: "Premium" };
    return { bg: "bg-slate-100", text: "text-slate-700", label: "Basic" };
  };

  const getStatusStyle = (status: string) => {
    if (status === "active") return { bg: "bg-green-50", text: "text-green-600", label: "Couvert", border: "border-green-200" };
    if (status === "pending") return { bg: "bg-orange-50", text: "text-orange-600", label: "En attente", border: "border-orange-200" };
    return { bg: "bg-red-50", text: "text-red-600", label: "Suspendu", border: "border-red-200" };
  };

  if (view === "list") {
    return (
      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="px-4 pt-4">
          <View className="mb-4">
            <Text className="text-xl font-black text-slate-900">Assurance Santé</Text>
            <Text className="text-sm text-slate-500 mt-1">
              Gérez la mutuelle et les affiliations de vos employés.
            </Text>
          </View>

          <Button className="mb-4 h-11 bg-indigo-600" onPress={() => setActiveTab("insurances-create")}>
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-white text-sm font-bold">Affilier un employé</Text>
          </Button>

          <View className="gap-3 mb-4">
            <Card className="p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="h-8 w-8 rounded-full bg-indigo-50 items-center justify-center">
                  <Users size={16} color="#4338CA" />
                </View>
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Employés couverts
                </Text>
              </View>
              <Text className="text-2xl font-black text-slate-900">
                {activeCount} <Text className="text-sm text-slate-400">/ {insurances.length}</Text>
              </Text>
            </Card>
            <Card className="p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="h-8 w-8 rounded-full bg-green-50 items-center justify-center">
                  <ShieldCheck size={16} color="#16A34A" />
                </View>
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Prime mensuelle
                </Text>
              </View>
              <Text className="text-2xl font-black text-slate-900">
                {totalMonthlyPremium.toLocaleString("fr-MA")}{" "}
                <Text className="text-sm text-slate-400">{profile.currency}</Text>
              </Text>
            </Card>
          </View>

          <Card className="p-0 overflow-hidden">
            <View className="p-4 border-b border-slate-100">
              <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3 h-11">
                <Search size={16} color="#94A3B8" />
                <TextInput
                  placeholder="Rechercher un employé..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-2 text-sm text-slate-900"
                />
              </View>
            </View>

            {filteredInsurances.length > 0 ? (
              filteredInsurances.map((ins: any) => {
                const cv = getCoverageBadgeStyle(ins.coverageType);
                const st = getStatusStyle(ins.status);
                return (
                  <View key={ins.id} className="p-4 border-b border-slate-100">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="h-11 w-11 rounded-full bg-indigo-100 items-center justify-center">
                        <Text className="text-lg font-black text-indigo-700">
                          {ins.employeeName.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-bold text-slate-900 flex-shrink" numberOfLines={1}>
                            {ins.employeeName}
                          </Text>
                          <View className={cn("px-2 py-0.5 rounded-full border", st.bg, st.border)}>
                            <Text className={cn("text-[10px] font-bold uppercase", st.text)}>
                              {st.label}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs font-medium text-slate-500 mt-0.5">{ins.role}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View>
                        <View className={cn("px-2 py-0.5 rounded-md self-start mb-1", cv.bg)}>
                          <Text className={cn("text-[10px] font-bold uppercase", cv.text)}>
                            {cv.label}
                          </Text>
                        </View>
                        <Text className="text-xs font-bold text-slate-900">
                          {ins.premium} {profile.currency}{" "}
                          <Text className="text-[10px] text-slate-400 font-medium">/ mois</Text>
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleInsuranceStatus(ins.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl border-2",
                          ins.status === "active" ? "border-red-100" : "border-green-100"
                        )}
                      >
                        <Text
                          className={cn(
                            "text-xs font-bold",
                            ins.status === "active" ? "text-red-600" : "text-green-600"
                          )}
                        >
                          {ins.status === "active" ? "Suspendre" : "Activer"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="items-center py-10">
                <HeartPulse size={32} color="#CBD5E1" />
                <Text className="text-sm font-medium text-slate-500 mt-2">
                  Aucun employé trouvé.
                </Text>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="px-4 pt-4">
          <TouchableOpacity
            onPress={() => setActiveTab("insurances")}
            className="flex-row items-center mb-3"
          >
            <ArrowLeft size={16} color="#64748B" />
            <Text className="ml-1.5 text-sm font-bold text-slate-500">Retour</Text>
          </TouchableOpacity>

          <View className="mb-4">
            <Text className="text-xl font-black text-slate-900">Nouvelle affiliation</Text>
            <Text className="text-sm text-slate-500 mt-1">
              Ajoutez un nouvel employé à votre couverture mutuelle.
            </Text>
          </View>

          <Card className="mb-3 p-5">
            <View className="mb-3">
              <Label>Nom complet de l'employé</Label>
              <Input
                placeholder="Ex: Ahmed Bennani"
                value={employeeName}
                onChangeText={setEmployeeName}
                className="mt-1"
              />
            </View>
            <View>
              <Label>Poste occupé</Label>
              <Input
                placeholder="Ex: Développeur Fullstack"
                value={role}
                onChangeText={setRole}
                className="mt-1"
              />
            </View>
          </Card>

          <Card className="mb-3 p-5">
            <View className="mb-3">
              <Label>Formule de couverture</Label>
              <View className="mt-1">
                <CompactSelect
                  value={coverageType}
                  onChange={(val) => setCoverageType(val as InsuranceCoverage)}
                  options={[
                    { label: "Formule Basic (250 MAD/mois)", value: "basic" },
                    { label: "Formule Premium (450 MAD/mois)", value: "premium" },
                    { label: "Formule Executive (850 MAD/mois)", value: "executive" },
                  ]}
                />
              </View>
            </View>
            <View className="rounded-xl bg-indigo-50 p-4 flex-row gap-3 border border-indigo-100">
              <AlertCircle size={18} color="#4338CA" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-indigo-900">Prélèvement automatique</Text>
                <Text className="text-xs font-medium text-indigo-700 mt-1 leading-relaxed">
                  La prime mensuelle sera prélevée le 1er de chaque mois.
                </Text>
              </View>
            </View>
          </Card>

          <Button
            className="h-12 bg-indigo-600 mt-2"
            onPress={handleAddEmployee}
            disabled={isSubmitting || !employeeName || !role}
            loading={isSubmitting}
          >
            <ShieldCheck size={18} color="#FFFFFF" />
            <Text className="text-white text-sm font-bold">
              {isSubmitting ? "Enregistrement..." : "Confirmer l'affiliation"}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
