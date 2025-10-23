from .base import Base, metadata

from .user import User
from .subject import Subject
from .study_session import StudySession
from .session_feedback import SessionFeedback
from .class_meeting import ClassMeeting
from .assessment import Assessment

# Make sure this matches the class defined in availability.py
# e.g., if the class is AvailabilityWindow, import that exact name.
from .availability import AvailabilityWindow

from .preferences import Preferences
from .goals import Goal                 # <-- singular to match the class
from .calendar_account import CalendarAccount
from .calendar_event import CalendarEvent
from .activity_log import ActivityLog
from .notification import Notification

# Alembic will read this
target_metadata = metadata
