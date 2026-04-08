import React, { useEffect, useState } from 'react';
import { useSummStore } from '../store/summStore';
import { HelpLink } from './HelpLink';
import type { SummaryTone } from '../types';

export function SettingsView() {
  const { networkType, denomination, setDenomination, autoLockMinutes, setAutoLockMinutes, summaryTone, setSummaryTone } = useSummStore();
  const [useTor, setUseTor] = useState(false);

  useEffect(() => {
    (async () => {
      const config = await window.summSats.getConfig();
      if (config) setUseTor(config.useTor ?? false);
    })();
  }, []);

  const handleTorToggle = async () => {
    const next = !useTor;
    setUseTor(next);
    await window.summSats.setUseTor(next);
  };

  const handleToneChange = async (tone: SummaryTone) => {
    setSummaryTone(tone);
    await window.summSats.setSummaryTone(tone);
  };

  const tones: Array<{ value: SummaryTone; label: string; desc: string }> = [
    { value: 'educational', label: 'Educational', desc: 'Structured and analytical' },
    { value: 'reflective', label: 'Reflective', desc: 'Introspective and personal' },
    { value: 'philosophical', label: 'Philosophical', desc: 'Abstract and probing' },
  ];

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>Settings</h2>
        <HelpLink />
      </div>
      <div className="space-y-6">
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Project</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg mb-2">
            <span className="text-gray-300 text-sm">Entry Cost</span>
            <span className="text-white font-mono text-sm">1,500 sats</span>
          </div>
        </section>

        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Summary Tone</h3>
          <div className="space-y-1">
            {tones.map(t => (
              <button key={t.value} onClick={() => handleToneChange(t.value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                  summaryTone === t.value ? 'bg-amber-700/20 border border-amber-700/40' : 'bg-gray-900 hover:bg-gray-800'}`}>
                <div>
                  <span className={`text-sm font-medium ${summaryTone === t.value ? 'text-amber-600' : 'text-gray-300'}`}>{t.label}</span>
                  <p className="text-gray-500 text-xs mt-0.5">{t.desc}</p>
                </div>
                {summaryTone === t.value && <span className="text-amber-600 text-sm">Active</span>}
              </button>
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-2">Tone applies to the next summary update. Previous summaries are not regenerated.</p>
        </section>

        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Display</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
            <span className="text-gray-300 text-sm">Denomination</span>
            <div className="flex bg-gray-800 rounded-lg overflow-hidden">
              <button onClick={() => { setDenomination('sats'); window.summSats.setDenomination('sats'); }}
                className={`px-3 py-1 text-sm ${denomination === 'sats' ? 'bg-amber-700 text-white' : 'text-gray-400'}`}>sats</button>
              <button onClick={() => { setDenomination('btc'); window.summSats.setDenomination('btc'); }}
                className={`px-3 py-1 text-sm ${denomination === 'btc' ? 'bg-amber-700 text-white' : 'text-gray-400'}`}>BTC</button>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Security</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg mb-2">
            <span className="text-gray-300 text-sm">Auto-Lock Timer</span>
            <select value={autoLockMinutes} onChange={e => { const m = parseInt(e.target.value); setAutoLockMinutes(m); window.summSats.setAutoLockMinutes(m); }}
              className="bg-gray-800 border-none text-white text-sm rounded px-2 py-1 focus:outline-none">
              <option value={5}>5 min</option><option value={10}>10 min</option><option value={15}>15 min</option>
              <option value={30}>30 min</option><option value={60}>60 min</option>
            </select>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
            <div>
              <span className="text-gray-300 text-sm">Route through Tor</span>
              <p className="text-gray-600 text-xs mt-0.5">Requires Tor running on localhost:9050</p>
            </div>
            <button onClick={handleTorToggle}
              className={`w-12 h-6 rounded-full transition-colors relative ${useTor ? 'bg-amber-700' : 'bg-gray-700'}`}>
              <span className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${useTor ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
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
              <span className="text-gray-400 text-sm">0.2.0</span>
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
