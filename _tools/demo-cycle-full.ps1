# Records the full commercial cycle end-to-end (UC1), now hands-free: only the company's
# "Confirmer les modalités" is tapped; validation, signature (generated in background) and
# payment happen automatically. Fixed coordinates (1080x2400). Assumes the app is on Home.
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$env:ANDROID_SERIAL = "emulator-5554"
function Tap([int]$x,[int]$y) { & $adb shell input tap $x $y | Out-Null }
function Pause([int]$ms) { Start-Sleep -Milliseconds $ms }

$rec = Start-Process -FilePath $adb -ArgumentList "shell","screenrecord","--time-limit","180","--bit-rate","8000000","/sdcard/cyclefull.mp4" -PassThru
Pause 1800

# Start: Home → Menu → Devis → open the commercial cycle
Tap 898 2232;  Pause 2600     # Menu tab
Tap 540 1686;  Pause 3000     # Devis
Tap 540 726;   Pause 2500     # Démarrer le cycle commercial

# Auto: client validates (≤10s) → bon de commande → signature électronique générée en
# arrière-plan → facture. The stepper advances on its own; just let it play.
Pause 22000

# The one company action: choose & confirm the payment modalities.
Tap 584 1854;  Pause 2800     # Confirmer les modalités

# Auto: client pays (≤10s) → encaissement rapproché.
Pause 14000

# Hold on the completed "Encaissé" state.
Pause 2500

& $adb shell pkill -INT screenrecord | Out-Null
Pause 2500
try { if (-not $rec.HasExited) { $rec.Kill() } } catch {}
$out = "c:\Users\Lenovo\Documents\MyLegal\Amano\docs\prototype"
New-Item -ItemType Directory -Force -Path $out | Out-Null
& $adb pull /sdcard/cyclefull.mp4 "$out\amano-uc1-cycle-auto.mp4"
"DONE -> $out\amano-uc1-cycle-auto.mp4"
