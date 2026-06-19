import {
  ChevronRight,
  Eye,
  KeyRound,
  Lock,
  LockOpen,
  ShieldCheck,
  TriangleAlert,
  UserPlus,
  Wallet,
} from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  Button,
  Card,
  EmptyState,
  IconButton,
  IconTile,
  ListItem,
  Screen,
  ScreenHeader,
  TabPill,
  Text,
  useToast,
} from "@components/index";
import type { CardSettings } from "@domain/index";
import { useCards } from "@hooks/index";
import { makeStyles, useTheme } from "@theme/index";

import { CardSettingsList } from "./components/CardSettingsList";
import { CardVisual } from "./components/CardVisual";
import { CashbackCard } from "./components/CashbackCard";
import { PaymentLimits } from "./components/PaymentLimits";

type CardsTab = "yours" | "fleet";

/** Cartes tab (Section 6.4). */
export function CardsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();

  const [tab, setTab] = useState<CardsTab>("yours");
  const [cashbackVisible, setCashbackVisible] = useState(true);

  const { data: cards, setStatus, updateSettings, rename, remove } = useCards();
  const toast = useToast();

  const card = cards?.[0];
  const soon = () => toast.show(t("common.comingSoonToast"), "info");

  const chevron = <ChevronRight size={20} color={theme.colors.textSecondary} strokeWidth={1.75} />;

  return (
    <Screen>
      <ScreenHeader title={t("cards.title")} />

      <TabPill
        style={styles.tabs}
        value={tab}
        onChange={(key) => setTab(key as CardsTab)}
        segments={[
          { key: "yours", label: t("cards.tabYours") },
          { key: "fleet", label: t("cards.tabFleet") },
        ]}
      />

      {tab === "fleet" ? (
        <View style={styles.fleet}>
          <EmptyState
            illustration={<IconTile icon={UserPlus} tint="blue" size={64} />}
            title={t("cards.fleet.emptyTitle")}
            body={t("cards.fleet.emptyBody")}
            primaryAction={{ label: t("cards.fleet.invite"), onPress: soon }}
          />
        </View>
      ) : card ? (
        <View style={styles.body}>
          <CardVisual card={card} onRename={(nickname) => rename(card.id, nickname)} />

          <View style={styles.actions}>
            <IconButton
              icon={card.status === "blocked" ? LockOpen : Lock}
              variant="surface"
              label={card.status === "blocked" ? t("cards.unblock") : t("cards.block")}
              caption={card.status === "blocked" ? t("cards.unblock") : t("cards.block")}
              onPress={() => {
                const blocking = card.status !== "blocked";
                setStatus(card.id, blocking ? "blocked" : "active");
                toast.show(t(blocking ? "cards.toastBlocked" : "cards.toastUnblocked"));
              }}
            />
            <IconButton
              icon={Eye}
              variant="surface"
              label={t("cards.info")}
              caption={t("cards.info")}
              onPress={soon}
            />
            <IconButton
              icon={KeyRound}
              variant="surface"
              label={t("cards.pin")}
              caption={t("cards.pin")}
              onPress={soon}
            />
          </View>

          <Button
            variant="primary"
            label={t("cards.addToWallet")}
            leadingIcon={Wallet}
            disabled={card.addedToWallet}
            onPress={() => toast.show(t("cards.toastWallet"), "info")}
          />

          <Card variant="muted">
            <Text variant="bodyMd" color="textPrimary">
              {t("cards.activationHint")}
            </Text>
          </Card>

          {cashbackVisible ? (
            <CashbackCard onChangeCard={soon} onDismiss={() => setCashbackVisible(false)} />
          ) : null}

          <PaymentLimits spent={card.monthlySpent} limit={card.monthlyLimit} currency="MAD" />

          <CardSettingsList
            settings={card.settings}
            onToggle={(key: keyof CardSettings, value) => updateSettings(card.id, { [key]: value })}
          />

          <Card variant="surface">
            <ListItem title={t("cards.rows.changePin")} trailing={chevron} onPress={soon} />
            <ListItem
              leading={<IconTile icon={ShieldCheck} tint="green" />}
              title={t("cards.rows.insurance")}
              trailing={chevron}
              onPress={soon}
            />
            <ListItem
              leading={<IconTile icon={TriangleAlert} tint="peach" />}
              title={t("cards.rows.lostStolen")}
              trailing={chevron}
              onPress={() => {
                setStatus(card.id, "blocked");
                toast.show(t("cards.toastLost"));
              }}
            />
          </Card>

          <Button variant="text" label={t("cards.rows.premium")} onPress={soon} />

          <Card variant="surface">
            <ListItem
              danger
              title={t("cards.rows.delete")}
              onPress={() => {
                remove(card.id);
                toast.show(t("cards.toastDeleted"));
              }}
            />
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  tabs: { marginVertical: t.spacing.md },
  body: { gap: t.spacing.lg },
  actions: { flexDirection: "row", justifyContent: "space-around" },
  fleet: { flex: 1, paddingTop: t.spacing.xxl },
}));
