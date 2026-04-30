import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Platform } from "react-native";
import { AlertTriangle, CheckCircle2, Sparkles, X, XCircle } from "lucide-react-native";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const toastStyles = {
  default: { border: "border-[#EBF0FE]", bg: "bg-white", text: "text-[#061438]", iconColor: "#061438" },
  success: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-950", iconColor: "#059669" },
  warning: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-950", iconColor: "#D97706" },
  destructive: { border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-950", iconColor: "#E11D48" },
};

const toastIcons = {
  default: Sparkles,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
};

// Composant interne pour gérer l'animation individuelle de chaque Toast
const AnimatedToast = ({ toast, onRemove }: { toast: any, onRemove: (id: string) => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const Icon = toastIcons[toast.variant as keyof typeof toastIcons] || Sparkles;
  const styleConfig = toastStyles[toast.variant as keyof typeof toastStyles] || toastStyles.default;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className={cn(
        "rounded-2xl border px-4 py-4 shadow-sm mb-2 flex-row items-start",
        styleConfig.bg,
        styleConfig.border
      )}
    >
      <View className="mr-3 rounded-full bg-white/80 p-1.5 shadow-sm">
        <Icon size={18} color={styleConfig.iconColor} />
      </View>
      <View className="flex-1 mr-2">
        <Text className={cn("text-[14px] font-bold mb-1", styleConfig.text)}>
          {toast.title}
        </Text>
        <Text className={cn("text-[12px] opacity-80 leading-tight", styleConfig.text)}>
          {toast.description}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={() => onRemove(toast.id)} 
        className="p-1"
        activeOpacity={0.6}
      >
        <X size={16} color={styleConfig.iconColor} style={{ opacity: 0.5 }} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export function ToastStack() {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <View 
      className="absolute bottom-24 left-4 right-4 z-[999]"
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <AnimatedToast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </View>
  );
}