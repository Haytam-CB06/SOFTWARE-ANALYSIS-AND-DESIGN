from .base import Base, metadata
from .user import User
from .subject import Subject
from .study_session import StudySession
from .preferences import Preferences
from .availability import AvailabilityWindow
from .assessment import Assessment
from .class_meeting import ClassMeeting
from .session_feedback import SessionFeedback
from .goals import Goal

# Alembic reads this
target_metadata = metadata
