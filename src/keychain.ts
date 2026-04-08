import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface SecureStore {
  seed?: string;
  passwordHash?: string;
  passwordSalt?: string;
  apiKey?: string;
  config?: string;
}

function getStorePath(): string {
  return path.join(app.getPath('userData'), 'secure-store.enc');
}

export function loadStore(): SecureStore {
  try {
    if (!safeStorage.isEncryptionAvailable()) return {};
    const storePath = getStorePath();
    if (!fs.existsSync(storePath)) return {};
    const encrypted = fs.readFileSync(storePath);
    const decrypted = safeStorage.decryptString(encrypted);
    return JSON.parse(decrypted);
  } catch {
    return {};
  }
}

export function saveStore(store: SecureStore): void {
  if (!safeStorage.isEncryptionAvailable()) return;
  const storePath = getStorePath();
  const json = JSON.stringify(store);
  const encrypted = safeStorage.encryptString(json);
  fs.writeFileSync(storePath, encrypted);
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(32).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return { hash, salt: s };
}

export function setPassword(password: string): void {
  const store = loadStore();
  const { hash, salt } = hashPassword(password);
  store.passwordHash = hash;
  store.passwordSalt = salt;
  saveStore(store);
}

export function checkPassword(password: string): boolean {
  const store = loadStore();
  if (!store.passwordHash || !store.passwordSalt) return false;
  const { hash } = hashPassword(password, store.passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(store.passwordHash, 'hex'));
}

export function hasPassword(): boolean {
  return !!loadStore().passwordHash;
}

export function storeSeed(mnemonic: string): void {
  const store = loadStore();
  store.seed = mnemonic;
  saveStore(store);
}

export function getSeed(): string | null {
  return loadStore().seed || null;
}

export function hasSeed(): boolean {
  return !!getSeed();
}

export function storeApiKey(key: string): void {
  const store = loadStore();
  store.apiKey = key;
  saveStore(store);
}

export function getApiKey(): string | null {
  return loadStore().apiKey || null;
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export function storeConfig(config: string): void {
  const store = loadStore();
  store.config = config;
  saveStore(store);
}

export function getConfig(): string | null {
  return loadStore().config || null;
}
