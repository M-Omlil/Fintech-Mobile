import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  FileText,
  Mail,
  Share2,
  Landmark,
  FileCheck,
  History,
  Building2,
  Download,
} from "lucide-react-native";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useActiveProfile, useAppStore } from "../../store/app-store";
import { cn } from "../../lib/utils";

const STANDARD_DOCUMENTS = [
  { id: "doc-rib", name: "RIB", description: "Relevé d'Identité Bancaire", Icon: Landmark },
  { id: "doc-attestation", name: "Attestation bancaire", description: "Certificat de titularité", Icon: FileCheck },
  { id: "doc-releve", name: "Relevé de compte", description: "Dernières transactions", Icon: History },
  { id: "doc-kyc", name: "Statuts Société", description: "Documents juridiques", Icon: Building2 },
];

export function DocumentsScreen() {
  const profile = useActiveProfile();
  const showToast = useAppStore((s) => s.showToast);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const getDocumentTemplate = (docId: string) => {
    const dateStr = new Date().toLocaleDateString("fr-FR");
    const userName = `${profile?.firstName} ${profile?.displayName}`.toUpperCase();
    const company = profile?.companyName || "Ma Société SARL";

    switch (docId) {
      case "doc-rib":
        return `<div style="border: 2px solid #000; padding: 20px;">
          <h3>RELEVÉ D'IDENTITÉ BANCAIRE</h3>
          <p><strong>${company}</strong><br/>${userName}<br/>CASABLANCA, MAROC</p>
          <p>IBAN: ${profile?.accountIBAN || "MA64 0001 0123 4567 8901 2345 0199"}</p>
          <p>SWIFT / BIC: MYLE MA BC XXX</p>
        </div>`;
      case "doc-attestation":
        return `<p>Fait à Casablanca, le ${dateStr}</p>
          <h2>ATTESTATION DE TITULARITÉ</h2>
          <p>Nous soussignés, MyLegal Banking Services, certifions que la société <strong>${company}</strong>, représentée par M/Mme <strong>${userName}</strong>, est titulaire du compte courant.</p>`;
      case "doc-releve":
        return `<h3>Derniers mouvements - Compte ${profile?.currency}</h3>
          <p>Date: ${dateStr}</p>`;
      default:
        return `<p>Document officiel MyLegal pour ${userName}</p>`;
    }
  };

  const generateDocumentFile = async (docId: string, docName: string) => {
    const content = getDocumentTemplate(docId);
    const htmlContent = `<html><head><meta charset="UTF-8"></head>
      <body style="font-family: sans-serif; padding: 40px; color: #333;">
        ${content}
        <p style="margin-top: 60px; font-size: 10px; color: #aaa;">MYLEGAL SARL — Casablanca</p>
      </body></html>`;
    try {
      const path = `${FileSystem.cacheDirectory}${docName.replace(/\s+/g, "_")}.html`;
      await FileSystem.writeAsStringAsync(path, htmlContent);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: "text/html", dialogTitle: docName });
      } else {
        Alert.alert("Fichier généré", `Sauvegardé : ${path}`);
      }
    } catch {
      showToast({
        title: "Erreur",
        description: "Impossible de générer le document.",
        variant: "destructive",
      });
    }
  };

  const handleAction = async (docId: string, docName: string, action: "download" | "share" | "email") => {
    setProcessingId(`${docId}-${action}`);
    if (action === "download" || action === "share") {
      await generateDocumentFile(docId, docName);
    }
    showToast({
      title: action === "download" ? "Téléchargement prêt" : action === "share" ? "Partage prêt" : "Email préparé",
      description: `Le document ${docName} est prêt.`,
      variant: "success",
    });
    setProcessingId(null);
  };

  if (!profile) return null;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 140 }}>
      <View className="px-4 pt-4">
        <View className="mb-4">
          <Text className="text-xl font-black text-slate-900">Documents officiels</Text>
          <Text className="text-sm text-slate-500 mt-1">
            Gérez et téléchargez vos attestations bancaires.
          </Text>
        </View>

        {STANDARD_DOCUMENTS.map((doc) => {
          const Icon = doc.Icon;
          return (
            <Card key={doc.id} className="mb-3 p-4">
              <View className="flex-row items-start mb-4">
                <View className="h-12 w-12 rounded-2xl bg-indigo-50 items-center justify-center mr-3">
                  <Icon size={22} color="#4338CA" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900">{doc.name}</Text>
                  <Text className="text-[11px] text-slate-500 mt-0.5">{doc.description}</Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-10 border-indigo-100 bg-indigo-50"
                  onPress={() => handleAction(doc.id, doc.name, "download")}
                  disabled={!!processingId}
                  loading={processingId === `${doc.id}-download`}
                >
                  <Download size={14} color="#4338CA" />
                  <Text className="text-xs font-bold text-indigo-700">PDF</Text>
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 h-10 bg-slate-50"
                  onPress={() => handleAction(doc.id, doc.name, "email")}
                >
                  <Mail size={14} color="#475569" />
                  <Text className="text-xs font-bold text-slate-700">Email</Text>
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 h-10 bg-slate-50"
                  onPress={() => handleAction(doc.id, doc.name, "share")}
                >
                  <Share2 size={14} color="#475569" />
                  <Text className="text-xs font-bold text-slate-700">Partager</Text>
                </Button>
              </View>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}
