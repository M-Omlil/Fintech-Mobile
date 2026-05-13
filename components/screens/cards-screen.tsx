import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
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
  Sparkles,
  Zap,
  TrendingUp,
  RotateCcw,
  ShoppingBag,
} from "lucide-react-native";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { CompactSelect } from "../ui/compact-select";
import { useActiveProfile, useAppStore } from "../../store/app-store";
import { VisaLogo, MastercardLogo } from "../ui/network-logos";
import type { BankingCard } from "../../services/mock-data";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = CARD_WIDTH * 0.62;

const SAMPLE_MERCHANTS = [
  "Starbucks Casa",
  "Carrefour Maarif",
  "Apple.com/MA",
  "Uber Casablanca",
  "Marjane Bouskoura",
  "Amazon AWS",
  "Shell Anfa",
  "McDonald's Twin Center",
];

const NETWORK_PALETTES: Record<string, [string, string, string]> = {
  visa: ["#1A1F71", "#3949AB", "#0F1233"],
  mastercard: ["#1F2937", "#0F172A", "#000000"],
  default: ["#3730A3", "#1E1B4B", "#0F0E2E"],
};

function getPalette(network: string): [string, string, string] {
  const n = network.toLowerCase();
  if (n.includes("visa")) return NETWORK_PALETTES.visa;
  if (n.includes("mastercard")) return NETWORK_PALETTES.mastercard;
  return NETWORK_PALETTES.default;
}

const getNetworkLogo = (network: string) => {
  const n = network.toLowerCase();
  if (n.includes("visa")) return <VisaLogo width={56} height={18} />;
  if (n.includes("mastercard")) return <MastercardLogo width={42} height={26} />;
  return <Text style={{ color: "white", fontWeight: "900", letterSpacing: 2 }}>{network}</Text>;
};

const getIconForTransaction = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("virement") || t.includes("reçu")) return ArrowDownToLine;
  if (t.includes("fournisseur") || t.includes("achat")) return Landmark;
  if (t.includes("salaire") || t.includes("paie")) return BadgeDollarSign;
  return CreditCard;
};

/* -------------------------------------------------------------------------- */
/*                           PREMIUM ANIMATED CARD                            */
/* -------------------------------------------------------------------------- */

function PremiumCard({
  card,
  isFrozen,
  index,
  onPress,
}: {
  card: BankingCard;
  isFrozen: boolean;
  index: number;
  onPress: () => void;
}) {
  const palette = getPalette(card.network);
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const sheen = useRef(new Animated.Value(-1)).current;

  // Staggered entrance
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      delay: index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Looping subtle sheen sweep on active cards
  useEffect(() => {
    if (isFrozen) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2200 + index * 400),
        Animated.timing(sheen, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheen, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isFrozen, index]);

  const handlePressIn = () => {
    Animated.spring(press, {
      toValue: 0.97,
      useNativeDriver: true,
      stiffness: 400,
      damping: 22,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(press, {
      toValue: 1,
      useNativeDriver: true,
      stiffness: 300,
      damping: 18,
    }).start();
  };

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const sheenX = sheen.interpolate({
    inputRange: [-1, 1],
    outputRange: [-CARD_WIDTH, CARD_WIDTH],
  });

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateY }, { scale: press }],
      }}
    >
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={cardStyles.shadow}
      >
        <LinearGradient
          colors={isFrozen ? ["#94A3B8", "#64748B", "#475569"] : palette}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={cardStyles.card}
        >
          {/* Decorative concentric circles */}
          <View style={[cardStyles.circle, cardStyles.circleA]} />
          <View style={[cardStyles.circle, cardStyles.circleB]} />

          {/* Animated sheen sweep */}
          {!isFrozen && (
            <Animated.View
              pointerEvents="none"
              style={[
                cardStyles.sheen,
                { transform: [{ translateX: sheenX }, { rotate: "20deg" }] },
              ]}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.22)", "rgba(255,255,255,0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          )}

          {/* Top row */}
          <View style={cardStyles.topRow}>
            <View style={cardStyles.chipColumn}>
              <View style={cardStyles.chip}>
                <LinearGradient
                  colors={["#FCD34D", "#D97706", "#92400E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={cardStyles.chipInner}
                >
                  <View style={cardStyles.chipLine} />
                  <View style={cardStyles.chipLine} />
                  <View style={cardStyles.chipLine} />
                </LinearGradient>
              </View>
              <Nfc size={18} color="rgba(255,255,255,0.85)" style={{ marginTop: 8, transform: [{ rotate: "90deg" }] }} />
            </View>
            <View style={{ alignItems: "flex-end" }}>{getNetworkLogo(card.network)}</View>
          </View>

          {/* PAN */}
          <Text style={cardStyles.pan}>{card.maskedPan}</Text>

          {/* Bottom row */}
          <View style={cardStyles.bottomRow}>
            <View style={{ flex: 1 }}>
              <Text style={cardStyles.labelTiny}>Titulaire</Text>
              <Text style={cardStyles.cardholder} numberOfLines={1}>
                {card.cardholder}
              </Text>
            </View>
            <View>
              <Text style={[cardStyles.labelTiny, { textAlign: "right" }]}>Expire</Text>
              <Text style={cardStyles.expiry}>{card.expiry}</Text>
            </View>
          </View>

          {/* Frozen overlay */}
          {isFrozen && (
            <View style={cardStyles.frozenOverlay} pointerEvents="none">
              <View style={cardStyles.frozenPill}>
                <Snowflake size={14} color="#0F172A" />
                <Text style={cardStyles.frozenText}>Bloquée</Text>
              </View>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                MAIN SCREEN                                 */
/* -------------------------------------------------------------------------- */

export function CardsScreen({ view }: { view: "list" | "create" }) {
  const profile = useActiveProfile();
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const addCard = useAppStore((s) => s.addCard);
  const setCardStatus = useAppStore((s) => s.setCardStatus);
  const setCardLimit = useAppStore((s) => s.setCardLimit);
  const spendOnCard = useAppStore((s) => s.spendOnCard);
  const resetCardSpent = useAppStore((s) => s.resetCardSpent);
  const showToast = useAppStore((s) => s.showToast);

  const [cardName, setCardName] = useState("");
  const [cardholder, setCardholder] = useState("");
  const [network, setNetwork] = useState("VISA");
  const [limit, setLimit] = useState<number>(20000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingCard, setEditingCard] = useState<BankingCard | null>(null);
  const [newLimitValue, setNewLimitValue] = useState<string>("");

  const [detailedCard, setDetailedCard] = useState<BankingCard | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [detailedCardName, setDetailedCardName] = useState("");
  const [spendAmount, setSpendAmount] = useState("250");

  // Entrance for KPIs
  const kpiAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(kpiAnim, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [view]);

  useEffect(() => {
    if (profile) setCardholder(`${profile.firstName} ${profile.displayName}`);
  }, [profile]);

  const cards = profile?.cards || [];
  // Per-card history. Falls back to recent debits (no cardId tag, e.g. legacy
  // entries) so a brand-new card still shows the account's activity context.
  const cardTransactions = useMemo(() => {
    if (!profile) return [];
    if (!detailedCard) return [];
    const linked = profile.transactions.filter(
      (t) => t.kind === "debit" && t.cardId === detailedCard.id
    );
    if (linked.length > 0) return linked.slice(0, 8);
    return profile.transactions
      .filter((t) => t.kind === "debit" && !t.cardId)
      .slice(0, 6);
  }, [profile, detailedCard]);

  const activeCount = useMemo(() => cards.filter((c) => c.status === "active").length, [cards]);
  const totalSpent = useMemo(() => cards.reduce((sum, c) => sum + (c.spent || 0), 0), [cards]);
  const totalLimit = useMemo(() => cards.reduce((sum, c) => sum + (c.limit || 0), 0), [cards]);

  const handleToggleStatus = (card: BankingCard) => {
    const newStatus = card.status === "active" ? "frozen" : "active";
    setCardStatus(card.id, newStatus);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        newStatus === "frozen" ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
    }
    showToast({
      title: newStatus === "frozen" ? "Carte bloquée" : "Carte débloquée",
      description: newStatus === "frozen" ? "La carte a été suspendue." : "La carte est de nouveau active.",
      variant: newStatus === "frozen" ? "warning" : "success",
    });
  };

  const handleSaveLimit = () => {
    if (!editingCard) return;
    const limitNum = Number(newLimitValue);
    if (limitNum <= 0) return;
    setCardLimit(editingCard.id, limitNum);
    showToast({
      title: "Plafond mis à jour",
      description: `Nouveau plafond : ${limitNum.toLocaleString("fr-MA")} MAD.`,
      variant: "success",
    });
    setEditingCard(null);
  };

  const handleSimulatePurchase = async () => {
    if (!detailedCard) return;
    const amount = Number(spendAmount);
    if (!amount || amount <= 0) {
      showToast({ title: "Montant invalide", description: "Entrez un montant > 0.", variant: "destructive" });
      return;
    }
    const merchant = SAMPLE_MERCHANTS[Math.floor(Math.random() * SAMPLE_MERCHANTS.length)];
    const result = await spendOnCard(detailedCard.id, amount, merchant);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        result.ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
      ).catch(() => {});
    }
    if (result.ok) {
      showToast({
        title: "Paiement simulé",
        description: `${amount.toLocaleString("fr-MA")} MAD à ${merchant}`,
        variant: "success",
      });
    } else {
      showToast({
        title: "Paiement refusé",
        description: result.reason || "Transaction rejetée",
        variant: "destructive",
      });
    }
  };

  const handleResetSpent = () => {
    if (!detailedCard) return;
    resetCardSpent(detailedCard.id);
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    showToast({
      title: "Compteur réinitialisé",
      description: `Dépenses remises à 0 sur ${detailedCard.name}.`,
      variant: "default",
    });
  };

  const handleCreateCard = () => {
    if (!cardName.trim() || !cardholder.trim() || limit <= 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const newCard: BankingCard = {
        id: `card-${Date.now()}`,
        name: cardName,
        cardholder,
        network,
        maskedPan: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
        expiry: `12/${new Date().getFullYear() + 3 - 2000}`,
        limit: Number(limit),
        spent: 0,
        status: "active",
      };
      addCard(newCard);
      setCardName("");
      setLimit(20000);
      setIsSubmitting(false);
      setActiveTab("cards");
    }, 700);
  };

  if (!profile) return null;

  /* ---------------------------- LIST VIEW ---------------------------- */
  if (view === "list") {
    const kpiTranslateY = kpiAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

    return (
      <ScrollView
        className="flex-1 bg-slate-50"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header with subtle gradient */}
        <LinearGradient
          colors={["#EEF2FF", "#F3F6F9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
        >
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">
                Cartes bancaires
              </Text>
              <Text className="text-2xl font-black text-slate-900 mt-1">Mon portefeuille</Text>
              <Text className="text-sm text-slate-500 mt-1">
                {cards.length} carte{cards.length > 1 ? "s" : ""} · Touchez pour gérer
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setActiveTab("cards-create")}
              activeOpacity={0.85}
              style={{
                shadowColor: "#4338CA",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <LinearGradient
                colors={["#6366F1", "#4338CA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={22} color="#FFFFFF" strokeWidth={2.6} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* KPI strip */}
          <Animated.View
            style={{
              opacity: kpiAnim,
              transform: [{ translateY: kpiTranslateY }],
              flexDirection: "row",
              gap: 10,
              marginTop: 18,
            }}
          >
            <KpiTile
              icon={<Zap size={14} color="#16A34A" />}
              label="Actives"
              value={`${activeCount}/${cards.length}`}
              accent="#16A34A"
            />
            <KpiTile
              icon={<TrendingUp size={14} color="#EA580C" />}
              label="Dépensé"
              value={`${(totalSpent / 1000).toFixed(1)}k`}
              accent="#EA580C"
            />
            <KpiTile
              icon={<ShieldAlert size={14} color="#4338CA" />}
              label="Plafond"
              value={`${(totalLimit / 1000).toFixed(0)}k`}
              accent="#4338CA"
            />
          </Animated.View>
        </LinearGradient>

        {/* Cards stack */}
        <View style={{ paddingHorizontal: 16, paddingTop: 18, gap: 18 }}>
          {cards.length > 0 ? (
            cards.map((card, idx) => {
              const isFrozen = card.status === "frozen";
              const progress = Math.min(((card.spent || 0) / Math.max(card.limit, 1)) * 100, 100);
              return (
                <View key={card.id}>
                  <PremiumCard
                    card={card}
                    isFrozen={isFrozen}
                    index={idx}
                    onPress={() => {
                      setDetailedCard(card);
                      setDetailedCardName(card.name);
                      setShowPin(false);
                    }}
                  />

                  {/* Compact actions row below card */}
                  <View
                    style={{
                      marginTop: 10,
                      flexDirection: "row",
                      gap: 8,
                      paddingHorizontal: 4,
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text className="text-[13px] font-black text-slate-900">{card.name}</Text>
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {card.network} Business
                      </Text>
                    </View>
                    <ActionPill
                      icon={isFrozen ? <CheckCircle2 size={14} color="#16A34A" /> : <Snowflake size={14} color="#EA580C" />}
                      label={isFrozen ? "Activer" : "Geler"}
                      onPress={() => handleToggleStatus(card)}
                      tint={isFrozen ? "#16A34A" : "#EA580C"}
                    />
                    <ActionPill
                      icon={<Settings2 size={14} color="#334155" />}
                      label="Plafond"
                      onPress={() => {
                        setEditingCard(card);
                        setNewLimitValue(String(card.limit));
                      }}
                      tint="#334155"
                    />
                  </View>

                  {/* Progress bar with shimmer-style fill */}
                  <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-[11px] font-bold text-slate-700">
                        {(card.spent || 0).toLocaleString("fr-MA")} {profile.currency}
                      </Text>
                      <Text className="text-[11px] font-medium text-slate-400">
                        / {card.limit.toLocaleString("fr-MA")}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#E2E8F0",
                        overflow: "hidden",
                      }}
                    >
                      <LinearGradient
                        colors={
                          progress > 85
                            ? ["#EF4444", "#DC2626"]
                            : progress > 60
                            ? ["#F59E0B", "#D97706"]
                            : ["#6366F1", "#4338CA"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ height: "100%", width: `${progress}%`, borderRadius: 3 }}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Card className="p-10 items-center">
              <CreditCard size={36} color="#CBD5E1" />
              <Text className="text-sm font-medium text-slate-500 mt-3">Aucune carte.</Text>
            </Card>
          )}
        </View>

        {/* Edit limit modal */}
        <Modal
          visible={!!editingCard}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingCard(null)}
        >
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <Pressable
              style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(15,23,42,0.55)", paddingHorizontal: 16 }}
              onPress={() => setEditingCard(null)}
            >
              <Pressable style={{ width: "100%", maxWidth: 420 }}>
                <BlurView intensity={40} tint="light" style={{ borderRadius: 24, overflow: "hidden" }}>
                  <View style={{ backgroundColor: "rgba(255,255,255,0.92)", padding: 20 }}>
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-lg font-black text-slate-900">Gérer le plafond</Text>
                      <TouchableOpacity onPress={() => setEditingCard(null)} className="p-1.5 rounded-full bg-slate-100">
                        <X size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-xs font-medium text-slate-500 mb-4">
                      Carte se terminant par {editingCard?.maskedPan?.split(" ")[1]}
                    </Text>
                    <Label>Nouveau plafond mensuel (MAD)</Label>
                    <Input
                      keyboardType="numeric"
                      value={newLimitValue}
                      onChangeText={setNewLimitValue}
                      className="text-lg font-bold mt-1 mb-4"
                    />
                    <View className="flex-row gap-3">
                      <Button variant="secondary" className="flex-1" onPress={() => setEditingCard(null)}>
                        Annuler
                      </Button>
                      <Button className="flex-1 bg-indigo-600" onPress={handleSaveLimit}>
                        Sauvegarder
                      </Button>
                    </View>
                  </View>
                </BlurView>
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
          <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
            <BlurView intensity={50} tint="light" style={{ paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-black text-slate-900">Détails de la carte</Text>
                <TouchableOpacity
                  onPress={() => setDetailedCard(null)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(255,255,255,0.95)",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#0F172A",
                    shadowOpacity: 0.08,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <X size={18} color="#475569" />
                </TouchableOpacity>
              </View>
            </BlurView>

            {detailedCard && (
              <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                <PremiumCard
                  card={detailedCard}
                  isFrozen={detailedCard.status === "frozen"}
                  index={0}
                  onPress={() => {}}
                />

                {/* Simulate purchase block */}
                <View style={{ marginTop: 18 }}>
                  <Text className="text-sm font-black text-slate-900 mb-2 mt-2">Tester un paiement</Text>
                  <Text className="text-[11px] font-medium text-slate-500 mb-3">
                    Génère une vraie transaction qui mettra à jour le solde et l'historique du compte.
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                    {[100, 250, 500, 1500].map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        onPress={() => setSpendAmount(String(amt))}
                        activeOpacity={0.7}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 12,
                          backgroundColor: spendAmount === String(amt) ? "#4338CA" : "rgba(99,102,241,0.10)",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: spendAmount === String(amt) ? "#FFFFFF" : "#4338CA",
                            fontWeight: "800",
                            fontSize: 12,
                          }}
                        >
                          {amt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Input
                      keyboardType="numeric"
                      value={spendAmount}
                      onChangeText={setSpendAmount}
                      placeholder="Montant MAD"
                      className="flex-1"
                    />
                    <TouchableOpacity onPress={handleSimulatePurchase} activeOpacity={0.85}>
                      <LinearGradient
                        colors={["#10B981", "#059669"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          height: 48,
                          paddingHorizontal: 16,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <ShoppingBag size={14} color="#FFFFFF" />
                        <Text className="text-white text-xs font-black uppercase tracking-wider">Payer</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={handleResetSpent}
                    activeOpacity={0.7}
                    style={{
                      marginTop: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: "rgba(148,163,184,0.16)",
                    }}
                  >
                    <RotateCcw size={14} color="#475569" />
                    <Text className="text-[12px] font-bold text-slate-600">Réinitialiser le compteur</Text>
                  </TouchableOpacity>
                </View>

                {/* PIN & rename */}
                <Text className="text-sm font-black text-slate-900 mt-6 mb-2">Sécurité</Text>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <View>
                    <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Code PIN</Text>
                    <Text className="text-xl font-mono font-black text-slate-900 tracking-widest mt-1">
                      {showPin ? "1234" : "••••"}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setShowPin(!showPin)}
                      style={{
                        height: 38,
                        width: 38,
                        borderRadius: 12,
                        backgroundColor: "#F1F5F9",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {showPin ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        showToast({
                          title: "Demande envoyée",
                          description: "Un nouveau PIN sera envoyé par SMS.",
                          variant: "default",
                        })
                      }
                      style={{
                        height: 38,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: "#F1F5F9",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <RefreshCw size={14} color="#334155" />
                      <Text className="text-xs font-bold text-slate-700">Reset</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Label>Nom de la carte (Usage)</Label>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                    <Input
                      value={detailedCardName}
                      onChangeText={setDetailedCardName}
                      className="flex-1"
                    />
                    <Button
                      className="px-4 bg-indigo-600"
                      onPress={() =>
                        showToast({
                          title: "Nom mis à jour",
                          description: "Le libellé de la carte a été modifié.",
                          variant: "success",
                        })
                      }
                    >
                      <Edit3 size={14} color="#FFFFFF" />
                      <Text className="text-white text-xs font-bold">Sauver</Text>
                    </Button>
                  </View>
                </View>

                {/* Recent transactions */}
                <Text className="text-sm font-black text-slate-900 mt-6 mb-2">Dernières opérations</Text>
                {cardTransactions.length > 0 ? (
                  cardTransactions.map((tx) => {
                    const Icon = getIconForTransaction(tx.title);
                    return (
                      <Animated.View
                        key={tx.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 12,
                          backgroundColor: "#FFFFFF",
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                          marginBottom: 8,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10 }}>
                          <View
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 12,
                              backgroundColor: "#F1F5F9",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon size={16} color="#475569" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text className="text-[13px] font-bold text-slate-900" numberOfLines={1}>
                              {tx.title}
                            </Text>
                            <Text className="text-[11px] font-medium text-slate-500" numberOfLines={1}>
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
                      </Animated.View>
                    );
                  })
                ) : (
                  <View className="items-center py-8">
                    <History size={28} color="#CBD5E1" />
                    <Text className="text-sm font-medium text-slate-500 mt-2">Aucune transaction.</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </Modal>
      </ScrollView>
    );
  }

  /* ---------------------------- CREATE VIEW ---------------------------- */
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="px-4 pt-4">
          <TouchableOpacity onPress={() => setActiveTab("cards")} className="flex-row items-center mb-3">
            <ArrowLeft size={16} color="#64748B" />
            <Text className="ml-1.5 text-sm font-bold text-slate-500">Retour</Text>
          </TouchableOpacity>
          <View className="mb-5">
            <Text className="text-2xl font-black text-slate-900">Nouvelle carte</Text>
            <Text className="text-sm text-slate-500 mt-1">
              Créez instantanément une nouvelle carte virtuelle.
            </Text>
          </View>

          {/* Live preview card */}
          <View style={{ marginBottom: 18 }}>
            <PremiumCard
              card={{
                id: "preview",
                name: cardName || "Nouvelle carte",
                cardholder: cardholder || "Titulaire",
                network,
                maskedPan: "•••• 0000",
                expiry: `12/${new Date().getFullYear() + 3 - 2000}`,
                limit,
                spent: 0,
                status: "active",
              }}
              isFrozen={false}
              index={0}
              onPress={() => {}}
            />
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
              <Sparkles size={18} color="#4338CA" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-indigo-900">Carte Virtuelle Instantanée</Text>
                <Text className="text-xs font-medium text-indigo-700 mt-1 leading-relaxed">
                  Dès sa création, la carte sera immédiatement utilisable et apparaîtra dans votre portefeuille.
                </Text>
              </View>
            </View>
          </Card>

          <TouchableOpacity onPress={handleCreateCard} disabled={isSubmitting || !cardName || !cardholder} activeOpacity={0.85}>
            <LinearGradient
              colors={isSubmitting || !cardName || !cardholder ? ["#94A3B8", "#64748B"] : ["#6366F1", "#4338CA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: 52,
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 4,
                shadowColor: "#4338CA",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 14,
                elevation: 6,
              }}
            >
              <CreditCard size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-black uppercase tracking-wider">
                {isSubmitting ? "Création..." : "Commander la carte"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                SUBCOMPONENTS                               */
/* -------------------------------------------------------------------------- */

function KpiTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.85)",
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.7)",
        shadowColor: "#0F172A",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 }}>
        {icon}
        <Text style={{ fontSize: 10, fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8 }}>
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: "900", color: accent }}>{value}</Text>
    </View>
  );
}

function ActionPill({
  icon,
  label,
  onPress,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  tint: string;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderWidth: 1,
        borderColor: "rgba(15,23,42,0.06)",
      }}
    >
      {icon}
      <Text style={{ fontSize: 11, fontWeight: "800", color: tint, letterSpacing: 0.2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const cardStyles = StyleSheet.create({
  shadow: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 22,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  card: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    padding: 22,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  circleA: {
    width: 260,
    height: 260,
    top: -90,
    right: -90,
  },
  circleB: {
    width: 180,
    height: 180,
    bottom: -80,
    left: -60,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  sheen: {
    position: "absolute",
    top: -40,
    bottom: -40,
    width: 80,
    left: 0,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  chipColumn: {
    alignItems: "flex-start",
  },
  chip: {
    width: 40,
    height: 30,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  chipInner: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-evenly",
    paddingHorizontal: 4,
  },
  chipLine: {
    height: 1.5,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 1,
  },
  pan: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    letterSpacing: 4,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  labelTiny: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  cardholder: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  expiry: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  frozenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  frozenPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  frozenText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
