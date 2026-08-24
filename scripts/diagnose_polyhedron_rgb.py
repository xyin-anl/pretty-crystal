"""Compare RGB output with and without polyhedra and supervision passes."""

from __future__ import annotations

import argparse
import json
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image

from pretty_crystal import close_renderer, render_training_sample

ROOT = Path(__file__).resolve().parents[1]


def _settings(*, show_polyhedra: bool, polyhedron_opacity: int) -> dict[str, object]:
    return {
        "style": {"atomRadius": 40, "fogEnabled": False},
        "componentVisibility": {
            "atoms": True,
            "bonds": True,
            "unitCell": True,
            "polyhedra": show_polyhedra,
            "boundaryAtoms": True,
            "oneHopBondedAtoms": False,
        },
        "componentOpacity": {"polyhedra": polyhedron_opacity},
        "export": {
            "width": 256,
            "height": 256,
            "format": "png",
            "background": "white",
            "supersampling": 1,
            "meshQuality": "low",
        },
    }


def _foreground_pixels(image_bytes: bytes) -> int:
    pixels = np.asarray(Image.open(BytesIO(image_bytes)).convert("RGB"), dtype=np.uint8)
    return int(np.count_nonzero(np.any(pixels != 255, axis=2)))


def main(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    variants = (
        ("no_polyhedra", False, 100, ("rgb", "metadata")),
        ("polyhedra_75", True, 75, ("rgb", "metadata")),
        ("polyhedra_100", True, 100, ("rgb", "metadata")),
        (
            "polyhedra_100_training",
            True,
            100,
            (
                "rgb",
                "polyhedron_edge_instances",
                "polyhedron_surface_instances",
                "metadata",
            ),
        ),
    )
    summary: dict[str, dict[str, int]] = {}
    try:
        for name, show_polyhedra, opacity, outputs in variants:
            sample = render_training_sample(
                ROOT / "tests" / "fixtures" / "structures" / "SrTiO3.cif",
                structure_id="diagnostic:SrTiO3",
                canonical_structure_hash="a" * 64,
                seed=42,
                style=_settings(
                    show_polyhedra=show_polyhedra,
                    polyhedron_opacity=opacity,
                ),
                bond_algorithm="crystal-nn",
                outputs=outputs,
            )
            sample.rgb.save(output_dir / f"{name}.png")
            summary[name] = {
                "foregroundPixels": _foreground_pixels(sample.rgb.data),
                "polyhedronEdges": len(sample.annotations["polyhedronEdges"]),
                "polyhedronSurfaces": len(sample.annotations["polyhedronSurfaces"]),
            }
            if sample.polyhedron_edge_instances is not None:
                sample.polyhedron_edge_instances.save(output_dir / f"{name}.edges.png")
            if sample.polyhedron_surface_instances is not None:
                sample.polyhedron_surface_instances.save(output_dir / f"{name}.surfaces.png")
    finally:
        close_renderer()

    (output_dir / "diagnostic.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(summary, sort_keys=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts"))
    main(parser.parse_args().output_dir)
