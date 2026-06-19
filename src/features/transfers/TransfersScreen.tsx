import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FileText, Plus, Send } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AmountText,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  IconTile,
  ListItem,
  OptionCard,
  Screen,
  ScreenHeader,
  SelectField,
  Sheet,
  TabPill,
  Text,
  type BadgeTone,
} from "@components/index";
import type { TransferTab } from "@data/repositories/index";
import type { Transfer, TransferStatus } from "@domain/index";
import { useAccounts, useTransfers } from "@hooks/index";
import type { RootStackParamList } from "@navigation/types";
import { formatLongDate } from "@services/format/date";
import { makeStyles } from "@theme/index";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TONE: Record<TransferStatus, BadgeTone> = {
  ongoing: "accent",
  past: "success",
  cancelled: "danger",
};

/** Virements list + "Effectuer un virement" chooser (Section 6.6). */
export function TransfersScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();

  const [tab, setTab] = useState<TransferTab>("ongoing");
  const [chooserOpen, setChooserOpen] = useState(false);

  const { data: transfers, reload } = useTransfers(tab);
  const { data: accounts } = useAccounts();

  const [sourceAccountId, setSourceAccountId] = useState<string>();

  // The form lives on a pushed screen — refresh the list when we return to it.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const mainAccountId = accounts?.find((a) => a.isMain)?.id ?? accounts?.[0]?.id;
  const selectedAccountId = sourceAccountId ?? mainAccountId ?? "";

  const accountOptions = useMemo(
    () => (accounts ?? []).map((account) => ({ label: account.name, value: account.id })),
    [accounts],
  );

  const total = useMemo(
    () => (transfers ?? []).reduce((sum, transfer) => sum + transfer.amount, 0),
    [transfers],
  );

  // Dynamic status keys aren't in the typed `t` map; narrow via a string-keyed alias.
  const tk = t as unknown as (key: string) => string;
  const statusLabel = (status: TransferStatus) => tk(`transfers.status.${status}`);

  const openForm = () => {
    setChooserOpen(false);
    navigation.navigate("NouveauVirement", { sourceAccountId: selectedAccountId || undefined });
  };

  const hasItems = transfers && transfers.length > 0;

  return (
    <Screen>
      <ScreenHeader
        title={t("transfers.listTitle")}
        onBack={() => navigation.goBack()}
        rightActions={
          <IconButton
            icon={Plus}
            variant="surface"
            size={40}
            label={t("transfers.chooserTitle")}
            onPress={() => setChooserOpen(true)}
          />
        }
      />

      <TabPill
        style={styles.tabs}
        value={tab}
        onChange={(key) => setTab(key as TransferTab)}
        segments={[
          { key: "ongoing", label: t("transfers.tabOngoing") },
          { key: "history", label: t("transfers.tabHistory") },
        ]}
      />

      {accountOptions.length > 0 ? (
        <SelectField
          style={styles.account}
          value={selectedAccountId}
          options={accountOptions}
          onChange={setSourceAccountId}
          sheetTitle={t("transfers.sourceAccount")}
        />
      ) : null}

      {hasItems ? (
        <Card variant="dark" style={styles.summary}>
          <View style={styles.summaryCount}>
            <Text variant="titleLg" color="textOnDark">
              {transfers.length}
            </Text>
            <Text variant="caption" color="textOnDark" style={styles.summaryCaption}>
              {tab === "ongoing" ? t("transfers.summaryOngoing") : t("transfers.summaryHistory")}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AmountText value={total} variant="titleLg" color="textOnDark" numberOfLines={1} />
            <Text variant="caption" color="textOnDark" style={styles.summaryCaption}>
              {t("transfers.summaryTotal")}
            </Text>
          </View>
        </Card>
      ) : null}

      <View style={styles.body}>
        {hasItems ? (
          transfers.map((transfer: Transfer) => (
            <Card key={transfer.id} variant="surface" style={styles.row}>
              <ListItem
                leading={<Avatar name={transfer.beneficiary} />}
                title={transfer.beneficiary}
                subtitle={`${transfer.reference ? `${transfer.reference} · ` : ""}${formatLongDate(
                  transfer.date,
                )}`}
                trailing={
                  <View style={styles.rowTrailing}>
                    <AmountText
                      value={-transfer.amount}
                      currency={transfer.currency}
                      signed
                      variant="titleMd"
                      color="danger"
                    />
                    <Badge
                      label={statusLabel(transfer.status)}
                      tone={STATUS_TONE[transfer.status]}
                    />
                  </View>
                }
              />
            </Card>
          ))
        ) : (
          <EmptyState
            illustration={<IconTile icon={Send} tint="blue" size={64} />}
            title={tab === "ongoing" ? t("transfers.emptyOngoing") : t("transfers.emptyHistory")}
            primaryAction={{
              label: t("transfers.chooserTitle"),
              onPress: () => setChooserOpen(true),
            }}
          />
        )}
      </View>

      <Sheet
        visible={chooserOpen}
        onClose={() => setChooserOpen(false)}
        title={t("transfers.chooserTitle")}
      >
        <View style={styles.options}>
          <OptionCard
            icon={FileText}
            tint="violet"
            title={t("transfers.payInvoice")}
            subtitle={t("transfers.payInvoiceSubtitle")}
            onPress={() => {
              setChooserOpen(false);
              navigation.navigate("SupplierPayment");
            }}
          />
          <OptionCard
            icon={Send}
            tint="blue"
            title={t("transfers.addDetails")}
            subtitle={t("transfers.addDetailsSubtitle")}
            onPress={openForm}
          />
        </View>
        <Button
          variant="secondary"
          label={t("common.cancel")}
          onPress={() => setChooserOpen(false)}
          style={styles.cancel}
        />
      </Sheet>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  tabs: { marginVertical: t.spacing.md },
  account: { marginBottom: t.spacing.md },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: t.spacing.lg,
  },
  summaryCount: { gap: 2 },
  summaryItem: { flex: 1, gap: 2 },
  summaryCaption: { opacity: 0.7 },
  summaryDivider: {
    width: t.sizing.hairline,
    alignSelf: "stretch",
    backgroundColor: t.colors.textOnDark,
    opacity: 0.15,
    marginHorizontal: t.spacing.lg,
  },
  body: { flex: 1, minHeight: 200, gap: t.spacing.sm },
  row: { paddingVertical: t.spacing.xs },
  rowTrailing: { alignItems: "flex-end", gap: t.spacing.xs },
  options: { gap: t.spacing.md },
  cancel: { marginTop: t.spacing.md },
}));
