#!/usr/bin/env python3
"""Generate deterministic SortLab favicon and social-share raster assets."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

NAVY = "#081226"
NAVY_RAISED = "#101f39"
BLUE = "#67a1ff"
BLUE_BRIGHT = "#75a8ff"
WHITE = "#eef4ff"
MUTED = "#a8b7ce"
BORDER = "#2b3d59"
TEAL = "#48d5bf"
AMBER = "#ffc14a"

BOLD_FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
REGULAR_FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def draw_brand_mark(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    color: str = BLUE,
) -> None:
    left, top, right, bottom = box
    width = right - left
    height = bottom - top
    bar_width = width * (4 / 28)
    gap = width * (3 / 28)
    heights = (9 / 24, 17 / 24, 23 / 24, 13 / 24)
    x = left
    for ratio in heights:
        bar_height = height * ratio
        draw.rounded_rectangle(
            (round(x), round(bottom - bar_height), round(x + bar_width), bottom),
            radius=max(1, round(bar_width * 0.55)),
            fill=color,
        )
        x += bar_width + gap


def favicon_canvas(size: int) -> Image.Image:
    scale = size / 192
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    inset = max(1, round(8 * scale))
    draw.rounded_rectangle(
        (inset, inset, size - inset, size - inset),
        radius=max(2, round(38 * scale)),
        fill=NAVY,
        outline=BORDER,
        width=max(1, round(3 * scale)),
    )
    draw_brand_mark(
        draw,
        (
            round(45 * scale),
            round(46 * scale),
            round(149 * scale),
            round(146 * scale),
        ),
        BLUE_BRIGHT,
    )
    return image


def generate_favicons() -> None:
    for filename, size in (
        ("favicon-16x16.png", 16),
        ("favicon-32x32.png", 32),
        ("mstile-150x150.png", 150),
        ("apple-touch-icon.png", 180),
        ("android-chrome-192x192.png", 192),
        ("android-chrome-512x512.png", 512),
    ):
        favicon_canvas(size).save(PUBLIC / filename, optimize=True)

    base = favicon_canvas(192)
    base.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (192, 192)],
    )


def draw_social_card() -> None:
    width, height = 1200, 630
    image = Image.new("RGB", (width, height), NAVY)
    draw = ImageDraw.Draw(image)

    for x in range(0, width, 60):
        draw.line((x, 0, x, height), fill="#0d1a31", width=1)
    for y in range(0, height, 60):
        draw.line((0, y, width, y), fill="#0d1a31", width=1)

    draw.rounded_rectangle((54, 50, 1146, 580), radius=32, fill=NAVY_RAISED, outline=BORDER, width=2)

    draw_brand_mark(draw, (94, 102, 178, 182), BLUE_BRIGHT)
    title_font = font(BOLD_FONT, 82)
    title_x, title_y = 208, 92
    draw.text((title_x, title_y), "Sort", font=title_font, fill=WHITE)
    sort_width = draw.textlength("Sort", font=title_font)
    draw.text((title_x + sort_width, title_y), "Lab", font=title_font, fill=BLUE_BRIGHT)

    eyebrow_font = font(BOLD_FONT, 20)
    body_font = font(REGULAR_FONT, 32)
    chip_font = font(BOLD_FONT, 17)
    draw.text((94, 222), "OPEN-SOURCE SORTING ALGORITHM PLAYGROUND", font=eyebrow_font, fill=BLUE)
    draw.multiline_text(
        (94, 266),
        "See, hear, compare, and understand\nhow sorting algorithms work.",
        font=body_font,
        fill=WHITE,
        spacing=13,
    )

    chip_x = 94
    for label in ("Visualize", "Compare", "Learn", "Sandbox"):
        text_width = draw.textlength(label, font=chip_font)
        chip_width = round(text_width + 36)
        draw.rounded_rectangle(
            (chip_x, 438, chip_x + chip_width, 482),
            radius=22,
            fill="#142a4d",
            outline="#31517e",
            width=1,
        )
        draw.text((chip_x + 18, 450), label, font=chip_font, fill=MUTED)
        chip_x += chip_width + 12

    panel = (715, 96, 1096, 520)
    draw.rounded_rectangle(panel, radius=24, fill="#0a172b", outline="#31517e", width=2)
    chart_left, chart_top, chart_right, chart_bottom = 758, 154, 1052, 466
    for offset in range(0, 5):
        y = chart_top + offset * ((chart_bottom - chart_top) / 4)
        draw.line((chart_left, y, chart_right, y), fill="#243a5b", width=1)

    heights = [74, 138, 98, 216, 164, 246, 122, 284, 198, 306, 236, 258]
    bar_width, gap = 14, 10
    for index, bar_height in enumerate(heights):
        x = chart_left + index * (bar_width + gap)
        color = AMBER if index == 7 else TEAL if index >= 9 else BLUE_BRIGHT
        draw.rounded_rectangle(
            (x, chart_bottom - bar_height, x + bar_width, chart_bottom),
            radius=4,
            fill=color,
        )

    mono_font = font("/System/Library/Fonts/SFNSMono.ttf", 17)
    draw.text((758, 116), "QUICK SORT · COMPARING", font=mono_font, fill=MUTED)
    draw.text((94, 526), "project.christiantadros.com/sortlab", font=mono_font, fill=MUTED)

    image.save(PUBLIC / "social-share.png", optimize=True)


if __name__ == "__main__":
    PUBLIC.mkdir(parents=True, exist_ok=True)
    generate_favicons()
    draw_social_card()
    print("Generated SortLab favicon suite and social-share.png")
