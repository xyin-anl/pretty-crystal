"""Public dataset-rendering API for supervised structure-figure samples."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any

import numpy as np

from pretty_crystal.figures import RenderedFigure, _merge_settings, _renderer, _resolve_structure

if TYPE_CHECKING:
    from pymatgen.core import Structure

RENDERER_PROTOCOL_VERSION = 4
_SUPPORTED_OUTPUTS = frozenset(
    {
        "rgb",
        "atom_instances",
        "bond_instances",
        "depth",
        "metadata",
        "unit_cell_instances",
    }
)


@dataclass(frozen=True)
class TrainingSample:
    """One rendered RGB sample and its renderer-owned annotation contract."""

    rgb: RenderedFigure
    atom_instances: RenderedFigure | None
    bond_instances: RenderedFigure | None
    unit_cell_instances: RenderedFigure | None
    depth: np.ndarray | None
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


@dataclass(frozen=True)
class TrainingRenderSpec:
    """Renderer-owned settings for one view in a shared-structure batch."""

    seed: int
    style: dict[str, Any] | str | Path | None = None
    material_preset: str | None = None
    width: int | None = None
    height: int | None = None
    image_format: str | None = "png"
    background: str | None = None
    outputs: tuple[str, ...] = ("rgb", "metadata")


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
    """Render deterministic RGB and requested renderer-owned supervision passes."""
    return render_training_samples(
        structure,
        structure_id=structure_id,
        canonical_structure_hash=canonical_structure_hash,
        specs=(
            TrainingRenderSpec(
                seed=seed,
                style=style,
                material_preset=material_preset,
                width=width,
                height=height,
                image_format=image_format,
                background=background,
                outputs=outputs,
            ),
        ),
        supercell=supercell,
        bond_algorithm=bond_algorithm,
        file_name=file_name,
    )[0]


def render_training_samples(
    structure: Structure | str | Path,
    *,
    structure_id: str,
    canonical_structure_hash: str,
    specs: tuple[TrainingRenderSpec, ...] | list[TrainingRenderSpec],
    supercell: str | tuple[int, int, int] | None = None,
    bond_algorithm: str | None = None,
    file_name: str | None = None,
) -> list[TrainingSample]:
    """Build one structure scene and render multiple deterministic views from it."""
    if not structure_id or not canonical_structure_hash:
        raise ValueError("structure_id and canonical_structure_hash are required.")
    if not specs:
        raise ValueError("specs must contain at least one training render request.")
    for spec in specs:
        _validate_spec(spec)

    from pretty_crystal.structures.scene_builder import build_scene_response
    from pretty_crystal.structures.schema import normalize_supercell

    resolved_structure, resolved_name = _resolve_structure(structure, file_name)
    scene = dict(
        build_scene_response(
            resolved_structure,
            bond_algorithm=bond_algorithm,
            supercell=normalize_supercell(supercell),
        )
    )
    renderer = _renderer()
    samples = []
    for spec in specs:
        settings = _merge_settings(
            spec.style,
            material_preset=spec.material_preset,
            width=spec.width,
            height=spec.height,
            image_format=spec.image_format,
            background=spec.background,
        )
        rendered = renderer.render_training_sample(
            scene,
            file_name=resolved_name,
            settings=settings,
            outputs=tuple(
                output
                for output in spec.outputs
                if output in {
                    "atom_instances",
                    "bond_instances",
                    "depth",
                    "unit_cell_instances",
                }
            ),
        )
        samples.append(
            _training_sample(
                rendered,
                scene=scene,
                settings=settings,
                structure_id=structure_id,
                canonical_structure_hash=canonical_structure_hash,
                seed=spec.seed,
                outputs=spec.outputs,
            )
        )
    return samples


def _validate_spec(spec: TrainingRenderSpec) -> None:
    unsupported = set(spec.outputs) - _SUPPORTED_OUTPUTS
    if unsupported:
        names = ", ".join(sorted(unsupported))
        raise NotImplementedError(f"Requested training outputs are not implemented: {names}.")
    if not spec.outputs:
        raise ValueError("outputs must request at least one supported output.")
    if isinstance(spec.seed, bool) or not isinstance(spec.seed, int) or spec.seed < 0:
        raise ValueError("seed must be a non-negative integer.")


def _training_sample(
    rendered: Any,
    *,
    scene: dict[str, Any],
    settings: dict[str, Any],
    structure_id: str,
    canonical_structure_hash: str,
    seed: int,
    outputs: tuple[str, ...],
) -> TrainingSample:
    if rendered.renderer_protocol_version != RENDERER_PROTOCOL_VERSION:
        raise RuntimeError(
            "Renderer protocol mismatch: "
            f"expected {RENDERER_PROTOCOL_VERSION}, got {rendered.renderer_protocol_version}."
        )
    if "atom_instances" in outputs and rendered.atom_instances is None:
        raise RuntimeError("Renderer omitted the requested atom-instance pass.")
    if "bond_instances" in outputs and rendered.bond_instances is None:
        raise RuntimeError("Renderer omitted the requested bond-instance pass.")
    if "unit_cell_instances" in outputs and rendered.unit_cell_instances is None:
        raise RuntimeError("Renderer omitted the requested unit-cell-instance pass.")
    if "depth" in outputs and rendered.depth is None:
        raise RuntimeError("Renderer omitted the requested depth pass.")

    depth = None
    if rendered.depth is not None:
        if rendered.depth_shape is None:
            raise RuntimeError("Renderer returned depth bytes without a depth shape.")
        depth = np.frombuffer(rendered.depth, dtype="<f4").reshape(rendered.depth_shape).copy()
        if not np.isfinite(depth).all() or np.any((depth < 0) | (depth > 1)):
            raise RuntimeError("Renderer returned depth values outside the finite [0, 1] range.")

    return TrainingSample(
        rgb=RenderedFigure(rendered.rgb.data, rendered.rgb.file_name, rendered.rgb.format),
        atom_instances=(
            RenderedFigure(
                rendered.atom_instances.data,
                rendered.atom_instances.file_name,
                rendered.atom_instances.format,
            )
            if rendered.atom_instances is not None
            else None
        ),
        bond_instances=(
            RenderedFigure(
                rendered.bond_instances.data,
                rendered.bond_instances.file_name,
                rendered.bond_instances.format,
            )
            if rendered.bond_instances is not None
            else None
        ),
        unit_cell_instances=(
            RenderedFigure(
                rendered.unit_cell_instances.data,
                rendered.unit_cell_instances.file_name,
                rendered.unit_cell_instances.format,
            )
            if rendered.unit_cell_instances is not None
            else None
        ),
        depth=depth,
        structure_id=structure_id,
        canonical_structure_hash=canonical_structure_hash,
        seed=seed,
        renderer_protocol_version=rendered.renderer_protocol_version,
        scene=scene,
        settings=settings,
        annotations=rendered.annotations,
    )
