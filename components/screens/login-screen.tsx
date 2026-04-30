import React, { useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail, ShieldCheck, Sparkles, Loader2 } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveProfile, useAppStore } from "@/store/app-store";

const loginSchema = z.object({
  email: z.string().email("Entrez un email d'entreprise valide."),
  password: z.string().min(4, "Le code d'accès est requis.")
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const login = useAppStore((state) => state.login);
  const fastLogin = useAppStore((state) => state.fastLogin);
  const loginError = useAppStore((state) => state.loginError);
  const profiles = useAppStore((state) => state.profiles);
  const activeProfile = useActiveProfile();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    if (!activeProfile) return;
    setValue("email", activeProfile.email);
  }, [activeProfile, setValue]);

  const onSubmit = (values: LoginValues) => {
    login(values);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F3F6F9]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, padding: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 rounded-3xl bg-white overflow-hidden shadow-sm">
            
            {/* EN-TÊTE PREMIUM (Bleu Nuit) */}
            <View className="bg-[#061438] p-6 pb-8 relative overflow-hidden">
              <View className="flex-row items-start justify-between mb-6">
                <Image 
                  source={require("@/assets/logo-dark.png")} 
                  style={{ width: 160, height: 45 }} 
                  resizeMode="contain" 
                />
                <View className="rounded-full border border-white/20 bg-white/10 p-2">
                  <Sparkles size={16} color="#ffffff" />
                </View>
              </View>

              <Text className="text-white/80 text-[13px] leading-5 mb-6">
                Espace bancaire premium pour les équipes juridiques et financières. Utilisez un compte de démonstration ou connectez-vous avec des identifiants d'entreprise factices.
              </Text>

              {/* Cartes des profils démo (Empilées sur mobile) */}
              <View className="flex-col gap-3">
                {profiles.slice(0, 2).map((p, idx) => (
                  <View key={p.id} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <Text className="text-[10px] uppercase tracking-[0.15em] text-white/70 mb-1">
                      Profil {idx + 1}
                    </Text>
                    <Text className="text-[16px] font-bold text-white">
                      {p.firstName}
                    </Text>
                    <Text className="text-[12px] text-white/70 mb-2">
                      {p.companyName} · {p.cards[0]?.name || "Carte Pro"}
                    </Text>
                    <Text className="text-[20px] font-black text-white">
                      Trésorerie {p.currency}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* SECTION CONNEXION */}
            <View className="p-6 pt-8 bg-white flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#718696] mb-1">
                Accès sécurisé
              </Text>
              <Text className="text-2xl font-black text-[#061438] mb-2">
                Connexion à Fintech
              </Text>
              <Text className="text-[13px] text-[#718696] mb-8">
                Utilisez vos identifiants ou accédez directement à un profil via les raccourcis ci-dessous.
              </Text>

              {/* FORMULAIRE */}
              <View className="space-y-4 mb-6">
                
                {/* Champ Email via Controller */}
                <View className="mb-4">
                  <Label>Email d'entreprise</Label>
                  <View className="relative justify-center">
                    <View className="absolute left-4 z-10">
                      <Mail size={16} color="#9CA3AF" />
                    </View>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input 
                          placeholder="nom@entreprise.com" 
                          keyboardType="email-address"
                          autoCapitalize="none"
                          className="pl-12"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      )}
                    />
                  </View>
                  {errors.email && <Text className="mt-1 text-[12px] font-medium text-rose-600">{errors.email.message}</Text>}
                </View>

                {/* Champ Mot de passe via Controller */}
                <View className="mb-6">
                  <Label>Code d'accès</Label>
                  <View className="relative justify-center">
                    <View className="absolute left-4 z-10">
                      <LockKeyhole size={16} color="#9CA3AF" />
                    </View>
                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input 
                          placeholder="••••••••" 
                          secureTextEntry
                          className="pl-12"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      )}
                    />
                  </View>
                  {errors.password && <Text className="mt-1 text-[12px] font-medium text-rose-600">{errors.password.message}</Text>}
                </View>

                {/* Message d'erreur */}
                {loginError && (
                  <View className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 mb-4">
                    <Text className="text-[12px] font-bold text-rose-700">{loginError}</Text>
                  </View>
                )}

                {/* Bouton Submit */}
                <Button 
                  onPress={handleSubmit(onSubmit)} 
                  disabled={isSubmitting}
                  className="w-full bg-[#1D4ED8]" // Using a strong indigo/blue instead of gradient
                >
                  {isSubmitting ? <Loader2 size={18} color="#fff" /> : <ShieldCheck size={18} color="#fff" />}
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>
              </View>

              {/* RACCOURCIS DE DÉMO */}
              <View className="pt-4 border-t border-slate-100">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center mb-4">
                  Connexion rapide (Démo)
                </Text>
                
                <View className="flex-col gap-3">
                  {profiles.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.7}
                      onPress={() => fastLogin(p.id)}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <Text className="text-[14px] font-bold text-[#061438]">
                        {p.firstName} <Text className="text-slate-500 font-medium">({p.companyName})</Text>
                      </Text>
                      <Text className="mt-1 text-[12px] font-medium text-slate-500">
                        {p.cards[0]?.name} · {p.currency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}