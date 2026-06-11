#!/usr/bin/env python3
"""
Render slides-rendered/*.png (1920×1080) from slides-content.json.
Direct Pillow drawing — no LaTeX PDF / screenshot pipeline.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Missing dependency: pip install pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[2]
VIDEO = ROOT / "docs" / "presentation" / "video"
FIGURES = ROOT / "docs" / "presentation" / "figures"
CONTENT_PATH = VIDEO / "slides-content.json"
SLIDE_MAP_PATH = VIDEO / "slide-map.json"
OUT_DIR = VIDEO / "slides-rendered"

W, H = 1920, 1080
HEADER_H = 92
FOOTER_H = 58
MARGIN_X = 80
CONTENT_TOP = HEADER_H + 36
CONTENT_BOTTOM = H - FOOTER_H - 36

# Madrid + seahorse-ish palette
C_BG = (255, 255, 255)
C_HEADER = (44, 95, 138)
C_HEADER_LIGHT = (230, 240, 248)
C_FOOTER = (44, 95, 138)
C_TEXT = (24, 32, 48)
C_MUTED = (80, 96, 112)
C_URL = (0, 128, 128)
C_ACCENT = (44, 95, 138)
C_TABLE_LINE = (180, 196, 210)
C_TABLE_HEAD = (240, 246, 252)


def find_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    win = Path("C:/Windows/Fonts")
    candidates = []
    if bold:
        candidates += [
            win / "segoeuib.ttf",
            win / "arialbd.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
    else:
        candidates += [
            win / "segoeui.ttf",
            win / "arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
    for path in candidates:
        p = Path(path)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def text_width(draw: ImageDraw.ImageDraw, text: str, font) -> float:
    if hasattr(draw, "textlength"):
        return draw.textlength(text, font=font)
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, font, max_w: float) -> list[str]:
    words = text.split()
    if not words:
        return []
    lines: list[str] = []
    cur: list[str] = []
    for word in words:
        trial = " ".join(cur + [word])
        if text_width(draw, trial, font) <= max_w or not cur:
            cur.append(word)
        else:
            lines.append(" ".join(cur))
            cur = [word]
    if cur:
        lines.append(" ".join(cur))
    return lines


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    text: str,
    font,
    fill,
    max_w: float,
    line_gap: int = 8,
) -> int:
    yy = y
    for line in wrap_lines(draw, text, font, max_w):
        draw.text((x, yy), line, font=font, fill=fill)
        yy += font.size + line_gap
    return yy


def fit_image(path: Path, box_w: int, box_h: int) -> Image.Image | None:
    if not path.exists():
        return None
    img = Image.open(path).convert("RGBA")
    scale = min(box_w / img.width, box_h / img.height)
    nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
    return img.resize((nw, nh), Image.Resampling.LANCZOS)


def paste_centered(base: Image.Image, img: Image.Image, box_x: int, box_y: int, box_w: int, box_h: int) -> None:
    x = box_x + (box_w - img.width) // 2
    y = box_y + (box_h - img.height) // 2
    if img.mode == "RGBA":
        base.paste(img, (x, y), img)
    else:
        base.paste(img, (x, y))


class SlideRenderer:
    def __init__(self, meta: dict):
        self.meta = meta
        self.title_font = find_font(52, bold=True)
        self.subtitle_font = find_font(30)
        self.header_font = find_font(36, bold=True)
        self.body_font = find_font(30)
        self.small_font = find_font(26)
        self.footer_font = find_font(22)
        self.plain_large = find_font(56, bold=True)

    def new_slide(self) -> tuple[Image.Image, ImageDraw.ImageDraw]:
        img = Image.new("RGB", (W, H), C_BG)
        return img, ImageDraw.Draw(img)

    def draw_frame_chrome(self, draw: ImageDraw.ImageDraw, title: str, page: int, total: int, plain: bool = False) -> None:
        if plain:
            return
        draw.rectangle((0, 0, W, HEADER_H), fill=C_HEADER)
        draw.text((MARGIN_X, 22), title, font=self.header_font, fill=(255, 255, 255))
        draw.rectangle((0, H - FOOTER_H, W, H), fill=C_FOOTER)
        left = self.meta["author"][:52] + "…" if len(self.meta["author"]) > 55 else self.meta["author"]
        draw.text((MARGIN_X, H - FOOTER_H + 16), left, font=self.footer_font, fill=(230, 240, 248))
        mid = self.meta["title"]
        mid_w = text_width(draw, mid, self.footer_font)
        draw.text(((W - mid_w) / 2, H - FOOTER_H + 16), mid, font=self.footer_font, fill=(230, 240, 248))
        right = f"{self.meta['date']}    {page} / {total}"
        right_w = text_width(draw, right, self.footer_font)
        draw.text((W - MARGIN_X - right_w, H - FOOTER_H + 16), right, font=self.footer_font, fill=(230, 240, 248))

    def render_title(self, page: int, total: int) -> Image.Image:
        img, draw = self.new_slide()
        pad = 48
        box_h = 280
        draw.rounded_rectangle((pad, pad, W - pad, pad + box_h), radius=18, fill=C_HEADER_LIGHT, outline=C_HEADER, width=3)
        title = self.meta["title"]
        tw = text_width(draw, title, self.title_font)
        draw.text(((W - tw) / 2, pad + 36), title, font=self.title_font, fill=C_ACCENT)
        sub_lines = wrap_lines(draw, self.meta["subtitle"], self.subtitle_font, W - pad * 2 - 80)
        sy = pad + 110
        for line in sub_lines:
            sw = text_width(draw, line, self.subtitle_font)
            draw.text(((W - sw) / 2, sy), line, font=self.subtitle_font, fill=C_MUTED)
            sy += self.subtitle_font.size + 6

        y = pad + box_h + 72
        for line, font, color in [
            (self.meta["author"], find_font(40, bold=True), C_TEXT),
            (self.meta["institute"], self.subtitle_font, C_MUTED),
            (self.meta["date"], self.body_font, C_MUTED),
        ]:
            lw = text_width(draw, line, font)
            draw.text(((W - lw) / 2, y), line, font=font, fill=color)
            y += font.size + 18

        url = self.meta["url"]
        uw = text_width(draw, url, self.body_font)
        draw.text(((W - uw) / 2, H - 120), url, font=self.body_font, fill=C_URL)
        self.draw_frame_chrome(draw, self.meta["title"], page, total, plain=True)
        return img

    def render_bullets(self, slide: dict, page: int, total: int) -> Image.Image:
        img, draw = self.new_slide()
        self.draw_frame_chrome(draw, slide["title"], page, total)
        y = CONTENT_TOP
        max_w = W - MARGIN_X * 2 - 40
        for item in slide.get("items", []):
            lines = wrap_lines(draw, item, self.body_font, max_w - 36)
            draw.text((MARGIN_X, y + 4), "•", font=self.body_font, fill=C_ACCENT)
            for i, line in enumerate(lines):
                draw.text((MARGIN_X + 36, y), line, font=self.body_font, fill=C_TEXT)
                y += self.body_font.size + (8 if i < len(lines) - 1 else 14)
            y += 6
        closing = slide.get("closing")
        if closing:
            y += 16
            y = draw_wrapped(draw, MARGIN_X, y, closing, self.body_font, C_TEXT, max_w)
        if slide.get("showUrl"):
            draw.text((MARGIN_X, H - FOOTER_H - 52), self.meta["url"], font=self.small_font, fill=C_URL)
        return img

    def render_numbered(self, slide: dict, page: int, total: int) -> Image.Image:
        img, draw = self.new_slide()
        self.draw_frame_chrome(draw, slide["title"], page, total)
        y = CONTENT_TOP
        max_w = W - MARGIN_X * 2 - 50
        for i, item in enumerate(slide.get("items", []), 1):
            num = f"{i}."
            lines = wrap_lines(draw, item, self.body_font, max_w - 44)
            draw.text((MARGIN_X, y), num, font=self.body_font, fill=C_ACCENT)
            for j, line in enumerate(lines):
                draw.text((MARGIN_X + 44, y), line, font=self.body_font, fill=C_TEXT)
                y += self.body_font.size + (8 if j < len(lines) - 1 else 14)
            y += 6
        closing = slide.get("closing")
        if closing:
            y += 16
            draw_wrapped(draw, MARGIN_X, y, closing, self.body_font, C_TEXT, max_w)
        if slide.get("showUrl"):
            draw.text((MARGIN_X, H - FOOTER_H - 52), self.meta["url"], font=self.small_font, fill=C_URL)
        return img

    def render_columns(self, slide: dict, page: int, total: int) -> Image.Image:
        img, draw = self.new_slide()
        self.draw_frame_chrome(draw, slide["title"], page, total)
        ratio = slide.get("imageWidth", 0.6)
        gap = 32
        left_w = int((W - MARGIN_X * 2 - gap) * ratio)
        right_x = MARGIN_X + left_w + gap
        right_w = W - MARGIN_X - right_x
        box_y = CONTENT_TOP
        box_h = H - FOOTER_H - CONTENT_TOP - (48 if slide.get("showUrl") else 16)

        fig = FIGURES / slide["image"]
        fitted = fit_image(fig, left_w, box_h)
        if fitted:
            paste_centered(img, fitted, MARGIN_X, box_y, left_w, box_h)

        y = box_y
        st = slide.get("sidebarTitle", "")
        if st:
            y = draw_wrapped(draw, right_x, y, st, find_font(28, bold=True), C_TEXT, right_w, 6) + 12
        for item in slide.get("bullets", []):
            lines = wrap_lines(draw, item, self.small_font, right_w - 32)
            draw.text((right_x, y + 2), "•", font=self.small_font, fill=C_ACCENT)
            for i, line in enumerate(lines):
                draw.text((right_x + 28, y), line, font=self.small_font, fill=C_TEXT)
                y += self.small_font.size + (6 if i < len(lines) - 1 else 10)
            y += 4
        if slide.get("showUrl"):
            draw.text((right_x, H - FOOTER_H - 52), self.meta["url"], font=self.small_font, fill=C_URL)
        return img

    def render_image_center(self, slide: dict, page: int, total: int) -> Image.Image:
        img, draw = self.new_slide()
        self.draw_frame_chrome(draw, slide["title"], page, total)
        ratio = slide.get("imageWidth", 0.5)
        img_w = int(W * ratio)
        img_h = int((H - FOOTER_H - CONTENT_TOP) * 0.72)
        box_x = (W - img_w) // 2
        box_y = CONTENT_TOP
        fitted = fit_image(FIGURES / slide["image"], img_w, img_h)
        if fitted:
            paste_centered(img, fitted, box_x, box_y, img_w, img_h)
        cap_y = box_y + img_h + 24
        draw_wrapped(
            draw,
            MARGIN_X,
            cap_y,
            slide.get("caption", ""),
            self.small_font,
            C_MUTED,
            W - MARGIN_X * 2,
        )
        return img

    def render_table(self, slide: dict, page: int, total: int) -> Image.Image:
        img, draw = self.new_slide()
        self.draw_frame_chrome(draw, slide["title"], page, total)
        headers = slide["headers"]
        rows = slide["rows"]
        col_ratios = [0.20, 0.38, 0.36]
        table_x = MARGIN_X
        table_y = CONTENT_TOP + 8
        table_w = W - MARGIN_X * 2
        col_ws = [int(table_w * r) for r in col_ratios]
        row_h = 56
        header_h = 52
        font = find_font(24)
        bold = find_font(24, bold=True)

        x = table_x
        for i, h in enumerate(headers):
            cw = col_ws[i]
            draw.rectangle((x, table_y, x + cw, table_y + header_h), fill=C_TABLE_HEAD, outline=C_TABLE_LINE)
            draw_wrapped(draw, x + 10, table_y + 12, h, bold, C_TEXT, cw - 20, 4)
            x += cw

        y = table_y + header_h
        for row in rows:
            x = table_x
            for i, cell in enumerate(row):
                cw = col_ws[i]
                draw.rectangle((x, y, x + cw, y + row_h), fill=C_BG, outline=C_TABLE_LINE)
                f = bold if i == 0 else font
                draw_wrapped(draw, x + 10, y + 10, cell, f, C_TEXT, cw - 20, 3)
                x += cw
            y += row_h
        return img

    def render_plain(self, slide: dict) -> Image.Image:
        img, draw = self.new_slide()
        lines = slide.get("lines", [])
        y = H // 2 - len(lines) * 36
        for i, line in enumerate(lines):
            is_url = line.startswith("http")
            font = self.plain_large if i == 0 else (self.body_font if is_url else self.subtitle_font)
            color = C_URL if is_url else (C_ACCENT if i == 0 else C_MUTED)
            lw = text_width(draw, line, font)
            draw.text(((W - lw) / 2, y), line, font=font, fill=color)
            y += font.size + (28 if i == 0 else 20)
        return img

    def render(self, slide: dict, page: int, total: int) -> Image.Image:
        layout = slide["layout"]
        if layout == "title":
            return self.render_title(page, total)
        if layout == "bullets":
            return self.render_bullets(slide, page, total)
        if layout == "numbered":
            return self.render_numbered(slide, page, total)
        if layout == "columns":
            return self.render_columns(slide, page, total)
        if layout == "image_center":
            return self.render_image_center(slide, page, total)
        if layout == "table":
            return self.render_table(slide, page, total)
        if layout == "plain":
            return self.render_plain(slide)
        raise ValueError(f"Unknown layout: {layout}")


# --- 9:16 portrait — content only, no Beamer slide chrome ---
MW, MH = 1080, 1920
MMX = 48
SUB_SAFE = 420  # bottom zone for burned-in subtitles


class MobileContentRenderer:
    """Full-height 1080×1920 content cards — no letterboxed slide frame."""

    def __init__(self, meta: dict):
        self.meta = meta
        self.title_font = find_font(46, bold=True)
        self.section_font = find_font(34, bold=True)
        self.body_font = find_font(30)
        self.small_font = find_font(26)
        self.hero_font = find_font(52, bold=True)

    def new_canvas(self) -> tuple[Image.Image, ImageDraw.ImageDraw]:
        img = Image.new("RGB", (MW, MH), C_BG)
        draw = ImageDraw.Draw(img)
        # reserve bottom band for subtitles (slightly tinted)
        draw.rectangle((0, MH - SUB_SAFE, MW, MH), fill=(248, 250, 252))
        return img, draw

    def draw_heading(self, draw: ImageDraw.ImageDraw, title: str, y: int = 56) -> int:
        return draw_wrapped(draw, MMX, y, title, self.title_font, C_ACCENT, MW - MMX * 2, 6) + 20

    def max_content_y(self) -> int:
        return MH - SUB_SAFE - 24

    def render_title(self) -> Image.Image:
        img, draw = self.new_canvas()
        y = 120
        y = draw_wrapped(draw, MMX, y, self.meta["title"], self.hero_font, C_ACCENT, MW - MMX * 2, 8) + 16
        y = draw_wrapped(draw, MMX, y, self.meta["subtitle"], self.body_font, C_MUTED, MW - MMX * 2) + 40
        for line, font in [
            (self.meta["author"], find_font(36, bold=True)),
            (self.meta["institute"], self.small_font),
            (self.meta["date"], self.small_font),
        ]:
            y = draw_wrapped(draw, MMX, y, line, font, C_TEXT if font.size > 30 else C_MUTED, MW - MMX * 2) + 14
        draw_wrapped(draw, MMX, MH - SUB_SAFE - 80, self.meta["url"], self.body_font, C_URL, MW - MMX * 2)
        return img

    def render_bullets(self, slide: dict) -> Image.Image:
        img, draw = self.new_canvas()
        y = self.draw_heading(draw, slide["title"])
        max_w = MW - MMX * 2 - 36
        for item in slide.get("items", []):
            if y > self.max_content_y():
                break
            lines = wrap_lines(draw, item, self.body_font, max_w)
            draw.text((MMX, y + 2), "•", font=self.body_font, fill=C_ACCENT)
            for line in lines:
                draw.text((MMX + 32, y), line, font=self.body_font, fill=C_TEXT)
                y += self.body_font.size + 8
            y += 10
        closing = slide.get("closing")
        if closing and y < self.max_content_y():
            y += 12
            draw_wrapped(draw, MMX, y, closing, self.small_font, C_MUTED, MW - MMX * 2)
        if slide.get("showUrl"):
            draw.text((MMX, MH - SUB_SAFE - 56), self.meta["url"], font=self.small_font, fill=C_URL)
        return img

    def render_numbered(self, slide: dict) -> Image.Image:
        img, draw = self.new_canvas()
        y = self.draw_heading(draw, slide["title"])
        max_w = MW - MMX * 2 - 44
        for i, item in enumerate(slide.get("items", []), 1):
            if y > self.max_content_y():
                break
            lines = wrap_lines(draw, item, self.body_font, max_w)
            draw.text((MMX, y), f"{i}.", font=self.body_font, fill=C_ACCENT)
            for line in lines:
                draw.text((MMX + 40, y), line, font=self.body_font, fill=C_TEXT)
                y += self.body_font.size + 8
            y += 10
        closing = slide.get("closing")
        if closing and y < self.max_content_y():
            y += 12
            draw_wrapped(draw, MMX, y, closing, self.small_font, C_MUTED, MW - MMX * 2)
        if slide.get("showUrl"):
            draw.text((MMX, MH - SUB_SAFE - 56), self.meta["url"], font=self.small_font, fill=C_URL)
        return img

    def render_columns(self, slide: dict) -> Image.Image:
        img, draw = self.new_canvas()
        y = self.draw_heading(draw, slide["title"])
        img_h = min(720, self.max_content_y() - y - 120)
        fitted = fit_image(FIGURES / slide["image"], MW - MMX * 2, img_h)
        if fitted:
            paste_centered(img, fitted, MMX, y, MW - MMX * 2, img_h)
            y += img_h + 24
        st = slide.get("sidebarTitle", "")
        if st:
            y = draw_wrapped(draw, MMX, y, st, self.section_font, C_TEXT, MW - MMX * 2, 4) + 12
        for item in slide.get("bullets", []):
            if y > self.max_content_y():
                break
            lines = wrap_lines(draw, item, self.small_font, MW - MMX * 2 - 32)
            draw.text((MMX, y + 2), "•", font=self.small_font, fill=C_ACCENT)
            for line in lines:
                draw.text((MMX + 28, y), line, font=self.small_font, fill=C_TEXT)
                y += self.small_font.size + 6
            y += 6
        if slide.get("showUrl"):
            draw.text((MMX, MH - SUB_SAFE - 56), self.meta["url"], font=self.small_font, fill=C_URL)
        return img

    def render_image_center(self, slide: dict) -> Image.Image:
        img, draw = self.new_canvas()
        y = self.draw_heading(draw, slide["title"])
        img_h = min(900, self.max_content_y() - y - 100)
        fitted = fit_image(FIGURES / slide["image"], MW - MMX * 2, img_h)
        if fitted:
            paste_centered(img, fitted, MMX, y, MW - MMX * 2, img_h)
            y += img_h + 20
        if slide.get("caption") and y < self.max_content_y():
            draw_wrapped(draw, MMX, y, slide["caption"], self.small_font, C_MUTED, MW - MMX * 2)
        return img

    def render_table(self, slide: dict) -> Image.Image:
        img, draw = self.new_canvas()
        y = self.draw_heading(draw, slide["title"])
        for row in slide["rows"]:
            if y > self.max_content_y() - 80:
                break
            theme, gain, platform = row
            draw.rounded_rectangle(
                (MMX, y, MW - MMX, y + 118), radius=12, fill=C_TABLE_HEAD, outline=C_TABLE_LINE, width=1
            )
            ty = y + 14
            ty = draw_wrapped(draw, MMX + 16, ty, theme, find_font(28, bold=True), C_ACCENT, MW - MMX * 2 - 32, 2) + 4
            ty = draw_wrapped(draw, MMX + 16, ty, gain, self.small_font, C_TEXT, MW - MMX * 2 - 32, 2) + 4
            draw_wrapped(draw, MMX + 16, ty, platform, self.small_font, C_MUTED, MW - MMX * 2 - 32, 2)
            y += 130
        return img

    def render_plain(self, slide: dict) -> Image.Image:
        img, draw = self.new_canvas()
        lines = slide.get("lines", [])
        y = MH // 2 - len(lines) * 40
        for i, line in enumerate(lines):
            is_url = line.startswith("http")
            font = self.hero_font if i == 0 else (self.body_font if is_url else self.section_font)
            color = C_URL if is_url else (C_ACCENT if i == 0 else C_MUTED)
            lw = text_width(draw, line, font)
            draw.text(((MW - lw) / 2, y), line, font=font, fill=color)
            y += font.size + (24 if i == 0 else 18)
        return img

    def render(self, slide: dict, page: int, total: int) -> Image.Image:
        layout = slide["layout"]
        if layout == "title":
            return self.render_title()
        if layout == "bullets":
            return self.render_bullets(slide)
        if layout == "numbered":
            return self.render_numbered(slide)
        if layout == "columns":
            return self.render_columns(slide)
        if layout == "image_center":
            return self.render_image_center(slide)
        if layout == "table":
            return self.render_table(slide)
        if layout == "plain":
            return self.render_plain(slide)
        raise ValueError(f"Unknown layout: {layout}")


def render_set(slide_map, slides_by_id, meta, out_dir: Path, mobile: bool) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    total = len(slide_map)
    renderer = MobileContentRenderer(meta) if mobile else SlideRenderer(meta)
    label = "1080×1920 content" if mobile else "1920×1080"
    print(f"Rendering {label} → {out_dir.name}/ …")
    tw, th = (MW, MH) if mobile else (W, H)
    for entry in slide_map:
        sid = entry["id"]
        page = entry["page"]
        slide = slides_by_id.get(sid)
        if not slide:
            raise SystemExit(f"Missing slide content for id={sid!r}")
        out = out_dir / f"{sid}.png"
        img = renderer.render(slide, page, total)
        if img.size != (tw, th):
            img = img.resize((tw, th), Image.Resampling.LANCZOS)
        img.save(out, "PNG", optimize=True)
        print(f"  ✓ {sid}.png")


def main() -> None:
    data = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    slide_map = json.loads(SLIDE_MAP_PATH.read_text(encoding="utf-8"))
    slides_by_id = {s["id"]: s for s in data["slides"]}
    meta = data["meta"]

    render_set(slide_map, slides_by_id, meta, OUT_DIR, mobile=False)
    mobile_dir = VIDEO / "slides-rendered-mobile"
    render_set(slide_map, slides_by_id, meta, mobile_dir, mobile=True)

    print(f"\nLandscape → {OUT_DIR}")
    print(f"Mobile    → {mobile_dir}")


if __name__ == "__main__":
    main()
