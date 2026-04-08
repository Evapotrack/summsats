import React, { useState } from 'react';
import type { AppConfig, SummaryTone } from '../types';

interface Props { onComplete: () => void; }
type Step = 'welcome' | 'seed-display' | 'seed-verify' | 'config' | 'done';

export function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [isRestore, setIsRestore] = useState(false);
  const [seedWords, setSeedWords] = useState<string[]>([]);
  const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
  const [verifyInputs, setVerifyInputs] = useState(['', '', '']);
  const [verifyError, setVerifyError] = useState('');
  const [restoreWords, setRestoreWords] = useState(Array(12).fill(''));
  const [restoreError, setRestoreError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [networkType, setNetworkType] = useState<'testnet' | 'mainnet'>('testnet');
  const [autoLock, setAutoLock] = useState('15');
  const [summaryTone, setSummaryTone] = useState<SummaryTone>('educational');
  const [dataFolder, setDataFolder] = useState('');
  const [configError, setConfigError] = useState('');

  const handleCreateNew = async () => {
    const words = await window.summSats.generateSeed();
    setSeedWords(words);
    const indices: number[] = [];
    while (indices.length < 3) { const i = Math.floor(Math.random() * 12); if (!indices.includes(i)) indices.push(i); }
    setVerifyIndices(indices.sort((a, b) => a - b));
    setStep('seed-display');
  };

  const handleVerify = () => {
    for (let i = 0; i < 3; i++) {
      if (verifyInputs[i].toLowerCase().trim() !== seedWords[verifyIndices[i]]) {
        setVerifyError(`Word ${verifyIndices[i] + 1} is incorrect.`); return;
      }
    }
    setVerifyError(''); setStep('config');
  };

  const handleRestoreVerify = async () => {
    const words = restoreWords.map(w => w.toLowerCase().trim());
    if (words.some(w => !w)) { setRestoreError('Enter all 12 words.'); return; }
    const valid = await window.summSats.restoreSeed(words);
    if (!valid) { setRestoreError('Invalid seed phrase.'); return; }
    setSeedWords(words); setRestoreError(''); setStep('config');
  };

  const handleConfig = async () => {
    if (!password || password.length < 8) { setConfigError('Password must be at least 8 characters.'); return; }
    if (password !== passwordConfirm) { setConfigError('Passwords do not match.'); return; }
    if (!apiKey.startsWith('sk-ant-') || apiKey.length < 30) { setConfigError('Enter a valid Anthropic API key (starts with sk-ant-).'); return; }
    if (!dataFolder) { setConfigError('Select a data folder.'); return; }
    setConfigError('');
    try {
      await window.summSats.setPassword(password);
      await window.summSats.setApiKey(apiKey.trim());
      if (!isRestore) await window.summSats.storeSeed(seedWords);
      const config: AppConfig = { networkType, dataFolderPath: dataFolder, autoLockMinutes: parseInt(autoLock) || 15, denomination: 'sats', summaryTone, useTor: false };
      await window.summSats.createProject(config);
      setStep('done');
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Setup failed. Check your settings and try again.');
    }
  };

  const selectFolder = async () => { const f = await window.summSats.selectFolder(); if (f) setDataFolder(f); };

  const copper = 'bg-amber-700 hover:bg-amber-600 text-white';
  const input = 'w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-700';

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className="h-8 shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
      <div className="flex-1 flex items-center justify-center overflow-auto px-8">
        <div className="w-full max-w-md">

          {step === 'welcome' && (
            <div className="space-y-8 text-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>SummSats</h1>
                <p className="text-gray-400">Pay to think. Read for free.</p>
              </div>
              <div className="space-y-3">
                <button onClick={handleCreateNew} className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${copper}`}>Create New Project</button>
                <button onClick={() => { setIsRestore(true); setStep('seed-verify'); }}
                  className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-semibold transition-colors">Restore Existing Project</button>
              </div>
            </div>
          )}

          {step === 'seed-display' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Your Seed Phrase</h2>
                <p className="text-amber-600 text-sm font-semibold">Write these words down. This is the only time they will be shown.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {seedWords.map((w, i) => (
                  <div key={i} className="bg-gray-900 rounded-lg p-3 text-center">
                    <span className="text-gray-500 text-xs">{i + 1}.</span> <span className="text-white font-mono">{w}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep('seed-verify')} className={`w-full py-3 rounded-lg font-semibold transition-colors ${copper}`}>I wrote them down</button>
            </div>
          )}

          {step === 'seed-verify' && !isRestore && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Verify Your Seed</h2>
                <p className="text-gray-400 text-sm">Enter the requested words.</p>
              </div>
              <div className="space-y-4">
                {verifyIndices.map((idx, i) => (
                  <div key={idx}>
                    <label className="text-gray-400 text-sm">Word {idx + 1}</label>
                    <input type="text" value={verifyInputs[i]}
                      onChange={e => { const a = [...verifyInputs]; a[i] = e.target.value; setVerifyInputs(a); }}
                      className={input} autoComplete="off" />
                  </div>
                ))}
              </div>
              {verifyError && <p className="text-amber-600 text-sm">{verifyError}</p>}
              <button onClick={handleVerify} className={`w-full py-3 rounded-lg font-semibold transition-colors ${copper}`}>Verify</button>
            </div>
          )}

          {step === 'seed-verify' && isRestore && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Enter Your Seed Phrase</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {restoreWords.map((w, i) => (
                  <div key={i}>
                    <label className="text-gray-500 text-xs">{i + 1}.</label>
                    <input type="text" value={w}
                      onChange={e => { const a = [...restoreWords]; a[i] = e.target.value; setRestoreWords(a); }}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-700" autoComplete="off" />
                  </div>
                ))}
              </div>
              {restoreError && <p className="text-amber-600 text-sm">{restoreError}</p>}
              <button onClick={handleRestoreVerify} className={`w-full py-3 rounded-lg font-semibold transition-colors ${copper}`}>Restore</button>
            </div>
          )}

          {step === 'config' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center">Configure</h2>
              <div>
                <label className="text-gray-400 text-sm">Password (min 8 characters)</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={input} />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Confirm Password</label>
                <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} className={input} />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Anthropic API Key</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." className={input} />
                <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <p className="text-gray-400 text-xs leading-relaxed">
                    SummSats uses Claude AI to process your entries. You need an Anthropic API key to use this app.
                  </p>
                  <ol className="text-gray-500 text-xs mt-2 space-y-1 list-decimal list-inside">
                    <li>Go to <span className="text-white">console.anthropic.com</span></li>
                    <li>Create a free account (or sign in)</li>
                    <li>Navigate to <span className="text-white">API Keys</span> in settings</li>
                    <li>Click <span className="text-white">Create Key</span></li>
                    <li>Copy the key (starts with <span className="text-white font-mono">sk-ant-</span>) and paste it above</li>
                  </ol>
                  <p className="text-gray-500 text-xs mt-2">Your key is stored encrypted in your macOS Keychain. It never leaves your device except to authenticate API requests.</p>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Network</label>
                <select value={networkType} onChange={e => setNetworkType(e.target.value as 'testnet' | 'mainnet')} className={input}>
                  <option value="testnet">Testnet</option><option value="mainnet">Mainnet</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Auto-Lock Timer</label>
                <select value={autoLock} onChange={e => setAutoLock(e.target.value)} className={input}>
                  <option value="5">5 minutes</option><option value="10">10 minutes</option>
                  <option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Summary Tone</label>
                <select value={summaryTone} onChange={e => setSummaryTone(e.target.value as SummaryTone)} className={input}>
                  <option value="educational">Educational — structured and analytical</option>
                  <option value="reflective">Reflective — introspective and personal</option>
                  <option value="philosophical">Philosophical — abstract and probing</option>
                </select>
                <p className="text-gray-600 text-xs mt-1">You can change this anytime in Settings.</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Data Folder</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={dataFolder} readOnly className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none" />
                  <button onClick={selectFolder} className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">Browse</button>
                </div>
              </div>
              {configError && <p className="text-amber-600 text-sm">{configError}</p>}
              <button onClick={handleConfig} className={`w-full py-3 rounded-lg font-semibold transition-colors ${copper}`}>Create Project</button>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-bold text-white">Project Created</h2>
              <p className="text-gray-400">Your project is ready. Write your first entry.</p>
              <button onClick={onComplete} className={`w-full py-3 rounded-lg font-semibold transition-colors ${copper}`}>Start Writing</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
