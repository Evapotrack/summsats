import React from 'react';
import { useSummStore } from '../store/summStore';
import { HelpLink } from './HelpLink';

export function SummaryView() {
  const { summary, entryCount, entropyHistory, pendingSummaryUpdate, summaryError, setView } = useSummStore();
  const latestEntropy = entropyHistory.length > 0 ? entropyHistory[entropyHistory.length - 1] : null;

  if (entryCount < 2) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <p className="text-gray-400 text-lg">{entryCount} of 2 entries needed.</p>
          <p className="text-gray-500 text-sm mt-2">Write {2 - entryCount} more to generate your summary.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>Summary</h2>
          <span className="text-gray-500 text-sm">{entryCount} entries</span>
          <HelpLink />
        </div>
        <button onClick={() => setView('export')} className="text-gray-500 hover:text-white text-sm transition-colors">
          Export
        </button>
      </div>

      {/* Entropy display */}
      {latestEntropy !== null ? (
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-700 font-semibold text-sm">Entropy Index</span>
            <span className="text-amber-700 font-mono text-lg font-bold">{latestEntropy.toFixed(2)}</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-700 rounded-full transition-all" style={{ width: `${(latestEntropy / 8) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600 text-xs">0 — converging</span>
            <span className="text-gray-600 text-xs">8 — diverging</span>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Entropy Index</span>
            <span className="text-gray-600 font-mono text-sm">—</span>
          </div>
        </div>
      )}

      {pendingSummaryUpdate && (
        <div className="mb-4 px-3 py-2 bg-gray-900 rounded-lg text-amber-600 text-xs">
          {summaryError || 'Summary pending update — AI processing will retry on next entry.'}
        </div>
      )}

      <div className="text-gray-100 leading-relaxed text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
        {summary || 'No summary yet.'}
      </div>
    </div>
  );
}
