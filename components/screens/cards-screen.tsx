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
import {
  CreditCard,
  Plus,
  ArrowLeft,
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
  Landmark,
  BadgeDollarSign,
  ArrowDownToLine,
  History,
} from "lucide-react-native";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { CompactSelect } from "../ui/compact-select";
import { useActiveProfile, useAppStore } from "../../store/app-store";
import { VisaLogo, MastercardLogo, AmexLogo } from "../ui/network-logos";
import { cn } from "../../lib/utils";

const getNetworkLogo = (network: string) => {
  const n = network.toLowerCase();
  if (n.includes("visa")) return <VisaLogo width={48} height={16} />;
  if (n.includes("mastercard")) return <MastercardLogo width={38} height={24} />;
  if (n.includes("amex") || n.includes("american")) return <AmexLogo width={48} height={16} />;
  return <Text className="text-white text-sm font-black tracking-widest">{network}</Text>;
};

const getCardBgClass = (network: string) => {
  const n = network.toLowerCase();
  if (n.includes("visa")) return "bg-blue-800";
  if (n.includes("mastercard")) return "bg-slate-900";
  if (n.includes("amex")) return "bg-emerald-800";
  return "bg-indigo-800";
};

const getIconForTransaction = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("virement") || t.includes("transfer") || t.includes("reçu")) return ArrowDownToLine;
  if (t.includes("fournisseur") || t.includes("supplier") || t.includes("achat") || t.includes("facture")) return Landmark;
  if (t.includes("salaire") || t.includes("salary") || t.includes("paie")) return BadgeDollarSign;
  return CreditCard;
};

export function CardsScreen({ view }: { view: "list" | "create" }) {
  const profile = useActiveProfile();
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const addCard = useAppStore((s) => s.addCard);
  const showToast = useAppStore((s) => s.showToast);

  const [cardName, setCardName] = useState("");
  const [cardholder, setCardholder] = useState("");
  const [network, setNetwork] = useState("VISA");
  const [limit, setLimit] = useState<number>(20000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [localCardStatuses, setLocalCardStatuses] = useState<Record<string, string>>({});
  const [localCardLimits, setLocalCardLimits] = useState<Record<string, number>>({});

  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [newLimitValue, setNewLimitValue] = useState<string>("");

  const [detailedCard, setDetailedCard] = useState<any | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [detailedCardName, setDetailedCardName] = useState("");

  useEffect(() => {
    if (profile) setCardholder(`${profile.firstName} ${profile.displayName}`);
  }, [profile]);

  const cards = profile?.cards || [];

  const cardTransactions = useMemo(() => {
    if (!profile) return [];
    return profile.transactions.filter((t) => t.kind === "debit").slice(0, 5);
  }, [profile]);

  const handleToggleStatus = (cardId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "frozen" : "active";
    setLocalCardStatuses((prev) => ({ ...prev, [cardId]: newStatus }));
    showToast({
      title: newStatus === "frozen" ? "Carte bloquée" : "Carte débloquée",
      description:
        newStatus === "frozen"
          ? "La carte a été temporairement suspendue."
          : "La carte est de nouveau active.",
      variant: newStatus === "frozen" ? "default" : "success",
    });
  };

  const handleSaveLimit = () => {
    if (!editingCard) return;
    const limitNum = Number(newLimitValue);
    if (limitNum <= 0) return;
    setLocalCardLimits((prev) => ({ ...prev, [editingCard.id]: limitNum }));
    showToast({
      title: "Plafond mis à jour",
      description: `Le nouveau plafond est ${limitNum.toLocaleString("fr-MA")} MAD.`,
      variant: "success",
    });
    setEditingCard(null);
  };

  const handleCreateCard = () => {
    if (!cardName.trim() || !cardholder.trim() || limit <= 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const newCard = {
        id: `card-${Date.now()}`,
        name: cardName,
        cardholder,
        network,
        maskedPan: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
        expiry: `12/${new Date().getFullYear() + 3 - 2000}`,
        limit: Number(limit),
        spent: 0,
        status: "active" as const,
      };
      addCard(newCard);
      setCardName("");
      setLimit(20000);
      setIsSubmitting(false);
      setActiveTab("cards");
    }, 800);
  };

  const handleResetPin = () => {
    showToast({
      title: "Demande envoyée",
      description: "Un nouveau code PIN vous sera envoyé par SMS.",
      variant: "default",
    });
  };

  const activeCount = useMemo(
    () => cards.filter((c) => (localCardStatuses[c.id] || c.status) === "active").length,
    [cards, localCardStatuses]
  );
  const totalSpent = useMemo(() => cards.reduce((sum, c) => sum + (c.spent || 0), 0), [cards]);
  const totalLimit = useMemo(
    () => cards.reduce((sum, c) => sum + (localCardLimits[c.id] || c.limit || 0), 0),
    [cards, localCardLimits]
  );

  if (!profile) return null;

  if (view === "list") {
    return (
      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pt-4">
          <View className="mb-4">
            <Text className="text-xl font-black text-slate-900">Cartes bancaires</Text>
            <Text className="text-sm text-slate-500 mt-1">
              Gérez vos cartes physiques et virtuelles d'entreprise.
            </Text>
          </View>

          <Button className="mb-4 h-11 bg-indigo-600" onPress={() => setActiveTab("cards-create")}>
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-white text-sm font-bold">Nouvelle carte</Text>
          </Button>

          <View className="gap-3 mb-4">
            <Card className="p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="h-8 w-8 rounded-full bg-indigo-50 items-center justify-center">
                  <CreditCard size={16} color="#4338CA" />
                </View>
                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Cartes actives
                </Text>
              </View>
              <Text className="text-2xl font-black text-slate-900">
                {activeCount} <Text className="text-sm text-slate-400">/ {cards.length}</Text>
              </Text>
            </Card>
            <Card className="p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="h-8 w-8 rounded-full bg-orange-50 items-center justify-center">
                  <ShieldAlert size={16} color="#EA580C" />
                </View>
                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Dépenses du mois
                </Text>
              </View>
              <Text className="text-2xl font-black text-slate-900">
                {totalSpent.toLocaleString("fr-MA")}{" "}
                <Text className="text-sm text-slate-400">{profile.currency}</Text>
              </Text>
            </Card>
            <Card className="p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="h-8 w-8 rounded-full bg-green-50 items-center justify-center">
                  <CheckCircle2 size={16} color="#16A34A" />
                </View>
                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Plafond global
                </Text>
              </View>
              <Text className="text-2xl font-black text-slate-900">
                {totalLimit.toLocaleString("fr-MA")}{" "}
                <Text className="text-sm text-slate-400">{profile.currency}</Text>
              </Text>
            </Card>
          </View>

          {cards.length > 0 ? (
            cards.map((card) => {
              const currentStatus = localCardStatuses[card.id] || card.status;
              const isFrozen = currentStatus === "frozen";
              const spent = card.spent || 0;
              const currentLimit = localCardLimits[card.id] || card.limit || 1;
              const progressPercentage = Math.min((spent / currentLimit) * 100, 100);

              return (
                <Card key={card.id} className="mb-4 overflow-hidden p-0">
                  <View className="p-5">
                    <View
                      className={cn(
                        "rounded-2xl p-5 h-44 justify-between overflow-hidden",
                        isFrozen ? "bg-slate-400" : getCardBgClass(card.network)
                      )}
                    >
                      <View className="flex-row items-start justify-between">
                        <Nfc size={22} color="#FFFFFF" style={{ opacity: 0.8, transform: [{ rotate: "90deg" }] }} />
                        <View>{getNetworkLogo(card.network)}</View>
                      </View>
                      <View>
                        <Text className="text-xl text-white font-mono tracking-widest mb-2">
                          {card.maskedPan}
                        </Text>
                        <View className="flex-row items-end justify-between">
                          <View>
                            <Text className="text-[9px] text-white/70 uppercase tracking-widest mb-0.5">
                              Titulaire
                            </Text>
                            <Text className="text-sm text-white font-bold tracking-wider uppercase" numberOfLines={1}>
                              {card.cardholder}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-[9px] text-white/70 uppercase tracking-widest mb-0.5 text-right">
                              Expire
                            </Text>
                            <Text className="text-sm text-white font-bold tracking-wider">
                              {card.expiry}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {isFrozen && (
                        <View
                          className="absolute inset-0 items-center justify-center bg-black/30"
                          pointerEvents="none"
                        >
                          <View className="bg-white px-3 py-1.5 rounded-full flex-row items-center">
                            <Snowflake size={14} color="#0F172A" />
                            <Text className="ml-2 text-xs font-black uppercase tracking-widest text-slate-900">
                              Bloquée
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="px-5 pb-5">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-slate-900">{card.name}</Text>
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {card.network} Business
                        </Text>
                      </View>
                      <View
                        className={cn(
                          "px-2 py-1 rounded-md",
                          isFrozen ? "bg-orange-50" : "bg-green-50"
                        )}
                      >
                        <Text
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
                            isFrozen ? "text-orange-600" : "text-green-600"
                          )}
                        >
                          {isFrozen ? "Suspendue" : "Active"}
                        </Text>
                      </View>
                    </View>

                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-bold text-slate-700">
                          {spent.toLocaleString("fr-MA")} {profile.currency}
                        </Text>
                        <Text className="text-xs font-medium text-slate-400">
                          / {currentLimit.toLocaleString("fr-MA")}
                        </Text>
                      </View>
                      <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <View
                          className={cn(
                            "h-full rounded-full",
                            progressPercentage > 85 ? "bg-red-500" : "bg-indigo-500"
                          )}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </View>
                    </View>

                    <View className="flex-row gap-2 mb-2">
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 h-10",
                          isFrozen ? "border-green-200" : "border-orange-200"
                        )}
                        onPress={() => handleToggleStatus(card.id, currentStatus)}
                      >
                        {isFrozen ? (
                          <CheckCircle2 size={14} color="#16A34A" />
                        ) : (
                          <Snowflake size={14} color="#EA580C" />
                        )}
                        <Text
                          className={cn(
                            "text-xs font-bold",
                            isFrozen ? "text-green-600" : "text-orange-600"
                          )}
                        >
                          {isFrozen ? "Débloquer" : "Bloquer"}
                        </Text>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-10"
                        onPress={() => {
                          setEditingCard(card);
                          setNewLimitValue((localCardLimits[card.id] || card.limit || 0).toString());
                        }}
                      >
                        <Settings2 size={14} color="#334155" />
                        <Text className="text-xs font-bold text-slate-700">Plafond</Text>
                      </Button>
                    </View>
                    <Button
                      variant="ghost"
                      className="h-10 bg-indigo-50"
                      onPress={() => {
                        setDetailedCard(card);
                        setDetailedCardName(card.name);
                        setShowPin(false);
                      }}
                    >
                      <Text className="text-xs font-bold text-indigo-700">
                        Voir détails & transactions
                      </Text>
                    </Button>
                  </View>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 items-center">
              <CreditCard size={32} color="#CBD5E1" />
              <Text className="text-sm font-medium text-slate-500 mt-2">Aucune carte trouvée.</Text>
            </Card>
          )}
        </View>

        {/* Edit limit modal */}
        <Modal visible={!!editingCard} transparent animationType="fade" onRequestClose={() => setEditingCard(null)}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <Pressable
              className="flex-1 items-center justify-center bg-black/40 px-4"
              onPress={() => setEditingCard(null)}
            >
              <Pressable className="w-full max-w-md">
                <Card className="p-5">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg font-black text-slate-900">Gérer le plafond</Text>
                    <TouchableOpacity
                      onPress={() => setEditingCard(null)}
                      className="p-1.5 rounded-full bg-slate-50"
                    >
                      <X size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-xs font-medium text-slate-500 mb-4">
                    Carte se terminant par {editingCard?.maskedPan?.split(" ")[1]}
                  </Text>
                  <View className="mb-4">
                    <Label>Nouveau plafond mensuel (MAD)</Label>
                    <Input
                      keyboardType="numeric"
                      value={newLimitValue}
                      onChangeText={setNewLimitValue}
                      className="text-lg font-bold mt-1"
                    />
                  </View>
                  <View className="flex-row gap-3">
                    <Button variant="secondary" className="flex-1" onPress={() => setEditingCard(null)}>
                      Annuler
                    </Button>
                    <Button className="flex-1 bg-indigo-600" onPress={handleSaveLimit}>
                      Sauvegarder
                    </Button>
                  </View>
                </Card>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        {/* Card detail modal */}
        <Modal
          visible={!!detailedCard}
          transparent
          animationType="slide"
          onRequestClose={() => setDetailedCard(null)}
        >
          <View className="flex-1 bg-slate-50">
            <View className="bg-white border-b border-slate-100 flex-row items-center justify-between px-4 py-4 pt-12">
              <Text className="text-lg font-black text-slate-900">Détails de la carte</Text>
              <TouchableOpacity
                onPress={() => setDetailedCard(null)}
                className="p-2 rounded-full bg-slate-50"
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            {detailedCard && (
              <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
                <View
                  className={cn(
                    "rounded-2xl p-5 h-48 justify-between overflow-hidden mb-5",
                    (localCardStatuses[detailedCard.id] || detailedCard.status) === "frozen"
                      ? "bg-slate-400"
                      : getCardBgClass(detailedCard.network)
                  )}
                >
                  <View className="flex-row items-start justify-between">
                    <Nfc size={28} color="#FFFFFF" style={{ opacity: 0.8, transform: [{ rotate: "90deg" }] }} />
                    <View>{getNetworkLogo(detailedCard.network)}</View>
                  </View>
                  <View>
                    <Text className="text-2xl text-white font-mono tracking-widest mb-2">
                      {detailedCard.maskedPan}
                    </Text>
                    <View className="flex-row items-end justify-between">
                      <View>
                        <Text className="text-[10px] text-white/70 uppercase tracking-widest mb-1">
                          Titulaire
                        </Text>
                        <Text className="text-sm text-white font-bold tracking-wider uppercase">
                          {detailedCard.cardholder}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-[10px] text-white/70 uppercase tracking-widest mb-1 text-right">
                          Expire
                        </Text>
                        <Text className="text-sm text-white font-bold tracking-wider">
                          {detailedCard.expiry}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Text className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                  Sécurité & Paramètres
                </Text>

                <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Code PIN
                    </Text>
                    <Text className="text-lg font-mono font-black text-slate-900 tracking-widest">
                      {showPin ? "1234" : "••••"}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setShowPin(!showPin)}
                      className="h-10 w-10 items-center justify-center bg-white border border-slate-200 rounded-xl"
                    >
                      {showPin ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleResetPin}
                      className="h-10 px-3 flex-row items-center bg-white border border-slate-200 rounded-xl"
                    >
                      <RefreshCw size={14} color="#334155" />
                      <Text className="ml-1.5 text-xs font-bold text-slate-700">Reset</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mb-5">
                  <Label>Nom de la carte (Usage)</Label>
                  <View className="flex-row gap-2 mt-1">
                    <Input
                      value={detailedCardName}
                      onChangeText={setDetailedCardName}
                      className="flex-1"
                    />
                    <Button
                      className="px-4 bg-indigo-600"
                      onPress={() =>
                        showToast({
                          title: "Informations mises à jour",
                          description: "Le nom de la carte a été modifié.",
                          variant: "success",
                        })
                      }
                    >
                      <Edit3 size={14} color="#FFFFFF" />
                      <Text className="text-white text-xs font-bold">Sauver</Text>
                    </Button>
                  </View>
                </View>

                <Text className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                  Dernières opérations
                </Text>
                {cardTransactions.length > 0 ? (
                  cardTransactions.map((tx) => {
                    const Icon = getIconForTransaction(tx.title);
                    return (
                      <View
                        key={tx.id}
                        className="flex-row items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white mb-2"
                      >
                        <View className="flex-row items-center flex-1 gap-3">
                          <View className="h-10 w-10 rounded-xl bg-slate-50 items-center justify-center">
                            <Icon size={18} color="#64748B" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-[13px] font-bold text-slate-900" numberOfLines={1}>
                              {tx.title}
                            </Text>
                            <Text className="text-[11px] font-medium text-slate-500 mt-0.5" numberOfLines={1}>
                              {tx.counterparty}
                            </Text>
                          </View>
                        </View>
                        <View>
                          <Text className="text-sm font-black text-slate-900 text-right">
                            -{tx.amount.toLocaleString("fr-MA")}
                          </Text>
                          <Text className="text-[10px] font-bold text-slate-400 text-right mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString("fr-MA", { day: "2-digit", month: "short" })}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View className="items-center py-8">
                    <History size={32} color="#CBD5E1" />
                    <Text className="text-sm font-medium text-slate-500 mt-2">
                      Aucune transaction avec cette carte.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // CREATE VIEW
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pt-4">
          <TouchableOpacity
            onPress={() => setActiveTab("cards")}
            className="flex-row items-center mb-3"
          >
            <ArrowLeft size={16} color="#64748B" />
            <Text className="ml-1.5 text-sm font-bold text-slate-500">Retour</Text>
          </TouchableOpacity>

          <View className="mb-4">
            <Text className="text-xl font-black text-slate-900">Nouvelle carte</Text>
            <Text className="text-sm text-slate-500 mt-1">
              Créez instantanément une nouvelle carte virtuelle.
            </Text>
          </View>

          <Card className="mb-3 p-5">
            <View className="mb-3">
              <Label>Nom de la carte (Usage)</Label>
              <Input
                placeholder="Ex: Frais de déplacement"
                value={cardName}
                onChangeText={setCardName}
                className="mt-1"
              />
            </View>
            <View>
              <Label>Nom du titulaire</Label>
              <Input
                placeholder="Ex: Ahmed Bennani"
                value={cardholder}
                onChangeText={setCardholder}
                className="mt-1"
              />
            </View>
          </Card>

          <Card className="mb-3 p-5">
            <View className="mb-3">
              <Label>Réseau</Label>
              <View className="mt-1">
                <CompactSelect
                  value={network}
                  onChange={setNetwork}
                  options={[
                    { label: "VISA Corporate", value: "VISA" },
                    { label: "Mastercard Business", value: "Mastercard" },
                    { label: "Amex Platinum", value: "Amex" },
                  ]}
                />
              </View>
            </View>
            <View className="mb-4">
              <Label>Plafond mensuel</Label>
              <Input
                keyboardType="numeric"
                value={String(limit)}
                onChangeText={(v) => setLimit(Number(v) || 0)}
                className="mt-1"
              />
            </View>
            <View className="rounded-xl bg-indigo-50 p-4 flex-row gap-3 border border-indigo-100">
              <ShieldAlert size={18} color="#4338CA" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-indigo-900">Carte Virtuelle Instantanée</Text>
                <Text className="text-xs font-medium text-indigo-700 mt-1 leading-relaxed">
                  Dès sa création, la carte sera immédiatement utilisable.
                </Text>
              </View>
            </View>
          </Card>

          <Button
            className="h-12 bg-indigo-600 mt-3"
            onPress={handleCreateCard}
            disabled={isSubmitting || !cardName || !cardholder}
            loading={isSubmitting}
          >
            <CreditCard size={18} color="#FFFFFF" />
            <Text className="text-white text-sm font-bold">
              {isSubmitting ? "Création..." : "Commander la carte"}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
