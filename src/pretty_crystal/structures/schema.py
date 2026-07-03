from __future__ import annotations

import json
from importlib.resources import files
from typing import Literal, NotRequired, TypedDict, cast

BondAlgorithm = Literal["crystal-nn", "minimum-distance", "cut-off-dict"]
ImageReason = Literal["boundary", "bonded"]
VisibilityDependency = Literal["boundaryAtoms", "oneHopBondedAtoms"]
Supercell = tuple[int, int, int]

_SCENE_CONTRACT = json.loads(files(__package__).joinpath("scene_contract.json").read_text())

STRUCTURE_ATOM_COUNT_THRESHOLD = int(
    _SCENE_CONTRACT["limits"]["structureAtomCountThreshold"]
)
SUPERCELL_ATOM_COUNT_LIMIT = int(_SCENE_CONTRACT["limits"]["supercellAtomCountLimit"])
SUPERCELL_DIMENSION_MAX = int(_SCENE_CONTRACT["limits"]["supercellDimensionMax"])
DEFAULT_BOND_ALGORITHM = cast(BondAlgorithm, _SCENE_CONTRACT["defaultBondAlgorithm"])
LARGE_STRUCTURE_BOND_ALGORITHM = cast(
    BondAlgorithm, _SCENE_CONTRACT["largeStructureBondAlgorithm"]
)
BOND_ALGORITHM_LABELS: dict[BondAlgorithm, str] = {
    cast(BondAlgorithm, entry["value"]): str(entry["pythonLabel"])
    for entry in _SCENE_CONTRACT["bondAlgorithms"]
}
BOND_ALGORITHM_ALIASES: dict[str, BondAlgorithm] = {
    alias: cast(BondAlgorithm, value)
    for alias, value in _SCENE_CONTRACT["bondAlgorithmAliases"].items()
}


class UnsupportedBondAlgorithmError(ValueError):
    """Raised when a requested preview bond algorithm is not allowlisted."""


class UnsupportedSupercellError(ValueError):
    """Raised when a requested supercell is malformed or too large."""


class CellSpec(TypedDict):
    vectors: list[list[float]]


class CellSummarySpec(TypedDict):
    a: str
    b: str
    c: str
    alpha: str
    beta: str
    gamma: str


class SymmetrySummarySpec(TypedDict):
    available: bool
    spaceGroup: str | None
    spaceGroupNumber: int | None
    pointGroup: str | None
    pointGroupSchoenflies: str | None
    crystalSystem: str | None
    latticeSystem: str | None


class StructureSummarySpec(TypedDict):
    formula: str
    atomCount: int
    cell: CellSummarySpec
    symmetry: SymmetrySummarySpec


class SpeciesOccupancySpec(TypedDict):
    element: str
    occupancy: float


class AtomSpec(TypedDict):
    id: str
    siteId: str
    siteIndex: int
    element: str
    species: list[SpeciesOccupancySpec]
    isSymmetryUnique: bool
    siteVectors: NotRequired[dict[str, list[float]]]
    position: list[float]
    fractionalPosition: list[float]
    imageOffset: list[int]
    isPeriodicImage: bool
    imageReasons: list[ImageReason]
    visibilityDependencies: list[VisibilityDependency]
    visibilityDependencyGroups: list[list[VisibilityDependency]]


class BondSpec(TypedDict):
    startAtomIndex: int
    endAtomIndex: int
    visibilityDependencies: list[VisibilityDependency]
    visibilityDependencyGroups: list[list[VisibilityDependency]]


class PolyhedronSpec(TypedDict):
    centerAtomIndex: int
    hullAtomIndices: list[int]
    faces: list[list[int]]
    visibilityDependencies: list[VisibilityDependency]
    visibilityDependencyGroups: list[list[VisibilityDependency]]


class AnalysisWarningSpec(TypedDict):
    code: str
    message: str


class SceneSpec(TypedDict):
    cell: CellSpec
    atoms: list[AtomSpec]
    bonds: list[BondSpec]
    polyhedra: list[PolyhedronSpec]
    summary: StructureSummarySpec
    vectorProperties: NotRequired[list[str]]
    warnings: NotRequired[list[AnalysisWarningSpec]]


def normalize_bond_algorithm(value: str | None) -> BondAlgorithm | None:
    if value is None or value == "":
        return None

    normalized = value.strip()
    if normalized in BOND_ALGORITHM_LABELS:
        return normalized  # type: ignore[return-value]
    if normalized in BOND_ALGORITHM_ALIASES:
        return BOND_ALGORITHM_ALIASES[normalized]

    supported = ", ".join(BOND_ALGORITHM_LABELS)
    raise UnsupportedBondAlgorithmError(
        f"Unsupported bond algorithm '{value}'. Supported algorithms: {supported}."
    )


def normalize_supercell(value: str | list[int] | tuple[int, ...] | None) -> Supercell | None:
    if value is None or value == "":
        return None

    if isinstance(value, str):
        parts = [part.strip() for part in value.replace(",", "x").lower().split("x")]
    else:
        parts = [str(part) for part in value]

    if len(parts) != 3:
        raise UnsupportedSupercellError(
            f"Unsupported supercell '{value}'. Use three integers such as '2x2x1'."
        )

    dimensions: list[int] = []
    for part in parts:
        try:
            dimension = int(part)
        except (TypeError, ValueError) as exc:
            raise UnsupportedSupercellError(
                f"Unsupported supercell '{value}'. Use three integers such as '2x2x1'."
            ) from exc
        if dimension < 1 or dimension > SUPERCELL_DIMENSION_MAX:
            raise UnsupportedSupercellError(
                f"Supercell dimensions must be between 1 and {SUPERCELL_DIMENSION_MAX}."
            )
        dimensions.append(dimension)

    supercell = (dimensions[0], dimensions[1], dimensions[2])
    if supercell == (1, 1, 1):
        return None
    return supercell


def validate_supercell_atom_count(atom_count: int, supercell: Supercell) -> None:
    expanded_atom_count = atom_count * supercell[0] * supercell[1] * supercell[2]
    if expanded_atom_count > SUPERCELL_ATOM_COUNT_LIMIT:
        raise UnsupportedSupercellError(
            f"A {supercell[0]}x{supercell[1]}x{supercell[2]} supercell of this structure "
            f"would contain {expanded_atom_count} atoms, above the "
            f"{SUPERCELL_ATOM_COUNT_LIMIT}-atom limit."
        )


def bond_algorithm_label(bond_algorithm: BondAlgorithm) -> str:
    return BOND_ALGORITHM_LABELS[bond_algorithm]


def default_bond_algorithm_for_atom_count(atom_count: int) -> BondAlgorithm:
    if atom_count < STRUCTURE_ATOM_COUNT_THRESHOLD:
        return DEFAULT_BOND_ALGORITHM

    return LARGE_STRUCTURE_BOND_ALGORITHM
