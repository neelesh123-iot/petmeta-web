$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$sheets = Get-Content "$PSScriptRoot/essential-sheets.json" -Raw | ConvertFrom-Json
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$parameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
$parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]92)
foreach ($sheet in $sheets) {
  $source = [System.Drawing.Image]::FromFile($sheet.path)
  $species = $sheet.species.ToLower()
  foreach ($size in @(900,4096)) {
    $destination = if ($size -eq 900) { "$root/petmeta_mobile/assets/essentials/$species" } else { "$root/product-images-4k/$species" }
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    for ($i=0; $i -lt 18; $i++) {
      $bitmap = New-Object System.Drawing.Bitmap($size,$size)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.Clear([System.Drawing.Color]::White)
      $width = $source.Width / 3.0
      $height = $source.Height / 6.0
      $crop = [System.Drawing.RectangleF]::new([float](($i % 3)*$width+2), [float]([Math]::Floor($i/3)*$height+2), [float]($width-4), [float]($height-4))
      $dest = [System.Drawing.RectangleF]::new(0,0,$size,$size)
      $graphics.DrawImage($source,$dest,$crop,[System.Drawing.GraphicsUnit]::Pixel)
      $bitmap.Save("$destination/$i.jpg",$encoder,$parameters)
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  }
  $source.Dispose()
}
$parameters.Dispose()
'Exported 108 mobile images and 108 upscaled 4096px images.'
