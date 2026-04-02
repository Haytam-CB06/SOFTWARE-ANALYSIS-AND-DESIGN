from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

from fileinput import filename
import os
import uuid
import smtplib
from email.mime.text import MIMEText
from typing import List, Optional
from uuid import UUID
from fastapi import UploadFile, File
from pathlib import Path
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import RedirectResponse
from itsdangerous import URLSafeTimedSerializer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.permissions import has_permission
from app.models.user import User
from app.models.study_session import StudySession
from app.models.goals import Goal
from app.models.workspace import Workspace, WorkspaceMember
from app.models.workspace_week_study_schedule import WorkspaceWeekStudySchedule
from app.schemas import (
    AddMemberRequest,
    InviteRequest,
    UpdateMemberRoleRequest,
    WorkspaceCreate,
    WorkspaceResponse,
)

from pydantic import BaseModel
from enum import Enum as PyEnum

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

# -----------------------------
# Join Request Status Enum
# -----------------------------

class JoinRequestStatus(str, PyEnum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

# -----------------------------
# Auth helpers (header-based)
# -----------------------------

def get_current_user_id(x_user_id: str = Header(..., alias="X-User-Id")) -> UUID:
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

def get_current_user(
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user

def _is_workspace_member(db: Session, workspace_id: int, user_id: UUID) -> bool:
    return (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user_id)
        .first()
        is not None
    )

def _get_user_workspace_role(db: Session, workspace_id: int, user_id: UUID) -> Optional[str]:
    member = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user_id)
        .first()
    )
    return member.role if member else None

def _member_out(db: Session, m: WorkspaceMember) -> dict:
    u = db.query(User).filter(User.id == m.user_id).first()
    name = None
    email = None
    if u is not None:
        name = getattr(u, "full_name", None) or getattr(u, "username", None) or u.email
        email = u.email
    return {
        "id": m.id,
        "workspace_id": m.workspace_id,
        "user_id": str(m.user_id),
        "name": name or str(m.user_id),
        "email": email or "",
        "role": m.role or "member",
        "joined_at": m.joined_at.isoformat() if getattr(m, "joined_at", None) else None,
    }

# -----------------------------
# Subworkspace helpers (NEW)
# -----------------------------

def _list_descendant_workspace_ids(db: Session, workspace_id: int) -> List[int]:
    """
    Returns ALL descendant workspace ids (children, grandchildren, etc.)
    Requires Workspace.parent_id column to exist.
    """
    out: List[int] = []
    queue: List[int] = [workspace_id]

    while queue:
        pid = queue.pop(0)
        children = db.query(Workspace).filter(Workspace.parent_id == pid).all()
        for c in children:
            if c.id not in out:
                out.append(c.id)
                queue.append(c.id)

    return out

def _ensure_admin_in_descendants(db: Session, workspace_id: int, user_id: UUID):
    """
    Ensures user is admin in every descendant workspace.
    """
    for wid in _list_descendant_workspace_ids(db, workspace_id):
        m = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == wid, WorkspaceMember.user_id == user_id)
            .first()
        )
        if m:
            m.role = "admin"
        else:
            db.add(WorkspaceMember(workspace_id=wid, user_id=user_id, role="admin"))

def _demote_admin_in_descendants(db: Session, workspace_id: int, user_id: UUID):
    """
    If user is admin in descendants because of parent, demote them to member.
    (Your rule says: parent admins must be admins in children;
     so if parent admin removed, they shouldn't stay admin in children.)
    """
    for wid in _list_descendant_workspace_ids(db, workspace_id):
        m = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == wid, WorkspaceMember.user_id == user_id)
            .first()
        )
        if m and (m.role or "") == "admin":
            m.role = "member"

def _copy_parent_admins_to_child(db: Session, parent_id: int, child_id: int):
    """
    When creating a subworkspace, copy all parent admins as admins in the child.
    """
    parent_admins = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == parent_id, WorkspaceMember.role == "admin")
        .all()
    )
    for a in parent_admins:
        existing = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == child_id, WorkspaceMember.user_id == a.user_id)
            .first()
        )
        if existing:
            existing.role = "admin"
        else:
            db.add(WorkspaceMember(workspace_id=child_id, user_id=a.user_id, role="admin"))

# -----------------------------
# Workspace shared timetable (CalendarView)
# -----------------------------

class CalendarSessionIn(BaseModel):
    id: Optional[str] = None
    subject: str
    startTime: str
    endTime: str
    day: int  # 0=Mon..6=Sun (frontend convention)
    type: Optional[str] = None
    color: Optional[str] = None
    deadline: Optional[str] = None

class CalendarSessionOut(BaseModel):
    id: str
    subject: str
    startTime: str
    endTime: str
    day: int
    type: Optional[str] = None
    color: Optional[str] = None
    deadline: Optional[str] = None

    model_config = {"extra": "allow"}

def _guard_workspace_member(db: Session, workspace_id: int, user_id: UUID) -> str:
    role = _get_user_workspace_role(db, workspace_id, user_id)
    if not role:
        raise HTTPException(status_code=403, detail="Not a workspace member")
    return role or "member"
@router.get("/verify-invite")
def verify_invite(token: str, db: Session = Depends(get_db)):
    try:
        payload = verify_invite_token(token)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired invite link")

    workspace_id = payload.get("workspace_id")
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Invalid invite payload")

    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return {"id": ws.id, "name": ws.name, "description": ws.description}
@router.get("/{workspace_id}/sessions", response_model=List[CalendarSessionOut])
def get_workspace_calendar_sessions(
    workspace_id: int,
    week_id: str = Query("default"),
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    """Return the workspace's shared study sessions for a given week."""
    try:
        current_user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    _guard_workspace_member(db, workspace_id, current_user_id)

    row = (
        db.query(WorkspaceWeekStudySchedule)
        .filter(WorkspaceWeekStudySchedule.workspace_id == workspace_id, WorkspaceWeekStudySchedule.week_id == week_id)
        .first()
    )
    stored = (row.sessions if row and isinstance(row.sessions, list) else [])

    out: List[CalendarSessionOut] = []
    for s in stored:
        if not isinstance(s, dict):
            continue
        try:
            out.append(
                CalendarSessionOut(
                    id=str(s.get("id") or uuid.uuid4()),
                    subject=str(s.get("subject") or ""),
                    startTime=str(s.get("startTime") or "08:00"),
                    endTime=str(s.get("endTime") or "09:00"),
                    day=int(s.get("day") if s.get("day") is not None else 0),
                    type=s.get("type"),
                    color=s.get("color"),
                    deadline=s.get("deadline"),
                )
            )
        except Exception:
            continue
    return out

@router.put("/{workspace_id}/sessions")
def put_workspace_calendar_sessions(
    workspace_id: int,
    payload: List[CalendarSessionIn],
    week_id: str = Query("default"),
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    """Replace the workspace's shared study sessions for a given week.

    Only workspace admins can update.
    """
    try:
        current_user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    role = _guard_workspace_member(db, workspace_id, current_user_id)
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only workspace admins can edit this timetable")

    normalized = []
    for item in payload:
        sid = (item.id or "").strip() or str(uuid.uuid4())
        normalized.append(
            {
                "id": sid,
                "subject": (item.subject or "").strip(),
                "startTime": item.startTime,
                "endTime": item.endTime,
                "day": int(item.day),
                "type": item.type,
                "color": item.color,
                "deadline": item.deadline,
            }
        )

    row = (
        db.query(WorkspaceWeekStudySchedule)
        .filter(WorkspaceWeekStudySchedule.workspace_id == workspace_id, WorkspaceWeekStudySchedule.week_id == week_id)
        .first()
    )
    if not row:
        row = WorkspaceWeekStudySchedule(workspace_id=workspace_id, week_id=week_id, sessions=normalized)
        db.add(row)
    else:
        row.sessions = normalized
    db.commit()
    return {"ok": True, "week_id": week_id, "sessions": len(normalized)}

# -----------------------------
# Invites (email token)
# -----------------------------

SECRET_KEY = os.getenv("SECRET_KEY", os.getenv("SESSION_SECRET", "dev-secret-key"))
SALT = "workspace-invite"
serializer = URLSafeTimedSerializer(SECRET_KEY)

def accept_invite(
    *,
    db: Session,
    token: str,
    user: User,
):
    payload = verify_invite_token(token)

    workspace_id = payload["workspace_id"]
    invited_email = payload["email"]

    if invited_email != "*" and user.email != invited_email:
        raise HTTPException(status_code=403, detail="Invite email mismatch")

    existing = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.id,
        )
        .first()
    )
    if existing:
        return workspace_id

    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user.id,
        role="member",
    )
    db.add(member)
    db.commit()

    return workspace_id

def generate_invite_token(workspace_id: int, email: str, share_v: int | None = None) -> str:
    payload = {"workspace_id": workspace_id, "email": email}
    if email == "*" and share_v is not None:
        payload["share_v"] = share_v
    return serializer.dumps(payload, salt=SALT)

def verify_invite_token(token: str, max_age: int = 1440) -> dict:
    return serializer.loads(token, salt=SALT, max_age=max_age)

def _smtp_config() -> tuple[str, int, str, str]:
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    sender = os.getenv("SMTP_EMAIL", "")
    password = "samkwlrniyfshrhu"
    return host, port, sender, password

def send_workspace_invite_email(email: str, workspace_id: int):
    host, port, sender, password = _smtp_config()
    if not sender or not password:
        raise HTTPException(
            status_code=500,
            detail="SMTP is not configured. Set SMTP_EMAIL and SMTP_PASSWORD in backend .env",
        )

    token = generate_invite_token(workspace_id, email)
    #invite_url = f"{os.getenv('FRONTEND_ORIGIN', 'https://uplan-frontend-bccb.onrender.com')}/workspaces/{workspace_id}/join?token={token}"
    invite_url = f"https://software-analysis-and-design.onrender.com/workspaces/{workspace_id}/join?token={token}"

    body = (
        "Hello,\n\n"
        "You've been invited to U Plan.\n"
        "Click the link below to join the workspace:\n\n"
        f"{invite_url}\n\n"
        "This link will expire in 24 hours.\n"
        "Thanks,\n"
        "U Plan\n"
    )

    msg = MIMEText(body)
    msg["From"] = sender
    msg["To"] = email
    msg["Subject"] = "Invitation to join a workspace on U Plan"

    with smtplib.SMTP(host, port) as server:
        server.starttls()
        server.login(sender, password)
        server.send_message(msg)

frontend = os.getenv("FRONTEND_ORIGIN", "https://uplan-frontend-bccb.onrender.com")

@router.get("/join")
def join_workspace(
    token: str,
    db: Session = Depends(get_db),
    x_user_id: UUID | None = Header(default=None, alias="X-User-Id"),
):
    # Validate token early (fail fast)
    try:
        verify_invite_token(token)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired invite link")

    # Not logged in → redirect to auth WITH token
    if not x_user_id:
        return RedirectResponse(
            url=f"{frontend}/?page=auth&invite_token={token}",
            status_code=302,
        )

    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")

    workspace_id = accept_invite(
        db=db,
        token=token,
        user=user,
    )

    return RedirectResponse(
        url=f"{frontend}/?page=workspace",
        status_code=302,
    )

@router.post("/accept-invite")
def accept_invite_after_auth(
    token: str,
    db: Session = Depends(get_db),
    x_user_id: UUID = Header(..., alias="X-User-Id"),
):
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401)

    workspace_id = accept_invite(
        db=db,
        token=token,
        user=user,
    )

    return {"workspace_id": workspace_id}

# -----------------------------
# Workspaces CRUD
# -----------------------------

@router.post("", response_model=WorkspaceResponse)
def create_workspace(
    payload: WorkspaceCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # owner_id is required by schema
    workspace = Workspace(**payload.model_dump(), owner_id=current_user_id)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    # creator is admin
    db.add(WorkspaceMember(workspace_id=workspace.id, user_id=current_user_id, role="admin"))
    db.commit()

    return workspace

@router.get("", response_model=List[WorkspaceResponse])
def list_my_workspaces(
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    workspaces = (
        db.query(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .filter(WorkspaceMember.user_id == current_user_id)
        .order_by(Workspace.created_at.desc())
        .all()
    )
    return workspaces

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: int, db: Session = Depends(get_db)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace

# -----------------------------
# Subworkspaces API (NEW)
# -----------------------------

class SubWorkspaceCreateIn(BaseModel):
    name: str
    description: Optional[str] = None

@router.get("/{workspace_id}/subworkspaces", response_model=List[WorkspaceResponse])
def list_subworkspaces(
    workspace_id: int,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Must be a member of the parent to view children
    if not _is_workspace_member(db, workspace_id, current_user_id):
        raise HTTPException(status_code=403, detail="Not a workspace member")

    children = db.query(Workspace).filter(Workspace.parent_id == workspace_id).order_by(Workspace.created_at.desc()).all()
    return children

@router.post("/{workspace_id}/subworkspaces", response_model=WorkspaceResponse)
def create_subworkspace(
    workspace_id: int,
    payload: SubWorkspaceCreateIn,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    parent = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Workspace not found")

    role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not role:
        raise HTTPException(status_code=403, detail="Not a workspace member")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    child = Workspace(
        name=payload.name,
        description=payload.description,
        owner_id=parent.owner_id,
        parent_id=parent.id,  # requires Workspace.parent_id column
    )
    db.add(child)
    db.flush()  # get child.id without committing

    # Copy parent admins into the new child as admins
    _copy_parent_admins_to_child(db, parent_id=parent.id, child_id=child.id)

    db.commit()
    db.refresh(child)
    return child

@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: int,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not role:
        raise HTTPException(status_code=403, detail="Not a workspace member")
    if not has_permission(role, "delete_workspace"):
        raise HTTPException(status_code=403, detail="Permission denied")

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
     # 🔹 Check if it has subworkspaces
    subworkspaces = db.query(Workspace).filter(
        Workspace.parent_id == workspace_id
    ).first()

    if subworkspaces:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a workspace that still has subworkspaces. Delete the subworkspaces first."
        )
    db.delete(workspace)
    db.commit()
    return {"message": "Workspace deleted successfully"}

# -----------------------------
# Members API (frontend uses these)
# -----------------------------

@router.get("/{workspace_id}/members")
def list_members(
    workspace_id: int,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Must be a member to view members
    if not _is_workspace_member(db, workspace_id, current_user_id):
        raise HTTPException(status_code=403, detail="Not a workspace member")

    members = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id)
        .order_by(WorkspaceMember.joined_at.asc())
        .all()
    )
    return [_member_out(db, m) for m in members]

@router.post("/{workspace_id}/members")
def add_member(
    workspace_id: int,
    request: AddMemberRequest,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    requester_role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not requester_role:
        raise HTTPException(status_code=403, detail="Not a workspace member")
    if not has_permission(requester_role, "add_member"):
        raise HTTPException(status_code=403, detail="Permission denied")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        send_workspace_invite_email(request.email, workspace_id)
        return {"message": "the user is not registered. An invite email has been sent, link expires after 24 hours."}

    existing = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User already a member")

    member = WorkspaceMember(workspace_id=workspace_id, user_id=user.id, role=request.role)
    db.add(member)

    # if you add as admin, enforce admin in ALL descendants
    if (request.role or "") == "admin":
        _ensure_admin_in_descendants(db, workspace_id, user.id)

    db.commit()
    db.refresh(member)
    return {"message": "Member added successfully", "member": _member_out(db, member)}

@router.delete("/{workspace_id}/members/{member_id}")
def remove_member(
    workspace_id: int,
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requester_role = _get_user_workspace_role(db, workspace_id, current_user.id)
    if not requester_role:
        raise HTTPException(status_code=403, detail="Not a workspace member")
    if not has_permission(requester_role, "remove_member"):
        raise HTTPException(status_code=403, detail="Permission denied")

    member = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == member_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Safety: keep at least 1 admin
    if member.role == "admin":
        admin_count = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.role == "admin")
            .count()
        )
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the last admin")

        # if removing an admin from parent, remove admin role from descendants too
        _demote_admin_in_descendants(db, workspace_id, member.user_id)

    db.delete(member)
    db.commit()
    return {"message": "Member removed successfully"}

@router.patch("/{workspace_id}/members/{member_id}")
def update_member_role(
    workspace_id: int,
    member_id: UUID,
    payload: UpdateMemberRoleRequest,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    requester_role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not requester_role:
        raise HTTPException(status_code=403, detail="Not a workspace member")
    if not has_permission(requester_role, "edit_member_role"):
        raise HTTPException(status_code=403, detail="Permission denied")

    member = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == member_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    new_role = payload.new_role
    if new_role not in {"admin", "member"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    old_role = member.role or "member"

    # Safety: keep at least 1 admin
    if old_role == "admin" and new_role != "admin":
        admin_count = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.role == "admin")
            .count()
        )
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the last admin")

    member.role = new_role

    # enforce propagation rule
    if new_role == "admin":
        _ensure_admin_in_descendants(db, workspace_id, member.user_id)
    elif old_role == "admin" and new_role != "admin":
        _demote_admin_in_descendants(db, workspace_id, member.user_id)

    db.commit()
    db.refresh(member)
    return {"message": "Role updated", "member": _member_out(db, member)}

@router.post("/{workspace_id}/share-link")
def generate_workspace_share_link(
    workspace_id: int,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not role:
        raise HTTPException(status_code=403, detail="Not a workspace member")

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # No email → open invite
    workspace.share_link_enabled = True
    token = generate_invite_token(workspace_id, email="*", share_v=workspace.share_link_version)

    return {
        "link_id": token,
        "access_type": "open",
    }

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

@router.patch("/{workspace_id}/members/{member_id}/role")
def change_workspace_member_role(
    workspace_id: int,
    member_id: UUID,
    payload: dict,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    new_role = payload.get("role")

    if new_role not in {"admin", "member", "viewer"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Caller must be an admin
    caller_role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not caller_role or not has_permission(caller_role, "edit_member_role"):
        raise HTTPException(status_code=403, detail="Permission denied")

    member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == member_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    old_role = member.role or "member"

    # Enforce max 2 admins
    if new_role == "admin" and member.role != "admin":
        admin_count = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.role == "admin",
            )
            .count()
        )

        if admin_count >= 2:
            raise HTTPException(
                status_code=400,
                detail="Maximum 2 admins allowed per workspace"
            )

    member.role = new_role

    # enforce propagation rule here too
    if new_role == "admin":
        _ensure_admin_in_descendants(db, workspace_id, member.user_id)
    elif old_role == "admin" and new_role != "admin":
        _demote_admin_in_descendants(db, workspace_id, member.user_id)

    db.commit()

    return {
        "message": "Member role updated",
        "member_id": str(member_id),
        "role": new_role,
    }

# -----------------------------
# Join Requests
# -----------------------------

class JoinRequestIn(BaseModel):
    message: Optional[str] = None

class JoinRequestOut(BaseModel):
    id: int
    workspace_id: int
    user_id: str
    name: str
    email: str
    message: Optional[str]
    status: str
    requested_at: str

    model_config = {"from_attributes": True}


def _join_request_out(db: Session, req) -> dict:
    u = db.query(User).filter(User.id == req.user_id).first()
    name = email = ""
    if u:
        name = getattr(u, "full_name", None) or getattr(u, "username", None) or u.email
        email = u.email or ""
    return {
        "id": req.id,
        "workspace_id": req.workspace_id,
        "user_id": str(req.user_id),
        "name": name or str(req.user_id),
        "email": email,
        "message": req.message,
        "status": req.status,
        "requested_at": req.requested_at.isoformat() if req.requested_at else "",
    }


@router.post("/{workspace_id}/join-requests", status_code=201)
def create_join_request(
    workspace_id: int,
    payload: JoinRequestIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Authenticated user requests to join a workspace.
    Fails if already a member or already has a pending request.
    """
    from app.models.workspace import WorkspaceJoinRequest  # local import to keep it tidy

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Already a member?
    if _is_workspace_member(db, workspace_id, current_user.id):
        raise HTTPException(status_code=400, detail="You are already a member of this workspace")

    # Already has a pending request?
    existing = (
        db.query(WorkspaceJoinRequest)
        .filter(
            WorkspaceJoinRequest.workspace_id == workspace_id,
            WorkspaceJoinRequest.user_id == current_user.id,
            WorkspaceJoinRequest.status == JoinRequestStatus.pending,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending request for this workspace")

    req = WorkspaceJoinRequest(
        workspace_id=workspace_id,
        user_id=current_user.id,
        message=(payload.message or "").strip() or None,
        status=JoinRequestStatus.pending,
        requested_at=datetime.now(timezone.utc),
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return _join_request_out(db, req)


@router.get("/{workspace_id}/join-requests")
def list_join_requests(
    workspace_id: int,
    status: Optional[str] = Query(default="pending"),
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Admin-only: list join requests for a workspace.
    Defaults to only pending requests.
    """
    from app.models.workspace import WorkspaceJoinRequest

    role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not role:
        raise HTTPException(status_code=403, detail="Not a workspace member")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view join requests")

    q = db.query(WorkspaceJoinRequest).filter(WorkspaceJoinRequest.workspace_id == workspace_id)
    if status:
        q = q.filter(WorkspaceJoinRequest.status == status)
    requests = q.order_by(WorkspaceJoinRequest.requested_at.asc()).all()
    return [_join_request_out(db, r) for r in requests]


@router.post("/{workspace_id}/join-requests/{request_id}/approve")
def approve_join_request(
    workspace_id: int,
    request_id: int,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Admin-only: approve a pending join request → creates WorkspaceMember.
    """
    from app.models.workspace import WorkspaceJoinRequest

    role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not role or role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can approve join requests")

    req = (
        db.query(WorkspaceJoinRequest)
        .filter(
            WorkspaceJoinRequest.id == request_id,
            WorkspaceJoinRequest.workspace_id == workspace_id,
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Join request not found")
    if req.status != JoinRequestStatus.pending:
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    # Check they're not already a member (edge case)
    existing_member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == req.user_id,
        )
        .first()
    )
    if not existing_member:
        db.add(WorkspaceMember(workspace_id=workspace_id, user_id=req.user_id, role="member"))

    req.status = JoinRequestStatus.approved
    db.commit()
    return {"ok": True, "message": "Join request approved", "request": _join_request_out(db, req)}


@router.delete("/{workspace_id}/join-requests/{request_id}")
def reject_join_request(
    workspace_id: int,
    request_id: int,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Admin-only: reject (delete) a pending join request.
    """
    from app.models.workspace import WorkspaceJoinRequest

    role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not role or role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can reject join requests")

    req = (
        db.query(WorkspaceJoinRequest)
        .filter(
            WorkspaceJoinRequest.id == request_id,
            WorkspaceJoinRequest.workspace_id == workspace_id,
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Join request not found")
    if req.status != JoinRequestStatus.pending:
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    req.status = JoinRequestStatus.rejected
    db.commit()
    return {"ok": True, "message": "Join request rejected"}


# -----------------------------
# Workspace progress (team dashboard)
# -----------------------------

@router.get("/{workspace_id}/progress", response_model=dict)
def workspace_progress(
    workspace_id: int,
    period_start: Optional[str] = Query(default=None),
    period_end: Optional[str] = Query(default=None),
    tz_offset_minutes: Optional[int] = Query(default=None),  
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    """Return per-member weekly progress for the workspace.

    Used by the Workspace -> Team Collaboration view.
    """
    try:
        current_user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    _guard_workspace_member(db, workspace_id, current_user_id)

    def parse_d(v: Optional[str]):
        if v is None:
            return None
        vv = (v or "").strip()
        if not vv:
            return None
        return date.fromisoformat(vv)

    ps = parse_d(period_start)
    pe = parse_d(period_end)
    if ps is None or pe is None:
        td = datetime.now(timezone.utc).date()
        ps = td - timedelta(days=td.weekday())
        pe = ps + timedelta(days=6)

    try:
        off = timedelta(minutes=int(tz_offset_minutes)) if tz_offset_minutes is not None else timedelta(0)
    except Exception:
        off = timedelta(0)

    # utc = local + offset (JS offset minutes)
    start_dt = datetime.combine(ps, time.min).replace(tzinfo=timezone.utc) + off
    end_dt = datetime.combine(pe + timedelta(days=1), time.min).replace(tzinfo=timezone.utc) + off

    members = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id)
        .all()
    )

    now = datetime.now(timezone.utc)

    out = []
    for m in members:
        uid = m.user_id

        sess = (
            db.query(StudySession)
            .filter(
                StudySession.user_id == uid,
                StudySession.start_at >= start_dt,
                StudySession.start_at < end_dt,
            )
            .all()
        )
        total_sessions = len(sess)
        completed_sessions = sum(1 for s in sess if (s.status or "").lower() == "completed")
        upcoming_sessions = sum(1 for s in sess if (s.status or "").lower() == "planned" and s.start_at >= now)

        completed_hours = 0.0
        for s in sess:
            if (s.status or "").lower() != "completed":
                continue
            seconds = (
                float(s.actual_duration_seconds)
                if getattr(s, "actual_duration_seconds", None) is not None
                else float((s.end_at - s.start_at).total_seconds())
            )
            if seconds < 0:
                continue
            completed_hours += seconds / 3600.0

        streak_days = 0
        try:
            today = (datetime.now(timezone.utc) - off).date()
            streak_cursor = today
            streak_start_dt = datetime.combine(today - timedelta(days=60), time.min, tzinfo=timezone.utc)
            streak_rows = (
                db.query(StudySession)
                .filter(
                    StudySession.user_id == uid,
                    StudySession.status == "completed",
                    StudySession.start_at >= streak_start_dt,
                    StudySession.start_at < datetime.now(timezone.utc),
                )
                .all()
            )
            completed_by_day = {}
            for s in streak_rows:
                seconds = (
                    float(s.actual_duration_seconds)
                    if getattr(s, "actual_duration_seconds", None) is not None
                    else float((s.end_at - s.start_at).total_seconds())
                )
                if seconds < 0:
                    continue
                day_key = ((s.start_at if s.start_at.tzinfo else s.start_at.replace(tzinfo=timezone.utc)).astimezone(timezone.utc) - off).date().isoformat()
                completed_by_day[day_key] = completed_by_day.get(day_key, 0.0) + (seconds / 3600.0)

            while True:
                k = streak_cursor.isoformat()
                if completed_by_day.get(k, 0.0) >= 0.25:
                    streak_days += 1
                    streak_cursor = streak_cursor - timedelta(days=1)
                    continue
                break
        except Exception:
            streak_days = 0

        goal_target_hours = 0.0
        try:
            goal_rows = (
                db.query(Goal)
                .filter(Goal.user_id == uid, Goal.period_start == ps, Goal.period_end == pe)
                .all()
            )
            for g in goal_rows:
                th = float(g.target_hours) if getattr(g, "target_hours", None) is not None else 0.0
                goal_target_hours += th
        except Exception:
            goal_target_hours = 0.0

        goal_percent = int(round((completed_hours / goal_target_hours) * 100)) if goal_target_hours > 0 else 0
        if goal_percent < 0:
            goal_percent = 0
        if goal_percent > 100:
            goal_percent = 100

        completion_rate = int(round((completed_sessions / total_sessions) * 100)) if total_sessions > 0 else 0

        u = db.query(User).filter(User.id == str(uid)).first()
        name = None
        email = None
        if u is not None:
            name = getattr(u, "full_name", None) or getattr(u, "username", None) or u.email
            email = getattr(u, "email", None)

        out.append({
            "memberId": str(uid),
            "memberName": name or str(uid),
            "email": email or "",
            "totalSessions": total_sessions,
            "completedSessions": completed_sessions,
            "upcomingSessions": upcoming_sessions,
            "completionRate": completion_rate,
            "completedHours": round(completed_hours, 2),
            "streakDays": int(streak_days),
            "goalTargetHours": round(goal_target_hours, 2),
            "goalPercent": int(goal_percent),
            "period_start": ps.isoformat(),
            "period_end": pe.isoformat(),
        })

    out.sort(key=lambda r: (-float(r.get("completedHours", 0) or 0), str(r.get("memberName") or "")))

    return {
        "period_start": ps.isoformat(),
        "period_end": pe.isoformat(),
        "members": out,
    }


@router.post("/{workspace_id}/share-link/disable")
def disable_workspace_share_link(
    workspace_id: int,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not role:
        raise HTTPException(status_code=403, detail="Not a workspace member")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can disable share links")

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    workspace.share_link_enabled = False
    workspace.share_link_version = (workspace.share_link_version or 1) + 1  # revoke old tokens
    db.commit()
    db.refresh(workspace)

    return {"ok": True}
MAX_IMAGE_SIZE = 4 * 1024 * 1024  # 4MB


ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
from app.services.cloudinary import *
import cloudinary.uploader

@router.post("/{workspace_id}/image")
async def upload_workspace_image(
    workspace_id: int,
    image: UploadFile = File(...),
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not role:
        raise HTTPException(status_code=403, detail="Not a workspace member")

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    contents = await image.read()

    result = cloudinary.uploader.upload(
        contents,
        folder="uplan/workspaces",
        public_id=f"workspace_{workspace_id}",
        overwrite=True,
        resource_type="image",
    )

    workspace.image_url = result["secure_url"]
    db.commit()
    db.refresh(workspace)

    return {
        "message": "Workspace image uploaded successfully",
        "image_url": workspace.image_url,
    }

@router.delete("/{workspace_id}/image")
def delete_workspace_image(
    workspace_id: int,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    role = _get_user_workspace_role(db, workspace_id, current_user_id)
    if not role:
        raise HTTPException(status_code=403, detail="Not a workspace member")

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    cloudinary.uploader.destroy(f"uplan/workspaces/workspace_{workspace_id}", resource_type="image")

    workspace.image_url = None
    db.commit()

    return {"message": "Workspace image removed successfully"}

class WorkspaceUpdate(BaseModel):
    name: str
    description: Optional[str] = None


@router.put("/{workspace_id}")
def update_workspace(
    workspace_id: int,
    payload: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
):
    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == workspace_id)
        .first()
    )

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Optional: only owner can edit
    

    workspace.name = payload.name.strip()
    workspace.description = payload.description.strip() if payload.description else None

    db.commit()
    db.refresh(workspace)

    return {
        "id": workspace.id,
        "name": workspace.name,
        "description": workspace.description,
        "owner_id": str(workspace.owner_id),
    }