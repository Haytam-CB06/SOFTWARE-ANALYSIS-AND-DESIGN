# backend/app/schemas.py
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, EmailStr, constr, field_validator, ValidationInfo

# ---------- AUTH ----------
class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[constr(strip_whitespace=True, min_length=1, max_length=100)] = None
    password: constr(min_length=8, max_length=128)
    
    @field_validator("password")
    @classmethod
    def strong_pwd(cls, v: str) -> str:
        # Require at least one letter and one digit
        if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
            raise ValueError("password must contain at least one letter and one digit")
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
            raise ValueError("preferred_end_hour must be greater than preferred_start_hour")
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
 
 #------------reset password schema ----------

class ResetRequest(BaseModel):
    email: EmailStr


class VerifyCode(BaseModel):
    email: EmailStr
    code: str


class ResetPassword(BaseModel):
    email: EmailStr
    code: str
    new_password: str
