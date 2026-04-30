import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { 
  BadgeDollarSign, 
  Building2, 
  LogOut, 
  ShieldCheck, 
  UserRound, 
  MapPin, 
  Fingerprint, 
  FileText,
  ChevronRight 
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveProfile, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function ProfileScreen() {
  const profile = useActiveProfile();
  const { logout, setActiveTab } = useAppStore();

  if (!profile) return null;

  return (
    <ScrollView 
      className="flex-1 bg-[#F3F6F9]" 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View className="p-4 space-y-5">
        
        {/* HEADER */}
        <View className="mb-2">
          <Text className="text-2xl font-black text-[#061438]">Mon Profil</Text>
          <Text className="text-sm text-slate-500 mt-1">Paramètres du compte d'entreprise.</Text>
        </View>

        {/* CARTE D'IDENTITÉ */}
        <Card className="p-6">
          <View className="flex-row items-center gap-4 mb-8">
            <View className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1D4ED8] shadow-sm">
              <Text className="text-2xl font-black text-white">{profile.firstName[0]}</Text>
            </View>
            <View>
              <Text className="text-xl font-black text-[#061438]">{profile.firstName} {profile.displayName}</Text>
              <Text className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest mt-1">{profile.role}</Text>
            </View>
          </View>

          <View className="space-y-4">
            {/* Infos Entreprise */}
            <View className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Building2 size={14} color="#4F46E5" />
                <Text className="text-[10px] font-bold uppercase tracking-widest text-[#4F46E5]">Entreprise</Text>
              </View>
              <Text className="text-[15px] font-black text-[#061438] mb-1">{profile.companyName}</Text>
              <View className="flex-row items-start gap-2 mb-2">
                <Fingerprint size={14} color="#94A3B8" />
                <Text className="text-[12px] font-medium text-slate-500">ICE: {profile.companyICE}</Text>
              </View>
              <View className="flex-row items-start gap-2">
                <MapPin size={14} color="#94A3B8" />
                <Text className="text-[12px] font-medium text-slate-500 leading-4 flex-1">
                  {profile.companyAddress}
                </Text>
              </View>
            </View>
            
            {/* Infos Bancaires */}
            <View className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <BadgeDollarSign size={14} color="#4F46E5" />
                <Text className="text-[10px] font-bold uppercase tracking-widest text-[#4F46E5]">Compte Principal</Text>
              </View>
              <Text className="text-[15px] font-black text-[#061438] mb-2">Compte Courant {profile.currency}</Text>
              <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">IBAN</Text>
              <Text className="font-mono text-[11px] font-bold text-slate-700 bg-white/50 p-2 rounded-lg border border-slate-100">
                {profile.accountIBAN}
              </Text>
            </View>
          </View>
        </Card>

        {/* SÉCURITÉ */}
        <Card className="p-5 flex-row items-center gap-4">
          <View className="h-10 w-10 rounded-full bg-green-50 items-center justify-center">
            <ShieldCheck size={20} color="#16A34A" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#061438]">Sécurité du compte</Text>
            <Text className="text-[11px] text-slate-500 mt-0.5">Authentification 2FA activée</Text>
          </View>
          <ChevronRight size={16} color="#CBD5E1" />
        </Card>

        {/* ACTIONS RAPIDES */}
        <View className="space-y-3">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Options de gestion</Text>
          
          <TouchableOpacity 
            onPress={() => setActiveTab("documents")}
            activeOpacity={0.7}
            className="flex-row items-center bg-white border border-slate-100 p-4 rounded-2xl"
          >
            <View className="h-9 w-9 rounded-xl bg-indigo-50 items-center justify-center mr-3">
              <FileText size={18} color="#4F46E5" />
            </View>
            <Text className="flex-1 text-[14px] font-bold text-[#061438]">Mes documents</Text>
            <ChevronRight size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7}
            className="flex-row items-center bg-white border border-slate-100 p-4 rounded-2xl"
          >
            <View className="h-9 w-9 rounded-xl bg-slate-50 items-center justify-center mr-3">
              <UserRound size={18} color="#64748B" />
            </View>
            <Text className="flex-1 text-[14px] font-bold text-[#061438]">Gérer les accès équipe</Text>
            <ChevronRight size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View className="pt-4 mt-2">
            <Button 
              variant="ghost" 
              className="bg-red-50 border border-red-100 h-14" 
              onPress={logout}
            >
              <LogOut size={18} color="#DC2626" />
              <Text className="text-red-600 font-bold ml-2">Déconnexion</Text>
            </Button>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}