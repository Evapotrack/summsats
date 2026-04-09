import React, { useState } from 'react';
import { useSummStore } from '../store/summStore';
import { HelpLink } from './HelpLink';

export function ExportView() {
  const { entryCount, summary } = useSummStore();
  const [includeEntries, setIncludeEntries] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    const result = await window.summSats.exportSummary(includeEntries);
    if (result) {
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    }
  };

  const canExport = !!summary;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>Export</h2>
        <HelpLink />
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">What to export</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 rounded-lg">
              <span className="text-gray-300 text-sm">Summary</span>
              <span className="text-gray-500 text-xs">{summary ? 'Available' : 'Not yet generated'}</span>
            </div>
            <label className="flex items-center justify-between px-4 py-3 bg-gray-900 rounded-lg cursor-pointer">
              <span className="text-gray-300 text-sm">Include all entries ({entryCount})</span>
              <input type="checkbox" checked={includeEntries} onChange={e => setIncludeEntries(e.target.checked)}
                className="accent-amber-700 w-4 h-4" />
            </label>
          </div>
        </section>

        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Format</h3>
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 rounded-lg">
            <span className="text-gray-300 text-sm">Plain text (.txt)</span>
            <span className="text-gray-500 text-xs">Readable anywhere</span>
          </div>
        </section>

        <button
          onClick={handleExport}
          disabled={!canExport}
          className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {exported ? 'Saved' : 'Export'}
        </button>

        {!canExport && (
          <p className="text-gray-600 text-xs text-center">Summary must be generated before exporting (minimum 2 entries).</p>
        )}
      </div>
    </div>
  );
}
