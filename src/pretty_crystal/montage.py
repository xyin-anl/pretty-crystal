"""Grid composition of rendered structure figures for comparison images."""

from __future__ import annotations

import math
from io import BytesIO

from pretty_crystal.animation import PILLOW_INSTALL_HINT, AnimationEncodeError

MONTAGE_BACKGROUND = (255, 255, 255)
MONTAGE_PADDING = 28
LABEL_HEIGHT = 42
LABEL_COLOR = (55, 65, 81)


class MontageComposeError(RuntimeError):
    """Raised when rendered tiles cannot be composed into a montage."""


def compose_montage(
    images: list[bytes],
    *,
    columns: int | None = None,
    labels: list[str] | None = None,
) -> bytes:
    """Arranges equally sized rendered tiles into a labeled grid PNG."""
    if not images:
        raise MontageComposeError("No rendered figures to compose.")
    if labels is not None and len(labels) != len(images):
        raise MontageComposeError("The number of labels must match the number of figures.")

    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError as exc:
        raise AnimationEncodeError(PILLOW_INSTALL_HINT) from exc

    tiles = [Image.open(BytesIO(data)).convert("RGBA") for data in images]
    tile_width = max(tile.width for tile in tiles)
    tile_height = max(tile.height for tile in tiles)
    count = len(tiles)
    column_count = columns if columns and columns > 0 else math.ceil(math.sqrt(count))
    column_count = min(column_count, count)
    row_count = math.ceil(count / column_count)
    label_height = LABEL_HEIGHT if labels else 0

    cell_width = tile_width + MONTAGE_PADDING
    cell_height = tile_height + MONTAGE_PADDING + label_height
    canvas = Image.new(
        "RGB",
        (
            column_count * cell_width + MONTAGE_PADDING,
            row_count * cell_height + MONTAGE_PADDING,
        ),
        MONTAGE_BACKGROUND,
    )
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.load_default(size=24)
    except TypeError:
        font = ImageFont.load_default()

    for index, tile in enumerate(tiles):
        column = index % column_count
        row = index // column_count
        x = MONTAGE_PADDING + column * cell_width + (tile_width - tile.width) // 2
        y = MONTAGE_PADDING + row * cell_height + (tile_height - tile.height) // 2
        canvas.paste(tile, (x, y), tile)

        if labels:
            label = labels[index]
            label_x = MONTAGE_PADDING + column * cell_width + tile_width / 2
            label_y = MONTAGE_PADDING + row * cell_height + tile_height + label_height / 2
            draw.text(
                (label_x, label_y),
                label,
                anchor="mm",
                fill=LABEL_COLOR,
                font=font,
            )

    output = BytesIO()
    canvas.save(output, format="PNG")
    return output.getvalue()
