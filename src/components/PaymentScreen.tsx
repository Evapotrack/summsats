import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSummStore } from '../store/summStore';

export function PaymentScreen() {
  const { draftText, setDraftText, setView, setEntryCount, setSummary, setEntropyHistory,
    setChainHashes, setPendingSummaryUpdate, setConfirmationMessage, entryCount } = useSummStore();
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'waiting' | 'detected' | 'confirmed' | 'processing'>('waiting');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const { address: addr } = await window.summSats.getEntryAddress();
      setAddress(addr);
      startPolling(addr);
    })();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startPolling = (addr: string) => {
    const poll = async () => {
      try {
        const result = await window.summSats.pollEntryPayment(addr);
        if (result.confirmed) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus('confirmed');
          setTimeout(() => processEntry(), 1000);
        } else if (result.detected) {
          setStatus('detected');
        }
      } catch { /* ignore polling errors */ }
    };
    poll();
    pollRef.current = setInterval(poll, 15000);
  };

  const processEntry = async () => {
    setStatus('processing');
    try {
      const result = await window.summSats.commitEntry(draftText);
      setEntryCount(result.entryCount);
      setSummary(result.summary);
      setEntropyHistory(result.entropyHistory);
      setChainHashes(result.chainHashes);
      setPendingSummaryUpdate(result.pendingSummaryUpdate);
      setConfirmationMessage(`Entry #${result.entryNumber} added to your project`);
      setDraftText('');
      setView('write');
    } catch {
      setView('write');
    }
  };

  const bip21 = address ? `bitcoin:${address}?amount=0.00001` : '';
  const copyAddress = async () => { if (address) await window.summSats.copyToClipboard(address); };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className="h-8 shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm px-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={bip21} size={200} level="M" title="Bitcoin payment QR code — 1,000 sats" />
            </div>
          </div>
          <div onClick={copyAddress} className="font-mono text-xs text-gray-300 break-all cursor-pointer hover:text-white transition-colors px-2" title="Click to copy">
            {address}
          </div>
          <div className="text-white text-xl font-semibold">Send 1,000 sats</div>
          <div className="text-sm">
            {status === 'waiting' && <span className="text-gray-400">Waiting for payment...</span>}
            {status === 'detected' && <span className="text-amber-600">Transaction detected. Waiting for confirmation...</span>}
            {status === 'confirmed' && <span className="text-white">Confirmed. Processing entry...</span>}
            {status === 'processing' && <span className="text-gray-400">Encrypting and processing...</span>}
          </div>
          <button onClick={() => setView('write')} className="text-gray-500 hover:text-white text-sm transition-colors">&larr; Back to Write</button>
        </div>
      </div>
    </div>
  );
}
