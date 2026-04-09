import React, { useEffect, useRef } from 'react';
import { useSummStore } from '../store/summStore';

export function EntryNotifications() {
  const { entryNotifications, updateNotification, removeNotification,
    setEntryCount, setSummary, setEntropyHistory, setChainHashes, setPendingSummaryUpdate, setSummaryError } = useSummStore();
  const pollRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    // Start polling for any pending notifications
    for (const notif of entryNotifications) {
      if (notif.status === 'pending' || notif.status === 'detected') {
        if (!pollRefs.current.has(notif.id)) {
          startPolling(notif);
        }
      }
    }
    // Cleanup polls for removed notifications
    for (const [id, interval] of pollRefs.current) {
      if (!entryNotifications.find(n => n.id === id)) {
        clearInterval(interval);
        pollRefs.current.delete(id);
      }
    }
  }, [entryNotifications]);

  useEffect(() => {
    return () => {
      for (const interval of pollRefs.current.values()) clearInterval(interval);
      pollRefs.current.clear();
    };
  }, []);

  const startPolling = (notif: typeof entryNotifications[0]) => {
    const poll = async () => {
      try {
        // Keep auto-lock timer alive while entries are pending confirmation
        window.summSats.touchActivity();
        const result = await window.summSats.pollEntryPayment(notif.address);
        if (result.confirmed) {
          const interval = pollRefs.current.get(notif.id);
          if (interval) { clearInterval(interval); pollRefs.current.delete(notif.id); }
          updateNotification(notif.id, 'processing');
          // Process the entry
          try {
            const commitResult = await window.summSats.commitEntry(notif.entryText);
            setEntryCount(commitResult.entryCount);
            setSummary(commitResult.summary);
            setEntropyHistory(commitResult.entropyHistory);
            setChainHashes(commitResult.chainHashes);
            setPendingSummaryUpdate(commitResult.pendingSummaryUpdate);
            setSummaryError(commitResult.summaryError);
            updateNotification(notif.id, 'confirmed');
          } catch {
            updateNotification(notif.id, 'confirmed');
          }
        } else if (result.detected) {
          updateNotification(notif.id, 'detected');
        }
      } catch { /* ignore polling errors */ }
    };
    poll();
    const interval = setInterval(poll, 15000);
    pollRefs.current.set(notif.id, interval);
  };

  if (entryNotifications.length === 0) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (startMs: number, endMs: number) => {
    const secs = Math.round((endMs - startMs) / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
  };

  const statusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting payment...';
      case 'detected': return 'Detected — waiting for confirmation...';
      case 'processing': return 'Confirmed — processing...';
      case 'confirmed': return 'Confirmed';
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-400';
      case 'detected': return 'text-amber-600';
      case 'processing': return 'text-amber-600';
      case 'confirmed': return 'text-green-700';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-2 px-6 pt-4">
      {entryNotifications.map(notif => (
        <div key={notif.id} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3 border border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            {notif.status === 'confirmed' ? (
              <svg className="w-4 h-4 text-green-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="w-4 h-4 shrink-0">
                <span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse inline-block" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-white text-sm font-medium">Entry #{notif.entryNumber}</span>
              <span className="text-gray-600 text-xs ml-2">{formatTime(notif.timestamp)}</span>
              <span className={`text-xs ml-2 ${statusColor(notif.status)}`}>{statusText(notif.status)}</span>
              {notif.status === 'confirmed' && notif.detectedAt && notif.confirmedAt && (
                <span className="text-gray-600 text-xs ml-2">({formatDuration(notif.detectedAt, notif.confirmedAt)})</span>
              )}
            </div>
          </div>
          <button onClick={() => {
            const interval = pollRefs.current.get(notif.id);
            if (interval) { clearInterval(interval); pollRefs.current.delete(notif.id); }
            removeNotification(notif.id);
          }}
            className="text-gray-600 hover:text-white text-sm ml-3 shrink-0 transition-colors" aria-label="Dismiss">
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
