# Generates the PNG icons used by the PWA manifest and iOS home screen.
# Usage (from the project root):  powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
Add-Type -AssemblyName System.Drawing

function New-RoundPath([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function New-Icon([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#4f46e5'))

  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $band = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#818cf8'))
  $ink = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#4f46e5'))

  # Card kept inside the central safe zone so the icon also works as a maskable icon.
  $x = $size * 0.22; $y = $size * 0.28; $w = $size * 0.56; $h = $size * 0.50
  $card = New-RoundPath $x $y $w $h ($size * 0.06)
  $g.FillPath($white, $card)

  $g.SetClip($card)
  $g.FillRectangle($band, $x, $y, $w, $h * 0.22)
  $g.ResetClip()

  $r = $size * 0.035
  for ($row = 0; $row -lt 2; $row++) {
    for ($col = 0; $col -lt 3; $col++) {
      $cx = $x + $w * (0.25 + 0.25 * $col)
      $cy = $y + $h * (0.50 + 0.25 * $row)
      $g.FillEllipse($ink, $cx - $r, $cy - $r, $r * 2, $r * 2)
    }
  }

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

$out = Join-Path $PSScriptRoot '..\icons'
New-Item -ItemType Directory -Force -Path $out | Out-Null
New-Icon 192 (Join-Path $out 'icon-192.png')
New-Icon 512 (Join-Path $out 'icon-512.png')
New-Icon 180 (Join-Path $out 'apple-touch-icon.png')
Write-Host 'Icons generated in' $out
