import React, { useState } from 'react';
import { useSummStore } from '../store/summStore';
import { HelpLink } from './HelpLink';

export function EntriesView() {
  const { entryCount, expandedEntry, setExpandedEntry, readingEntry, setReadingEntry } = useSummStore();
  const [loading, setLoading] = useState(false);

  const entries = Array.from({ length: entryCount }, (_, i) => i + 1);

  const handleToggle = async (num: number) => {
    if (expandedEntry === num) { setExpandedEntry(null); return; }
    setExpandedEntry(num);
  };

  const handleReadFull = async (num: number) => {
    setLoading(true);
    try {
      const text = await window.summSats.loadEntry(num);
      setReadingEntry({ number: num, text });
    } catch {
      setReadingEntry({ number: num, text: 'Failed to decrypt this entry. The file may be corrupted.' });
    }
    setLoading(false);
  };

  if (entryCount === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-gray-500">No entries yet. Write your first entry to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Entry list */}
      <div className={`${readingEntry ? 'w-1/2' : 'w-full'} overflow-auto p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>Entries</h2>
          <span className="text-gray-500 text-sm">{entryCount} total</span>
          <HelpLink />
        </div>

        <div className="space-y-1">
          {entries.map(num => (
            <div key={num} className="bg-gray-900/50 rounded-lg overflow-hidden">
              <button
                onClick={() => handleToggle(num)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/50 transition-colors"
              >
                <span className="text-amber-700 font-mono text-sm">Entry #{num}</span>
                <span className="text-gray-600 text-xs">{expandedEntry === num ? '−' : '+'}</span>
              </button>
              {expandedEntry === num && (
                <div className="px-4 pb-3">
                  <button
                    onClick={() => handleReadFull(num)}
                    className="text-amber-700 hover:text-amber-600 text-xs transition-colors"
                  >
                    {loading ? 'Loading...' : 'Read Full Entry'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reading panel */}
      {readingEntry && (
        <div className="w-1/2 border-l border-gray-800 overflow-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-amber-700 font-mono text-sm">Entry #{readingEntry.number}</span>
            <button onClick={() => setReadingEntry(null)} className="text-gray-500 hover:text-white text-xs transition-colors">Close</button>
          </div>
          <div className="text-gray-200 leading-relaxed text-sm" style={{ fontFamily: 'Georgia, serif' }}>
            {readingEntry.text}
          </div>
        </div>
      )}
    </div>
  );
}
