import React from 'react';
import { useSummStore } from '../store/summStore';
import { HelpLink } from './HelpLink';

export function SettingsView() {
  const { networkType, denomination, setDenomination, autoLockMinutes, setAutoLockMinutes } = useSummStore();

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>Settings</h2>
        <HelpLink />
      </div>
      <div className="space-y-6">
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Project</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
            <span className="text-gray-300 text-sm">Entry Cost</span>
            <span className="text-white font-mono text-sm">1,000 sats</span>
          </div>
        </section>
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Display</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
            <span className="text-gray-300 text-sm">Denomination</span>
            <div className="flex bg-gray-800 rounded-lg overflow-hidden">
              <button onClick={() => setDenomination('sats')}
                className={`px-3 py-1 text-sm ${denomination === 'sats' ? 'bg-amber-700 text-white' : 'text-gray-400'}`}>sats</button>
              <button onClick={() => setDenomination('btc')}
                className={`px-3 py-1 text-sm ${denomination === 'btc' ? 'bg-amber-700 text-white' : 'text-gray-400'}`}>BTC</button>
            </div>
          </div>
        </section>
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Security</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
            <span className="text-gray-300 text-sm">Auto-Lock Timer</span>
            <select value={autoLockMinutes} onChange={e => setAutoLockMinutes(parseInt(e.target.value))}
              className="bg-gray-800 border-none text-white text-sm rounded px-2 py-1 focus:outline-none">
              <option value={5}>5 min</option><option value={10}>10 min</option><option value={15}>15 min</option>
              <option value={30}>30 min</option><option value={60}>60 min</option>
            </select>
          </div>
        </section>
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Network</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
            <span className="text-gray-300 text-sm">Network</span>
            <span className={`text-sm font-semibold ${networkType === 'testnet' ? 'text-amber-600' : 'text-white'}`}>
              {networkType === 'testnet' ? 'Testnet' : 'Mainnet'}
            </span>
          </div>
        </section>
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">About</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
              <span className="text-gray-300 text-sm">Version</span>
              <span className="text-gray-400 text-sm">0.1.0</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
              <span className="text-gray-300 text-sm">Repository</span>
              <span className="text-gray-400 text-xs font-mono">github.com/Evapotrack/summsats</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
