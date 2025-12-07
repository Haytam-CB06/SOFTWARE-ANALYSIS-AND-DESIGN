# backend/app/routers/chat.py
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.chat import ChatRoom, ChatMember, ChatMessage
from app.models.user import User  # existing user model
from app.chat_ws import manager
from app.models.workspace import Workspace, Message  # Workspace models
from models.permissions import has_permission
from schemas import SendMessageRequest
router = APIRouter(prefix="/chat", tags=["chat"])

# ---------- Schemas ----------


class RoomCreate(BaseModel):
    name: str


class MemberAdd(BaseModel):
    user_id: UUID
    role: str = "member"


class MessageOut(BaseModel):
    id: UUID
    room_id: UUID
    sender_id: UUID | None
    content: str
    created_at: str

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


@router.get("/rooms/{room_id}/messages", response_model=List[MessageOut])
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


@router.get("/workspaces/{workspace_id}/messages", response_model=List[MessageOut])
def get_workspace_messages(workspace_id: int, limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    """Get workspace messages"""
    msgs = (db.query(Message)
              .filter_by(workspace_id=workspace_id)
              .order_by(Message.created_at.desc())
              .limit(limit)
              .all())
    return [MessageOut(
        id=m.id, room_id=m.workspace_id, sender_id=m.user_id,
        content=m.content, created_at=m.created_at.isoformat()
    ) for m in reversed(msgs)]


@router.delete("/workspaces/messages/{message_id}", response_model=dict)
def delete_workspace_message(message_id: int, requester_role: str, db: Session = Depends(get_db)):
    """Delete workspace message"""
    if not has_permission(requester_role, "delete_message"):
        raise HTTPException(status_code=403, detail="Permission denied")

    msg = db.query(Message).filter_by(id=message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    db.delete(msg)
    db.commit()
    return {"ok": True}
