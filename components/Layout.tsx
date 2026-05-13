import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  Home,
  ArrowLeftRight,
  FileText,
  UserRound,
  CreditCard,
} from "lucide-react-native";
import { LoginScreen } from "./screens/login-screen";
import { DashboardScreen } from "./screens/dashboard-screen";
import { TransferScreen } from "./screens/transfer-screen";
import { InvoiceScreen } from "./screens/invoice-screen";
import { DocumentsScreen } from "./screens/documents-screen";
import { ProfileScreen } from "./screens/profile-screen";
import { CardsScreen } from "./screens/cards-screen";
import { InsuranceScreen } from "./screens/insurance-screen";
import { ToastStack } from "./ui/toast-stack";
import { useAppStore } from "../store/app-store";

const mobileTabs = [
  { key: "home", label: "Accueil", icon: Home },
  { key: "transfers", label: "Virements", icon: ArrowLeftRight },
  { key: "invoices", label: "Factures", icon: FileText },
  { key: "cards", label: "Cartes", icon: CreditCard },
  { key: "profile", label: "Profil", icon: UserRound },
] as const;

function getActiveIndex(activeTab: string) {
  const i = mobileTabs.findIndex((t) => activeTab.startsWith(t.key));
  return i >= 0 ? i : 0;
}

function DockTab({
  tab,
  isActive,
  onPress,
}: {
  tab: (typeof mobileTabs)[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const Icon = tab.icon;
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isActive ? 1.08 : 1,
        useNativeDriver: true,
        stiffness: 220,
        damping: 16,
        mass: 0.6,
      }),
      Animated.spring(lift, {
        toValue: isActive ? -4 : 0,
        useNativeDriver: true,
        stiffness: 200,
        damping: 14,
        mass: 0.6,
      }),
    ]).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      stiffness: 400,
      damping: 18,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: isActive ? 1.08 : 1,
      useNativeDriver: true,
      stiffness: 220,
      damping: 16,
    }).start();
  };

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.selectionAsync().catch(() => {});
        }
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.dockTab}
      hitSlop={6}
    >
      <Animated.View
        style={{
          transform: [{ scale }, { translateY: lift }],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={22} color={isActive ? "#1E1B4B" : "#64748B"} strokeWidth={isActive ? 2.4 : 2} />
        <Text
          style={[
            styles.dockLabel,
            { color: isActive ? "#1E1B4B" : "#64748B", fontWeight: isActive ? "800" : "600" },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function GlassDock({
  activeTab,
  onTabPress,
}: {
  activeTab: string;
  onTabPress: (key: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [dockWidth, setDockWidth] = React.useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;

  const activeIndex = getActiveIndex(activeTab);
  const tabCount = mobileTabs.length;
  const tabWidth = dockWidth > 0 ? dockWidth / tabCount : 0;

  useEffect(() => {
    if (!tabWidth) return;
    Animated.parallel([
      Animated.spring(indicatorX, {
        toValue: activeIndex * tabWidth,
        useNativeDriver: true,
        stiffness: 200,
        damping: 22,
        mass: 0.8,
      }),
      Animated.timing(indicatorOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex, tabWidth]);

  const onLayout = (e: LayoutChangeEvent) => setDockWidth(e.nativeEvent.layout.width);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dockWrapper, { bottom: insets.bottom + 10 }]}
    >
      <View style={styles.dockShadow}>
        <BlurView intensity={70} tint="light" style={styles.dockBlur}>
          <View style={styles.dockBorder} pointerEvents="none" />
          <View style={styles.dockRow} onLayout={onLayout}>
            {tabWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.indicator,
                  {
                    width: tabWidth - 14,
                    transform: [{ translateX: Animated.add(indicatorX, new Animated.Value(7)) }],
                    opacity: indicatorOpacity,
                  },
                ]}
              />
            )}
            {mobileTabs.map((tab) => {
              const isActive = activeTab.startsWith(tab.key);
              return (
                <DockTab
                  key={tab.key}
                  tab={tab}
                  isActive={isActive}
                  onPress={() => onTabPress(tab.key)}
                />
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

function ScreenContainer({ activeTab, children }: { activeTab: string; children: React.ReactNode }) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    fade.setValue(0);
    lift.setValue(8);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(lift, {
        toValue: 0,
        useNativeDriver: true,
        stiffness: 180,
        damping: 20,
        mass: 0.8,
      }),
    ]).start();
  }, [activeTab]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fade,
        transform: [{ translateY: lift }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function AppLayout() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const content = useMemo(() => {
    if (activeTab === "home") return <DashboardScreen />;
    if (activeTab === "transfers") return <TransferScreen />;
    if (activeTab === "invoices" || activeTab === "invoices-create")
      return <InvoiceScreen view={activeTab === "invoices-create" ? "create" : "list"} />;
    if (activeTab === "cards" || activeTab === "cards-create")
      return <CardsScreen view={activeTab === "cards-create" ? "create" : "list"} />;
    if (activeTab === "insurances" || activeTab === "insurances-create")
      return <InsuranceScreen view={activeTab === "insurances-create" ? "create" : "list"} />;
    if (activeTab === "documents") return <DocumentsScreen />;
    if (activeTab === "profile") return <ProfileScreen />;
    return <DashboardScreen />;
  }, [activeTab]);

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-slate-50">
        <LoginScreen />
        <ToastStack />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <ScreenContainer activeTab={activeTab}>{content}</ScreenContainer>
      <GlassDock activeTab={activeTab} onTabPress={(k) => setActiveTab(k as any)} />
      <ToastStack />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    position: "absolute",
    left: 14,
    right: 14,
    alignItems: "center",
  },
  dockShadow: {
    width: "100%",
    borderRadius: 28,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  dockBlur: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: Platform.OS === "android" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)",
  },
  dockBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(255,255,255,0.7)",
  },
  dockRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    backgroundColor: "rgba(99,102,241,0.16)",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(99,102,241,0.28)",
  },
  dockTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dockLabel: {
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
