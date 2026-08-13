from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest

from pretty_crystal.headless import (
    HeadlessFigureRenderer,
    RenderedFigureFile,
    RenderedTrainingSample,
)
from pretty_crystal.training import (
    RENDERER_PROTOCOL_VERSION,
    TrainingRenderSpec,
    render_training_sample,
    render_training_samples,
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
        outputs: tuple[str, ...],
    ) -> RenderedTrainingSample:
        self.calls.append(
            {
                "scene": scene,
                "file_name": file_name,
                "outputs": outputs,
                "settings": settings,
            }
        )
        depth = np.array([[0.25, 1.0]], dtype="<f4") if "depth" in outputs else None
        return RenderedTrainingSample(
            rgb=RenderedFigureFile(b"rgb", "SrTiO3.png", "png"),
            atom_instances=(
                RenderedFigureFile(b"mask", "SrTiO3.atoms.png", "png")
                if "atom_instances" in outputs
                else None
            ),
            depth=depth.tobytes() if depth is not None else None,
            depth_shape=depth.shape if depth is not None else None,
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
        style={"framing": {"scale": 0.95}},
    )

    assert sample.rgb.data == b"rgb"
    assert sample.renderer_protocol_version == RENDERER_PROTOCOL_VERSION
    assert sample.metadata()["seed"] == 42
    assert sample.scene["atoms"]
    assert renderer.calls[0]["file_name"] == "SrTiO3.cif"
    assert renderer.calls[0]["outputs"] == ()
    assert renderer.calls[0]["settings"] == {
        "export": {
            "background": "white",
            "format": "png",
            "height": 512,
            "width": 512,
        },
        "framing": {"scale": 0.95},
    }


def test_render_training_sample_returns_requested_supervision(monkeypatch) -> None:
    renderer = FakeTrainingRenderer()
    monkeypatch.setattr("pretty_crystal.training._renderer", lambda: renderer)

    sample = render_training_sample(
        FIXTURE_DIR / "SrTiO3.cif",
        structure_id="structure-" + "a" * 64,
        canonical_structure_hash="a" * 64,
        seed=42,
        outputs=("rgb", "atom_instances", "depth", "metadata"),
    )

    assert sample.atom_instances is not None
    assert sample.atom_instances.data == b"mask"
    assert sample.depth is not None
    np.testing.assert_allclose(sample.depth, [[0.25, 1.0]])
    assert renderer.calls[0]["outputs"] == ("atom_instances", "depth")


def test_render_training_samples_reuses_one_structure_scene(monkeypatch) -> None:
    renderer = FakeTrainingRenderer()
    monkeypatch.setattr("pretty_crystal.training._renderer", lambda: renderer)
    build_calls = 0

    from pretty_crystal.structures import scene_builder

    original_build = scene_builder.build_scene_response

    def counted_build(*args, **kwargs):
        nonlocal build_calls
        build_calls += 1
        return original_build(*args, **kwargs)

    monkeypatch.setattr(scene_builder, "build_scene_response", counted_build)
    samples = render_training_samples(
        FIXTURE_DIR / "SrTiO3.cif",
        structure_id="structure-" + "a" * 64,
        canonical_structure_hash="a" * 64,
        specs=[
            TrainingRenderSpec(seed=1, style={"framing": {"scale": 0.95}}),
            TrainingRenderSpec(seed=2, style={"framing": {"scale": 1.05}}),
        ],
    )

    assert build_calls == 1
    assert len(samples) == 2
    assert [sample.seed for sample in samples] == [1, 2]
    assert renderer.calls[0]["scene"] is renderer.calls[1]["scene"]
    assert renderer.calls[0]["settings"]["framing"]["scale"] == 0.95
    assert renderer.calls[1]["settings"]["framing"]["scale"] == 1.05


def test_render_training_sample_fails_loudly_for_unknown_pass() -> None:
    with pytest.raises(NotImplementedError, match="surface_normals"):
        render_training_sample(
            FIXTURE_DIR / "SrTiO3.cif",
            structure_id="structure-" + "a" * 64,
            canonical_structure_hash="a" * 64,
            seed=42,
            outputs=("rgb", "surface_normals"),
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
            "rendererProtocolVersion": 2,
            "rgb": {
                "dataBase64": "cmdi",
                "fileName": "sample.png",
                "format": "png",
            },
            "annotations": {"atoms": [], "camera": {}},
        }
    )

    result = renderer.render_training_sample({"atoms": []})

    assert result.renderer_protocol_version == 2
    assert result.atom_instances is None
    assert result.depth is None
    assert result.rgb.data == b"rgb"
    assert result.rgb.file_name == "sample.png"
