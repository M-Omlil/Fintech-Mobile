import * as Haptics from "expo-haptics";
import { ArrowRight, Check, FileText, ShieldCheck, X } from "lucide-react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Animated, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";

import { AmountText } from "@components/AmountText";
import { Button } from "@components/Button";
import { Text } from "@components/Text";
import { useBusiness } from "@hooks/index";
import { shareTransactionReceipt, type TransactionReceipt } from "@services/export/receiptDocument";
import { makeStyles, useTheme } from "@theme/index";

export type ConfirmInput = {
  receipt: TransactionReceipt;
  /** Defaults to true for outgoing transactions (an OTP step precedes the success). */
  requireOtp?: boolean;
};

export type ConfirmResult = { viewDetails: boolean };

type Ctx = { confirm: (input: ConfirmInput) => Promise<ConfirmResult> };
const TransactionFeedbackContext = createContext<Ctx | undefined>(undefined);

/** Run an OTP + animated success + receipt flow around an already-committed transaction. */
export function useTransactionFeedback(): Ctx {
  const ctx = useContext(TransactionFeedbackContext);
  if (!ctx)
    throw new Error("useTransactionFeedback must be used within TransactionFeedbackProvider");
  return ctx;
}

type Step = "otp" | "success";

export function TransactionFeedbackProvider({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const [state, setState] = useState<{ step: Step; input: ConfirmInput } | null>(null);
  const resolveRef = useRef<((r: ConfirmResult) => void) | null>(null);
  const { data: business } = useBusiness();

  const confirm = useCallback((input: ConfirmInput) => {
    return new Promise<ConfirmResult>((resolve) => {
      resolveRef.current = resolve;
      const needsOtp = input.requireOtp ?? input.receipt.direction === "out";
      setState({ step: needsOtp ? "otp" : "success", input });
    });
  }, []);

  const finish = useCallback((viewDetails: boolean) => {
    setState(null);
    resolveRef.current?.({ viewDetails });
    resolveRef.current = null;
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <TransactionFeedbackContext.Provider value={value}>
      <View style={styles.flex}>
        {children}
        {/* In-tree overlay (not a Modal): RN's Modal suppresses the soft keyboard on the
            new architecture, which broke OTP entry. An absolute View keeps the keyboard. */}
        {state ? (
          <KeyboardAvoidingView
            style={styles.scrim}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {state.step === "otp" ? (
              <OtpCard
                onCancel={() => finish(false)}
                onValid={() => setState((s) => (s ? { ...s, step: "success" } : s))}
              />
            ) : (
              <SuccessCard
                receipt={state.input.receipt}
                onDetails={() => finish(true)}
                onClose={() => finish(false)}
                onShareReceipt={
                  business
                    ? () =>
                        shareTransactionReceipt(business, state.input.receipt).catch(
                          () => undefined,
                        )
                    : undefined
                }
              />
            )}
          </KeyboardAvoidingView>
        ) : null}
      </View>
    </TransactionFeedbackContext.Provider>
  );
}

/** 4-digit OTP — any combination is accepted (demo). */
function OtpCard({ onValid, onCancel }: { onValid: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, []);

  const ready = code.length === 4;

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.closeBtn}
        onPress={onCancel}
        accessibilityLabel={t("common.cancel")}
        hitSlop={8}
      >
        <X size={22} color={theme.colors.textSecondary} strokeWidth={2} />
      </Pressable>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.surfaceAccent }]}>
        <ShieldCheck size={34} color={theme.colors.accent} strokeWidth={2} />
      </View>
      <Text variant="titleLg" color="textPrimary" style={styles.center}>
        {t("txFeedback.otpTitle")}
      </Text>
      <Text variant="bodyMd" color="textSecondary" style={styles.center}>
        {t("txFeedback.otpSubtitle")}
      </Text>

      <View style={styles.otpWrap}>
        <View style={styles.otpRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.otpBox, code.length === i && styles.otpBoxActive]}>
              <Text variant="titleXl" color="textPrimary">
                {code[i] ?? ""}
              </Text>
            </View>
          ))}
        </View>
        {/* Transparent input covering the boxes — reliably catches the hardware/software
            keyboard (a tiny hidden input drops physical-keyboard focus on the emulator). */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          autoFocus
          caretHidden
          style={styles.otpInput}
        />
      </View>

      <Button
        label={t("txFeedback.otpValidate")}
        onPress={onValid}
        disabled={!ready}
        style={styles.cta}
      />
    </View>
  );
}

/** Animated "operation done" confirmation (checkmark pop) + minimal info + actions. */
function SuccessCard({
  receipt,
  onDetails,
  onShareReceipt,
  onClose,
}: {
  receipt: TransactionReceipt;
  onDetails: () => void;
  onShareReceipt?: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();

  const circle = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    Animated.sequence([
      Animated.spring(circle, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.timing(check, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [circle, check]);

  const signed = receipt.direction === "out" ? -receipt.amount : receipt.amount;

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.closeBtn}
        onPress={onClose}
        accessibilityLabel={t("common.close")}
        hitSlop={8}
      >
        <X size={22} color={theme.colors.textSecondary} strokeWidth={2} />
      </Pressable>

      <Animated.View
        style={[
          styles.successCircle,
          { backgroundColor: theme.colors.success, transform: [{ scale: circle }] },
        ]}
      >
        <Animated.View style={{ opacity: check, transform: [{ scale: check }] }}>
          <Check size={48} color={theme.colors.textOnDark} strokeWidth={3} />
        </Animated.View>
      </Animated.View>

      <Text variant="titleLg" color="textPrimary" style={styles.center}>
        {receipt.title}
      </Text>
      <AmountText value={signed} currency={receipt.currency} signed variant="displayLg" />
      <Text variant="bodyMd" color="textSecondary" style={styles.center}>
        {receipt.party}
      </Text>

      <View style={styles.actions}>
        <Button label={t("txFeedback.viewDetails")} leadingIcon={ArrowRight} onPress={onDetails} />
        {onShareReceipt ? (
          <Button
            variant="secondary"
            label={t("txFeedback.receipt")}
            leadingIcon={FileText}
            onPress={onShareReceipt}
          />
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: t.colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: t.spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: t.colors.surfaceSolid,
    borderRadius: t.radii.sheet,
    padding: t.spacing.xl,
    alignItems: "center",
    gap: t.spacing.sm,
  },
  closeBtn: { position: "absolute", top: t.spacing.md, right: t.spacing.md, padding: t.spacing.xs },
  center: { textAlign: "center" },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: t.spacing.xs,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: t.spacing.sm,
  },
  otpWrap: { marginTop: t.spacing.md, position: "relative" },
  otpRow: { flexDirection: "row", gap: t.spacing.sm },
  otpBox: {
    width: 58,
    height: 66,
    borderRadius: t.radii.control,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxActive: { borderColor: t.colors.accent, backgroundColor: t.colors.surfaceAccent },
  otpInput: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  cta: { alignSelf: "stretch", marginTop: t.spacing.lg },
  actions: { alignSelf: "stretch", gap: t.spacing.sm, marginTop: t.spacing.lg },
}));
