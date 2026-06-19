# Records a UC1 (Devis/Facture) walkthrough of Amano on the emulator.
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$env:ANDROID_SERIAL = "emulator-5554"

function Tap([string]$Match, [int]$Index = 0) {
  & $adb shell uiautomator dump /sdcard/_ui.xml | Out-Null
  & $adb pull /sdcard/_ui.xml "$env:TEMP\_ui.xml" | Out-Null
  $xml = Get-Content "$env:TEMP\_ui.xml" -Raw -Encoding UTF8
  $esc = [regex]::Escape($Match)
  $pat1 = '<node[^>]*?(?:text|content-desc)="([^"]*' + $esc + '[^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
  $pat2 = '<node[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"[^>]*?(?:text|content-desc)="([^"]*' + $esc + '[^"]*)"'
  $m = [regex]::new($pat1).Matches($xml)
  if ($m.Count -gt 0) {
    $g = $m[$Index].Groups
    $cx = [int](([int]$g[2].Value + [int]$g[4].Value) / 2); $cy = [int](([int]$g[3].Value + [int]$g[5].Value) / 2)
  } else {
    $m = [regex]::new($pat2).Matches($xml)
    if ($m.Count -eq 0) { "NOTFOUND: $Match"; return }
    $g = $m[$Index].Groups
    $cx = [int](([int]$g[1].Value + [int]$g[3].Value) / 2); $cy = [int](([int]$g[2].Value + [int]$g[4].Value) / 2)
  }
  & $adb shell input tap $cx $cy | Out-Null
}
function TapXY([int]$x, [int]$y) { & $adb shell input tap $x $y | Out-Null }
function Pause([int]$ms) { Start-Sleep -Milliseconds $ms }

# 1. Assume the app is already on Home (caller ensures this).
Pause 500

# 2. Start screen recording (background process)
$rec = Start-Process -FilePath $adb -ArgumentList "shell","screenrecord","--time-limit","180","--bit-rate","8000000","/sdcard/demo.mp4" -PassThru
Pause 1500

# 3. Drive the UC1 flow with deliberate pacing
Pause 1500
Tap "Factures";              Pause 2600   # Home -> Facturation list
Tap "Nouvelle facture";      Pause 2600   # -> new invoice form
Tap "Choisir un client";     Pause 1800   # open client picker
Tap "Clinique Al Madina";    Pause 2200   # select client (fills name + ICE)
Tap "Ajouter une ligne";     Pause 1800   # open line sheet (stored references)
Tap "PC portable Dell";      Pause 1800   # pick a stored product
TapXY 540 2150;              Pause 2400   # confirm "Ajouter" -> line added, totals
& $adb shell input swipe 540 1400 540 600 400; Pause 1800   # scroll to payment + CTA
Tap "Wafacash";              Pause 1200   # add 2nd payment method
Tap "livraison";             Pause 1400   # add 3rd payment method (Especes a la livraison)
TapXY 540 2074;              Pause 3000   # "Apercu de la facture" CTA (pinned bottom)
& $adb shell input swipe 540 1600 540 1000 400; Pause 2200  # reveal modalities + CTAs
Tap "Valider et envoyer";    Pause 2800   # validate -> status envoyee + toast
Pause 1500

# 4. Stop recording, finalize, pull
& $adb shell pkill -INT screenrecord | Out-Null
Pause 2500
try { if (-not $rec.HasExited) { $rec.Kill() } } catch {}
$out = "c:\Users\Lenovo\Documents\MyLegal\Amano\docs\prototype"
New-Item -ItemType Directory -Force -Path $out | Out-Null
& $adb pull /sdcard/demo.mp4 "$out\amano-uc1-facture.mp4"
"DONE -> $out\amano-uc1-facture.mp4"
