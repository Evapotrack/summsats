export type NetworkType = 'testnet' | 'mainnet';
export type Denomination = 'sats' | 'btc';
export type AppView = 'setup' | 'lock' | 'write' | 'payment' | 'summary' | 'entries' | 'wallet' | 'settings' | 'howto';

export interface AppConfig {
  networkType: NetworkType;
  dataFolderPath: string;
  autoLockMinutes: number;
  denomination: Denomination;
}

export interface EntryRecord {
  number: number;
  timestamp: number;
  textLength: number;
}

export interface ProjectData {
  entryCount: number;
  summary: string | null;
  entropyHistory: number[];
  chainHashes: string[];
  addressIndex: number;
  usedTxids: string[];
  pendingSummaryUpdate: boolean;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  address: string;
  confirmations: number;
  derivationIndex: number;
}

export interface TransactionDetail {
  inputs: Array<{ txid: string; vout: number; value: number }>;
  outputs: Array<{ address: string; value: number }>;
  fee: number;
  feeRate: number;
  totalIn: number;
  totalOut: number;
}

export interface StagedEntry {
  text: string;
  entryNumber: number;
}
