import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  BadgeDollarSign,
  Building2,
  LogOut,
  ShieldCheck,
  UserRound,
  MapPin,
  Fingerprint,
  FileText,
} from "lucide-react-native";
import { useActiveProfile, useAppStore } from "../../store/app-store";

export function ProfileScreen() {
  const profile = useActiveProfile();
  const logout = useAppStore((s) => s.logout);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  if (!profile) return null;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="px-4 pt-4">
        <View className="mb-4">
          <Text className="text-xl font-black text-slate-900">Mon Profil</Text>
          <Text className="text-sm text-slate-500 mt-1">
            Aperçu et paramètres du compte d'entreprise.
          </Text>
        </View>

        <Card className="p-5 mb-3">
          <View className="flex-row items-center gap-3 mb-5">
            <View className="h-16 w-16 rounded-2xl bg-indigo-600 items-center justify-center">
              <Text className="text-2xl font-black text-white">{profile.firstName[0]}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-black text-slate-900">
                {profile.firstName} {profile.displayName}
              </Text>
              <Text className="text-sm font-bold text-indigo-600 uppercase tracking-wider mt-0.5">
                {profile.role}
              </Text>
            </View>
          </View>

          <View className="rounded-2xl border border-slate-100 bg-slate-50 p-4 mb-3">
            <View className="flex-row items-center gap-2 mb-2">
              <Building2 size={14} color="#4338CA" />
              <Text className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                Entreprise
              </Text>
            </View>
            <Text className="text-sm font-black text-slate-900">{profile.companyName}</Text>
            <View className="flex-row items-start gap-1.5 mt-2">
              <Fingerprint size={12} color="#64748B" style={{ marginTop: 2 }} />
              <Text className="text-xs font-medium text-slate-500 flex-1">
                ICE: {profile.companyICE}
              </Text>
            </View>
            <View className="flex-row items-start gap-1.5 mt-1">
              <MapPin size={12} color="#64748B" style={{ marginTop: 2 }} />
              <Text className="text-xs font-medium text-slate-500 flex-1" numberOfLines={2}>
                {profile.companyAddress}
              </Text>
            </View>
          </View>

          <View className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <BadgeDollarSign size={14} color="#4338CA" />
              <Text className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                Compte Principal
              </Text>
            </View>
            <Text className="text-sm font-black text-slate-900">
              Compte Courant {profile.currency}
            </Text>
            <Text className="text-xs font-medium text-slate-500 mt-2">IBAN:</Text>
            <Text className="text-xs font-mono font-bold text-slate-700 mt-0.5">
              {profile.accountIBAN}
            </Text>
          </View>
        </Card>

        <Card className="p-5 mb-3">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="h-8 w-8 rounded-full bg-green-50 items-center justify-center">
              <ShieldCheck size={16} color="#16A34A" />
            </View>
            <Text className="text-sm font-bold text-slate-900">Sécurité du compte</Text>
          </View>
          <Text className="text-xs font-medium text-slate-500 leading-relaxed">
            L'authentification à deux facteurs (2FA) est activée. Votre coffre-fort de documents est
            protégé et toutes les actions sont journalisées.
          </Text>
        </Card>

        <Card className="p-5 mb-3">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="h-8 w-8 rounded-full bg-indigo-50 items-center justify-center">
              <UserRound size={16} color="#4338CA" />
            </View>
            <Text className="text-sm font-bold text-slate-900">Actions rapides</Text>
          </View>

          <Button
            variant="outline"
            className="mb-2 h-11 justify-start"
            onPress={() => setActiveTab("documents")}
          >
            <FileText size={16} color="#4338CA" />
            <Text className="text-sm font-bold text-indigo-600">Mes documents</Text>
          </Button>

          <Button variant="outline" className="mb-2 h-11 justify-start">
            <Text className="text-sm font-bold text-slate-700">Gérer les accès équipe</Text>
          </Button>

          <Button variant="outline" className="mb-2 h-11 justify-start">
            <Text className="text-sm font-bold text-slate-700">Préférences d'affichage</Text>
          </Button>

          <View className="border-t border-slate-100 pt-3 mt-1">
            <Button variant="ghost" className="h-11 justify-start" onPress={logout}>
              <LogOut size={16} color="#DC2626" />
              <Text className="text-sm font-bold text-red-600">Déconnexion</Text>
            </Button>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
