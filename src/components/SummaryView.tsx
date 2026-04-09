import React from 'react';
import { useSummStore } from '../store/summStore';
import { HelpLink } from './HelpLink';

export function SummaryView() {
  const { summary, entryCount, entropyHistory, pendingSummaryUpdate, summaryError } = useSummStore();
  const latestEntropy = entropyHistory.length > 0 ? entropyHistory[entropyHistory.length - 1] : null;
  const [includeEntries, setIncludeEntries] = React.useState(false);

  const handleExport = async () => {
    await window.summSats.exportSummary(includeEntries);
  };

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
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>Summary</h2>
        <HelpLink />
      </div>

      {pendingSummaryUpdate && (
        <div className="mb-4 px-3 py-2 bg-gray-900 rounded-lg text-amber-600 text-xs">
          {summaryError || 'Summary pending update — AI processing will retry on next entry.'}
        </div>
      )}

      <div className="text-gray-200 leading-relaxed text-base mb-8" style={{ fontFamily: 'Georgia, serif' }}>
        {summary || 'No summary yet.'}
      </div>

      {/* Bottom stats */}
      <div className="flex items-center justify-between border-t border-gray-800 pt-4">
        <span className="text-gray-500 text-sm">{entryCount} entries</span>

        {latestEntropy !== null && (
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-sm">Entropy: {latestEntropy.toFixed(2)}</span>
            <div className="w-40 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-700 rounded-full transition-all" style={{ width: `${(latestEntropy / 8) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={includeEntries} onChange={e => setIncludeEntries(e.target.checked)}
              className="accent-amber-700 w-3.5 h-3.5" />
            <span className="text-gray-500 text-sm">Include entries</span>
          </label>
          <button onClick={handleExport} className="text-gray-500 hover:text-white text-sm transition-colors">
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
