import * as crypto from 'crypto';
import * as fs from 'fs';
import * as zlib from 'zlib';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const HKDF_INFO = 'summsats-entry-key';

export function deriveKey(masterKey: Buffer, identifier: string): Buffer {
  return crypto.hkdfSync('sha256', masterKey, identifier, HKDF_INFO, 32) as unknown as Buffer;
}

export function encryptData(plaintext: Buffer, key: Buffer): Buffer {
  const compressed = zlib.deflateSync(plaintext);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

export function decryptData(ciphertext: Buffer, key: Buffer): Buffer {
  const iv = ciphertext.subarray(0, IV_LENGTH);
  const authTag = ciphertext.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = ciphertext.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  const compressed = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return zlib.inflateSync(compressed);
}

export function secureDelete(filePath: string): void {
  try {
    const stat = fs.statSync(filePath);
    fs.writeFileSync(filePath, crypto.randomBytes(stat.size));
    fs.unlinkSync(filePath);
  } catch {
    try { fs.unlinkSync(filePath); } catch { /* already deleted */ }
  }
}
