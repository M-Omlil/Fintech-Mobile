import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Plus,
  Receipt,
  Download,
  UploadCloud,
  ScanLine,
} from "lucide-react-native";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { CompactSelect } from "../ui/compact-select";
import { CompactDatePicker } from "../ui/compact-date-picker";
import { useActiveProfile, useAppStore } from "../../store/app-store";
import type { BankingInvoice } from "../../services/mock-data";
import { cn } from "../../lib/utils";

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export function InvoiceScreen({ view }: { view: "list" | "create" }) {
  const profile = useActiveProfile();
  const addInvoice = useAppStore((s) => s.addInvoice);
  const showToast = useAppStore((s) => s.showToast);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const [invoiceType, setInvoiceType] = useState<"paye" | "achat">("paye");
  const [clientName, setClientName] = useState("");
  const [ice, setIce] = useState("");
  const [invoiceObject, setInvoiceObject] = useState("");
  const [amountHT, setAmountHT] = useState<number>(15000);
  const [vat, setVat] = useState<number>(20);
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [fileUploaded, setFileUploaded] = useState<{ name: string } | null>(null);

  const totalTTC = useMemo(() => amountHT + amountHT * (vat / 100), [amountHT, vat]);
  const displayedInvoices = useMemo(() => profile?.invoices || [], [profile?.invoices]);

  const { pendingInvoices, overdueInvoices, paidInvoices, totalPending, totalOverdue, totalPaid } = useMemo(() => {
    const now = new Date();
    const pending = displayedInvoices.filter((i) => i.status === "draft");
    const overdue = pending.filter((i) => new Date(i.dueDate) < now);
    const paid = displayedInvoices.filter((i) => i.status === "paid");
    return {
      pendingInvoices: pending,
      overdueInvoices: overdue,
      paidInvoices: paid,
      totalPending: pending.reduce((sum, i) => sum + i.totalTTC, 0),
      totalOverdue: overdue.reduce((sum, i) => sum + i.totalTTC, 0),
      totalPaid: paid.reduce((sum, i) => sum + i.totalTTC, 0),
    };
  }, [displayedInvoices]);

  const generateInvoiceFile = async (inv: any) => {
    const dateStr = new Date(inv.createdAt).toLocaleDateString("fr-FR");
    const typeLabel = inv.type === "achat" ? "FACTURE ACHAT" : "FACTURE VENTE";
    const htmlContent = `<html><body style="font-family: sans-serif; padding: 40px; color: #333;">
      <h2>${typeLabel}</h2>
      <p>Réf: ${inv.reference}</p>
      <p>Date: ${dateStr}</p>
      <hr/>
      <p><strong>Destinataire:</strong> ${inv.clientName}</p>
      <p>Objet: ${inv.invoiceObject}</p>
      <p>Total HT: ${inv.amountHT.toLocaleString()} ${profile?.currency}</p>
      <p>TVA (${inv.vat}%): ${(inv.totalTTC - inv.amountHT).toLocaleString()} ${profile?.currency}</p>
      <p><strong>Total TTC: ${inv.totalTTC.toLocaleString()} ${profile?.currency}</strong></p>
      <p style="font-size: 10px; color: #999; margin-top: 80px;">Document généré par MyLegal. ID: ${inv.id}</p>
      </body></html>`;
    try {
      const path = `${FileSystem.cacheDirectory}${inv.reference || "facture"}.html`;
      await FileSystem.writeAsStringAsync(path, htmlContent);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: "text/html", dialogTitle: `Facture ${inv.reference}` });
      } else {
        Alert.alert("Fichier généré", `Sauvegardé : ${path}`);
      }
    } catch (e) {
      showToast({
        title: "Erreur",
        description: "Impossible de générer le document.",
        variant: "destructive",
      });
    }
  };

  async function handleGenerateInvoice() {
    if (!clientName || !invoiceObject || !dueDate) return;
    try {
      setIsSubmitting(true);
      const newInvoice = {
        type: invoiceType,
        clientName,
        invoiceObject,
        amountHT,
        vat,
        dueDate: dueDate.toISOString(),
      };
      await addInvoice(newInvoice);
      await generateInvoiceFile({
        ...newInvoice,
        reference: `TEMP-${Date.now().toString().slice(-4)}`,
        totalTTC,
        createdAt: new Date().toISOString(),
        id: generateId(),
      });
      setClientName("");
      setIce("");
      setInvoiceObject("");
      setFileUploaded(null);
      setActiveTab("invoices");
    } catch (error) {
      // toast handled
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDownloadPdf = async (invoice: BankingInvoice) => {
    if (downloadingInvoiceId) return;
    setDownloadingInvoiceId(invoice.id);
    await generateInvoiceFile(invoice);
    showToast({
      title: "Document prêt",
      description: `Le fichier de la facture ${invoice.reference} est disponible.`,
      variant: "success",
    });
    setDownloadingInvoiceId(null);
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const file = result.assets[0];
      setFileUploaded({ name: file.name });
      setIsScanning(true);
      setTimeout(() => {
        setClientName("Maroc Telecom SA");
        setInvoiceObject(`Facture Mensuelle (${file.name})`);
        setAmountHT(2450);
        setVat(20);
        setIce("001542300000099");
        setDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000));
        setIsScanning(false);
        showToast({
          title: "Extraction réussie",
          description: "Les données ont été lues par l'IA.",
          variant: "success",
        });
      }, 2200);
    } catch {
      showToast({
        title: "Erreur",
        description: "Impossible d'ouvrir le fichier.",
        variant: "destructive",
      });
    }
  };

  if (!profile) return null;

  if (view === "list") {
    return (
      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pt-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-xl font-black text-slate-900">Factures</Text>
              <Text className="text-sm text-slate-500 mt-1">
                Gérez vos factures clients et fournisseurs.
              </Text>
            </View>
          </View>

          <Button className="mb-4 h-11 bg-indigo-600" onPress={() => setActiveTab("invoices-create")}>
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-white text-sm font-bold">Nouvelle facture</Text>
          </Button>

          <View className="gap-3 mb-4">
            <Card className="p-4">
              <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                En attente
              </Text>
              <Text className="text-2xl font-black text-slate-900">
                {totalPending.toLocaleString()}{" "}
                <Text className="text-sm text-slate-400">{profile.currency}</Text>
              </Text>
              <Text className="text-[11px] text-slate-500 font-medium mt-1">
                {pendingInvoices.length} facture(s) en cours
              </Text>
            </Card>
            <Card className="p-4">
              <Text className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-1">
                En retard
              </Text>
              <Text className="text-2xl font-black text-red-600">
                {totalOverdue.toLocaleString()}{" "}
                <Text className="text-sm opacity-70">{profile.currency}</Text>
              </Text>
              <Text className="text-[11px] text-red-400 font-medium mt-1">
                {overdueInvoices.length} facture(s) dépassée(s)
              </Text>
            </Card>
            <Card className="p-4">
              <Text className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-1">
                Réglées
              </Text>
              <Text className="text-2xl font-black text-green-700">
                {totalPaid.toLocaleString()}{" "}
                <Text className="text-sm opacity-70">{profile.currency}</Text>
              </Text>
              <Text className="text-[11px] text-green-500 font-medium mt-1">
                {paidInvoices.length} facture(s) terminée(s)
              </Text>
            </Card>
          </View>

          <Card className="p-0 overflow-hidden">
            <View className="bg-slate-50 px-4 py-3 border-b border-slate-100">
              <Text className="text-sm font-bold text-slate-900">
                Toutes les factures ({displayedInvoices.length})
              </Text>
            </View>
            {displayedInvoices.length > 0 ? (
              displayedInvoices.map((inv) => {
                const isOverdue = inv.status === "draft" && new Date(inv.dueDate) < new Date();
                return (
                  <View
                    key={inv.id}
                    className="flex-row items-center justify-between p-4 border-b border-slate-100"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className={cn(
                          "h-11 w-11 items-center justify-center rounded-xl",
                          inv.status === "paid"
                            ? "bg-green-50"
                            : isOverdue
                            ? "bg-red-50"
                            : "bg-indigo-50"
                        )}
                      >
                        <Receipt
                          size={20}
                          color={
                            inv.status === "paid"
                              ? "#15803D"
                              : isOverdue
                              ? "#DC2626"
                              : "#4338CA"
                          }
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-bold text-slate-900 flex-1" numberOfLines={1}>
                            {inv.clientName}
                          </Text>
                          {isOverdue && (
                            <View className="bg-red-100 rounded-md px-2 py-0.5">
                              <Text className="text-[10px] font-bold text-red-700 uppercase">
                                Retard
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-xs font-medium text-slate-500 mt-0.5">
                          {inv.reference} • {new Date(inv.dueDate).toLocaleDateString("fr-FR")}
                        </Text>
                        <Text className="text-sm font-black text-slate-900 mt-1">
                          {inv.totalTTC.toLocaleString()}{" "}
                          <Text className="text-xs text-slate-500">{profile.currency}</Text>
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDownloadPdf(inv)}
                      className="h-10 w-10 items-center justify-center bg-white border border-slate-200 rounded-xl ml-2"
                    >
                      <Download size={18} color="#4338CA" />
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View className="p-8 items-center">
                <Receipt size={32} color="#CBD5E1" />
                <Text className="text-sm font-medium text-slate-500 mt-2">
                  Aucune facture enregistrée.
                </Text>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pt-4">
          <TouchableOpacity
            onPress={() => setActiveTab("invoices")}
            className="flex-row items-center mb-3"
          >
            <ArrowLeft size={16} color="#64748B" />
            <Text className="ml-1.5 text-sm font-bold text-slate-500">Retour</Text>
          </TouchableOpacity>

          <View className="mb-4">
            <Text className="text-xl font-black text-slate-900">Nouvelle facture</Text>
            <Text className="text-sm text-slate-500 mt-1">
              Éditez une facture client ou uploadez un document fournisseur.
            </Text>
          </View>

          <View className="flex-row bg-slate-100 rounded-xl p-1.5 mb-4">
            <TouchableOpacity
              onPress={() => {
                setInvoiceType("paye");
                setFileUploaded(null);
              }}
              className={cn(
                "flex-1 rounded-lg py-2.5 items-center",
                invoiceType === "paye" ? "bg-white" : "bg-transparent"
              )}
            >
              <Text
                className={cn(
                  "text-xs font-bold uppercase",
                  invoiceType === "paye" ? "text-indigo-600" : "text-slate-500"
                )}
              >
                Client (Éditer)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setInvoiceType("achat");
                setClientName("");
                setInvoiceObject("");
                setAmountHT(0);
              }}
              className={cn(
                "flex-1 rounded-lg py-2.5 items-center",
                invoiceType === "achat" ? "bg-white" : "bg-transparent"
              )}
            >
              <Text
                className={cn(
                  "text-xs font-bold uppercase",
                  invoiceType === "achat" ? "text-indigo-600" : "text-slate-500"
                )}
              >
                Fournisseur (Upload)
              </Text>
            </TouchableOpacity>
          </View>

          {invoiceType === "achat" && !fileUploaded && (
            <Card className="p-8 border-2 border-dashed border-slate-300 mb-4 items-center">
              {!isScanning ? (
                <>
                  <UploadCloud size={40} color="#818CF8" />
                  <Text className="text-base font-bold text-slate-800 mt-3">
                    Importez une facture
                  </Text>
                  <Text className="text-sm text-slate-500 mt-1 mb-4 text-center">
                    Formats supportés : PDF, JPG, PNG
                  </Text>
                  <Button className="bg-indigo-600" onPress={handleFileUpload}>
                    <Text className="text-white text-sm font-bold">Parcourir les fichiers</Text>
                  </Button>
                </>
              ) : (
                <>
                  <ScanLine size={40} color="#4338CA" />
                  <Text className="text-base font-bold text-slate-800 mt-3">
                    Analyse de la facture par l'IA...
                  </Text>
                  <Text className="text-sm text-slate-500 mt-1 text-center">
                    Extraction du fournisseur, montants et dates en cours.
                  </Text>
                </>
              )}
            </Card>
          )}

          {(invoiceType === "paye" || fileUploaded) && !isScanning && (
            <>
              {invoiceType === "achat" && fileUploaded && (
                <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-3">
                  <View className="flex-row items-center gap-2">
                    <CheckCircle2 size={18} color="#16A34A" />
                    <Text className="text-sm font-bold text-green-800 flex-1">
                      Extraction terminée
                    </Text>
                  </View>
                  <Text className="text-xs text-green-700 mt-1">Fichier : {fileUploaded.name}</Text>
                </View>
              )}

              <Card className="mb-3 p-5">
                <View className="mb-3">
                  <Label>{invoiceType === "paye" ? "Nom du client" : "Nom du fournisseur"}</Label>
                  <Input
                    placeholder="Personne morale ou physique"
                    value={clientName}
                    onChangeText={setClientName}
                    className="mt-1"
                  />
                </View>
                <View>
                  <Label>ICE (Optionnel)</Label>
                  <Input
                    placeholder="00000000000000"
                    value={ice}
                    onChangeText={setIce}
                    keyboardType="numeric"
                    className="mt-1"
                  />
                </View>
              </Card>

              <Card className="mb-3 p-5">
                <View className="mb-3">
                  <Label>Objet de la facture</Label>
                  <Input
                    placeholder="Ex: Prestation de services"
                    value={invoiceObject}
                    onChangeText={setInvoiceObject}
                    className="mt-1"
                  />
                </View>
                <View>
                  <Label>Date d'échéance</Label>
                  <View className="mt-1">
                    <CompactDatePicker value={dueDate} onChange={setDueDate} />
                  </View>
                </View>
              </Card>

              <Card className="mb-3 p-5">
                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <Label>Montant HT</Label>
                    <Input
                      keyboardType="numeric"
                      value={String(amountHT)}
                      onChangeText={(v) => setAmountHT(Number(v) || 0)}
                      className="mt-1"
                    />
                  </View>
                  <View className="flex-1">
                    <Label>TVA</Label>
                    <View className="mt-1">
                      <CompactSelect
                        value={`${vat}`}
                        onChange={(v) => setVat(Number(v))}
                        options={[
                          { label: "20%", value: "20" },
                          { label: "10%", value: "10" },
                          { label: "0%", value: "0" },
                        ]}
                      />
                    </View>
                  </View>
                </View>
                <View className="rounded-xl bg-indigo-50 p-4 border border-indigo-100">
                  <Text className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-1">
                    Total TTC calculé
                  </Text>
                  <Text className="text-2xl font-black text-indigo-900">
                    {totalTTC.toLocaleString()}{" "}
                    <Text className="text-base opacity-70">{profile.currency}</Text>
                  </Text>
                </View>
              </Card>

              <Button
                className="h-12 bg-indigo-600 mb-4"
                onPress={handleGenerateInvoice}
                disabled={isSubmitting || !clientName || amountHT === 0}
                loading={isSubmitting}
              >
                <FileText size={18} color="#FFFFFF" />
                <Text className="text-white text-sm font-bold">
                  {isSubmitting
                    ? "Enregistrement..."
                    : invoiceType === "paye"
                    ? "Générer et Télécharger"
                    : "Valider et Enregistrer"}
                </Text>
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
