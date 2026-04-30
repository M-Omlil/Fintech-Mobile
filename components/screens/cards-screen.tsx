import React, { useState, useMemo, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  Platform 
} from "react-native";
import { 
  CreditCard, 
  Plus, 
  ArrowLeft, 
  Loader2, 
  ShieldAlert, 
  Snowflake, 
  Settings2,
  Nfc,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Edit3,
  History
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CompactSelect } from "@/components/ui/compact-select";
import { useActiveProfile, useAppStore } from "@/store/app-store";
import { VisaLogo, MastercardLogo, AmexLogo } from "@/components/ui/network-logos";
import { cn } from "@/lib/utils";

export function CardsScreen({ view }: { view: "list" | "create" }) {
  const profile = useActiveProfile();
  const { setActiveTab, addCard, showToast } = useAppStore();

  const [cardName, setCardName] = useState("");
  const [cardholder, setCardholder] = useState("");
  const [network, setNetwork] = useState("VISA");
  const [limit, setLimit] = useState("20000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Modals
  const [detailedCard, setDetailedCard] = useState<any | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [editingLimitCard, setEditingLimitCard] = useState<any | null>(null);
  const [newLimitValue, setNewLimitValue] = useState("");

  const cards = profile?.cards || [];

  const getNetworkLogo = (network: string) => {
    const n = network.toLowerCase();
    if (n.includes("visa")) return <VisaLogo style={{ height: 30, width: 60 }} />;
    if (n.includes("mastercard")) return <MastercardLogo style={{ height: 30, width: 50 }} />;
    if (n.includes("amex")) return <AmexLogo style={{ height: 30, width: 60 }} />;
    return <Text className="text-white font-bold">{network}</Text>;
  };

  const handleCreate = () => {
    if (!cardName || !cardholder) return;
    setIsSubmitting(true);
    setTimeout(() => {
      addCard?.({
        id: `card-${Date.now()}`,
        name: cardName,
        cardholder,
        network,
        maskedPan: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
        expiry: "12/28",
        limit: Number(limit),
        spent: 0,
        status: "active"
      });
      showToast({ title: "Succès", description: "Carte activée", variant: "success" });
      setIsSubmitting(false);
      setActiveTab("cards");
    }, 1200);
  };

  if (!profile) return null;

  if (view === "list") {
    return (
      <ScrollView className="flex-1 bg-[#F3F6F9]" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-black text-[#061438]">Mes Cartes</Text>
              <Text className="text-sm text-slate-500">Physiques et virtuelles</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setActiveTab("cards-create")}
              className="bg-indigo-600 p-3 rounded-xl shadow-sm"
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* HORIZONTAL CARDS DISPLAY */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-2">
            {cards.map((card) => (
              <TouchableOpacity 
                key={card.id} 
                onPress={() => setDetailedCard(card)}
                activeOpacity={0.9}
                className="mr-4"
              >
                <View 
                  className={cn(
                    "w-80 h-48 rounded-3xl p-6 justify-between overflow-hidden shadow-lg",
                    card.network.includes("VISA") ? "bg-blue-800" : "bg-slate-900"
                  )}
                >
                  <View className="flex-row justify-between items-start">
                    <Nfc size={28} color="white" style={{ opacity: 0.6, transform: [{ rotate: '90deg' }] }} />
                    {getNetworkLogo(card.network)}
                  </View>
                  <View>
                    <Text className="text-white text-xl font-mono tracking-widest mb-4">{card.maskedPan}</Text>
                    <View className="flex-row justify-between items-end">
                      <View>
                        <Text className="text-white/50 text-[8px] uppercase">Titulaire</Text>
                        <Text className="text-white font-bold text-sm uppercase">{card.cardholder}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-white/50 text-[8px] uppercase">Expire</Text>
                        <Text className="text-white font-bold text-sm">{card.expiry}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* LIMITS AND SETTINGS LIST */}
          <View className="space-y-4">
            <Text className="text-sm font-bold text-slate-900 ml-1">Gestion des plafonds</Text>
            {cards.map(card => (
              <Card key={card.id} className="p-4 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-[#061438]">{card.name}</Text>
                  <Text className="text-[11px] text-slate-400">Plafond: {card.limit.toLocaleString()} MAD</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => { setEditingLimitCard(card); setNewLimitValue(card.limit.toString()); }}
                  className="bg-slate-50 p-2 rounded-lg border border-slate-100"
                >
                  <Settings2 size={18} color="#6366f1" />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        </View>

        {/* MODAL: CARD DETAILS */}
        <Modal visible={!!detailedCard} animationType="slide" transparent>
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-[40px] p-6 pb-12 space-y-6">
              <View className="flex-row justify-center mb-2">
                <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-xl font-black text-slate-900">Détails de sécurité</Text>
                <TouchableOpacity onPress={() => setDetailedCard(null)}><X color="#000" /></TouchableOpacity>
              </View>

              <View className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex-row justify-between items-center">
                <View>
                  <Text className="text-[10px] font-bold text-slate-400 uppercase">Code PIN</Text>
                  <Text className="text-2xl font-mono font-black tracking-widest text-indigo-600">
                    {showPin ? "1234" : "••••"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowPin(!showPin)} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                  {showPin ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
                </TouchableOpacity>
              </View>

              <Button variant="outline" className="h-14">
                <RefreshCw size={18} color="#6366f1" style={{ marginRight: 8 }} />
                <Text>Réinitialiser le PIN</Text>
              </Button>
              <Button variant="secondary" className="h-14 bg-red-50" onPress={() => setDetailedCard(null)}>
                <Snowflake size={18} color="#ef4444" style={{ marginRight: 8 }} />
                <Text className="text-red-600">Bloquer la carte</Text>
              </Button>
            </View>
          </View>
        </Modal>
        <View className="h-24" />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#F3F6F9]">
      <View className="p-4 space-y-6">
        <TouchableOpacity onPress={() => setActiveTab("cards")} className="flex-row items-center gap-2">
          <ArrowLeft size={16} color="#64748b" />
          <Text className="text-slate-500 font-bold">Retour</Text>
        </TouchableOpacity>

        <View>
          <Text className="text-2xl font-black text-[#061438]">Commander</Text>
          <Text className="text-sm text-slate-500">Nouvelle carte virtuelle instantanée</Text>
        </View>

        <Card className="p-6 space-y-4">
          <View>
            <Label>Nom de la carte (Usage)</Label>
            <Input value={cardName} onChangeText={setCardName} placeholder="ex: Marketing Facebook" />
          </View>
          <View>
            <Label>Nom sur la carte</Label>
            <Input value={cardholder} onChangeText={setCardholder} placeholder="NOM COMPLET" />
          </View>
          <View>
            <Label>Réseau</Label>
            <CompactSelect 
              value={network} 
              onChange={setNetwork}
              options={[
                { label: "VISA Corporate", value: "VISA" },
                { label: "Mastercard Business", value: "Mastercard" }
              ]}
            />
          </View>
          <View>
            <Label>Plafond mensuel (MAD)</Label>
            <Input value={limit} onChangeText={setLimit} keyboardType="numeric" />
          </View>

          <View className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex-row gap-3">
            <ShieldAlert size={18} color="#1d4ed8" />
            <Text className="flex-1 text-[11px] text-blue-700 leading-4">
              La carte virtuelle est générée immédiatement et prête pour les paiements en ligne.
            </Text>
          </View>

          <Button className="h-14 mt-4" onPress={handleCreate} disabled={isSubmitting || !cardName}>
            {isSubmitting ? <ActivityIndicator color="white" /> : <><CreditCard size={18} color="white" /><Text>Activer ma carte</Text></>}
          </Button>
        </Card>
      </View>
    </ScrollView>
  );
}