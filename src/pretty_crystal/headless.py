"""Headless figure rendering by driving the bundled web renderer in Chromium."""

from __future__ import annotations

import base64
import threading
import time
from dataclasses import dataclass
from types import TracebackType
from typing import Any

import uvicorn

from pretty_crystal.server.app import create_app

PLAYWRIGHT_INSTALL_HINT = (
    "Headless rendering requires Playwright. Install it with:\n"
    "  pip install 'pretty-crystal[render]'\n"
    "  playwright install chromium"
)
FRONTEND_MISSING_HINT = (
    "The bundled web renderer was not found. Build the frontend first:\n"
    "  cd web && bun run build"
)
SERVER_STARTUP_TIMEOUT_SECONDS = 30.0
BRIDGE_READY_TIMEOUT_MS = 30_000


class HeadlessRenderError(RuntimeError):
    """Raised when the headless rendering pipeline cannot run or fails."""


@dataclass(frozen=True)
class RenderedFigureFile:
    data: bytes
    file_name: str
    format: str


class HeadlessFigureRenderer:
    """Context manager owning the local server and headless browser session.

    The server and browser start once and are reused across renders, so
    batches only pay the startup cost a single time.
    """

    def __init__(self, host: str = "127.0.0.1") -> None:
        self._host = host
        self._server: uvicorn.Server | None = None
        self._server_thread: threading.Thread | None = None
        self._playwright: Any = None
        self._browser: Any = None
        self._page: Any = None

    def __enter__(self) -> HeadlessFigureRenderer:
        try:
            self._start()
        except Exception:
            self._shutdown()
            raise
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self._shutdown()

    def render(
        self,
        scene: dict[str, Any],
        *,
        file_name: str | None = None,
        settings: dict[str, Any] | None = None,
    ) -> list[RenderedFigureFile]:
        if self._page is None:
            raise HeadlessRenderError("The headless renderer is not running.")

        payload: dict[str, Any] = {"scene": scene}
        if file_name is not None:
            payload["fileName"] = file_name
        if settings:
            payload["settings"] = settings

        try:
            result = self._page.evaluate(
                "(payload) => window.__prettyCrystalHeadless.renderStructureImage(payload)",
                payload,
            )
        except Exception as exc:
            raise HeadlessRenderError(_browser_error_message(exc)) from exc

        files = result.get("files") if isinstance(result, dict) else None
        if not isinstance(files, list):
            raise HeadlessRenderError("The headless renderer returned an unexpected result.")

        return [
            RenderedFigureFile(
                data=base64.b64decode(entry["dataBase64"]),
                file_name=str(entry["fileName"]),
                format=str(entry["format"]),
            )
            for entry in files
        ]

    def render_animation(
        self,
        scenes: list[dict[str, Any]],
        *,
        file_name: str | None = None,
        settings: dict[str, Any] | None = None,
        turntable_frames: int | None = None,
    ) -> tuple[list[bytes], int, int]:
        """Renders animation frames with a shared camera frame.

        Returns the PNG/JPG frame bytes plus the frame width and height.
        """
        if self._page is None:
            raise HeadlessRenderError("The headless renderer is not running.")

        payload: dict[str, Any] = {"scenes": scenes}
        if file_name is not None:
            payload["fileName"] = file_name
        if settings:
            payload["settings"] = settings
        if turntable_frames is not None:
            payload["animation"] = {"turntableFrames": turntable_frames}

        try:
            result = self._page.evaluate(
                "(payload) => window.__prettyCrystalHeadless.renderStructureAnimation(payload)",
                payload,
            )
        except Exception as exc:
            raise HeadlessRenderError(_browser_error_message(exc)) from exc

        frames = result.get("frames") if isinstance(result, dict) else None
        if not isinstance(frames, list):
            raise HeadlessRenderError("The headless renderer returned an unexpected result.")

        return (
            [base64.b64decode(frame) for frame in frames],
            int(result["width"]),
            int(result["height"]),
        )

    def render_pxrd_chart(
        self,
        pattern: dict[str, Any],
        *,
        options: dict[str, Any] | None = None,
    ) -> str:
        """Renders a PXRD pattern to a standalone SVG document string."""
        if self._page is None:
            raise HeadlessRenderError("The headless renderer is not running.")

        payload: dict[str, Any] = {"pattern": pattern}
        if options:
            payload["options"] = options

        try:
            svg = self._page.evaluate(
                "(payload) => window.__prettyCrystalHeadless.renderPxrdChart(payload)",
                payload,
            )
        except Exception as exc:
            raise HeadlessRenderError(_browser_error_message(exc)) from exc

        if not isinstance(svg, str):
            raise HeadlessRenderError("The headless renderer returned an unexpected result.")
        return svg

    def _start(self) -> None:
        base_url = self._start_server()
        self._start_browser(base_url)

    def _start_server(self) -> str:
        server = uvicorn.Server(
            uvicorn.Config(
                create_app(),
                host=self._host,
                port=0,
                log_level="warning",
            )
        )
        thread = threading.Thread(target=server.run, daemon=True)
        thread.start()
        self._server = server
        self._server_thread = thread

        deadline = time.monotonic() + SERVER_STARTUP_TIMEOUT_SECONDS
        while time.monotonic() < deadline:
            if server.started:
                break
            if not thread.is_alive():
                raise HeadlessRenderError("The local rendering server exited during startup.")
            time.sleep(0.02)
        else:
            raise HeadlessRenderError("The local rendering server did not start in time.")

        port = _bound_server_port(server)
        return f"http://{self._host}:{port}"

    def _start_browser(self, base_url: str) -> None:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError as exc:
            raise HeadlessRenderError(PLAYWRIGHT_INSTALL_HINT) from exc

        self._playwright = sync_playwright().start()
        try:
            self._browser = self._playwright.chromium.launch()
        except Exception as exc:
            raise HeadlessRenderError(
                f"Could not launch headless Chromium.\n{PLAYWRIGHT_INSTALL_HINT}"
            ) from exc

        self._page = self._browser.new_page()
        self._page.goto(f"{base_url}/?headless=1")
        try:
            self._page.wait_for_function(
                "window.__prettyCrystalHeadless !== undefined",
                timeout=BRIDGE_READY_TIMEOUT_MS,
            )
        except Exception as exc:
            raise HeadlessRenderError(FRONTEND_MISSING_HINT) from exc

    def _shutdown(self) -> None:
        if self._browser is not None:
            try:
                self._browser.close()
            finally:
                self._browser = None
                self._page = None
        if self._playwright is not None:
            try:
                self._playwright.stop()
            finally:
                self._playwright = None
        if self._server is not None:
            self._server.should_exit = True
            if self._server_thread is not None:
                self._server_thread.join(timeout=5)
            self._server = None
            self._server_thread = None


def _bound_server_port(server: uvicorn.Server) -> int:
    for started_server in server.servers:
        for sock in started_server.sockets:
            return int(sock.getsockname()[1])
    raise HeadlessRenderError("Could not determine the local rendering server port.")


def _browser_error_message(exc: Exception) -> str:
    message = str(exc)
    marker = "Error: "
    if marker in message:
        message = message.split(marker, 1)[1]
    return message.splitlines()[0] if message else "Headless rendering failed."
