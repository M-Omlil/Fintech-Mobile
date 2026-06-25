import { LinearGradient } from "expo-linear-gradient";
import { Check, Pencil } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, TextInput, View } from "react-native";

import { Text } from "@components/index";
import type { Card } from "@domain/index";
import { makeStyles, useTheme } from "@theme/index";

// MyLegal wordmark (white) shown on the card instead of the product label.
const CARD_LOGO = require("../../../../assets/image.png");

export type CardVisualProps = {
  card: Card;
  onRename: (nickname: string) => void;
};

const NETWORK_LABEL: Record<Card["network"], string> = {
  visa: "VISA",
  mastercard: "Mastercard",
};

/**
 * Original brand card visual (Section 6.4) — not a copy of any real card. Product
 * label, inline-editable nickname, masked PAN, and a network mark slot on a brand
 * gradient.
 */
export function CardVisual({ card, onRename }: CardVisualProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.nickname);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed.length > 0 && trimmed !== card.nickname) onRename(trimmed);
    else setDraft(card.nickname);
    setEditing(false);
  };

  return (
    <LinearGradient
      colors={theme.gradients.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Image
          source={CARD_LOGO}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="MyLegal"
        />
        <View style={styles.nicknameRow}>
          {editing ? (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={commit}
              onBlur={commit}
              autoFocus
              style={[theme.typography.label, styles.input]}
              placeholderTextColor={theme.colors.textSecondary}
              accessibilityLabel={card.nickname}
            />
          ) : (
            <Text variant="label" color="textOnDark">
              {card.nickname}
            </Text>
          )}
          <Pressable
            onPress={() => (editing ? commit() : setEditing(true))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("cards.editNickname")}
          >
            {editing ? (
              <Check size={16} color={theme.colors.textOnDark} strokeWidth={2} />
            ) : (
              <Pencil size={16} color={theme.colors.textOnDark} strokeWidth={1.75} />
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text variant="titleMd" color="textOnDark">
          {card.maskedPan}
        </Text>
        <Text variant="label" color="textOnDark">
          {NETWORK_LABEL[card.network]}
        </Text>
      </View>
    </LinearGradient>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    borderRadius: t.radii.card,
    padding: t.spacing.lg,
    minHeight: 190,
    justifyContent: "space-between",
    shadowColor: t.colors.shadow,
    ...t.elevation.card,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 120, height: 22 },
  nicknameRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.xs },
  input: {
    color: t.colors.textOnDark,
    minWidth: 80,
    padding: 0,
    borderBottomWidth: t.sizing.hairline,
    borderBottomColor: t.colors.textOnDark,
  },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
}));
