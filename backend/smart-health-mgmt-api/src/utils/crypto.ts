import crypto from 'crypto';

const KEY_BASE64 = process.env.MASTER_ENC_KEY_BASE64;
if (!KEY_BASE64) {
  console.error('❌ MASTER_ENC_KEY_BASE64 is missing in .env');
  throw new Error('MASTER_ENC_KEY_BASE64 is missing in .env');
}

const KEY = Buffer.from(KEY_BASE64, 'base64'); // 32 bytes

if (KEY.length !== 32) {
  console.error(`❌ MASTER_ENC_KEY_BASE64 must be 32 bytes (base64). Received: ${KEY.length} bytes`);
  throw new Error('MASTER_ENC_KEY_BASE64 must be 32 bytes (base64).');
}

export function encryptData(plain: Buffer | string) {
  const iv = crypto.randomBytes(12); // 96-bit recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    tag: authTag.toString('base64'),
  };
}

export function decryptData(payload: { iv: string; ciphertext: string; tag: string }) {
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString();
}

/**
 * Encrypts a string (e.g. user ID) and returns a single URL-safe string.
 * Format: base64(iv).base64(tag).base64(ciphertext) - period (.) is URL safe.
 */
export function encryptId(id: string): string {
  const encrypted = encryptData(id);
  // Using . as separator is safe in URLs and doesn't appear in base64
  return `${encrypted.iv.replace(/\//g, '_').replace(/\+/g, '-')}.${encrypted.tag.replace(/\//g, '_').replace(/\+/g, '-')}.${encrypted.ciphertext.replace(/\//g, '_').replace(/\+/g, '-')}`;
}

/**
 * Decrypts a string previously encrypted with encryptId.
 */
export function decryptId(packed: string): string {
  const parts = packed.split('.');
  if (parts.length !== 3) throw new Error('Invalid encrypted ID format');

  const [iv, tag, ciphertext] = parts.map(p => p.replace(/_/g, '/').replace(/-/g, '+'));
  return decryptData({ iv, tag, ciphertext });
}
