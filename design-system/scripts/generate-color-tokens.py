#!/usr/bin/env python3
"""Regenerate primitives.css and semantic-colors.css from Forge YAML in _forge-export."""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
TOKEN_DIR = ROOT / "_forge-export/Forge export/@athena/forge-shared/src/tokens"
OUT = ROOT / "design-system/tokens"

prim_path = TOKEN_DIR / "primitive/_color-primitives.yml"
text = prim_path.read_text()
props = {}
for block in re.finditer(r"- name: '([^']+)'\s+value: ([^\n#]+)", text):
    props[block.group(1)] = block.group(2).strip()

semantic_maps = {
    "brand": {"default": "purple-default", "dark": "purple-dark", "light": "purple-light"},
    "font": {"default": "gray-20", "dark": "gray-0", "muted": "gray-37", "light": "gray-50", "disabled": "gray-70", "invert": "gray-100"},
    "background": {"default": "gray-100", "dark": "gray-85", "light": "gray-88"},
    "border": {"default": "gray-70", "dark": "gray-37", "light": "gray-85", "focus": "blue-default", "focus-invert": "blue-light"},
    "interaction": {"default": "blue-default", "select": "blue-x-dark", "select-light": "blue-x-light", "hover-dark": "blue-dark", "hover": "blue-light", "disabled": "gray-70"},
    "alert": {"success": "green", "info": "purple-tertiary", "attention": "yellow", "critical": "red", "new": "teal"},
    "shadow": {"default": "gray-0-alpha-light", "dark": "gray-0-alpha"},
}

out_prim = ["/* Auto-generated from Forge color primitives — run generate-color-tokens.py */", ":root {"]
for name in sorted(props.keys()):
    out_prim.append(f"  --fe-primitive-{name}: {props[name]};")
out_prim.append("}\n")

out_sem = ["/* Forge semantic color tokens */", ":root {"]
for cat, mapping in semantic_maps.items():
    for key, prim in mapping.items():
        out_sem.append(f"  --fe-color-{cat}-{key}: var(--fe-primitive-{prim});")

for yml_name, prefix in [("_color-secondary.yml", "secondary"), ("_color-dataviz.yml", "dataviz")]:
    yml = (TOKEN_DIR / f"semantic/{yml_name}").read_text()
    for m in re.finditer(r"^  ([\w-]+):\s+value: ([\w-]+)", yml, re.M):
        key, prim = m.group(1), m.group(2)
        if prim in props:
            out_sem.append(f"  --fe-color-{prefix}-{key}: var(--fe-primitive-{prim});")

out_sem.append("}\n")

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "primitives.css").write_text("\n".join(out_prim))
(OUT / "semantic-colors.css").write_text("\n".join(out_sem))
print(f"Wrote {len(props)} primitives to {OUT}")
