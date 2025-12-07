from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.workspace import Workspace, WorkspaceDeleteLog
from schemas import WorkspaceResponse
from models.permissions import has_permission
from app.db import get_db
from typing import Optional

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("", response_model=WorkspaceResponse)
def create_workspace(name: str, description: Optional[str], owner_id: int, db: Session = Depends(get_db)):
    """Create new workspace"""
    workspace = Workspace(
        name=name, description=description, owner_id=owner_id)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
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
def delete_workspace(workspace_id: int, requester_id: int, requester_role: str, reason: Optional[str] = None, db: Session = Depends(get_db)):
    """Delete workspace and log the deletion"""
    if not has_permission(requester_role, "delete_workspace"):
        raise HTTPException(
            status_code=403, detail="Permission denied: Cannot delete workspace")

    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    delete_log = WorkspaceDeleteLog(
        workspace_id=workspace_id,
        workspace_name=workspace.name,
        deleted_by=requester_id,
        reason=reason
    )
    db.add(delete_log)
    db.delete(workspace)
    db.commit()
    return {"message": "Workspace deleted successfully"}
