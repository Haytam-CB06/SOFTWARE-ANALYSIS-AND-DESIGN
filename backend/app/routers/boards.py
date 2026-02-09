# routers/board.py
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from ..db import get_db
from ..models.board import BoardTask, BoardComment
from ..models.workspace import WorkspaceMember
from ..models.user import User
from app.schemas import (
    TaskOut, TaskCreate, TaskUpdate, TaskMove,
    CommentCreate, CommentOut
)
from app.routers.workspace_access import require_workspace_member, require_workspace_admin

router = APIRouter(prefix="/workspaces/{workspace_id}/board", tags=["board"])

def get_current_user_id(x_user_id: UUID | None = Header(default=None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")
    return x_user_id

def get_current_user_id_id(
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db)
) -> UUID:
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid User")
    return user.id

def task_to_out(task: BoardTask) -> TaskOut:
    return TaskOut(
        id=task.id,
        title=task.title,
        description=task.description or "",
        status=task.status,
        priority=task.priority,
        assignee=None,
        createdAt=task.created_at,
        updatedAt=task.updated_at,
        createdBy=task.created_by,
        comments=[],  # <-- don't access task.comments
        attachments=getattr(task, "attachments_count", 0),
    )

@router.get("/tasks", response_model=list[TaskOut])
def list_tasks(
    workspace_id: int,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    require_workspace_member(workspace_id, db, user_id)

    tasks = (
        db.query(BoardTask)
        .filter(BoardTask.workspace_id == workspace_id)
        .order_by(BoardTask.updated_at.desc())
        .all()
    )
    return [task_to_out(t) for t in tasks]

@router.post("/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    workspace_id: int,
    payload: TaskCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    require_workspace_member(workspace_id, db, user_id)

    task = BoardTask(
        workspace_id=workspace_id,
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        created_by=user_id,
        assignee_id=payload.assigneeId,
        labels=payload.labels or [],
        attachments_count=0,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_to_out(task)

@router.patch("/tasks/{task_id}", response_model=TaskOut)
def update_task(
    workspace_id: int,
    task_id: UUID,  # <-- if your model uses int, change this back to int
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    require_workspace_member(workspace_id, db, user_id)

    t = (
        db.query(BoardTask)
        .filter(BoardTask.id == task_id, BoardTask.workspace_id == workspace_id)
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.title is not None:
        t.title = payload.title
    if payload.description is not None:
        t.description = payload.description
    if payload.priority is not None:
        t.priority = payload.priority
    # only update assignee if field provided (depends on your schema)
    if payload.assigneeId is not None:
        t.assignee_id = payload.assigneeId

    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(t)
    return task_to_out(t)

@router.patch("/tasks/{task_id}/move", response_model=TaskOut)
def move_task(
    workspace_id: int,
    task_id: UUID,  # <-- if your model uses int, change this back to int
    payload: TaskMove,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    require_workspace_member(workspace_id, db, user_id)

    t = (
        db.query(BoardTask)
        .filter(BoardTask.id == task_id, BoardTask.workspace_id == workspace_id)
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    t.status = payload.status
    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(t)
    return task_to_out(t)

@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(
    workspace_id: int,
    task_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id_id),
):
    membership = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a workspace member")

    task = (
        db.query(BoardTask)
        .filter(BoardTask.workspace_id == workspace_id, BoardTask.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    is_admin = (membership.role == "admin")
    is_creator = (task.created_by == user_id)

    if not (is_admin or is_creator):
        raise HTTPException(
            status_code=403,
            detail="Only admin or task creator can delete this task",
        )

    db.delete(task)
    db.commit()
    return



@router.post(
    "/tasks/{task_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
)
def add_comment(
    workspace_id: int,
    task_id: UUID,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    require_workspace_member(workspace_id, db, user_id)

    task = db.query(BoardTask).filter(
        BoardTask.id == task_id,
        BoardTask.workspace_id == workspace_id
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    user = db.query(User).filter(User.id == user_id).first()
    user_name = getattr(user, "full_name", None) or getattr(user, "email", None) or "User"

    comment = BoardComment(
        task_id=task.id,
        user_id=user_id,
        user_name=user_name,
        text=payload.text,
        created_at=datetime.utcnow(),
    )

    db.add(comment)
    task.updated_at = datetime.utcnow()

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid comment data")

    db.refresh(comment)

    return CommentOut(
        id=comment.id,
        userId=comment.user_id,
        userName=comment.user_name,
        text=comment.text,
        createdAt=comment.created_at,
    )