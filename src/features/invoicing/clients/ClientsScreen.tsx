import { useNavigation } from "@react-navigation/native";
import { Plus, Users } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  Card,
  EmptyState,
  IconButton,
  IconTile,
  ListItem,
  PromptSheet,
  Screen,
  ScreenHeader,
} from "@components/index";
import { useClients } from "@hooks/index";
import { makeStyles } from "@theme/index";

/** Liste des clients (Section 6.8). */
export function ClientsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation();
  const { data: clients, addClient } = useClients();
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasClients = clients && clients.length > 0;

  return (
    <Screen scroll={hasClients}>
      <ScreenHeader
        title={t("invoicing.clients.title")}
        onBack={() => navigation.goBack()}
        rightActions={
          <IconButton
            icon={Plus}
            variant="surface"
            size={40}
            label={t("forms.newClient")}
            onPress={() => setSheetOpen(true)}
          />
        }
      />

      {hasClients ? (
        <Card variant="surface" style={styles.list}>
          {clients.map((client) => (
            <ListItem
              key={client.id}
              leading={<IconTile icon={Users} tint="violet" />}
              title={client.name}
              subtitle={client.legal?.ice ? `ICE ${client.legal.ice}` : client.email}
            />
          ))}
        </Card>
      ) : (
        <View style={styles.empty}>
          <EmptyState
            illustration={<IconTile icon={Users} tint="violet" size={64} />}
            title={t("invoicing.clients.emptyTitle")}
            body={t("invoicing.clients.emptyBody")}
            primaryAction={{ label: t("invoicing.clients.add"), onPress: () => setSheetOpen(true) }}
          />
        </View>
      )}

      <PromptSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("forms.newClient")}
        submitLabel={t("forms.create")}
        fields={[
          { key: "name", label: t("forms.clientName") },
          {
            key: "email",
            label: t("forms.clientEmail"),
            keyboardType: "email-address",
            optional: true,
          },
          {
            key: "ice",
            label: t("forms.clientIce"),
            keyboardType: "number-pad",
            optional: true,
          },
        ]}
        onSubmit={async (values) => {
          const ice = values.ice?.trim();
          await addClient({
            name: values.name?.trim() ?? "",
            email: values.email?.trim(),
            legal: ice ? { ice } : undefined,
          });
        }}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  list: { marginTop: t.spacing.sm },
  empty: { flex: 1 },
}));
