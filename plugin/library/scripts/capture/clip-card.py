#!/usr/bin/env python3
"""clip-card.py: turn a phone screen recording of a clip into a clean, upright video card.

Read the `phone-clip-cards` technique first (techniques/phone-clip-cards.md). Use only
recordings the user has the right to show.

  preview <recording> <still.png> --at T [--crop W:H:X:Y]
        a full-size still of the recording at T seconds, with the crop box drawn on it and
        a 100 px grid, to read the crop off
  make    <recording> <card.mp4> --crop W:H:X:Y --start S --end E
          [--slow 1.0] [--hold SECONDS] [--size 860x1118] [--fps 30] [--crf 14]
        crop to the video area, keep source seconds S to E (cut before the player's chrome or
        any system pop-up shows), slow by --slow (2 = twice as long; never a loop), scale to
        --size, and when --hold (the beat the card must cover) outlasts the clip, freeze on
        the last frame for the rest; when the clip outlasts --hold, end it at --hold. No audio.
        Then runs `check` on the result.
  check   <card.mp4>
        stills of the first, middle and last frame side by side in <card>-check.png, plus the
        file's size, frame rate, frame count and duration. Look at all three for buttons,
        captions, progress bars, a status bar or a notification before using the card.

Needs: Python 3.9+, ffmpeg and ffprobe on PATH.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile


def probe(path):
    out = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries',
        'stream=width,height,r_frame_rate,avg_frame_rate,nb_read_frames:format=duration', '-of', 'json', path]))
    s, f = out['streams'][0], out['format']
    num, den = (int(x) for x in s['avg_frame_rate'].split('/'))
    return {'w': int(s['width']), 'h': int(s['height']), 'fps': num / den if den else 0.0,
            'frames': int(s.get('nb_read_frames') or 0), 'dur': float(f['duration'])}


def parse_crop(text):
    m = re.fullmatch(r'(\d+):(\d+):(\d+):(\d+)', text or '')
    if not m:
        raise SystemExit('--crop takes W:H:X:Y in source pixels, e.g. 1080:1404:0:520')
    return tuple(int(v) for v in m.groups())


def parse_size(text):
    m = re.fullmatch(r'(\d+)x(\d+)', text)
    if not m:
        raise SystemExit('--size takes WxH, e.g. 860x1118')
    w, h = int(m.group(1)), int(m.group(2))
    if w % 2 or h % 2:
        raise SystemExit('--size needs even numbers for yuv420p')
    return w, h


def cmd_preview(a):
    vf = ["drawgrid=w=100:h=100:t=1:c=white@0.25"]
    if a.crop:
        w, h, x, y = parse_crop(a.crop)
        vf.append(f'drawbox=x={x}:y={y}:w={w}:h={h}:t=4:c=red')
    subprocess.check_call(['ffmpeg', '-y', '-v', 'error', '-ss', f'{a.at}', '-i', a.recording, '-frames:v', '1',
                           '-vf', ','.join(vf), a.still])
    info = probe(a.recording)
    print(f"{a.still}: recording {info['w']}x{info['h']} {info['fps']:.2f} fps {info['dur']:.2f} s, still at {a.at} s")
    return 0


def cmd_make(a):
    src = probe(a.recording)
    cw, ch, cx, cy = parse_crop(a.crop)
    if cx + cw > src['w'] or cy + ch > src['h']:
        raise SystemExit(f"crop {a.crop} runs outside the {src['w']}x{src['h']} recording")
    if not (0 <= a.start < a.end <= src['dur'] + 1e-3):
        raise SystemExit(f"--start/--end must lie inside 0..{src['dur']:.3f} s")
    if a.slow < 1:
        raise SystemExit('--slow below 1 speeds the clip up; use 1 or more')
    ow, oh = parse_size(a.size)
    if abs(cw / ch - ow / oh) > 0.01:
        print(f'note: crop aspect {cw / ch:.3f} differs from the card {ow / oh:.3f}; the card is filled and its centre kept')
    length = (a.end - a.start) * a.slow
    vf = [f'crop={cw}:{ch}:{cx}:{cy}', f'setpts={a.slow}*(PTS-STARTPTS)', f'fps={a.fps}',
          f'scale={ow}:{oh}:force_original_aspect_ratio=increase:flags=lanczos', f'crop={ow}:{oh}', 'setsar=1']
    out_len = length
    if a.hold:
        if a.hold > length:
            vf.append(f'tpad=stop_mode=clone:stop_duration={a.hold - length:.4f}')
            print(f'clip runs {length:.2f} s; holding its last frame for {a.hold - length:.2f} s to cover {a.hold:.2f} s')
        out_len = a.hold
    os.makedirs(os.path.dirname(os.path.abspath(a.card)), exist_ok=True)
    subprocess.check_call(['ffmpeg', '-y', '-v', 'error', '-ss', f'{a.start:.4f}', '-to', f'{a.end:.4f}', '-i', a.recording,
                           '-vf', ','.join(vf), '-t', f'{out_len:.4f}', '-an', '-c:v', 'libx264', '-preset', 'slow',
                           '-crf', str(a.crf), '-pix_fmt', 'yuv420p', '-r', str(a.fps), '-color_primaries', 'bt709',
                           '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', a.card])
    if src['fps'] and src['fps'] / a.slow < a.fps - 0.5:
        print(f"note: {src['fps']:.1f} fps slowed {a.slow}x gives {src['fps'] / a.slow:.1f} new pictures a second; "
              f'frames repeat to reach {a.fps} fps. Look at the motion at full speed.')
    return cmd_check(argparse.Namespace(card=a.card))


def cmd_check(a):
    info = probe(a.card)
    n = info['frames']
    if n < 1:
        raise SystemExit(f'{a.card}: no frames')
    idx = [0, n // 2, n - 1]
    base = os.path.splitext(a.card)[0]
    sheet = base + '-check.png'
    with tempfile.TemporaryDirectory() as td:
        sel = '+'.join(f'eq(n\\,{i})' for i in idx)
        subprocess.check_call(['ffmpeg', '-v', 'error', '-i', a.card, '-vf', f'select={sel}', '-vsync', '0',
                               os.path.join(td, 'f%d.png')])
        ins = []
        for k in range(1, 4):
            ins += ['-i', os.path.join(td, f'f{k}.png')]
        subprocess.check_call(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex',
                               '[0][1][2]hstack=inputs=3', sheet])
    print(f"{a.card}: {info['w']}x{info['h']} {info['fps']:.2f} fps {n} frames {info['dur']:.3f} s")
    print(f'  first, middle and last frame ({idx[0]}, {idx[1]}, {idx[2]}): {sheet}')
    print('  look at all three: no buttons, captions, progress bar, status bar, pop-up or rounded player corner may remain')
    return 0


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='name', required=True)
    p = sub.add_parser('preview')
    p.add_argument('recording')
    p.add_argument('still')
    p.add_argument('--at', type=float, default=0.0)
    p.add_argument('--crop')
    p.set_defaults(fn=cmd_preview)
    p = sub.add_parser('make')
    p.add_argument('recording')
    p.add_argument('card')
    p.add_argument('--crop', required=True, help='W:H:X:Y in source pixels')
    p.add_argument('--start', type=float, required=True, help='source seconds')
    p.add_argument('--end', type=float, required=True, help='source seconds')
    p.add_argument('--slow', type=float, default=1.0, help='2 plays the clip at half speed')
    p.add_argument('--hold', type=float, help='seconds the card must cover in the piece')
    p.add_argument('--size', default='860x1118')
    p.add_argument('--fps', type=float, default=30)
    p.add_argument('--crf', type=int, default=14)
    p.set_defaults(fn=cmd_make)
    p = sub.add_parser('check')
    p.add_argument('card')
    p.set_defaults(fn=cmd_check)
    a = ap.parse_args(argv)
    return a.fn(a)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
