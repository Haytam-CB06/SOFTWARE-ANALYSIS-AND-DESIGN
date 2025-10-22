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
from .calendar_account import CalendarAccount
from .calendar_event import CalendarEvent
from .notification import Notification
from .activity_log import ActivityLog

# Alembic reads this
target_metadata = metadata
