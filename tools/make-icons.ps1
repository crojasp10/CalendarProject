# Generates icons/icon-192.png, icons/icon-512.png and icons/apple-touch-icon.png
# with System.Drawing (built into Windows PowerShell). Mirrors icons/icon.svg.
# Usage (from the project root):  powershell -NoProfile -File tools\make-icons.ps1

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\icons'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
$outDir = (Resolve-Path $outDir).Path

function Get-Color([string]$hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }

function New-RoundedRectPath([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
    $d = $r * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-Icon([int]$size, [string]$fileName) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.Clear((Get-Color '#4f46e5'))
        $g.ScaleTransform($size / 512.0, $size / 512.0)   # draw on a 512 x 512 canvas

        # Calendar body
        $card = New-RoundedRectPath 130 150 252 232 28
        $white = New-Object System.Drawing.SolidBrush((Get-Color '#ffffff'))
        $g.FillPath($white, $card)

        # Header band, clipped to the body shape
        $g.SetClip($card)
        $amber = New-Object System.Drawing.SolidBrush((Get-Color '#f59e0b'))
        $g.FillRectangle($amber, 130, 150, 252, 64)
        $g.ResetClip()

        # Binder rings
        $ink = New-Object System.Drawing.SolidBrush((Get-Color '#1e1b4b'))
        foreach ($rx in 176, 314) {
            $ring = New-RoundedRectPath $rx 124 22 52 11
            $g.FillPath($ink, $ring)
            $ring.Dispose()
        }

        # Check mark
        $pen = New-Object System.Drawing.Pen((Get-Color '#4f46e5'), 30)
        $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        $points = [System.Drawing.PointF[]]@(
            (New-Object System.Drawing.PointF(190, 296)),
            (New-Object System.Drawing.PointF(234, 338)),
            (New-Object System.Drawing.PointF(322, 252))
        )
        $g.DrawLines($pen, $points)

        $bmp.Save((Join-Path $outDir $fileName), [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Created $fileName ($size x $size)"
        $pen.Dispose(); $ink.Dispose(); $amber.Dispose(); $white.Dispose(); $card.Dispose()
    }
    finally {
        $g.Dispose()
        $bmp.Dispose()
    }
}

New-Icon 192 'icon-192.png'
New-Icon 512 'icon-512.png'
New-Icon 180 'apple-touch-icon.png'
