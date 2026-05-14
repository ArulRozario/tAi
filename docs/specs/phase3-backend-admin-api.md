# Phase 3: Backend - Enhanced User Admin API

## Intent

Extend the existing user management API with pagination, search, filtering, sorting, and additional management operations. This provides admins with proper tooling to manage users at scale.

---

## API Endpoints

### 1. GET /users (Enhanced)

**Auth:** ADMIN or MASTER role required

**Query Params:**
```typescript
{
  page?: number;       // default 1
  limit?: number;      // default 20, max 100
  search?: string;     // search name or email (min 2 chars)
  role?: Role;         // REVIEWER | MASTER | ADMIN
  isActive?: boolean;  // true | false
  sortBy?: 'name' | 'email' | 'createdAt';  // default 'createdAt'
  sortOrder?: 'asc' | 'desc';              // default 'desc'
}
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "REVIEWER",
      "isActive": true,
      "sessionCount": 3,
      "lastActiveAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

**Notes:**
- `lastActiveAt` derived from most recent refresh token createdAt
- `sessionCount` is count of active refresh tokens for that user

---

### 2. GET /users/:id

**Auth:** ADMIN or MASTER role required
**Path Params:** `id` - user UUID

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "REVIEWER",
  "isActive": true,
  "sessionCount": 3,
  "activeSessions": [
    {
      "id": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": "2024-01-08T00:00:00.000Z",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- 404: User not found

---

### 3. POST /users/:id/deactivate

**Auth:** ADMIN only

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "REVIEWER",
  "isActive": false,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Side Effects:**
- Revoke all active sessions
- User cannot login after deactivation

**Errors:**
- 404: User not found
- 400: Cannot deactivate yourself
- 403: MASTER role cannot deactivate users

---

### 4. POST /users/:id/reactivate

**Auth:** ADMIN only

**Response:** Same as deactivate (with isActive: true)

**Errors:**
- 404: User not found
- 400: Cannot reactivate already active user

---

## DTOs

Create `apps/api/src/modules/users/dto/`:

### list-users.dto.ts
```typescript
import { IsOptional, IsInt, IsString, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

export class ListUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @MinLength(2)
  search?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['name', 'email', 'createdAt'])
  sortBy?: 'name' | 'email' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

---

## Files to Create/Modify

1. **Create:** `apps/api/src/modules/users/dto/list-users.dto.ts`
2. **Modify:** `apps/api/src/modules/users/users.controller.ts` - Enhanced endpoints
3. **Modify:** `apps/api/src/modules/users/users.service.ts` - Enhanced service methods

---

## Acceptance Criteria

- [ ] Admin can list users with pagination (20 per page default)
- [ ] Admin can search users by name or email
- [ ] Admin can filter by role and active status
- [ ] Admin can sort by name, email, or createdAt
- [ ] User list includes session count for each user
- [ ] Admin can view individual user details with active sessions
- [ ] Admin can deactivate user (revokes all sessions, prevents login)
- [ ] Admin can reactivate deactivated user
- [ ] Admin cannot deactivate themselves
- [ ] MASTER role has read-only access (cannot modify users)
- [ ] Unit tests for service methods