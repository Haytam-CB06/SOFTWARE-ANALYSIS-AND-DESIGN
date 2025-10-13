| ID | Test Description | Input | Expected | Actual | Pass |
|----|------------------|--------|-----------|---------|------|
| TC-01 | Register new user | POST /auth/register | 201 Created | 201 | ✅ |
| TC-02 | Login with invalid credentials | Wrong password | 401 Unauthorized | 401 | ✅ |
| TC-03 | Generate timetable | Valid user preferences | 200 OK | 200 | ✅ |
| TC-04 | Skip session update | /sessions/:id/status=skipped | 200 Updated | 200 | ✅ |

