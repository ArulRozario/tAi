# Phase 4: Frontend - Profile & Settings Page

## Intent

Provide authenticated users a dedicated page to view and manage their profile information, change their password, and control their active login sessions.

---

## Route

```
/profile
```

**Guards:** JWT Auth required
**Layout:** Main layout with sidebar navigation

---

## Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  Profile & Settings                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Profile Information ─────────────────────────────┐ │
│  │  Name: [John Doe        ] [Edit]                   │ │
│  │  Email: [john@example.com] [Edit]                  │ │
│  │  Role: REVIEWER                                 │ │
│  │  Member since: January 1, 2024                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ Change Password ──────────────────────────────────┐ │
│  │  Current Password: [••••••••••]                    │ │
│  │  New Password: [••••••••••]                         │ │
│  │  Confirm Password: [••••••••••]                     │ │
│  │                         [Update Password]           │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ Active Sessions ───────────────────────────────────┐ │
│  │  Device/Browser        Location    Last Active  [X]│ │
│  │  ──────────────────────────────────────────────── │ │
│  │  Chrome on Mac         192.168...  2 hours ago [X]│ │
│  │  Firefox on Windows    10.0.0...   1 day ago   [X]│ │
│  │  Safari on iPhone      192.168...  Current     [—]│ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### Module Structure

```
apps/frontend/src/app/profile/
├── profile.component.ts
├── profile.component.html
├── profile.component.scss
└── profile.routes.ts
```

---

## Features

### 1. Profile Information Card

**Display:**
- Name (text)
- Email (text)
- Role badge (REVIEWER | MASTER | ADMIN)
- Created date formatted

**Edit Mode:**
- Click "Edit" to enable inline editing
- Save/Cancel buttons appear
- API: `PATCH /auth/me`

### 2. Change Password Form

**Fields:**
- Current Password (required)
- New Password (required, min 8 chars)
- Confirm New Password (required, must match)

**Validation:**
- Real-time match validation for confirm field
- Password strength indicator (optional)

**API:** `POST /auth/me/change-password`

**Success:** Show toast notification, clear form
**Error:** Show inline error message

### 3. Active Sessions List

**Table Columns:**
| Column | Description |
|--------|-------------|
| Device | User agent parsed (e.g., "Chrome on macOS") |
| Location | IP address (truncated) or "Unknown" |
| Last Active | Relative time (e.g., "2 hours ago") |
| Status | Badge: "Current" or "Active" |
| Actions | Revoke button (X) |

**Revoke Flow:**
1. Click revoke button
2. Confirmation dialog: "End this session?"
3. API: `DELETE /auth/me/sessions/:id`
4. Remove from list, show toast

**Note:** Current session cannot be revoked from this list

---

## UI Components (PrimeNG)

| Component | Usage |
|-----------|-------|
| Card | Section containers |
| InputText | Name, email fields |
| Password | All password fields |
| Button | Edit, Save, Cancel, Update |
| Table | Sessions list |
| Tag | Role badge, session status |
| Toast | Success/error notifications |
| ConfirmDialog | Session revoke confirmation |
| Messages | Validation errors |

---

## State Management

Use Angular services with signals or RxJS BehaviorSubject:

```typescript
interface ProfileState {
  user: User | null;
  isLoading: boolean;
  isEditing: boolean;
  error: string | null;
}

interface SessionState {
  sessions: Session[];
  isLoading: boolean;
  total: number;
}
```

---

## API Integration

### Profile Service

```typescript
// profile.service.ts
getProfile(): Observable<User>
updateProfile(data: UpdateProfileDto): Observable<User>
changePassword(data: ChangePasswordDto): Observable<void>
getSessions(params: GetSessionsDto): Observable<PaginatedSessions>
revokeSession(id: string): Observable<void>
```

---

## Acceptance Criteria

- [ ] Profile page accessible at /profile for authenticated users
- [ ] User can view their profile information
- [ ] User can edit their name with save/cancel
- [ ] User can edit their email with validation
- [ ] User can change password with current password verification
- [ ] User can view list of active sessions
- [ ] User can revoke any session except current
- [ ] All forms have proper validation feedback
- [ ] All actions show loading states
- [ ] Success/error toasts for all operations
- [ ] Responsive layout for mobile