import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { 
  EllipsisVertical, 
  Mail, 
  Share2, 
  Landmark, 
  FileCheck, 
  History, 
  Building2,
  Download,
  X
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveProfile, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const STANDARD_DOCUMENTS = [
  { id: "doc-rib", name: "RIB", description: "Relevé d'Identité Bancaire", icon: Landmark },
  { id: "doc-attestation", name: "Attestation bancaire", description: "Certificat de titularité", icon: FileCheck },
  { id: "doc-releve", name: "Relevé de compte", description: "Dernières transactions", icon: History },
  { id: "doc-kyc", name: "Statuts Société", description: "Documents juridiques", icon: Building2 }
];

export function DocumentsScreen() {
  const profile = useActiveProfile();
  const { showToast } = useAppStore();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = (docId: string, docName: string, action: "download" | "share" | "email") => {
    setProcessingId(`${docId}-${action}`);

    // Simulation du temps de génération du PDF
    setTimeout(() => {
      showToast({
        title: action === "download" ? "Document enregistré" : "Action effectuée",
        description: `Le document ${docName} est prêt dans vos fichiers.`,
        variant: "success"
      });
      setProcessingId(null);
    }, 1500);
  };

  if (!profile) return null;

  return (
    <ScrollView 
      className="flex-1 bg-[#F3F6F9]" 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View className="p-4 space-y-5">
        
        {/* HEADER */}
        <View className="mb-2">
          <Text className="text-2xl font-black text-[#061438]">Documents</Text>
          <Text className="text-sm text-slate-500 mt-1">Gérez et téléchargez vos attestations bancaires.</Text>
        </View>

        {/* LISTE DES DOCUMENTS */}
        <View className="space-y-4">
          {STANDARD_DOCUMENTS.map((doc) => {
            const Icon = doc.icon;
            const isDownloading = processingId === `${doc.id}-download`;
            
            return (
              <Card key={doc.id} className="p-5 bg-white border-slate-100 shadow-sm">
                
                <View className="flex-row items-start justify-between mb-6">
                  <View className="flex-row items-center flex-1">
                    <View className="h-12 w-12 flex items-center justify-center rounded-2xl bg-indigo-50 mr-4">
                      <Icon size={24} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-[#061438]">{doc.name}</Text>
                      <Text className="text-[11px] text-slate-500 mt-0.5">{doc.description}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    className="p-2"
                    onPress={() => handleAction(doc.id, doc.name, "share")}
                  >
                    <EllipsisVertical size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* BOUTONS D'ACTIONS */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={!!processingId}
                    onPress={() => handleAction(doc.id, doc.name, "download")}
                    className={cn(
                      "flex-1 h-11 flex-row items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50/50",
                      !!processingId && "opacity-50"
                    )}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#4F46E5" />
                    ) : (
                      <>
                        <Download size={14} color="#4F46E5" style={{ marginRight: 6 }} />
                        <Text className="text-[12px] font-bold text-indigo-700">PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleAction(doc.id, doc.name, "email")}
                    className="flex-1 h-11 flex-row items-center justify-center rounded-xl bg-slate-50"
                  >
                    <Mail size={14} color="#64748B" style={{ marginRight: 6 }} />
                    <Text className="text-[12px] font-bold text-slate-600">Email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleAction(doc.id, doc.name, "share")}
                    className="flex-1 h-11 flex-row items-center justify-center rounded-xl bg-slate-50"
                  >
                    <Share2 size={14} color="#64748B" style={{ marginRight: 6 }} />
                    <Text className="text-[12px] font-bold text-slate-600">Partager</Text>
                  </TouchableOpacity>
                </View>

              </Card>
            );
          })}
        </View>

        {/* INFO BOX */}
        <View className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex-row items-start gap-3">
          <View className="mt-0.5">
            <FileCheck size={18} color="#B45309" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-bold text-amber-900">Validité des documents</Text>
            <Text className="text-[11px] text-amber-800/70 mt-1 leading-4">
              Les documents générés via l'application mobile MyLegal comportent une signature numérique certifiée et sont acceptés par les administrations publiques marocaines.
            </Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}