import { useNavigation } from "@react-navigation/native";
import { Landmark, Link2, Plus, Wallet } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AmountText,
  Badge,
  Button,
  Card,
  IconButton,
  IconTile,
  ListItem,
  PromptSheet,
  Screen,
  ScreenHeader,
  SectionHeader,
  Text,
  useToast,
} from "@components/index";
import { useAccounts, useTotalAssets } from "@hooks/index";
import { formatMoney } from "@services/format/money";
import { makeStyles } from "@theme/index";

/** Comptes screen (Section 6.7). */
export function AccountsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation();
  const toast = useToast();

  const { data: accounts, addAccount, activate } = useAccounts();
  const { data: totalAssets, reload: reloadTotal } = useTotalAssets();
  const [sheetOpen, setSheetOpen] = useState(false);

  const remuneration = accounts?.find(
    (account) => !account.isMain && account.status === "inactive",
  );
  const mainAccounts = accounts?.filter((account) => account.isMain) ?? [];
  const secondary =
    accounts?.filter((account) => !account.isMain && account.status === "active") ?? [];

  return (
    <Screen>
      <ScreenHeader
        title={t("accounts.title")}
        onBack={() => navigation.goBack()}
        rightActions={
          <IconButton
            icon={Plus}
            variant="surface"
            size={40}
            label={t("forms.newAccount")}
            onPress={() => setSheetOpen(true)}
          />
        }
      />

      <Text variant="bodyMd" color="textSecondary" style={styles.total}>
        {t("accounts.totalAssets", { amount: formatMoney(totalAssets ?? 0) })}
      </Text>

      <View style={styles.section}>
        <SectionHeader title={t("accounts.groupMain")} />
        <Card variant="surface">
          {remuneration ? (
            <ListItem
              leading={<IconTile icon={Wallet} tint="peach" />}
              title={t("accounts.remuneration")}
              trailing={
                <View style={styles.remunTrailing}>
                  <Badge label={t("accounts.statusInactive")} tone="muted" />
                  <Button
                    variant="text"
                    label={t("accounts.start")}
                    fullWidth={false}
                    onPress={() => {
                      activate(remuneration.id);
                      reloadTotal();
                      toast.show(t("accounts.toastStarted"));
                    }}
                  />
                </View>
              }
            />
          ) : null}
          {[...mainAccounts, ...secondary].map((account) => (
            <ListItem
              key={account.id}
              leading={<IconTile icon={Landmark} tint="blue" />}
              title={account.name}
              trailing={
                <AmountText value={account.balance} currency={account.currency} variant="titleMd" />
              }
              onPress={() => navigation.navigate("Rib")}
            />
          ))}
        </Card>
      </View>

      <Button
        variant="text"
        label={t("accounts.connectExternal")}
        leadingIcon={Link2}
        onPress={() => toast.show(t("common.comingSoonToast"), "info")}
      />

      <PromptSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("forms.newAccount")}
        submitLabel={t("forms.create")}
        fields={[{ key: "name", label: t("forms.accountName") }]}
        onSubmit={async (values) => {
          await addAccount({ name: values.name?.trim() ?? "" });
          reloadTotal();
        }}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  total: { marginTop: t.spacing.sm, marginBottom: t.spacing.lg },
  section: { gap: t.spacing.xs, marginBottom: t.spacing.lg },
  remunTrailing: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
}));
