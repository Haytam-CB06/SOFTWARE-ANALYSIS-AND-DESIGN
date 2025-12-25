# Source Code Structure

This directory contains the organized source code for the Smart Studying Time Table Generator application.

## Directory Structure

```
src/
├── constants/       # Application constants and configuration
├── hooks/          # Custom React hooks for state management
├── pages/          # Page-level components and routing logic
├── services/       # Business logic and external service integrations
├── types/          # TypeScript type definitions
└── utils/          # Utility functions and helpers
```

## 📁 Folders

### `/constants`
Application-wide constants including:
- Days of the week
- Color mappings for UI and sessions
- Priority-to-type mappings
- LocalStorage keys

### `/hooks`
Custom React hooks for managing application state:
- `useAuth` - Authentication state and user management
- `useTimetables` - Timetable CRUD operations and session management
- `useDarkMode` - Dark mode toggle and persistence

### `/pages`
Page-level components:
- `PublicPages` - Routes for unauthenticated users (home, auth, terms, privacy)
- `DashboardPages` - Routes for authenticated users (dashboard, calendar, timetables, settings)

### `/services`
Service layer for external interactions:
- `storageService` - LocalStorage operations with proper typing

### `/types`
TypeScript type definitions:
- User, Session, Timetable interfaces
- Page and settings type unions
- Shared type definitions used across the app

### `/utils`
Utility functions organized by domain:
- `colorUtils` - Color conversion and mapping
- `dateUtils` - Date formatting and week calculations
- `scheduleUtils` - Schedule to session conversion and priority mapping

## 🎯 Design Principles

1. **Separation of Concerns**: Each folder has a single responsibility
2. **No Duplication**: Common logic is extracted into reusable hooks and utilities
3. **Type Safety**: Full TypeScript typing throughout
4. **Testability**: Pure functions and isolated logic for easy testing
5. **Maintainability**: Clear naming conventions and organized structure

## 🔄 Data Flow

```
App.tsx
  ↓
Custom Hooks (useAuth, useTimetables, useDarkMode)
  ↓
Services (storageService)
  ↓
LocalStorage
```

## 📝 Usage Example

```typescript
// In App.tsx
import { useAuth } from './src/hooks/useAuth';
import { useTimetables } from './src/hooks/useTimetables';

const { isAuthenticated, login, logout } = useAuth();
const { timetables, saveTimetable } = useTimetables();
```
