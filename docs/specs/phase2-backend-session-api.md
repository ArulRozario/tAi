# Phase 2: Backend - Session Management API

## Intent

Allow users to view and manage their active login sessions for security purposes. Users can see where they're logged in and revoke sessions they no longer trust.

---

## API Endpoints

### 1. GET /auth/me/sessions

**Auth:** JWT required

**Query Params:**
```typescript
{
  page?: number;  // default 1
  limit?: number;  // default 10, max 50
}
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": "2024-01-08T00:00:00.000Z",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1",
      "isCurrent": true
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

**Notes:**
- `isCurrent` is true for the session associated with the current access token
- Expired sessions are excluded from the list
- Sort by createdAt descending (newest first)

---

### 2. DELETE /auth/me/sessions/:id

**Auth:** JWT required
**Path Params:** `id` - session UUID

**Response:**
```json
{
  "message": "Session revoked successfully"
}
```

**Validation:**
- Session must belong to the authenticated user
- Cannot revoke current session via this endpoint (use /auth/logout instead)

**Errors:**
- 404: Session not found or doesn't belong to user
- 400: Cannot revoke current session (use logout endpoint)

---

## DTOs

Create `apps/api/src/modules/auth/dto/`:

### get-sessions.dto.ts
```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetSessionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
```

---

## Files to Create/Modify

1. **Create:** `apps/api/src/modules/auth/dto/get-sessions.dto.ts`
2. **Modify:** `apps/api/src/modules/auth/auth.controller.ts` - Add GET and DELETE endpoints
3. **Modify:** `apps/api/src/modules/auth/auth.service.ts` - Add getSessions and revokeSession methods

---

## Acceptance Criteria

- [ ] User can list all their active sessions with pagination
- [ ] Each session shows device/browser info (user agent)
- [ ] Current session is marked with `isCurrent: true`
- [ ] User can revoke any of their own sessions (except current)
- [ ] Revoking a session invalidates its refresh token
- [ ] Expired sessions are automatically excluded
- [ ] User cannot access other users' sessions
- [ ] Unit tests for service methods

---

## Security Considerations

1. User agent and IP are captured at session creation time (login)
2. These fields may be null if not available from request
3. Session list is always filtered by authenticated user ID
4. No admin endpoint to view/manage other users' sessions (by design)