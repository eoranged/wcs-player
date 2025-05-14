import React from 'react';
import TopPanel from './TopPanel';
import { useTempoSlider } from '../hooks/useTempoSlider';

export const BottomNavigation = () => (
  <nav className="bg-gray-900 border-t border-gray-700 flex z-10 rounded-b-2xl">
    <button className="flex-1 flex flex-col items-center py-2 focus:outline-none text-white hover:text-blue-400">
      {/* Home Icon */}
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0h4" /></svg>
      <span className="text-xs mt-1">Home</span>
    </button>
    <button className="flex-1 flex flex-col items-center py-2 focus:outline-none text-white hover:text-blue-400">
      {/* Library Icon */}
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M16 2v4" /></svg>
      <span className="text-xs mt-1">Library</span>
    </button>
    <button className="flex-1 flex flex-col items-center py-2 focus:outline-none text-white hover:text-blue-400">
      {/* Settings Icon */}
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09A1.65 1.65 0 008.91 3H9a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09c.2.63.77 1.1 1.51 1.1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
      <span className="text-xs mt-1">Settings</span>
    </button>
  </nav>
);

const Layout = ({ children }) => {
  const { tempoRange, setTempoRange } = useTempoSlider();
  return (
    <div className="relative min-h-screen flex flex-col pb-16">
      <TopPanel tempoRange={tempoRange} setTempoRange={setTempoRange} />
      <div className="flex-1 overflow-auto">
        {React.cloneElement(children, { tempoRange, setTempoRange })}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Layout;
