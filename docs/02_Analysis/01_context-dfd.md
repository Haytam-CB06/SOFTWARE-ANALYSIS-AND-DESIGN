# Context Diagram (Level 0)
This diagram shows the system boundaries for SSTG.

**External Entities**
- Student
- University System
- Google Calendar API
- Notification Service

**Data Flows**
- Student → SSTG: Preferences, Feedback
- SSTG → Student: Timetable, Reminders
- University System → SSTG: Exam & Class Data
- SSTG → Google Calendar: Study Events

