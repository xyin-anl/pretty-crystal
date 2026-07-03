from __future__ import annotations

import json
import socket
import threading
import time
import webbrowser
from pathlib import Path
from typing import Annotated, Any

import typer
import uvicorn

from pretty_crystal.server.app import create_app

HELP_OPTION_NAMES = ["-h", "--help"]
RENDER_FORMATS = ["png", "jpg", "pdf"]
RENDER_BACKGROUNDS = ["transparent", "white", "black"]
RENDER_MESH_QUALITIES = ["low", "medium", "high", "xhigh"]
RENDER_SUPERSAMPLING_OPTIONS = [1, 2, 4]

app = typer.Typer(
    help="Pretty Crystal command line tools.",
    context_settings={"help_option_names": HELP_OPTION_NAMES},
)


@app.callback()
def main() -> None:
    """Pretty Crystal command line tools."""


def _choose_port(host: str, requested_port: int) -> int:
    if requested_port != 0:
        return requested_port

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind((host, 0))
        return int(sock.getsockname()[1])


def _wait_for_server(host: str, port: int, timeout_seconds: float = 30.0) -> bool:
    deadline = time.monotonic() + timeout_seconds

    while time.monotonic() < deadline:
        try:
            with socket.create_connection((host, port), timeout=0.2):
                return True
        except OSError:
            time.sleep(0.05)

    return False


def _open_browser_when_ready(url: str, host: str, port: int) -> None:
    if _wait_for_server(host, port):
        webbrowser.open(url)


def _start_browser_opener(url: str, host: str, port: int) -> None:
    threading.Thread(
        target=_open_browser_when_ready,
        args=(url, host, port),
        daemon=True,
    ).start()


@app.command(context_settings={"help_option_names": HELP_OPTION_NAMES})
def gui(
    host: str = typer.Option("127.0.0.1", help="Host address for the local GUI server."),
    port: int = typer.Option(
        8765,
        "--port",
        "-p",
        help="Port for the local GUI server. Use 0 for any free port.",
    ),
    no_open: bool = typer.Option(False, "--no-open", help="Do not open the browser automatically."),
    reload: bool = typer.Option(False, help="Reload the server when Python files change."),
) -> None:
    """Start the local Pretty Crystal GUI server."""
    selected_port = _choose_port(host, port)
    url = f"http://{host}:{selected_port}"

    typer.echo(f"Starting Pretty Crystal GUI at {url}")
    if not no_open:
        _start_browser_opener(url, host, selected_port)

    if reload:
        uvicorn.run(
            "pretty_crystal.server.app:create_app",
            host=host,
            port=selected_port,
            factory=True,
            reload=True,
        )
        return

    uvicorn.run(create_app(), host=host, port=selected_port)


@app.command(context_settings={"help_option_names": HELP_OPTION_NAMES})
def render(
    inputs: Annotated[
        list[Path],
        typer.Argument(
            help="Structure files to render (CIF, POSCAR, and other pymatgen-supported formats).",
        ),
    ],
    output_dir: Annotated[
        Path,
        typer.Option(
            "--output-dir",
            "-o",
            help="Directory for the rendered figures.",
        ),
    ] = Path("."),
    style: Annotated[
        Path | None,
        typer.Option(
            "--style",
            "-s",
            help="Render settings JSON file (style, orientation, and export options).",
        ),
    ] = None,
    material_preset: str | None = typer.Option(
        None,
        "--material-preset",
        "-m",
        help="Material preset ID, e.g. modern-matte or tachyon.",
    ),
    width: int | None = typer.Option(None, help="Output width in pixels."),
    height: int | None = typer.Option(None, help="Output height in pixels."),
    image_format: str | None = typer.Option(
        None,
        "--format",
        "-f",
        help=f"Output format: {', '.join(RENDER_FORMATS)}.",
    ),
    background: str | None = typer.Option(
        None,
        "--background",
        "-b",
        help=f"Background: {', '.join(RENDER_BACKGROUNDS)}.",
    ),
    supersampling: int | None = typer.Option(
        None,
        help="Supersampling factor: 1, 2, or 4.",
    ),
    mesh_quality: str | None = typer.Option(
        None,
        "--mesh-quality",
        help=f"Mesh quality: {', '.join(RENDER_MESH_QUALITIES)}.",
    ),
    bond_algorithm: str | None = typer.Option(
        None,
        "--bond-algorithm",
        help="Bond detection algorithm, e.g. crystal-nn.",
    ),
    supercell: str | None = typer.Option(
        None,
        "--supercell",
        help="Supercell to display, e.g. 2x2x1.",
    ),
    turntable: int | None = typer.Option(
        None,
        "--turntable",
        help="Render a rotating turntable animation with this many frames.",
    ),
    animate: bool = typer.Option(
        False,
        "--animate",
        help="Treat the input files as frames of one animation.",
    ),
    align: bool = typer.Option(
        False,
        "--align",
        help="With --animate: map every structure onto the first one "
        "(StructureMatcher.get_s2_like_s1) before rendering.",
    ),
    fps: int = typer.Option(30, "--fps", help="Animation frames per second."),
    animation_format: str = typer.Option(
        "gif",
        "--animation-format",
        help="Animation container: gif or mp4.",
    ),
    montage: bool = typer.Option(
        False,
        "--montage",
        help="Compose the rendered structures into one comparison grid image.",
    ),
    montage_columns: int | None = typer.Option(
        None,
        "--montage-columns",
        help="Number of columns in the montage grid.",
    ),
    montage_labels: bool = typer.Option(
        True,
        "--montage-labels/--no-montage-labels",
        help="Label each montage tile with its file name.",
    ),
    pxrd: bool = typer.Option(
        False,
        "--pxrd",
        help="Also export a simulated PXRD pattern as an SVG chart.",
    ),
    pxrd_wavelength: str | None = typer.Option(
        None,
        "--pxrd-wavelength",
        help="X-ray wavelength preset (e.g. CuKa, MoKa) or a number in angstroms.",
    ),
    pxrd_fwhm: float = typer.Option(
        0.25,
        "--pxrd-fwhm",
        help="Peak broadening FWHM in degrees for the PXRD chart.",
    ),
) -> None:
    """Render structure files to figures without opening the GUI."""
    from pretty_crystal.headless import HeadlessFigureRenderer, HeadlessRenderError
    from pretty_crystal.structures.readers import StructureReadError, read_structure_bytes
    from pretty_crystal.structures.scene_builder import build_scene_response
    from pretty_crystal.structures.schema import (
        UnsupportedBondAlgorithmError,
        UnsupportedSupercellError,
        normalize_bond_algorithm,
        normalize_supercell,
    )

    try:
        normalized_bond_algorithm = normalize_bond_algorithm(bond_algorithm)
    except UnsupportedBondAlgorithmError as exc:
        raise typer.BadParameter(str(exc), param_hint="--bond-algorithm") from exc
    try:
        normalized_supercell = normalize_supercell(supercell)
    except UnsupportedSupercellError as exc:
        raise typer.BadParameter(str(exc), param_hint="--supercell") from exc

    from pretty_crystal.animation import (
        ANIMATION_FORMATS,
        AnimationEncodeError,
        StructureAlignmentError,
        encode_animation,
    )

    if turntable is not None and animate:
        raise typer.BadParameter(
            "--turntable and --animate cannot be combined.", param_hint="--animate"
        )
    if align and not animate:
        raise typer.BadParameter("--align requires --animate.", param_hint="--align")
    if animate and len(inputs) < 2:
        raise typer.BadParameter(
            "--animate needs at least two input structures.", param_hint="--animate"
        )
    _expect_choice(animation_format, ANIMATION_FORMATS, "--animation-format")
    if fps < 1 or fps > 120:
        raise typer.BadParameter("must be between 1 and 120.", param_hint="--fps")
    if pxrd and (turntable is not None or animate):
        raise typer.BadParameter(
            "--pxrd cannot be combined with animation flags.", param_hint="--pxrd"
        )
    if montage and (turntable is not None or animate):
        raise typer.BadParameter(
            "--montage cannot be combined with animation flags.", param_hint="--montage"
        )
    if montage and len(inputs) < 2:
        raise typer.BadParameter(
            "--montage needs at least two input structures.", param_hint="--montage"
        )
    if montage and image_format == "pdf":
        raise typer.BadParameter(
            "--montage requires a raster format (png or jpg).", param_hint="--format"
        )

    is_animation = turntable is not None or animate
    settings = _render_settings(
        style_path=style,
        material_preset=material_preset,
        width=width,
        height=height,
        image_format=image_format,
        background=background,
        supersampling=supersampling,
        mesh_quality=mesh_quality,
    )
    if is_animation:
        # Animation containers have no useful alpha channel, so frames default
        # to a white background instead of the transparent still-image default.
        export_section = dict(settings.get("export", {}))
        export_section.setdefault("background", "white")
        settings["export"] = export_section

    output_dir.mkdir(parents=True, exist_ok=True)

    def build_scene(input_path: Path) -> dict[str, Any]:
        return dict(
            build_scene_response(
                read_structure_bytes(
                    input_path.read_bytes(),
                    filename=input_path.name,
                ),
                bond_algorithm=normalized_bond_algorithm,
                supercell=normalized_supercell,
            )
        )

    failures = 0
    try:
        with HeadlessFigureRenderer() as renderer:
            if animate:
                _render_series_animation(
                    align=align,
                    animation_format=animation_format,
                    bond_algorithm=normalized_bond_algorithm,
                    fps=fps,
                    inputs=inputs,
                    output_dir=output_dir,
                    renderer=renderer,
                    settings=settings,
                    supercell=normalized_supercell,
                )
            elif turntable is not None:
                for input_path in inputs:
                    try:
                        frames, _, _ = renderer.render_animation(
                            [build_scene(input_path)],
                            file_name=input_path.name,
                            settings=settings,
                            turntable_frames=turntable,
                        )
                        output_path = (
                            output_dir / f"{input_path.stem}-turntable.{animation_format}"
                        )
                        encode_animation(
                            frames,
                            animation_format=animation_format,
                            fps=fps,
                            output_path=output_path,
                        )
                        typer.echo(f"✓ {input_path.name} → {output_path}")
                    except (
                        OSError,
                        StructureReadError,
                        UnsupportedSupercellError,
                        HeadlessRenderError,
                        AnimationEncodeError,
                    ) as exc:
                        failures += 1
                        typer.secho(f"✗ {input_path}: {exc}", err=True, fg=typer.colors.RED)
            else:
                montage_tiles: list[bytes] = []
                montage_tile_labels: list[str] = []
                for input_path in inputs:
                    try:
                        rendered_files = renderer.render(
                            build_scene(input_path),
                            file_name=input_path.name,
                            settings=settings,
                        )
                        pxrd_svg: str | None = None
                        if pxrd:
                            from pretty_crystal.structures.pxrd import compute_pxrd_pattern

                            pattern = compute_pxrd_pattern(
                                read_structure_bytes(
                                    input_path.read_bytes(),
                                    filename=input_path.name,
                                ),
                                wavelength=pxrd_wavelength,
                            )
                            pxrd_svg = renderer.render_pxrd_chart(
                                dict(pattern),
                                options={"fwhm": pxrd_fwhm, "title": input_path.name},
                            )
                    except (
                        OSError,
                        StructureReadError,
                        UnsupportedSupercellError,
                        HeadlessRenderError,
                        _pxrd_compute_error(),
                    ) as exc:
                        failures += 1
                        typer.secho(f"✗ {input_path}: {exc}", err=True, fg=typer.colors.RED)
                        continue

                    if montage:
                        if rendered_files:
                            montage_tiles.append(rendered_files[0].data)
                            montage_tile_labels.append(input_path.stem)
                    else:
                        for rendered_file in rendered_files:
                            output_path = output_dir / rendered_file.file_name
                            output_path.write_bytes(rendered_file.data)
                            typer.echo(f"✓ {input_path.name} → {output_path}")

                    if pxrd_svg is not None:
                        pxrd_path = output_dir / f"{input_path.stem}-pxrd.svg"
                        pxrd_path.write_text(pxrd_svg, encoding="utf-8")
                        typer.echo(f"✓ {input_path.name} → {pxrd_path}")

                if montage and montage_tiles:
                    from pretty_crystal.montage import compose_montage

                    montage_path = output_dir / f"{inputs[0].stem}-montage.png"
                    montage_path.write_bytes(
                        compose_montage(
                            montage_tiles,
                            columns=montage_columns,
                            labels=montage_tile_labels if montage_labels else None,
                        )
                    )
                    typer.echo(f"✓ {len(montage_tiles)} structures → {montage_path}")
    except (
        HeadlessRenderError,
        AnimationEncodeError,
        StructureAlignmentError,
        StructureReadError,
        UnsupportedSupercellError,
        _montage_compose_error(),
        OSError,
    ) as exc:
        typer.secho(str(exc), err=True, fg=typer.colors.RED)
        raise typer.Exit(code=1) from exc

    if failures:
        typer.secho(
            f"{failures} of {len(inputs)} structures failed to render.",
            err=True,
            fg=typer.colors.RED,
        )
        raise typer.Exit(code=1)


def _montage_compose_error() -> type[Exception]:
    from pretty_crystal.montage import MontageComposeError

    return MontageComposeError


def _pxrd_compute_error() -> type[Exception]:
    from pretty_crystal.structures.pxrd import PxrdComputeError

    return PxrdComputeError


def _render_series_animation(
    *,
    align: bool,
    animation_format: str,
    bond_algorithm: str | None,
    fps: int,
    inputs: list[Path],
    output_dir: Path,
    renderer: Any,
    settings: dict[str, Any],
    supercell: tuple[int, int, int] | None,
) -> None:
    from pretty_crystal.animation import align_structures_to_first, encode_animation
    from pretty_crystal.structures.readers import read_structure_bytes
    from pretty_crystal.structures.scene_builder import build_scene_response

    structures = [
        read_structure_bytes(input_path.read_bytes(), filename=input_path.name)
        for input_path in inputs
    ]
    if align:
        typer.echo(f"Aligning {len(structures)} structures to {inputs[0].name} ...")
        structures = align_structures_to_first(structures)

    typer.echo(f"Rendering {len(structures)} frames ...")
    scenes = [
        dict(
            build_scene_response(
                structure,
                bond_algorithm=bond_algorithm,
                supercell=supercell,
            )
        )
        for structure in structures
    ]
    frames, _, _ = renderer.render_animation(
        scenes,
        file_name=inputs[0].name,
        settings=settings,
    )
    output_path = output_dir / f"{inputs[0].stem}-series.{animation_format}"
    encode_animation(
        frames,
        animation_format=animation_format,
        fps=fps,
        output_path=output_path,
    )
    typer.echo(f"✓ {len(inputs)} structures → {output_path}")


def _render_settings(
    *,
    style_path: Path | None,
    material_preset: str | None,
    width: int | None,
    height: int | None,
    image_format: str | None,
    background: str | None,
    supersampling: int | None,
    mesh_quality: str | None,
) -> dict[str, Any]:
    settings = _load_style_settings(style_path)

    style_overrides: dict[str, Any] = {}
    if material_preset is not None:
        style_overrides["materialPreset"] = material_preset

    export_overrides: dict[str, Any] = {}
    if width is not None:
        export_overrides["width"] = width
    if height is not None:
        export_overrides["height"] = height
    if image_format is not None:
        _expect_choice(image_format, RENDER_FORMATS, "--format")
        export_overrides["format"] = image_format
    if background is not None:
        _expect_choice(background, RENDER_BACKGROUNDS, "--background")
        export_overrides["background"] = background
    if supersampling is not None:
        _expect_choice(supersampling, RENDER_SUPERSAMPLING_OPTIONS, "--supersampling")
        export_overrides["supersampling"] = supersampling
    if mesh_quality is not None:
        _expect_choice(mesh_quality, RENDER_MESH_QUALITIES, "--mesh-quality")
        export_overrides["meshQuality"] = mesh_quality

    if style_overrides:
        settings["style"] = {**settings.get("style", {}), **style_overrides}
    if export_overrides:
        settings["export"] = {**settings.get("export", {}), **export_overrides}

    return settings


def _load_style_settings(style_path: Path | None) -> dict[str, Any]:
    if style_path is None:
        return {}

    try:
        parsed = json.loads(style_path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise typer.BadParameter(str(exc), param_hint="--style") from exc
    except json.JSONDecodeError as exc:
        raise typer.BadParameter(
            f"{style_path} is not valid JSON: {exc}",
            param_hint="--style",
        ) from exc

    if not isinstance(parsed, dict):
        raise typer.BadParameter(
            f"{style_path} must contain a JSON object.",
            param_hint="--style",
        )

    sections = {key: value for key, value in parsed.items() if key != "$schema"}
    return sections


def _expect_choice(value: Any, choices: list[Any], param_hint: str) -> None:
    if value not in choices:
        raise typer.BadParameter(
            f"must be one of {', '.join(str(choice) for choice in choices)}.",
            param_hint=param_hint,
        )
