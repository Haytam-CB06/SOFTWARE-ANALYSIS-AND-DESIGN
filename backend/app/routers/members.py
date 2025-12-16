from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.workspace import WorkspaceMember, MemberDeleteLog, RoleEnum, Workspace
from app.schemas import WorkspaceMemberResponse, AddMemberRequest, UpdateMemberRoleRequest
from app.models.permissions import has_permission
from app.db import get_db
from typing import Optional

router = APIRouter(prefix="/workspaces", tags=["members"])


@router.post("/{workspace_id}/members", response_model=WorkspaceMemberResponse)
def add_member(workspace_id: int, request: AddMemberRequest, db: Session = Depends(get_db)):
    """Add member to workspace by username or email"""
    if not has_permission(request.requester_role, "add_member"):
        raise HTTPException(
            status_code=403, detail="Permission denied: Cannot add members")

    # Check if workspace exists
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if member already exists
    existing_member = db.query(WorkspaceMember).filter(
        (WorkspaceMember.workspace_id == workspace_id) &
        (WorkspaceMember.user_id == request.user_id)
    ).first()

    if existing_member:
        raise HTTPException(
            status_code=400, detail="User already a member of this workspace")

    # Create new member
    new_member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=request.user_id,
        username=request.username,
        email=request.email,
        role=RoleEnum.member
    )

    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member


@router.delete("/{workspace_id}/members/{member_id}")
def delete_member(workspace_id: int, member_id: int, requester_id: int, requester_role: str, reason: Optional[str] = None, db: Session = Depends(get_db)):
    """Delete member from workspace and log deletion"""
    if not has_permission(requester_role, "remove_member"):
        raise HTTPException(
            status_code=403, detail="Permission denied: Cannot remove members")

    member = db.query(WorkspaceMember).filter(
        (WorkspaceMember.id == member_id) &
        (WorkspaceMember.workspace_id == workspace_id)
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Log deletion
    delete_log = MemberDeleteLog(
        workspace_id=workspace_id,
        member_id=member_id,
        username=member.username,
        email=member.email,
        deleted_by=requester_id,
        reason=reason
    )
    db.add(delete_log)
    db.delete(member)
    db.commit()
    return {"message": "Member removed from workspace"}


@router.put("/{workspace_id}/members/{member_id}/role", response_model=WorkspaceMemberResponse)
def update_member_role(workspace_id: int, member_id: int, request: UpdateMemberRoleRequest, requester_role: str, db: Session = Depends(get_db)):
    """Update member role"""
    if not has_permission(requester_role, "edit_member_role"):
        raise HTTPException(
            status_code=403, detail="Permission denied: Cannot edit member roles")

    if request.new_role not in ["admin", "moderator", "member"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    member = db.query(WorkspaceMember).filter(
        (WorkspaceMember.id == member_id) &
        (WorkspaceMember.workspace_id == workspace_id)
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.role = RoleEnum[request.new_role]
    db.commit()
    db.refresh(member)
    return member


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberResponse])
def get_workspace_members(workspace_id: int, db: Session = Depends(get_db)):
    """Get all members of workspace"""
    members = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id).all()
    return members
