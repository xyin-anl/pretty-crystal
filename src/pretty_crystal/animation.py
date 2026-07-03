"""Frame alignment and encoding helpers for animated figure rendering."""

from __future__ import annotations

import shutil
import subprocess
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pymatgen.core import Structure

PILLOW_INSTALL_HINT = (
    "GIF encoding requires Pillow. Install it with:\n  pip install 'pretty-crystal[render]'"
)
FFMPEG_INSTALL_HINT = (
    "MP4 encoding requires the ffmpeg executable on PATH. "
    "Install it with your package manager (e.g. `brew install ffmpeg`)."
)

ANIMATION_FORMATS = ["gif", "mp4"]


class AnimationEncodeError(RuntimeError):
    """Raised when animation frames cannot be encoded to the requested format."""


class StructureAlignmentError(RuntimeError):
    """Raised when a structure cannot be mapped onto the reference structure."""


def align_structures_to_first(structures: list[Structure]) -> list[Structure]:
    """Maps every structure onto the first one's lattice setting and site order.

    Uses pymatgen's StructureMatcher.get_s2_like_s1 so animations of related
    structures (polymorphs, relaxation endpoints from different sources) do not
    jump between equivalent settings. Genuine trajectories with consistent site
    ordering should skip this step.
    """
    from pymatgen.core.structure_matcher import StructureMatcher

    if len(structures) < 2:
        return list(structures)

    matcher = StructureMatcher(primitive_cell=False, allow_subset=False)
    reference = structures[0]
    aligned: list[Structure] = [reference]
    for index, structure in enumerate(structures[1:], start=2):
        mapped = matcher.get_s2_like_s1(reference, structure)
        if mapped is None:
            raise StructureAlignmentError(
                f"Structure {index} could not be aligned to the first structure. "
                "The structures may not be equivalent; try rendering without --align."
            )
        aligned.append(mapped)

    return aligned


def encode_animation(
    frames: list[bytes],
    *,
    fps: int,
    output_path: Path,
    animation_format: str,
) -> None:
    if not frames:
        raise AnimationEncodeError("No frames were rendered.")
    if animation_format == "gif":
        _encode_gif(frames, fps=fps, output_path=output_path)
        return
    if animation_format == "mp4":
        _encode_mp4(frames, fps=fps, output_path=output_path)
        return

    raise AnimationEncodeError(
        f"Unsupported animation format '{animation_format}'. "
        f"Supported formats: {', '.join(ANIMATION_FORMATS)}."
    )


def _encode_gif(frames: list[bytes], *, fps: int, output_path: Path) -> None:
    try:
        from PIL import Image
    except ImportError as exc:
        raise AnimationEncodeError(PILLOW_INSTALL_HINT) from exc

    images = [_flatten_to_rgb(Image.open(BytesIO(frame))) for frame in frames]
    first, *rest = images
    first.save(
        output_path,
        append_images=rest,
        disposal=2,
        duration=max(1, round(1000 / fps)),
        loop=0,
        save_all=True,
    )


def _flatten_to_rgb(image):  # noqa: ANN001, ANN202 - PIL types are optional
    if image.mode == "RGB":
        return image

    from PIL import Image

    rgba = image.convert("RGBA")
    background = Image.new("RGB", rgba.size, (255, 255, 255))
    background.paste(rgba, mask=rgba.getchannel("A"))
    return background


def _encode_mp4(frames: list[bytes], *, fps: int, output_path: Path) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise AnimationEncodeError(FFMPEG_INSTALL_HINT)

    with TemporaryDirectory(prefix="pretty-crystal-animation-") as temp_dir:
        frame_dir = Path(temp_dir)
        for index, frame in enumerate(frames):
            (frame_dir / f"frame{index:05d}.png").write_bytes(frame)

        command = [
            ffmpeg,
            "-y",
            "-loglevel",
            "error",
            "-framerate",
            str(fps),
            "-i",
            str(frame_dir / "frame%05d.png"),
            # yuv420p requires even dimensions and is the compatible pixel format.
            "-vf",
            "crop=trunc(iw/2)*2:trunc(ih/2)*2",
            "-pix_fmt",
            "yuv420p",
            str(output_path),
        ]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            raise AnimationEncodeError(
                f"ffmpeg failed to encode the animation: {result.stderr.strip()}"
            )
