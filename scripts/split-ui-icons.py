#!/usr/bin/env python3
"""Split speed and UI sprite sheets into individual PNG icons."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPEED_SRC = ROOT / 'assets' / 'speed-icons-sheet.png'
UI_SRC = ROOT / 'assets' / 'ui-icons-sheet.png'
OUT_DIR = ROOT / 'src' / 'assets' / 'icons'


def find_bottom(arr: np.ndarray, x1: int, x2: int, y_start: int, y_max: int) -> int:
    for y in range(y_max, y_start, -1):
        row = arr[y, x1:x2]
        bright = (row.max(axis=1) > 160).sum()
        purple = ((row[:, 0] > 60) & (row[:, 1] < 140) & (row[:, 2] > 60)).sum()
        if bright > (x2 - x1) * 0.25 and purple < (x2 - x1) * 0.1:
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


SPEED_NAMES = ['speed-chill', 'speed-normal', 'speed-fast', 'speed-turbo']

UI_NAMES = [
    ['ui-spelling', 'ui-times-tables', 'ui-leaderboard', 'ui-challenges', 'ui-practice'],
    ['ui-achievements', 'ui-streaks', 'ui-brain-boost', 'ui-rewards', 'ui-progress'],
    ['ui-quick-play', 'ui-topics', 'ui-hot-streak', 'ui-daily-goals', 'ui-settings'],
]


def split_speed(src: Path, out_dir: Path) -> None:
    img = Image.open(src).convert('RGBA')
    arr = np.array(img.convert('RGB'))
    w, h = img.size
    for i, name in enumerate(SPEED_NAMES):
        x1 = int(i * w / 4) + 12
        x2 = int((i + 1) * w / 4) - 12
        y2 = min(find_bottom(arr, x1, x2, 8, h - 10), int(h * 0.72))
        trim_square(remove_black(img.crop((x1, 8, x2, y2)))).save(out_dir / f'{name}.png')
        print(f'saved {name}.png')


def split_ui(src: Path, out_dir: Path) -> None:
    img = Image.open(src).convert('RGBA')
    arr = np.array(img.convert('RGB'))
    w, h = img.size
    for row in range(3):
        for col in range(5):
            x1 = int(col * w / 5) + 12
            x2 = int((col + 1) * w / 5) - 12
            y1 = int(row * h / 3) + 10
            y_max = int((row + 1) * h / 3) - 8
            y2 = min(find_bottom(arr, x1, x2, y1, y_max), y1 + int((y_max - y1) * 0.72))
            name = UI_NAMES[row][col]
            trim_square(remove_black(img.crop((x1, y1, x2, y2)))).save(out_dir / f'{name}.png')
            print(f'saved {name}.png')


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    split_speed(SPEED_SRC, OUT_DIR)
    split_ui(UI_SRC, OUT_DIR)


if __name__ == '__main__':
    main()
