# Phase 1: Backend - Profile & Self-Service API

## Intent

Enable users to manage their own profile and security settings without admin intervention. This is foundational - all authenticated users need access to update their name, email, and change their password.

---

## API Endpoints

### 1. GET /auth/me

**Auth:** JWT required
**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "REVIEWER",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Implementation:** Already exists in `auth.service.ts:206-219`

---

### 2. PATCH /auth/me

**Auth:** JWT required
**Request Body:**
```json
{
  "name": "Jane Doe",        // optional, min 2 max 100 chars
  "email": "new@example.com" // optional, valid email, unique
}
```

**Response:** Updated user object (same as GET /auth/me)

**Validation:**
- At least one field must be provided
- Email must be unique (excluding current user)
- Email format validation

**Errors:**
- 400: No fields provided or validation failed
- 409: Email already in use

---

### 3. POST /auth/me/change-password

**Auth:** JWT required
**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "secureNewPass456"
}
```

**Validation:**
- currentPassword: required, must match existing
- newPassword: required, min 8, max 128 chars
- newPassword must differ from currentPassword

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Side Effects:**
- Revoke all existing refresh tokens (force re-login)
- Log activity

**Errors:**
- 400: Validation failed or new password same as current
- 401: Current password incorrect

---

## DTOs

Create `apps/api/src/modules/auth/dto/`:

### update-profile.dto.ts
```typescript
import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
```

### change-password.dto.ts
```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}
```

---

## Files to Create/Modify

1. **Create:** `apps/api/src/modules/auth/dto/update-profile.dto.ts`
2. **Create:** `apps/api/src/modules/auth/dto/change-password.dto.ts`
3. **Create:** `apps/api/src/modules/auth/dto/index.ts`
4. **Modify:** `apps/api/src/modules/auth/auth.controller.ts` - Add PATCH /me and POST /me/change-password
5. **Modify:** `apps/api/src/modules/auth/auth.service.ts` - Add updateProfile and changePassword methods

---

## Acceptance Criteria

- [ ] Authenticated user can view their own profile
- [ ] Authenticated user can update their name
- [ ] Authenticated user can update their email (with uniqueness check)
- [ ] Authenticated user can change their password with current password verification
- [ ] Password change revokes all existing sessions
- [ ] All validation errors return proper 400 responses
- [ ] Email uniqueness excludes current user's email
- [ ] Unit tests for service methods