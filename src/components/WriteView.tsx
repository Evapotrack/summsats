import React from 'react';
import { useSummStore } from '../store/summStore';
import { HelpLink } from './HelpLink';

export function WriteView() {
  const { entryCount, draftText, setDraftText, setView, confirmationMessage, setConfirmationMessage } = useSummStore();

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
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-amber-700 font-mono text-sm">Entry #{entryCount + 1}</span>
          <HelpLink />
        </div>
      </div>

      {confirmationMessage && (
        <div className="mb-4 text-amber-700 text-sm transition-opacity">{confirmationMessage}</div>
      )}

      <textarea
        value={draftText}
        onChange={e => setDraftText(e.target.value)}
        className="flex-1 bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-gray-100 text-base leading-relaxed resize-none focus:outline-none focus:border-amber-700/50"
        style={{ fontFamily: 'Georgia, serif' }}
        placeholder=""
      />

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={!draftText.trim()}
          className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
