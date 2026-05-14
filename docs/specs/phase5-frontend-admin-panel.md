# Phase 5: Frontend - Admin User Management Panel

## Intent

Provide administrators a comprehensive interface to manage all users in the system: view user list with filtering, manage individual users, invite new users, and control user status.

---

## Route

```
/admin/users
```

**Guards:** JWT Auth required, ADMIN role only

---

## Page Structure

```
┌────────────────────────────────────────────────────────────────┐
│  User Management                                                │
├────────────────────────────────────────────────────────────────┤
│  [+ Invite User]                            [Search...    ]    │
│                                                                 │
│  Filters: [Role ▼] [Status ▼] [Sort by ▼]                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Users Table ─────────────────────────────────────────────┐ │
│  │ Name         Email           Role    Status   Sessions  │ │
│  │ ─────────────────────────────────────────────────────────│ │
│  │ John Doe   john@ex.com    REVIEWER  Active     3    [⋮] │ │
│  │ Jane Doe   jane@ex.com    MASTER    Active     1    [⋮] │ │
│  │ Admin User admin@ex.com   ADMIN     Active     2    [⋮] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Showing 1-20 of 50           [<] [1] [2] [3] [>]              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌─ User Actions Menu (⋮) ─────────────────────────────┐
│  👁 View Details                                      │
│  ✏️ Edit User                                         │
│  🔑 Reset Password                                    │
│  ───────────────────────                              │
│  🚫 Deactivate                                        │
└───────────────────────────────────────────────────────┘

┌─ User Detail Side Panel ────────────────────────────┐
│                                        [×]           │
│  John Doe                                          │
│  john@example.com                                  │
│                                                        │
│  Role: [REVIEWER ▼]                                 │
│  Status: ● Active                                   │
│                                                        │
│  Sessions: 3 active                                 │
│  ├─ Chrome on Mac - Current                         │
│  ├─ Firefox on Windows                              │
│  └─ Safari on iPhone                               │
│                                                        │
│  Member since: January 1, 2024                      │
│                                                        │
│  [Deactivate]  [Reset Password]  [Close]            │
└─────────────────────────────────────────────────────┘
```

---

## Components

### Module Structure

```
apps/frontend/src/app/admin/users/
├── users.component.ts
├── users.component.html
├── users.component.scss
├── users.routes.ts
├── components/
│   ├── invite-user-dialog/
│   │   ├── invite-user-dialog.component.ts
│   │   ├── invite-user-dialog.component.html
│   │   └── invite-user-dialog.component.scss
│   └── user-detail-panel/
│       ├── user-detail-panel.component.ts
│       ├── user-detail-panel.component.html
│       └── user-detail-panel.component.scss
```

---

## Features

### 1. User List Table

**Columns:**
| Column | Sortable | Description |
|--------|----------|-------------|
| Name | Yes | User's display name |
| Email | Yes | User's email |
| Role | No | Role badge |
| Status | No | Active/Inactive badge |
| Sessions | No | Count of active sessions |
| Actions | No | Dropdown menu |

**Row Actions (⋮ menu):**
- View Details
- Edit User
- Reset Password
- Deactivate/Reactivate

### 2. Search & Filters

**Search Bar:**
- Debounced input (300ms)
- Searches name and email
- Minimum 2 characters

**Filter Dropdowns:**
- Role: All, REVIEWER, MASTER, ADMIN
- Status: All, Active, Inactive

**Sort Options:**
- Name (A-Z / Z-A)
- Email (A-Z / Z-A)
- Created Date (Newest / Oldest)

### 3. Pagination

**Config:**
- Default 20 per page
- Options: 10, 20, 50, 100
- Show range: "Showing 1-20 of 50"

### 4. Invite User Dialog

**Fields:**
| Field | Type | Validation |
|-------|------|------------|
| Name | InputText | Required, min 2 chars |
| Email | InputText | Required, valid email |
| Role | Dropdown | Required, REVIEWER/MASTER/ADMIN |

**Actions:**
- Cancel: Close dialog
- Send Invite: Call `POST /users/invite`

**Success:** Toast "Invitation sent to {email}", dialog closes
**Error:** Inline error message

### 5. User Detail Side Panel

**Sections:**
1. Header: Name, email, close button
2. Role: Dropdown to change role
3. Status: Badge (Active/Inactive)
4. Sessions: List of active sessions with revoke option
5. Actions: Deactivate, Reset Password, Close

**Edit Flow:**
1. Click role dropdown
2. Select new role
3. Auto-save with debounce (500ms)
4. API: `PATCH /users/:id`

### 6. Deactivate/Reactivate

**Deactivate:**
- Confirmation dialog: "Deactivate {name}? They will be logged out immediately."
- API: `POST /users/:id/deactivate`
- Update row status to "Inactive"
- Show toast: "{name} deactivated"

**Reactivate:**
- Same flow, different message
- API: `POST /users/:id/reactivate`

### 7. Reset Password

**Flow:**
1. Click "Reset Password" in actions menu
2. Confirmation dialog: "Reset password for {name}? A temporary password will be generated."
3. API: `POST /users/:id/reset-password`
4. Show success message with "Note: Temporary password must be communicated securely"

---

## UI Components (PrimeNG)

| Component | Usage |
|-----------|-------|
| Table | User list display |
| Paginator | Pagination controls |
| InputText | Search input |
| Dropdown | Filters, role selector |
| Dialog | Invite user dialog |
| Sidebar/Slide | User detail panel |
| Menu | Row action menu |
| Tag | Role/status badges |
| Button | Actions |
| Toast | Notifications |
| ConfirmDialog | Confirmations |
| Skeleton | Loading states |

---

## State Management

```typescript
interface AdminUsersState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  isPanelOpen: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  filters: {
    search: string;
    role: Role | null;
    isActive: boolean | null;
    sortBy: string;
    sortOrder: string;
  };
}
```

---

## API Integration

### Admin Users Service

```typescript
// admin-users.service.ts
listUsers(params: ListUsersDto): Observable<PaginatedUsers>
getUser(id: string): Observable<UserDetail>
inviteUser(data: InviteUserDto): Observable<User>
updateUser(id: string, data: UpdateUserDto): Observable<User>
deactivateUser(id: string): Observable<User>
reactivateUser(id: string): Observable<User>
resetPassword(id: string): Observable<void>
revokeUserSession(userId: string, sessionId: string): Observable<void>
```

---

## Acceptance Criteria

- [ ] Admin panel accessible at /admin/users for ADMIN role only
- [ ] User list loads with pagination (20 per page default)
- [ ] Search filters users by name or email
- [ ] Role filter shows only users of selected role
- [ ] Status filter shows active/inactive users
- [ ] Table columns are sortable
- [ ] Row actions menu opens on click
- [ ] View Details opens side panel
- [ ] Edit allows role change (auto-save)
- [ ] Invite User dialog validates and submits
- [ ] Deactivate shows confirmation and updates status
- [ ] Reactivate shows confirmation and updates status
- [ ] Reset Password shows confirmation
- [ ] All actions show loading states
- [ ] All actions show success/error toasts
- [ ] Empty state when no users found
- [ ] Responsive layout