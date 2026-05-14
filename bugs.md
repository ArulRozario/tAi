# Known Issues & Bug Tracker

This document tracks identified bugs, security issues, and technical debt in the tAI backend.

## Fixed Issues

### Security

| ID | Date | Severity | Description | Location | Status |
|---|------|----------|-------------|----------|--------|
| SEC-001 | 2026-05-08 | CRITICAL | Hardcoded JWT secret fallback | `auth.module.ts:13` | FIXED |
| SEC-002 | 2026-05-08 | CRITICAL | Hardcoded encryption key fallback | `crypto.util.ts:7` | FIXED |
| SEC-003 | 2026-05-08 | HIGH | Email enumeration in forgotPassword | `auth.service.ts:160` | FIXED |
| SEC-004 | 2026-05-08 | HIGH | No rate limiting on auth endpoints | `auth.service.ts` | OPEN |
| SEC-005 | 2026-05-08 | HIGH | Console logging of reset tokens | `auth.service.ts:177-180` | FIXED |

### Logic Bugs

| ID | Date | Severity | Description | Location | Status |
|---|------|----------|-------------|----------|--------|
| LOG-001 | 2026-05-08 | CRITICAL | Race condition in Translation Memory indexing | `memory.service.ts:69-87` | FIXED |
| LOG-002 | 2026-05-08 | CRITICAL | Lost job lock in worker polling | `job.worker.ts:105-126` | FIXED |
| LOG-003 | 2026-05-08 | HIGH | Unsafe payload type casting | `agent.orchestrator.ts:106` | FIXED |
| LOG-004 | 2026-05-08 | HIGH | Unsafe payload in export jobs | `job.worker.ts:259,269` | OPEN |

### Code Quality

| ID | Date | Severity | Description | Location | Status |
|---|------|----------|-------------|----------|--------|
| CODE-001 | 2026-05-08 | MEDIUM | CommonJS require for pdfkit | `export.service.ts:6` | OPEN |

---

## Pending Issues (Not Fixed)

### SEC-004: No Rate Limiting

**Location**: `apps/api/src/modules/auth/auth.service.ts`

**Description**: Auth endpoints (login, refresh, forgotPassword) lack rate limiting, vulnerable to brute-force attacks.

**Fix Required**: Implement rate limiting middleware (e.g., `nestjs-rate-limiter` or express-rate-limit).

---

### LOG-004: Unsafe Payload in Export Jobs

**Location**: `apps/api/src/modules/jobs/job.worker.ts:259,269`

**Description**: Export job payloads are cast without validation:

```typescript
// job.worker.ts:259
const { format, scope } = job.payload as { format: string; scope: string };
```

**Fix Required**: Add runtime validation using zod or class-validator.

---

### CODE-001: CommonJS require

**Location**: `apps/api/src/modules/export/export.service.ts:6`

**Description**: Uses CommonJS require:

```typescript
const PDFDocument = require('pdfkit');
```

**Fix Required**: Use dynamic import:

```typescript
const PDFDocument = (await import('pdfkit')).default;
```

**Risk**: If `JWT_SECRET` env var is not set, tokens can be forged.

**Fix**: Throw error if env var missing in production mode.

---

### SEC-002: Hardcoded Encryption Key

**Location**: `apps/api/src/modules/auth/crypto.util.ts`

**Description**: Encryption key uses hardcoded fallback:
```typescript
const RAW_KEY = process.env.ENCRYPTION_KEY || 'super-secret-development-key-for-tai-platform-encryption';
```

**Risk**: Stored sensitive data can be decrypted with known key.

**Fix**: Throw error if env var missing in production mode.

---

### SEC-003: Email Enumeration

**Location**: `apps/api/src/modules/auth/auth.service.ts:160-165`

**Description**: `forgotPassword` reveals whether email exists:
```typescript
if (!user) {
  this.logger.warn(`Password reset requested for non-existent email: ${email}`);
  return;
}
```

**Risk**: Attackers can enumerate valid user emails.

**Fix**: Return same response whether email exists or not.

---

### SEC-004: No Rate Limiting

**Location**: `apps/api/src/modules/auth/auth.service.ts`

**Description**: Auth endpoints (login, refresh, forgotPassword) lack rate limiting.

**Risk**: Brute-force attacks on credentials.

**Fix**: Implement rate limiting (e.g., `nestjs-rate-limiter`).

---

### SEC-005: Console Logging of Reset Tokens

**Location**: `apps/api/src/modules/auth/auth.service.ts:176-180`

**Description**: JWT reset token logged to console:
```typescript
this.logger.log(`Token: ${resetToken}`);
this.logger.log(`Link: http://localhost:4200/reset-password/${resetToken}`);
```

**Risk**: Token exposed in logs.

**Fix**: Remove token logging or use secure logging.

---

### LOG-001: Race Condition in Translation Memory

**Location**: `apps/api/src/modules/agents/memory.service.ts:69-87`

**Description**: Parallel transaction operations:
```typescript
await this.prisma.$transaction([
  this.prisma.translationMemory.create({...}),
  this.prisma.$executeRawUnsafe(`UPDATE ... WHERE id = (SELECT id ...)`)
]);
```

**Risk**: UPDATE may miss the just-inserted record.

**Fix**: Use sequential transaction with returned ID.

---

### LOG-002: Lost Job Lock

**Location**: `apps/api/src/modules/jobs/job.worker.ts:105-126`

**Description**: SELECT runs inside tx, UPDATE runs after tx commits:
```typescript
const result = await tx.$queryRaw`SELECT ... FOR UPDATE SKIP LOCKED`;
return tx.job.update({ where: { id: targetId }, ... });
```

**Risk**: Another worker can grab job between SELECT and UPDATE.

**Fix**: Single atomic UPDATE...RETURNING query.

---

### LOG-003: Unsafe Payload Type Casting

**Location**: `apps/api/src/modules/agents/agent.orchestrator.ts:106`

**Description**: Unsafe cast without validation:
```typescript
const payload = job.payload as { projectId: string; pageIds: string[] };
```

**Risk**: Runtime crash if payload malformed.

**Fix**: Add runtime validation (zod/class-validator).

---

### LOG-004: Unsafe Payload in Export Jobs

**Location**: `apps/api/src/modules/jobs/job.worker.ts:259,269`

**Description**: Export job payloads cast without validation:
```typescript
const { format, scope } = job.payload as { format: string; scope: string };
```

**Risk**: Runtime crash if payload malformed.

**Fix**: Add runtime validation.

---

### CODE-001: CommonJS require

**Location**: `apps/api/src/modules/export/export.service.ts:6`

**Description**: Uses CommonJS require:
```typescript
const PDFDocument = require('pdfkit');
```

**Risk**: Inconsistent with ESM codebase.

**Fix**: Use dynamic import:
```typescript
const PDFDocument = (await import('pdfkit')).default;
```