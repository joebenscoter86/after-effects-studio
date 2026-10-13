#!/usr/bin/env python3
"""Build a byte-for-byte reproducible installable Codex plugin archive."""

import hashlib
import json
from pathlib import Path
import re
import sys
import zipfile


ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / "plugin"
DEST = ROOT / "release" / "packages"
PREFIX = "after-effects-studio/"
FIXED_DATE = (2020, 1, 1, 0, 0, 0)
FILES = [
    ".codex-plugin/plugin.json",
    ".mcp.json",
    "README.md",
    "PROVENANCE.md",
    "THIRD-PARTY-NOTICES.txt",
    "license.md",
    "runtime/LICENSE",
    "runtime/dist/index.js",
    "scripts/start.mjs",
    "scripts/doctor.mjs",
    "scripts/doctor-core.mjs",
    "scripts/verify-export.mjs",
]
TREES = ("assets", "docs", "examples", "library", "skills", "runtime/jsx")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    manifest = json.loads((PLUGIN / ".codex-plugin/plugin.json").read_text())
    if manifest["name"] != "after-effects-studio":
        raise SystemExit("Unexpected plugin name")
    paths = [Path(name) for name in FILES]
    for tree in TREES:
        paths.extend(p.relative_to(PLUGIN) for p in (PLUGIN / tree).rglob("*") if p.is_file())
    paths = sorted(set(paths), key=lambda p: p.as_posix())
    if any(p.is_symlink() for p in (PLUGIN / p for p in paths)):
        raise SystemExit("Package may not contain symlinks")
    entries = {}
    for rel in paths:
        if rel.is_absolute() or ".." in rel.parts:
            raise SystemExit(f"Unsafe path: {rel}")
        data = (PLUGIN / rel).read_bytes()
        entries[rel.as_posix()] = data
    for name, data in entries.items():
        if name.endswith(".png"):
            continue
        if re.search(rb"/Users/[A-Za-z0-9._-]+/|/home/[A-Za-z0-9._-]+/|-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}", data):
            raise SystemExit(f"Potential private path or credential in {name}")
    upstream_version = json.loads((PLUGIN / "runtime/package.json").read_text())["version"]
    entries["runtime/package.json"] = (
        json.dumps({"name": "after-effects-studio-runtime", "version": upstream_version,
                    "private": True, "type": "module"}, separators=(",", ":")) + "\n"
    ).encode()
    if b"Native AE runtime" not in entries["THIRD-PARTY-NOTICES.txt"]:
        raise SystemExit("Upstream notice missing")
    if b"Original Materials License 1.0" not in entries["license.md"]:
        raise SystemExit("Original-material terms missing")
    DEST.mkdir(parents=True, exist_ok=True)
    archive = DEST / f"after-effects-studio-{manifest['version']}.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as out:
        for name, data in sorted(entries.items()):
            info = zipfile.ZipInfo(PREFIX + name, FIXED_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            out.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    payload = "".join(f"{sha(data)}  {name}\n" for name, data in entries.items()).encode()
    report = {
        "archive": str(archive),
        "archive_sha256": sha(archive.read_bytes()),
        "payload_sha256": sha(payload),
        "plugin_version": manifest["version"],
        "file_count": len(entries),
        "files": {name: sha(data) for name, data in entries.items()},
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    sys.exit(main())
