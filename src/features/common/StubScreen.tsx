import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Sparkles } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";

import { EmptyState, IconTile, Screen, ScreenHeader, useToast } from "@components/index";
import type { RootStackParamList } from "@navigation/types";

type StubRoute = RouteProp<RootStackParamList, "Stub">;

/**
 * Generic placeholder (§8 — "Plus tard"/phased) — every not-yet-built screen renders
 * the same ScreenHeader + EmptyState pattern, titled from its `stubs.<key>` entry.
 */
export function StubScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const { params } = useRoute<StubRoute>();
  // The stub title key is dynamic; tk is a typed view over `t` for it.
  const tk = t as unknown as (key: string) => string;

  return (
    <Screen>
      <ScreenHeader
        title={tk(`stubs.${params.titleKey}.title`)}
        onBack={() => navigation.goBack()}
      />
      <EmptyState
        illustration={<IconTile icon={Sparkles} tint="blue" size={64} />}
        title={t("common.soon")}
        body={t("common.comingSoonBody")}
        primaryAction={{
          label: t("stubs.genericCta"),
          onPress: () => toast.show(t("common.comingSoonToast"), "info"),
        }}
      />
    </Screen>
  );
}
