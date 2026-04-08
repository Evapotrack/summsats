import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import * as fs from 'fs';
import * as keychain from './keychain';
import * as wallet from './bitcoin/wallet';
import * as utxoModule from './bitcoin/utxo';
import * as feesModule from './bitcoin/fees';
import * as txModule from './bitcoin/transactions';
import * as storage from './entries/storage';
import * as chain from './entries/chain';
import { generateSummary } from './ai/summarize';
import type { AppConfig, NetworkType, ProjectData } from './types';
import { setUseTor, getTorStatus } from './bitcoin/torFetch';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) app.quit();

let currentSeed: Buffer | null = null;
let currentMasterKey: Buffer | null = null;
let currentNetworkType: NetworkType = 'testnet';
let currentDataFolder: string | null = null;
let currentProject: ProjectData | null = null;
let currentConfig: AppConfig | null = null;
let autoLockTimer: ReturnType<typeof setTimeout> | null = null;
let mainWindow: BrowserWindow | null = null;

function clearSensitiveState(): void {
  if (currentSeed) { currentSeed.fill(0); currentSeed = null; }
  if (currentMasterKey) { currentMasterKey.fill(0); currentMasterKey = null; }
  currentProject = null;
  clipboard.clear();
}

function resetAutoLock(minutes: number): void {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  if (minutes <= 0) return;
  autoLockTimer = setTimeout(() => {
    clearSensitiveState();
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('app-locked'));
  }, minutes * 60 * 1000);
}

function getDerivedAddresses(): Array<{ address: string; index: number }> {
  if (!currentSeed || !currentProject) return [];
  const result: Array<{ address: string; index: number }> = [];
  for (let i = 0; i < currentProject.addressIndex; i++) {
    result.push({ address: wallet.deriveAddress(currentSeed, i, currentNetworkType).address, index: i });
  }
  return result;
}

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 700, width: 900, minWidth: 700, minHeight: 500,
    titleBarStyle: 'hiddenInset', center: true, backgroundColor: '#030712',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  });
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') && !url.includes('webpack')) event.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  if (process.env.NODE_ENV === 'development') mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);
app.on('window-all-closed', () => { clearSensitiveState(); if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('before-quit', () => clearSensitiveState());

// ===== PASSWORD =====
ipcMain.handle('has-password', () => keychain.hasPassword());
ipcMain.handle('set-password', (_e, password: string) => keychain.setPassword(password));
ipcMain.handle('verify-password', (_e, password: string) => keychain.checkPassword(password));

// ===== SEED =====
ipcMain.handle('has-seed', () => keychain.hasSeed());
ipcMain.handle('generate-seed', () => wallet.generateMnemonic().split(' '));
ipcMain.handle('store-seed', async (_e, words: string[]) => {
  const mnemonic = words.join(' ');
  if (!wallet.validateMnemonic(mnemonic)) throw new Error('Invalid mnemonic');
  keychain.storeSeed(mnemonic);
});
ipcMain.handle('restore-seed', async (_e, words: string[]) => {
  const mnemonic = words.join(' ');
  if (!wallet.validateMnemonic(mnemonic)) return false;
  keychain.storeSeed(mnemonic);
  return true;
});

// ===== API KEY =====
ipcMain.handle('has-api-key', () => keychain.hasApiKey());
ipcMain.handle('set-api-key', (_e, key: string) => keychain.storeApiKey(key));

// ===== PROJECT =====
ipcMain.handle('create-project', async (_e, config: AppConfig) => {
  currentNetworkType = config.networkType;
  currentDataFolder = config.dataFolderPath;
  currentConfig = config;
  setUseTor(config.useTor ?? false);
  keychain.storeConfig(JSON.stringify(config));
  try {
    storage.initDataFolder(currentDataFolder);
  } catch (err) {
    throw new Error(`Cannot create data folder: ${err instanceof Error ? err.message : 'unknown error'}`);
  }
  const mnemonic = keychain.getSeed();
  if (!mnemonic) throw new Error('No seed');
  const seed = await wallet.mnemonicToSeed(mnemonic);
  currentMasterKey = wallet.deriveMasterEncryptionKey(seed);
  currentSeed = seed;
  const project: ProjectData = {
    entryCount: 0, summary: null, entropyHistory: [], chainHashes: [],
    addressIndex: 0, usedTxids: [], pendingSummaryUpdate: false,
  };
  storage.saveProjectData(currentDataFolder, project, currentMasterKey);
  currentProject = project;
});

ipcMain.handle('load-project', async () => {
  const configStr = keychain.getConfig();
  if (!configStr) throw new Error('No config');
  const config: AppConfig = JSON.parse(configStr);
  currentConfig = config;
  currentNetworkType = config.networkType;
  currentDataFolder = config.dataFolderPath;
  setUseTor(config.useTor ?? false);
  const mnemonic = keychain.getSeed();
  if (!mnemonic) throw new Error('No seed');
  const seed = await wallet.mnemonicToSeed(mnemonic);
  currentMasterKey = wallet.deriveMasterEncryptionKey(seed);
  currentSeed = seed;
  const project = storage.loadProjectData(currentDataFolder, currentMasterKey);
  if (!project) throw new Error('Failed to decrypt project');
  currentProject = project;
  resetAutoLock(config.autoLockMinutes);
  const summary = storage.loadSummary(currentDataFolder, currentMasterKey);
  const entropyHistory = storage.loadEntropyHistory(currentDataFolder, currentMasterKey);
  const chainHashes = storage.loadChain(currentDataFolder, currentMasterKey);
  return { ...project, summary, entropyHistory, chainHashes, config };
});

// ===== ENTRIES =====
ipcMain.handle('get-entry-address', async () => {
  if (!currentSeed || !currentProject) throw new Error('Not ready');
  const idx = currentProject.addressIndex;
  const { address } = wallet.deriveAddress(currentSeed, idx, currentNetworkType);
  currentProject.addressIndex = idx + 1;
  if (currentDataFolder && currentMasterKey) {
    storage.saveProjectData(currentDataFolder, currentProject, currentMasterKey);
  }
  return { address, index: idx };
});

ipcMain.handle('poll-entry-payment', async (_e, address: string) => {
  const result = await utxoModule.checkPayment(address, 1500, currentNetworkType);
  if (result.found && result.confirmed && result.txid) {
    if (currentProject && currentProject.usedTxids.includes(result.txid)) {
      return { confirmed: false };
    }
    if (currentProject) {
      currentProject.usedTxids.push(result.txid);
      if (currentDataFolder && currentMasterKey) {
        storage.saveProjectData(currentDataFolder, currentProject, currentMasterKey);
      }
    }
    return { confirmed: true, txid: result.txid };
  }
  return { confirmed: false, detected: result.found };
});

ipcMain.handle('commit-entry', async (_e, entryText: string) => {
  if (!currentProject || !currentDataFolder || !currentMasterKey) throw new Error('Not ready');
  const entryNumber = currentProject.entryCount + 1;

  // 1. Encrypt and store entry
  storage.saveEntry(currentDataFolder, entryNumber, entryText, currentMasterKey);

  // 2. Hash chain
  const prevHash = currentProject.chainHashes.length > 0
    ? currentProject.chainHashes[currentProject.chainHashes.length - 1] : null;
  const entropyForHash = entryNumber >= 3 && currentProject.entropyHistory.length > 0
    ? currentProject.entropyHistory[currentProject.entropyHistory.length - 1] : null;
  const hash = chain.computeChainHash(entryText, prevHash, entropyForHash);
  currentProject.chainHashes.push(hash);
  storage.saveChain(currentDataFolder, currentProject.chainHashes, currentMasterKey);

  // 3. Update count
  currentProject.entryCount = entryNumber;

  // 4. AI summary (>= 2 entries)
  if (entryNumber >= 2) {
    try {
      const apiKey = keychain.getApiKey();
      if (!apiKey) throw new Error('No API key');
      const recentEntries: string[] = [];
      const startFrom = Math.max(1, entryNumber - 9);
      for (let i = startFrom; i < entryNumber; i++) {
        recentEntries.push(storage.loadEntry(currentDataFolder, i, currentMasterKey));
      }
      const existingSummary = entryNumber === 2 ? null
        : storage.loadSummary(currentDataFolder, currentMasterKey);
      const tone = currentConfig?.summaryTone ?? 'educational';
      const result = await generateSummary(apiKey, existingSummary, recentEntries, entryText, tone);
      if (result) {
        storage.saveSummary(currentDataFolder, result.summary, currentMasterKey);
        currentProject.summary = result.summary;
        const entropy = chain.shannonEntropy(result.summary);
        currentProject.entropyHistory.push(entropy);
        storage.saveEntropyHistory(currentDataFolder, currentProject.entropyHistory, currentMasterKey);
        currentProject.pendingSummaryUpdate = false;
      } else {
        currentProject.pendingSummaryUpdate = true;
      }
    } catch {
      currentProject.pendingSummaryUpdate = true;
    }
  }

  storage.saveProjectData(currentDataFolder, currentProject, currentMasterKey);
  return {
    entryNumber, entryCount: currentProject.entryCount, summary: currentProject.summary,
    entropyHistory: currentProject.entropyHistory, chainHashes: currentProject.chainHashes,
    pendingSummaryUpdate: currentProject.pendingSummaryUpdate,
  };
});

ipcMain.handle('load-entry', async (_e, entryNumber: number) => {
  if (!currentDataFolder || !currentMasterKey) throw new Error('Not ready');
  return storage.loadEntry(currentDataFolder, entryNumber, currentMasterKey);
});

ipcMain.handle('export-summary', async () => {
  if (!currentProject?.summary || !mainWindow) return false;
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'summsats-summary.txt', filters: [{ name: 'Text', extensions: ['txt'] }],
  });
  if (result.canceled || !result.filePath) return false;
  fs.writeFileSync(result.filePath, currentProject.summary, 'utf-8');
  return true;
});

// ===== BITCOIN =====
ipcMain.handle('get-balance', async () => {
  if (!currentSeed || !currentProject) return 0;
  return utxoModule.fetchBalance(getDerivedAddresses(), currentNetworkType);
});
ipcMain.handle('get-utxos', async () => {
  if (!currentSeed || !currentProject) return [];
  return utxoModule.fetchAllUtxos(getDerivedAddresses(), currentNetworkType);
});
ipcMain.handle('get-fees', () => feesModule.fetchFeeEstimates(currentNetworkType));

ipcMain.handle('build-transaction', async (_e, toAddress: string, amountSats: number, feeRate: number) => {
  if (!currentSeed || !currentProject) throw new Error('Not ready');
  if (!txModule.validateAddress(toAddress, currentNetworkType)) throw new Error('Invalid address');
  const utxos = await utxoModule.fetchAllUtxos(getDerivedAddresses(), currentNetworkType);
  const changeAddr = wallet.deriveChangeAddress(currentSeed, 0, currentNetworkType).address;
  const detail = txModule.buildTransactionDetail(utxos, toAddress, amountSats, feeRate, changeAddr, currentNetworkType);
  if (!detail) throw new Error('Insufficient funds');
  return detail;
});

ipcMain.handle('broadcast-transaction', async (_e, toAddress: string, amountSats: number, feeRate: number) => {
  if (!currentSeed || !currentProject) throw new Error('Not ready');
  const utxos = await utxoModule.fetchAllUtxos(getDerivedAddresses(), currentNetworkType);
  const changeAddr = wallet.deriveChangeAddress(currentSeed, 0, currentNetworkType).address;
  const seedCopy = Buffer.from(currentSeed);
  return txModule.signAndBroadcast(utxos, toAddress, amountSats, feeRate, changeAddr, seedCopy, currentNetworkType);
});

// ===== CONFIG =====
ipcMain.handle('set-summary-tone', (_e, tone: string) => {
  if (!currentConfig) return;
  currentConfig.summaryTone = tone as AppConfig['summaryTone'];
  keychain.storeConfig(JSON.stringify(currentConfig));
});

ipcMain.handle('set-use-tor', (_e, enabled: boolean) => {
  if (!currentConfig) return;
  currentConfig.useTor = enabled;
  setUseTor(enabled);
  keychain.storeConfig(JSON.stringify(currentConfig));
});

ipcMain.handle('set-auto-lock-minutes', (_e, minutes: number) => {
  if (!currentConfig) return;
  currentConfig.autoLockMinutes = minutes;
  keychain.storeConfig(JSON.stringify(currentConfig));
  resetAutoLock(minutes);
});

ipcMain.handle('set-denomination', (_e, denom: string) => {
  if (!currentConfig) return;
  currentConfig.denomination = denom as AppConfig['denomination'];
  keychain.storeConfig(JSON.stringify(currentConfig));
});

ipcMain.handle('get-config', () => currentConfig);

// ===== UTIL =====
ipcMain.handle('get-network-type', () => currentNetworkType);
ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] });
  if (result.canceled) return null;
  return result.filePaths[0];
});
ipcMain.handle('copy-to-clipboard', (_e, text: string) => {
  clipboard.writeText(text);
  setTimeout(() => { if (clipboard.readText() === text) clipboard.clear(); }, 60000);
});
ipcMain.handle('lock-app', () => clearSensitiveState());
ipcMain.handle('get-tor-status', () => getTorStatus());
ipcMain.handle('touch-activity', () => {
  const configStr = keychain.getConfig();
  if (configStr) { const c: AppConfig = JSON.parse(configStr); resetAutoLock(c.autoLockMinutes); }
});
