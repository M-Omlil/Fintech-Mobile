"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CompactSelect } from "@/components/ui/compact-select";
import { CompactDatePicker } from "@/components/ui/compact-date-picker";
import { useActiveProfile, useAppStore } from "@/store/app-store";
import { ArrowLeft, CheckCircle2, Clock3, FileText, Plus, Receipt, Download, Loader2, UploadCloud, ScanLine } from "lucide-react";
import type { BankingInvoice } from "@/services/mock-data";
import { cn } from "@/lib/utils";

const LOGO_URL = "https://i.ibb.co/Fk5yz9xF/logo-light.png";

export function InvoiceScreen({ view }: { view: "list" | "create" }) {

  const profile = useActiveProfile();
  const { addInvoice, showToast, setActiveTab } = useAppStore();
  const storageReadyRef = useRef(false);
  
  const [isMounted, setIsMounted] = useState(false);

  // --- ÉTATS DU FORMULAIRE ---
  const [invoiceType, setInvoiceType] = useState<"paye" | "achat">("paye");
  const [clientName, setClientName] = useState("");
  const [ice, setIce] = useState("");
  const [address, setAddress] = useState("");
  const [invoiceObject, setInvoiceObject] = useState("");
  const [amountHT, setAmountHT] = useState<number>(15000);
  const [vat, setVat] = useState<number>(20);
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  // --- NOUVEAU: ÉTATS POUR L'OCR FOURNISSEUR ---
  const [isScanning, setIsScanning] = useState(false);
  const [fileUploaded, setFileUploaded] = useState<File | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  // Lecture / Sauvegarde LocalStorage (uniquement pour les factures clients manuelles)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("fintech.invoice-form");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.invoiceType === "paye") {
          setInvoiceType("paye");
          setClientName(parsed.clientName ?? "");
          setIce(parsed.ice ?? "");
          setAddress(parsed.address ?? "");
          setInvoiceObject(parsed.invoiceObject ?? "");
          setAmountHT(parsed.amountHT ?? 15000);
          setVat(parsed.vat ?? 20);
          setDueDate(parsed.dueDateIso ? new Date(parsed.dueDateIso) : new Date());
        }
      }
    } catch { } finally { storageReadyRef.current = true; }
  }, []);

  useEffect(() => {
    if (storageReadyRef.current && invoiceType === "paye") {
      window.localStorage.setItem("fintech.invoice-form", JSON.stringify({
        invoiceType, clientName, ice, address, invoiceObject, amountHT, vat,
        dueDateIso: dueDate ? dueDate.toISOString() : null
      }));
    }
  }, [invoiceType, clientName, ice, address, invoiceObject, amountHT, vat, dueDate]);

  const totalTTC = useMemo(() => amountHT + amountHT * (vat / 100), [amountHT, vat]);

  // Toutes les factures unifiées pour la vue liste
  const displayedInvoices = useMemo(() => profile?.invoices || [], [profile?.invoices]);

  // --- CALCUL DES KPI ---
  const { pendingInvoices, overdueInvoices, paidInvoices, totalPending, totalOverdue, totalPaid } = useMemo(() => {
    const now = new Date();
    const pending = displayedInvoices.filter(i => i.status === "draft");
    const overdue = pending.filter(i => new Date(i.dueDate) < now);
    const paid = displayedInvoices.filter(i => i.status === "paid");

    return {
      pendingInvoices: pending,
      overdueInvoices: overdue,
      paidInvoices: paid,
      totalPending: pending.reduce((sum, i) => sum + i.totalTTC, 0),
      totalOverdue: overdue.reduce((sum, i) => sum + i.totalTTC, 0),
      totalPaid: paid.reduce((sum, i) => sum + i.totalTTC, 0)
    };
  }, [displayedInvoices]);

  // --- FONCTION DE GÉNÉRATION DE DOCUMENT RÉEL ---
  const generateInvoiceFile = (inv: any) => {
    const dateStr = new Date(inv.createdAt).toLocaleDateString('fr-FR');
    const typeLabel = (inv as any).type === "achat" ? "FACTURE ACHAT" : "FACTURE VENTE";
    
    const htmlContent = `
      <html>
        <body style="font-family: sans-serif; padding: 40px; color: #333;">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <img src="${LOGO_URL}" alt="MyLegal" style="height: 50px; width: auto;" />              <p>Casablanca, Maroc</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0;">${typeLabel}</h2>
              <p>Réf: ${inv.reference}</p>
              <p>Date: ${dateStr}</p>
            </div>
          </div>
          <hr style="margin: 40px 0; border: 1px solid #eee;" />
          <div style="margin-bottom: 40px;">
            <p><strong>Destinataire / Tiers:</strong></p>
            <p>${inv.clientName}</p>
            <p>Objet: ${inv.invoiceObject}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #F8FAFC;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eee;">Description</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${inv.invoiceObject}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">${inv.amountHT.toLocaleString()} ${profile?.currency}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-left: auto; width: 250px; margin-top: 40px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Total HT:</span> <span>${inv.amountHT.toLocaleString()} ${profile?.currency}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>TVA (${inv.vat}%):</span> <span>${(inv.totalTTC - inv.amountHT).toLocaleString()} ${profile?.currency}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #333; font-weight: bold; font-size: 18px;">
              <span>Total TTC:</span> <span>${inv.totalTTC.toLocaleString()} ${profile?.currency}</span>
            </div>
          </div>
          <div style="margin-top: 100px; font-size: 10px; color: #999; text-align: center;">
            Document généré par la plateforme MyLegal. Identifiant unique: ${inv.id}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${inv.reference}-${inv.clientName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      
      generateInvoiceFile({
        ...newInvoice,
        reference: `TEMP-${Date.now().toString().slice(-4)}`,
        totalTTC,
        createdAt: new Date().toISOString(),
        id: crypto.randomUUID()
      });

      setClientName(""); setIce(""); setAddress(""); setInvoiceObject(""); setFileUploaded(null);
      setActiveTab("invoices");
      showToast({ title: "Facture enregistrée", description: "Le fichier a été généré et sauvegardé avec succès.", variant: "success" });
    } catch (error) { } finally { setIsSubmitting(false); }
  }

  const handleDownloadPdf = (invoice: BankingInvoice) => {
    if (downloadingInvoiceId) return; 
    setDownloadingInvoiceId(invoice.id);
    setTimeout(() => {
      generateInvoiceFile(invoice);
      showToast({ title: "Document prêt", description: `Le fichier de la facture ${invoice.reference} est disponible.`, variant: "success" });
      setDownloadingInvoiceId(null);
    }, 1000);
  };

  // --- NOUVEAU: LOGIQUE DE SCAN OCR FOURNISSEUR ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploaded(file);
    setIsScanning(true);

    // Simulation de l'extraction de données par IA (OCR)
    setTimeout(() => {
      setClientName("Maroc Telecom SA");
      setInvoiceObject(`Facture Mensuelle Internet & Mobile (${file.name})`);
      setAmountHT(2450);
      setVat(20);
      setIce("001542300000099");
      setDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)); // +15 jours
      
      setIsScanning(false);
      showToast({
        title: "Extraction réussie",
        description: "Les données de la facture ont été lues et pré-remplies par l'IA.",
        variant: "success"
      });
    }, 2800);
  };

  if (!isMounted || !profile) return null;

  // ==========================================
  // VUE 1 : DASHBOARD DES FACTURES (LISTE UNIFIÉE)
  // ==========================================
  if (view === "list") {
    return (
      <section className="animate-floatIn space-y-5 pb-20 md:pb-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-none">
          <div>
            <h1 className="text-xl font-black text-slate-900 md:text-2xl">Factures</h1>
            <p className="text-sm text-slate-500 mt-1">Gérez l'ensemble de vos factures clients et fournisseurs.</p>
          </div>
          <Button onClick={() => setActiveTab("invoices-create")} className="w-full sm:w-auto h-11 flex items-center gap-2 shadow-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus size={18} /> Nouvelle facture
          </Button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">En attente</p>
            <p className="text-3xl font-black text-slate-900">
              {totalPending.toLocaleString()} <span className="text-base font-bold text-slate-400">{profile.currency}</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">{pendingInvoices.length} facture(s) en cours</p>
          </Card>

          <Card className="p-5 bg-white border-red-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-2">En retard</p>
            <p className="text-3xl font-black text-red-600">
              {totalOverdue.toLocaleString()} <span className="text-base font-bold opacity-70">{profile.currency}</span>
            </p>
            <p className="text-[11px] text-red-400 font-medium mt-1">{overdueInvoices.length} facture(s) dépassée(s)</p>
          </Card>

          <Card className="p-5 bg-white border-green-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-2">Réglées</p>
            <p className="text-3xl font-black text-green-700">
              {totalPaid.toLocaleString()} <span className="text-base font-bold opacity-70">{profile.currency}</span>
            </p>
            <p className="text-[11px] text-green-500 font-medium mt-1">{paidInvoices.length} facture(s) terminée(s)</p>
          </Card>
        </div>

        <Card className="bg-white p-0 overflow-hidden border-slate-100 shadow-sm">
          <div className="bg-slate-50/50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
             <h2 className="text-sm font-bold text-slate-900">Toutes les factures ({displayedInvoices.length})</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {displayedInvoices.length > 0 ? displayedInvoices.map((inv) => {
              const isOverdue = inv.status === "draft" && new Date(inv.dueDate) < new Date();
              
              return (
                <li key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-11 w-11 flex items-center justify-center rounded-xl shrink-0 shadow-sm", inv.status === "paid" ? "bg-green-50 text-green-600" : isOverdue ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600")}>
                      <Receipt size={20}/>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[250px]">{inv.clientName}</p>
                        {isOverdue && <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">Retard</span>}
                      </div>
                      <p className="text-xs font-medium text-slate-500">{inv.reference} • Échéance : {new Date(inv.dueDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 w-full sm:w-auto">
                    <div className="flex flex-col items-start sm:items-end">
                      <p className="text-sm font-black text-slate-900">{inv.totalTTC.toLocaleString()} <span className="text-[11px] text-slate-500">{profile.currency}</span></p>
                      <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-1", inv.status === "paid" ? "text-green-600" : "text-orange-500")}>
                        {inv.status === "paid" ? "Payée" : "En attente"}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDownloadPdf(inv)} 
                      className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 rounded-xl transition-all shadow-sm"
                    >
                      {downloadingInvoiceId === inv.id ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
                    </button>
                  </div>
                </li>
              );
            }) : (
              <li className="p-12 text-center">
                <Receipt size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">Aucune facture enregistrée.</p>
              </li>
            )}
          </ul>
        </Card>
      </section>
    );
  }

  // ==========================================
  // VUE 2 : CRÉATION (AVEC UPLOAD OCR FOURNISSEUR)
  // ==========================================
  return (
    <section className="animate-slideInRight space-y-5 pb-20 md:pb-6">
      <button 
        onClick={() => setActiveTab("invoices")} 
        className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
      >
        <ArrowLeft size={16} className="mr-1.5" /> Retour
      </button>

      <header className="bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-none">
        <h1 className="text-xl font-black text-slate-900 md:text-2xl">Nouvelle facture</h1>
        <p className="text-sm text-slate-500 mt-1">Éditez une facture client ou uploadez un document fournisseur pour une lecture par IA.</p>
      </header>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5 border border-slate-200">
        <button 
          onClick={() => { setInvoiceType("paye"); setFileUploaded(null); }} 
          className={cn("rounded-lg px-3 py-2.5 text-sm font-bold transition-all uppercase tracking-wide", invoiceType === "paye" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900")}
        >
          Facture Client (Éditer)
        </button>
        <button 
          onClick={() => { setInvoiceType("achat"); setClientName(""); setInvoiceObject(""); setAmountHT(0); }} 
          className={cn("rounded-lg px-3 py-2.5 text-sm font-bold transition-all uppercase tracking-wide", invoiceType === "achat" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900")}
        >
          Facture Fournisseur (Upload)
        </button>
      </div>

      {invoiceType === "achat" && !fileUploaded && (
        <Card className="col-span-1 md:col-span-2 p-12 border-dashed border-2 border-slate-300 flex flex-col items-center justify-center text-center bg-white shadow-sm mb-4">
          {!isScanning ? (
            <>
              <UploadCloud size={48} className="text-indigo-400 mb-4" />
              <p className="text-base font-bold text-slate-800">Importez une facture fournisseur</p>
              <p className="text-sm text-slate-500 mt-1 mb-6">Formats supportés : PDF, JPG, PNG (Max 5Mo)</p>
              <Input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" id="file-upload" />
              <Label 
                htmlFor="file-upload" 
                className="cursor-pointer px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm"
              >
                Parcourir les fichiers
              </Label>
            </>
          ) : (
            <>
              <ScanLine size={48} className="text-indigo-600 animate-pulse mb-4" />
              <p className="text-base font-bold text-slate-800">Analyse de la facture par l'IA...</p>
              <p className="text-sm text-slate-500 mt-1">Extraction du fournisseur, montants et dates en cours.</p>
            </>
          )}
        </Card>
      )}

      {/* On n'affiche le formulaire que si on est en création client, OU si une facture fournisseur a été scannée */}
      {(invoiceType === "paye" || fileUploaded) && !isScanning && (
        <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {invoiceType === "achat" && fileUploaded && (
            <div className="col-span-full mb-2 flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600" size={20} />
                <div>
                  <p className="text-sm font-bold">Extraction terminée avec succès</p>
                  <p className="text-xs mt-0.5 opacity-80">Fichier lu : {fileUploaded.name}. Vous pouvez vérifier et modifier les données extraites ci-dessous avant d'enregistrer.</p>
                </div>
              </div>
              <Button 
                variant={"ghost" as any} 
                onClick={() => { setFileUploaded(null); setClientName(""); setInvoiceObject(""); setAmountHT(0); }}
                className="text-xs font-bold text-green-700 hover:bg-green-100 h-9"
              >
                Scanner un autre document
              </Button>
            </div>
          )}

          <Card className="p-5 lg:p-6 bg-white border-slate-100 shadow-sm space-y-5">
            <div>
              <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                {invoiceType === "paye" ? "Nom du client" : "Nom du fournisseur"}
              </Label>
              <Input placeholder="Société ou Indépendant" value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1.5 h-11 text-sm font-medium shadow-sm" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">ICE (Optionnel)</Label>
              <Input placeholder="00000000000000" value={ice} onChange={(e) => setIce(e.target.value)} className="mt-1.5 h-11 text-sm font-medium shadow-sm" />
            </div>
          </Card>

          <Card className="p-5 lg:p-6 bg-white border-slate-100 shadow-sm space-y-5">
            <div>
              <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Objet de la facture</Label>
              <Input placeholder="Ex: Prestation de services" value={invoiceObject} onChange={(e) => setInvoiceObject(e.target.value)} className="mt-1.5 h-11 text-sm font-medium shadow-sm" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Date d'échéance</Label>
              <div className="mt-1.5">
                 <CompactDatePicker value={dueDate} onChange={setDueDate} />
              </div>
            </div>
          </Card>

          <Card className="p-5 lg:p-6 bg-white border-slate-100 shadow-sm space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Montant HT</Label>
                <Input type="number" value={amountHT} onChange={(e) => setAmountHT(Number(e.target.value))} className="mt-1.5 h-11 text-sm font-medium shadow-sm" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">TVA</Label>
                <div className="mt-1.5">
                  <CompactSelect value={`${vat}`} onChange={(v) => setVat(Number(v))} options={[{label:"20%", value:"20"}, {label:"10%", value:"10"}, {label:"0%", value:"0"}]} />
                </div>
              </div>
            </div>
            
            <div className="rounded-xl bg-indigo-50/50 p-4 border border-indigo-100 text-indigo-900 mt-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Total TTC calculé</p>
              <p className="text-3xl font-black text-indigo-900">{totalTTC.toLocaleString()} <span className="text-lg font-bold opacity-70">{profile.currency}</span></p>
            </div>
          </Card>

          <Card className="p-5 lg:p-6 bg-white border-slate-100 shadow-sm flex flex-col justify-end">
            <Button className="w-full h-12 text-sm shadow-md font-bold bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleGenerateInvoice} disabled={isSubmitting || !clientName || amountHT === 0}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18}/> : <FileText className="mr-2" size={18}/>}
              {isSubmitting 
                ? "Enregistrement en cours..." 
                : invoiceType === "paye" 
                  ? "Générer et Télécharger PDF" 
                  : "Valider et Enregistrer"
              }
            </Button>
          </Card>
        </div>
      )}
    </section>
  );
}