import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { AlertTriangle, CheckCircle2, Sparkles, X, XCircle } from "lucide-react-native";
import { useAppStore } from "../../store/app-store";
import { cn } from "../../lib/utils";

const toastStyles = {
  default: { border: "border-slate-200", bg: "bg-white", text: "text-slate-900", iconColor: "#0F172A" },
  success: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-900", iconColor: "#059669" },
  warning: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-900", iconColor: "#D97706" },
  destructive: { border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-900", iconColor: "#E11D48" },
};

const toastIcons = {
  default: Sparkles,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
};

const AnimatedToast = ({ toast, onRemove }: { toast: any; onRemove: (id: string) => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const Icon = toastIcons[toast.variant as keyof typeof toastIcons] || Sparkles;
  const style = toastStyles[toast.variant as keyof typeof toastStyles] || toastStyles.default;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      }}
      className={cn(
        "rounded-2xl border px-4 py-3 mb-2 flex-row items-start",
        style.bg,
        style.border
      )}
    >
      <View className="mr-3 rounded-full bg-white p-1.5">
        <Icon size={16} color={style.iconColor} />
      </View>
      <View className="flex-1 mr-2">
        <Text className={cn("text-[13px] font-bold mb-0.5", style.text)}>{toast.title}</Text>
        <Text className={cn("text-[11px] opacity-80 leading-tight", style.text)}>{toast.description}</Text>
      </View>
      <TouchableOpacity onPress={() => onRemove(toast.id)} className="p-1" activeOpacity={0.6}>
        <X size={14} color={style.iconColor} style={{ opacity: 0.6 }} />
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
      className="absolute bottom-24 left-4 right-4 z-50"
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <AnimatedToast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </View>
  );
}
