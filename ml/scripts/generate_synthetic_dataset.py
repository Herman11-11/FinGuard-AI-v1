from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

from config import RAW_DATA_DIR


CANVAS_SIZE = (1240, 1754)  # roughly A4 portrait at moderate resolution


OWNERS = [
    "Amina Mwakalinga",
    "Joseph Nyerere",
    "Rehema Mushi",
    "John Mrema",
    "Neema Mollel",
    "Hassan Mfaume",
    "Dotto Mwesiga",
    "Leila Mjema",
    "Peter Sanga",
    "Joyce Komba",
]

LOCATIONS = [
    ("Dar es Salaam", "Kinondoni"),
    ("Arusha", "Meru"),
    ("Mwanza", "Ilemela"),
    ("Dodoma", "Chamwino"),
    ("Mbeya", "Rungwe"),
    ("Morogoro", "Kilosa"),
]


def get_font(size: int, bold: bool = False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def draw_multiline(draw: ImageDraw.ImageDraw, x: int, y: int, lines: list[str], font, fill, gap: int = 12):
    current_y = y
    for line in lines:
        draw.text((x, current_y), line, font=font, fill=fill)
        bbox = draw.textbbox((x, current_y), line, font=font)
        current_y += (bbox[3] - bbox[1]) + gap
    return current_y


def build_document_fields(index: int) -> dict:
    owner = OWNERS[index % len(OWNERS)]
    region, district = LOCATIONS[index % len(LOCATIONS)]
    plot_code = f"PLT-2026-{index + 1:03d}"
    record_id = f"LAND-SYN-{index + 1:03d}"
    acreage = random.choice(["450 sqm", "620 sqm", "1.2 acres", "2.4 acres", "780 sqm"])
    block = random.choice(["Block A", "Block B", "Sector East", "Parcel Zone 3", "Registry Unit 5"])

    return {
        "record_id": record_id,
        "plot_number": plot_code,
        "owner": owner,
        "region": region,
        "district": district,
        "location": f"{block}, {district}",
        "area": acreage,
        "title_no": f"TD-{2026 + (index % 2)}-{index + 11:04d}",
        "issue_date": f"{random.randint(1, 28):02d}/{random.randint(1, 12):02d}/2026",
    }


def create_base_document(fields: dict) -> Image.Image:
    image = Image.new("RGB", CANVAS_SIZE, "#f7f3e8")
    draw = ImageDraw.Draw(image)

    title_font = get_font(54, bold=True)
    heading_font = get_font(26, bold=True)
    body_font = get_font(26)
    small_font = get_font(18)

    # background border
    draw.rectangle((40, 40, CANVAS_SIZE[0] - 40, CANVAS_SIZE[1] - 40), outline="#1e5a42", width=5)
    draw.rectangle((65, 65, CANVAS_SIZE[0] - 65, CANVAS_SIZE[1] - 65), outline="#c7a85a", width=2)

    # header
    draw.text((110, 120), "THE UNITED REPUBLIC OF TANZANIA", font=heading_font, fill="#173f2f")
    draw.text((110, 170), "MINISTRY OF LANDS, HOUSING AND HUMAN SETTLEMENTS", font=small_font, fill="#4d5c53")
    draw.text((110, 235), "CERTIFICATE OF RIGHT OF OCCUPANCY", font=title_font, fill="#0f2d20")

    # seal placeholder
    seal_box = (920, 105, 1090, 275)
    draw.ellipse(seal_box, outline="#c7a85a", width=4)
    draw.text((954, 165), "ML", font=get_font(42, bold=True), fill="#1e5a42")
    draw.text((944, 218), "OFFICIAL", font=small_font, fill="#6a5a2f")

    # gold divider
    draw.line((110, 320, 1130, 320), fill="#c7a85a", width=3)

    # body fields
    left_x = 120
    right_x = 690
    start_y = 380
    row_gap = 120

    labels_left = [
        ("Record ID", fields["record_id"]),
        ("Title Number", fields["title_no"]),
        ("Owner", fields["owner"]),
        ("Plot Number", fields["plot_number"]),
    ]
    labels_right = [
        ("Region", fields["region"]),
        ("District", fields["district"]),
        ("Location", fields["location"]),
        ("Area", fields["area"]),
    ]

    for i, (label, value) in enumerate(labels_left):
        y = start_y + (i * row_gap)
        draw.text((left_x, y), label, font=small_font, fill="#6a6a6a")
        draw.text((left_x, y + 32), value, font=body_font, fill="#13241c")
        draw.line((left_x, y + 76, 560, y + 76), fill="#b7b3a8", width=1)

    for i, (label, value) in enumerate(labels_right):
        y = start_y + (i * row_gap)
        draw.text((right_x, y), label, font=small_font, fill="#6a6a6a")
        draw.text((right_x, y + 32), value, font=body_font, fill="#13241c")
        draw.line((right_x, y + 76, 1110, y + 76), fill="#b7b3a8", width=1)

    clauses = [
        "This title deed certifies lawful occupancy under the laws of the United Republic of Tanzania.",
        "Any unauthorized alteration, duplication, or substitution renders this deed invalid.",
        "All disputes shall be verified against the official ministry registry and digital trust record.",
    ]
    end_y = draw_multiline(draw, 120, 920, clauses, get_font(22), "#35453d", gap=18)

    # footer signatures
    footer_y = end_y + 120
    draw.line((120, footer_y, 420, footer_y), fill="#7d7d7d", width=1)
    draw.text((120, footer_y + 10), "Registrar of Titles", font=small_font, fill="#555")

    draw.line((760, footer_y, 1080, footer_y), fill="#7d7d7d", width=1)
    draw.text((760, footer_y + 10), "Commissioner for Lands", font=small_font, fill="#555")

    draw.text((120, 1600), f"Issue Date: {fields['issue_date']}", font=body_font, fill="#23392f")
    draw.text((120, 1660), "FinGuard-AI Synthetic Prototype Sample", font=small_font, fill="#7a7a7a")

    return image


def save_variations(doc_dir: Path, base_image: Image.Image):
    clean_path = doc_dir / "scan_clean.png"
    base_image.save(clean_path)

    photo = base_image.copy().rotate(random.uniform(-2.5, 2.5), expand=False, fillcolor="#f7f3e8")
    photo = ImageEnhance.Contrast(photo).enhance(random.uniform(0.92, 1.08))
    photo = ImageEnhance.Brightness(photo).enhance(random.uniform(0.94, 1.06))
    photo.save(doc_dir / "camera_photo.jpg", quality=92)

    compressed = base_image.copy().resize((1100, 1555))
    compressed = compressed.filter(ImageFilter.GaussianBlur(radius=0.4))
    compressed.save(doc_dir / "compressed_copy.jpg", quality=68)

    bright = ImageEnhance.Brightness(base_image.copy()).enhance(1.1)
    bright.save(doc_dir / "bright_scan.png")


def generate_dataset(count: int = 12):
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

    for index in range(count):
        fields = build_document_fields(index)
        doc_dir = RAW_DATA_DIR / fields["record_id"]
        doc_dir.mkdir(parents=True, exist_ok=True)
        base_image = create_base_document(fields)
        save_variations(doc_dir, base_image)

    print(f"Generated {count} synthetic title deed folders in {RAW_DATA_DIR}")


if __name__ == "__main__":
    random.seed(42)
    generate_dataset()
