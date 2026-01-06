# backend/app/chat_ws.py
from typing import Dict, Set
from fastapi import WebSocket
from uuid import UUID

class ConnectionManager:
    def __init__(self):
        # room_id -> set of websockets
        self.active: Dict[UUID, Set[WebSocket]] = {}

    async def connect(self, room_id: UUID, websocket: WebSocket):
        await websocket.accept()
        self.active.setdefault(room_id, set()).add(websocket)

    def disconnect(self, room_id: UUID, websocket: WebSocket):
        room = self.active.get(room_id)
        if room and websocket in room:
            room.remove(websocket)
        if room and not room:
            self.active.pop(room_id, None)

    async def broadcast(self, room_id: UUID, message: dict):
        for ws in list(self.active.get(room_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                # drop dead sockets
                self.disconnect(room_id, ws)

manager = ConnectionManager()
