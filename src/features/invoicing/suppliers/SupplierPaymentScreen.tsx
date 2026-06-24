import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Building2, Camera, CheckCircle2, FileText, FolderOpen, Send } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Animated, View } from "react-native";

import {
  AmountText,
  Button,
  Card,
  Field,
  IconTile,
  OptionCard,
  Screen,
  ScreenHeader,
  Text,
  ToggleRow,
  useToast,
  useTransactionFeedback,
} from "@components/index";
import { useBeneficiaries, useTransfers } from "@hooks/index";
import type { RootStackParamList } from "@navigation/types";
import { extractInvoiceData, type ExtractionSource, type UploadFile } from "@services/extraction";
import { detectBankFromAccount, formatAccountInput } from "@services/format/bank";
import { makeStyles, useTheme } from "@theme/index";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function parseAmount(raw: string): number {
  const value = Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * UC2 — Paiement facture fournisseur. Import or scan a document; the file is actually
 * read (on-device text parsing, with a cloud-vision fallback when configured) to pull
 * the montant + RIB. Whatever isn't detected stays editable. Then resolve the
 * destinataire (recognised beneficiary or a new one to save) and pay by virement.
 */
export function SupplierPaymentScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const toast = useToast();
  const { confirm } = useTransactionFeedback();

  const prefill = useRoute<RouteProp<RootStackParamList, "SupplierPayment">>().params?.prefill;

  const { data: beneficiaries, addBeneficiary } = useBeneficiaries();
  const { create } = useTransfers("ongoing");

  const [phase, setPhase] = useState<"intake" | "preparing" | "review">("intake");
  const [docName, setDocName] = useState("");
  const [source, setSource] = useState<ExtractionSource>("none");
  const [extracting, setExtracting] = useState(false);
  const [amount, setAmount] = useState("");
  const [rib, setRib] = useState("");
  const [name, setName] = useState("");
  const [saveBeneficiary, setSaveBeneficiary] = useState(true);
  const [paying, setPaying] = useState(false);

  // Hand-off from the documents flow with already-extracted fields → a short
  // "document importé → préparation du virement" animation before the review.
  useEffect(() => {
    if (!prefill) return;
    setAmount(prefill.amount != null ? String(prefill.amount) : "");
    setRib(prefill.rib ? formatAccountInput(prefill.rib) : "");
    setName(prefill.supplierName ?? "");
    setSource((prefill.source as ExtractionSource) ?? "none");
    setDocName(t("supplierPayment.defaultDoc"));
    setPhase("preparing");
    const id = setTimeout(() => setPhase("review"), 1900);
    return () => clearTimeout(id);
    // Only on first mount; the params are stable for this screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectedBank = detectBankFromAccount(rib);

  const matched = useMemo(() => {
    const target = digitsOnly(rib);
    if (target.length < 10) return undefined;
    return (beneficiaries ?? []).find((b) => digitsOnly(b.account) === target);
  }, [beneficiaries, rib]);

  const handlePicked = async (file: UploadFile) => {
    setPhase("review");
    setDocName(file.name ?? t("supplierPayment.defaultDoc"));
    setExtracting(true);
    setSource("none");
    try {
      const result = await extractInvoiceData(file);
      setSource(result.source);
      setAmount(result.amount != null ? String(result.amount) : "");
      setRib(result.rib ? formatAccountInput(result.rib) : "");
      setName(result.supplierName ?? "");
      setSaveBeneficiary(true);
    } finally {
      setExtracting(false);
    }
  };

  const onImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      const asset = res.canceled ? undefined : res.assets[0];
      if (asset) await handlePicked({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
    } catch {
      toast.show(t("supplierPayment.readError"), "error");
    }
  };

  const onScan = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      const asset = res.canceled ? undefined : res.assets[0];
      if (asset)
        await handlePicked({
          uri: asset.uri,
          name: asset.fileName ?? t("supplierPayment.defaultScan"),
          mimeType: asset.mimeType ?? "image/jpeg",
        });
    } catch {
      toast.show(t("supplierPayment.readError"), "error");
    }
  };

  const reset = () => {
    setPhase("intake");
    setAmount("");
    setRib("");
    setName("");
  };

  const onPay = async () => {
    const value = parseAmount(amount);
    if (value <= 0) {
      toast.show(t("supplierPayment.validationAmount"), "error");
      return;
    }
    if (digitsOnly(rib).length < 10) {
      toast.show(t("supplierPayment.validationRib"), "error");
      return;
    }
    const beneficiaryName = matched?.name ?? name.trim();
    if (!beneficiaryName) {
      toast.show(t("supplierPayment.validationName"), "error");
      return;
    }
    setPaying(true);
    let ok = false;
    try {
      if (!matched && saveBeneficiary) {
        await addBeneficiary({ name: beneficiaryName, account: rib, bank: detectedBank ?? "" });
      }
      await create({
        beneficiary: beneficiaryName,
        amount: value,
        account: rib,
        bank: detectedBank,
        reason: t("supplierPayment.reason"),
      });
      ok = true;
    } finally {
      setPaying(false);
    }
    if (!ok) return;

    // OTP + animated success + bank receipt, then land on the Virements list.
    const { viewDetails } = await confirm({
      receipt: {
        direction: "out",
        title: t("supplierPayment.receiptTitle"),
        party: beneficiaryName,
        amount: value,
        currency: "MAD",
        date: new Date().toISOString(),
        reference: `VIR${String(Date.now()).slice(-9)}`,
        method: t("invoicing.invoices.payment.rib"),
        account: rib,
        bank: detectedBank,
      },
    });
    if (viewDetails) navigation.navigate("Transfers");
    else navigation.goBack();
  };

  const sourceNote =
    source === "text"
      ? t("supplierPayment.sourceText")
      : source === "vision"
        ? t("supplierPayment.sourceVision")
        : source === "simulated"
          ? t("supplierPayment.sourceSimulated")
          : t("supplierPayment.sourceNone");

  return (
    <Screen>
      <ScreenHeader title={t("supplierPayment.title")} onBack={() => navigation.goBack()} />

      {phase === "preparing" ? (
        <Preparing docName={docName} party={name} amount={amount} />
      ) : phase === "intake" ? (
        <View style={styles.intake}>
          <Text variant="bodyMd" color="textSecondary">
            {t("supplierPayment.introBody")}
          </Text>
          <OptionCard
            icon={FolderOpen}
            tint="violet"
            title={t("supplierPayment.importDoc")}
            subtitle={t("supplierPayment.importDocSub")}
            onPress={onImport}
          />
          <OptionCard
            icon={Camera}
            tint="blue"
            title={t("supplierPayment.scanDoc")}
            subtitle={t("supplierPayment.scanDocSub")}
            onPress={onScan}
          />
        </View>
      ) : (
        <View style={styles.body}>
          <Card variant="surface" style={styles.docRow}>
            <IconTile icon={FileText} tint="violet" />
            <View style={styles.docInfo}>
              <Text variant="titleMd" color="textPrimary" numberOfLines={1}>
                {docName || t("supplierPayment.defaultDoc")}
              </Text>
              <Text variant="caption" color="textSecondary">
                {extracting ? t("supplierPayment.reading") : sourceNote}
              </Text>
            </View>
            {!extracting && source !== "none" ? (
              <CheckCircle2 size={20} color={theme.colors.success} strokeWidth={2} />
            ) : null}
          </Card>

          {extracting ? (
            <Card variant="surface" style={styles.loading}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text variant="bodyMd" color="textSecondary">
                {t("supplierPayment.reading")}
              </Text>
            </Card>
          ) : (
            <>
              <View style={styles.section}>
                <Text variant="label" color="textSecondary">
                  {t("supplierPayment.extractedTitle")}
                </Text>
                <Card variant="surface" style={styles.sectionCard}>
                  <Field
                    label={t("supplierPayment.amount")}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                  />
                  <Field
                    label={t("supplierPayment.ribLabel")}
                    placeholder={t("transfers.form.accountPlaceholder")}
                    value={rib}
                    onChangeText={(text) => setRib(formatAccountInput(text))}
                  />
                  <View style={styles.bankRow}>
                    <Building2 size={16} color={theme.colors.textSecondary} strokeWidth={1.75} />
                    <Text variant="caption" color="textSecondary">
                      {digitsOnly(rib).length === 0
                        ? t("transfers.form.accountHint")
                        : detectedBank
                          ? t("transfers.form.bankDetected", { bank: detectedBank })
                          : t("transfers.form.bankPending")}
                    </Text>
                  </View>
                </Card>
              </View>

              <View style={styles.section}>
                <Text variant="label" color="textSecondary">
                  {t("supplierPayment.destinataireTitle")}
                </Text>
                <Card variant="surface" style={styles.sectionCard}>
                  {matched ? (
                    <View style={styles.recognized}>
                      <CheckCircle2 size={18} color={theme.colors.success} strokeWidth={2} />
                      <View style={styles.docInfo}>
                        <Text variant="bodyLg" color="textPrimary">
                          {matched.name}
                        </Text>
                        <Text variant="caption" color="textSecondary">
                          {t("supplierPayment.recognized")}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Field
                        label={t("supplierPayment.beneficiaryName")}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                      <ToggleRow
                        label={t("supplierPayment.saveBeneficiary")}
                        value={saveBeneficiary}
                        onChange={setSaveBeneficiary}
                      />
                    </>
                  )}
                </Card>
              </View>

              <View style={styles.actions}>
                <Button
                  variant="primary"
                  label={t("supplierPayment.pay")}
                  leadingIcon={Send}
                  loading={paying}
                  onPress={onPay}
                />
                <View style={styles.amountHint}>
                  <Text variant="caption" color="textSecondary">
                    {t("supplierPayment.payHint")}
                  </Text>
                  <AmountText
                    value={-parseAmount(amount)}
                    signed
                    variant="titleMd"
                    color="danger"
                  />
                </View>
                <Button variant="text" label={t("supplierPayment.payAnother")} onPress={reset} />
              </View>
            </>
          )}
        </View>
      )}
    </Screen>
  );
}

/** "Document importé → préparation du virement" transition with an animated progress bar. */
function Preparing({ docName, party, amount }: { docName: string; party: string; amount: string }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 1700, useNativeDriver: false }).start();
  }, [progress]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ["8%", "100%"] });

  return (
    <View style={styles.preparing}>
      <IconTile icon={FileText} tint="violet" size={72} />
      <Text variant="titleLg" color="textPrimary" style={styles.prepCenter}>
        {t("txFeedback.preparing")}
      </Text>
      <Text variant="bodyMd" color="textSecondary" style={styles.prepCenter}>
        {docName || t("supplierPayment.defaultDoc")}
      </Text>
      <View style={styles.prepBarTrack}>
        <Animated.View style={[styles.prepBarFill, { width }]} />
      </View>
      <Card variant="muted" style={styles.prepCard}>
        <Text variant="caption" color="textSecondary">
          {party || t("supplierPayment.beneficiaryName")}
        </Text>
        <AmountText value={-parseAmount(amount)} signed variant="titleLg" color="danger" />
      </Card>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  intake: { gap: t.spacing.md, marginTop: t.spacing.md },
  preparing: { alignItems: "center", gap: t.spacing.md, paddingTop: t.spacing.xxl },
  prepCenter: { textAlign: "center" },
  prepBarTrack: {
    alignSelf: "stretch",
    height: 8,
    borderRadius: 4,
    backgroundColor: t.colors.surfaceMuted,
    overflow: "hidden",
    marginTop: t.spacing.sm,
  },
  prepBarFill: { height: 8, borderRadius: 4, backgroundColor: t.colors.accent },
  prepCard: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: t.spacing.md,
  },
  body: { gap: t.spacing.lg, marginTop: t.spacing.md },
  docRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  docInfo: { flex: 1, gap: 2 },
  loading: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  section: { gap: t.spacing.xs },
  sectionCard: { gap: t.spacing.md },
  bankRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  recognized: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  actions: { gap: t.spacing.sm },
  amountHint: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
}));
