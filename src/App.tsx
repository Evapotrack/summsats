import React, { useEffect, useState } from 'react';
import { useSummStore } from './store/summStore';
import { SetupWizard } from './components/SetupWizard';
import { Sidebar } from './components/Sidebar';
import { WriteView } from './components/WriteView';
import { PaymentScreen } from './components/PaymentScreen';
import { SummaryView } from './components/SummaryView';
import { EntriesView } from './components/EntriesView';
import { WalletView } from './components/WalletView';
import { SettingsView } from './components/SettingsView';
import { HowTo } from './components/HowTo';

export function App() {
  const { view, setView, setSetupComplete, isUnlocked, setUnlocked, lockApp,
    setEntryCount, setSummary, setEntropyHistory, setChainHashes, setNetworkType,
    setAddressIndex, setPendingSummaryUpdate, setAutoLockMinutes, setDenomination, setSummaryTone } = useSummStore();
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    (async () => {
      const hasSeed = await window.summSats.hasSeed();
      const hasPass = await window.summSats.hasPassword();
      if (hasSeed && hasPass) { setSetupComplete(true); setView('lock'); }
      else setView('setup');
      setLoading(false);
    })();
    const handleLock = () => lockApp();
    window.addEventListener('app-locked', handleLock);
    return () => window.removeEventListener('app-locked', handleLock);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400"><div className="text-lg">Loading...</div></div>;
  }

  if (view === 'setup') {
    return <SetupWizard onComplete={() => { setSetupComplete(true); setView('lock'); }} />;
  }

  if (view === 'lock' || !isUnlocked) {
    return (
      <div className="flex flex-col h-screen bg-gray-950">
        <div className="h-8 shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm px-8 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>SummSats</h1>
              <p className="text-gray-500 text-sm">Enter your password</p>
            </div>
            <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-700" autoFocus />
            {passwordError && <p className="text-amber-600 text-sm">{passwordError}</p>}
            <button onClick={handleUnlock}
              className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors">
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleUnlock() {
    const valid = await window.summSats.verifyPassword(passwordInput);
    if (!valid) { setPasswordError('Incorrect password'); return; }
    setPasswordError(''); setPasswordInput('');
    try {
      const data = await window.summSats.loadProject();
      setEntryCount(data.entryCount);
      setSummary(data.summary);
      setEntropyHistory(data.entropyHistory);
      setChainHashes(data.chainHashes);
      setAddressIndex(data.addressIndex);
      setPendingSummaryUpdate(data.pendingSummaryUpdate);
      setNetworkType(data.config.networkType as 'testnet' | 'mainnet');
      setAutoLockMinutes(data.config.autoLockMinutes);
      setDenomination(data.config.denomination as 'sats' | 'btc');
      if (data.config.summaryTone) setSummaryTone(data.config.summaryTone as 'educational' | 'reflective' | 'philosophical');
      setUnlocked(true);
      setView('write');
    } catch { setPasswordError('Failed to load project'); }
  }

  const renderContent = () => {
    switch (view) {
      case 'payment': return <PaymentScreen />;
      case 'summary': return <SummaryView />;
      case 'entries': return <EntriesView />;
      case 'wallet': return <WalletView />;
      case 'settings': return <SettingsView />;
      case 'howto': return <HowTo />;
      case 'write': default: return <WriteView />;
    }
  };

  if (view === 'payment') return renderContent();

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className="h-8 shrink-0 bg-gray-900" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
