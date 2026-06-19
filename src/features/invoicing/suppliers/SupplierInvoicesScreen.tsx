import { useNavigation } from "@react-navigation/native";
import { FileUp, Mail, Receipt } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, OptionCard, Screen, ScreenHeader, Text, useToast } from "@components/index";
import { makeStyles } from "@theme/index";

/** Factures fournisseurs onboarding (Section 6.8). */
export function SupplierInvoicesScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation();
  const toast = useToast();
  const soon = () => toast.show(t("common.comingSoonToast"), "info");

  return (
    <Screen>
      <ScreenHeader
        title={t("invoicing.supplierInvoices.title")}
        onBack={() => navigation.goBack()}
      />
      <Text variant="titleLg" color="textPrimary" style={styles.headline}>
        {t("invoicing.supplierInvoices.onboardingTitle")}
      </Text>

      <View style={styles.options}>
        <OptionCard
          icon={Mail}
          tint="violet"
          title={t("invoicing.supplierInvoices.gmailImport")}
          subtitle={t("invoicing.supplierInvoices.gmailImportSubtitle")}
          onPress={soon}
        />
        <OptionCard
          icon={FileUp}
          tint="blue"
          title={t("invoicing.supplierInvoices.fileImport")}
          subtitle={t("invoicing.supplierInvoices.fileImportSubtitle")}
          onPress={soon}
        />
        <OptionCard
          icon={Receipt}
          tint="green"
          title={t("invoicing.supplierInvoices.eAddress")}
          subtitle={t("invoicing.supplierInvoices.eAddressSubtitle")}
          onPress={soon}
        />
      </View>

      <Button
        variant="secondary"
        label={t("common.skip")}
        onPress={() => navigation.goBack()}
        style={styles.skip}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  headline: { marginTop: t.spacing.sm, marginBottom: t.spacing.lg },
  options: { gap: t.spacing.md },
  skip: { marginTop: t.spacing.xl },
}));
