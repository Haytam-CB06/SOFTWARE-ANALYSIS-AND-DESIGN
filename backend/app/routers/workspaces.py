import http
from fastapi import APIRouter,Header, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.models.workspace import Workspace, WorkspaceDeleteLog
from app.schemas import WorkspaceResponse,WorkspaceCreate,AddMemberRequest,InviteRequest,SignUpIn
from app.models.permissions import has_permission
from app.db import get_db
from typing import Optional
from uuid import UUID
from app.models.user import User
from app.models.workspace import WorkspaceMember


router = APIRouter(prefix="/workspaces", tags=["workspaces"])


def get_current_user(
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.id == x_user_id).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")

    return user

def get_current_user_id(x_user_id: str = Header(...)):
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

from itsdangerous import URLSafeTimedSerializer
import os

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
SALT = "workspace-invite"


serializer = URLSafeTimedSerializer(SECRET_KEY)


def generate_invite_token(workspace_id: int, email: str) -> str:
    return serializer.dumps(
        {"workspace_id": workspace_id, "email": email},
        salt=SALT
    )


def verify_invite_token(token: str, max_age: int = 600) -> dict:
    return serializer.loads(
        token,
        salt=SALT,
        max_age=max_age
    )
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = "haytamcharafi@gmail.com"
SMTP_PASSWORD = "tooa oqau oqvj tegk"


from email.mime.text import MIMEText
import smtplib


def send_workspace_invite_email(email: str, workspace_id: int):
    token = generate_invite_token(workspace_id, email)
    invite_url = f"http://localhost:8000/workspaces/join?token={token}"

    body = f"""
    Hello,

    You've been invited to U Plan.
 Click the link below to join the workspace:

 {invite_url}

    This link will expire in 10 minutes.
    Thanks,
    U Plan
    """

    msg = MIMEText(body)
    msg["From"] = SMTP_EMAIL
    msg["To"] = email
    msg["Subject"] = "Invitation to join a workspace on U Plan"

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)

from typing import Optional
from fastapi import Query

@router.get("/signup")
def signup_landing(invite_token: Optional[str] = Query(None)):
    """
    Temporary signup landing endpoint.
    Used only until frontend exists.
    """
    return {
        "message": "Signup page placeholder (frontend not implemented yet)",
        "invite_token": invite_token,
        "next_step": "POST /auth/signup with email, password, invite_token"
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

    # 🔹 USER NOT REGISTERED → redirect to signup page
    if not user:
        signup_url = f"http://localhost:8000/auth/signup?invite_token={token}"
        return RedirectResponse(url=signup_url, status_code=302)

    # Prevent duplicate membership
    existing = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user.id
    ).first()

    if existing:
        return {"message": "User already a workspace member"}

    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user.id,
        role=existing.role
    )

    db.add(member)
    db.commit()

    # 🔹 User registered → redirect to workspace/dashboard
    return RedirectResponse(
        url=f"http://localhost:8000/workspaces?invite_token={token}",
        status_code=302
    )


@router.post("/invite")
def invite_user_to_workspace(
    payload: InviteRequest,
    db: Session = Depends(get_db)
):
    send_workspace_invite_email(
        email=payload.email,
        workspace_id=payload.workspace_id
    )

    return {"message": "Invitation email sent"}

@router.post("", response_model=WorkspaceResponse)
def create_workspace(
    payload: WorkspaceCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    workspace = Workspace(**payload.model_dump())
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    # creator becomes OWNER automatically
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user_id,
        role="admin"
    )
    db.add(member)
    db.commit()

    return workspace


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: int, db: Session = Depends(get_db)):
    """Get workspace by ID"""
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: int,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    role = get_user_workspace_role(db, workspace_id, current_user_id)
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


def get_user_workspace_role(
    db: Session,
    workspace_id: int,
    user_id: UUID
) -> str | None:
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()

    return member.role if member else None



def is_workspace_member(db: Session, workspace_id: int, user_id: UUID):
    return db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()

@router.delete("/{workspace_id}/members")
def remove_member(
    workspace_id: int,
    email: str,  # query param ?email=
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Get requester membership
    requester = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if not requester:
        raise HTTPException(status_code=403, detail="Not a workspace member")

    # 2. Permission check
    if not has_permission(requester.role, "remove_member"):
        raise HTTPException(status_code=403, detail="Permission denied")

    # 3. Find target user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 4. Find membership
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user.id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="User is not a workspace member")

    # 5. Safety: prevent owner removal
    if member.role == "admin":
        raise HTTPException(status_code=400, detail="Owner cannot be removed")

    db.delete(member)
    db.commit()

    return {
        "message": "Member removed successfully",
        "user_email": email
    }




@router.post("/{workspace_id}/members")
def add_member(
    workspace_id: int,
    request: AddMemberRequest,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    requester_role = get_user_workspace_role(db, workspace_id, current_user_id)
    if not requester_role:
        raise HTTPException(status_code=403, detail="Not a workspace member")

    if not has_permission(requester_role, "add_member"):
        raise HTTPException(status_code=403, detail="Permission denied")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if is_workspace_member(db, workspace_id, user.id):
        raise HTTPException(status_code=400, detail="User already a member")

    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user.id,
        role=request.role
    )

    db.add(member)
    db.commit()

    return {"message": "Member added successfully"}