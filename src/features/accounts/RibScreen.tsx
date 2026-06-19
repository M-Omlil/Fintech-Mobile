import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Copy, Share2 } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Share, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Button, Card, Screen, ScreenHeader, Text, useToast } from "@components/index";
import { useBusiness } from "@hooks/index";
import { makeStyles, useTheme } from "@theme/index";

/** RIB screen — Moroccan bank identifier: data card + QR code + copy + share (§3). */
export function RibScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const theme = useTheme();
  const navigation = useNavigation();
  const toast = useToast();
  const { data: business } = useBusiness();

  const onShare = () => {
    if (!business) return;
    Share.share({
      message: `${business.name}\n${t("rib.ribLabel")}: ${business.rib}\n${t("rib.ibanLabel")}: ${business.iban}`,
    }).catch(() => undefined);
  };

  const onCopy = () => {
    if (!business) return;
    Clipboard.setStringAsync(business.rib.replace(/\s/g, ""))
      .then(() => toast.show(t("rib.copied"), "success"))
      .catch(() => undefined);
  };

  const qrValue = business
    ? `RIB:${business.rib.replace(/\s/g, "")}\nIBAN:${business.iban.replace(/\s/g, "")}\n${business.name}`
    : "";

  return (
    <Screen>
      <ScreenHeader title={t("rib.title")} onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <Text variant="bodyMd" color="textSecondary" style={styles.subtitle}>
          {t("rib.subtitle")}
        </Text>

        {business ? (
          <Card variant="surface" style={styles.qrCard}>
            <View style={styles.qrFrame}>
              <QRCode
                value={qrValue}
                size={176}
                color={theme.colors.textPrimary}
                backgroundColor={theme.colors.surface}
              />
            </View>
            <Text variant="caption" color="textSecondary">
              {t("rib.scanHint")}
            </Text>
          </Card>
        ) : null}

        <Card variant="surface" style={styles.card}>
          <View style={styles.field}>
            <Text variant="label" color="textSecondary">
              {t("rib.holder")}
            </Text>
            <Text variant="titleMd" color="textPrimary">
              {business?.name ?? ""}
            </Text>
          </View>

          <View style={styles.field}>
            <Text variant="label" color="textSecondary">
              {t("rib.ribLabel")}
            </Text>
            <View style={styles.ribRow}>
              <Text variant="titleMd" color="textPrimary" style={styles.ribValue}>
                {business?.rib ?? ""}
              </Text>
              <Pressable
                onPress={onCopy}
                accessibilityRole="button"
                accessibilityLabel={t("rib.copy")}
                hitSlop={8}
                style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
              >
                <Copy size={16} color={theme.colors.accent} strokeWidth={2} />
                <Text variant="label" color="accent">
                  {t("rib.copy")}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <Text variant="label" color="textSecondary">
              {t("rib.ibanLabel")}
            </Text>
            <Text variant="bodyLg" color="textPrimary">
              {business?.iban ?? ""}
            </Text>
          </View>
        </Card>
      </View>

      <Button variant="primary" label={t("rib.share")} leadingIcon={Share2} onPress={onShare} />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.md, paddingTop: t.spacing.md },
  subtitle: { textAlign: "center" },
  qrCard: { alignItems: "center", gap: t.spacing.sm, paddingVertical: t.spacing.lg },
  qrFrame: {
    padding: t.spacing.md,
    borderRadius: t.radii.control,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizing.hairline,
    borderColor: t.colors.border,
  },
  card: { alignSelf: "stretch", gap: t.spacing.lg },
  field: { gap: t.spacing.xs },
  ribRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.spacing.sm,
  },
  ribValue: { flexShrink: 1 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: t.spacing.xs },
  pressed: { opacity: 0.6 },
}));
