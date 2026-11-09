$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$entries=Get-Content "$PSScriptRoot/new-pet-crops.json" -Raw | ConvertFrom-Json
foreach($entry in $entries){
  $source=[System.Drawing.Bitmap]::FromFile($entry.path)
  $dir="$root/petmeta_mobile/assets/new-pets/$($entry.species)"
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
  for($i=0;$i -lt 20;$i++){
    $col=$i%4
    $row=[int][Math]::Floor($i/4)
    $x=[int]$entry.xs[$col]+3
    $y=[int]$entry.ys[$row]+3
    $w=[int]$entry.xs[$col+1]-$x-3
    $h=[int]$entry.ys[$row+1]-$y-3
    $rect=[System.Drawing.Rectangle]::new($x,$y,$w,$h)
    $tile=$source.Clone($rect,$source.PixelFormat)
    $tile.Save("$dir/$i.png",[System.Drawing.Imaging.ImageFormat]::Png)
    $tile.Dispose()
  }
  $source.Dispose()
}
