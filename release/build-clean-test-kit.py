#!/usr/bin/env python3
"""Wrap a versioned plugin archive in a deterministic local test marketplace."""

import hashlib
import json
from pathlib import Path
import sys
import zipfile


ROOT = Path(__file__).resolve().parents[1]
PACKAGE_DIR = ROOT / "release" / "packages"
PREFIX = "after-effects-studio/"
FIXED_DATE = (2020, 1, 1, 0, 0, 0)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    version = json.loads((ROOT / "plugin/.codex-plugin/plugin.json").read_text())["version"]
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else PACKAGE_DIR / f"after-effects-studio-{version}.zip"
    if not source.is_file():
        raise SystemExit(f"Candidate archive missing: {source}")

    plugin_files = {}
    with zipfile.ZipFile(source) as archive:
        for entry in archive.infolist():
            name = entry.filename
            if entry.is_dir():
                continue
            if not name.startswith(PREFIX):
                raise SystemExit(f"Unexpected package entry: {name}")
            relative = name[len(PREFIX):]
            if not relative or relative.startswith("/") or ".." in Path(relative).parts:
                raise SystemExit(f"Unsafe package entry: {name}")
            plugin_files[relative] = archive.read(entry)

    packaged_version = json.loads(plugin_files[".codex-plugin/plugin.json"])["version"]
    if packaged_version != version:
        raise SystemExit(f"Source/package version mismatch: {version} != {packaged_version}")

    marketplace = {
        "name": "aft-clean-test",
        "interface": {"displayName": "AFT Clean Test"},
        "plugins": [{
            "name": "after-effects-studio",
            "source": {"source": "local", "path": "./plugins/after-effects-studio"},
            "policy": {"installation": "AVAILABLE", "authentication": "ON_INSTALL"},
            "category": "Productivity",
        }],
    }
    candidate = {
        "plugin_version": version,
        "source_archive_sha256": digest(source.read_bytes()),
        "plugin_file_count": len(plugin_files),
        "plugin_files": {name: digest(data) for name, data in sorted(plugin_files.items())},
    }
    kit_files = {
        ".agents/plugins/marketplace.json": (json.dumps(marketplace, indent=2) + "\n").encode(),
        "candidate.json": (json.dumps(candidate, indent=2) + "\n").encode(),
        "README.md": (ROOT / "quality/fixtures/clean-machine-runbook.md").read_bytes(),
    }
    for name, data in plugin_files.items():
        kit_files[f"plugins/after-effects-studio/{name}"] = data

    destination = PACKAGE_DIR / f"after-effects-studio-clean-test-{version}.zip"
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(kit_files.items()):
            info = zipfile.ZipInfo(name, FIXED_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    print(json.dumps({
        "kit": str(destination),
        "kit_sha256": digest(destination.read_bytes()),
        "source_archive_sha256": candidate["source_archive_sha256"],
        "plugin_version": version,
        "plugin_file_count": len(plugin_files),
        "kit_file_count": len(kit_files),
    }, indent=2))


if __name__ == "__main__":
    main()
