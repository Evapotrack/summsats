import React from 'react';
import { useSummStore } from '../store/summStore';
import { HelpLink } from './HelpLink';

export function WriteView() {
  const { entryCount, draftText, setDraftText, setView, confirmationMessage, setConfirmationMessage, entryNotifications } = useSummStore();
  const pendingCount = entryNotifications.filter(n => n.status !== 'confirmed').length;

  const handleSubmit = () => {
    if (!draftText.trim()) return;
    setView('payment');
  };

  // Clear confirmation after 3 seconds
  React.useEffect(() => {
    if (confirmationMessage) {
      const t = setTimeout(() => setConfirmationMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [confirmationMessage]);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-700 font-mono text-sm">Entry #{entryCount + 1 + pendingCount}</span>
          <HelpLink />
        </div>
      </div>

      {confirmationMessage && (
        <div className="mb-2 text-green-700 text-xs transition-opacity">{confirmationMessage}</div>
      )}

      <textarea
        value={draftText}
        onChange={e => setDraftText(e.target.value)}
        className="flex-1 bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-gray-100 text-sm leading-relaxed resize-none focus:outline-none focus:border-amber-700/50"
        style={{ fontFamily: 'Georgia, serif' }}
        placeholder=""
      />

      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={!draftText.trim()}
          className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Submit
        </button>
        {draftText.length > 50000 && (
          <span className="text-amber-600 text-xs">Long entry — AI processing may take longer</span>
        )}
      </div>
    </div>
  );
}
