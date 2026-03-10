#!/usr/bin/env python3
"""
Bright Icons — generate_icons.py
Location: public/dev/generate_icons.py

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FILENAME → DISPLAY LABEL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 1. SINGLE WORD (no separator)
    mclaren.svg                 → "Default"
    mclaren_dark.svg            → "Default"         (dark version)
    mclaren_light.svg           → "Mclaren · Light"

 2. UNDERSCORE separator  →  base IS shown in label
    BMW_MSERIES.svg             → "Bmw · Mseries"
    BMW_MSERIES_dark.svg        → "Bmw · Mseries"   (dark version)
    BMW_MSERIES_light.svg       → "Bmw · Mseries · Light"
    BMW_MSERIES_Light.svg       → "Bmw · Mseries · Light"  (casing normalised)
    one_two_three.svg           → "One · Two · Three"
    Ferrari_horse_red.svg       → "Ferrari · Horse · Red"

 3. HYPHEN separator  →  base is HIDDEN in label
    BMW-MSERIES.svg             → "Mseries"
    BMW-MSERIES_dark.svg        → "Mseries"         (dark version)
    BMW-MSERIES_light.svg       → "Mseries · Light"
    AmazonConnect-Inverted.svg  → "Inverted"
    AmazonConnect-Inverted_dark.svg  → "Inverted"   (dark version)
    AmazonConnect-Inverted_Light.svg → "Inverted · Light"
    Ferrari-horse-red.svg       → "Horse · Red"

 4. MIXED separators  →  whichever comes FIRST in the filename wins
    BMW-series_edition.svg      → hyphen first  → base hidden → "Series · Edition"
    BMW_series-edition.svg      → underscore first → base shown → "Bmw · Series · Edition"

 5. _dark suffix  →  always STRIPPED from label, marks the file as the dark version
    anything_dark.svg           → same label as the light counterpart, is_dark=True

 6. _light / _Light / _LIGHT suffix  →  NOT stripped, shown as "Light" in label
    anything_light.svg          → label gains " · Light" at the end, is_dark=False

 7. GROUPING  →  hyphens and underscores both group files under the same icon.
    BMW-MSERIES.svg  +  BMW_MSERIES.svg  → same icon card, two selectable variants
    BMW-MSERIES_dark.svg shows as dark version of "Mseries" variant
    BMW_MSERIES_dark.svg shows as dark version of "Bmw · Mseries" variant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage:
    cd public/dev
    python generate_icons.py
"""

import json
import re
from collections import defaultdict
from pathlib import Path

SCRIPT_DIR  = Path(__file__).parent
ROOT_DIR    = SCRIPT_DIR.parent.parent
ICONS_DIR   = ROOT_DIR / "icons"
OUTPUT_FILE = ROOT_DIR / "data" / "icons.json"


def read_svg(path: Path) -> str:
    code = path.read_text(encoding="utf-8").strip()
    code = re.sub(r'<\?xml[^?]*\?>', '', code).strip()
    code = re.sub(r'<!DOCTYPE[^>]*>', '', code, flags=re.IGNORECASE).strip()
    return code


def parse_stem(stem: str) -> tuple[str, str, bool, str]:
    """
    Returns (base_name, variant_key, is_dark, display_label).

    Separator rules:
      - Hyphen  (-)  → base is HIDDEN from the display label
      - Underscore (_) → base IS shown in the display label
      - Mixed → whichever separator appears first in the filename decides
      - Both separators still group files under the same base icon

    Suffix rules:
      - _dark  (any casing) → stripped silently; marks file as dark version
      - _light (any casing) → kept as "Light" in the label; marks file as light version
    """

    # ── Decide hide_base from whichever separator comes first ──────────────
    has_hyphen     = "-" in stem
    has_underscore = "_" in stem

    if has_hyphen and not has_underscore:
        hide_base = True                          # BMW-MSERIES   → hide base
    elif has_underscore and not has_hyphen:
        hide_base = False                         # BMW_MSERIES   → show base
    else:
        # Mixed: first separator in the original string wins
        # e.g. "BMW-series_edition" → hyphen first → hide base
        #      "BMW_series-edition" → underscore first → show base
        first_hyp = stem.index("-") if has_hyphen else len(stem)
        first_und = stem.index("_") if has_underscore else len(stem)
        hide_base = first_hyp < first_und

    # ── Normalise to underscores and split ─────────────────────────────────
    parts = stem.replace("-", "_").split("_")

    # ── Handle _dark / _light suffix ───────────────────────────────────────
    last = parts[-1].lower()
    if last == "dark":
        # Strip silently — the file is the dark version, label unchanged
        # e.g. BMW_MSERIES_dark → same label as BMW_MSERIES, is_dark=True
        is_dark = True
        parts = parts[:-1]
    elif last == "light":
        # Keep in label as "Light" — file is the light version
        # e.g. bmw-mseries_light → "Mseries · Light", is_dark=False
        # e.g. BMW_MSERIES_Light → "Bmw · Mseries · Light", is_dark=False
        is_dark = False
        parts[-1] = "Light"   # normalise casing: light / Light / LIGHT → Light
    else:
        is_dark = False

    # ── Build base, variant key, display label ─────────────────────────────
    base          = parts[0]
    variant_parts = parts[1:]

    # variant_key is lowercased so BMW_MSERIES and bmw_mseries share a slot
    variant_key = "_".join(p.lower() for p in variant_parts) if variant_parts else "default"

    if not variant_parts:
        # No variant parts at all → always "Default"
        # e.g. mclaren.svg, mclaren_dark.svg
        display_label = "Default"

    elif hide_base:
        # Hyphen-style: show only the variant parts, skip the base
        # e.g. BMW-MSERIES        → "Mseries"
        # e.g. BMW-MSERIES_light  → "Mseries · Light"
        # e.g. Ferrari-horse-red  → "Horse · Red"
        display_label = " · ".join(p.capitalize() for p in variant_parts)

    else:
        # Underscore-style: show base + all variant parts
        # e.g. BMW_MSERIES        → "Bmw · Mseries"
        # e.g. BMW_MSERIES_light  → "Bmw · Mseries · Light"
        # e.g. one_two_three      → "One · Two · Three"
        label_parts   = [base] + variant_parts
        display_label = " · ".join(p.capitalize() for p in label_parts)

    return base, variant_key, is_dark, display_label


def scan_icons(icons_dir: Path) -> list[dict]:
    if not icons_dir.exists():
        raise FileNotFoundError(f"Icons folder not found: {icons_dir}")

    # { base_name: { variant_key: { "light": Path, "dark": Path, "label": str } } }
    icon_map: dict[str, dict[str, dict]] = defaultdict(lambda: defaultdict(dict))

    for svg_file in sorted(icons_dir.iterdir()):
        if svg_file.suffix.lower() != ".svg":
            continue

        base, variant_key, is_dark, display_label = parse_stem(svg_file.stem)
        slot = icon_map[base][variant_key]
        slot["label"] = display_label
        slot["dark" if is_dark else "light"] = svg_file

    icons = []
    for base_name in sorted(icon_map.keys()):
        variant_data = {}
        for variant_key in sorted(icon_map[base_name].keys()):
            slot       = icon_map[base_name][variant_key]
            light_path = slot.get("light")
            dark_path  = slot.get("dark")
            label      = slot.get("label", variant_key)

            # Skip only if somehow both paths are missing
            if light_path is None and dark_path is None:
                continue

            variant_data[variant_key] = {
                "label":     label,
                "lightCode": read_svg(light_path) if light_path else None,
                "darkCode":  read_svg(dark_path)  if dark_path  else None,
            }

        if not variant_data:
            continue

        icons.append({
            "name":     base_name,
            "variants": variant_data,
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

    total          = len(icons)
    total_variants = sum(len(i["variants"]) for i in icons)
    with_dark      = sum(
        1 for i in icons
        if any(v["darkCode"] for v in i["variants"].values())
    )
    multi_variant  = sum(1 for i in icons if len(i["variants"]) > 1)

    print(f"  ✓ {total} icons written to {OUTPUT_FILE.name}")
    print(f"    {total_variants} total variants across all icons")
    print(f"    {with_dark} icons with at least one dark variant")
    print(f"    {multi_variant} icons with multiple variants")

    if total:
        print("\n  Preview:")
        for icon in icons[:5]:
            v_labels = [f"{k} ({v['label']})" for k, v in icon["variants"].items()]
            print(f"    • {icon['name']}  →  {', '.join(v_labels)}")
        if total > 5:
            print(f"    … and {total - 5} more")


if __name__ == "__main__":
    main()