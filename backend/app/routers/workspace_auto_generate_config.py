from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.workspace import Workspace, WorkspaceMember
from app.models.workspace_auto_generate_config import WorkspaceAutoGenerateConfig


router = APIRouter(prefix="/workspaces", tags=["workspace-auto-generate"])


def _parse_user_id(x_user_id: str) -> UUID:
    try:
        return UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")


def _require_workspace_member(db: Session, workspace_id: int, requester_user_id: UUID) -> None:
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    m = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == requester_user_id,
        )
        .first()
    )
    if not m:
        raise HTTPException(status_code=403, detail="You are not a member of this workspace")


def _require_workspace_admin(db: Session, workspace_id: int, requester_user_id: UUID) -> None:
    _require_workspace_member(db, workspace_id, requester_user_id)

    m = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == requester_user_id,
        )
        .first()
    )
    if not m or (m.role or "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Only workspace admins can update auto-generate config")


class AutoGenerateConfigIn(BaseModel):
    # Keep this flexible/submission-safe: the frontend controls the schema.
    study_window: Optional[dict[str, Any]] = None
    class_schedule: Optional[list[dict[str, Any]]] = None
    busy_blocks: Optional[list[dict[str, Any]]] = None
    break_minutes: Optional[int] = Field(default=None, ge=0, le=180)
    seed: Optional[str] = None


class AutoGenerateConfigOut(BaseModel):
    workspace_id: int
    config: dict[str, Any]
    updated_at: Optional[str] = None


@router.get("/{workspace_id}/auto-generate-config", response_model=AutoGenerateConfigOut)
def get_workspace_auto_generate_config(
    workspace_id: int,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    """Read shared auto-generate inputs for a workspace.

    Members can read (so they see what admins configured), only admins can update.
    """

    requester_user_id = _parse_user_id(x_user_id)
    _require_workspace_member(db, workspace_id, requester_user_id)

    row = db.query(WorkspaceAutoGenerateConfig).filter(WorkspaceAutoGenerateConfig.workspace_id == workspace_id).first()
    if not row:
        return AutoGenerateConfigOut(workspace_id=workspace_id, config={}, updated_at=None)

    # The model stores a single JSON `config` blob (submission-safe; no migrations required).
    config = (row.config or {}) if hasattr(row, "config") else {}
    return AutoGenerateConfigOut(
        workspace_id=workspace_id,
        config=config,
        updated_at=row.updated_at.isoformat() if getattr(row, "updated_at", None) else None,
    )


@router.put("/{workspace_id}/auto-generate-config", response_model=AutoGenerateConfigOut)
def put_workspace_auto_generate_config(
    workspace_id: int,
    payload: AutoGenerateConfigIn,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    requester_user_id = _parse_user_id(x_user_id)
    _require_workspace_admin(db, workspace_id, requester_user_id)

    row = db.query(WorkspaceAutoGenerateConfig).filter(WorkspaceAutoGenerateConfig.workspace_id == workspace_id).first()
    now = datetime.now(timezone.utc)

    if not row:
        row = WorkspaceAutoGenerateConfig(workspace_id=workspace_id)
        db.add(row)

    # Replace sections inside a single JSON blob (frontend is the source of truth).
    current = (row.config or {}) if hasattr(row, "config") else {}
    next_cfg = dict(current)
    if payload.study_window is not None:
        next_cfg["study_window"] = payload.study_window
    if payload.class_schedule is not None:
        next_cfg["class_schedule"] = payload.class_schedule
    if payload.busy_blocks is not None:
        next_cfg["busy_blocks"] = payload.busy_blocks
    if payload.break_minutes is not None:
        next_cfg["break_minutes"] = int(payload.break_minutes)
    if payload.seed is not None:
        next_cfg["seed"] = payload.seed
    row.config = next_cfg

    # Touch updated_at if the model has it (sqlite/postgres safe)
    if hasattr(row, "updated_at"):
        row.updated_at = now

    db.commit()
    db.refresh(row)

    config = (row.config or {}) if hasattr(row, "config") else {}
    return AutoGenerateConfigOut(
        workspace_id=workspace_id,
        config=config,
        updated_at=row.updated_at.isoformat() if getattr(row, "updated_at", None) else None,
    )
