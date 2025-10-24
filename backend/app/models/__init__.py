# Ensure all models register on Base.metadata
from .base import Base  # re-export Base

from .user import *
from .subject import *
from .study_session import *
from .preferences import *
from .availability import *
from .goals import *
from .session_feedback import *
from .class_meeting import *
from .assessment import *
from .calendar_account import *
from .calendar_event import *
from .activity_log import *
from .notification import *
