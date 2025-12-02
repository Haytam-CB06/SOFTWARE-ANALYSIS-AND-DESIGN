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
    exists = db.query(ChatMember).filter_by(room_id=room_id, user_id=user_id).first()
    if not exists:
        raise HTTPException(status_code=403, detail="User is not a member of this room")

# ---------- REST ----------
@router.post("/rooms", response_model=dict)
def create_room(payload: RoomCreate, db: Session = Depends(get_db)):
    if db.query(ChatRoom).filter_by(name=payload.name).first():
        raise HTTPException(status_code=409, detail="Room name already exists")
    room = ChatRoom(name=payload.name)
    db.add(room); db.flush()
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
    exists = db.query(ChatMember).filter_by(room_id=room_id, user_id=payload.user_id).first()
    if exists:
        raise HTTPException(status_code=409, detail="Already a member")
    db.add(ChatMember(room_id=room_id, user_id=payload.user_id, role=payload.role))
    return {"ok": True}

@router.delete("/rooms/{room_id}/members/{user_id}", response_model=dict)
def remove_member(room_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    m = db.query(ChatMember).filter_by(room_id=room_id, user_id=user_id).first()
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
        m = db.query(ChatMember).filter_by(room_id=room_id, user_id=user_id).first()
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
            msg = ChatMessage(room_id=room_id, sender_id=user_id, content=content)
            db.add(msg); db.flush()
            await manager.broadcast(room_id, {
                "id": str(msg.id),
                "room_id": str(room_id),
                "sender_id": str(user_id) if user_id else None,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
            })
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
