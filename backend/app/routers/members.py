from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import Optional, Union

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember, MemberDeleteLog
from app.schemas import AddMemberRequest, WorkspaceMemberResponse


router = APIRouter(prefix="/workspaces", tags=["members"])
ONLINE_WINDOW = timedelta(minutes=2)


def _presence_from(last_seen: datetime | None) -> tuple[datetime | None, bool]:
    if not last_seen:
        return None, False
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)
    return last_seen, datetime.now(timezone.utc) - last_seen <= ONLINE_WINDOW


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


@router.post("/{workspace_id}/members", response_model=WorkspaceMemberResponse)
def add_member(
    workspace_id: int,
    payload: AddMemberRequest,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    """Add an existing user to a workspace.

    Frontend sends: { email, role }
    Requester is identified by the X-User-Id header.

    Rules (simple and safe for submission):
    - Requester must be a workspace admin
    - The invited user must already exist (signed up)
    """

    requester_user_id = _parse_user_id(x_user_id)

    # Workspace must exist
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Requester must be a member, and must be admin
    requester_membership = _require_requester_membership(db, workspace_id, requester_user_id)
    if (requester_membership.role or "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Only workspace admins can add members")

    # Resolve the invited user by email
    invited_user = db.query(User).filter(User.email == payload.email).first()
    if not invited_user:
        raise HTTPException(
            status_code=404,
            detail="User with this email is not registered yet. Ask them to sign up first.",
        )

    # Already a member?
    existing = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == invited_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User already a member of this workspace")

    if workspace.parent_id:
        parent_membership = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace.parent_id,
                WorkspaceMember.user_id == invited_user.id,
            )
            .first()
        )
        if not parent_membership:
            raise HTTPException(
                status_code=400,
                detail="User must be a member of the parent workspace before joining this subworkspace",
            )

    role = (payload.role or "member").lower().strip()
    if role not in {"admin", "member"}:
        role = "member"

    new_member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=invited_user.id,
        role=role,
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return new_member


@router.post("/{workspace_id}/presence")
def touch_workspace_presence(
    workspace_id: int,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    requester_user_id = _parse_user_id(x_user_id)
    member = _require_requester_membership(db, workspace_id, requester_user_id)
    now = datetime.now(timezone.utc)
    member.last_seen_at = now
    user = db.query(User).filter(User.id == requester_user_id).first()
    if user:
        user.last_seen_at = now
    db.commit()
    return {
        "workspace_id": workspace_id,
        "user_id": str(requester_user_id),
        "last_seen_at": member.last_seen_at.isoformat(),
        "is_online": True,
    }


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

    users_by_id = {
        u.id: u
        for u in db.query(User)
        .filter(User.id.in_([m.user_id for m in members if m.user_id]))
        .all()
    } if members else {}

    # Enrich with username/email for frontend display (non-persistent, safe)
    for m in members:
        u = users_by_id.get(m.user_id)
        if u:
            setattr(m, "username", getattr(u, "full_name", None) or getattr(u, "username", None) or u.email)
            setattr(m, "email", u.email)
        last_seen_at, is_online = _presence_from(getattr(u, "last_seen_at", None) if u else None)
        if last_seen_at is None:
            last_seen_at, is_online = _presence_from(getattr(m, "last_seen_at", None))
        setattr(m, "last_seen_at", last_seen_at)
        setattr(m, "is_online", is_online)

    return members


@router.delete("/{workspace_id}/members/{member_id_or_user_id}")
def delete_member(
    workspace_id: int,
    member_id_or_user_id: str,
    x_user_id: str = Header(..., alias="X-User-Id"),
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Remove a member from a workspace.

    Frontend currently uses member.id = user_id (UUID string).
    Older code used member.id = membership row id (int).
    This endpoint supports BOTH.
    """

    requester_user_id = _parse_user_id(x_user_id)
    requester_membership = _require_requester_membership(db, workspace_id, requester_user_id)
    if (requester_membership.role or "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Only workspace admins can remove members")

    member_row: Optional[WorkspaceMember] = None

    # Try membership id (int)
    if member_id_or_user_id.isdigit():
        mid = int(member_id_or_user_id)
        member_row = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.id == mid, WorkspaceMember.workspace_id == workspace_id)
            .first()
        )
    else:
        # Try user_id (UUID)
        try:
            uid = UUID(member_id_or_user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid member id")
        member_row = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == uid)
            .first()
        )

    if not member_row:
        raise HTTPException(status_code=404, detail="Member not found")

    # Prevent removing yourself from the workspace (avoid locking admins out by mistake)
    if member_row.user_id == requester_user_id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself")

    # Log deletion (best-effort; does not block removal)
    try:
        delete_log = MemberDeleteLog(
            workspace_id=workspace_id,
            member_id=member_row.id,
            username=None,
            email=None,
            deleted_by=0,
            reason=reason,
        )
        db.add(delete_log)
    except Exception:
        pass

    db.delete(member_row)
    db.commit()
    return {"message": "Member removed from workspace"}
