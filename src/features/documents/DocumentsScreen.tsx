import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Camera, FilePlus2, FolderOpen, ImageIcon, Mail, Plug } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  Button,
  Card,
  IconTile,
  ListItem,
  Screen,
  ScreenHeader,
  Sheet,
  Text,
  useToast,
  type TileIcon,
} from "@components/index";
import type { RootStackParamList } from "@navigation/types";
import { extractInvoiceData, type UploadFile } from "@services/extraction";
import { formatMoney } from "@services/format/money";
import { makeStyles } from "@theme/index";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SKIP_KEY = "amano.docs.skipOnboarding";

/**
 * "Ajouter un document" flow (per reference): onboarding → import sheet with native
 * scan / gallery / files pickers. "Ne plus afficher ce message" skips the onboarding
 * next time.
 */
export function DocumentsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const toast = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SKIP_KEY)
      .then((value) => {
        if (value === "1") setSheetOpen(true);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const added = (name: string) => toast.show(t("documents.added", { name }));

  /**
   * Read every uploaded document: if it parses as a payable facture (montant + RIB),
   * hand off to the virement flow pre-filled; if only a total is found, surface it;
   * otherwise just confirm the document was added.
   */
  const onPicked = async (file: UploadFile) => {
    const result = await extractInvoiceData(file);
    if (result.amount != null && result.rib) {
      toast.show(t("documents.factureDetected"), "success");
      setSheetOpen(false);
      navigation.navigate("SupplierPayment", {
        prefill: {
          supplierName: result.supplierName,
          amount: result.amount,
          rib: result.rib,
          source: result.source,
        },
      });
    } else if (result.amount != null) {
      toast.show(t("documents.amountDetected", { amount: formatMoney(result.amount) }));
    } else {
      added(file.name ?? t("documents.scan"));
    }
  };

  const pickFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      const asset = res.canceled ? undefined : res.assets[0];
      if (asset)
        await onPicked({
          uri: asset.uri,
          name: asset.fileName ?? t("documents.scan"),
          mimeType: asset.mimeType ?? "image/jpeg",
        });
    } catch {
      toast.show(t("documents.error"), "error");
    }
  };

  const pickFromGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
      const asset = res.canceled ? undefined : res.assets[0];
      if (asset)
        await onPicked({
          uri: asset.uri,
          name: asset.fileName ?? t("documents.gallery"),
          mimeType: asset.mimeType ?? "image/jpeg",
        });
    } catch {
      toast.show(t("documents.error"), "error");
    }
  };

  const pickFromFiles = async () => {
    try {
      // Files = invoices (PDF). Photos/scans go through the camera & gallery options.
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
        copyToCacheDirectory: true,
      });
      const asset = res.canceled ? undefined : res.assets[0];
      if (asset) await onPicked({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
    } catch {
      toast.show(t("documents.error"), "error");
    }
  };

  const closeSheet = () => {
    setSheetOpen(false);
    navigation.goBack();
  };

  const option = (icon: TileIcon, label: string, onPress: () => void) => (
    <ListItem
      leading={<IconTile icon={icon} tint="violet" size={40} />}
      title={label}
      onPress={onPress}
    />
  );

  if (!ready) return <Screen scroll={false}>{null}</Screen>;

  return (
    <Screen scroll={false}>
      <ScreenHeader title={t("documents.title")} onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <IconTile icon={FilePlus2} tint="violet" size={88} />
        <Text variant="titleXl" color="textPrimary" style={styles.center}>
          {t("documents.onboardingTitle")}
        </Text>
        <Text variant="bodyMd" color="textSecondary" style={styles.center}>
          {t("documents.onboardingBody")}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          variant="primary"
          label={t("documents.continue")}
          onPress={() => setSheetOpen(true)}
        />
        <Button
          variant="secondary"
          label={t("documents.dontShowAgain")}
          onPress={() => {
            AsyncStorage.setItem(SKIP_KEY, "1").catch(() => undefined);
            setSheetOpen(true);
          }}
        />
      </View>

      <Sheet visible={sheetOpen} onClose={closeSheet} title={t("documents.importTitle")}>
        <Text variant="bodyMd" color="textSecondary" style={styles.sheetSub}>
          {t("documents.importSubtitle")}
        </Text>
        <Card variant="surface" padding="none" style={styles.optionsCard}>
          {option(Camera, t("documents.scan"), pickFromCamera)}
          {option(ImageIcon, t("documents.gallery"), pickFromGallery)}
          {option(FolderOpen, t("documents.files"), pickFromFiles)}
          {option(Mail, t("documents.email"), () =>
            toast.show(t("common.comingSoonToast"), "info"),
          )}
          {option(Plug, t("documents.integration"), () =>
            toast.show(t("common.comingSoonToast"), "info"),
          )}
        </Card>
      </Sheet>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: t.spacing.md },
  center: { textAlign: "center" },
  actions: { gap: t.spacing.sm },
  sheetSub: { marginBottom: t.spacing.md },
  optionsCard: { paddingHorizontal: t.spacing.md },
}));
