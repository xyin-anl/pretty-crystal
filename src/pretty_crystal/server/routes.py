from __future__ import annotations

from urllib.parse import unquote

from fastapi import APIRouter, HTTPException, Query, Request, UploadFile

from pretty_crystal.structures.pxrd import PxrdComputeError, compute_pxrd_pattern
from pretty_crystal.structures.readers import StructureReadError, read_structure_bytes
from pretty_crystal.structures.scene_builder import build_scene_response
from pretty_crystal.structures.schema import (
    UnsupportedBondAlgorithmError,
    UnsupportedSupercellError,
    normalize_bond_algorithm,
    normalize_supercell,
)

router = APIRouter()
MAX_STRUCTURE_UPLOAD_BYTES = 1 * 1024 * 1024
STRUCTURE_FILE_TOO_LARGE_MESSAGE = "File is too large to preview."


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/structure-preview")
async def create_structure_preview(
    request: Request,
    bond_algorithm: str | None = Query(default=None, alias="bondAlgorithm"),
    supercell: str | None = Query(default=None, alias="supercell"),
) -> dict[str, object]:
    filename = _uploaded_filename(request)
    try:
        normalized_bond_algorithm = normalize_bond_algorithm(bond_algorithm)
        normalized_supercell = normalize_supercell(supercell)
    except (UnsupportedBondAlgorithmError, UnsupportedSupercellError) as exc:
        raise HTTPException(status_code=400, detail={"message": str(exc)}) from exc

    try:
        payload = await _uploaded_payload(request)
        structure = read_structure_bytes(payload, filename=filename)
        return build_scene_response(
            structure,
            bond_algorithm=normalized_bond_algorithm,
            supercell=normalized_supercell,
        )
    except (StructureReadError, UnsupportedSupercellError) as exc:
        raise HTTPException(status_code=400, detail={"message": str(exc)}) from exc


MAX_TRAJECTORY_FRAMES = 600


@router.post("/trajectory-preview")
async def create_trajectory_preview(
    files: list[UploadFile],
    bond_algorithm: str | None = Query(default=None, alias="bondAlgorithm"),
    supercell: str | None = Query(default=None, alias="supercell"),
    align: bool = Query(default=False, alias="align"),
) -> dict[str, object]:
    """Parses multiple structure files into scene frames for trajectory playback."""
    if not files:
        raise HTTPException(
            status_code=400, detail={"message": "No structure files were uploaded."}
        )
    if len(files) > MAX_TRAJECTORY_FRAMES:
        raise HTTPException(
            status_code=400,
            detail={"message": f"At most {MAX_TRAJECTORY_FRAMES} frames are supported."},
        )

    try:
        normalized_bond_algorithm = normalize_bond_algorithm(bond_algorithm)
        normalized_supercell = normalize_supercell(supercell)
    except (UnsupportedBondAlgorithmError, UnsupportedSupercellError) as exc:
        raise HTTPException(status_code=400, detail={"message": str(exc)}) from exc

    structures = []
    file_names = []
    try:
        for upload in files:
            payload = await upload.read()
            if len(payload) > MAX_STRUCTURE_UPLOAD_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail={"message": STRUCTURE_FILE_TOO_LARGE_MESSAGE},
                )
            file_name = upload.filename or "uploaded structure"
            structures.append(read_structure_bytes(payload, filename=file_name))
            file_names.append(file_name)

        if align:
            from pretty_crystal.animation import (
                StructureAlignmentError,
                align_structures_to_first,
            )

            try:
                structures = align_structures_to_first(structures)
            except StructureAlignmentError as exc:
                raise HTTPException(
                    status_code=400, detail={"message": str(exc)}
                ) from exc

        frames = [
            dict(
                build_scene_response(
                    structure,
                    bond_algorithm=normalized_bond_algorithm,
                    supercell=normalized_supercell,
                )
            )
            for structure in structures
        ]
    except (StructureReadError, UnsupportedSupercellError) as exc:
        raise HTTPException(status_code=400, detail={"message": str(exc)}) from exc

    return {"fileNames": file_names, "frames": frames}


@router.post("/pxrd")
async def create_pxrd_pattern(
    request: Request,
    wavelength: str | None = Query(default=None, alias="wavelength"),
    two_theta_min: float = Query(default=5.0, alias="twoThetaMin"),
    two_theta_max: float = Query(default=90.0, alias="twoThetaMax"),
) -> dict[str, object]:
    filename = _uploaded_filename(request)
    try:
        payload = await _uploaded_payload(request)
        structure = read_structure_bytes(payload, filename=filename)
        return dict(
            compute_pxrd_pattern(
                structure,
                wavelength=wavelength,
                two_theta_min=two_theta_min,
                two_theta_max=two_theta_max,
            )
        )
    except (StructureReadError, PxrdComputeError) as exc:
        raise HTTPException(status_code=400, detail={"message": str(exc)}) from exc


async def _uploaded_payload(request: Request) -> bytes:
    content_length = request.headers.get("content-length")
    if content_length is not None:
        try:
            upload_size = int(content_length)
        except ValueError:
            upload_size = None
        if upload_size is not None and upload_size > MAX_STRUCTURE_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail={"message": STRUCTURE_FILE_TOO_LARGE_MESSAGE},
            )

    payload = await request.body()
    if len(payload) > MAX_STRUCTURE_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail={"message": STRUCTURE_FILE_TOO_LARGE_MESSAGE})
    return payload


def _uploaded_filename(request: Request) -> str:
    encoded_name = request.headers.get("x-pretty-crystal-filename")
    if encoded_name:
        return unquote(encoded_name)
    return "uploaded structure"
