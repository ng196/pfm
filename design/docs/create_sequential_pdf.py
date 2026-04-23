from __future__ import annotations

from pathlib import Path
import re
import sys

from PIL import Image


def natural_key(value: str) -> list[object]:
    parts = re.split(r"(\d+)", value.lower())
    return [int(p) if p.isdigit() else p for p in parts]


def main() -> int:
    docs_dir = Path(__file__).resolve().parent
    content_dir = docs_dir / "content"
    output_pdf = docs_dir / "docs_sequential.pdf"

    if not content_dir.exists():
        print(f"Content folder not found: {content_dir}")
        return 1

    images = sorted(content_dir.glob("*.png"), key=lambda p: natural_key(p.name))
    if not images:
        print(f"No PNG files found in: {content_dir}")
        return 1

    converted: list[Image.Image] = []
    for img_path in images:
        with Image.open(img_path) as img:
            converted.append(img.convert("RGB"))

    first, rest = converted[0], converted[1:]
    first.save(output_pdf, save_all=True, append_images=rest)

    print(f"Created PDF: {output_pdf}")
    print("Included files in order:")
    for img_path in images:
        print(f"- {img_path.name}")

    return 0


if __name__ == "__main__":
    sys.exit(main())