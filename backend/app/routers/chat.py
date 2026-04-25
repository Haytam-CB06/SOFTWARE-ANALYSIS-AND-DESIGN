# backend/app/routers/chat.py
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, Header
from pydantic import BaseModel, Field
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


class WorkspaceConnectionManager:
    def __init__(self):
        self.active: dict[int, set[WebSocket]] = {}

    async def connect(self, workspace_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active.setdefault(workspace_id, set()).add(websocket)

    def disconnect(self, workspace_id: int, websocket: WebSocket):
        sockets = self.active.get(workspace_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self.active.pop(workspace_id, None)

    async def broadcast(self, workspace_id: int, payload: dict):
        for websocket in list(self.active.get(workspace_id, set())):
            try:
                await websocket.send_json(payload)
            except Exception:
                self.disconnect(workspace_id, websocket)


workspace_ws_manager = WorkspaceConnectionManager()

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


class RoomUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class MemberAdd(BaseModel):
    user_id: UUID
    role: str = "member"


class RoomMemberOut(BaseModel):
    user_id: UUID
    name: str
    email: str
    role: str


class RoomMessageOut(BaseModel):
    id: UUID
    room_id: UUID
    sender_id: UUID | None
    sender_name: str | None = None
    content: str
    created_at: str


class RoomOut(BaseModel):
    id: UUID
    name: str
    created_at: str
    role: str
    member_count: int
    members: List[RoomMemberOut] = Field(default_factory=list)
    last_message: RoomMessageOut | None = None


class RoomMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)



def _get_workspace_member(db: Session, workspace_id: int, user_id: UUID):
    return (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
        .first()
    )


def _require_workspace_member(db: Session, workspace_id: int, user_id: UUID) -> WorkspaceMember:
    member = _get_workspace_member(db, workspace_id, user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a workspace member")
    return member


def _workspace_message_payload(message: Message, read_by: list[dict] | None = None) -> dict:
    return {
        "id": message.id,
        "workspace_id": message.workspace_id,
        "user_id": str(message.user_id) if message.user_id else None,
        "username": message.username,
        "content": message.content,
        "created_at": message.created_at.isoformat(),
        "updated_at": message.updated_at.isoformat() if message.updated_at else None,
        "edited": bool(message.edited),
        "read_by": read_by or [],
    }


async def _broadcast_workspace_event(workspace_id: int, event: str, message: Message | None = None, **extra):
    payload = {"event": event, **extra}
    if message is not None:
        payload["message"] = _workspace_message_payload(message)
    await workspace_ws_manager.broadcast(workspace_id, payload)
class WorkspaceMessageUpdateIn(BaseModel):
    content: str
# ---------- Helpers ----------


def _get_room_member(db: Session, room_id: UUID, user_id: UUID) -> ChatMember | None:
    return db.query(ChatMember).filter_by(room_id=room_id, user_id=user_id).first()


def ensure_member(db: Session, room_id: UUID, user_id: UUID) -> ChatMember:
    exists = _get_room_member(db, room_id, user_id)
    if not exists:
        raise HTTPException(status_code=403, detail="User is not a member of this room")
    return exists


def ensure_room_admin(db: Session, room_id: UUID, user_id: UUID) -> ChatMember:
    member = ensure_member(db, room_id, user_id)
    if (member.role or "").lower() not in {"owner", "admin"}:
        raise HTTPException(status_code=403, detail="Only room admins can manage this room")
    return member


def _user_display_name(user: User | None) -> str:
    if not user:
        return "Unknown user"
    return getattr(user, "full_name", None) or getattr(user, "username", None) or user.email


def _room_message_out(message: ChatMessage, sender: User | None = None) -> RoomMessageOut:
    return RoomMessageOut(
        id=message.id,
        room_id=message.room_id,
        sender_id=message.sender_id,
        sender_name=_user_display_name(sender) if sender else None,
        content=message.content,
        created_at=message.created_at.isoformat(),
    )


def _room_members_out(db: Session, room_id: UUID) -> list[RoomMemberOut]:
    members = (
        db.query(ChatMember, User)
        .join(User, User.id == ChatMember.user_id)
        .filter(ChatMember.room_id == room_id)
        .all()
    )
    return [
        RoomMemberOut(
            user_id=user.id,
            name=_user_display_name(user),
            email=user.email,
            role=member.role,
        )
        for member, user in members
    ]


def _room_out(db: Session, room: ChatRoom, current_user_id: UUID) -> RoomOut:
    membership = ensure_member(db, room.id, current_user_id)
    members = _room_members_out(db, room.id)
    last_message_row = (
        db.query(ChatMessage, User)
        .outerjoin(User, User.id == ChatMessage.sender_id)
        .filter(ChatMessage.room_id == room.id)
        .order_by(ChatMessage.created_at.desc())
        .first()
    )
    last_message = (
        _room_message_out(last_message_row[0], last_message_row[1]) if last_message_row else None
    )
    return RoomOut(
        id=room.id,
        name=room.name,
        created_at=room.created_at.isoformat() if room.created_at else "",
        role=membership.role,
        member_count=len(members),
        members=members,
        last_message=last_message,
    )

# ---------- REST ----------


@router.get("/rooms", response_model=List[RoomOut])
def list_rooms(
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    memberships = (
        db.query(ChatMember)
        .filter(ChatMember.user_id == x_user_id)
        .order_by(ChatMember.created_at.desc())
        .all()
    )
    room_ids = [member.room_id for member in memberships]
    if not room_ids:
        return []

    rooms = (
        db.query(ChatRoom)
        .filter(ChatRoom.id.in_(room_ids))
        .order_by(ChatRoom.created_at.desc())
        .all()
    )
    return [_room_out(db, room, x_user_id) for room in rooms]


@router.post("/rooms", response_model=RoomOut)
def create_room(
    payload: RoomCreate,
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    if db.query(ChatRoom).filter_by(name=payload.name).first():
        raise HTTPException(status_code=409, detail="Room name already exists")
    room = ChatRoom(name=payload.name)
    db.add(room)
    db.flush()
    db.add(ChatMember(room_id=room.id, user_id=x_user_id, role="owner"))
    db.commit()
    db.refresh(room)
    return _room_out(db, room, x_user_id)


@router.patch("/rooms/{room_id}", response_model=RoomOut)
def update_room(
    room_id: UUID,
    payload: RoomUpdate,
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    room = db.get(ChatRoom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    ensure_room_admin(db, room_id, x_user_id)
    room.name = payload.name.strip()
    db.commit()
    db.refresh(room)
    return _room_out(db, room, x_user_id)


@router.delete("/rooms/{room_id}", response_model=dict)
def delete_room(
    room_id: UUID,
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    room = db.get(ChatRoom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    ensure_room_admin(db, room_id, x_user_id)
    db.delete(room)
    db.commit()
    return {"ok": True}


@router.post("/rooms/{room_id}/members", response_model=dict)
def add_member(
    room_id: UUID,
    payload: MemberAdd,
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    room = db.get(ChatRoom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    ensure_room_admin(db, room_id, x_user_id)
    if not db.get(User, payload.user_id):
        raise HTTPException(status_code=404, detail="User not found")
    exists = db.query(ChatMember).filter_by(
        room_id=room_id, user_id=payload.user_id).first()
    if exists:
        raise HTTPException(status_code=409, detail="Already a member")
    db.add(ChatMember(room_id=room_id, user_id=payload.user_id, role=payload.role))
    db.commit()
    return {"ok": True}


@router.get("/rooms/{room_id}/members", response_model=List[RoomMemberOut])
def list_room_members(
    room_id: UUID,
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    ensure_member(db, room_id, x_user_id)
    return _room_members_out(db, room_id)


@router.delete("/rooms/{room_id}/members/{user_id}", response_model=dict)
def remove_member(
    room_id: UUID,
    user_id: UUID,
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    ensure_room_admin(db, room_id, x_user_id)
    m = db.query(ChatMember).filter_by(
        room_id=room_id, user_id=user_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not a member")
    db.delete(m)
    db.commit()
    return {"ok": True}


@router.get("/rooms/{room_id}/messages", response_model=List[RoomMessageOut])
def list_messages(
    room_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    ensure_member(db, room_id, x_user_id)
    msgs = (db.query(ChatMessage)
              .filter_by(room_id=room_id)
              .order_by(ChatMessage.created_at.desc())
              .limit(limit)
              .all())
    sender_ids = [message.sender_id for message in msgs if message.sender_id]
    users_by_id = {
        user.id: user for user in db.query(User).filter(User.id.in_(sender_ids)).all()
    } if sender_ids else {}
    return [_room_message_out(m, users_by_id.get(m.sender_id)) for m in reversed(msgs)]


@router.post("/rooms/{room_id}/messages", response_model=RoomMessageOut)
def create_room_message(
    room_id: UUID,
    payload: RoomMessageCreate,
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    ensure_member(db, room_id, x_user_id)
    user = db.get(User, x_user_id)
    msg = ChatMessage(room_id=room_id, sender_id=x_user_id, content=payload.content.strip())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _room_message_out(msg, user)

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
async def send_workspace_message(
    workspace_id: int,
    payload: SendMessageRequest,
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    """Send message to workspace"""
    workspace = db.query(Workspace).filter_by(id=workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if payload.user_id != x_user_id:
        raise HTTPException(status_code=401, detail="Message user does not match authenticated user")
    _require_workspace_member(db, workspace_id, x_user_id)

    content = (payload.content or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    msg = Message(
        workspace_id=workspace_id,
        user_id=x_user_id,
        username=(payload.username or "").strip() or None,
        content=content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    await _broadcast_workspace_event(workspace_id, "message.created", msg)
    return {"id": msg.id, "ok": True}


@router.websocket("/ws/workspaces/{workspace_id}")
async def workspace_chat_ws(
    websocket: WebSocket,
    workspace_id: int,
    user_id: UUID = Query(...),
    username: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    try:
        _require_workspace_member(db, workspace_id, user_id)
    except HTTPException:
        await websocket.close(code=4403)
        return

    await workspace_ws_manager.connect(workspace_id, websocket)
    await websocket.send_json({"event": "connected", "workspace_id": workspace_id})

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event") or "message.send"

            if event == "ping":
                await websocket.send_json({"event": "pong"})
                continue

            if event != "message.send":
                continue

            content = (data.get("content") or "").strip()
            if not content:
                await websocket.send_json({"event": "error", "detail": "Message content cannot be empty"})
                continue

            msg = Message(
                workspace_id=workspace_id,
                user_id=user_id,
                username=(username or data.get("username") or "").strip() or None,
                content=content,
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)

            await _broadcast_workspace_event(workspace_id, "message.created", msg)
    except WebSocketDisconnect:
        workspace_ws_manager.disconnect(workspace_id, websocket)
    except Exception as exc:
        workspace_ws_manager.disconnect(workspace_id, websocket)
        try:
            await websocket.close(code=1011, reason=str(exc)[:120])
        except Exception:
            pass


@router.get("/workspaces/{workspace_id}/messages", response_model=List[WorkspaceMessageOut])
def get_workspace_messages(
    workspace_id: int,
    limit: int = Query(50, ge=1, le=100),
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    _require_workspace_member(db, workspace_id, x_user_id)

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
            db.query(MessageRead, User.username, User.full_name, User.email)
            .outerjoin(User, User.id == MessageRead.user_id)
            .filter(MessageRead.message_id.in_(message_ids))
            .all()
        )

        for read, username, full_name, email in reads:
            reads_by_message.setdefault(read.message_id, []).append({
                "user_id": str(read.user_id),
                "username": full_name or username or email,
                "read_at": read.read_at.isoformat(),
            })

    return [_workspace_message_payload(m, reads_by_message.get(m.id, [])) for m in reversed(msgs)]
@router.patch("/workspaces/messages/{message_id}", response_model=WorkspaceMessageOut)
async def edit_workspace_message(
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
    await _broadcast_workspace_event(msg.workspace_id, "message.updated", msg)

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
async def delete_workspace_message(
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

    workspace_id = msg.workspace_id
    db.delete(msg)
    db.commit()
    await _broadcast_workspace_event(workspace_id, "message.deleted", None, message_id=message_id)
    return {"ok": True}

class MarkMessagesReadIn(BaseModel):
    message_ids: List[int]


class MarkMessagesReadOut(BaseModel):
    ok: bool
    marked_count: int

@router.post("/workspaces/messages/mark-read", response_model=MarkMessagesReadOut)
async def mark_workspace_messages_as_read(
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
        for workspace_id in allowed_workspace_ids:
            await workspace_ws_manager.broadcast(
                int(workspace_id),
                {
                    "event": "messages.read",
                    "message_ids": allowed_message_ids,
                    "reader": {
                        "user_id": str(x_user_id),
                        "read_at": new_reads[0].read_at.isoformat() if new_reads and new_reads[0].read_at else None,
                    },
                },
            )

    return {
        "ok": True,
        "marked_count": len(new_reads),
    }
