"""Check compiled APK entry-point classes before distributing a build."""
import struct
import sys
import zipfile

required = {
    'Lcom/petmeta/petmeta_app/MainActivity;',
    'Lio/flutter/plugins/GeneratedPluginRegistrant;',
}
found = set()
with zipfile.ZipFile(sys.argv[1]) as apk:
    for name in apk.namelist():
        if not name.endswith('.dex'):
            continue
        data = apk.read(name)
        _, strings = struct.unpack_from('<II', data, 56)
        _, types = struct.unpack_from('<II', data, 64)
        count, classes = struct.unpack_from('<II', data, 96)
        for i in range(count):
            type_id = struct.unpack_from('<I', data, classes + i * 32)[0]
            string_id = struct.unpack_from('<I', data, types + type_id * 4)[0]
            offset = struct.unpack_from('<I', data, strings + string_id * 4)[0]
            while data[offset] & 128:
                offset += 1
            offset += 1
            end = data.index(0, offset)
            descriptor = data[offset:end].decode('utf-8', errors='replace')
            if descriptor in required:
                found.add(descriptor)
missing = required - found
if missing:
    raise SystemExit('APK startup check FAILED: missing compiled classes: ' + ', '.join(sorted(missing)))
print('APK startup check passed: MainActivity and GeneratedPluginRegistrant are defined in DEX.')
