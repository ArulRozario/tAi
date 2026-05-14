# User Management System Specification

## Overview

Complete user management system for tAI translation platform, covering self-service profile management, session security, and admin user administration.

---

## User Model

```typescript
interface User {
  id: string;           // UUID
  email: string;       // unique, lowercase
  name: string;
  role: 'REVIEWER' | 'MASTER' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  id: string;           // UUID
  userId: string;
  token: string;        // refresh token
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;   // from request header
  ipAddress?: string;   // from request
}
```

---

## API Endpoints

### Auth & Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/login | Public | Login with email/password |
| POST | /auth/refresh | Public | Refresh access token |
| POST | /auth/logout | JWT | Logout (revoke refresh token) |
| GET | /auth/me | JWT | Get current user profile |
| PATCH | /auth/me | JWT | Update own profile (name, email) |
| POST | /auth/me/change-password | JWT | Change own password |
| GET | /auth/me/sessions | JWT | List own active sessions |
| DELETE | /auth/me/sessions/:id | JWT | Revoke own session |
| POST | /auth/forgot-password | Public | Request password reset |
| POST | /auth/reset-password | Public | Reset password with token |

### Admin User Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /users | ADMIN/MASTER | List all users (paginated) |
| GET | /users/:id | ADMIN/MASTER | Get user details |
| POST | /users/invite | ADMIN | Invite new user |
| PATCH | /users/:id | ADMIN | Update user (name, role, isActive) |
| POST | /users/:id/reset-password | ADMIN | Admin reset password |
| POST | /users/:id/deactivate | ADMIN | Deactivate user |
| POST | /users/:id/reactivate | ADMIN | Reactivate user |

---

## Phase Specifications

### Phase 1: Backend - Profile & Self-Service API

**Files to create:**
- `apps/api/src/modules/auth/dto/` - DTOs for profile endpoints

**Endpoints:**
1. `GET /auth/me` - Return current user (already exists in auth.service.ts:206-219)
2. `PATCH /auth/me` - Update name/email
3. `POST /auth/me/change-password` - Change password with current password verification

**DTOs:**
```typescript
UpdateProfileDto {
  name?: string;           // min 2, max 100 chars
  email?: string;          // valid email, unique check
}

ChangePasswordDto {
  currentPassword: string;  // required
  newPassword: string;      // min 8, max 128 chars
}
```

---

### Phase 2: Backend - Session Management API

**Files to modify:**
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`

**Endpoints:**
1. `GET /auth/me/sessions` - List user's active refresh tokens
2. `DELETE /auth/me/sessions/:id` - Revoke a specific session

**Response:**
```typescript
SessionResponse {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isCurrent: boolean;  // matches current session
}
```

---

### Phase 3: Backend - Enhanced User Admin API

**Files to modify:**
- `apps/api/src/modules/users/users.controller.ts`
- `apps/api/src/modules/users/users.service.ts`

**Enhancements:**
1. Add pagination to `GET /users`
2. Add search by name/email to `GET /users`
3. Add sorting options to `GET /users`
4. Add user details endpoint `GET /users/:id`
5. Add deactivate/reactivate endpoints
6. Include session count in user list response

**Query params for GET /users:**
```typescript
{
  page?: number;        // default 1
  limit?: number;       // default 20, max 100
  search?: string;      // name or email search
  role?: Role;         // filter by role
  isActive?: boolean;  // filter by status
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

---

### Phase 4: Frontend - Profile & Settings Page

**Route:** `/profile`

**Components:**
- `apps/frontend/src/app/profile/` - Module directory
  - `profile.component.ts` - Main component
  - `profile.component.html` - Template
  - `profile.component.scss` - Styles
  - `profile.routes.ts` - Routes

**Sections:**
1. Profile Info card (name, email, role display)
2. Edit Profile form (name, email with save button)
3. Change Password form (current + new password)
4. Active Sessions list with revoke buttons

**UI:** PrimeNG components (Card, InputText, Password, Button, Table)

---

### Phase 5: Frontend - Admin User Management Panel

**Route:** `/admin/users`

**Components:**
- `apps/frontend/src/app/admin/users/` - Module directory
  - `users.component.ts` - Main component
  - `users.component.html` - Template
  - `users.component.scss` - Styles
  - `users.routes.ts` - Routes

**Features:**
1. User list table with pagination
2. Search by name/email
3. Filter by role/active status
4. Sortable columns
5. Actions: Edit, Reset Password, Deactivate/Reactivate
6. Invite User dialog
7. User Detail side panel

**UI:** PrimeNG components (Table, Paginator, Dialog, Button, InputText, Dropdown, Tag)

---

## Security Requirements

1. Passwords: scrypt hash (existing), min 8 chars
2. New password must differ from current
3. Session revoke requires JWT auth (can't revoke other user's sessions)
4. Rate limiting on login attempts (handled by existing infrastructure)
5. Password reset tokens: 1 hour expiry, single use
6. Admin can only manage users, not elevate own role
7. Audit logging for user management actions (ActivityLog)

---

## Error Responses

All errors follow NestJS exception format:
```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
}
```

Key error codes:
- 400: Validation errors
- 401: Unauthenticated
- 403: Insufficient permissions
- 404: Resource not found
- 409: Conflict (email taken)
- 422: Business rule violation

---

## Implementation Order

1. **Phase 1:** Backend Profile API (foundation for frontend)
2. **Phase 2:** Backend Session API (security feature)
3. **Phase 3:** Backend Admin API enhancements
4. **Phase 4:** Frontend Profile page (user-facing)
5. **Phase 5:** Frontend Admin panel (admin-facing)