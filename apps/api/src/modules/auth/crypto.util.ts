import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 12 bytes for GCM

// Retrieve and derive a stable 32-byte key using SHA-256
const RAW_KEY = process.env.ENCRYPTION_KEY || 'super-secret-development-key-for-tai-platform-encryption';
const ENCRYPTION_KEY = createHash('sha256').update(RAW_KEY).digest();

/**
 * Encrypts cleartext into hex-encoded format using AES-256-GCM.
 * Output format: IV_hex:ciphertext_hex:authTag_hex
 */
export function encrypt(text: string): string {
  if (!text) return '';

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

/**
 * Decrypts hex-encoded formatted text back into cleartext.
 * Expected input format: IV_hex:ciphertext_hex:authTag_hex
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format. Expected iv:ciphertext:tag.');
  }

  const [ivHex, encryptedHex, tagHex] = parts;
  const iv = Buffer.from(ivHex!, 'hex');
  const tag = Buffer.from(tagHex!, 'hex');
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedHex!, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
