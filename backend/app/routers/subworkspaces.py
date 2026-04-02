# app/routers/subworkspaces.py (example)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.db import get_db
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas import WorkspaceResponse, SubWorkspaceCreate
from app.routers.workspace_access import get_current_user_id, get_membership, is_admin_membership, ensure_admin_in_descendants

router = APIRouter(prefix="/workspaces", tags=["subworkspaces"])

@router.post("/{workspace_id}/subworkspaces", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_subworkspace(
    workspace_id: int,
    payload: SubWorkspaceCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_id),  # your existing dep returns User object
):
    user_id: UUID = user.id

    parent = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Workspace not found")

    membership = get_membership(db, workspace_id, user_id)
    if not is_admin_membership(membership):
        raise HTTPException(status_code=403, detail="Admin role required")

    child = Workspace(
        name=payload.name,
        description=payload.description,
        owner_id=parent.owner_id,
        parent_id=parent.id,
    )
    db.add(child)
    db.flush()  # child.id now exists

    # copy all parent admins into this new subworkspace as admins
    parent_admins = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == parent.id,
        WorkspaceMember.role == "admin"
    ).all()

    for admin in parent_admins:
        db.add(WorkspaceMember(
            workspace_id=child.id,
            user_id=admin.user_id,
            role="admin"
        ))

    db.commit()
    db.refresh(child)
    return child
@router.get("/{workspace_id}/subworkspaces", response_model=list[WorkspaceResponse])
def list_subworkspaces(
    workspace_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_id),
):
    user_id: UUID = user.id
    # must be a member of the parent to see children
    get_membership(db, workspace_id, user_id)

    children = db.query(Workspace).filter(Workspace.parent_id == workspace_id).all()
    return children