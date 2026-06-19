import React from "react";
import { View, type ViewStyle } from "react-native";

import { Button } from "@components/Button";
import { Text } from "@components/Text";
import { makeStyles } from "@theme/index";

export type EmptyStateAction = { label: string; onPress?: () => void };

export type EmptyStateProps = {
  /** Optional illustration slot (no third-party art — an IconTile or brand glyph). */
  illustration?: React.ReactNode;
  title: string;
  body?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  style?: ViewStyle;
};

/**
 * First-class empty state (Section 6) — many screens start empty. Headline + body +
 * CTA centered in the available space.
 */
export function EmptyState({
  illustration,
  title,
  body,
  primaryAction,
  secondaryAction,
  style,
}: EmptyStateProps) {
  const styles = useStyles();
  return (
    <View style={[styles.root, style]}>
      {illustration ? <View style={styles.illustration}>{illustration}</View> : null}
      <Text variant="titleLg" color="textPrimary" style={styles.title}>
        {title}
      </Text>
      {body ? (
        <Text variant="bodyMd" color="textSecondary" style={styles.body}>
          {body}
        </Text>
      ) : null}
      {primaryAction ? (
        <View style={styles.action}>
          <Button variant="primary" label={primaryAction.label} onPress={primaryAction.onPress} />
        </View>
      ) : null}
      {secondaryAction ? (
        <View style={styles.secondary}>
          <Button
            variant="secondary"
            label={secondaryAction.label}
            onPress={secondaryAction.onPress}
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: t.spacing.xl,
    gap: t.spacing.md,
  },
  illustration: { marginBottom: t.spacing.sm },
  title: { textAlign: "center" },
  body: { textAlign: "center" },
  action: { alignSelf: "stretch", marginTop: t.spacing.md },
  secondary: { alignSelf: "stretch" },
}));
