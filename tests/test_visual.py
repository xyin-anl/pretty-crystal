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
