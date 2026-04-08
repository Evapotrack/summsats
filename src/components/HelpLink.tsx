import React from 'react';
import { useSummStore } from '../store/summStore';

export function HelpLink() {
  const setView = useSummStore(s => s.setView);
  return (
    <button onClick={() => setView('howto')}
      className="text-gray-500 hover:text-amber-600 text-xs transition-colors" aria-label="Help">
      ? Help
    </button>
  );
}
