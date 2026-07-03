# Batch Rendering (`prc render`)

`prc render` produces figures from structure files without opening the GUI. It reuses the
exact browser rendering pipeline (materials, lighting, ambient occlusion, fog, export
supersampling), driven in headless Chromium, so batch output is pixel-identical to GUI
exports.

## Setup

Headless rendering needs Playwright and its Chromium build:

```bash
pip install 'pretty-crystal[render]'
playwright install chromium
```

The bundled web frontend must be available (it is included in release wheels; in a
development checkout run `cd web && bun run build` first).

## Usage

```bash
prc render structures/*.cif -o figures/
prc render LiFePO4.cif -m tachyon --width 2400 --height 1800 -f png -b white
prc render structures/*.cif --style mystyle.json -o figures/
```

Each input produces output files named from the input stem (`LiFePO4.cif` →
`LiFePO4.png`, plus `LiFePO4-legend.png` etc. when separate components are enabled).
Failures are reported per file; the command exits non-zero if any structure failed.

Options (CLI flags override the style file):

| Flag | Meaning |
| --- | --- |
| `-o, --output-dir` | Output directory (created if missing). |
| `-s, --style` | Render settings JSON file (see below). |
| `-m, --material-preset` | Material preset ID (`modern-matte`, `classic-matte`, `glossy`, `metallic`, `tachyon`, `2-5d`, `2d`). |
| `--width`, `--height` | Output size in pixels (64–6000). |
| `-f, --format` | `png`, `jpg`, or `pdf`. |
| `-b, --background` | `transparent`, `white`, or `black`. |
| `--supersampling` | `1`, `2`, or `4`. |
| `--mesh-quality` | `low`, `medium`, `high`, or `xhigh`. |
| `--bond-algorithm` | Bond detection algorithm (e.g. `crystal-nn`). |
| `--supercell` | Supercell to display, e.g. `2x2x1`. |
| `--pxrd` | Also export a simulated PXRD pattern as a vector SVG chart (with `--pxrd-wavelength`, `--pxrd-fwhm`). |
| `--turntable N` | Render a rotating animation with N frames per input. |
| `--animate` | Treat all inputs as frames of one animation; `--align` maps each structure onto the first via `StructureMatcher.get_s2_like_s1`. |
| `--fps`, `--animation-format` | Animation frame rate and container (`gif` or `mp4`; mp4 needs `ffmpeg` on PATH). |
| `--montage` | Compose all inputs into one labeled comparison grid (`--montage-columns`, `--no-montage-labels`). |

Animations default to a white background because GIF/MP4 containers have no
useful alpha channel. Turntable output is `<stem>-turntable.gif`, series output
`<first-stem>-series.gif`, montage output `<first-stem>-montage.png`, and PXRD
output `<stem>-pxrd.svg`.

The GUI supports the trajectory workflow interactively: select multiple files
in the Open dialog to load them as frames, scrub or play them from the
timeline bar (with an Align toggle), and export turntable or series GIFs from
the Export tab's Animation section. Comparison montages are a batch feature
(`--montage`). A ready-made demo series lives in
`examples/series/NaCl-breathing/`.

## Style file

The style file is a JSON object with optional sections. Every field is optional and
defaults to the GUI defaults. Unknown keys are rejected with a precise error path.

```jsonc
{
  "style": {
    "materialPreset": "tachyon",       // preset ID
    "colorScheme": "vesta-soft",       // color scheme ID
    "elementColors": { "Fe": "#b67822" }, // per-element overrides (hex)
    "distinguishSimilarColors": true,
    "asuHighlight": false,             // ghost everything outside the asymmetric unit
    "asuGhostOpacity": 15,             // ghost transparency in percent
    "latticePlane": { "h": 1, "k": 1, "l": 1, "offsetPercent": 50,
                      "color": "#4a7dbd", "opacityPercent": 32 }, // (hkl) cut plane
    "vectorGlyphProperty": "magmom",   // site property drawn as arrows (or null)
    "vectorGlyphScale": 100,           // percent
    "atomRadius": 40,                  // percent
    "atomRadiusModel": "uniform",      // uniform | atomic | vdw | ionic
    "bondThickness": 100,              // percent
    "bondColorMode": "bicolor",        // unicolor | bicolor
    "bondColor": "#d2d2d2",            // used in unicolor mode
    "fogEnabled": true,                // depth cueing
    "fogAmount": 40,
    "fogStart": 40,
    "fogAffectsUnitCell": false
  },
  "orientation": {
    "direct": [1, 0, 0],               // zone axis (direct lattice coefficients)
    "primary": "outward",              // right | upward | outward
    "reciprocal": [0, 0, 1],           // secondary axis (reciprocal coefficients)
    "secondary": "upward",
    "rollDegrees": 0
    // ...or an exact camera quaternion instead of the crystal axes:
    // "quaternion": [x, y, z, w]  — this is what the GUI's "Style" copy
    // button writes, capturing the current view exactly.
  },
  "componentVisibility": {
    "atoms": true,
    "bonds": true,
    "unitCell": true,
    "polyhedra": false,
    "boundaryAtoms": true,
    "oneHopBondedAtoms": false
  },
  "componentOpacity": {
    "atoms": 100,
    "bonds": 100,
    "unitCell": 100,
    "polyhedra": 75
  },
  "export": {
    "width": 2000,
    "height": 2000,
    "format": "png",                   // png | jpg | pdf
    "background": "transparent",       // transparent | white | black
    "supersampling": 2,                // 1 | 2 | 4
    "meshQuality": "high",             // low | medium | high | xhigh
    "combineComponents": true,
    "components": { "structure": true, "crystalAxes": false, "legend": false },
    "legendLayout": "horizontal"       // horizontal | vertical
  },
  "lightStrength": 1.0,
  "unitCellLineStyle": "solid",        // solid | dashed
  "showCrystalAxisLabels": true
}
```

When `orientation` is omitted, each structure is rendered from its standard
crystallographic pose (the same default the GUI opens with).

The GUI's Export tab has a **Style** button that copies the current view
(including the exact camera orientation) as a style JSON ready for
`prc render --style`, and an **Apply** button that loads such a file back,
restoring the style, display, export settings, and camera.

## Python API

The same pipeline is available from Python and notebooks:

```python
from pretty_crystal import render_figure, render_pxrd

figure = render_figure("LiFePO4.cif", material_preset="tachyon", width=1600)
figure                      # displays inline in Jupyter
figure.save("LiFePO4.png")

chart = render_pxrd("LiFePO4.cif", wavelength="CuKa", fwhm=0.25)
chart.save("LiFePO4-pxrd.svg")
```

`render_figure` accepts a pymatgen `Structure` or a file path, plus `style=`
(dict or style-file path) and the same overrides as the CLI flags. The shared
headless browser session starts on first use and is closed automatically at
exit (or explicitly with `pretty_crystal.close_renderer()`).

## How it works

`prc render` starts the local Pretty Crystal server, opens the bundled web app in
headless Chromium with `?headless=1` (which skips the interactive UI and exposes a render
bridge), and for each input file parses the structure with pymatgen, sends the scene JSON
plus settings to the page, and saves the returned image bytes. The server and browser
start once per invocation and are reused across all inputs.
