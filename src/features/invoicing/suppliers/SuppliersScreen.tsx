import { useNavigation } from "@react-navigation/native";
import { Plus, Truck } from "lucide-react-native";
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
  TabPill,
} from "@components/index";
import type { SupplierStatus } from "@domain/index";
import { useSuppliers } from "@hooks/index";
import { makeStyles } from "@theme/index";

/** Liste des fournisseurs (Section 6.8). */
export function SuppliersScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation();

  const [tab, setTab] = useState<SupplierStatus>("active");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: suppliers, addSupplier } = useSuppliers();

  const visible = suppliers?.filter((supplier) => supplier.status === tab) ?? [];

  return (
    <Screen scroll={visible.length > 0}>
      <ScreenHeader
        title={t("invoicing.suppliers.title")}
        onBack={() => navigation.goBack()}
        rightActions={
          <IconButton
            icon={Plus}
            variant="surface"
            size={40}
            label={t("forms.newSupplier")}
            onPress={() => setSheetOpen(true)}
          />
        }
      />
      <TabPill
        style={styles.tabs}
        value={tab}
        onChange={(key) => setTab(key as SupplierStatus)}
        segments={[
          { key: "active", label: t("invoicing.suppliers.tabActive") },
          { key: "archived", label: t("invoicing.suppliers.tabArchived") },
        ]}
      />
      {visible.length > 0 ? (
        <Card variant="surface">
          {visible.map((supplier) => (
            <ListItem
              key={supplier.id}
              leading={<IconTile icon={Truck} tint="peach" />}
              title={supplier.name}
            />
          ))}
        </Card>
      ) : (
        <View style={styles.body}>
          <EmptyState
            illustration={<IconTile icon={Truck} tint="peach" size={64} />}
            title={t("invoicing.suppliers.emptyTitle")}
            body={t("invoicing.suppliers.emptyBody")}
            primaryAction={{
              label: t("invoicing.suppliers.add"),
              onPress: () => setSheetOpen(true),
            }}
          />
        </View>
      )}

      <PromptSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("forms.newSupplier")}
        submitLabel={t("forms.create")}
        fields={[{ key: "name", label: t("forms.supplierName") }]}
        onSubmit={async (values) => {
          await addSupplier({ name: values.name?.trim() ?? "" });
          setTab("active");
        }}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  tabs: { marginVertical: t.spacing.md },
  body: { flex: 1 },
}));
