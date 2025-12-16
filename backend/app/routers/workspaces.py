from fastapi import APIRouter,Header, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.workspace import Workspace, WorkspaceDeleteLog
from app.schemas import WorkspaceResponse,WorkspaceCreate,AddMemberRequest
from app.models.permissions import has_permission
from app.db import get_db
from typing import Optional
from uuid import UUID
from app.models.user import User
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


from app.models.workspace import WorkspaceMember

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