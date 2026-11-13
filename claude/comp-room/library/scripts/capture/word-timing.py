#!/usr/bin/env python3
"""word-timing.py: find the first frame of a stressed word from the voice itself.

Read the `word-timing` technique first (techniques/word-timing.md).

  channels  <take>                       how many audio channels the take has, and the level of each
  extract   <take> <voice.wav> [--channel 1]
                                         a mono 48 kHz WAV of one channel (1 = the first)
  levels    <voice.wav> --start S --end E [--fps 30]
                                         the voice's RMS level per frame (one 1/fps window each),
                                         in dBFS, with the rise from the frame before
  trim      <voice.wav> --frames A-B --word WORD --cmd "TRANSCRIBER ... {wav} ..."
            [--fps 30] [--tail 2.0] [--first 3] [--step 1]
                                         for each candidate frame F from A to B, cut the audio at
                                         F/fps, keep --tail seconds, transcribe only that, and say
                                         whether WORD is among the first --first words heard.
                                         W, the word's first frame, is the first F where it is no
                                         longer heard.

Frames count from the start of the WAV at --fps. Add the frame where that audio starts in
the composition to place a marker. {wav} in --cmd is replaced by the trimmed 16 kHz mono
file; the command's standard output is the transcript. For local whisper.cpp, for example:
  --cmd "whisper-cli -m /path/to/ggml-base.en.bin -f {wav} -nt -np -l en"

Needs: Python 3.9+, numpy, ffmpeg and ffprobe on PATH, and a transcriber for `trim`.
"""
import argparse
import json
import os
import re
import shlex
import subprocess
import sys
import tempfile

import numpy as np


def probe_audio(path):
    out = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'a', '-show_entries',
        'stream=index,channels,channel_layout,sample_rate,codec_name', '-of', 'json', path]))
    return out.get('streams', [])


def decode(path, start=None, dur=None, rate=48000, channels=1, pan=None):
    cmd = ['ffmpeg', '-v', 'error']
    if start is not None:
        cmd += ['-ss', f'{max(0.0, start):.6f}']
    cmd += ['-i', path]
    if dur is not None:
        cmd += ['-t', f'{dur:.6f}']
    if pan:
        cmd += ['-af', pan]
    cmd += ['-vn', '-ac', str(channels), '-ar', str(rate), '-f', 'f32le', '-']
    raw = subprocess.check_output(cmd)
    return np.frombuffer(raw, np.float32).reshape(-1, channels)


def db(x):
    return 20 * np.log10(max(float(x), 1e-9))


def cmd_channels(a):
    streams = probe_audio(a.take)
    if not streams:
        print('no audio stream')
        return 1
    s = streams[0]
    n = int(s['channels'])
    print(f"{s['codec_name']} {n} channel(s) {s.get('channel_layout', '?')} {s['sample_rate']} Hz")
    pcm = decode(a.take, channels=n, rate=16000)
    for c in range(n):
        rms = np.sqrt(np.mean(pcm[:, c] ** 2)) if len(pcm) else 0
        peak = np.max(np.abs(pcm[:, c])) if len(pcm) else 0
        print(f'  channel {c + 1}: RMS {db(rms):6.1f} dBFS  peak {db(peak):6.1f} dBFS')
    if n > 2:
        print('  more than two channels: extract the voice channel before timing or placing it in After Effects')
    return 0


def cmd_extract(a):
    c = a.channel - 1
    subprocess.check_call(['ffmpeg', '-y', '-v', 'error', '-i', a.take, '-vn', '-af', f'pan=mono|c0=c{c}',
                           '-ar', '48000', '-c:a', 'pcm_s16le', a.out])
    print(f'wrote {a.out} (channel {a.channel}, mono, 48 kHz)')
    return 0


def cmd_levels(a):
    fps, rate = a.fps, 48000
    f0, f1 = int(np.floor(a.start * fps)), int(np.ceil(a.end * fps))
    pcm = decode(a.wav, start=f0 / fps, dur=(f1 - f0) / fps, rate=rate)[:, 0]
    win = rate / fps
    prev = None
    print(f'frame   time     RMS dBFS  rise   (one {1000 / fps:.1f} ms window per frame)')
    for k in range(f1 - f0):
        seg = pcm[int(round(k * win)):int(round((k + 1) * win))]
        if not len(seg):
            break
        lv = db(np.sqrt(np.mean(seg ** 2)))
        rise = '' if prev is None else f'{lv - prev:+5.1f}'
        bar = '#' * max(0, int((lv + 60) / 2))
        print(f'{f0 + k:5d}  {(f0 + k) / fps:7.3f}  {lv:7.1f}  {rise:>6}  {bar}')
        prev = lv
    return 0


WORD_RE = re.compile(r"[a-z0-9']+")


def words_of(text):
    text = re.sub(r'\[[^\]]*\]|\([^)]*\)', ' ', text.lower())  # drop [BLANK_AUDIO], (music) and the like
    return WORD_RE.findall(text.replace('’', "'"))


def cmd_trim(a):
    m = re.fullmatch(r'(\d+)-(\d+)', a.frames)
    if not m:
        print('--frames takes A-B, e.g. 118-134')
        return 2
    lo, hi = int(m.group(1)), int(m.group(2))
    if '{wav}' not in a.cmd:
        print('--cmd must contain {wav}, where the trimmed file goes')
        return 2
    target = words_of(a.word)
    if len(target) != 1:
        print('--word takes one word')
        return 2
    target = target[0]
    results = []
    with tempfile.TemporaryDirectory() as td:
        for f in range(lo, hi + 1, a.step):
            wav = os.path.join(td, f'cut-{f}.wav')
            subprocess.check_call(['ffmpeg', '-y', '-v', 'error', '-ss', f'{f / a.fps:.6f}', '-i', a.wav, '-t', f'{a.tail:.3f}',
                                   '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav])
            argv = [x.replace('{wav}', wav) for x in shlex.split(a.cmd)]
            p = subprocess.run(argv, capture_output=True, text=True)
            if p.returncode:
                print(f'transcriber failed at frame {f}: {p.stderr.strip()[-400:]}')
                return 1
            heard = words_of(p.stdout)
            hit = target in heard[:a.first]
            results.append((f, hit))
            print(f'frame {f:5d}  t={f / a.fps:7.3f}  {"HEARD    " if hit else "not heard"}  | {" ".join(heard[:8])}')
    w = next((f for i, (f, hit) in enumerate(results) if not hit and i > 0 and results[i - 1][1]), None)
    if w is None:
        if all(h for _, h in results):
            print(f'"{target}" is heard at every candidate: move the range later')
        elif not any(h for _, h in results):
            print(f'"{target}" is heard at no candidate: move the range earlier, or check the word and --first')
        else:
            print('no clean change from heard to not heard: shorten --step or look at the levels')
        return 1
    flips = sum(1 for i in range(1, len(results)) if results[i][1] != results[i - 1][1])
    print(f'W = frame {w} (t={w / a.fps:.3f} s): the first cut where "{target}" is no longer heard')
    if flips > 1:
        print(f'  warning: heard/not-heard changes {flips} times in the range; listen around W and compare with the levels')
    return 0


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd_name', required=True)
    p = sub.add_parser('channels')
    p.add_argument('take')
    p.set_defaults(fn=cmd_channels)
    p = sub.add_parser('extract')
    p.add_argument('take')
    p.add_argument('out')
    p.add_argument('--channel', type=int, default=1, help='1 = the first channel')
    p.set_defaults(fn=cmd_extract)
    p = sub.add_parser('levels')
    p.add_argument('wav')
    p.add_argument('--start', type=float, required=True, help='seconds')
    p.add_argument('--end', type=float, required=True, help='seconds')
    p.add_argument('--fps', type=float, default=30)
    p.set_defaults(fn=cmd_levels)
    p = sub.add_parser('trim')
    p.add_argument('wav')
    p.add_argument('--frames', required=True, help='candidate range A-B in frames')
    p.add_argument('--word', required=True)
    p.add_argument('--cmd', required=True, help='transcriber command with {wav}')
    p.add_argument('--fps', type=float, default=30)
    p.add_argument('--tail', type=float, default=2.0, help='seconds kept after each cut')
    p.add_argument('--first', type=int, default=3, help='look for the word among this many first words')
    p.add_argument('--step', type=int, default=1)
    p.set_defaults(fn=cmd_trim)
    a = ap.parse_args(argv)
    return a.fn(a)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
