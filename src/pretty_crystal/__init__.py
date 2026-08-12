"""Pretty Crystal package."""

from pretty_crystal.figures import (
    RenderedFigure,
    RenderedPxrdChart,
    close_renderer,
    render_figure,
    render_pxrd,
)
from pretty_crystal.training import (
    RENDERER_PROTOCOL_VERSION,
    TrainingSample,
    render_training_sample,
)

__version__ = "0.1.0"

__all__ = [
    "RenderedFigure",
    "RenderedPxrdChart",
    "RENDERER_PROTOCOL_VERSION",
    "TrainingSample",
    "close_renderer",
    "render_figure",
    "render_pxrd",
    "render_training_sample",
]
