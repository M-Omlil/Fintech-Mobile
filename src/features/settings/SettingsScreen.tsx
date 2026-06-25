import { useNavigation } from "@react-navigation/native";
import {
  ChevronRight,
  Fingerprint,
  Globe,
  Headset,
  Info,
  MoonStar,
  Bell,
  ShieldCheck,
  Wallet,
} from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { APP_VERSION } from "@app/appInfo";
import {
  Card,
  IconTile,
  ListItem,
  Screen,
  ScreenHeader,
  SectionHeader,
  TabPill,
  Text,
  ToggleRow,
  useToast,
} from "@components/index";
import { makeStyles, useTheme, useThemeMode, type ThemeMode } from "@theme/index";

/** Paramètres — appearance (clair · sombre · système), préférences, sécurité, à propos. */
export function SettingsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const theme = useTheme();
  const navigation = useNavigation();
  const toast = useToast();
  const { mode, setMode } = useThemeMode();

  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(true);

  const soon = () => toast.show(t("common.comingSoonToast"), "info");
  const chevron = <ChevronRight size={20} color={theme.colors.textSecondary} strokeWidth={1.75} />;
  const trailingText = (value: string) => (
    <Text variant="bodyMd" color="textSecondary">
      {value}
    </Text>
  );

  return (
    <Screen>
      <ScreenHeader title={t("settings.title")} onBack={() => navigation.goBack()} />

      <View style={styles.section}>
        <SectionHeader title={t("settings.appearance")} />
        <Card variant="surface" style={styles.appearanceCard}>
          <View style={styles.appearanceHead}>
            <IconTile icon={MoonStar} tint="violet" />
            <View style={styles.appearanceInfo}>
              <Text variant="titleMd" color="textPrimary">
                {t("settings.theme")}
              </Text>
              <Text variant="caption" color="textSecondary">
                {t("settings.themeHint")}
              </Text>
            </View>
          </View>
          <TabPill
            value={mode}
            onChange={(key) => setMode(key as ThemeMode)}
            segments={[
              { key: "light", label: t("settings.themeLight") },
              { key: "dark", label: t("settings.themeDark") },
              { key: "system", label: t("settings.themeSystem") },
            ]}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t("settings.preferences")} />
        <Card variant="surface" style={styles.list}>
          <ToggleRow
            label={t("settings.notifications")}
            subtitle={t("settings.notificationsHint")}
            value={notifications}
            onChange={setNotifications}
          />
          <ToggleRow
            label={t("settings.biometric")}
            subtitle={t("settings.biometricHint")}
            value={biometric}
            onChange={setBiometric}
          />
          <ListItem
            leading={<IconTile icon={Globe} tint="blue" />}
            title={t("settings.language")}
            trailing={trailingText("Français")}
            onPress={soon}
          />
          <ListItem
            leading={<IconTile icon={Wallet} tint="green" />}
            title={t("settings.currency")}
            trailing={trailingText("MAD · DH")}
            onPress={soon}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t("settings.security")} />
        <Card variant="surface" style={styles.list}>
          <ListItem
            leading={<IconTile icon={Fingerprint} tint="violet" />}
            title={t("settings.changePin")}
            trailing={chevron}
            onPress={soon}
          />
          <ListItem
            leading={<IconTile icon={Bell} tint="peach" />}
            title={t("settings.alerts")}
            trailing={chevron}
            onPress={soon}
          />
          <ListItem
            leading={<IconTile icon={ShieldCheck} tint="green" />}
            title={t("settings.privacy")}
            trailing={chevron}
            onPress={soon}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t("settings.about")} />
        <Card variant="surface" style={styles.list}>
          <ListItem
            leading={<IconTile icon={Headset} tint="blue" />}
            title={t("settings.help")}
            trailing={chevron}
            onPress={soon}
          />
          <ListItem
            leading={<IconTile icon={Info} tint="navy" />}
            title={t("settings.terms")}
            trailing={chevron}
            onPress={soon}
          />
        </Card>
        <Text variant="caption" color="textSecondary" style={styles.version}>
          {t("common.appVersion", { version: APP_VERSION })}
        </Text>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: t.spacing.xs, marginTop: t.spacing.lg },
  appearanceCard: { gap: t.spacing.lg },
  appearanceHead: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  appearanceInfo: { flex: 1, gap: 2 },
  list: { gap: t.spacing.xs },
  version: { textAlign: "center", marginTop: t.spacing.md },
}));
