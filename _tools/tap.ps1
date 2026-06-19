param([string]$Match, [int]$Index = 0)
# Tap the center of the Nth UI element whose text or content-desc contains $Match.
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$env:ANDROID_SERIAL = "emulator-5554"
& $adb shell uiautomator dump /sdcard/_ui.xml | Out-Null
& $adb pull /sdcard/_ui.xml "$env:TEMP\_ui.xml" | Out-Null
$xml = Get-Content "$env:TEMP\_ui.xml" -Raw -Encoding UTF8
$esc = [regex]::Escape($Match)
$pat1 = '<node[^>]*?(?:text|content-desc)="([^"]*' + $esc + '[^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
$pat2 = '<node[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"[^>]*?(?:text|content-desc)="([^"]*' + $esc + '[^"]*)"'
$rx = [regex]::new($pat1)
$m = $rx.Matches($xml)
if ($m.Count -gt 0) {
  $g = $m[$Index].Groups
  $cx = [int](([int]$g[2].Value + [int]$g[4].Value) / 2); $cy = [int](([int]$g[3].Value + [int]$g[5].Value) / 2)
} else {
  $rx2 = [regex]::new($pat2)
  $m = $rx2.Matches($xml)
  if ($m.Count -eq 0) { "NOTFOUND: $Match"; exit 1 }
  $g = $m[$Index].Groups
  $cx = [int](([int]$g[1].Value + [int]$g[3].Value) / 2); $cy = [int](([int]$g[2].Value + [int]$g[4].Value) / 2)
}
& $adb shell input tap $cx $cy | Out-Null
"TAP '$Match' @ $cx,$cy"
