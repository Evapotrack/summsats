import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('summSats', {
  // Password
  hasPassword: () => ipcRenderer.invoke('has-password'),
  setPassword: (password: string) => ipcRenderer.invoke('set-password', password),
  verifyPassword: (password: string) => ipcRenderer.invoke('verify-password', password),

  // Seed
  hasSeed: () => ipcRenderer.invoke('has-seed'),
  generateSeed: () => ipcRenderer.invoke('generate-seed'),
  storeSeed: (words: string[]) => ipcRenderer.invoke('store-seed', words),
  restoreSeed: (words: string[]) => ipcRenderer.invoke('restore-seed', words),

  // API Key
  hasApiKey: () => ipcRenderer.invoke('has-api-key'),
  setApiKey: (key: string) => ipcRenderer.invoke('set-api-key', key),

  // Project
  createProject: (config: unknown) => ipcRenderer.invoke('create-project', config),
  loadProject: () => ipcRenderer.invoke('load-project'),

  // Entries
  getEntryAddress: () => ipcRenderer.invoke('get-entry-address'),
  pollEntryPayment: (address: string) => ipcRenderer.invoke('poll-entry-payment', address),
  commitEntry: (text: string) => ipcRenderer.invoke('commit-entry', text),
  loadEntry: (number: number) => ipcRenderer.invoke('load-entry', number),
  exportSummary: () => ipcRenderer.invoke('export-summary'),

  // Bitcoin
  getBalance: () => ipcRenderer.invoke('get-balance'),
  getUtxos: () => ipcRenderer.invoke('get-utxos'),
  getFees: () => ipcRenderer.invoke('get-fees'),
  buildTransaction: (addr: string, amount: number, feeRate: number) =>
    ipcRenderer.invoke('build-transaction', addr, amount, feeRate),
  broadcastTransaction: (addr: string, amount: number, feeRate: number) =>
    ipcRenderer.invoke('broadcast-transaction', addr, amount, feeRate),

  // Util
  getNetworkType: () => ipcRenderer.invoke('get-network-type'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  copyToClipboard: (text: string) => ipcRenderer.invoke('copy-to-clipboard', text),
  lockApp: () => ipcRenderer.invoke('lock-app'),
  touchActivity: () => ipcRenderer.invoke('touch-activity'),
});

ipcRenderer.on('app-locked', () => {
  window.dispatchEvent(new CustomEvent('app-locked'));
});
