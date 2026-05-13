import "./global.css";
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppLayout } from "./components/Layout";
import { useAppStore } from "./store/app-store";

function HydrationSplash({ error }: { error: string | null }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <View className="h-16 w-16 rounded-2xl bg-indigo-600 items-center justify-center mb-4">
        <Text className="text-white font-black text-2xl">F</Text>
      </View>
      <Text className="text-slate-900 font-black text-base mb-2">Fintech by MyLegal</Text>
      {error ? (
        <Text className="text-rose-600 text-xs font-bold px-8 text-center">{error}</Text>
      ) : (
        <>
          <ActivityIndicator color="#4338CA" />
          <Text className="text-slate-500 text-xs font-medium mt-2">Préparation de la base locale…</Text>
        </>
      )}
    </View>
  );
}

export default function App() {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate().catch((e) => {
      const message = e instanceof Error ? e.message : "Erreur d'initialisation de la base.";
      setError(message);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {isHydrated ? <AppLayout /> : <HydrationSplash error={error} />}
    </SafeAreaProvider>
  );
}
