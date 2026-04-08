import React, { useEffect, useState } from 'react';
import { useSummStore } from '../store/summStore';
import { HelpLink } from './HelpLink';

const SEND_THRESHOLD = 25_000;

export function WalletView() {
  const { balance, setBalance, formatAmount, utxos, setUtxos } = useSummStore();
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [feeRate, setFeeRate] = useState(0);
  const [fees, setFees] = useState<{ fast: number; medium: number; slow: number } | null>(null);
  const [txDetail, setTxDetail] = useState<{ inputs: Array<{ txid: string; vout: number; value: number }>; outputs: Array<{ address: string; value: number }>; fee: number; feeRate: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [txResult, setTxResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { refresh(); }, []);

  const refresh = async () => {
    try {
      const [bal, utxoList, feeEst] = await Promise.all([
        window.summSats.getBalance(), window.summSats.getUtxos(), window.summSats.getFees(),
      ]);
      setBalance(bal); setUtxos(utxoList); setFees(feeEst); setFeeRate(feeEst.medium);
    } catch { /* ignore */ }
  };

  const handlePreview = async () => {
    setError(''); setTxDetail(null);
    const amount = parseInt(sendAmount);
    if (!sendAddress || isNaN(amount) || amount <= 0) { setError('Enter a valid address and amount.'); return; }
    try {
      const detail = await window.summSats.buildTransaction(sendAddress, amount, feeRate);
      setTxDetail(detail);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleSend = async () => {
    if (!txDetail) return;
    setSending(true); setError('');
    try {
      const txid = await window.summSats.broadcastTransaction(sendAddress, parseInt(sendAmount), feeRate);
      setTxResult(txid); setTxDetail(null); setSendAddress(''); setSendAmount(''); refresh();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Broadcast failed'); }
    setSending(false);
  };

  const canSend = balance >= SEND_THRESHOLD;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>Wallet</h2>
        <HelpLink />
      </div>

      <div className="bg-gray-900 rounded-xl p-6 mb-6">
        <div className="text-gray-400 text-sm mb-1">Balance</div>
        <div className="text-amber-700 font-mono text-3xl font-bold">{formatAmount(balance)}</div>
      </div>

      <div className="mb-8">
        <h3 className="text-gray-400 text-sm font-semibold mb-3">UTXOs ({utxos.length})</h3>
        {utxos.length === 0 ? <p className="text-gray-600 text-sm">No UTXOs yet.</p> : (
          <div className="space-y-1">
            {utxos.map(u => (
              <div key={`${u.txid}:${u.vout}`} className="flex items-center justify-between px-3 py-2 bg-gray-900/50 rounded-lg text-sm">
                <span className="text-amber-700 font-mono">{u.value.toLocaleString()} sats</span>
                <span className="text-gray-500 font-mono text-xs">{u.address.slice(0, 12)}...{u.address.slice(-6)}</span>
                <span className="text-gray-600 text-xs">{u.confirmations}+ conf</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-gray-400 text-sm font-semibold">Send</h3>
        {!canSend ? (
          <p className="text-gray-500 text-sm">Minimum {SEND_THRESHOLD.toLocaleString()} sats to send (currently {balance.toLocaleString()} sats).</p>
        ) : (<>
          <input type="text" value={sendAddress} onChange={e => setSendAddress(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-700" placeholder="bc1q... or tb1q..." />
          <div className="flex gap-3">
            <input type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-700" placeholder="Amount (sats)" />
            {fees && <select value={feeRate} onChange={e => setFeeRate(parseInt(e.target.value))}
              className="w-36 bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-amber-700">
              <option value={fees.fast}>Fast ({fees.fast})</option>
              <option value={fees.medium}>Medium ({fees.medium})</option>
              <option value={fees.slow}>Slow ({fees.slow})</option>
            </select>}
          </div>
          {error && <p className="text-amber-600 text-sm">{error}</p>}
          {txResult && <p className="text-white text-sm font-mono break-all">Broadcast: {txResult}</p>}
          {!txDetail ? (
            <button onClick={handlePreview} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors">Review Transaction</button>
          ) : (
            <div className="bg-gray-900 rounded-xl p-4 space-y-3">
              <h4 className="text-white font-semibold text-sm">Transaction Detail</h4>
              <div className="text-xs text-gray-400 space-y-1">
                {txDetail.outputs.map((o, i) => <div key={i} className="font-mono">{o.address.slice(0, 16)}... → {o.value.toLocaleString()} sats</div>)}
                <div>Fee: {txDetail.fee.toLocaleString()} sats ({txDetail.feeRate} sat/vB)</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setTxDetail(null)} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
                <button onClick={handleSend} disabled={sending}
                  className="flex-1 py-2 bg-amber-700 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50">
                  {sending ? 'Broadcasting...' : 'Confirm & Send'}
                </button>
              </div>
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}
