import React, { useEffect } from 'react';
import { useSummStore } from '../store/summStore';

export function Sidebar() {
  const { view, setView, networkType, entryCount, balance, formatAmount, lockApp, setBalance } = useSummStore();

  useEffect(() => {
    (async () => { try { setBalance(await window.summSats.getBalance()); } catch { /* ignore */ } })();
  }, [view]);

  const handleLock = async () => { await window.summSats.lockApp(); lockApp(); };

  const navItems: Array<{ id: string; label: string; view: 'write' | 'summary' | 'entries' | 'wallet' | 'export' | 'settings' | 'howto' }> = [
    { id: 'write', label: 'Write', view: 'write' },
    { id: 'summary', label: 'Summary', view: 'summary' },
    { id: 'entries', label: 'Entries', view: 'entries' },
    { id: 'wallet', label: 'Wallet', view: 'wallet' },
    { id: 'export', label: 'Export', view: 'export' },
    { id: 'settings', label: 'Settings', view: 'settings' },
    { id: 'howto', label: 'How To', view: 'howto' },
  ];

  return (
    <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col p-4 pt-2">
      {networkType === 'testnet' && (
        <div className="mb-3 px-2 py-1 bg-amber-700/20 text-amber-600 text-xs font-semibold rounded text-center">TESTNET</div>
      )}
      <nav className="space-y-1 flex-1">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setView(item.view)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === item.view ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="space-y-3 pt-4 border-t border-gray-800">
        <div className="text-center text-gray-500 text-xs font-mono">{entryCount} entries</div>
        <div className="text-center text-amber-700 font-mono text-sm">{formatAmount(balance)}</div>
        <button onClick={handleLock} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">Lock</button>
      </div>
    </aside>
  );
}
