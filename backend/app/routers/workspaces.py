from __future__ import annotations

import os
import smtplib
from email.mime.text import MIMEText
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import RedirectResponse
from itsdangerous import URLSafeTimedSerializer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.permissions import has_permission
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas import (
    AddMemberRequest,
    InviteRequest,
    UpdateMemberRoleRequest,
    WorkspaceCreate,
    WorkspaceResponse,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

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
# Invites (email token)
# -----------------------------

SECRET_KEY = os.getenv("SECRET_KEY", os.getenv("SESSION_SECRET", "dev-secret-key"))
SALT = "workspace-invite"
serializer = URLSafeTimedSerializer(SECRET_KEY)

def generate_invite_token(workspace_id: int, email: str) -> str:
    return serializer.dumps({"workspace_id": workspace_id, "email": email}, salt=SALT)

def verify_invite_token(token: str, max_age: int = 600) -> dict:
    return serializer.loads(token, salt=SALT, max_age=max_age)

def _smtp_config() -> tuple[str, int, str, str]:
    host = "smtp.gmail.com"
    port =  587
    email = "haytamcharafi@gmail.com"
    password = "qqrd jtxi nhdf axhc"
    return host, port, email, password

def send_workspace_invite_email(email: str, workspace_id: int):
    host, port, sender, password = _smtp_config()
    if not sender or not password:
        raise HTTPException(
            status_code=500,
            detail="SMTP is not configured. Set SMTP_EMAIL and SMTP_PASSWORD in backend .env",
        )

    token = generate_invite_token(workspace_id, email)
    invite_url = f"{os.getenv('BACKEND_PUBLIC_URL', 'http://localhost:8000')}/workspaces/join?token={token}"

    body = (
        "Hello,\n\n"
        "You've been invited to U Plan.\n"
        "Click the link below to join the workspace:\n\n"
        f"{invite_url}\n\n"
        "This link will expire in 10 minutes.\n"
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

@router.get("/signup")
def signup_landing(invite_token: Optional[str] = Query(None)):
    return {
        "message": "Signup page placeholder (frontend not implemented here)",
        "invite_token": invite_token,
        "next_step": "POST /auth/signup with email, password, invite_token",
    }

@router.get("/join")
def join_workspace(token: str, db: Session = Depends(get_db)):
    try:
        payload = verify_invite_token(token)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired invite link")

    workspace_id: int = payload["workspace_id"]
    email: str = payload["email"]

    user = db.query(User).filter(User.email == email).first()

    # User not registered → redirect to signup
    if not user:
        signup_url = f"{os.getenv('BACKEND_PUBLIC_URL', 'http://localhost:8000')}/auth/signup?invite_token={token}"
        return RedirectResponse(url=signup_url, status_code=302)

    existing = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user.id)
        .first()
    )
    if existing:
        return {"message": "User already a workspace member"}

    member = WorkspaceMember(workspace_id=workspace_id, user_id=user.id, role="member")
    db.add(member)
    db.commit()

    # Redirect to frontend (or backend placeholder)
    frontend = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    return RedirectResponse(url=f"{frontend}/workspace/{workspace_id}", status_code=302)

@router.post("/invite")
def invite_user_to_workspace(payload: InviteRequest, db: Session = Depends(get_db)):
    # NOTE: this does not enforce permissions yet because frontend may be using it for testing.
    send_workspace_invite_email(email=payload.email, workspace_id=payload.workspace_id)
    return {"message": "Invitation email sent"}

# -----------------------------
# Workspaces CRUD
# -----------------------------
# -----------------------------
# LINKED
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
# -----------------------------
# LINKED
# -----------------------------
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
# -----------------------------
# LINKED
# -----------------------------
@router.get("/{workspace_id}", response_model=WorkspaceResponse)            #done
def get_workspace(workspace_id: int, db: Session = Depends(get_db)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace
# -----------------------------
# LINKED
# -----------------------------
@router.delete("/{workspace_id}")                   #done
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

    db.delete(workspace)
    db.commit()
    return {"message": "Workspace deleted successfully"}

# -----------------------------
# Members API (frontend uses these)
# -----------------------------
# -----------------------------
# LINKED
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
# -----------------------------
# LINKED
# -----------------------------
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
        raise HTTPException(status_code=404, detail="User not found")

    existing = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User already a member")

    member = WorkspaceMember(workspace_id=workspace_id, user_id=user.id, role=request.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return {"message": "Member added successfully", "member": _member_out(db, member)}
# -----------------------------
# LINKED
# -----------------------------

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

    db.delete(member)
    db.commit()
    return {"message": "Member removed successfully"}
# -----------------------------
# LINKED
# -----------------------------

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

    # Safety: keep at least 1 admin
    if member.role == "admin" and new_role != "admin":
        admin_count = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.role == "admin")
            .count()
        )
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the last admin")

    member.role = new_role
    db.commit()
    db.refresh(member)
    return {"message": "Role updated", "member": _member_out(db, member)}

# -----------------------------
# LINKED
# -----------------------------
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
    token = generate_invite_token(workspace_id, email="*")

    return {
        "link_id": token,
        "access_type": "open",
    }
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
# -----------------------------
# LINKED
# -----------------------------
@router.patch("/{workspace_id}/members/{member_id}/role")               
def change_workspace_member_role(workspace_id: int,
                                 member_id: UUID,
                                 payload: dict,
                                 current_user_id: UUID = Depends(get_current_user_id),
                                  db: Session = Depends(get_db),):
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
    db.commit()

    return {
        "message": "Member role updated",
        "member_id": str(member_id),
        "role": new_role,
    }
   

