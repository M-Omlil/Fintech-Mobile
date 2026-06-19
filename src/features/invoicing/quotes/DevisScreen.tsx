import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FileText, Plus, Settings } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AmountText,
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  IconTile,
  Screen,
  ScreenHeader,
  TabPill,
  Text,
  useToast,
  type BadgeTone,
} from "@components/index";
import type { QuoteStatus } from "@domain/index";
import { useQuotes } from "@hooks/index";
import type { RootStackParamList } from "@navigation/types";
import { formatLongDate } from "@services/format/date";
import { makeStyles } from "@theme/index";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DevisTab = "en_attente" | "termines";

const STATUS_TONE: Record<QuoteStatus, BadgeTone> = {
  en_attente: "accent",
  accepte: "success",
  refuse: "danger",
  expire: "muted",
};

/** Devis list with statuses + "Convertir en facture" (mega-prompt §6). */
export function DevisScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();

  const [tab, setTab] = useState<DevisTab>("en_attente");
  const { data: quotes } = useQuotes();
  const toast = useToast();

  const visible =
    quotes?.filter((quote) =>
      tab === "en_attente" ? quote.status === "en_attente" : quote.status !== "en_attente",
    ) ?? [];

  const tk = t as unknown as (key: string) => string;

  return (
    <Screen>
      <ScreenHeader
        title={t("invoicing.quotes.title")}
        onBack={() => navigation.goBack()}
        rightActions={
          <>
            <IconButton
              icon={Settings}
              variant="surface"
              size={40}
              label={t("common.settings")}
              onPress={() => toast.show(t("common.settingsToast"), "info")}
            />
            <IconButton
              icon={Plus}
              variant="surface"
              size={40}
              label={t("invoicing.quotes.create")}
              onPress={() => navigation.navigate("NouveauDevis")}
            />
          </>
        }
      />

      <TabPill
        style={styles.tabs}
        value={tab}
        onChange={(key) => setTab(key as DevisTab)}
        segments={[
          { key: "en_attente", label: t("invoicing.quotes.tabPending") },
          { key: "termines", label: t("invoicing.quotes.tabCompleted") },
        ]}
      />

      {visible.length > 0 ? (
        <View style={styles.list}>
          {visible.map((quote) => (
            <Card key={quote.id} variant="surface" style={styles.quoteCard}>
              <View style={styles.quoteTop}>
                <IconTile icon={FileText} tint="violet" />
                <View style={styles.quoteInfo}>
                  <Text variant="titleMd" color="textPrimary">
                    {quote.clientName ?? quote.number}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {quote.number} · {formatLongDate(quote.issueDate)}
                  </Text>
                </View>
                <View style={styles.quoteRight}>
                  <AmountText value={quote.totalTTC} variant="titleMd" />
                  <Badge
                    label={tk(`invoicing.quotes.status.${quote.status}`)}
                    tone={STATUS_TONE[quote.status]}
                  />
                </View>
              </View>
              {!quote.convertedInvoiceId ? (
                <Button
                  variant={quote.status === "en_attente" ? "primary" : "secondary"}
                  label={
                    quote.status === "en_attente"
                      ? t("invoicing.quotes.startCycle")
                      : t("invoicing.quotes.continueCycle")
                  }
                  onPress={() => navigation.navigate("CommercialCycle", { quoteId: quote.id })}
                />
              ) : (
                <View style={styles.convertedRow}>
                  <Text variant="caption" color="success">
                    {t("invoicing.quotes.converted")}
                  </Text>
                  <Button
                    variant="text"
                    label={t("invoicing.quotes.viewCycle")}
                    fullWidth={false}
                    onPress={() => navigation.navigate("CommercialCycle", { quoteId: quote.id })}
                  />
                </View>
              )}
            </Card>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <EmptyState
            illustration={<IconTile icon={FileText} tint="violet" size={64} />}
            title={t("invoicing.quotes.emptyTitle")}
            body={t("invoicing.quotes.emptyBody")}
            primaryAction={{
              label: t("invoicing.quotes.create"),
              onPress: () => navigation.navigate("NouveauDevis"),
            }}
          />
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  tabs: { marginVertical: t.spacing.md },
  list: { gap: t.spacing.md },
  quoteCard: { gap: t.spacing.md },
  quoteTop: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  quoteInfo: { flex: 1, gap: 2 },
  quoteRight: { alignItems: "flex-end", gap: t.spacing.xs },
  convertedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.spacing.sm,
  },
  empty: { flex: 1, minHeight: 320 },
}));
