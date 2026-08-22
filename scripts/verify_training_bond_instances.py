"""Render and verify one complete training-protocol sample through Chromium."""

from __future__ import annotations

import argparse
import colorsys
import json
from collections import Counter
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image

from pretty_crystal import RENDERER_PROTOCOL_VERSION, close_renderer, render_training_sample

ROOT = Path(__file__).resolve().parents[1]
WIDTH = 256
HEIGHT = 256


def _instance_ids(image_bytes: bytes) -> np.ndarray:
    pixels = np.asarray(Image.open(BytesIO(image_bytes)).convert("RGB"), dtype=np.uint32)
    return pixels[:, :, 0] + (pixels[:, :, 1] << 8) + (pixels[:, :, 2] << 16)


def _observed_instances(instance_ids: np.ndarray) -> dict[int, dict[str, object]]:
    observed: dict[int, dict[str, object]] = {}
    for instance_id in np.unique(instance_ids):
        if instance_id == 0:
            continue
        y, x = np.nonzero(instance_ids == instance_id)
        observed[int(instance_id)] = {
            "boundingBox": [int(x.min()), int(y.min()), int(x.max()), int(y.max())],
            "visiblePixelCount": int(x.size),
        }
    return observed


def _validate_instances(
    instance_ids: np.ndarray,
    annotations: list[dict[str, object]],
) -> tuple[int, int]:
    observed = _observed_instances(instance_ids)
    declared = {int(annotation["instanceId"]): annotation for annotation in annotations}
    if not observed:
        raise AssertionError("The requested instance pass contains no visible instances.")
    if not observed.keys() <= declared.keys():
        raise AssertionError("The instance mask contains IDs absent from the annotations.")

    for instance_id, annotation in declared.items():
        expected = observed.get(instance_id)
        if expected is None:
            if annotation["visiblePixelCount"] != 0 or annotation["boundingBox"] is not None:
                raise AssertionError(f"Invisible instance {instance_id} has nonempty metadata.")
            continue
        if annotation["visiblePixelCount"] != expected["visiblePixelCount"]:
            raise AssertionError(f"Pixel count mismatch for instance {instance_id}.")
        if annotation["boundingBox"] != expected["boundingBox"]:
            raise AssertionError(f"Bounding box mismatch for instance {instance_id}.")

    return len(declared), len(observed)


def _mask_preview(instance_ids: np.ndarray) -> Image.Image:
    preview = np.zeros((*instance_ids.shape, 3), dtype=np.uint8)
    for instance_id in np.unique(instance_ids):
        if instance_id == 0:
            continue
        red, green, blue = colorsys.hsv_to_rgb(
            ((int(instance_id) * 0.61803398875) % 1.0), 0.75, 1.0
        )
        preview[instance_ids == instance_id] = np.asarray(
            [round(255 * red), round(255 * green), round(255 * blue)], dtype=np.uint8
        )
    return Image.fromarray(preview, mode="RGB")


def main(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    try:
        sample = render_training_sample(
            ROOT / "tests" / "fixtures" / "structures" / "SrTiO3.cif",
            structure_id="smoke:SrTiO3",
            canonical_structure_hash="a" * 64,
            seed=42,
            style={
                "style": {"atomRadius": 40, "fogEnabled": False},
                "componentVisibility": {
                    "atoms": True,
                    "bonds": True,
                    "unitCell": True,
                    "polyhedra": False,
                    "boundaryAtoms": True,
                    "oneHopBondedAtoms": False,
                },
                "export": {
                    "width": WIDTH,
                    "height": HEIGHT,
                    "format": "png",
                    "background": "white",
                    "supersampling": 1,
                    "meshQuality": "low",
                },
            },
            bond_algorithm="crystal-nn",
            outputs=(
                "rgb",
                "atom_instances",
                "bond_instances",
                "depth",
                "unit_cell_instances",
                "metadata",
            ),
        )
    finally:
        close_renderer()

    if sample.renderer_protocol_version != RENDERER_PROTOCOL_VERSION:
        raise AssertionError(f"Unexpected protocol version {sample.renderer_protocol_version}.")
    if (
        sample.atom_instances is None
        or sample.bond_instances is None
        or sample.depth is None
        or sample.unit_cell_instances is None
    ):
        raise AssertionError("The renderer omitted a requested training output.")
    if sample.depth.shape != (HEIGHT, WIDTH):
        raise AssertionError(f"Unexpected depth shape {sample.depth.shape}.")
    if not np.isfinite(sample.depth).all() or np.any((sample.depth < 0) | (sample.depth > 1)):
        raise AssertionError("Depth contains nonfinite values or values outside [0, 1].")
    if not np.any(sample.depth < 1) or not np.any(sample.depth == 1):
        raise AssertionError("Depth does not contain both foreground and background pixels.")

    atoms = sample.annotations["atoms"]
    bonds = sample.annotations["displayBonds"]
    atom_ids = {atom["renderAtomId"] for atom in atoms}
    if not bonds:
        raise AssertionError("CrystalNN produced no displayed bonds for the smoke structure.")
    for bond in bonds:
        if bond["startRenderAtomId"] not in atom_ids or bond["endRenderAtomId"] not in atom_ids:
            raise AssertionError("A displayed bond endpoint is absent from the atom annotations.")

    atom_instance_ids = _instance_ids(sample.atom_instances.data)
    bond_instance_ids = _instance_ids(sample.bond_instances.data)
    unit_cell_instance_ids = _instance_ids(sample.unit_cell_instances.data)
    declared_atoms, visible_atoms = _validate_instances(
        atom_instance_ids, [atom["instance"] for atom in atoms]
    )
    declared_bonds, visible_bonds = _validate_instances(
        bond_instance_ids, [bond["instance"] for bond in bonds]
    )
    unit_cell = sample.annotations["unitCell"]
    if not unit_cell["rendered"] or len(unit_cell["vertices"]) != 8:
        raise AssertionError("The unit-cell projection annotations are incomplete.")
    declared_unit_cell_edges, visible_unit_cell_edges = _validate_instances(
        unit_cell_instance_ids, [edge["instance"] for edge in unit_cell["edges"]]
    )

    sample.rgb.save(output_dir / "rgb.png")
    sample.atom_instances.save(output_dir / "atom_instances.png")
    sample.bond_instances.save(output_dir / "bond_instances.png")
    sample.unit_cell_instances.save(output_dir / "unit_cell_instances.png")
    np.save(output_dir / "depth.npy", sample.depth)
    _mask_preview(atom_instance_ids).save(output_dir / "atom_instances_preview.png")
    bond_preview = _mask_preview(bond_instance_ids)
    bond_preview.save(output_dir / "bond_instances_preview.png")
    unit_cell_preview = _mask_preview(unit_cell_instance_ids)
    unit_cell_preview.save(output_dir / "unit_cell_instances_preview.png")
    rgb = Image.open(BytesIO(sample.rgb.data)).convert("RGB")
    Image.blend(rgb, bond_preview, alpha=0.55).save(output_dir / "rgb_bond_overlay.png")
    Image.blend(rgb, unit_cell_preview, alpha=0.55).save(
        output_dir / "rgb_unit_cell_overlay.png"
    )

    metadata = sample.metadata()
    (output_dir / "metadata.json").write_text(
        json.dumps(metadata, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    bond_pixel_counts = Counter(int(value) for value in bond_instance_ids.ravel() if value)
    summary = {
        "declared_atom_instances": declared_atoms,
        "declared_bond_instances": declared_bonds,
        "declared_unit_cell_edges": declared_unit_cell_edges,
        "depth_background_pixels": int(np.count_nonzero(sample.depth == 1)),
        "depth_foreground_pixels": int(np.count_nonzero(sample.depth < 1)),
        "height": HEIGHT,
        "protocol_version": sample.renderer_protocol_version,
        "total_visible_bond_pixels": int(sum(bond_pixel_counts.values())),
        "visible_atom_instances": visible_atoms,
        "visible_bond_instances": visible_bonds,
        "visible_unit_cell_edges": visible_unit_cell_edges,
        "width": WIDTH,
    }
    (output_dir / "summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    (output_dir / "smoke-valid.txt").write_text(
        "pretty-crystal training protocol smoke passed\n", encoding="utf-8"
    )
    print(json.dumps(summary, sort_keys=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts"))
    main(parser.parse_args().output_dir)
