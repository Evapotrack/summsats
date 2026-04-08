import * as fs from 'fs';
import * as path from 'path';
import type { ProjectData } from '../types';
import { deriveKey, encryptData, decryptData } from './encryption';

const ENTRIES_DIR = 'entries';

export function initDataFolder(folderPath: string): void {
  const dataDir = path.join(folderPath, 'summsats-data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const entriesDir = path.join(dataDir, ENTRIES_DIR);
  if (!fs.existsSync(entriesDir)) fs.mkdirSync(entriesDir);
}

function dataPath(folderPath: string): string {
  return path.join(folderPath, 'summsats-data');
}

function entryFilename(entryNumber: number): string {
  return `${String(entryNumber).padStart(3, '0')}.enc`;
}

// Entry operations
export function saveEntry(folderPath: string, entryNumber: number, text: string, masterKey: Buffer): void {
  const key = deriveKey(masterKey, `entry-${entryNumber}`);
  const encrypted = encryptData(Buffer.from(text, 'utf-8'), key);
  const filePath = path.join(dataPath(folderPath), ENTRIES_DIR, entryFilename(entryNumber));
  fs.writeFileSync(filePath, encrypted);
}

export function loadEntry(folderPath: string, entryNumber: number, masterKey: Buffer): string {
  const key = deriveKey(masterKey, `entry-${entryNumber}`);
  const filePath = path.join(dataPath(folderPath), ENTRIES_DIR, entryFilename(entryNumber));
  const encrypted = fs.readFileSync(filePath);
  return decryptData(encrypted, key).toString('utf-8');
}

// Summary
export function saveSummary(folderPath: string, summary: string, masterKey: Buffer): void {
  const key = deriveKey(masterKey, 'summary');
  const encrypted = encryptData(Buffer.from(summary, 'utf-8'), key);
  fs.writeFileSync(path.join(dataPath(folderPath), 'summary.enc'), encrypted);
}

export function loadSummary(folderPath: string, masterKey: Buffer): string | null {
  const filePath = path.join(dataPath(folderPath), 'summary.enc');
  if (!fs.existsSync(filePath)) return null;
  const key = deriveKey(masterKey, 'summary');
  return decryptData(fs.readFileSync(filePath), key).toString('utf-8');
}

// Entropy history
export function saveEntropyHistory(folderPath: string, history: number[], masterKey: Buffer): void {
  const key = deriveKey(masterKey, 'entropy');
  const encrypted = encryptData(Buffer.from(JSON.stringify(history), 'utf-8'), key);
  fs.writeFileSync(path.join(dataPath(folderPath), 'entropy.enc'), encrypted);
}

export function loadEntropyHistory(folderPath: string, masterKey: Buffer): number[] {
  const filePath = path.join(dataPath(folderPath), 'entropy.enc');
  if (!fs.existsSync(filePath)) return [];
  const key = deriveKey(masterKey, 'entropy');
  return JSON.parse(decryptData(fs.readFileSync(filePath), key).toString('utf-8'));
}

// Hash chain
export function saveChain(folderPath: string, hashes: string[], masterKey: Buffer): void {
  const key = deriveKey(masterKey, 'chain');
  const encrypted = encryptData(Buffer.from(JSON.stringify(hashes), 'utf-8'), key);
  fs.writeFileSync(path.join(dataPath(folderPath), 'chain.enc'), encrypted);
}

export function loadChain(folderPath: string, masterKey: Buffer): string[] {
  const filePath = path.join(dataPath(folderPath), 'chain.enc');
  if (!fs.existsSync(filePath)) return [];
  const key = deriveKey(masterKey, 'chain');
  return JSON.parse(decryptData(fs.readFileSync(filePath), key).toString('utf-8'));
}

// Project data (metadata)
export function saveProjectData(folderPath: string, data: ProjectData, masterKey: Buffer): void {
  const key = deriveKey(masterKey, 'project');
  const encrypted = encryptData(Buffer.from(JSON.stringify(data), 'utf-8'), key);
  fs.writeFileSync(path.join(dataPath(folderPath), 'config.enc'), encrypted);
}

export function loadProjectData(folderPath: string, masterKey: Buffer): ProjectData | null {
  const filePath = path.join(dataPath(folderPath), 'config.enc');
  if (!fs.existsSync(filePath)) return null;
  try {
    const key = deriveKey(masterKey, 'project');
    return JSON.parse(decryptData(fs.readFileSync(filePath), key).toString('utf-8'));
  } catch {
    return null;
  }
}

export function hasProjectData(folderPath: string): boolean {
  return fs.existsSync(path.join(dataPath(folderPath), 'config.enc'));
}
