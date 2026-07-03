from __future__ import annotations

import json
from pathlib import Path

import pytest

from pretty_crystal.figures import (
    RenderedFigure,
    RenderedPxrdChart,
    _merge_settings,
    _resolve_structure,
)

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "structures"


def test_merge_settings_overrides_style_file(tmp_path) -> None:
    style_path = tmp_path / "style.json"
    style_path.write_text(
        json.dumps({"style": {"materialPreset": "glossy"}, "export": {"width": 800}}),
        encoding="utf-8",
    )

    settings = _merge_settings(
        style_path,
        material_preset="tachyon",
        width=1200,
        height=None,
        image_format="jpg",
        background=None,
    )

    assert settings["style"] == {"materialPreset": "tachyon"}
    assert settings["export"] == {"width": 1200, "format": "jpg"}


def test_merge_settings_rejects_non_object_style(tmp_path) -> None:
    style_path = tmp_path / "style.json"
    style_path.write_text("[1]", encoding="utf-8")

    with pytest.raises(ValueError):
        _merge_settings(
            style_path,
            material_preset=None,
            width=None,
            height=None,
            image_format=None,
            background=None,
        )


def test_resolve_structure_from_path_and_structure() -> None:
    structure, name = _resolve_structure(FIXTURE_DIR / "NaCl.cif", None)
    assert name == "NaCl.cif"
    assert len(structure) == 8

    same_structure, derived_name = _resolve_structure(structure, None)
    assert same_structure is structure
    assert derived_name == "NaCl.cif"

    with pytest.raises(TypeError):
        _resolve_structure(42, None)  # type: ignore[arg-type]


def test_rendered_outputs_expose_notebook_reprs(tmp_path) -> None:
    figure = RenderedFigure(b"png-bytes", "a.png", "png")
    assert figure._repr_png_() == b"png-bytes"
    assert figure._repr_jpeg_() is None
    assert figure.save(tmp_path / "a.png").read_bytes() == b"png-bytes"

    chart = RenderedPxrdChart("<svg/>", "a-pxrd.svg")
    assert chart._repr_svg_() == "<svg/>"
    assert chart.save(tmp_path / "a.svg").read_text() == "<svg/>"
