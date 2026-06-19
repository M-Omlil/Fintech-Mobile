# Amano — Prototype screen recordings

Captured on the `amano_pixel` emulator (Expo Go), demo persona **ByteStore — Informatique & Réseaux**
(sole-proprietor IT-hardware retailer, Casablanca, MAD).

| File | Flow | Covers |
|------|------|--------|
| `amano-uc1-cycle-auto.mp4` | **Current.** Devis → cycle commercial : validation client (auto ≤10s) → bon de commande → **signature électronique générée en arrière-plan** → facture (auto) → mode de paiement → encaissement rapproché. Hands-free — the only tap is "Confirmer les modalités". | UC1 full chain, no simulation buttons |
| `amano-uc1-facture.mp4` | Accueil → Facturation → Nouvelle facture → client + ICE → ligne depuis références → conditions de paiement → Aperçu → Valider et envoyer | AMA-001/002/003/004/005 |
| `amano-app-tour.mp4` | Tabs (Accueil / Transactions / Cartes / Menu) → Factures fournisseurs (UC2 import/scan) → Liste des clients (ICE) | App breadth, UC2 entry, beneficiaries |
| `amano-uc1-cycle-signature.mp4` | _Superseded._ Earlier cycle with a manually-drawn signature inline. | — |

The cycle screen is [CommercialCycleScreen.tsx](../../src/features/invoicing/cycle/CommercialCycleScreen.tsx);
the Bons de commande list/detail is [orders/](../../src/features/invoicing/orders/) (Menu → Bons de
commande). The client-side steps run automatically via timers (`clientActionDelay()`), and the
signature is **generated in the background** by `generateSignatureStrokes()`
([signature.ts](../../src/features/invoicing/signature.ts)) and archived as a `SignatureProof` — no
drawing pad. The recorder is `_tools/demo-cycle-full.ps1` (fixed coordinates — uiautomator dumps
drift mid-animation under screenrecord; the cycle now auto-advances so the script mostly waits).

Helper scripts live in `_tools/`, pinned to `emulator-5554`, assuming Metro on `192.168.100.113:8081`.
