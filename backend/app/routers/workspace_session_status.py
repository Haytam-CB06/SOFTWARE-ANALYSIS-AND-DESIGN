from __future__ import annotations

from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.workspace import Workspace, WorkspaceMember
from app.models.workspace_session_status_log import WorkspaceSessionStatusLog, WorkspaceSessionStatus


router = APIRouter(prefix="/workspaces", tags=["workspace-session-status"])


def _parse_user_id(x_user_id: str) -> UUID:
    try:
        return UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")


def _require_workspace_admin(db: Session, workspace_id: int, requester_user_id: UUID) -> None:
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
    if (m.role or "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Only workspace admins can modify session status")


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


class StatusItemIn(BaseModel):
    calendar_session_id: str
    status: str
    marked_by_user_id: Optional[UUID] = None

    @field_validator("calendar_session_id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        vv = (v or "").strip()
        if not vv:
            raise ValueError("calendar_session_id is required")
        return vv

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        vv = (v or "").strip().lower()
        if vv not in {"planned", "completed", "missed", "skipped"}:
            raise ValueError("status must be one of planned|completed|missed|skipped")
        return vv


class BulkUpsertIn(BaseModel):
    items: List[StatusItemIn]


@router.get("/{workspace_id}/session-status", response_model=Dict[str, str])
def get_workspace_session_status(
    workspace_id: int,
    week_id: str = Query(..., description="Week identifier (e.g. 2025-W52)"),
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    requester_user_id = _parse_user_id(x_user_id)
    # Members can view statuses; only admins can modify (PUT).
    _require_workspace_member(db, workspace_id, requester_user_id)

    rows = (
        db.query(WorkspaceSessionStatusLog)
        .filter(
            WorkspaceSessionStatusLog.workspace_id == workspace_id,
            WorkspaceSessionStatusLog.week_id == week_id,
        )
        .all()
    )
    return {r.calendar_session_id: (r.status.value if hasattr(r.status, "value") else str(r.status)) for r in rows}


@router.put("/{workspace_id}/session-status", response_model=dict)
def put_workspace_session_status_bulk(
    workspace_id: int,
    payload: BulkUpsertIn,
    week_id: str = Query(..., description="Week identifier (e.g. 2025-W52)"),
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    requester_user_id = _parse_user_id(x_user_id)
    # Members can view statuses; only admins can modify.
    _require_workspace_admin(db, workspace_id, requester_user_id)

    items = payload.items or []
    if not items:
        return {"updated": 0}

    updated = 0
    for it in items:
        existing = (
            db.query(WorkspaceSessionStatusLog)
            .filter(
                WorkspaceSessionStatusLog.workspace_id == workspace_id,
                WorkspaceSessionStatusLog.week_id == week_id,
                WorkspaceSessionStatusLog.calendar_session_id == it.calendar_session_id,
            )
            .first()
        )
        st_enum = WorkspaceSessionStatus(it.status)

        if existing:
            existing.status = st_enum
            existing.marked_by_user_id = it.marked_by_user_id or requester_user_id
            db.add(existing)
            updated += 1
        else:
            row = WorkspaceSessionStatusLog(
                workspace_id=workspace_id,
                week_id=week_id,
                calendar_session_id=it.calendar_session_id,
                status=st_enum,
                marked_by_user_id=it.marked_by_user_id or requester_user_id,
            )
            db.add(row)
            updated += 1

    db.commit()
    return {"updated": updated}
