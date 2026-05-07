import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Hash a password using native Node.js crypto scrypt key derivation.
 * Format returned is "salt:hash" in hexadecimal format.
 */
export function hashPassword(password: string): string {
  // Generate a cryptographically secure 16-byte salt
  const salt = randomBytes(16).toString('hex');
  
  // Hash the password with the salt (using standard scrypt key length of 64 bytes)
  const hash = scryptSync(password, salt, 64).toString('hex');
  
  // Store both the salt and the hash separated by a colon
  return `${salt}:${hash}`;
}

/**
 * Compare a plaintext password against a stored native crypto scrypt hash.
 * Uses timingSafeEqual to guard against timing analysis side-channel attacks.
 */
export function comparePassword(password: string, storedHash: string): boolean {
  if (!storedHash) {
    return false;
  }

  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) {
    // If the stored hash is not in the correct format (e.g. legacy cleartext password), return false
    return false;
  }

  // Derive the hash from the candidate password using the stored salt
  const verifyHash = scryptSync(password, salt, 64).toString('hex');

  // Convert hashes to buffers for timing-safe comparison
  const originalBuffer = Buffer.from(originalHash, 'hex');
  const verifyBuffer = Buffer.from(verifyHash, 'hex');

  // Prevent timing attacks by checking both buffers in timing-safe constant time
  if (originalBuffer.length !== verifyBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(originalBuffer, verifyBuffer);
}
