# backend/app/schemas.py
from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field,ConfigDict, EmailStr, constr, field_validator, ValidationInfo
from uuid import UUID
# ---------- AUTH ----------


class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[constr(
    strip_whitespace=True, min_length=1, max_length=100)] = None
    password: constr(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def strong_pwd(cls, v: str) -> str:
        # Require at least one letter and one digit
        if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
            raise ValueError(
                "password must contain at least one letter and one digit")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: constr(min_length=8, max_length=128)

# ---------- SUBJECTS / COURSES ----------


class SubjectCreate(BaseModel):
    title: constr(strip_whitespace=True, min_length=2, max_length=120)
    code: constr(strip_whitespace=True, min_length=2, max_length=30)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    target_grade: Optional[constr(strip_whitespace=True, max_length=10)] = None
    exam_date: Optional[datetime] = None
    credit_weight: Optional[int] = Field(default=None, ge=0, le=30)

# ---------- PREFERENCES ----------


class PreferencesUpdate(BaseModel):
    default_session_minutes: int = Field(30, ge=15, le=240)
    daily_limit_minutes: int = Field(240, ge=30, le=720)
    weekly_cap_per_subject_minutes: int = Field(600, ge=60, le=3000)
    preferred_start_hour: int = Field(8, ge=0, le=23)
    preferred_end_hour: int = Field(22, ge=0, le=23)

    @field_validator("preferred_end_hour")
    @classmethod
    def end_after_start(cls, v: int, info: ValidationInfo):
        # In Pydantic v2, use info.data to access other fields
        start = info.data.get("preferred_start_hour", 8)
        if v <= start:
            raise ValueError(
                "preferred_end_hour must be greater than preferred_start_hour")
        return v

# ---------- STUDY SESSIONS ----------


class SessionCreate(BaseModel):
    subject_id: constr(strip_whitespace=True, min_length=1)  # uuid as string
    start_time: datetime
    end_time: datetime
    notes: Optional[constr(strip_whitespace=True, max_length=500)] = None

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v: datetime, info: ValidationInfo):
        st = info.data.get("start_time")
        if st and v <= st:
            raise ValueError("end_time must be greater than start_time")
        return v

# ---------- RESPONSES (example) ----------


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    timezone: str

 # ------------reset password schema ----------


class ResetRequest(BaseModel):
    email: EmailStr


class VerifyCode(BaseModel):
    email: EmailStr
    code: str


class ResetPassword(BaseModel):
    email: EmailStr
    code: str
    new_password: str

# ---------- WORKSPACE ----------
class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] 
    
class WorkspaceMemberResponse(BaseModel):
    id: int
    workspace_id: int
    user_id: UUID
    # NOTE: the DB model in this project does not consistently store username/email
    # on workspace membership rows across environments. Keep these OPTIONAL with
    # defaults so FastAPI can serialize from ORM objects safely.
    username: Optional[str] = None
    email: Optional[str] = None
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class UpdateMemberRoleRequest(BaseModel):
    new_role: str


class MemberPermissionResponse(BaseModel):
    id: int
    workspace_member_id: int
    permission_name: str
    is_granted: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdatePermissionRequest(BaseModel):
    permission_name: str
    is_granted: bool







class AddMemberRequest(BaseModel):
    email: EmailStr
    role: str


class SubWorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    parent_id: Optional[int] = None
    created_at: Optional[datetime]
    image_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class SendMessageRequest(BaseModel):
    user_id: UUID
    username: str
    content: str

class InviteRequest(BaseModel):
    workspace_id: int
    email: EmailStr

class SignUpIn(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    invite_token: Optional[str] = None

# Define TaskStatus & TaskPriority first
TaskStatus = Literal["todo", "in-progress", "review", "done"]
TaskPriority = Literal["low", "medium", "high", "urgent"]

# Now define schemas
class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: TaskStatus = "todo"
    priority: TaskPriority = "medium"
    assigneeId: Optional[UUID] = None
    labels: Optional[List[str]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    assigneeId: Optional[UUID] = None

class TaskMove(BaseModel):
    status: TaskStatus

class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)

class CommentOut(BaseModel):
    id: UUID
    userId: Optional[UUID]
    userName: str
    text: str
    createdAt: datetime

class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    assignee: Optional[dict] = None
    createdBy: Optional[UUID] = None
    createdAt: datetime
    updatedAt: datetime
    comments: List[CommentOut] = Field(default_factory=list)
    attachments: int = 0

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class NoteCreate(BaseModel):
    title: str = Field(default="", max_length=200)
    content: str = Field(default="")

    entity_type: Optional[str] = None
    entity_id: Optional[str] = None

    tags: List[str] = Field(default_factory=list)
    pinned: bool = False


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    content: Optional[str] = None

    entity_type: Optional[str] = None
    entity_id: Optional[str] = None

    tags: Optional[List[str]] = None
    pinned: Optional[bool] = None
    archived: Optional[bool] = None


class NoteOut(BaseModel):
    id: str
    user_id: str
    title: str
    content: str

    entity_type: Optional[str]
    entity_id: Optional[str]

    tags: List[str]
    pinned: bool
    archived: bool

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
