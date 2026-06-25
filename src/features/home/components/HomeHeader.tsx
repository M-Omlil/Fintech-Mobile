import { Inbox } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";

import { IconButton, Text } from "@components/index";
import { makeStyles, useTheme } from "@theme/index";

// MyLegal wordmark — white version for dark backgrounds, navy for light.
const LOGO_DARK = require("../../../../assets/logo-dark.png");
const LOGO_LIGHT = require("../../../../assets/logo-light.png");

export type HomeHeaderProps = {
  /** Account holder, shown in the greeting (e.g. "Ilyasse Belhamdounia"). */
  name: string;
  onOpenInbox?: () => void;
};

/** Home header (Section 6.2) — MyLegal logo, a time-aware greeting, and the inbox action. */
export function HomeHeader({ name, onOpenInbox }: HomeHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const greeting = new Date().getHours() < 18 ? t("home.greetingDay") : t("home.greetingEvening");

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Image
          source={theme.scheme === "dark" ? LOGO_DARK : LOGO_LIGHT}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="MyLegal"
        />
        <IconButton icon={Inbox} variant="plain" label="Boîte de réception" onPress={onOpenInbox} />
      </View>
      <Text variant="titleMd" color="textPrimary" numberOfLines={1}>
        {greeting}, M. {name}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.xs, paddingVertical: t.spacing.sm },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { width: 138, height: 30 },
}));
