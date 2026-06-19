# Records an app-breadth tour of Amano: tabs + UC2 (supplier payment) + clients/UC1.
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
function Back() { & $adb shell input keyevent KEYCODE_BACK | Out-Null }
function Swipe([int]$x1,[int]$y1,[int]$x2,[int]$y2,[int]$ms) { & $adb shell input swipe $x1 $y1 $x2 $y2 $ms | Out-Null }
function Pause([int]$ms) { Start-Sleep -Milliseconds $ms }

# Ensure we start on Home
Tap "Accueil"; Pause 1500

# Start screen recording
$rec = Start-Process -FilePath $adb -ArgumentList "shell","screenrecord","--time-limit","180","--bit-rate","8000000","/sdcard/tour.mp4" -PassThru
Pause 1500

# Home overview
Pause 2200
Swipe 540 1500 540 900 500; Pause 1600        # peek transactions
Swipe 540 900 540 1500 500; Pause 1400

# Transactions tab
Tap "Transactions"; Pause 2400
Swipe 540 1600 540 800 500; Pause 1800
Swipe 540 800 540 1600 500; Pause 1200

# Cartes tab
Tap "Cartes"; Pause 2600
Swipe 540 1700 540 800 500; Pause 1800
Swipe 540 800 540 1700 500; Pause 1200

# Menu tab
Tap "Menu"; Pause 2400
Swipe 540 1700 540 900 500; Pause 1600

# UC2 - Factures fournisseurs (import / scan intake)
Tap "Factures fournisseurs"; Pause 3000
Back; Pause 1800

# UC1 beneficiaries - Liste des clients (shows ICE)
Tap "Liste des clients"; Pause 3000
Back; Pause 1500

# Back to Home
Tap "Accueil"; Pause 2000

# Stop recording + pull
& $adb shell pkill -INT screenrecord | Out-Null
Pause 2500
try { if (-not $rec.HasExited) { $rec.Kill() } } catch {}
$out = "c:\Users\Lenovo\Documents\MyLegal\Amano\docs\prototype"
New-Item -ItemType Directory -Force -Path $out | Out-Null
& $adb pull /sdcard/tour.mp4 "$out\amano-app-tour.mp4"
"DONE -> $out\amano-app-tour.mp4"
