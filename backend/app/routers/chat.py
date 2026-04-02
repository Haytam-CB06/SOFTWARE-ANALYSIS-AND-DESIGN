# backend/app/routers/chat.py
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, Header
from pydantic import BaseModel,Field
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.chat import ChatRoom, ChatMember, ChatMessage
from app.models.user import User  # existing user model
from app.chat_ws import manager
from app.models.workspace import Workspace, WorkspaceMember  # Workspace models
from app.models.message import Message, MessageRead
from app.models.permissions import has_permission
from app.schemas import SendMessageRequest
router = APIRouter(prefix="/chat", tags=["chat"])

# ---------- Schemas ----------
class MessageReadStatusOut(BaseModel):
    user_id: UUID
    username: str | None = None
    read_at: str



class WorkspaceMessageOut(BaseModel):
    id: int
    workspace_id: int
    user_id: UUID | None
    username: str | None = None
    content: str
    created_at: str
    updated_at: str | None = None
    edited: bool = False
    read_by: List[MessageReadStatusOut]

class RoomCreate(BaseModel):
    name: str


class MemberAdd(BaseModel):
    user_id: UUID
    role: str = "member"



def _get_workspace_member(db: Session, workspace_id: int, user_id: UUID):
    return (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
        .first()
    )
class WorkspaceMessageUpdateIn(BaseModel):
    content: str
# ---------- Helpers ----------


def ensure_member(db: Session, room_id: UUID, user_id: UUID):
    exists = db.query(ChatMember).filter_by(
        room_id=room_id, user_id=user_id).first()
    if not exists:
        raise HTTPException(
            status_code=403, detail="User is not a member of this room")

# ---------- REST ----------


@router.post("/rooms", response_model=dict)
def create_room(payload: RoomCreate, db: Session = Depends(get_db)):
    if db.query(ChatRoom).filter_by(name=payload.name).first():
        raise HTTPException(status_code=409, detail="Room name already exists")
    room = ChatRoom(name=payload.name)
    db.add(room)
    db.flush()
    return {"id": room.id, "name": room.name}


@router.delete("/rooms/{room_id}", response_model=dict)
def delete_room(room_id: UUID, db: Session = Depends(get_db)):
    room = db.get(ChatRoom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room)
    return {"ok": True}


@router.post("/rooms/{room_id}/members", response_model=dict)
def add_member(room_id: UUID, payload: MemberAdd, db: Session = Depends(get_db)):
    room = db.get(ChatRoom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if not db.get(User, payload.user_id):
        raise HTTPException(status_code=404, detail="User not found")
    exists = db.query(ChatMember).filter_by(
        room_id=room_id, user_id=payload.user_id).first()
    if exists:
        raise HTTPException(status_code=409, detail="Already a member")
    db.add(ChatMember(room_id=room_id, user_id=payload.user_id, role=payload.role))
    return {"ok": True}


@router.delete("/rooms/{room_id}/members/{user_id}", response_model=dict)
def remove_member(room_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    m = db.query(ChatMember).filter_by(
        room_id=room_id, user_id=user_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not a member")
    db.delete(m)
    return {"ok": True}


@router.get("/rooms/{room_id}/messages", response_model=List[WorkspaceMessageOut])
def list_messages(room_id: UUID, limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    msgs = (db.query(ChatMessage)
              .filter_by(room_id=room_id)
              .order_by(ChatMessage.created_at.desc())
              .limit(limit)
              .all())
    return [MessageOut(
        id=m.id, room_id=m.room_id, sender_id=m.sender_id,
        content=m.content, created_at=m.created_at.isoformat()
    ) for m in reversed(msgs)]

# ---------- WebSocket ----------


@router.websocket("/ws/{room_id}")
async def chat_ws(websocket: WebSocket, room_id: UUID, db: Session = Depends(get_db)):
    # Optional: you can require a query param ?user_id=... for simple auth
    user_id_str = websocket.query_params.get("user_id")
    user_id = UUID(user_id_str) if user_id_str else None

    # (Light) access control: member check if user_id provided
    if user_id:
        m = db.query(ChatMember).filter_by(
            room_id=room_id, user_id=user_id).first()
        if not m:
            await websocket.close(code=4403)
            return

    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            content = (data.get("content") or "").strip()
            if not content:
                continue
            msg = ChatMessage(
                room_id=room_id, sender_id=user_id, content=content)
            db.add(msg)
            db.flush()
            await manager.broadcast(room_id, {
                "id": str(msg.id),
                "room_id": str(room_id),
                "sender_id": str(user_id) if user_id else None,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
            })
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)

# ---------- WORKSPACE CHAT ----------


@router.post("/workspaces/{workspace_id}/messages", response_model=dict)
def send_workspace_message(workspace_id: int, payload: SendMessageRequest, db: Session = Depends(get_db)):
    """Send message to workspace"""
    workspace = db.query(Workspace).filter_by(id=workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    msg = Message(
        workspace_id=workspace_id,
        user_id=payload.user_id,
        username=payload.username,
        content=payload.content
    )
    db.add(msg)
    db.commit()
    return {"id": msg.id, "ok": True}


@router.get("/workspaces/{workspace_id}/messages", response_model=List[WorkspaceMessageOut])
def get_workspace_messages(
    workspace_id: int,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    msgs = (
        db.query(Message)
        .filter(Message.workspace_id == workspace_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
        .all()
    )

    message_ids = [m.id for m in msgs]
    reads_by_message = {}

    if message_ids:
        reads = (
            db.query(MessageRead, User.username)
            .outerjoin(User, User.id == MessageRead.user_id)
            .filter(MessageRead.message_id.in_(message_ids))
            .all()
        )

        for read, username in reads:
            reads_by_message.setdefault(read.message_id, []).append({
                "user_id": str(read.user_id),
                "username": username,
                "read_at": read.read_at.isoformat(),
            })

    return [
        {
            "id": m.id,
            "workspace_id": m.workspace_id,
            "user_id": str(m.user_id) if m.user_id else None,
            "username": m.username,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
            "updated_at": m.updated_at.isoformat() if m.updated_at else None,
            "edited": bool(m.edited),
            "read_by": reads_by_message.get(m.id, []),
        }
        for m in reversed(msgs)
    ]
@router.patch("/workspaces/messages/{message_id}", response_model=WorkspaceMessageOut)
def edit_workspace_message(
    message_id: int,
    payload: WorkspaceMessageUpdateIn,
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    """Edit a workspace message.

    Rules:
    - message owner can edit their own message
    - workspace admins can edit any message in that workspace
    """
    msg = db.query(Message).filter_by(id=message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    member = _get_workspace_member(db, msg.workspace_id, x_user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a workspace member")

    is_admin = (member.role or "").lower() == "admin"
    is_owner = msg.user_id == x_user_id

    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="You can only edit your own messages")

    new_content = (payload.content or "").strip()
    if not new_content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    msg.content = new_content
    msg.edited = True
    db.commit()
    db.refresh(msg)

    return WorkspaceMessageOut(
        id=msg.id,
        workspace_id=msg.workspace_id,
        user_id=msg.user_id,
        username=msg.username,
        content=msg.content,
        created_at=msg.created_at.isoformat(),
        updated_at=msg.updated_at.isoformat() if msg.updated_at else None,
        edited=bool(msg.edited),
        read_by=[]
        
    )


from fastapi import Header

@router.delete("/workspaces/messages/{message_id}", response_model=dict)
def delete_workspace_message(
    message_id: int,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    """Delete workspace message"""

    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == msg.workspace_id,
            WorkspaceMember.user_id == x_user_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this workspace")

    if not has_permission(member.role, "delete_message"):
        raise HTTPException(status_code=403, detail="Permission denied")

    db.delete(msg)
    db.commit()
    return {"ok": True}

class MarkMessagesReadIn(BaseModel):
    message_ids: List[int]


class MarkMessagesReadOut(BaseModel):
    ok: bool
    marked_count: int

@router.post("/workspaces/messages/mark-read", response_model=MarkMessagesReadOut)
def mark_workspace_messages_as_read(
    payload: MarkMessagesReadIn,
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):


    if not payload.message_ids:
        return {"ok": True, "marked_count": 0}

    messages = (
        db.query(Message)
        .filter(Message.id.in_(payload.message_ids))
        .all()
    )

    if not messages:
        return {"ok": True, "marked_count": 0}

    workspace_ids = list({m.workspace_id for m in messages})

    memberships = (
        db.query(WorkspaceMember.workspace_id)
        .filter(
            WorkspaceMember.workspace_id.in_(workspace_ids),
            WorkspaceMember.user_id == x_user_id,
        )
        .all()
    )

    allowed_workspace_ids = {row[0] for row in memberships}

    allowed_messages = [m for m in messages if m.workspace_id in allowed_workspace_ids]

    if not allowed_messages:
        raise HTTPException(status_code=403, detail="Not allowed to mark these messages as read")

    allowed_message_ids = [m.id for m in allowed_messages]

    existing_reads = (
        db.query(MessageRead.message_id)
        .filter(
            MessageRead.user_id == x_user_id,
            MessageRead.message_id.in_(allowed_message_ids),
        )
        .all()
    )

    already_read_ids = {row[0] for row in existing_reads}

    new_reads = [
        MessageRead(message_id=message_id, user_id=x_user_id)
        for message_id in allowed_message_ids
        if message_id not in already_read_ids
    ]
    

    if new_reads:
        db.add_all(new_reads)
        db.commit()

    return {
        "ok": True,
        "marked_count": len(new_reads),
    }