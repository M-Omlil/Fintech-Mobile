# Amano — Prototype screen recordings

## Demo-day script takes (one use case per video)

Recorded on the standalone release APK (1080×2400), mapping the `Script vidéo · 60s — mylegal.ma`
scenes onto the app's real flows and data (Amano / MyLegal, MAD). One file per use case:

| File | Scene | What it shows |
|------|-------|---------------|
| `mylegal-1-compte-pro.mp4` | **LE COMPTE PRO** | Accueil (solde + virement entrant +100 000) → **RIB marocain** (RIB/IBAN + QR) → **Carte** ONE |
| `mylegal-2-facture-fournisseur.mp4` | **FACTURATION · Cas 1 — facture fournisseur** | Facturation → **scan** (sélecteur de fichiers **PDF uniquement**) → extraction auto (MyLegal · 4 680 DH · RIB Attijariwafa, bénéficiaire créé) → **Préparation du virement** → valider (OTP) → **Virement émis ✓** |
| `mylegal-3-facture-client.mp4` | **FACTURATION · Cas 2 — facture client** | Facturation (factures clients) → le client paie via le lien → le popup de validation s'ouvre seul : **Facture payée · +19 800 DH · Clinique Al Madina** |
| `mylegal-4-dashboard.mp4` | **LE DASHBOARD** | 4 widgets (Solde dispo · Trésorerie 30 j · C.A ce mois · TVA due ce trimestre) + graphique **personnalisable** (Courbe → Barres → Secteurs) |

Recorded via `adb screenrecord` with paced fixed-coordinate taps; the transaction popup
(OTP → checkmark animation → reçu) is the centrepiece of Cas 1.

Captured on the `amano_pixel` emulator (Expo Go), demo persona **ByteStore — Informatique & Réseaux**
(sole-proprietor IT-hardware retailer, Casablanca, MAD).

## Process takes (standalone release APK)

Recorded on the standalone Android release build (`amano-release.apk`, data baked in — no Metro),
device 1080×2400. Three takes matching the pitch script:

| File | Take | Covers |
|------|------|--------|
| `amano-take1-compte.mp4` | **Le compte professionnel s'ouvre → IBAN apparaît → carte virtuelle activée** | Connexion (demo) → Accueil (Compte principal 65 820 DH) → RIB (QR + IBAN MA64…) → Cartes (carte ONE virtuelle active) |
| `amano-take2-facture.mp4` | **Facture créée → lien de paiement généré → « Paiement reçu ✓ »** | Devis → Démarrer le cycle commercial → validation + signature électronique (arrière-plan, auto) → **facture FV-2026/005 générée** → mode de paiement **Lien de paiement** → **Encaissé** (rapproché automatiquement) |
| `amano-take3-payer-classer.mp4` | **Paiement fournisseur effectué → espace documentaire → documents rangés par catégorie** | Effectuer un virement → Disway SA 8 500 DH → Confirmer (paiement fournisseur) → Classement → catégories (vente/achat/justificatif) → Factures d'achat → 2026 → Juin → fichiers `yyyymmdd-FA-…` + « Partager au comptable » |

Recorded via `adb screenrecord` with fixed-coordinate `input tap` (uiautomator drifts mid-recording);
the cycle's client-side steps auto-advance on `clientActionDelay()` timers.

## Earlier recordings (Expo Go)

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
