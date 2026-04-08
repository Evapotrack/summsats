import React from 'react';
import { useSummStore } from '../store/summStore';

export function HelpLink() {
  const setView = useSummStore(s => s.setView);
  return (
    <button onClick={() => setView('howto')}
      className="w-6 h-6 rounded-full border border-gray-600 text-gray-500 hover:border-amber-600 hover:text-amber-600 text-xs font-semibold transition-colors flex items-center justify-center shrink-0"
      aria-label="How To"
      title="How To">
      ?
    </button>
  );
}
