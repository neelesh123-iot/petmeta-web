"""Package the editable Flutter source without machine-local build output."""

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
source = root / "petmeta_mobile"
output = root / "PetMeta-Flutter-App.zip"
skip_dirs = {
    ".dart_tool", ".gradle", ".idea", ".kotlin", "build", "coverage",
    ".pub-cache", ".pub", "Pods", "DerivedData", ".symlinks",
}
skip_files = {
    ".flutter-plugins-dependencies", "local.properties", ".DS_Store",
    "petmeta_app.iml", "petmeta_app_android.iml",
}

with ZipFile(output, "w", ZIP_DEFLATED, compresslevel=6) as archive:
    for path in source.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(source)
        if any(part in skip_dirs for part in relative.parts):
            continue
        if path.name in skip_files or path.suffix in {".pyc", ".log"}:
            continue
        archive.write(path, Path("petmeta_mobile") / relative)

print(f"{output} ({output.stat().st_size:,} bytes)")
