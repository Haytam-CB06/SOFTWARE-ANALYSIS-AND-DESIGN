# Entity Relationship Diagram (ERD)

**Entities**
- User (user_id, email, name, password)
- Preference (pref_id, user_id, preferredStart, preferredEnd, dailyLimit, sessionLength)
- Event (event_id, user_id, type, start_time, end_time)
- StudySession (session_id, user_id, subject, start_time, end_time, status)

**Relationships**
- User 1—1 Preference
- User 1—N Event
- User 1—N StudySession

