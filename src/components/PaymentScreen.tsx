import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSummStore } from '../store/summStore';

export function PaymentScreen() {
  const { draftText, setDraftText, setView, entryCount, addNotification } = useSummStore();
  const [address, setAddress] = useState('');

  useEffect(() => {
    (async () => {
      const { address: addr } = await window.summSats.getEntryAddress();
      setAddress(addr);
    })();
  }, []);

  const handleBackToWrite = () => {
    if (address) {
      // Create notification and let background polling handle the rest
      addNotification({
        id: `entry-${Date.now()}`,
        entryNumber: entryCount + 1,
        entryText: draftText,
        address,
        timestamp: Date.now(),
        status: 'pending',
      });
      setDraftText('');
    }
    setView('write');
  };

  const bip21 = address ? `bitcoin:${address}?amount=0.000015` : '';
  const copyAddress = async () => { if (address) await window.summSats.copyToClipboard(address); };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className="h-8 shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
      <div className="flex-1 grid place-items-center">
        <div className="w-full max-w-sm px-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={bip21} size={200} level="M" title="Bitcoin payment QR code — 1,500 sats" />
            </div>
          </div>
          <div onClick={copyAddress} className="font-mono text-xs text-gray-300 break-all cursor-pointer hover:text-white transition-colors px-2" title="Click to copy">
            {address}
          </div>
          <div className="text-white text-xl font-semibold">Send 1,500 sats</div>
          <p className="text-gray-500 text-sm">Send payment, then continue writing. You'll be notified when confirmed.</p>
          <button onClick={handleBackToWrite} className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors">
            Back to Write
          </button>
        </div>
      </div>
    </div>
  );
}
