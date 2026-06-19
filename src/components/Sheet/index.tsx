import { X } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Optional sheet title shown next to the close affordance. */
  title?: string;
  children: React.ReactNode;
  /** Sticky footer slot (e.g. an "Appliquer" button). */
  footer?: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Bottom-sheet shell (Section 7). Scrim uses the `overlay` token; the close (X) sits
 * top-left per the references. Content scrolls between a fixed header and an optional
 * sticky footer.
 */
export function Sheet({ visible, onClose, title, children, footer, style }: SheetProps) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable style={styles.scrimTouchable} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={[styles.panel, { paddingBottom: insets.bottom + theme.spacing.lg }, style]}>
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              hitSlop={8}
              style={styles.close}
            >
              <X size={24} color={theme.colors.textPrimary} strokeWidth={1.75} />
            </Pressable>
            {title ? (
              <Text variant="titleLg" color="textPrimary" numberOfLines={1}>
                {title}
              </Text>
            ) : null}
          </View>
          <View style={styles.content}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  scrim: { flex: 1, backgroundColor: t.colors.overlay, justifyContent: "flex-end" },
  scrimTouchable: { flex: 1 },
  panel: {
    backgroundColor: t.colors.surface,
    borderTopLeftRadius: t.radii.sheet,
    borderTopRightRadius: t.radii.sheet,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.md,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.sm,
    paddingBottom: t.spacing.md,
  },
  close: { marginLeft: -t.spacing.xs },
  content: { flexShrink: 1 },
  footer: { paddingTop: t.spacing.md },
}));
