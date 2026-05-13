import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Mail, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react-native";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useActiveProfile, useAppStore } from "../../store/app-store";

const logoDark = require("../../assets/logos/logo-dark.png");

export function LoginScreen() {
  const login = useAppStore((state) => state.login);
  const fastLogin = useAppStore((state) => state.fastLogin);
  const loginError = useAppStore((state) => state.loginError);
  const profiles = useAppStore((state) => state.profiles);
  const activeProfile = useActiveProfile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (activeProfile) setEmail(activeProfile.email);
  }, [activeProfile]);

  const validate = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Entrez un email d'entreprise valide.");
      valid = false;
    }
    if (!password || password.length < 4) {
      setPasswordError("Le code d'accès est requis.");
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch {
      // toast handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-slate-100"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-slate-900 px-5 pt-14 pb-8 rounded-b-3xl">
          <View className="flex-row items-start justify-between mb-6">
            <Image source={logoDark} style={{ width: 160, height: 48, resizeMode: "contain" }} />
            <View className="rounded-full border border-white/10 bg-white/10 p-3">
              <Sparkles size={16} color="#FFFFFF" />
            </View>
          </View>
          <Text className="text-white text-sm leading-relaxed opacity-80">
            Espace bancaire premium pour les équipes juridiques et financières.
          </Text>
        </View>

        <View className="px-5 py-6">
          <Card className="p-5">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Accès sécurisé
            </Text>
            <Text className="mt-1 text-2xl font-black text-slate-900">Connexion à Fintech</Text>
            <Text className="mt-2 text-sm text-slate-500 leading-relaxed">
              Utilisez vos identifiants ou accédez directement à un profil via les raccourcis ci-dessous.
            </Text>

            <View className="mt-6">
              <Label>Email d'entreprise</Label>
              <View className="relative mt-1">
                <View
                  pointerEvents="none"
                  style={{ position: "absolute", left: 14, top: 0, bottom: 0, justifyContent: "center", zIndex: 1 }}
                >
                  <Mail size={16} color="#94A3B8" />
                </View>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nom@entreprise.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="pl-10"
                />
              </View>
              {!!emailError && <Text className="mt-1 text-xs font-bold text-rose-600">{emailError}</Text>}
            </View>

            <View className="mt-4">
              <Label>Code d'accès</Label>
              <View className="relative mt-1">
                <View
                  pointerEvents="none"
                  style={{ position: "absolute", left: 14, top: 0, bottom: 0, justifyContent: "center", zIndex: 1 }}
                >
                  <LockKeyhole size={16} color="#94A3B8" />
                </View>
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  className="pl-10"
                />
              </View>
              {!!passwordError && <Text className="mt-1 text-xs font-bold text-rose-600">{passwordError}</Text>}
            </View>

            {!!loginError && (
              <View className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                <Text className="text-xs font-bold text-rose-700">{loginError}</Text>
              </View>
            )}

            <Button
              className="mt-5 h-12 bg-indigo-600"
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              <ShieldCheck size={16} color="#FFFFFF" />
              <Text className="text-white text-sm font-bold">
                {isSubmitting ? "Connexion..." : "Se connecter"}
              </Text>
            </Button>
          </Card>

          <View className="mt-6">
            <View className="flex-row items-center mb-4">
              <View className="flex-1 h-px bg-slate-200" />
              <Text className="mx-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Connexion rapide (Démo)
              </Text>
              <View className="flex-1 h-px bg-slate-200" />
            </View>

            <View className="gap-2">
              {profiles.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.7}
                  onPress={() => fastLogin(p.id)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <Text className="text-sm font-bold text-slate-900">
                    {p.firstName}{" "}
                    <Text className="font-medium text-slate-500">({p.companyName})</Text>
                  </Text>
                  <Text className="mt-0.5 text-[11px] font-medium text-slate-500">
                    {p.cards[0]?.name} · {p.currency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
