from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import MemberPermissionResponse, UpdatePermissionRequest
from app.models.workspace import WorkspaceMember, MemberPermission
from app.models.permissions import has_permission
from app.db import get_db

router = APIRouter(prefix="/members", tags=["permissions"])


@router.post("/{member_id}/permissions", response_model=dict)
def add_permission(
    member_id: int,
    request: UpdatePermissionRequest,
    requester_role: str,
    db: Session = Depends(get_db)
):
    """Add or update member permission"""
    if not has_permission(requester_role, "edit_permissions"):
        raise HTTPException(
            status_code=403, detail="Permission denied: Cannot edit permissions")

    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    permission = db.query(MemberPermission).filter(
        (MemberPermission.workspace_id == member_id) &
        (MemberPermission.permission_name == request.permission_name)
    ).first()

    if permission:
        permission.is_granted = request.is_granted
    else:
        permission = MemberPermission(
            workspace_member_id=member_id,
            permission_name=request.permission_name,
            is_granted=request.is_granted
        )
        db.add(permission)

    db.commit()
    db.refresh(permission)

    return {
        "id": permission.id,
        "workspace_member_id": permission.workspace_member_id,
        "permission_name": permission.permission_name,
        "is_granted": permission.is_granted,
        "created_at": permission.created_at.isoformat()
    }


@router.get("/{member_id}/permissions", response_model=list)
def get_member_permissions(member_id: int, db: Session = Depends(get_db)):
    """Get all permissions for a member"""
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    permissions = db.query(MemberPermission).filter(
        MemberPermission.workspace_member_id == member_id
    ).all()

    return [
        {
            "id": p.id,
            "workspace_member_id": p.workspace_member_id,
            "permission_name": p.permission_name,
            "is_granted": p.is_granted,
            "created_at": p.created_at.isoformat()
        }
        for p in permissions
    ]


@router.put("/{member_id}/permissions/{permission_id}", response_model=dict)
def update_permission(
    member_id: int,
    permission_id: int,
    request: UpdatePermissionRequest,
    requester_role: str,
    db: Session = Depends(get_db)
):
    """Update specific permission"""
    if not has_permission(requester_role, "edit_permissions"):
        raise HTTPException(
            status_code=403, detail="Permission denied: Cannot edit permissions")

    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    permission = db.query(MemberPermission).filter(
        (MemberPermission.id == permission_id) &
        (MemberPermission.workspace_member_id == member_id)
    ).first()

    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")

    permission.is_granted = request.is_granted
    db.commit()
    db.refresh(permission)

    return {
        "id": permission.id,
        "workspace_member_id": permission.workspace_member_id,
        "permission_name": permission.permission_name,
        "is_granted": permission.is_granted,
        "created_at": permission.created_at.isoformat()
    }


@router.delete("/{member_id}/permissions/{permission_id}", response_model=dict)
def delete_permission(
    member_id: int,
    permission_id: int,
    requester_role: str,
    db: Session = Depends(get_db)
):
    """Delete permission"""
    if not has_permission(requester_role, "edit_permissions"):
        raise HTTPException(
            status_code=403, detail="Permission denied: Cannot edit permissions")

    permission = db.query(MemberPermission).filter(
        (MemberPermission.id == permission_id) &
        (MemberPermission.workspace_member_id == member_id)
    ).first()

    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")

    db.delete(permission)
    db.commit()

    return {"message": "Permission deleted successfully"}
