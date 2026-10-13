#!/usr/bin/env python3
"""Build a review-only source ZIP without the checkout's Git history."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import zipfile


ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "release/packages/after-effects-studio-source-review.zip"
PREFIX = "after-effects-studio/"
FIXED_DATE = (2020, 1, 1, 0, 0, 0)
SELF_REPORTS = {
    "quality/reports/2026-10-09-public-source-snapshot/report.md",
    "quality/reports/2026-10-13-source-rights-review/report.md",
}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    audit = subprocess.run(
        [sys.executable, str(ROOT / "release/audit-public-tree.py"), "--strict"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if audit.returncode:
        raise SystemExit(f"Candidate tree audit failed:\n{audit.stdout}{audit.stderr}")

    names = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        cwd=ROOT,
    ).split(b"\0")
    files: dict[str, bytes] = {}
    for raw_name in names:
        if not raw_name:
            continue
        relative = raw_name.decode("utf-8", errors="strict")
        if relative in SELF_REPORTS:
            continue
        parts = Path(relative).parts
        if not parts or relative.startswith("/") or ".." in parts or ".git" in parts:
            raise SystemExit(f"Unsafe source path: {relative}")
        path = ROOT / relative
        if path.is_symlink() or not path.is_file():
            raise SystemExit(f"Non-regular source path: {relative}")
        files[relative] = path.read_bytes()

    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    manifest = {
        "status": "review-only; not authorized for publication",
        "base_commit": head,
        "file_count": len(files),
        "excluded_self_reports": sorted(SELF_REPORTS),
        "files": {name: digest(data) for name, data in sorted(files.items())},
        "limits": [
            "Includes uncommitted and untracked candidate files, but no Git history or ignored raw evidence.",
            "Narrow automated pattern audit passed; human security, content, asset and license review remains.",
            "Publishing a repository or claiming a clean-machine installation requires separate authorization and evidence.",
        ],
    }
    if "source-review-manifest.json" in files:
        raise SystemExit("Source review manifest path already exists")
    files["source-review-manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(DESTINATION, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(files.items()):
            info = zipfile.ZipInfo(PREFIX + name, FIXED_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    print(json.dumps({"archive": str(DESTINATION), "sha256": digest(DESTINATION.read_bytes()), "source_files": manifest["file_count"], "archive_files": len(files)}, indent=2))


if __name__ == "__main__":
    main()
