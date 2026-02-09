import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db import get_db  # adjust
from app.models.notebook import Note
from app.schemas import NoteCreate, NoteUpdate, NoteOut

router = APIRouter(prefix="/notes", tags=["notes"])

from typing import List

def tags_to_str(tags: List[str]) -> str:
    clean = []
    for t in tags:
        tt = (t or "").strip().lower()
        if tt and tt not in clean:
            clean.append(tt)
    return ",".join(clean)

def str_to_tags(s: str) -> List[str]:
    if not s:
        return []
    return [x.strip() for x in s.split(",") if x.strip()]

def get_current_user_id(x_user_id: str = Header(default="")) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")
    return x_user_id


def to_out(n: Note) -> NoteOut:
    return NoteOut(
        id=n.id,
        user_id=n.user_id,
        title=n.title,
        content=n.content,
        entity_type=n.entity_type,
        entity_id=n.entity_id,
        tags=str_to_tags(n.tags),
        pinned=n.pinned,
        archived=n.archived,
        created_at=n.created_at,
        updated_at=n.updated_at,
    )


@router.post("", response_model=NoteOut)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    n = Note(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=(payload.title or "").strip(),
        content=payload.content or "",
        entity_type=(payload.entity_type or None),
        entity_id=(payload.entity_id or None),
        tags=tags_to_str(payload.tags),
        pinned=bool(payload.pinned),
        archived=False,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return to_out(n)


@router.get("", response_model=List[NoteOut])
def list_notes(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),

    q: Optional[str] = Query(default=None, description="Search title/content"),
    tag: Optional[str] = Query(default=None, description="Filter by one tag"),
    entity_type: Optional[str] = Query(default=None),
    entity_id: Optional[str] = Query(default=None),

    pinned: Optional[bool] = Query(default=None),
    archived: Optional[bool] = Query(default=False),

    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    query = db.query(Note).filter(Note.user_id == user_id)

    # Default: don't show archived unless explicitly requested
    if archived is not None:
        query = query.filter(Note.archived == archived)

    if pinned is not None:
        query = query.filter(Note.pinned == pinned)

    if entity_type:
        query = query.filter(Note.entity_type == entity_type)
    if entity_id:
        query = query.filter(Note.entity_id == entity_id)

    if tag:
        t = tag.strip().lower()
        # crude but works: matches "tag" at boundaries in comma string
        query = query.filter(
            (Note.tags == t)
            | (Note.tags.like(f"{t},%"))
            | (Note.tags.like(f"%,{t},%"))
            | (Note.tags.like(f"%,{t}"))
        )

    if q:
        like = f"%{q.strip()}%"
        query = query.filter((Note.title.ilike(like)) | (Note.content.ilike(like)))

    rows = (
        query.order_by(Note.pinned.desc(), Note.updated_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [to_out(r) for r in rows]


@router.get("/{note_id}", response_model=NoteOut)
def get_note(
    note_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    n = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    return to_out(n)


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: str,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    n = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")

    if payload.title is not None:
        n.title = payload.title.strip()
    if payload.content is not None:
        n.content = payload.content

    if payload.entity_type is not None:
        n.entity_type = payload.entity_type or None
    if payload.entity_id is not None:
        n.entity_id = payload.entity_id or None

    if payload.tags is not None:
        n.tags = tags_to_str(payload.tags)

    if payload.pinned is not None:
        n.pinned = bool(payload.pinned)
    if payload.archived is not None:
        n.archived = bool(payload.archived)

    db.commit()
    db.refresh(n)
    return to_out(n)


@router.delete("/{note_id}")
def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    n = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(n)
    db.commit()
    return {"message": "Deleted"}
