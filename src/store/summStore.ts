import { create } from 'zustand';
import type { AppView, ProjectData, UTXO, Denomination, NetworkType, SummaryTone } from '../types';

interface SummState {
  view: AppView;
  isUnlocked: boolean;
  isSetupComplete: boolean;
  networkType: NetworkType;
  denomination: Denomination;
  summaryTone: SummaryTone;

  // Project
  entryCount: number;
  summary: string | null;
  entropyHistory: number[];
  chainHashes: string[];
  pendingSummaryUpdate: boolean;

  // Write
  draftText: string;
  processingEntry: boolean;
  confirmationMessage: string | null;

  // Payment
  paymentAddress: string | null;
  paymentStatus: 'idle' | 'waiting' | 'detected' | 'confirmed';

  // Bitcoin
  balance: number;
  utxos: UTXO[];
  addressIndex: number;

  // Entry reading
  expandedEntry: number | null;
  readingEntry: { number: number; text: string } | null;

  autoLockMinutes: number;

  // Actions
  setView: (view: AppView) => void;
  setUnlocked: (v: boolean) => void;
  setSetupComplete: (v: boolean) => void;
  setNetworkType: (v: NetworkType) => void;
  setDenomination: (v: Denomination) => void;
  setSummaryTone: (v: SummaryTone) => void;
  setEntryCount: (v: number) => void;
  setSummary: (v: string | null) => void;
  setEntropyHistory: (v: number[]) => void;
  setChainHashes: (v: string[]) => void;
  setPendingSummaryUpdate: (v: boolean) => void;
  setDraftText: (v: string) => void;
  setProcessingEntry: (v: boolean) => void;
  setConfirmationMessage: (v: string | null) => void;
  setPaymentAddress: (v: string | null) => void;
  setPaymentStatus: (v: SummState['paymentStatus']) => void;
  setBalance: (v: number) => void;
  setUtxos: (v: UTXO[]) => void;
  setAddressIndex: (v: number) => void;
  setExpandedEntry: (v: number | null) => void;
  setReadingEntry: (v: SummState['readingEntry']) => void;
  setAutoLockMinutes: (v: number) => void;
  lockApp: () => void;
  formatAmount: (sats: number) => string;
}

export const useSummStore = create<SummState>((set, get) => ({
  view: 'setup',
  isUnlocked: false,
  isSetupComplete: false,
  networkType: 'testnet',
  denomination: 'sats',
  summaryTone: 'educational',
  entryCount: 0,
  summary: null,
  entropyHistory: [],
  chainHashes: [],
  pendingSummaryUpdate: false,
  draftText: '',
  processingEntry: false,
  confirmationMessage: null,
  paymentAddress: null,
  paymentStatus: 'idle',
  balance: 0,
  utxos: [],
  addressIndex: 0,
  expandedEntry: null,
  readingEntry: null,
  autoLockMinutes: 15,

  setView: (view) => set({ view }),
  setUnlocked: (isUnlocked) => set({ isUnlocked }),
  setSetupComplete: (isSetupComplete) => set({ isSetupComplete }),
  setNetworkType: (networkType) => set({ networkType }),
  setDenomination: (denomination) => set({ denomination }),
  setSummaryTone: (summaryTone) => set({ summaryTone }),
  setEntryCount: (entryCount) => set({ entryCount }),
  setSummary: (summary) => set({ summary }),
  setEntropyHistory: (entropyHistory) => set({ entropyHistory }),
  setChainHashes: (chainHashes) => set({ chainHashes }),
  setPendingSummaryUpdate: (pendingSummaryUpdate) => set({ pendingSummaryUpdate }),
  setDraftText: (draftText) => set({ draftText }),
  setProcessingEntry: (processingEntry) => set({ processingEntry }),
  setConfirmationMessage: (confirmationMessage) => set({ confirmationMessage }),
  setPaymentAddress: (paymentAddress) => set({ paymentAddress }),
  setPaymentStatus: (paymentStatus) => set({ paymentStatus }),
  setBalance: (balance) => set({ balance }),
  setUtxos: (utxos) => set({ utxos }),
  setAddressIndex: (addressIndex) => set({ addressIndex }),
  setExpandedEntry: (expandedEntry) => set({ expandedEntry }),
  setReadingEntry: (readingEntry) => set({ readingEntry }),
  setAutoLockMinutes: (autoLockMinutes) => set({ autoLockMinutes }),

  lockApp: () => set({
    isUnlocked: false,
    summary: null,
    entropyHistory: [],
    chainHashes: [],
    draftText: '',
    balance: 0,
    utxos: [],
    paymentAddress: null,
    paymentStatus: 'idle',
    expandedEntry: null,
    readingEntry: null,
    view: 'lock',
  }),

  formatAmount: (sats) => {
    const { denomination } = get();
    if (denomination === 'btc') return `${(sats / 100_000_000).toFixed(8)} BTC`;
    return `${sats.toLocaleString()} sats`;
  },
}));
