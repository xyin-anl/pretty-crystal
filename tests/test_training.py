from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import pytest

from pretty_crystal.headless import (
    HeadlessFigureRenderer,
    RenderedFigureFile,
    RenderedTrainingSample,
)
from pretty_crystal.training import (
    RENDERER_PROTOCOL_VERSION,
    render_training_sample,
)

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "structures"


class FakeTrainingRenderer:
    def __init__(self, protocol_version: int = RENDERER_PROTOCOL_VERSION) -> None:
        self.protocol_version = protocol_version
        self.calls: list[dict[str, object]] = []

    def render_training_sample(
        self,
        scene: dict[str, object],
        *,
        file_name: str | None,
        settings: dict[str, object],
    ) -> RenderedTrainingSample:
        self.calls.append({"scene": scene, "file_name": file_name, "settings": settings})
        return RenderedTrainingSample(
            rgb=RenderedFigureFile(b"rgb", "SrTiO3.png", "png"),
            annotations={
                "camera": {"quaternion": [0.0, 0.0, 0.0, 1.0]},
                "atoms": [],
            },
            renderer_protocol_version=self.protocol_version,
        )


def test_render_training_sample_exposes_public_metadata(monkeypatch) -> None:
    renderer = FakeTrainingRenderer()
    monkeypatch.setattr("pretty_crystal.training._renderer", lambda: renderer)

    sample = render_training_sample(
        FIXTURE_DIR / "SrTiO3.cif",
        structure_id="structure-" + "a" * 64,
        canonical_structure_hash="a" * 64,
        seed=42,
        width=512,
        height=512,
        background="white",
    )

    assert sample.rgb.data == b"rgb"
    assert sample.renderer_protocol_version == RENDERER_PROTOCOL_VERSION
    assert sample.metadata()["seed"] == 42
    assert sample.scene["atoms"]
    assert renderer.calls[0]["file_name"] == "SrTiO3.cif"
    assert renderer.calls[0]["settings"] == {
        "export": {
            "background": "white",
            "format": "png",
            "height": 512,
            "width": 512,
        }
    }


def test_render_training_sample_fails_loudly_for_unimplemented_pass() -> None:
    with pytest.raises(NotImplementedError, match="atom_instances"):
        render_training_sample(
            FIXTURE_DIR / "SrTiO3.cif",
            structure_id="structure-" + "a" * 64,
            canonical_structure_hash="a" * 64,
            seed=42,
            outputs=("rgb", "atom_instances"),
        )


def test_render_training_sample_rejects_protocol_mismatch(monkeypatch) -> None:
    renderer = FakeTrainingRenderer(protocol_version=RENDERER_PROTOCOL_VERSION + 1)
    monkeypatch.setattr("pretty_crystal.training._renderer", lambda: renderer)

    with pytest.raises(RuntimeError, match="Renderer protocol mismatch"):
        render_training_sample(
            FIXTURE_DIR / "SrTiO3.cif",
            structure_id="structure-" + "a" * 64,
            canonical_structure_hash="a" * 64,
            seed=42,
        )


def test_headless_training_bridge_decodes_protocol_result() -> None:
    renderer = HeadlessFigureRenderer()
    renderer._page = SimpleNamespace(  # type: ignore[assignment]
        evaluate=lambda _script, _payload: {
            "rendererProtocolVersion": 1,
            "rgb": {
                "dataBase64": "cmdi",
                "fileName": "sample.png",
                "format": "png",
            },
            "annotations": {"atoms": [], "camera": {}},
        }
    )

    result = renderer.render_training_sample({"atoms": []})

    assert result.renderer_protocol_version == 1
    assert result.rgb.data == b"rgb"
    assert result.rgb.file_name == "sample.png"
