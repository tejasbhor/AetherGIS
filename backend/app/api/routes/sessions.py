"""Session and run metadata routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.app.api.deps.identity import resolve_current_user_id

from backend.app.models.schemas import (
    RunSummaryResponse,
    SessionCreateV2Request,
    SessionRenameRequest,
    SessionSummaryResponse,
)
from backend.app.services.persistence import (
    archive_session,
    create_session,
    get_run,
    get_session,
    list_runs,
    list_sessions,
    rename_session,
)

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.get("", response_model=list[SessionSummaryResponse])
async def list_sessions_endpoint(
    include_archived: bool = Query(False, description="Include archived sessions in the response."),
    current_user_id: str = Depends(resolve_current_user_id),
) -> list[dict]:
    return list_sessions(include_archived=include_archived, user_id=current_user_id)


@router.post("", response_model=SessionSummaryResponse, status_code=201)
async def create_session_endpoint(
    request: SessionCreateV2Request,
    current_user_id: str = Depends(resolve_current_user_id),
) -> dict:
    return create_session(name=request.name, provider_default=request.provider_default.value, user_id=current_user_id)


@router.get("/{session_id}", response_model=SessionSummaryResponse)
async def get_session_endpoint(session_id: str, current_user_id: str = Depends(resolve_current_user_id)) -> dict:
    session = get_session(session_id, user_id=current_user_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return session


@router.patch("/{session_id}", response_model=SessionSummaryResponse)
async def rename_session_endpoint(
    session_id: str,
    request: SessionRenameRequest,
    current_user_id: str = Depends(resolve_current_user_id),
) -> dict:
    session = rename_session(session_id, request.name, user_id=current_user_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return session


@router.delete("/{session_id}", response_model=dict)
async def archive_session_endpoint(session_id: str, current_user_id: str = Depends(resolve_current_user_id)) -> dict:
    if not archive_session(session_id, user_id=current_user_id):
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return {"session_id": session_id, "status": "archived"}


@router.get("/{session_id}/runs", response_model=list[RunSummaryResponse])
async def list_session_runs_endpoint(
    session_id: str,
    limit: int = Query(50, ge=1, le=200),
    current_user_id: str = Depends(resolve_current_user_id),
) -> list[dict]:
    session = get_session(session_id, user_id=current_user_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return list_runs(session_id=session_id, limit=limit, user_id=current_user_id)


@router.get("/runs/{run_id}", response_model=RunSummaryResponse)
async def get_run_endpoint(run_id: str, current_user_id: str = Depends(resolve_current_user_id)) -> dict:
    run = get_run(run_id, user_id=current_user_id)
    if run is None:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return run
