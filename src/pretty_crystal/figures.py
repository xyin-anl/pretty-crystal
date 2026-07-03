"""Python API for rendering figures without the GUI, e.g. from notebooks.

Example::

    from pretty_crystal import render_figure

    figure = render_figure("LiFePO4.cif", material_preset="tachyon", width=1200)
    figure                      # displays inline in Jupyter
    figure.save("LiFePO4.png")

The first call starts a shared local server plus headless browser session that
is reused for subsequent renders and closed automatically at exit (or manually
via :func:`close_renderer`).
"""

from __future__ import annotations

import atexit
import json
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from pymatgen.core import Structure

    from pretty_crystal.headless import HeadlessFigureRenderer

_shared_renderer: HeadlessFigureRenderer | None = None


class RenderedFigure:
    """Rendered figure bytes with Jupyter inline display support."""

    def __init__(self, data: bytes, file_name: str, image_format: str) -> None:
        self.data = data
        self.file_name = file_name
        self.format = image_format

    def save(self, path: str | Path) -> Path:
        target = Path(path)
        target.write_bytes(self.data)
        return target

    def _repr_png_(self) -> bytes | None:
        return self.data if self.format == "png" else None

    def _repr_jpeg_(self) -> bytes | None:
        return self.data if self.format == "jpg" else None

    def __repr__(self) -> str:
        return f"RenderedFigure({self.file_name!r}, {len(self.data)} bytes)"


class RenderedPxrdChart:
    """PXRD chart SVG with Jupyter inline display support."""

    def __init__(self, svg: str, file_name: str) -> None:
        self.svg = svg
        self.file_name = file_name

    def save(self, path: str | Path) -> Path:
        target = Path(path)
        target.write_text(self.svg, encoding="utf-8")
        return target

    def _repr_svg_(self) -> str:
        return self.svg

    def __repr__(self) -> str:
        return f"RenderedPxrdChart({self.file_name!r}, {len(self.svg)} bytes)"


def render_figure(
    structure: Structure | str | Path,
    *,
    style: dict[str, Any] | str | Path | None = None,
    material_preset: str | None = None,
    width: int | None = None,
    height: int | None = None,
    image_format: str | None = None,
    background: str | None = None,
    supercell: str | tuple[int, int, int] | None = None,
    bond_algorithm: str | None = None,
    file_name: str | None = None,
) -> RenderedFigure:
    """Renders a structure to a figure using the full web rendering pipeline.

    ``structure`` is a pymatgen Structure or a path to a structure file.
    ``style`` matches the ``prc render --style`` JSON schema; the keyword
    overrides mirror the CLI flags and take precedence over the style file.
    """
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
    scene = build_scene_response(
        resolved_structure,
        bond_algorithm=bond_algorithm,
        supercell=normalize_supercell(supercell),
    )

    files = _renderer().render(dict(scene), file_name=resolved_name, settings=settings)
    if not files:
        raise RuntimeError("The renderer returned no figure files.")
    first = files[0]
    return RenderedFigure(first.data, first.file_name, first.format)


def render_pxrd(
    structure: Structure | str | Path,
    *,
    wavelength: str | float | None = None,
    two_theta_min: float = 5.0,
    two_theta_max: float = 90.0,
    fwhm: float = 0.25,
    title: str | None = None,
    file_name: str | None = None,
) -> RenderedPxrdChart:
    """Simulates a PXRD pattern and renders it as an SVG chart."""
    from pretty_crystal.structures.pxrd import compute_pxrd_pattern

    resolved_structure, resolved_name = _resolve_structure(structure, file_name)
    pattern = compute_pxrd_pattern(
        resolved_structure,
        wavelength=wavelength,
        two_theta_min=two_theta_min,
        two_theta_max=two_theta_max,
    )
    options: dict[str, Any] = {"fwhm": fwhm}
    if title or resolved_name:
        options["title"] = title or resolved_name

    svg = _renderer().render_pxrd_chart(dict(pattern), options=options)
    stem = Path(resolved_name).stem if resolved_name else "structure"
    return RenderedPxrdChart(svg, f"{stem}-pxrd.svg")


def close_renderer() -> None:
    """Stops the shared headless renderer session, if one is running."""
    global _shared_renderer
    if _shared_renderer is not None:
        renderer = _shared_renderer
        _shared_renderer = None
        renderer.__exit__(None, None, None)


def _renderer() -> HeadlessFigureRenderer:
    global _shared_renderer
    if _shared_renderer is None:
        from pretty_crystal.headless import HeadlessFigureRenderer

        renderer = HeadlessFigureRenderer()
        renderer.__enter__()
        _shared_renderer = renderer
        atexit.register(close_renderer)
    return _shared_renderer


def _resolve_structure(
    structure: Structure | str | Path,
    file_name: str | None,
) -> tuple[Structure, str | None]:
    if isinstance(structure, str | Path):
        from pretty_crystal.structures.readers import read_structure

        path = Path(structure)
        return read_structure(path), file_name or path.name

    from pymatgen.core import Structure as PmgStructure

    if not isinstance(structure, PmgStructure):
        raise TypeError(
            "structure must be a pymatgen Structure or a path to a structure file."
        )

    name = file_name
    if name is None:
        formula = structure.composition.reduced_formula
        name = f"{formula}.cif"
    return structure, name


def _merge_settings(
    style: dict[str, Any] | str | Path | None,
    *,
    material_preset: str | None,
    width: int | None,
    height: int | None,
    image_format: str | None,
    background: str | None,
) -> dict[str, Any]:
    if style is None:
        settings: dict[str, Any] = {}
    elif isinstance(style, str | Path):
        parsed = json.loads(Path(style).read_text(encoding="utf-8"))
        if not isinstance(parsed, dict):
            raise ValueError(f"{style} must contain a JSON object.")
        settings = {key: value for key, value in parsed.items() if key != "$schema"}
    elif isinstance(style, dict):
        settings = {key: value for key, value in style.items() if key != "$schema"}
    else:
        raise TypeError("style must be a settings dict or a path to a style JSON file.")

    style_overrides: dict[str, Any] = {}
    if material_preset is not None:
        style_overrides["materialPreset"] = material_preset
    export_overrides: dict[str, Any] = {}
    if width is not None:
        export_overrides["width"] = width
    if height is not None:
        export_overrides["height"] = height
    if image_format is not None:
        export_overrides["format"] = image_format
    if background is not None:
        export_overrides["background"] = background

    if style_overrides:
        settings["style"] = {**settings.get("style", {}), **style_overrides}
    if export_overrides:
        settings["export"] = {**settings.get("export", {}), **export_overrides}

    return settings
