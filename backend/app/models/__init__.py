from app.models.user import User, LoginHistory
from app.models.subject import Subject
from app.models.study_session import StudySession
from app.models.class_meeting import ClassMeeting
from app.models.goals import Goal
from app.models.achievement import Achievement
from app.models.user_achievement import UserAchievement
from app.models.preferences import Preferences
from app.models.availability import AvailabilityWindow
from app.models.assessment import Assessment
from app.models.calendar_account import CalendarAccount
from app.models.calendar_event import CalendarEvent
from app.models.activity_log import ActivityLog
from app.models.notification import Notification
from app.models.session_feedback import SessionFeedback
from app.models.workspace import Workspace, WorkspaceMember, MemberPermission, WorkspaceDeleteLog, MemberDeleteLog
from app.models.message import Message
from app.models.oauth import OAuthAccount
from app.models.google_calendar_link import GoogleCalendarLink
from app.models.study_timetable import StudyTimetable
from app.models.user_profile import UserProfile
from app.models.friendship import Friendship
from app.models.direct_message import DirectConversationPreference, DirectMessage
from app.models.study_window_setting import StudyWindowSetting
from app.models.user_busy_block import UserBusyBlock
from app.models.user_week_study_schedule import UserWeekStudySchedule
from app.models.workspace_week_study_schedule import WorkspaceWeekStudySchedule
from app.models.workspace_auto_generate_config import WorkspaceAutoGenerateConfig
from app.models.workspace_session_status_log import WorkspaceSessionStatusLog
from app.models.chat import ChatRoom, ChatMember, ChatMessage
from app.models.board import BoardTask, BoardComment
__all__ = [
    "User", "LoginHistory",
    "Subject",
    "StudySession",
    "ClassMeeting",    "Goal",
    "Achievement", "UserAchievement",
    "Preferences",
    "AvailabilityWindow",
    "Assessment",
    "CalendarAccount",
    "CalendarEvent",
    "ActivityLog",
    "Notification",
    "SessionFeedback",
    "Workspace", "WorkspaceMember", "MemberPermission", "Message", "DirectMessage", "DirectConversationPreference", "WorkspaceDeleteLog", "MemberDeleteLog",
    "GoogleCalendarLink",
    "StudyTimetable",
    "UserProfile",
    "Friendship",
    "StudyWindowSetting",
    "UserBusyBlock",
    "UserWeekStudySchedule",
    "WorkspaceWeekStudySchedule",
    "WorkspaceAutoGenerateConfig",
    "WorkspaceSessionStatusLog",
    "ChatRoom", "ChatMember", "ChatMessage",
    "BoardTask", "BoardComment",
]
