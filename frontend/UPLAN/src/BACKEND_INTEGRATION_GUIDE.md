# U PLAN - Complete Backend Integration Guide

**Complete documentation for migrating from localStorage to backend database with JWT authentication**

**Version:** 3.0  
**Last Updated:** December 21, 2024  
**Total Integration Points:** 30

---

## 📑 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Authentication (7 endpoints)](#authentication)
4. [User Profile (2 endpoints)](#user-profile)
5. [Timetable Management (4 endpoints)](#timetable-management)
6. [Task Management (3 endpoints)](#task-management)
7. [Workspace Management (11 endpoints)](#workspace-management)
8. [Chat & Collaboration (2 endpoints)](#chat-collaboration)
9. [Notifications (1 endpoint)](#notifications)
10. [Database Schema](#database-schema)
11. [Testing & Deployment](#testing-deployment)
12. [Common Issues & Solutions](#common-issues)

---

<a name="quick-start"></a>
## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install axios socket.io-client
```

### Step 2: Create Environment File
Create `.env` in root:
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=http://localhost:3001
```

### Step 3: Create API Service File
Create `/src/services/api.ts`:
```typescript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
});

export const api = {
  // Auth
  login: (email: string, password: string) =>
    fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),
  
  // User
  getProfile: (userId: string) =>
    fetch(`${API_URL}/api/users/${userId}/profile`, {
      headers: getAuthHeaders()
    }).then(r => r.json()),
  
  // Add more API methods...
};
```

---

<a name="architecture-overview"></a>
## 🏗️ Architecture Overview

### Current Architecture (localStorage)
```
┌─────────────────────────────────────┐
│         React Frontend              │
│  ┌──────────────────────────────┐   │
│  │   localStorage (Browser)     │   │
│  │  • registeredUsers           │   │
│  │  • currentUserEmail          │   │
│  │  • user_[email]_sessions     │   │
│  │  • user_[email]_tasks        │   │
│  │  • workspaces                │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### New Architecture (Backend + JWT)
```
┌─────────────────────────────────────┐
│         React Frontend              │
│  ┌──────────────────────────────┐   │
│  │   localStorage (Minimal)     │   │
│  │  • authToken (JWT)          │   │
│  │  • userId                   │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
         ↕ HTTPS/WSS
┌─────────────────────────────────────┐
│      Backend API Server             │
│  • Express/Node.js Routes           │
│  • WebSocket Server                 │
└───────────────────────────���─────────┘
         ↕
┌─────────────────────────────────────┐
│     PostgreSQL Database             │
│  • users, sessions, tasks           │
│  • workspaces, messages             │
└─────────────────────────────────────┘
```

---

<a name="authentication"></a>
## 🔐 Authentication (7 Endpoints)

### 1. User Login
**File:** `/components/AuthPage.tsx` (Line 120)  
**Function:** `handleLogin()`

**API Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  },
  "message": "Login successful"
}
```

**Frontend Integration:**
```typescript
// File: /components/AuthPage.tsx (Line 120)
const handleLogin = async () => {
  setLoginError('');
  setIsLoggingIn(true);
  
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginEmail,
        password: loginPassword
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store JWT token and user ID
      localStorage.setItem('authToken', data.user.token);
      localStorage.setItem('userId', data.user.id);
      
      // Clear old localStorage data
      localStorage.removeItem('registeredUsers');
      localStorage.removeItem('currentUserEmail');
      
      onLogin(data.user.name, data.user.email);
      toast.success('Login successful!');
    } else {
      setLoginError(data.message || 'Invalid credentials');
    }
  } catch (error) {
    console.error('Login error:', error);
    setLoginError('Network error. Please try again.');
  } finally {
    setIsLoggingIn(false);
  }
};
```

**Backend Implementation Notes:**
- Validate email and password
- Hash password comparison using bcrypt
- Generate JWT token with 24h expiration
- Generate refresh token with 7d expiration
- Return user data (exclude password hash)
- Log login timestamp

---

### 2. User Signup
**File:** `/components/AuthPage.tsx` (Line 180)  
**Function:** `handleSignup()`

**API Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "createdAt": "2024-12-21T10:00:00Z"
  },
  "message": "Account created successfully"
}
```

**Frontend Integration:**
```typescript
// File: /components/AuthPage.tsx (Line 180)
const handleSignup = async () => {
  setSignupError('');
  setIsSigningUp(true);
  
  // Validation
  if (password !== confirmPassword) {
    setSignupError('Passwords do not match');
    setIsSigningUp(false);
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password: password
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store JWT token and user ID
      localStorage.setItem('authToken', data.user.token);
      localStorage.setItem('userId', data.user.id);
      
      onLogin(data.user.name, data.user.email);
      toast.success('Account created successfully!');
    } else {
      setSignupError(data.message || 'Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    setSignupError('Network error. Please try again.');
  } finally {
    setIsSigningUp(false);
  }
};
```

**Backend Implementation Notes:**
- Validate email format and uniqueness
- Check password strength (min 8 chars)
- Hash password using bcrypt (salt rounds: 10)
- Create user record in database
- Generate JWT token
- Send verification email
- Return user data with token

---

### 3. Google OAuth Login
**File:** `/components/AuthPage.tsx` (Line 310)  
**Function:** `handleGoogleSuccess()`

**API Endpoint:** `POST /api/auth/google`

**Request Body:**
```json
{
  "credential": "google_id_token_here",
  "clientId": "google_client_id"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-456",
    "name": "Jane Smith",
    "email": "jane@gmail.com",
    "profilePicture": "https://lh3.googleusercontent.com/...",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isNewUser": false
  }
}
```

**Frontend Integration:**
```typescript
// File: /components/AuthPage.tsx (Line 310)
const handleGoogleSuccess = async (credentialResponse: any) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: credentialResponse.credential,
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('authToken', data.user.token);
      localStorage.setItem('userId', data.user.id);
      
      onLogin(data.user.name, data.user.email);
      toast.success('Logged in with Google!');
    }
  } catch (error) {
    console.error('Google auth error:', error);
    toast.error('Google authentication failed');
  }
};
```

**Backend Implementation Notes:**
- Verify Google ID token with Google API
- Extract user info from token
- Check if user exists by email
- Create new user if first login
- Update profile picture from Google
- Generate JWT token
- Return user data

---

### 4. Forgot Password
**File:** `/components/AuthPage.tsx` (Line 400)  
**Function:** `handleForgotPassword()`

**API Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Frontend Integration:**
```typescript
// File: /components/AuthPage.tsx (Line 400)
const handleForgotPassword = async () => {
  if (!forgotEmail) {
    setForgotError('Please enter your email');
    return;
  }
  
  setIsSendingReset(true);
  
  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail })
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('Password reset email sent! Check your inbox.');
      setForgotEmail('');
      setShowForgotPassword(false);
    } else {
      setForgotError(data.message || 'Failed to send reset email');
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    setForgotError('Network error. Please try again.');
  } finally {
    setIsSendingReset(false);
  }
};
```

**Backend Implementation Notes:**
- Verify email exists in database
- Generate unique reset token (UUID)
- Store token with 1-hour expiration
- Send email with reset link
- Return success message (don't reveal if email exists)

---

### 5. Reset Password
**File:** `/components/AuthPage.tsx` (Line 480)  
**Function:** `handleResetPassword()`

**API Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Frontend Integration:**
```typescript
// File: /components/AuthPage.tsx (Line 480)
const handleResetPassword = async () => {
  if (newPassword !== confirmNewPassword) {
    setResetError('Passwords do not match');
    return;
  }
  
  setIsResettingPassword(true);
  
  try {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: newPassword
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('Password reset successful! Please login.');
      window.location.href = '/login';
    } else {
      setResetError(data.message || 'Reset failed');
    }
  } catch (error) {
    console.error('Reset password error:', error);
    setResetError('Network error. Please try again.');
  } finally {
    setIsResettingPassword(false);
  }
};
```

**Backend Implementation Notes:**
- Validate reset token
- Check token expiration (1 hour)
- Verify token hasn't been used
- Hash new password with bcrypt
- Update user password
- Invalidate reset token
- Send confirmation email

---

### 6. Verify Email
**File:** `/components/AuthPage.tsx` (Line 550)  
**Function:** `handleVerifyEmail()`

**API Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "token": "verification_token_from_email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Frontend Integration:**
```typescript
// File: /components/AuthPage.tsx (Line 550)
const handleVerifyEmail = async (verificationToken: string) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationToken })
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('Email verified successfully!');
      window.location.href = '/dashboard';
    } else {
      toast.error(data.message || 'Verification failed');
    }
  } catch (error) {
    console.error('Email verification error:', error);
    toast.error('Verification failed. Please try again.');
  }
};
```

**Backend Implementation Notes:**
- Validate verification token
- Check token hasn't expired
- Update user email_verified status
- Invalidate verification token
- Return success message

---

### 7. Logout
**File:** `/components/Navigation.tsx` (Line 80)  
**Function:** `handleLogout()`

**API Endpoint:** `POST /api/auth/logout`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Frontend Integration:**
```typescript
// File: /components/Navigation.tsx (Line 80)
const handleLogout = async () => {
  const token = localStorage.getItem('authToken');
  
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local data regardless of API response
    localStorage.clear();
    window.location.href = '/';
  }
};
```

**Backend Implementation Notes:**
- Invalidate JWT token (add to blacklist)
- Invalidate refresh token
- Log logout timestamp
- Clear session data
- Return success message

---

<a name="user-profile"></a>
## 👤 User Profile (2 Endpoints)

### 8. Get User Profile
**File:** `/components/Settings.tsx` (Line 45)  
**Function:** `loadUserProfile()`

**API Endpoint:** `GET /api/users/:userId/profile`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "user@example.com",
    "profilePicture": "https://example.com/photo.jpg",
    "bio": "Student at XYZ University",
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en"
    },
    "stats": {
      "totalStudyHours": 150,
      "tasksCompleted": 45,
      "workspaces": 3
    }
  }
}
```

**Frontend Integration:**
```typescript
// File: /components/Settings.tsx (Line 45)
const loadUserProfile = async () => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  if (!userId || !token) return;
  
  setIsLoading(true);
  
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      setName(data.user.name);
      setEmail(data.user.email);
      setBio(data.user.bio);
      setProfilePicture(data.user.profilePicture);
      setPreferences(data.user.preferences);
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
    toast.error('Failed to load profile');
  } finally {
    setIsLoading(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify userId matches token
- Query user data from database
- Exclude sensitive data (password hash)
- Calculate stats (study hours, tasks)
- Return user profile

---

### 9. Update User Profile
**File:** `/components/Settings.tsx` (Line 120)  
**Function:** `handleUpdateProfile()`

**API Endpoint:** `PATCH /api/users/:userId/profile`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Smith",
  "bio": "Updated bio",
  "preferences": {
    "theme": "light",
    "notifications": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "name": "John Smith",
    "bio": "Updated bio",
    "preferences": {
      "theme": "light",
      "notifications": true
    },
    "updatedAt": "2024-12-21T15:00:00Z"
  },
  "message": "Profile updated successfully"
}
```

**Frontend Integration:**
```typescript
// File: /components/Settings.tsx (Line 120)
const handleUpdateProfile = async () => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  setIsSaving(true);
  
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name.trim(),
        bio: bio.trim(),
        preferences: preferences
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('Profile updated successfully!');
      // Update local user name if changed
      if (data.user.name !== userName) {
        onUpdateName(data.user.name);
      }
    } else {
      toast.error(data.message || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Failed to update profile:', error);
    toast.error('Network error. Please try again.');
  } finally {
    setIsSaving(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify userId matches token
- Sanitize input data
- Validate email format if changed
- Check email uniqueness if changed
- Update user record
- Return updated user data

---

<a name="timetable-management"></a>
##  Timetable Management (4 Endpoints)

### 10. Get Timetable Sessions by Week
**File:** `/components/CalendarView.tsx` (Line 90)  
**Function:** `loadSessions()`

**API Endpoint:** `GET /api/users/:userId/sessions/week/:weekId`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "session-123",
      "subject": "Mathematics",
      "day": 1,
      "startTime": "09:00",
      "endTime": "10:30",
      "type": "lecture",
      "color": "#6366F1",
      "location": "Room 101",
      "instructor": "Dr. Smith",
      "weekId": "2024-W03"
    }
  ],
  "weekId": "2024-W03",
  "count": 15
}
```

**Frontend Integration:**
```typescript
// File: /components/CalendarView.tsx (Line 90)
const loadSessions = async () => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  if (!userId || !token) return;
  
  setIsLoading(true);
  
  try {
    const response = await fetch(
      `${API_URL}/api/users/${userId}/sessions/week/${currentWeekId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      setSessions(data.sessions);
    } else if (response.status === 401) {
      // Token expired
      localStorage.clear();
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Failed to load sessions:', error);
    toast.error('Failed to load timetable');
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  loadSessions();
}, [currentWeekId]);
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify userId matches token
- Query sessions by userId and weekId
- Sort by day and startTime
- Return sessions array

---

### 11. Auto-Generate Timetable
**File:** `/components/TimetableResults.tsx` (Line 38)  
**Function:** `handleGenerate()`

**API Endpoint:** `POST /api/timetable/generate`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user-123",
  "subjects": [
    {
      "name": "Mathematics",
      "hoursPerWeek": 5,
      "priority": "high",
      "type": "lecture"
    },
    {
      "name": "Physics",
      "hoursPerWeek": 4,
      "priority": "medium",
      "type": "lecture"
    }
  ],
  "preferences": {
    "startTime": "08:00",
    "endTime": "18:00",
    "breakDuration": 60,
    "lunchTime": "12:00",
    "weekdayAvailability": {
      "start": "08:00",
      "end": "18:00"
    },
    "sleepHours": {
      "start": "23:00",
      "end": "07:00"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "timetable": {
    "sessions": [
      {
        "id": "gen-session-1",
        "subject": "Mathematics",
        "day": 0,
        "startTime": "09:00",
        "endTime": "10:30",
        "type": "lecture",
        "color": "#6366F1"
      }
    ],
    "stats": {
      "totalHours": 35,
      "efficiency": 85,
      "conflictsResolved": 3
    }
  },
  "message": "Timetable generated successfully"
}
```

**Frontend Integration:**
```typescript
// File: /components/TimetableResults.tsx (Line 38)
const handleGenerate = async () => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  setIsGenerating(true);
  
  try {
    const response = await fetch(`${API_URL}/api/timetable/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        subjects: subjects,
        preferences: {
          startTime: startTime,
          endTime: endTime,
          breakDuration: breakDuration,
          lunchTime: lunchTime,
          weekdayAvailability: weekdayAvailability,
          sleepHours: sleepHours
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setGeneratedSessions(data.timetable.sessions);
      setStats(data.timetable.stats);
      toast.success('Timetable generated successfully!');
    } else {
      toast.error(data.message || 'Generation failed');
    }
  } catch (error) {
    console.error('Failed to generate timetable:', error);
    toast.error('Failed to generate timetable');
  } finally {
    setIsGenerating(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Parse subjects and preferences
- Apply priority-based allocation algorithm
- Respect availability constraints
- Avoid sleep hours and lunch breaks
- Resolve conflicts automatically
- Calculate efficiency score
- Return generated sessions with stats

---

### 12. Import Timetable from Excel/CSV
**File:** `/components/ImportDialog.tsx` (Line 84)  
**Function:** `processExcelFile()`

**API Endpoint:** `POST /api/timetable/import/excel`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
file: [Excel/CSV file]
userId: "user-123"
```

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "import-1",
      "subject": "Mathematics",
      "day": 0,
      "startTime": "09:00",
      "endTime": "10:30",
      "type": "lecture",
      "color": "#6366F1",
      "location": "Room 101",
      "instructor": "Dr. Smith"
    }
  ],
  "count": 15,
  "message": "Successfully imported 15 sessions"
}
```

**Frontend Integration:**
```typescript
// File: /components/ImportDialog.tsx (Line 84)
const processExcelFile = async (file: File) => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId!);
  
  setIsProcessing(true);
  
  try {
    const response = await fetch(`${API_URL}/api/timetable/import/excel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      setPreviewSessions(data.sessions);
      toast.success(`Found ${data.count} sessions in the file`);
    } else {
      toast.error(data.message || 'Import failed');
    }
  } catch (error) {
    console.error('Failed to import Excel:', error);
    toast.error('Failed to import file');
  } finally {
    setIsProcessing(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Check file type (Excel/CSV)
- Validate file size (max 5MB)
- Use library to parse Excel (exceljs, xlsx)
- Support multiple formats:
  - CSV with headers (Subject, Day, Start Time, End Time, Type)
  - Excel table format
  - Excel grid layout (times in rows, days in columns)
- Parse time formats (12h/24h, AM/PM)
- Map day names to numbers (Monday=0, etc.)
- Assign default colors by session type
- Validate required fields
- Return structured session data

**Supported File Formats:**
- .xlsx (Excel 2007+)
- .xls (Excel 97-2003)
- .csv (Comma-separated values)

**Expected CSV Format:**
```csv
Subject,Day,Start Time,End Time,Type,Location,Instructor
Mathematics,Monday,09:00,10:30,Lecture,Room 101,Dr. Smith
Physics,Tuesday,11:00,12:30,Lecture,Lab 203,Prof. Johnson
```

---

### 13. Import Timetable from Image (OCR)
**File:** `/components/ImportDialog.tsx` (Line 154)  
**Function:** `processImageFile()`

**API Endpoint:** `POST /api/timetable/import/image`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
file: [Image file]
userId: "user-123"
```

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "ocr-1",
      "subject": "Physics",
      "day": 1,
      "startTime": "11:00",
      "endTime": "12:30",
      "type": "lecture",
      "color": "#6366F1",
      "confidence": 0.92
    }
  ],
  "count": 12,
  "ocrConfidence": 85,
  "message": "Detected 12 sessions with 85% confidence"
}
```

**Frontend Integration:**
```typescript
// File: /components/ImportDialog.tsx (Line 154)
const processImageFile = async (file: File) => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId!);
  
  setIsProcessing(true);
  toast.info('Analyzing image with OCR...');
  
  try {
    const response = await fetch(`${API_URL}/api/timetable/import/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      setPreviewSessions(data.sessions);
      toast.success(
        `Detected ${data.count} sessions with ${data.ocrConfidence}% confidence`
      );
    } else {
      toast.error(data.message || 'OCR processing failed');
    }
  } catch (error) {
    console.error('Failed to process image:', error);
    toast.error('Failed to analyze image');
  } finally {
    setIsProcessing(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Check file type (image)
- Validate file size (max 10MB)
- Use OCR service:
  - **Google Cloud Vision API** (Best accuracy, recommended)
  - AWS Textract (Good for tables)
  - Azure Computer Vision
  - Tesseract.js (Open source)
- Preprocess image (resize, enhance contrast)
- Extract text from image
- Parse timetable structure
- Detect table/grid layout
- Extract day headers (Mon, Tue, Wed, etc.)
- Extract time slots
- Map subjects to grid cells
- Calculate start/end times
- Assign session types by keywords
- Return sessions with confidence scores

**Supported Image Formats:**
- .jpg, .jpeg (photos)
- .png (screenshots)
- .gif, .bmp, .webp

**Image Requirements:**
- Clear, high-resolution (1080p+ recommended)
- Good lighting, no shadows
- Text clearly visible
- Maximum size: 10MB

**Recommended OCR Service (Google Cloud Vision):**
```javascript
// Example Backend Implementation
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

async function extractTimetable(imageBuffer) {
  // Perform OCR
  const [result] = await client.textDetection(imageBuffer);
  const text = result.fullTextAnnotation.text;
  
  // Parse timetable structure
  const sessions = parseTimetableText(text);
  
  return {
    success: true,
    sessions,
    ocrConfidence: calculateConfidence(result)
  };
}
```

**Confidence Scores:**
- High (>80%): Auto-import sessions
- Medium (50-80%): Show preview, require confirmation
- Low (<50%): Manual review required

---

<a name="task-management"></a>
## Task Management (3 Endpoints)

### 14. Get All Tasks
**File:** `/components/Dashboard.tsx` (Line 57)  
**Function:** `loadTasks()`

**API Endpoint:** `GET /api/users/:userId/tasks`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "task-123",
      "title": "Complete Assignment 1",
      "type": "assignment",
      "dueDate": "2024-01-20",
      "priority": "high",
      "completed": false,
      "subject": "Mathematics",
      "description": "Solve problems 1-20",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 25
}
```

**Frontend Integration:**
```typescript
// File: /components/Dashboard.tsx (Line 57)
const loadTasks = async () => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  if (!userId || !token) {
    window.location.href = '/login';
    return;
  }
  
  setIsLoading(true);
  
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      setTasks(data.tasks);
    } else if (response.status === 401) {
      // Token expired
      localStorage.clear();
      window.location.href = '/login';
    } else {
      toast.error('Failed to load tasks');
    }
  } catch (error) {
    console.error('Failed to load tasks:', error);
    toast.error('Network error. Please check your connection.');
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  loadTasks();
}, []);
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify userId matches token
- Query tasks by userId
- Sort by dueDate and priority
- Return tasks array

---

### 15. Add Task
**File:** `/components/Dashboard.tsx` (Line 150)  
**Function:** `handleAddTask()`

**API Endpoint:** `POST /api/users/:userId/tasks`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Complete Assignment 2",
  "type": "assignment",
  "dueDate": "2024-01-25",
  "priority": "high",
  "subject": "Physics",
  "description": "Chapter 5 problems"
}
```

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "task-456",
    "title": "Complete Assignment 2",
    "type": "assignment",
    "dueDate": "2024-01-25",
    "priority": "high",
    "subject": "Physics",
    "description": "Chapter 5 problems",
    "completed": false,
    "createdAt": "2024-01-15T14:00:00Z"
  }
}
```

**Frontend Integration:**
```typescript
// File: /components/Dashboard.tsx (Line 150)
const handleAddTask = async (newTask: Task) => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  // Optimistic update
  const tempTask = { ...newTask, id: `temp-${Date.now()}` };
  setTasks([...tasks, tempTask]);
  
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newTask)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Replace temp task with server version (has proper ID)
      setTasks(tasks => 
        tasks.map(t => t.id === tempTask.id ? data.task : t)
      );
      toast.success('Task added successfully!');
    } else {
      // Rollback on error
      setTasks(tasks => tasks.filter(t => t.id !== tempTask.id));
      toast.error(data.message || 'Failed to add task');
    }
  } catch (error) {
    // Rollback on error
    setTasks(tasks => tasks.filter(t => t.id !== tempTask.id));
    console.error('Failed to add task:', error);
    toast.error('Network error');
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify userId matches token
- Sanitize input data
- Validate required fields (title, type, dueDate)
- Create task record
- Return created task with ID

---

### 16. Update Task
**File:** `/components/Dashboard.tsx` (Line 220)  
**Function:** `handleUpdateTask()`

**API Endpoint:** `PATCH /api/users/:userId/tasks/:taskId`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "completed": true,
  "priority": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "task-123",
    "title": "Complete Assignment 1",
    "completed": true,
    "priority": "medium",
    "completedAt": "2024-01-16T09:00:00Z",
    "updatedAt": "2024-01-16T09:00:00Z"
  }
}
```

**Frontend Integration:**
```typescript
// File: /components/Dashboard.tsx (Line 220)
const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  // Optimistic update
  const originalTasks = [...tasks];
  setTasks(tasks => 
    tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
  );
  
  try {
    const response = await fetch(
      `${API_URL}/api/users/${userId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      // Update with server version
      setTasks(tasks => 
        tasks.map(t => t.id === taskId ? data.task : t)
      );
      toast.success('Task updated!');
    } else {
      // Rollback on error
      setTasks(originalTasks);
      toast.error('Failed to update task');
    }
  } catch (error) {
    // Rollback on error
    setTasks(originalTasks);
    console.error('Failed to update task:', error);
    toast.error('Network error');
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify userId and taskId
- Sanitize input data
- Update task record
- Set completedAt if marking complete
- Return updated task

---

<a name="workspace-management"></a>
## 👥 Workspace Management (11 Endpoints)

### 17. Get All Workspaces
**File:** `/components/Workspace.tsx` (Line 75)  
**Function:** `loadWorkspaces()`

**API Endpoint:** `GET /api/users/:userId/workspaces`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "workspaces": [
    {
      "id": "workspace-123",
      "name": "Study Group 2024",
      "description": "Collaborative study workspace",
      "role": "admin",
      "memberCount": 5,
      "createdAt": "2024-01-10T10:00:00Z",
      "owner": {
        "id": "user-123",
        "name": "John Doe"
      }
    }
  ],
  "count": 3
}
```

**Frontend Integration:**
```typescript
// File: /components/Workspace.tsx (Line 75)
const loadWorkspaces = async () => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  if (!userId || !token) return;
  
  setIsLoading(true);
  
  try {
    const response = await fetch(
      `${API_URL}/api/users/${userId}/workspaces`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      setWorkspaces(data.workspaces);
    } else {
      toast.error('Failed to load workspaces');
    }
  } catch (error) {
    console.error('Failed to load workspaces:', error);
    toast.error('Network error');
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  loadWorkspaces();
}, []);
```

**Backend Implementation Notes:**
- Validate JWT token
- Query workspaces where user is member
- Include role (admin/member)
- Count members for each workspace
- Return workspaces array

---

### 18. Create Workspace
**File:** `/components/Workspace.tsx` (Line 150)  
**Function:** `handleCreateWorkspace()`

**API Endpoint:** `POST /api/workspaces`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Study Group",
  "description": "Group for semester finals prep",
  "ownerId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "workspace": {
    "id": "workspace-456",
    "name": "New Study Group",
    "description": "Group for semester finals prep",
    "ownerId": "user-123",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Frontend Integration:**
```typescript
// File: /components/Workspace.tsx (Line 150)
const handleCreateWorkspace = async () => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  if (!workspaceName.trim()) {
    toast.error('Please enter a workspace name');
    return;
  }
  
  setIsCreating(true);
  
  try {
    const response = await fetch(`${API_URL}/api/workspaces`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: workspaceName.trim(),
        description: workspaceDescription.trim(),
        ownerId: userId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setWorkspaces([...workspaces, data.workspace]);
      toast.success('Workspace created!');
      setShowCreateDialog(false);
      setWorkspaceName('');
      setWorkspaceDescription('');
    } else {
      toast.error(data.message || 'Failed to create workspace');
    }
  } catch (error) {
    console.error('Failed to create workspace:', error);
    toast.error('Network error');
  } finally {
    setIsCreating(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Sanitize workspace name and description
- Create workspace record
- Add owner as first admin member
- Return created workspace

---

### 19. Add Workspace Member
**File:** `/components/Workspace.tsx` (Line 250)  
**Function:** `handleAddMember()`

**API Endpoint:** `POST /api/workspaces/:workspaceId/members`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "member"
}
```

**Response:**
```json
{
  "success": true,
  "member": {
    "id": "member-789",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "member",
    "joinedAt": "2024-01-15T11:00:00Z"
  }
}
```

**Frontend Integration:**
```typescript
// File: /components/Workspace.tsx (Line 250)
const handleAddMember = async (workspaceId: string) => {
  const token = localStorage.getItem('authToken');
  
  if (!memberName.trim() || !memberEmail.trim()) {
    toast.error('Please enter name and email');
    return;
  }
  
  setIsAddingMember(true);
  
  try {
    const response = await fetch(
      `${API_URL}/api/workspaces/${workspaceId}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: memberName.trim(),
          email: memberEmail.trim(),
          role: memberRole
        })
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      // Update members list
      setMembers([...members, data.member]);
      toast.success('Member added successfully!');
      setMemberName('');
      setMemberEmail('');
    } else {
      toast.error(data.message || 'Failed to add member');
    }
  } catch (error) {
    console.error('Failed to add member:', error);
    toast.error('Network error');
  } finally {
    setIsAddingMember(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify user is admin of workspace
- Check max 2 admins per workspace (if role is admin)
- Validate email format
- Check if member already exists
- Create member record
- Send invitation email
- Return created member

---

### 20. Generate Workspace Sharing Link
**File:** `/components/Workspace.tsx` (Line 350)  
**Function:** `handleGenerateLink()`

**API Endpoint:** `POST /api/workspaces/:workspaceId/sharing/generate`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "accessType": "request",
  "allowedDomain": "university.edu",
  "expiresIn": 30
}
```

**Response:**
```json
{
  "success": true,
  "sharing": {
    "enabled": true,
    "linkId": "share-abc123xyz789",
    "fullUrl": "https://uplan.app/join/share-abc123xyz789",
    "accessType": "request",
    "allowedDomain": "university.edu",
    "createdAt": "2024-12-21T10:00:00Z",
    "createdBy": "user-123",
    "expiresAt": "2025-01-20T10:00:00Z"
  },
  "message": "Sharing link generated successfully"
}
```

**Frontend Integration:**
```typescript
// File: /components/Workspace.tsx (Line 350)
const handleGenerateLink = async (workspaceId: string) => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  setIsGeneratingLink(true);
  
  try {
    const response = await fetch(
      `${API_URL}/api/workspaces/${workspaceId}/sharing/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessType: accessType, // 'open' or 'request'
          allowedDomain: allowedDomain || null,
          expiresIn: expirationDays || null
        })
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      setSharingLink(data.sharing.fullUrl);
      setSharingEnabled(true);
      toast.success('Sharing link generated!');
      
      // Copy to clipboard
      navigator.clipboard.writeText(data.sharing.fullUrl);
      toast.success('Link copied to clipboard!');
    } else {
      toast.error(data.message || 'Failed to generate link');
    }
  } catch (error) {
    console.error('Failed to generate link:', error);
    toast.error('Network error');
  } finally {
    setIsGeneratingLink(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify user is admin of workspace
- Generate unique linkId (UUID or random string)
- Set accessType ('open' or 'request')
- Set allowedDomain if provided (email domain restriction)
- Calculate expiresAt from expiresIn days
- Store sharing link record
- Return full URL with linkId

---

### 21. Regenerate Workspace Sharing Link
**File:** `/components/Workspace.tsx` (Line 450)  
**Function:** `handleRegenerateLink()`

**API Endpoint:** `PUT /api/workspaces/:workspaceId/sharing/regenerate`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "sharing": {
    "enabled": true,
    "linkId": "share-newlink456",
    "fullUrl": "https://uplan.app/join/share-newlink456",
    "accessType": "request",
    "createdAt": "2024-12-21T11:00:00Z",
    "createdBy": "user-123"
  },
  "message": "Sharing link regenerated successfully"
}
```

**Frontend Integration:**
```typescript
// File: /components/Workspace.tsx (Line 450)
const handleRegenerateLink = async (workspaceId: string) => {
  const token = localStorage.getItem('authToken');
  
  if (!confirm('This will invalidate the current link. Continue?')) {
    return;
  }
  
  setIsRegeneratingLink(true);
  
  try {
    const response = await fetch(
      `${API_URL}/api/workspaces/${workspaceId}/sharing/regenerate`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      setSharingLink(data.sharing.fullUrl);
      toast.success('Link regenerated successfully!');
      
      // Copy to clipboard
      navigator.clipboard.writeText(data.sharing.fullUrl);
    } else {
      toast.error(data.message || 'Failed to regenerate link');
    }
  } catch (error) {
    console.error('Failed to regenerate link:', error);
    toast.error('Network error');
  } finally {
    setIsRegeneratingLink(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify user is admin of workspace
- Invalidate old link (set enabled = false)
- Generate new unique linkId
- Create new sharing link record
- Preserve accessType and settings
- Return new link

---

### 22. Disable Workspace Sharing Link
**File:** `/components/Workspace.tsx` (Line 530)  
**Function:** `handleDisableLink()`

**API Endpoint:** `DELETE /api/workspaces/:workspaceId/sharing`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Sharing link disabled successfully"
}
```

**Frontend Integration:**
```typescript
// File: /components/Workspace.tsx (Line 530)
const handleDisableLink = async (workspaceId: string) => {
  const token = localStorage.getItem('authToken');
  
  if (!confirm('This will disable the sharing link. Continue?')) {
    return;
  }
  
  setIsDisablingLink(true);
  
  try {
    const response = await fetch(
      `${API_URL}/api/workspaces/${workspaceId}/sharing`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      setSharingEnabled(false);
      setSharingLink('');
      toast.success('Sharing link disabled');
    } else {
      toast.error(data.message || 'Failed to disable link');
    }
  } catch (error) {
    console.error('Failed to disable link:', error);
    toast.error('Network error');
  } finally {
    setIsDisablingLink(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify user is admin of workspace
- Set enabled = false on sharing link
- Set disabledAt timestamp
- Set disabledBy user ID
- Return success message

---

### 23. Validate Workspace Sharing Link
**File:** `/components/JoinWorkspaceDialog.tsx` (Line 64)  
**Function:** `validateLink()`

**API Endpoint:** `GET /api/workspaces/join/:linkId`

**Request Headers:**
```
Authorization: Bearer {token}  (optional)
```

**Response (Valid):**
```json
{
  "success": true,
  "workspace": {
    "id": "workspace-789",
    "name": "Study Group 2024",
    "description": "Collaborative study workspace",
    "memberCount": 5,
    "sharing": {
      "linkId": "share-abc123xyz789",
      "enabled": true,
      "accessType": "request",
      "allowedDomain": "university.edu",
      "expiresAt": "2025-01-20T10:00:00Z"
    }
  }
}
```

**Response (Invalid):**
```json
{
  "success": false,
  "error": "LINK_INVALID",
  "message": "Invalid or disabled invite link"
}
```

**Frontend Integration:**
```typescript
// File: /components/JoinWorkspaceDialog.tsx (Line 64)
const validateLink = async (linkId: string) => {
  const token = localStorage.getItem('authToken');
  
  setIsValidating(true);
  
  try {
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${API_URL}/api/workspaces/join/${linkId}`,
      { headers }
    );
    
    const data = await response.json();
    
    if (data.success) {
      setWorkspaceInfo(data.workspace);
      setIsValid(true);
    } else {
      setError(data.message);
      setIsValid(false);
    }
  } catch (error) {
    console.error('Failed to validate link:', error);
    setError('Failed to validate link');
    setIsValid(false);
  } finally {
    setIsValidating(false);
  }
};
```

**Backend Implementation Notes:**
- Look up sharing link by linkId
- Check if enabled = true
- Check if not expired
- Check if allowedDomain matches (if set)
- Return workspace info if valid
- Return specific error codes:
  - LINK_INVALID: Link doesn't exist
  - LINK_DISABLED: Link was disabled
  - LINK_EXPIRED: Link has expired
  - DOMAIN_NOT_ALLOWED: Email domain not allowed

---

### 24. Submit Workspace Join Request
**File:** `/components/JoinWorkspaceDialog.tsx` (Line 150)  
**Function:** `handleJoinRequest()`

**API Endpoint:** `POST /api/workspaces/:workspaceId/join-requests`

**Request Headers:**
```
Authorization: Bearer {token}  (optional)
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I'd like to join to collaborate on coursework",
  "linkId": "share-abc123xyz789"
}
```

**Response (Request Mode):**
```json
{
  "success": true,
  "request": {
    "id": "request-456",
    "name": "John Doe",
    "email": "john@example.com",
    "requestedAt": "2024-12-21T14:00:00Z",
    "status": "pending"
  },
  "message": "Request sent successfully! Admins will review your request."
}
```

**Response (Auto-Join Mode):**
```json
{
  "success": true,
  "member": {
    "id": "member-456",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "joinedAt": "2024-12-21T14:00:00Z"
  },
  "message": "Successfully joined workspace!"
}
```

**Frontend Integration:**
```typescript
// File: /components/JoinWorkspaceDialog.tsx (Line 150)
const handleJoinRequest = async () => {
  if (!name.trim() || !email.trim()) {
    toast.error('Please enter your name and email');
    return;
  }
  
  setIsJoining(true);
  
  try {
    const response = await fetch(
      `${API_URL}/api/workspaces/${workspaceId}/join-requests`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          linkId: linkId
        })
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      if (data.member) {
        // Auto-joined (open mode)
        toast.success('Successfully joined workspace!');
        window.location.href = `/workspace/${workspaceId}`;
      } else {
        // Request sent (request mode)
        toast.success('Request sent! Admins will review it soon.');
        setShowSuccessMessage(true);
      }
    } else {
      toast.error(data.message || 'Failed to join workspace');
    }
  } catch (error) {
    console.error('Failed to join workspace:', error);
    toast.error('Network error');
  } finally {
    setIsJoining(false);
  }
};
```

**Backend Implementation Notes:**
- Validate linkId
- Check if link is enabled and not expired
- Check allowedDomain if set
- Validate email format
- Check if user already member
- If accessType = 'open':
  - Add user as member immediately
  - Return member object
- If accessType = 'request':
  - Create join request record
  - Send notification to admins
  - Return request object

---

### 25. Get Pending Join Requests
**File:** `/components/Workspace.tsx` (Line 600)  
**Function:** `loadPendingRequests()`

**API Endpoint:** `GET /api/workspaces/:workspaceId/join-requests`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
?status=pending
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "request-123",
      "name": "John Doe",
      "email": "john@example.com",
      "message": "I'd like to join",
      "requestedAt": "2024-12-21T14:00:00Z",
      "status": "pending"
    }
  ],
  "count": 3
}
```

**Frontend Integration:**
```typescript
// File: /components/Workspace.tsx (Line 600)
const loadPendingRequests = async (workspaceId: string) => {
  const token = localStorage.getItem('authToken');
  
  setIsLoadingRequests(true);
  
  try {
    const response = await fetch(
      `${API_URL}/api/workspaces/${workspaceId}/join-requests?status=pending`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      setPendingRequests(data.requests);
      setRequestCount(data.count);
    } else {
      toast.error('Failed to load requests');
    }
  } catch (error) {
    console.error('Failed to load requests:', error);
    toast.error('Network error');
  } finally {
    setIsLoadingRequests(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify user is admin of workspace
- Query join requests by workspaceId
- Filter by status (pending)
- Sort by requestedAt (newest first)
- Return requests array

---

### 26. Approve/Reject Join Request
**File:** `/components/Workspace.tsx` (Line 680)  
**Function:** `handleRequestResponse()`

**API Endpoint:** `POST /api/workspaces/:workspaceId/join-requests/:requestId/respond`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (Approve):**
```json
{
  "action": "approve",
  "role": "member"
}
```

**Request Body (Reject):**
```json
{
  "action": "reject",
  "reason": "Workspace is full"
}
```

**Response (Approved):**
```json
{
  "success": true,
  "member": {
    "id": "member-789",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "joinedAt": "2024-12-21T15:00:00Z"
  },
  "message": "Request approved successfully"
}
```

**Response (Rejected):**
```json
{
  "success": true,
  "message": "Request rejected"
}
```

**Frontend Integration:**
```typescript
// File: /components/Workspace.tsx (Line 680)
const handleRequestResponse = async (
  workspaceId: string,
  requestId: string,
  action: 'approve' | 'reject',
  reason?: string
) => {
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  
  setIsResponding(true);
  
  try {
    const response = await fetch(
      `${API_URL}/api/workspaces/${workspaceId}/join-requests/${requestId}/respond`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          role: action === 'approve' ? 'member' : undefined,
          reason: reason
        })
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      // Remove from pending list
      setPendingRequests(prev => 
        prev.filter(r => r.id !== requestId)
      );
      
      if (action === 'approve') {
        // Add to members list
        setMembers([...members, data.member]);
        toast.success('Member added successfully!');
      } else {
        toast.success('Request rejected');
      }
    } else {
      toast.error(data.message || 'Failed to process request');
    }
  } catch (error) {
    console.error('Failed to respond to request:', error);
    toast.error('Network error');
  } finally {
    setIsResponding(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify user is admin of workspace
- Verify request exists and is pending
- If action = 'approve':
  - Create member record
  - Set status = 'approved'
  - Set reviewedAt and reviewedBy
  - Send welcome email to member
  - Return member object
- If action = 'reject':
  - Set status = 'rejected'
  - Set reviewedAt and reviewedBy
  - Store rejection reason
  - Send rejection email (optional)
  - Return success message

---

### 27. Get Workspace Messages
**File:** `/components/WorkspaceChat.tsx` (Line 50)  
**Function:** `loadMessages()`

**API Endpoint:** `GET /api/workspaces/:workspaceId/messages`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
?limit=50&before=message-id-123
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg-123",
      "workspaceId": "workspace-456",
      "userId": "user-789",
      "userName": "John Doe",
      "text": "Hello everyone!",
      "timestamp": "2024-12-21T14:30:00Z"
    }
  ],
  "hasMore": true,
  "count": 50
}
```

**Frontend Integration:**
```typescript
// File: /components/WorkspaceChat.tsx (Line 50)
const loadMessages = async (workspaceId: string, before?: string) => {
  const token = localStorage.getItem('authToken');
  
  setIsLoadingMessages(true);
  
  try {
    let url = `${API_URL}/api/workspaces/${workspaceId}/messages?limit=50`;
    if (before) {
      url += `&before=${before}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (before) {
        // Prepend older messages
        setMessages([...data.messages, ...messages]);
      } else {
        // Initial load
        setMessages(data.messages);
      }
      setHasMoreMessages(data.hasMore);
    } else {
      toast.error('Failed to load messages');
    }
  } catch (error) {
    console.error('Failed to load messages:', error);
    toast.error('Network error');
  } finally {
    setIsLoadingMessages(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify user is member of workspace
- Query messages by workspaceId
- Apply pagination (limit and before cursor)
- Sort by timestamp descending
- Return messages with hasMore flag

---

<a name="chat-collaboration"></a>
## 💬 Chat & Collaboration (2 Endpoints)

### 28. Send Chat Message
**File:** `/components/WorkspaceChat.tsx` (Line 120)  
**Function:** `handleSendMessage()`

**API Endpoint:** `POST /api/workspaces/:workspaceId/messages`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Hello everyone!",
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg-456",
    "workspaceId": "workspace-789",
    "userId": "user-123",
    "userName": "John Doe",
    "text": "Hello everyone!",
    "timestamp": "2024-12-21T15:00:00Z"
  }
}
```

**Frontend Integration:**
```typescript
// File: /components/WorkspaceChat.tsx (Line 120)
const handleSendMessage = async (text: string) => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  if (!text.trim()) return;
  
  try {
    const response = await fetch(
      `${API_URL}/api/workspaces/${workspaceId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text.trim(),
          userId: userId
        })
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      // Message will be received via WebSocket
      // No need to manually add here
      setInputText('');
    } else {
      toast.error('Failed to send message');
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    toast.error('Network error');
  }
};
```

**WebSocket Integration:**
```typescript
// File: /components/WorkspaceChat.tsx
import websocketService from '../services/websocket';

useEffect(() => {
  // Connect to WebSocket
  const token = localStorage.getItem('authToken');
  if (token) {
    websocketService.connect(token);
    websocketService.joinWorkspace(workspaceId);
  }

  // Listen for new messages
  const handleNewMessage = (message: any) => {
    setMessages(prev => [...prev, message]);
    scrollToBottom();
  };

  websocketService.on('new_message', handleNewMessage);

  // Cleanup
  return () => {
    websocketService.off('new_message', handleNewMessage);
    websocketService.leaveWorkspace(workspaceId);
  };
}, [workspaceId]);
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify user is member of workspace
- Sanitize message text
- Create message record
- Broadcast via WebSocket to all workspace members
- Return created message

**WebSocket Server Example:**
```javascript
// Backend WebSocket
io.on('connection', (socket) => {
  socket.on('join_workspace', ({ workspaceId }) => {
    socket.join(`workspace-${workspaceId}`);
  });
  
  socket.on('send_message', async (data) => {
    const message = await createMessage(data);
    io.to(`workspace-${data.workspaceId}`).emit('new_message', message);
  });
});
```

---

### 29. Get Collaboration Board Tasks
**File:** `/components/CollaborationBoard.tsx` (Line 312)  
**Function:** `loadBoardTasks()`

**API Endpoint:** `GET /api/workspaces/:workspaceId/board/tasks`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "board-task-123",
      "title": "Review Chapter 5",
      "description": "Complete review questions",
      "status": "in-progress",
      "assignedTo": "user-456",
      "assignedToName": "Jane Smith",
      "dueDate": "2024-01-20",
      "priority": "high",
      "createdBy": "user-123",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 12
}
```

**Frontend Integration:**
```typescript
// File: /components/CollaborationBoard.tsx (Line 312)
const loadBoardTasks = async (workspaceId: string) => {
  const token = localStorage.getItem('authToken');
  
  setIsLoadingTasks(true);
  
  try {
    const response = await fetch(
      `${API_URL}/api/workspaces/${workspaceId}/board/tasks`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      // Group tasks by status
      const grouped = {
        todo: data.tasks.filter(t => t.status === 'todo'),
        'in-progress': data.tasks.filter(t => t.status === 'in-progress'),
        done: data.tasks.filter(t => t.status === 'done')
      };
      setTasks(grouped);
    } else {
      toast.error('Failed to load board tasks');
    }
  } catch (error) {
    console.error('Failed to load board tasks:', error);
    toast.error('Network error');
  } finally {
    setIsLoadingTasks(false);
  }
};
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify user is member of workspace
- Query board tasks by workspaceId
- Include assignee details
- Sort by priority and dueDate
- Return tasks array

---

<a name="notifications"></a>
## 🔔 Notifications (1 Endpoint)

### 30. Get Notifications
**File:** `/components/Navigation.tsx` (Line 150)  
**Function:** `loadNotifications()`

**API Endpoint:** `GET /api/users/:userId/notifications`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
?unreadOnly=true&limit=20
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif-123",
      "userId": "user-456",
      "type": "workspace_invite",
      "title": "Workspace Invitation",
      "message": "You've been invited to 'Study Group 2024'",
      "read": false,
      "createdAt": "2024-12-21T10:00:00Z",
      "actionUrl": "/workspace/789"
    },
    {
      "id": "notif-124",
      "userId": "user-456",
      "type": "task_due_soon",
      "title": "Task Due Tomorrow",
      "message": "Complete Assignment 1 is due tomorrow",
      "read": false,
      "createdAt": "2024-12-21T09:00:00Z",
      "actionUrl": "/dashboard"
    }
  ],
  "unreadCount": 5,
  "count": 20
}
```

**Frontend Integration:**
```typescript
// File: /components/Navigation.tsx (Line 150)
const loadNotifications = async () => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('authToken');
  
  if (!userId || !token) return;
  
  try {
    const response = await fetch(
      `${API_URL}/api/users/${userId}/notifications?unreadOnly=true&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
};

// Poll for new notifications every 30 seconds
useEffect(() => {
  loadNotifications();
  const interval = setInterval(loadNotifications, 30000);
  return () => clearInterval(interval);
}, []);
```

**WebSocket Integration for Real-time Notifications:**
```typescript
// File: /components/Navigation.tsx
import websocketService from '../services/websocket';

useEffect(() => {
  const token = localStorage.getItem('authToken');
  if (token) {
    websocketService.connect(token);
  }

  const handleNewNotification = (notification: any) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    toast.info(notification.message);
  };

  websocketService.on('new_notification', handleNewNotification);

  return () => {
    websocketService.off('new_notification', handleNewNotification);
  };
}, []);
```

**Backend Implementation Notes:**
- Validate JWT token
- Verify userId matches token
- Query notifications by userId
- Filter by read status if unreadOnly
- Apply limit for pagination
- Sort by createdAt descending
- Return notifications with unreadCount

**Notification Types:**
- `workspace_invite`: User invited to workspace
- `join_request`: New join request (for admins)
- `request_approved`: Join request approved
- `member_added`: New member added to workspace
- `task_due_soon`: Task due within 24 hours
- `task_assigned`: Task assigned to user
- `message_mention`: User mentioned in chat

---

<a name="database-schema"></a>
## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture TEXT,
  bio TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

---

### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  day INT NOT NULL CHECK (day >= 0 AND day <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL,
  location VARCHAR(255),
  instructor VARCHAR(255),
  week_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_week ON sessions(user_id, week_id);
CREATE INDEX idx_sessions_day ON sessions(day);
```

---

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  due_date DATE,
  priority VARCHAR(20),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  subject VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
```

---

### Workspaces Table
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
```

---

### Workspace Members Table
```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMP,
  UNIQUE(workspace_id, email)
);

CREATE INDEX idx_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_members_user ON workspace_members(user_id);
```

---

### Workspace Sharing Links Table
```sql
CREATE TABLE workspace_sharing_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  link_id VARCHAR(100) UNIQUE NOT NULL,
  access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('open', 'request')),
  allowed_domain VARCHAR(255),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  expires_at TIMESTAMP,
  disabled_at TIMESTAMP,
  disabled_by UUID REFERENCES users(id),
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMP
);

CREATE INDEX idx_sharing_links_link_id ON workspace_sharing_links(link_id);
CREATE INDEX idx_sharing_links_workspace ON workspace_sharing_links(workspace_id);
```

---

### Join Requests Table
```sql
CREATE TABLE workspace_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT,
  link_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  rejection_reason TEXT
);

CREATE INDEX idx_join_requests_workspace ON workspace_join_requests(workspace_id);
CREATE INDEX idx_join_requests_status ON workspace_join_requests(status);
```

---

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_workspace ON messages(workspace_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
```

---

### Board Tasks Table
```sql
CREATE TABLE board_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('todo', 'in-progress', 'done')),
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  priority VARCHAR(20),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_board_tasks_workspace ON board_tasks(workspace_id);
CREATE INDEX idx_board_tasks_status ON board_tasks(status);
```

---

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

<a name="testing-deployment"></a>
## 🧪 Testing & Deployment

### Testing Checklist

#### Authentication Tests
- [ ] Login with correct credentials
- [ ] Login with wrong password
- [ ] Login with non-existent email
- [ ] Signup with valid data
- [ ] Signup with existing email
- [ ] Google OAuth login
- [ ] Forgot password flow
- [ ] Reset password
- [ ] Email verification
- [ ] Token expiration
- [ ] Logout

#### Timetable Tests
- [ ] Load sessions by week
- [ ] Generate timetable
- [ ] Import from Excel
- [ ] Import from image (OCR)
- [ ] Drag and drop sessions
- [ ] Export to Google Calendar

#### Workspace Tests
- [ ] Create workspace
- [ ] Add member
- [ ] Generate sharing link
- [ ] Regenerate link
- [ ] Disable link
- [ ] Join via link (open mode)
- [ ] Join via link (request mode)
- [ ] Approve/reject requests
- [ ] Real-time chat
- [ ] Collaboration board

---

### Security Best Practices

#### JWT Token Security
```typescript
// Generate token with expiration
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Store in httpOnly cookie (backend sets)
res.cookie('authToken', token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000
});
```

#### Password Security
```javascript
// Hash password with bcrypt
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

#### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Max 100 requests per window
});

app.use('/api/', apiLimiter);
```

---

### Deployment Guide

#### Frontend (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Backend (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

#### Environment Variables
```bash
# Backend .env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=...
EMAIL_API_KEY=...
```

---

<a name="common-issues"></a>
## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
**Solution:**
```javascript
// Backend
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Issue 2: 401 Unauthorized
**Solution:**
```typescript
// Frontend - Check token
const token = localStorage.getItem('authToken');
if (!token) {
  window.location.href = '/login';
}
```

### Issue 3: Token Expired
**Solution:**
```typescript
// Implement token refresh
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  });
  const data = await response.json();
  localStorage.setItem('authToken', data.token);
};
```

---

## 📊 Migration Summary

### Total Integration Points: 30

| Feature | Endpoints |
|---------|-----------|
| Authentication | 7 |
| User Profile | 2 |
| Timetable | 4 |
| Tasks | 3 |
| Workspaces | 11 |
| Chat & Collaboration | 2 |
| Notifications | 1 |

### Files to Update: 10

1. `/components/AuthPage.tsx`
2. `/components/Dashboard.tsx`
3. `/components/CalendarView.tsx`
4. `/components/Settings.tsx`
5. `/components/Workspace.tsx`
6. `/components/TimetableResults.tsx`
7. `/components/ImportDialog.tsx`
8. `/components/JoinWorkspaceDialog.tsx`
9. `/components/WorkspaceChat.tsx`
10. `/components/CollaborationBoard.tsx`

---

## 🎯 Next Steps

1. **Set up backend server** (Node.js + Express)
2. **Create database** (PostgreSQL)
3. **Implement API endpoints** (use this guide)
4. **Update frontend components** (follow code examples)
5. **Test thoroughly** (use checklist)
6. **Deploy to production**

---

**Version:** 3.0  
**Last Updated:** December 21, 2024  
**Total Documentation:** 30 endpoints, 10 database tables, complete implementation guide

---
