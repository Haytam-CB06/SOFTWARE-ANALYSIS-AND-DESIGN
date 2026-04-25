# routers/board.py
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from datetime import datetime
from typing import Mapping

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


def _deadline_locked(task: BoardTask) -> bool:
    if not getattr(task, "due_date", None):
        return False
    if getattr(task, "status", None) == "done":
        return False
    return task.due_date >= datetime.utcnow()

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

def task_to_out(task: BoardTask, db: Session, users_by_id: Mapping[UUID, User] | None = None) -> TaskOut:
    assignee_out = None

    if task.assignee_id:
        assignee_user = users_by_id.get(task.assignee_id) if users_by_id is not None else None
        if assignee_user is None and users_by_id is None:
            assignee_user = db.query(User).filter(User.id == task.assignee_id).first()
        if assignee_user:
            assignee_out = {
                "id": str(assignee_user.id),
                "name": getattr(assignee_user, "full_name", None) or assignee_user.email,
                "email": assignee_user.email,
            }

    return TaskOut(
        id=task.id,
        title=task.title,
        description=task.description or "",
        status=task.status,
        priority=task.priority,
        assignee=assignee_out,
        createdAt=task.created_at,
        updatedAt=task.updated_at,
        createdBy=task.created_by,
        dueDate=task.due_date,
        comments=[],
        attachments=getattr(task, "attachments_count", 0),
    )

def tasks_to_out(tasks: list[BoardTask], db: Session) -> list[TaskOut]:
    assignee_ids = {task.assignee_id for task in tasks if task.assignee_id}
    users_by_id = {}
    if assignee_ids:
        users_by_id = {
            user.id: user
            for user in db.query(User).filter(User.id.in_(assignee_ids)).all()
        }
    return [task_to_out(task, db, users_by_id) for task in tasks]

@router.delete("/tasks/archived")
def delete_all_archived(
    workspace_id: int,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id_id),
):
    require_workspace_member(workspace_id, db, user_id)

    db.query(BoardTask).filter(
        BoardTask.workspace_id == workspace_id,
        BoardTask.archived == True
    ).delete(synchronize_session=False)

    db.commit()

    return {"message": "All archived tasks deleted"}
@router.get("/tasks", response_model=list[TaskOut])
def list_tasks(
    workspace_id: int,
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    require_workspace_member(workspace_id, db, user_id)

    tasks = (
        db.query(BoardTask)
        .filter(
            BoardTask.workspace_id == workspace_id,
            BoardTask.archived == False
        )        
        .order_by(BoardTask.updated_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return tasks_to_out(tasks, db)

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
        due_date=payload.dueDate,
        labels=payload.labels or [],
        attachments_count=0,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_to_out(task, db)

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
    if payload.dueDate is not None:
        t.due_date = payload.dueDate

    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(t)
    return task_to_out(t,db)

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
    return task_to_out(t,db)

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
    if _deadline_locked(task):
        raise HTTPException(
            status_code=409,
            detail="Deadline tasks can only be deleted after the due date passes",
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
@router.patch("/tasks/{task_id}/archive", response_model=TaskOut)
def archive_task(
    workspace_id: int,
    task_id: UUID,
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
    if _deadline_locked(task):
        raise HTTPException(
            status_code=409,
            detail="Deadline tasks can only be archived after the due date passes",
        )

    task.archived = True
    task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(task)

    return task_to_out(task,db)


@router.get("/tasks/archived", response_model=list[TaskOut])
def get_archived_tasks(
    workspace_id: int,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    require_workspace_member(workspace_id, db, user_id)

    tasks = db.query(BoardTask).filter(
        BoardTask.workspace_id == workspace_id,
        BoardTask.archived == True
    ).order_by(BoardTask.updated_at.desc()).all()

    return tasks_to_out(tasks, db)
@router.patch("/tasks/{task_id}/restore", response_model=TaskOut)
def restore_task(
    workspace_id: int,
    task_id: UUID,
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

    task.archived = False
    task.status = "todo"
    task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(task)

    return task_to_out(task,db)

@router.post("/tasks/archive-all")
def archive_all_tasks(
    workspace_id: int,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    require_workspace_member(workspace_id, db, user_id)

    db.query(BoardTask).filter(
        BoardTask.workspace_id == workspace_id,
        BoardTask.archived == False
    ).update(
        {
            BoardTask.archived: True,
            BoardTask.updated_at: datetime.utcnow(),
        },
        synchronize_session=False,
    )

    db.commit()

    return {"message": "All tasks archived"}
