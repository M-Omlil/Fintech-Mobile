import type { InvoicePayload, LoginPayload, TransferPayload } from "./mock-data";
import { findProfileByEmail, getProfileSeed } from "./mock-data";

// FIX POUR REACT NATIVE: Remplacement de crypto.randomUUID() 
// car l'API Web Crypto n'est pas nativement disponible sur mobile sans polyfill.
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginWithCredentials(payload: LoginPayload) {
  await delay(450);

  const profile = findProfileByEmail(payload.email);
  if (!profile || profile.password !== payload.password) {
    throw new Error("Invalid credentials for the demo accounts.");
  }

  return { profileId: profile.id };
}

export async function loginWithProfile(profileId: string) {
  await delay(250);

  const profile = getProfileSeed(profileId);
  if (!profile) {
    throw new Error("Unknown profile.");
  }

  return { profileId: profile.id };
}

export async function createTransfer(payload: TransferPayload) {
  await delay(500);

  return {
    id: generateId(), // <-- Utilisé ici
    createdAt: new Date().toISOString(),
    ...payload
  };
}

export async function createInvoice(payload: InvoicePayload) {
  await delay(420);

  return {
    id: generateId(), // <-- Utilisé ici
    reference: `INV-${new Date().getFullYear()}-${`${Math.floor(Math.random() * 900) + 100}`}`,
    status: "draft" as const,
    createdAt: new Date().toISOString(),
    ...payload,
    totalTTC: payload.amountHT + payload.amountHT * (payload.vat / 100)
  };
}

export async function markInvoicePaid(invoiceId: string) {
  await delay(320);

  return { invoiceId, status: "paid" as const };
}

export async function handleDocumentAction(documentName: string, action: "download" | "share" | "email") {
  await delay(220);

  return {
    documentName,
    action,
    message: `${action} action prepared for ${documentName}.`
  };
}