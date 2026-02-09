#workspace_access.py
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.models.user import User
from ..db import get_db

from ..models.workspace import Workspace, WorkspaceMember  # adjust import path
def get_current_user_id(
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid User")
    return user
def require_workspace_member(workspace_id: int, db: Session, user_id: UUID) -> UUID:
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a workspace member"
        )

    return membership  # ✅ THIS WAS MISSING

def require_workspace_admin(membership: WorkspaceMember):
    # assuming role is "admin" or "member"
    if getattr(membership, "role", None) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
def get_membership(db: Session, workspace_id: int, user_id: UUID) -> WorkspaceMember:
    m = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not m:
        raise HTTPException(status_code=403, detail="Not a workspace member")
    return m

def is_admin_membership(m: WorkspaceMember) -> bool:
    return getattr(m, "role", None) == "admin"

def ensure_admin_in_descendants(db: Session, parent_workspace_id: int, user_id: UUID):
    # BFS/DFS through children
    queue = [parent_workspace_id]
    while queue:
        pid = queue.pop()
        children = db.query(Workspace).filter(Workspace.parent_id == pid).all()
        for child in children:
            queue.append(child.id)

            m = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == child.id,
                WorkspaceMember.user_id == user_id
            ).first()

            if m:
                m.role = "admin"
            else:
                db.add(WorkspaceMember(
                    workspace_id=child.id,
                    user_id=user_id,
                    role="admin"
                ))

def remove_admin_from_descendants(db: Session, parent_workspace_id: int, user_id: UUID):
    queue = [parent_workspace_id]
    while queue:
        pid = queue.pop()
        children = db.query(Workspace).filter(Workspace.parent_id == pid).all()
        for child in children:
            queue.append(child.id)
            m = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == child.id,
                WorkspaceMember.user_id == user_id
            ).first()
            if m and m.role == "admin":
                m.role = "member"
                