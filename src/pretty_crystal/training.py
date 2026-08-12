"""Public dataset-rendering API for supervised structure-figure samples."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any

from pretty_crystal.figures import RenderedFigure, _merge_settings, _renderer, _resolve_structure

if TYPE_CHECKING:
    from pymatgen.core import Structure

RENDERER_PROTOCOL_VERSION = 1
_SUPPORTED_OUTPUTS = frozenset({"rgb", "metadata"})


@dataclass(frozen=True)
class TrainingSample:
    """One rendered RGB sample and its renderer-owned annotation contract."""

    rgb: RenderedFigure
    structure_id: str
    canonical_structure_hash: str
    seed: int
    renderer_protocol_version: int
    scene: dict[str, Any]
    settings: dict[str, Any]
    annotations: dict[str, Any]

    def metadata(self) -> dict[str, Any]:
        return {
            "renderer_protocol_version": self.renderer_protocol_version,
            "structure_id": self.structure_id,
            "canonical_structure_hash": self.canonical_structure_hash,
            "seed": self.seed,
            "scene": self.scene,
            "settings": self.settings,
            "annotations": self.annotations,
        }


def render_training_sample(
    structure: Structure | str | Path,
    *,
    structure_id: str,
    canonical_structure_hash: str,
    seed: int,
    style: dict[str, Any] | str | Path | None = None,
    material_preset: str | None = None,
    width: int | None = None,
    height: int | None = None,
    image_format: str | None = "png",
    background: str | None = None,
    supercell: str | tuple[int, int, int] | None = None,
    bond_algorithm: str | None = None,
    file_name: str | None = None,
    outputs: tuple[str, ...] = ("rgb", "metadata"),
) -> TrainingSample:
    """Render deterministic RGB and exact camera/projected-atom annotations.

    Atom-instance and depth outputs are intentionally rejected until their
    renderer passes are implemented; the API never substitutes approximate
    data for a requested supervision target.
    """
    unsupported = set(outputs) - _SUPPORTED_OUTPUTS
    if unsupported:
        names = ", ".join(sorted(unsupported))
        raise NotImplementedError(f"Requested training outputs are not implemented: {names}.")
    if not outputs:
        raise ValueError("outputs must request at least one supported output.")
    if not structure_id or not canonical_structure_hash:
        raise ValueError("structure_id and canonical_structure_hash are required.")
    if isinstance(seed, bool) or not isinstance(seed, int) or seed < 0:
        raise ValueError("seed must be a non-negative integer.")

    from pretty_crystal.structures.scene_builder import build_scene_response
    from pretty_crystal.structures.schema import normalize_supercell

    resolved_structure, resolved_name = _resolve_structure(structure, file_name)
    settings = _merge_settings(
        style,
        material_preset=material_preset,
        width=width,
        height=height,
        image_format=image_format,
        background=background,
    )
    scene = dict(
        build_scene_response(
            resolved_structure,
            bond_algorithm=bond_algorithm,
            supercell=normalize_supercell(supercell),
        )
    )
    rendered = _renderer().render_training_sample(
        scene,
        file_name=resolved_name,
        settings=settings,
    )
    if rendered.renderer_protocol_version != RENDERER_PROTOCOL_VERSION:
        raise RuntimeError(
            "Renderer protocol mismatch: "
            f"expected {RENDERER_PROTOCOL_VERSION}, got {rendered.renderer_protocol_version}."
        )

    return TrainingSample(
        rgb=RenderedFigure(rendered.rgb.data, rendered.rgb.file_name, rendered.rgb.format),
        structure_id=structure_id,
        canonical_structure_hash=canonical_structure_hash,
        seed=seed,
        renderer_protocol_version=rendered.renderer_protocol_version,
        scene=scene,
        settings=settings,
        annotations=rendered.annotations,
    )
