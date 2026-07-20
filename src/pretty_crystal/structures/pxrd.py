"""Powder X-ray diffraction pattern simulation.

Implements the standard kinematic XRD intensity calculation (structure factors
from tabulated atomic scattering parameters plus the Lorentz-polarization
correction), following the algorithm of pymatgen's XRDCalculator. The atomic
scattering parameter table in ``data/atomic_scattering_params.json`` is
vendored from pymatgen (MIT license, https://github.com/materialsproject/pymatgen),
which sources it from De Graef & McHenry, "Structure of Materials" (2007).
"""

from __future__ import annotations

import json
import math
from importlib.resources import files
from typing import TypedDict

import numpy as np
from pymatgen.core import Structure

# Characteristic X-ray wavelengths in angstroms (weighted Ka averages and
# individual lines), matching the presets offered by common XRD software.
WAVELENGTHS: dict[str, float] = {
    "CuKa": 1.54184,
    "CuKa1": 1.54056,
    "CuKa2": 1.54439,
    "MoKa": 0.71073,
    "MoKa1": 0.70930,
    "CoKa": 1.79026,
    "CrKa": 2.29100,
    "FeKa": 1.93735,
    "AgKa": 0.560885,
}
DEFAULT_WAVELENGTH = "CuKa"
DEFAULT_TWO_THETA_RANGE = (5.0, 90.0)
TWO_THETA_TOL = 1e-5
SCALED_INTENSITY_TOL = 1e-3

_SCATTERING_PARAMS: dict[str, list[list[float]]] = json.loads(
    files(__package__).joinpath("data/atomic_scattering_params.json").read_text()
)


class PxrdComputeError(ValueError):
    """Raised when a diffraction pattern cannot be computed."""


class PxrdPeakSpec(TypedDict):
    dSpacing: float
    hkl: list[int]
    intensity: float
    multiplicity: int
    twoTheta: float


class PxrdPatternSpec(TypedDict):
    peaks: list[PxrdPeakSpec]
    twoThetaMax: float
    twoThetaMin: float
    wavelength: float
    wavelengthLabel: str


def resolve_wavelength(value: str | float | None) -> tuple[float, str]:
    if value is None or value == "":
        return WAVELENGTHS[DEFAULT_WAVELENGTH], DEFAULT_WAVELENGTH

    if isinstance(value, int | float):
        wavelength = float(value)
        if not math.isfinite(wavelength) or wavelength <= 0:
            raise PxrdComputeError("The X-ray wavelength must be a positive number.")
        return wavelength, f"{wavelength:g} Å"

    normalized = value.strip()
    for label, wavelength in WAVELENGTHS.items():
        if label.lower() == normalized.lower():
            return wavelength, label

    try:
        return resolve_wavelength(float(normalized))
    except ValueError as exc:
        if isinstance(exc, PxrdComputeError):
            raise
        supported = ", ".join(WAVELENGTHS)
        raise PxrdComputeError(
            f"Unsupported wavelength '{value}'. Use a number in angstroms or one "
            f"of: {supported}."
        ) from exc


def compute_pxrd_pattern(
    structure: Structure,
    *,
    wavelength: str | float | None = None,
    two_theta_min: float = DEFAULT_TWO_THETA_RANGE[0],
    two_theta_max: float = DEFAULT_TWO_THETA_RANGE[1],
) -> PxrdPatternSpec:
    resolved_wavelength, wavelength_label = resolve_wavelength(wavelength)
    if not (0 <= two_theta_min < two_theta_max <= 180):
        raise PxrdComputeError("The two-theta range must satisfy 0 <= min < max <= 180.")

    latt = structure.lattice
    recip_latt = latt.reciprocal_lattice_crystallographic
    max_r = 2 * math.sin(math.radians(two_theta_max / 2)) / resolved_wavelength
    recip_pts = recip_latt.get_points_in_sphere([[0, 0, 0]], [0, 0, 0], max_r)

    site_data = _site_scattering_data(structure)
    fractional_coords = np.array([site.frac_coords for site in structure])

    peaks: dict[float, _PeakAccumulator] = {}
    two_thetas: list[float] = []

    for hkl, g_hkl, _, _ in sorted(recip_pts, key=lambda entry: entry[1]):
        if g_hkl < 1e-8:
            continue

        theta = math.asin(min(1.0, resolved_wavelength * g_hkl / 2))
        two_theta = math.degrees(2 * theta)
        if two_theta < two_theta_min - TWO_THETA_TOL or two_theta > two_theta_max + TWO_THETA_TOL:
            continue
        # The Lorentz-polarization correction diverges at exact backscattering
        # (2θ = 180°), which the range validation permits.
        if math.cos(theta) < 1e-8:
            continue

        hkl_ints = [int(round(index)) for index in hkl]
        s2 = (g_hkl / 2) ** 2
        g_dot_r = np.dot(fractional_coords, np.array(hkl_ints).T)

        f_hkl = 0j
        for site_index, species in site_data:
            phase = np.exp(2j * math.pi * g_dot_r[site_index])
            for atomic_number, coeffs, occupancy in species:
                fs = atomic_number - 41.78214 * s2 * np.sum(
                    coeffs[:, 0] * np.exp(-coeffs[:, 1] * s2)
                )
                f_hkl += fs * occupancy * phase

        intensity = (f_hkl * f_hkl.conjugate()).real
        lorentz_factor = (1 + math.cos(2 * theta) ** 2) / (
            math.sin(theta) ** 2 * math.cos(theta)
        )
        weighted_intensity = intensity * lorentz_factor

        matched_two_theta = _nearest_two_theta(two_thetas, two_theta)
        if matched_two_theta is None:
            two_thetas.append(two_theta)
            peaks[two_theta] = _PeakAccumulator(
                d_spacing=1 / g_hkl,
                hkl=hkl_ints,
                intensity=weighted_intensity,
                multiplicity=1,
            )
        else:
            accumulator = peaks[matched_two_theta]
            accumulator.intensity += weighted_intensity
            accumulator.multiplicity += 1
            # Label the peak with the conventional (positive-leading)
            # representative among the observed equivalent reflections.
            if tuple(hkl_ints) > tuple(accumulator.hkl):
                accumulator.hkl = hkl_ints

    return {
        "peaks": _scaled_peaks(peaks),
        "twoThetaMax": two_theta_max,
        "twoThetaMin": two_theta_min,
        "wavelength": resolved_wavelength,
        "wavelengthLabel": wavelength_label,
    }


class _PeakAccumulator:
    __slots__ = ("d_spacing", "hkl", "intensity", "multiplicity")

    def __init__(
        self,
        *,
        d_spacing: float,
        hkl: list[int],
        intensity: float,
        multiplicity: int,
    ) -> None:
        self.d_spacing = d_spacing
        self.hkl = hkl
        self.intensity = intensity
        self.multiplicity = multiplicity


def _site_scattering_data(structure: Structure):
    site_data = []
    for site_index, site in enumerate(structure):
        species = []
        for sp, occupancy in site.species.items():
            symbol = sp.symbol
            coeffs = _SCATTERING_PARAMS.get(symbol)
            if coeffs is None:
                raise PxrdComputeError(
                    f"No atomic scattering parameters are available for element "
                    f"'{symbol}'."
                )
            species.append((sp.Z, np.array(coeffs), float(occupancy)))
        site_data.append((site_index, species))

    return site_data


def _nearest_two_theta(two_thetas: list[float], two_theta: float) -> float | None:
    best: float | None = None
    best_distance = TWO_THETA_TOL
    for candidate in two_thetas:
        distance = abs(candidate - two_theta)
        if distance <= best_distance:
            best = candidate
            best_distance = distance
    return best


def _scaled_peaks(peaks: dict[float, _PeakAccumulator]) -> list[PxrdPeakSpec]:
    if not peaks:
        return []

    max_intensity = max(accumulator.intensity for accumulator in peaks.values())
    if max_intensity <= 0:
        return []

    scaled: list[PxrdPeakSpec] = []
    for two_theta in sorted(peaks):
        accumulator = peaks[two_theta]
        intensity = 100 * accumulator.intensity / max_intensity
        if intensity < SCALED_INTENSITY_TOL:
            continue
        scaled.append(
            {
                "dSpacing": round(accumulator.d_spacing, 6),
                "hkl": accumulator.hkl,
                "intensity": round(intensity, 4),
                "multiplicity": accumulator.multiplicity,
                "twoTheta": round(two_theta, 6),
            }
        )

    return scaled
