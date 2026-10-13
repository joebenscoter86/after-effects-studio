#!/usr/bin/env python3
"""Report publication-sensitive content in the current Git candidate tree."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    "absolute_home_path": re.compile(rb"/(?:Users|home)/[A-Za-z0-9._-]+/"),
    "private_key_or_token_marker": re.compile(
        rb"-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}"
    ),
    "historical_content_checkout": re.compile(rb"Projects/" + rb"Content"),
}


def main() -> None:
    strict = "--strict" in sys.argv[1:]
    if any(argument != "--strict" for argument in sys.argv[1:]):
        raise SystemExit("Usage: audit-public-tree.py [--strict]")
    paths = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        cwd=ROOT,
    ).split(b"\0")
    findings: dict[str, list[dict[str, int | str]]] = {key: [] for key in PATTERNS}
    large_files: list[dict[str, int | str]] = []
    scanned = 0
    for raw_path in paths:
        if not raw_path:
            continue
        relative = raw_path.decode("utf-8", errors="surrogateescape")
        path = ROOT / relative
        if not path.is_file():
            continue
        scanned += 1
        data = path.read_bytes()
        for label, pattern in PATTERNS.items():
            count = len(pattern.findall(data))
            if count:
                findings[label].append({"path": relative, "occurrences": count})
        if len(data) > 1024 * 1024:
            large_files.append({"path": relative, "bytes": len(data)})
    print(
        json.dumps(
            {"candidate_files": scanned, "findings": findings, "large_files": large_files},
            indent=2,
        )
    )
    if strict and any(findings.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
