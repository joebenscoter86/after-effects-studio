#!/usr/bin/env python3
"""check-clip.py: freeze and jump check for a recorded clip, plus a 12-frame contact sheet.

Read the `page-recording` technique first (techniques/page-recording.md).

Usage:
  python3 check-clip.py <clip.mp4> <sheet.png> [--strict] [--expect-frames N]

Prints the stream facts (codec, size, fps, frames, duration), the mean absolute difference
(MAD, 0-255 grey levels) between each pair of consecutive frames, its median per half
second, every identical pair (a freeze) and every pair whose MAD is more than 4x the median
of the 14 pairs around it and above 0.3 (a jump: a skipped step, a late paint, a scroll
that snapped). Writes 12 evenly spaced frames to the sheet with frame numbers and times.

Identical pairs are expected where the page is meant to hold still; a freeze in the middle
of a scroll or an animation is a fault. --strict exits 1 when any freeze or jump is found,
and also when --expect-frames is given and the frame count differs.

Needs: Python 3.9+, numpy, Pillow, ffmpeg and ffprobe on PATH.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFont


def font(size):
    for f in ('/System/Library/Fonts/Menlo.ttc', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
              'C:/Windows/Fonts/consola.ttf'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


def main(argv):
    ap = argparse.ArgumentParser(description='Freeze and jump check with a contact sheet.')
    ap.add_argument('clip')
    ap.add_argument('sheet')
    ap.add_argument('--strict', action='store_true', help='exit 1 on any freeze, jump or frame-count mismatch')
    ap.add_argument('--expect-frames', type=int, help='frame count the clip should have (dur x fps)')
    a = ap.parse_args(argv)
    clip, sheet, strict, expect = a.clip, a.sheet, a.strict, a.expect_frames
    name = os.path.splitext(os.path.basename(clip))[0]

    pr = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries',
        'stream=width,height,codec_name,pix_fmt,r_frame_rate,nb_read_frames:format=duration,size', '-of', 'json', clip]))
    st, fm = pr['streams'][0], pr['format']
    W, H = int(st['width']), int(st['height'])
    num, den = (int(x) for x in st['r_frame_rate'].split('/'))
    fps = num / den if den else 30.0

    # Stream full-resolution grey frames; keep only the previous one in memory.
    proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', clip, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                            stdout=subprocess.PIPE)
    size = W * H
    prev, mad, ident, n = None, [], [], 0
    while True:
        buf = proc.stdout.read(size)
        if len(buf) < size:
            break
        cur = np.frombuffer(buf, np.uint8).astype(np.int16)
        if prev is not None:
            d = np.abs(cur - prev)
            mad.append(float(d.mean()))
            if not d.any():
                ident.append(n - 1)
        prev, n = cur, n + 1
    proc.wait()
    mad = np.array(mad)
    if n < 2:
        print(f'{name}: only {n} frame(s) decoded')
        return 1

    jumps = []
    for i in range(n - 1):
        lo, hi = max(0, i - 7), min(n - 1, i + 8)
        around = np.concatenate([mad[lo:i], mad[i + 1:hi]])
        loc = float(np.median(around)) if len(around) else 0.0
        if mad[i] > 4 * loc and mad[i] > 0.3:
            jumps.append((i, round(float(mad[i]), 3), round(loc, 3)))

    print(f"{name}: {st['codec_name']} {W}x{H} {st['pix_fmt']} fps={st['r_frame_rate']} frames={st.get('nb_read_frames')} "
          f"dur={float(fm['duration']):.3f}s size={int(fm['size']) / 1e6:.1f}MB decoded={n}")
    print(f'  MAD mean={mad.mean():.3f} median={np.median(mad):.3f} min={mad.min():.3f} max={mad.max():.3f} '
          f'(largest between frames {int(mad.argmax())} and {int(mad.argmax()) + 1})')
    half = max(1, round(fps / 2))
    print(f'  MAD median per half second: {[round(float(np.median(mad[a:a + half])), 2) for a in range(0, n - 1, half)]}')
    print(f'  identical pairs (freeze): {len(ident)} {ident[:40]}')
    print(f'  jumps (>4x local median): {len(jumps)} {jumps[:20]}')

    idx = [round(i * (n - 1) / 11) for i in range(12)]
    with tempfile.TemporaryDirectory() as td:
        sel = '+'.join(f'eq(n\\,{i})' for i in idx)
        subprocess.check_call(['ffmpeg', '-v', 'error', '-i', clip, '-vf', f'select={sel}', '-vsync', '0',
                               os.path.join(td, 'f%02d.png')])
        ims = [Image.open(os.path.join(td, f'f{k + 1:02d}.png')).convert('RGB') for k in range(12)]
    cols = 4 if W > H else 6
    cw = 600 if W > H else 360
    ch = round(H * cw / W)
    rows, pad = 12 // cols, 8
    S = Image.new('RGB', (cols * (cw + pad) + pad, rows * (ch + pad) + pad + 30), (30, 30, 30))
    d = ImageDraw.Draw(S)
    f18 = font(18)
    d.text((pad, 6), f'{name}  {W}x{H}  {n} frames  12 evenly spaced', fill=(220, 220, 220), font=f18)
    for k, (im, fi) in enumerate(zip(ims, idx)):
        x, y = pad + (k % cols) * (cw + pad), 30 + pad + (k // cols) * (ch + pad)
        S.paste(im.resize((cw, ch), Image.LANCZOS), (x, y))
        lbl = f'f{fi} t={fi / fps:.2f}s'
        d.rectangle([x, y, x + 11 * len(lbl) + 8, y + 24], fill=(0, 0, 0))
        d.text((x + 4, y + 2), lbl, fill=(255, 230, 0), font=f18)
    S.save(sheet)
    print('  sheet:', sheet)

    bad = bool(ident or jumps) or (expect is not None and n != expect)
    if expect is not None and n != expect:
        print(f'  frame count {n} differs from the expected {expect}')
    return 1 if strict and bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
