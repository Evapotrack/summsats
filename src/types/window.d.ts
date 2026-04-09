interface SummSatsAPI {
  hasPassword(): Promise<boolean>;
  setPassword(password: string): Promise<void>;
  verifyPassword(password: string): Promise<boolean>;
  hasSeed(): Promise<boolean>;
  generateSeed(): Promise<string[]>;
  storeSeed(words: string[]): Promise<void>;
  restoreSeed(words: string[]): Promise<boolean>;
  hasApiKey(): Promise<boolean>;
  setApiKey(key: string): Promise<void>;
  validateApiKey(key: string): Promise<{ valid: boolean; error?: string }>;
  createProject(config: unknown): Promise<void>;
  loadProject(): Promise<{
    entryCount: number; summary: string | null; entropyHistory: number[];
    chainHashes: string[]; addressIndex: number; usedTxids: string[];
    pendingSummaryUpdate: boolean; config: { networkType: string; dataFolderPath: string; autoLockMinutes: number; denomination: string; summaryTone?: string; useTor?: boolean };
  }>;
  setSummaryTone(tone: string): Promise<void>;
  setUseTor(enabled: boolean): Promise<void>;
  setAutoLockMinutes(minutes: number): Promise<void>;
  setDenomination(denom: string): Promise<void>;
  getTorStatus(): Promise<{ enabled: boolean; available: boolean }>;
  getConfig(): Promise<{ networkType: string; dataFolderPath: string; autoLockMinutes: number; denomination: string; summaryTone?: string; useTor?: boolean } | null>;
  getEntryAddress(): Promise<{ address: string; index: number }>;
  pollEntryPayment(address: string): Promise<{ confirmed: boolean; detected?: boolean; txid?: string }>;
  commitEntry(text: string): Promise<{
    entryNumber: number; entryCount: number; summary: string | null;
    entropyHistory: number[]; chainHashes: string[]; pendingSummaryUpdate: boolean; summaryError: string | null;
  }>;
  loadEntry(number: number): Promise<string>;
  exportSummary(includeEntries: boolean): Promise<boolean>;
  getBalance(): Promise<number>;
  getUtxos(): Promise<Array<{ txid: string; vout: number; value: number; address: string; confirmations: number; derivationIndex: number }>>;
  getFees(): Promise<{ fast: number; medium: number; slow: number }>;
  buildTransaction(addr: string, amount: number, feeRate: number): Promise<{
    inputs: Array<{ txid: string; vout: number; value: number }>;
    outputs: Array<{ address: string; value: number }>; fee: number; feeRate: number; totalIn: number; totalOut: number;
  }>;
  broadcastTransaction(addr: string, amount: number, feeRate: number): Promise<string>;
  getNetworkType(): Promise<string>;
  selectFolder(): Promise<string | null>;
  copyToClipboard(text: string): Promise<void>;
  lockApp(): Promise<void>;
  touchActivity(): Promise<void>;
}

declare global {
  interface Window {
    summSats: SummSatsAPI;
  }
}

export {};
