from __future__ import annotations

from uuid import UUID
from typing import Optional, Union

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember, MemberDeleteLog
from app.schemas import AddMemberRequest, WorkspaceMemberResponse


router = APIRouter(prefix="/workspaces", tags=["members"])


def _require_requester_membership(
    db: Session,
    workspace_id: int,
    requester_user_id: UUID,
) -> WorkspaceMember:
    """Ensure requester is a member of the workspace and return their membership row."""
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
    return m


def _parse_user_id(x_user_id: str) -> UUID:
    try:
        return UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")





@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberResponse])
def get_workspace_members(
    workspace_id: int,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    """Return all members of a workspace.

    Requires requester to be a member of the workspace.
    """

    requester_user_id = _parse_user_id(x_user_id)

    # Workspace must exist
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Must be a member
    _require_requester_membership(db, workspace_id, requester_user_id)

    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).all()

    # Enrich with username/email for frontend display (non-persistent, safe)
    for m in members:
        try:
            u = db.query(User).filter(User.id == m.user_id).first()
            if u:
                setattr(m, "username", getattr(u, "full_name", None) or getattr(u, "username", None) or u.email)
                setattr(m, "email", u.email)
        except Exception:
            pass

    return members


