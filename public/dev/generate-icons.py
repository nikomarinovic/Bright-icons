#!/usr/bin/env python3
"""
Bright Icons — generate_icons.py
Location: public/dev/generate_icons.py

Scans the /icons/ folder, reads each SVG file's raw code,
and embeds it directly into data/icons.json so the gallery
can render icons as inline SVG without any network requests.

JSON format per icon:
  {
    "name":       "VSCode",
    "lightCode":  "<svg>...</svg>",   ← raw SVG markup
    "darkCode":   "<svg>...</svg>",   ← null if no dark variant
    "hasDark":    true
  }

Usage:
    cd public/dev
    python generate_icons.py
"""

import json
import re
from pathlib import Path

# ── Paths (relative to this script location) ─────────────────────
SCRIPT_DIR  = Path(__file__).parent     # public/dev/
ROOT_DIR    = SCRIPT_DIR.parent.parent  # project root
ICONS_DIR   = ROOT_DIR / "icons"
OUTPUT_FILE = ROOT_DIR / "data" / "icons.json"


def read_svg(path: Path) -> str:
    """Read SVG file and return clean inline-safe SVG string."""
    code = path.read_text(encoding="utf-8").strip()

    # Remove XML declaration if present (<?xml ...?>)
    code = re.sub(r'<\?xml[^?]*\?>', '', code).strip()

    # Remove <!DOCTYPE ...> if present
    code = re.sub(r'<!DOCTYPE[^>]*>', '', code, flags=re.IGNORECASE).strip()

    return code


def scan_icons(icons_dir: Path) -> list[dict]:
    """Read all .svg files, embed SVG code, pair _dark variants."""

    if not icons_dir.exists():
        raise FileNotFoundError(f"Icons folder not found: {icons_dir}")

    # Collect all SVG stems, sorted alphabetically
    all_stems = sorted(
        f.stem for f in icons_dir.iterdir()
        if f.suffix.lower() == ".svg"
    )

    # Which base names have a _dark file
    dark_bases = {stem[:-5] for stem in all_stems if stem.endswith("_dark")}

    icons = []
    for stem in all_stems:
        if stem.endswith("_dark"):
            continue  # processed as part of the base icon

        has_dark   = stem in dark_bases
        light_path = icons_dir / f"{stem}.svg"
        dark_path  = icons_dir / f"{stem}_dark.svg"

        light_code = read_svg(light_path)
        dark_code  = read_svg(dark_path) if has_dark else None

        icons.append({
            "name":      stem,
            "lightCode": light_code,
            "darkCode":  dark_code,
            "hasDark":   has_dark,
        })

    return icons


def write_json(icons: list[dict], output_file: Path) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(icons, f, indent=2, ensure_ascii=False)


def main():
    print(f"  Scanning : {ICONS_DIR}")
    print(f"  Output   : {OUTPUT_FILE}")
    print()

    icons = scan_icons(ICONS_DIR)
    write_json(icons, OUTPUT_FILE)

    total      = len(icons)
    with_dark  = sum(1 for i in icons if i["hasDark"])
    light_only = total - with_dark

    print(f"  ✓ {total} icons written to {OUTPUT_FILE.name}")
    print(f"    {with_dark} with dark variant")
    print(f"    {light_only} light only")

    if total:
        print("\n  Preview:")
        for icon in icons[:5]:
            tag = "(light + dark)" if icon["hasDark"] else "(light only)"
            print(f"    • {icon['name']} {tag}")
        if total > 5:
            print(f"    … and {total - 5} more")


if __name__ == "__main__":
    main()