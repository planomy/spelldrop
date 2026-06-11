#!/usr/bin/env python3
"""Split the GPT sprite sheet into individual PNG icons."""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = ROOT / 'assets' / 'gpt-icons-sheet.png'
OUT_DIR = ROOT / 'src' / 'assets' / 'icons'


def find_bottom(arr: np.ndarray, x1: int, x2: int, y_start: int, y_max: int) -> int:
    for y in range(y_max, y_start, -1):
        row = arr[y, x1:x2]
        bright = (row.max(axis=1) > 160).sum()
        purple = ((row[:, 0] > 60) & (row[:, 1] < 140) & (row[:, 2] > 60)).sum()
        if bright > (x2 - x1) * 0.3 and purple < (x2 - x1) * 0.12:
            continue
        return min(y + 2, y_max)
    return y_max


def remove_black(im: Image.Image, threshold: int = 38) -> Image.Image:
    data = np.array(im)
    r, g, b = data[:, :, 0].astype(int), data[:, :, 1].astype(int), data[:, :, 2].astype(int)
    mask = (r + g + b) < threshold * 3
    data[:, :, 3] = np.where(mask, 0, 255)
    return Image.fromarray(data)


def trim_square(im: Image.Image, size: int = 512) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    im = im.crop(bbox)
    side = max(im.size)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.size[0]) // 2, (side - im.size[1]) // 2))
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


BOXES: list[tuple[str, int, int, int, int]] = [
    ('goal-complete.png', 55, 12, 195, 138),
    ('goal-streak.png', 230, 12, 380, 138),
    ('goal-ninja.png', 415, 12, 566, 138),
    ('goal-speed.png', 600, 12, 744, 138),
    ('goal-score.png', 792, 12, 946, 138),
    ('badge-streak-5.png', 242, 195, 367, 308),
    ('badge-streak-10.png', 419, 195, 548, 308),
    ('badge-streak-15.png', 592, 195, 723, 308),
    ('badge-ninja-3.png', 61, 365, 190, 478),
    ('badge-ninja-8.png', 223, 365, 347, 478),
    ('badge-lightning.png', 379, 365, 501, 478),
    ('badge-lightning-3.png', 529, 365, 655, 478),
    ('badge-perfect.png', 690, 365, 815, 478),
    ('badge-perfect-3.png', 838, 365, 960, 478),
    ('badge-long-word.png', 210, 535, 340, 648),
    ('badge-score-500.png', 377, 535, 526, 648),
    ('badge-score-1000.png', 568, 535, 749, 648),
]


def main(src: Path = DEFAULT_SRC, out_dir: Path = OUT_DIR) -> None:
    img = Image.open(src).convert('RGBA')
    arr = np.array(img.convert('RGB'))
    out_dir.mkdir(parents=True, exist_ok=True)

    for name, x1, y1, x2, y_max in BOXES:
        y2 = find_bottom(arr, x1, x2, y1, y_max)
        crop = trim_square(remove_black(img.crop((x1, y1, x2, y2))))
        crop.save(out_dir / name, 'PNG')
        print(f'saved {name}')


if __name__ == '__main__':
    import sys

    src_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    main(src_path)
