from __future__ import annotations

from pymatgen.core import Structure

import pretty_crystal.structures.connectivity as connectivity_module
import pretty_crystal.structures.polyhedra as polyhedra_module
from pretty_crystal.structures.periodic_images import (
    atom_record_to_spec,
    build_atom_records,
    vector3,
)
from pretty_crystal.structures.schema import (
    BondAlgorithm,
    SceneSpec,
    Supercell,
    bond_algorithm_label,
    default_bond_algorithm_for_atom_count,
    normalize_bond_algorithm,
    validate_supercell_atom_count,
)
from pretty_crystal.structures.summary import (
    build_structure_summary,
    has_valid_3d_periodic_cell,
)


def build_scene_response(
    structure: Structure,
    *,
    bond_algorithm: str | None = None,
    supercell: Supercell | None = None,
) -> SceneSpec:
    return build_scene_spec(structure, bond_algorithm=bond_algorithm, supercell=supercell)


def build_scene_spec(
    structure: Structure,
    *,
    bond_algorithm: str | None = None,
    supercell: Supercell | None = None,
) -> SceneSpec:
    if supercell is not None and supercell != (1, 1, 1):
        validate_supercell_atom_count(len(structure), supercell)
        structure = structure.copy()
        structure.make_supercell(supercell)

    normalized_bond_algorithm = normalize_bond_algorithm(bond_algorithm)
    selected_bond_algorithm = normalized_bond_algorithm or default_bond_algorithm_for_atom_count(
        len(structure)
    )
    cell_vectors = [vector3(vector) for vector in structure.lattice.matrix]
    can_generate_periodic_images = has_valid_3d_periodic_cell(structure)
    atom_data = build_atom_records(
        structure,
        can_generate_periodic_images=can_generate_periodic_images,
    )

    bonds = []
    polyhedra = []
    warnings = []
    if can_generate_periodic_images:
        boundary_source_keys = [
            key
            for key, atom in atom_data.atom_records.items()
            if "boundary" in atom.image_reasons
        ]
        try:
            connectivity = connectivity_module.build_connectivity(
                atom_records=atom_data.atom_records,
                bond_algorithm=selected_bond_algorithm,
                canonical_source_keys=atom_data.canonical_source_keys,
                boundary_source_keys=boundary_source_keys,
                sites=atom_data.sites,
                structure=structure,
            )
        except Exception as exc:
            warnings.append(
                _analysis_warning(
                    code="bond-analysis-failed",
                    analysis="Bond analysis",
                    bond_algorithm=selected_bond_algorithm,
                    exc=exc,
                )
            )
        else:
            atom_index_by_key = {
                key: index for index, key in enumerate(atom_data.atom_records.keys())
            }
            try:
                bonds = connectivity_module.build_bonds(
                    atom_index_by_key=atom_index_by_key,
                    connectivity=connectivity,
                )
            except Exception as exc:
                warnings.append(
                    _analysis_warning(
                        code="bond-analysis-failed",
                        analysis="Bond analysis",
                        bond_algorithm=selected_bond_algorithm,
                        exc=exc,
                    )
                )

            try:
                polyhedra = polyhedra_module.build_polyhedra(
                    atom_index_by_key=atom_index_by_key,
                    atom_records=atom_data.atom_records,
                    cell_vectors=cell_vectors,
                    connectivity=connectivity,
                    structure=structure,
                )
            except Exception as exc:
                warnings.append(
                    _analysis_warning(
                        code="polyhedra-analysis-failed",
                        analysis="Polyhedra analysis",
                        bond_algorithm=selected_bond_algorithm,
                        exc=exc,
                    )
                )

    unique_site_indices = _symmetry_unique_site_indices(structure)
    scene: SceneSpec = {
        "cell": {"vectors": cell_vectors},
        "atoms": [
            atom_record_to_spec(atom, cell_vectors, unique_site_indices)
            for atom in atom_data.atom_records.values()
        ],
        "bonds": bonds,
        "polyhedra": polyhedra,
        "summary": build_structure_summary(structure),
    }
    vector_property_names = sorted(
        {name for site in atom_data.sites for name, _ in site.site_vectors}
    )
    if vector_property_names:
        scene["vectorProperties"] = vector_property_names
    if warnings:
        scene["warnings"] = warnings

    return scene


def _symmetry_unique_site_indices(structure: Structure) -> frozenset[int] | None:
    """Returns the representative site index of each symmetry orbit.

    Returns None when symmetry analysis is unavailable so every site counts as
    unique.
    """
    try:
        from pymatgen.symmetry.analyzer import SpacegroupAnalyzer

        symmetrized = SpacegroupAnalyzer(
            structure, symprec=1e-5
        ).get_symmetrized_structure()
        return frozenset(
            group[0] for group in symmetrized.equivalent_indices if group
        )
    except Exception:
        return None


def _analysis_warning(
    *,
    code: str,
    analysis: str,
    bond_algorithm: BondAlgorithm,
    exc: Exception,
) -> dict[str, str]:
    return {
        "code": code,
        "message": f"{analysis} with {bond_algorithm_label(bond_algorithm)} failed: {exc}",
    }
