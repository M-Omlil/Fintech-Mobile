param([string]$Name = "shot")
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$env:ANDROID_SERIAL = "emulator-5554"
& $adb shell screencap -p /sdcard/_s.png | Out-Null
& $adb pull /sdcard/_s.png "$env:TEMP\$Name.png" | Out-Null
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("$env:TEMP\$Name.png")
$w = 340; $h = [int]($img.Height * $w / $img.Width)
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp); $g.DrawImage($img, 0, 0, $w, $h)
$img.Dispose(); $bmp.Save("$env:TEMP\${Name}_s.png"); $bmp.Dispose()
"$env:TEMP\${Name}_s.png"
