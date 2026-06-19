import { CheckCircle2, Info, XCircle } from "lucide-react-native";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";

export type ToastVariant = "success" | "info" | "error";

type ToastState = { message: string; variant: ToastVariant } | null;

type ToastContextValue = {
  /** Show a transient confirmation message. */
  show: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = { success: CheckCircle2, info: Info, error: XCircle } as const;

/** Lightweight transient feedback for button actions (no external deps). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      setToast({ message, variant });
      if (timer.current) clearTimeout(timer.current);
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.durations.fast,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: theme.durations.base,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, 2400);
    },
    [opacity, theme.durations.base, theme.durations.fast],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const Icon = toast ? ICONS[toast.variant] : Info;
  const iconColor =
    toast?.variant === "error"
      ? theme.colors.danger
      : toast?.variant === "info"
        ? theme.colors.accent
        : theme.colors.success;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrapper,
            { bottom: insets.bottom + theme.sizing.tabBarClearance, opacity },
          ]}
        >
          <View style={styles.toast}>
            <Icon size={20} color={iconColor} strokeWidth={1.75} />
            <Text variant="bodyMd" color="textOnDark" style={styles.message}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const useStyles = makeStyles((t) => ({
  wrapper: { position: "absolute", left: t.spacing.lg, right: t.spacing.lg, alignItems: "center" },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.sm,
    maxWidth: "100%",
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surfaceDark,
    shadowColor: t.colors.shadow,
    ...t.elevation.tabBar,
  },
  message: { flexShrink: 1 },
}));
