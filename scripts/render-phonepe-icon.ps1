$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$bitmap=[System.Drawing.Bitmap]::new(256,256)
$graphics=[System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([System.Drawing.Color]::Transparent)
$purple=[System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(95,37,159))
$graphics.FillEllipse($purple,0,0,255,255)
$font=[System.Drawing.Font]::new('Nirmala UI',138,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$format=[System.Drawing.StringFormat]::new()
$format.Alignment=[System.Drawing.StringAlignment]::Center
$format.LineAlignment=[System.Drawing.StringAlignment]::Center
$graphics.DrawString('पे',$font,[System.Drawing.Brushes]::White,[System.Drawing.RectangleF]::new(0,-7,256,256),$format)
$bitmap.Save("$root/petmeta_mobile/assets/phonepe-icon.png",[System.Drawing.Imaging.ImageFormat]::Png)
$format.Dispose();$font.Dispose();$purple.Dispose();$graphics.Dispose();$bitmap.Dispose()
