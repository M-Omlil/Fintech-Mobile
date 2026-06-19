# Records the full commercial cycle (UC1) using fixed tap coordinates (no uiautomator
# dumps during capture — avoids mid-animation coordinate drift). Coordinates are taken
# from verified taps on this 1080x2400 emulator. Assumes the app is on Home.
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$env:ANDROID_SERIAL = "emulator-5554"
function Tap([int]$x,[int]$y) { & $adb shell input tap $x $y | Out-Null }
function Swipe([int]$x1,[int]$y1,[int]$x2,[int]$y2,[int]$ms) { & $adb shell input swipe $x1 $y1 $x2 $y2 $ms | Out-Null }
function Pause([int]$ms) { Start-Sleep -Milliseconds $ms }

$rec = Start-Process -FilePath $adb -ArgumentList "shell","screenrecord","--time-limit","180","--bit-rate","8000000","/sdcard/cycle.mp4" -PassThru
Pause 1800

# Navigate Home → Menu → Devis → cycle
Tap 898 2232;  Pause 2600     # Menu tab
Tap 540 1686;  Pause 2900     # Devis
Tap 540 726;   Pause 4800     # Démarrer le cycle commercial (async load)

# Validation → bon de commande (auto)
Tap 584 902;   Pause 4000     # Simuler la validation client

# Signature électronique
Tap 584 1190;  Pause 2900     # Signer le bon de commande (open sheet)
Swipe 160 1720 320 1860 220
Swipe 320 1860 470 1640 220
Swipe 470 1640 620 1860 220
Swipe 620 1860 820 1690 220;  Pause 2200   # drawn signature
Tap 540 2160;  Pause 4400     # Confirmer la signature → facture auto-generated

# Mode de paiement : ajouter Lien de paiement + Cashplus (avec Virement)
Tap 706 1612;  Pause 1000     # Lien de paiement
Tap 276 1717;  Pause 1000     # Cashplus
Tap 584 1854;  Pause 3600     # Confirmer les modalités

# Paiement & encaissement rapproché
Tap 584 1996;  Pause 4000     # Simuler le paiement
Pause 1500

& $adb shell pkill -INT screenrecord | Out-Null
Pause 2500
try { if (-not $rec.HasExited) { $rec.Kill() } } catch {}
$out = "c:\Users\Lenovo\Documents\MyLegal\Amano\docs\prototype"
New-Item -ItemType Directory -Force -Path $out | Out-Null
& $adb pull /sdcard/cycle.mp4 "$out\amano-uc1-cycle-signature.mp4"
"DONE -> $out\amano-uc1-cycle-signature.mp4"
