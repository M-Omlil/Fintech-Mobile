import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, LogOut, Settings } from "lucide-react-native";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking, View } from "react-native";

import { APP_VERSION } from "@app/appInfo";
import {
  Badge,
  Card,
  IconButton,
  IconTile,
  ListItem,
  Screen,
  ScreenHeader,
  SectionHeader,
  Text,
  useToast,
} from "@components/index";
import type { RootStackParamList } from "@navigation/types";
import { useSession } from "@services/auth/SessionProvider";
import { makeStyles, useTheme } from "@theme/index";

import { menuGroups, type MenuItem, type MenuTarget } from "./menuConfig";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Menu tab (Section 6.5) — rendered entirely from `menuConfig`. */
export function MenuScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const { logout } = useSession();
  const toast = useToast();

  const go = useCallback(
    (target: MenuTarget) => {
      // RN navigation typings can't see through the union; the route names are valid.
      if (target.kind === "route") navigation.navigate(target.name as never);
      else if (target.kind === "stub") navigation.navigate("Stub", { titleKey: target.key });
      else Linking.openURL("https://apps.apple.com").catch(() => undefined);
    },
    [navigation],
  );

  // Config-driven keys are dynamic strings; tk is a typed view over `t` for them.
  const tk = t as unknown as (key: string, opts?: Record<string, unknown>) => string;

  const phaseBadge = (item: MenuItem) => {
    if (item.soon) return <Badge label={t("menu.badgeSoon")} tone="muted" />;
    if (item.p2) return <Badge label={t("menu.badgeP2")} tone="muted" />;
    return undefined;
  };

  const renderItem = (group: (typeof menuGroups)[number], item: MenuItem) => (
    <ListItem
      key={item.labelKey}
      leading={<IconTile icon={item.icon} tint={group.tint} />}
      title={tk(`menu.items.${item.labelKey}`)}
      badge={phaseBadge(item)}
      trailing={<ChevronRight size={20} color={theme.colors.textSecondary} strokeWidth={1.75} />}
      onPress={() => go(item.target)}
    />
  );

  return (
    <Screen>
      <ScreenHeader
        title={t("menu.title")}
        rightActions={
          <IconButton
            icon={Settings}
            variant="surface"
            size={40}
            label={t("common.settings")}
            onPress={() => toast.show(t("common.settingsToast"), "info")}
          />
        }
      />

      <View style={styles.groups}>
        {menuGroups.map((group) => (
          <View key={group.titleKey} style={styles.group}>
            <SectionHeader title={tk(group.titleKey)} />
            <Card variant="surface">{group.items.map((item) => renderItem(group, item))}</Card>
          </View>
        ))}
      </View>

      <Card variant="surface" style={styles.logout}>
        <ListItem
          danger
          leading={<IconTile icon={LogOut} tint="peach" />}
          title={t("common.logout")}
          onPress={() => {
            logout().catch(() => undefined);
          }}
        />
      </Card>

      <Text variant="caption" color="textSecondary" style={styles.version}>
        {t("common.appVersion", { version: APP_VERSION })}
      </Text>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  groups: { gap: t.spacing.lg, marginTop: t.spacing.sm },
  group: { gap: t.spacing.xs },
  logout: { marginTop: t.spacing.lg },
  version: { textAlign: "center", marginTop: t.spacing.xl },
}));
