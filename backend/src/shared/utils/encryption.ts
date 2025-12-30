// ============================================
// Encryption Utilities - AES-256
// ============================================

import crypto from 'crypto';
import { env } from '../../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derive a key from the encryption key using PBKDF2
 */
const deriveKey = (salt: Buffer): Buffer => {
    return crypto.pbkdf2Sync(env.encryptionKey, salt, 100000, 32, 'sha256');
};

/**
 * Encrypt a string using AES-256-GCM
 */
export const encrypt = (text: string): string => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: salt:iv:authTag:encrypted
    return [
        salt.toString('hex'),
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted,
    ].join(':');
};

/**
 * Decrypt a string encrypted with AES-256-GCM
 */
export const decrypt = (encryptedText: string): string => {
    const parts = encryptedText.split(':');

    if (parts.length !== 4) {
        throw new Error('Invalid encrypted text format');
    }

    const [saltHex, ivHex, authTagHex, encrypted] = parts;

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = deriveKey(salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};

/**
 * Generate a random API key
 */
export const generateApiKey = (prefix = 'ai-http'): { key: string; keyPrefix: string } => {
    const randomPart = crypto.randomBytes(32).toString('hex');
    const key = `${prefix}_${randomPart}`;
    const keyPrefix = key.substring(0, 12);

    return { key, keyPrefix };
};

/**
 * Generate a random token (for email verification, password reset, etc.)
 */
export const generateRandomToken = (length = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a string using SHA-256
 */
export const hashString = (text: string): string => {
    return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Compare two strings in constant time (timing-safe)
 */
export const secureCompare = (a: string, b: string): boolean => {
    if (a.length !== b.length) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};
