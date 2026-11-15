#!/bin/sh
# Compiles the Vision OCR helper to tools/channel-learner/.build/ocr (git-ignored).
set -eu
here=$(cd "$(dirname "$0")" && pwd)
out="$here/../.build"
mkdir -p "$out"
swiftc -O "$here/ocr.swift" -o "$out/ocr"
echo "$out/ocr"
