import { useNavigation } from "@react-navigation/native";
import { Boxes, Plus } from "lucide-react-native";
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
import { useProducts } from "@hooks/index";
import { makeStyles } from "@theme/index";

const DEFAULT_VAT_RATE = 20;

/** Produits et services (Section 6.8). */
export function ProductsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation();
  const { data: products, addProduct } = useProducts();
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasProducts = products && products.length > 0;

  return (
    <Screen scroll={hasProducts}>
      <ScreenHeader
        title={t("invoicing.products.title")}
        onBack={() => navigation.goBack()}
        rightActions={
          <IconButton
            icon={Plus}
            variant="surface"
            size={40}
            label={t("forms.newProduct")}
            onPress={() => setSheetOpen(true)}
          />
        }
      />

      {hasProducts ? (
        <Card variant="surface" style={styles.list}>
          {products.map((product) => (
            <ListItem
              key={product.id}
              leading={<IconTile icon={Boxes} tint="violet" />}
              title={product.name}
            />
          ))}
        </Card>
      ) : (
        <View style={styles.empty}>
          <EmptyState
            illustration={<IconTile icon={Boxes} tint="violet" size={64} />}
            title={t("invoicing.products.emptyTitle")}
            body={t("invoicing.products.emptyBody")}
            primaryAction={{
              label: t("invoicing.products.add"),
              onPress: () => setSheetOpen(true),
            }}
          />
        </View>
      )}

      <PromptSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("forms.newProduct")}
        submitLabel={t("forms.create")}
        fields={[{ key: "name", label: t("forms.productName") }]}
        onSubmit={async (values) => {
          await addProduct({
            name: values.name?.trim() ?? "",
            unitPrice: 0,
            vatRate: DEFAULT_VAT_RATE,
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
