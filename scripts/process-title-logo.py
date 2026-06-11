#!/usr/bin/env python3
"""Remove the dark background from the title logo source image."""

from __future__ import annotations

import math
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets' / 'title-logo-source.png'
OUT = ROOT / 'src' / 'assets' / 'title-logo.png'
PAD = 10


def sample_background(image: Image.Image) -> tuple[float, float, float]:
    pixels = image.load()
    width, height = image.size
    samples: list[tuple[int, int, int]] = []

    for x in range(width):
        samples.append(pixels[x, 0][:3])
        samples.append(pixels[x, height - 1][:3])
    for y in range(height):
        samples.append(pixels[0, y][:3])
        samples.append(pixels[width - 1, y][:3])

    return (
        sum(color[0] for color in samples) / len(samples),
        sum(color[1] for color in samples) / len(samples),
        sum(color[2] for color in samples) / len(samples),
    )


def is_bg_like(r: int, g: int, b: int, bg: tuple[float, float, float]) -> bool:
    dist = math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2)
    sat = max(r, g, b) - min(r, g, b)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    bg_lum = 0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]
    lum_limit = max(55, bg_lum + 40)
    return dist < 24 and sat < 18 and lum < lum_limit


def flood_remove_background(image: Image.Image, bg: tuple[float, float, float]) -> Image.Image:
    width, height = image.size
    pixels = image.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        index = y * width + x
        if visited[index]:
            return
        r, g, b, _ = pixels[x, y]
        if is_bg_like(r, g, b, bg):
            visited[index] = 1
            queue.append((x, y))

    for x in range(width):
        try_seed(x, 0)
        try_seed(x, height - 1)
    for y in range(height):
        try_seed(0, y)
        try_seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height:
                index = ny * width + nx
                if not visited[index]:
                    r, g, b, _ = pixels[nx, ny]
                    if is_bg_like(r, g, b, bg):
                        visited[index] = 1
                        queue.append((nx, ny))

    output = image.copy()
    out_pixels = output.load()
    for y in range(height):
        for x in range(width):
            if visited[y * width + x]:
                r, g, b, _ = out_pixels[x, y]
                out_pixels[x, y] = (r, g, b, 0)

    for y in range(height):
        for x in range(width):
            r, g, b, a = out_pixels[x, y]
            if a > 0 and is_bg_like(r, g, b, bg):
                out_pixels[x, y] = (r, g, b, 0)

    for y in range(1, height - 1):
        for x in range(1, width - 1):
            r, g, b, a = out_pixels[x, y]
            if a == 0:
                continue
            dist = math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2)
            sat = max(r, g, b) - min(r, g, b)
            if dist < 35 and sat < 20:
                fade = min(1.0, max(0.0, (dist - 10) / 25))
                out_pixels[x, y] = (r, g, b, int(a * fade))

    return output


def crop_to_content(image: Image.Image, pad: int = PAD) -> Image.Image:
    pixels = image.load()
    width, height = image.size
    min_x, min_y = width, height
    max_x, max_y = 0, 0

    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > 6:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x < min_x:
        return image

    return image.crop(
        (
            max(0, min_x - pad),
            max(0, min_y - pad),
            min(width, max_x + pad + 1),
            min(height, max_y + pad + 1),
        )
    )


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f'Missing source image: {SRC}')

    image = Image.open(SRC).convert('RGBA')
    bg = sample_background(image)
    image = flood_remove_background(image, bg)
    image = crop_to_content(image)
    image.save(OUT)
    print(f'processed {SRC.name} -> {OUT} ({image.size[0]}x{image.size[1]}) bg={bg}')


if __name__ == '__main__':
    main()
