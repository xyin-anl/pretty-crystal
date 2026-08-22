"""Golden-image regression tests for the headless rendering pipeline.

These render fixture structures through the real browser pipeline and compare
against committed golden PNGs with a perceptual tolerance, catching material,
lighting, geometry, and layout regressions that unit tests cannot see.

They need Playwright Chromium and take tens of seconds, so they only run when
explicitly requested:

    uv run pytest -m visual

Regenerate goldens after an intentional rendering change:

    PRC_UPDATE_GOLDENS=1 uv run pytest -m visual
"""

from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path

import pytest

FIXTURES = Path(__file__).parent / "fixtures" / "structures"
GOLDENS = Path(__file__).parent / "goldens"

# Mean absolute per-channel difference (0-255 scale) allowed across the image.
MEAN_DIFF_TOLERANCE = 2.0
# Fraction of pixels allowed to differ by more than HOT_PIXEL_DELTA.
HOT_PIXEL_FRACTION_TOLERANCE = 0.01
HOT_PIXEL_DELTA = 24

CASES = [
    pytest.param("MoS2.cif", {}, id="mos2-default"),
    pytest.param(
        "Al2O3.cif",
        {"material_preset": "tachyon"},
        id="al2o3-tachyon",
    ),
]


def _compare_images(rendered_path: Path, golden_path: Path) -> None:
    import numpy as np
    from PIL import Image

    rendered = np.asarray(Image.open(rendered_path).convert("RGB"), dtype=np.int16)
    golden = np.asarray(Image.open(golden_path).convert("RGB"), dtype=np.int16)

    assert rendered.shape == golden.shape, (
        f"image size changed: rendered {rendered.shape} vs golden {golden.shape}"
    )

    diff = np.abs(rendered - golden)
    mean_diff = float(diff.mean())
    hot_fraction = float((diff.max(axis=2) > HOT_PIXEL_DELTA).mean())

    assert mean_diff <= MEAN_DIFF_TOLERANCE, (
        f"mean per-channel difference {mean_diff:.2f} exceeds {MEAN_DIFF_TOLERANCE}"
    )
    assert hot_fraction <= HOT_PIXEL_FRACTION_TOLERANCE, (
        f"{hot_fraction:.2%} of pixels differ by more than {HOT_PIXEL_DELTA}"
    )


@pytest.mark.visual
@pytest.mark.parametrize(("fixture_name", "render_options"), CASES)
def test_rendered_figure_matches_golden(
    fixture_name: str, render_options: dict, tmp_path: Path, request: pytest.FixtureRequest
) -> None:
    from pretty_crystal.figures import render_figure

    golden_path = GOLDENS / f"{request.node.callspec.id}.png"
    figure = render_figure(
        FIXTURES / fixture_name,
        width=480,
        image_format="png",
        **render_options,
    )
    rendered_path = tmp_path / "rendered.png"
    rendered_path.write_bytes(figure.data)

    if os.environ.get("PRC_UPDATE_GOLDENS") == "1":
        GOLDENS.mkdir(parents=True, exist_ok=True)
        golden_path.write_bytes(figure.data)
        pytest.skip(f"golden updated: {golden_path.name}")

    assert golden_path.exists(), (
        f"missing golden {golden_path}; run PRC_UPDATE_GOLDENS=1 uv run pytest -m visual"
    )
    _compare_images(rendered_path, golden_path)


@pytest.mark.visual
def test_training_supervision_passes_align_with_camera() -> None:
    import numpy as np
    from PIL import Image

    from pretty_crystal import render_training_sample

    sample = render_training_sample(
        FIXTURES / "SrTiO3.cif",
        structure_id="structure-" + "a" * 64,
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
                "width": 128,
                "height": 128,
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

    assert sample.atom_instances is not None
    assert sample.bond_instances is not None
    assert sample.unit_cell_instances is not None
    assert sample.depth is not None
    mask = np.asarray(
        Image.open(BytesIO(sample.atom_instances.data)).convert("RGB"), dtype=np.uint32
    )
    instance_ids = mask[:, :, 0] + (mask[:, :, 1] << 8) + (mask[:, :, 2] << 16)
    declared_ids = {atom["instance"]["instanceId"] for atom in sample.annotations["atoms"]}
    actual_ids = set(np.unique(instance_ids)) - {0}

    assert actual_ids
    assert actual_ids <= declared_ids

    bond_mask = np.asarray(
        Image.open(BytesIO(sample.bond_instances.data)).convert("RGB"), dtype=np.uint32
    )
    bond_instance_ids = (
        bond_mask[:, :, 0] + (bond_mask[:, :, 1] << 8) + (bond_mask[:, :, 2] << 16)
    )
    display_bonds = sample.annotations["displayBonds"]
    declared_bond_ids = {bond["instance"]["instanceId"] for bond in display_bonds}
    actual_bond_ids = set(np.unique(bond_instance_ids)) - {0}

    assert display_bonds
    assert actual_bond_ids
    assert actual_bond_ids <= declared_bond_ids
    assert all(bond["instance"]["bondIndex"] == index for index, bond in enumerate(display_bonds))
    atom_ids = {atom["renderAtomId"] for atom in sample.annotations["atoms"]}
    assert all(bond["startRenderAtomId"] in atom_ids for bond in display_bonds)
    assert all(bond["endRenderAtomId"] in atom_ids for bond in display_bonds)
    unit_cell_mask = np.asarray(
        Image.open(BytesIO(sample.unit_cell_instances.data)).convert("RGB"), dtype=np.uint32
    )
    unit_cell_ids = (
        unit_cell_mask[:, :, 0]
        + (unit_cell_mask[:, :, 1] << 8)
        + (unit_cell_mask[:, :, 2] << 16)
    )
    declared_unit_cell_ids = {
        edge["instance"]["instanceId"] for edge in sample.annotations["unitCell"]["edges"]
    }
    actual_unit_cell_ids = set(np.unique(unit_cell_ids)) - {0}
    assert sample.annotations["unitCell"]["rendered"] is True
    assert len(sample.annotations["unitCell"]["vertices"]) == 8
    assert len(sample.annotations["unitCell"]["edges"]) == 12
    assert actual_unit_cell_ids
    assert actual_unit_cell_ids <= declared_unit_cell_ids
    assert sample.depth.shape == (128, 128)
    assert sample.depth.dtype == np.float32
    assert np.isfinite(sample.depth).all()
    assert np.any(sample.depth < 1)
    assert np.any(sample.depth == 1)

    depth_metadata = sample.annotations["training"]["depth"]
    near = depth_metadata["near"]
    far = depth_metadata["far"]
    zoom = sample.annotations["frame"]["zoom"]
    radius_errors = []
    for atom in sample.annotations["atoms"]:
        x = int(round(atom["xy"][0]))
        y = int(round(atom["xy"][1]))
        instance = atom["instance"]
        if not (0 <= x < 128 and 0 <= y < 128):
            continue
        if instance_ids[y, x] != instance["instanceId"]:
            continue
        surface_depth = near + float(sample.depth[y, x]) * (far - near)
        radius_pixels = np.sqrt(instance["projectedFullAreaPixelsEstimate"] / np.pi)
        expected_radius = radius_pixels / zoom
        assert surface_depth < atom["cameraDepth"]
        radius_errors.append(abs((atom["cameraDepth"] - surface_depth) - expected_radius))

    assert radius_errors
    assert max(radius_errors) < 0.03
