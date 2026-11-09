$code = @'
using System;
using System.Drawing;
using System.Runtime.InteropServices;
[ComImport, Guid("BCC18B79-BA16-442F-80C4-8A59C30C463B"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IShellItemImageFactory { void GetImage(SIZE size, int flags, out IntPtr hbitmap); }
[StructLayout(LayoutKind.Sequential)] struct SIZE { public int cx, cy; public SIZE(int x, int y) { cx=x; cy=y; } }
public static class VideoThumbnail {
  [DllImport("shell32.dll", CharSet=CharSet.Unicode, PreserveSig=false)]
  static extern void SHCreateItemFromParsingName(string path, IntPtr bindCtx, ref Guid iid, out IShellItemImageFactory result);
  [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr handle);
  public static void Save(string input, string output) {
    Guid id = new Guid("BCC18B79-BA16-442F-80C4-8A59C30C463B");
    IShellItemImageFactory item;
    SHCreateItemFromParsingName(input, IntPtr.Zero, ref id, out item);
    IntPtr handle;
    item.GetImage(new SIZE(640, 400), 0x1, out handle);
    using (var bitmap = Bitmap.FromHbitmap(handle)) bitmap.Save(output, System.Drawing.Imaging.ImageFormat.Png);
    DeleteObject(handle);
    Marshal.ReleaseComObject(item);
  }
}
'@
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
$names = @(
  'WhatsApp Video 2026-09-27 at 9.46.05 PM.mp4',
  'WhatsApp Video 2026-09-27 at 9.47.24 PM.mp4',
  'WhatsApp Video 2026-09-27 at 9.46.46 PM.mp4',
  'WhatsApp Video 2026-10-01 at 10.21.09 PM.mp4'
)
for ($i = 0; $i -lt $names.Length; $i++) {
  $source = Join-Path 'C:\Users\neele\Downloads' $names[$i]
  $destination = Join-Path $PSScriptRoot ("video-thumb-$($i+1).png")
  [VideoThumbnail]::Save($source, $destination)
  Get-Item $destination | Select-Object Name, Length
}
