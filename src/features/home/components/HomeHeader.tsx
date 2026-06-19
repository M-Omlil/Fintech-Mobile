import { Inbox } from "lucide-react-native";
import React from "react";
import { View } from "react-native";

import { Avatar, IconButton, Text } from "@components/index";
import { makeStyles } from "@theme/index";

export type HomeHeaderProps = {
  businessName: string;
  onOpenInbox?: () => void;
};

/** Home header (Section 6.2) — monogram avatar, business name, inbox action. */
export function HomeHeader({ businessName, onOpenInbox }: HomeHeaderProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Avatar name={businessName} />
        <Text variant="titleMd" color="textPrimary" numberOfLines={1} style={styles.name}>
          {businessName}
        </Text>
      </View>
      <IconButton icon={Inbox} variant="plain" label="Boîte de réception" onPress={onOpenInbox} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: t.spacing.sm,
    gap: t.spacing.md,
  },
  left: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm, flex: 1 },
  name: { flex: 1 },
}));
