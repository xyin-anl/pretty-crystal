from __future__ import annotations

import socket

import typer.main
from typer.testing import CliRunner

import pretty_crystal.cli as cli
from pretty_crystal.cli import _choose_port, _wait_for_server

runner = CliRunner()


def test_choose_requested_port() -> None:
    assert _choose_port("127.0.0.1", 8765) == 8765


def test_choose_free_port() -> None:
    port = _choose_port("127.0.0.1", 0)

    assert port > 0


def test_gui_help_shows_port_short_option() -> None:
    command = typer.main.get_command(cli.app).commands["gui"]
    port_option = next(param for param in command.params if param.name == "port")

    assert "--port" in port_option.opts
    assert "-p" in port_option.opts


def test_help_accepts_short_option() -> None:
    root_result = runner.invoke(cli.app, ["-h"])
    gui_result = runner.invoke(cli.app, ["gui", "-h"])

    assert root_result.exit_code == 0
    assert gui_result.exit_code == 0
    assert "Pretty Crystal command line tools." in root_result.output
    assert "Start the local Pretty Crystal GUI server." in gui_result.output


def test_wait_for_server_accepts_ready_port() -> None:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.bind(("127.0.0.1", 0))
        server.listen()
        port = int(server.getsockname()[1])

        assert _wait_for_server("127.0.0.1", port, timeout_seconds=0.5)


def test_open_browser_when_ready_waits_for_server(monkeypatch) -> None:
    opened_urls: list[str] = []

    def wait_for_server(host: str, port: int) -> bool:
        assert host == "127.0.0.1"
        assert port == 8765
        return True

    def open_browser(url: str) -> bool:
        opened_urls.append(url)
        return True

    monkeypatch.setattr(cli, "_wait_for_server", wait_for_server)
    monkeypatch.setattr(cli.webbrowser, "open", open_browser)

    cli._open_browser_when_ready("http://127.0.0.1:8765", "127.0.0.1", 8765)

    assert opened_urls == ["http://127.0.0.1:8765"]


def test_open_browser_when_ready_skips_unavailable_server(monkeypatch) -> None:
    opened_urls: list[str] = []

    def wait_for_server(host: str, port: int) -> bool:
        assert host == "127.0.0.1"
        assert port == 8765
        return False

    def open_browser(url: str) -> bool:
        opened_urls.append(url)
        return True

    monkeypatch.setattr(cli, "_wait_for_server", wait_for_server)
    monkeypatch.setattr(cli.webbrowser, "open", open_browser)

    cli._open_browser_when_ready("http://127.0.0.1:8765", "127.0.0.1", 8765)

    assert opened_urls == []


def test_render_help_lists_key_options() -> None:
    result = runner.invoke(cli.app, ["render", "-h"])

    assert result.exit_code == 0
    assert "--style" in result.output
    assert "--material-preset" in result.output
    assert "--output-dir" in result.output


def test_render_settings_merges_cli_overrides_over_style_file(tmp_path) -> None:
    style_path = tmp_path / "style.json"
    style_path.write_text(
        '{"style": {"materialPreset": "glossy", "atomRadius": 55},'
        ' "export": {"width": 1200, "background": "white"}}',
        encoding="utf-8",
    )

    settings = cli._render_settings(
        style_path=style_path,
        material_preset="tachyon",
        width=800,
        height=None,
        image_format="jpg",
        background=None,
        supersampling=None,
        mesh_quality=None,
    )

    assert settings["style"] == {"materialPreset": "tachyon", "atomRadius": 55}
    assert settings["export"] == {"width": 800, "background": "white", "format": "jpg"}


def test_render_settings_without_style_file() -> None:
    settings = cli._render_settings(
        style_path=None,
        material_preset=None,
        width=None,
        height=None,
        image_format=None,
        background=None,
        supersampling=None,
        mesh_quality=None,
    )

    assert settings == {}


def test_render_settings_rejects_invalid_choices() -> None:
    import pytest
    import typer

    with pytest.raises(typer.BadParameter):
        cli._render_settings(
            style_path=None,
            material_preset=None,
            width=None,
            height=None,
            image_format="bmp",
            background=None,
            supersampling=None,
            mesh_quality=None,
        )


def test_render_rejects_invalid_style_json(tmp_path) -> None:
    style_path = tmp_path / "style.json"
    style_path.write_text("[1, 2, 3]", encoding="utf-8")

    result = runner.invoke(
        cli.app,
        ["render", "missing.cif", "--style", str(style_path)],
    )

    assert result.exit_code != 0
    assert "must contain a JSON object" in result.output


def test_render_rejects_unknown_bond_algorithm() -> None:
    result = runner.invoke(
        cli.app,
        ["render", "missing.cif", "--bond-algorithm", "nope"],
    )

    assert result.exit_code != 0


def test_render_rejects_conflicting_animation_flags(tmp_path) -> None:
    result = runner.invoke(
        cli.app,
        ["render", "a.cif", "b.cif", "--animate", "--turntable", "24"],
    )
    assert result.exit_code != 0

    result = runner.invoke(cli.app, ["render", "a.cif", "--align"])
    assert result.exit_code != 0

    result = runner.invoke(cli.app, ["render", "a.cif", "--animate"])
    assert result.exit_code != 0

    result = runner.invoke(
        cli.app,
        ["render", "a.cif", "--turntable", "24", "--animation-format", "avi"],
    )
    assert result.exit_code != 0


def test_align_structures_to_first_maps_identical_structures() -> None:
    from pathlib import Path as _Path

    from pretty_crystal.animation import align_structures_to_first
    from pretty_crystal.structures.readers import read_structure

    fixture = _Path(__file__).parent / "fixtures" / "structures" / "NaCl.cif"
    first = read_structure(fixture)
    second = read_structure(fixture)

    aligned = align_structures_to_first([first, second])

    assert len(aligned) == 2
    assert len(aligned[1]) == len(first)


def test_align_structures_to_first_rejects_unrelated_structures() -> None:
    from pathlib import Path as _Path

    import pytest as _pytest

    from pretty_crystal.animation import (
        StructureAlignmentError,
        align_structures_to_first,
    )
    from pretty_crystal.structures.readers import read_structure

    fixtures = _Path(__file__).parent / "fixtures" / "structures"
    nacl = read_structure(fixtures / "NaCl.cif")
    si = read_structure(fixtures / "Si.cif")

    with _pytest.raises(StructureAlignmentError):
        align_structures_to_first([nacl, si])


def test_encode_gif_writes_animation(tmp_path) -> None:
    from io import BytesIO

    from PIL import Image

    from pretty_crystal.animation import encode_animation

    frames = []
    for color in [(255, 0, 0, 255), (0, 255, 0, 255)]:
        buffer = BytesIO()
        Image.new("RGBA", (16, 16), color).save(buffer, format="PNG")
        frames.append(buffer.getvalue())

    output = tmp_path / "out.gif"
    encode_animation(frames, animation_format="gif", fps=10, output_path=output)

    animation = Image.open(output)
    assert animation.n_frames == 2


def test_compose_montage_builds_labeled_grid() -> None:
    from io import BytesIO

    from PIL import Image

    from pretty_crystal.montage import compose_montage

    tiles = []
    for color in [(255, 0, 0, 255), (0, 255, 0, 255), (0, 0, 255, 255)]:
        buffer = BytesIO()
        Image.new("RGBA", (60, 40), color).save(buffer, format="PNG")
        tiles.append(buffer.getvalue())

    data = compose_montage(tiles, columns=2, labels=["a", "b", "c"])
    montage = Image.open(BytesIO(data))

    assert montage.width > 2 * 60
    assert montage.height > 2 * 40


def test_compose_montage_rejects_mismatched_labels() -> None:
    import pytest as _pytest

    from pretty_crystal.montage import MontageComposeError, compose_montage

    with _pytest.raises(MontageComposeError):
        compose_montage([b"x"], labels=["a", "b"])
    with _pytest.raises(MontageComposeError):
        compose_montage([])


def test_render_rejects_montage_conflicts() -> None:
    result = runner.invoke(cli.app, ["render", "a.cif", "--montage"])
    assert result.exit_code != 0

    result = runner.invoke(
        cli.app, ["render", "a.cif", "b.cif", "--montage", "--animate"]
    )
    assert result.exit_code != 0

    result = runner.invoke(
        cli.app, ["render", "a.cif", "b.cif", "--montage", "-f", "pdf"]
    )
    assert result.exit_code != 0
