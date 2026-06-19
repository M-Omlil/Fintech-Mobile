import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FileSignature } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import {
  AmountText,
  Badge,
  Card,
  EmptyState,
  IconTile,
  Screen,
  ScreenHeader,
  Text,
  type BadgeTone,
} from "@components/index";
import type { PurchaseOrderStatus } from "@domain/index";
import { usePurchaseOrders } from "@hooks/index";
import type { RootStackParamList } from "@navigation/types";
import { formatLongDate } from "@services/format/date";
import { makeStyles } from "@theme/index";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TONE: Record<PurchaseOrderStatus, BadgeTone> = {
  en_attente_signature: "accent",
  signe: "success",
  annule: "muted",
};

/** Bons de commande list (UC1) — each order is the document signed electronically. */
export function BonsCommandeScreen() {
  const { t } = useTranslation();
  const tk = t as unknown as (key: string) => string;
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const { data: orders } = usePurchaseOrders();

  const list = orders ?? [];
  const hasOrders = list.length > 0;

  return (
    <Screen scroll={hasOrders}>
      <ScreenHeader
        title={t("invoicing.purchaseOrders.title")}
        onBack={() => navigation.goBack()}
      />

      {hasOrders ? (
        <View style={styles.list}>
          {list.map((order) => (
            <Pressable
              key={order.id}
              accessibilityRole="button"
              onPress={() => navigation.navigate("BonCommandeDetail", { orderId: order.id })}
            >
              <Card variant="surface" style={styles.row}>
                <IconTile icon={FileSignature} tint="violet" />
                <View style={styles.info}>
                  <Text variant="titleMd" color="textPrimary" numberOfLines={1}>
                    {order.clientName ?? order.number}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {order.number} · {formatLongDate(order.issueDate)}
                  </Text>
                </View>
                <View style={styles.right}>
                  <AmountText value={order.totalTTC} variant="titleMd" />
                  <Badge
                    label={tk(`invoicing.purchaseOrders.status.${order.status}`)}
                    tone={STATUS_TONE[order.status]}
                  />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <EmptyState
            illustration={<IconTile icon={FileSignature} tint="violet" size={64} />}
            title={t("invoicing.purchaseOrders.emptyTitle")}
            body={t("invoicing.purchaseOrders.emptyBody")}
          />
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.md, marginTop: t.spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  info: { flex: 1, gap: 2 },
  right: { alignItems: "flex-end", gap: t.spacing.xs },
  empty: { flex: 1, minHeight: 320 },
}));
