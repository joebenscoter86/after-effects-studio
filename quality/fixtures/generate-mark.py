"""Generate original, tiny PNG media for missing-link tests; no external assets."""

from pathlib import Path
import struct
import zlib


def chunk(kind: bytes, payload: bytes) -> bytes:
    body = kind + payload
    return struct.pack(">I", len(payload)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


size = 64
rows = []
for y in range(size):
    row = bytearray([0])
    for x in range(size):
        r2 = (x - 31.5) ** 2 + (y - 31.5) ** 2
        row.extend((236, 97, 52, 255) if 13 ** 2 <= r2 <= 25 ** 2 else (0, 0, 0, 0))
    rows.append(bytes(row))

png = (
    b"\x89PNG\r\n\x1a\n"
    + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    + chunk(b"IDAT", zlib.compress(b"".join(rows), 9))
    + chunk(b"IEND", b"")
)
Path(__file__).with_name("geometry-mark.png").write_bytes(png)
