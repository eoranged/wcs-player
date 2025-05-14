import React, { useState, useRef, useEffect } from 'react';
import TelegramUser from './TelegramUser';
import VersionPanel from './VersionPanel';
import TempoSlider from './TempoSlider';
import styles from '../styles/TopPanel.module.css';

const TempoIndicator = ({ min, max, onClick }) => (
  <button
    className={styles.tempoIndicator + ' focus:outline-none'}
    title="Current tempo range"
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  >
    <span className="text-xs font-semibold text-green-500 bg-gray-800 rounded px-2 py-1 mr-2">BPM: {min}-{max}</span>
  </button>
);

const TempoLoader = () => (
  <div className={styles.tempoIndicator}>
    <span className="inline-block w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin align-middle mr-2" title="Loading tempo range..." />
  </div>
);

const TempoRangePopup = ({ min, max, onChange, onClose }) => {
  const [localRange, setLocalRange] = useState({ min, max });
  const popupRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleApply = () => {
    onChange(localRange);
    onClose();
  };

  return (
    <div ref={popupRef} className="absolute z-50 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-4 w-64 flex flex-col items-center">
      <div className="w-full mb-2 text-sm font-semibold text-white text-center">Set Tempo Range</div>
      <TempoSlider value={localRange} onChange={setLocalRange} />
      <button
        className="mt-4 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-semibold"
        onClick={handleApply}
      >Apply</button>
    </div>
  );
};

const TopPanel = ({ tempoRange, setTempoRange }) => {
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div className={styles.topPanel} style={{ position: 'relative' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <VersionPanel />
      </div>
      {tempoRange && typeof tempoRange.min === 'number' && typeof tempoRange.max === 'number' ? (
        <div className="relative">
          <TempoIndicator min={tempoRange.min} max={tempoRange.max} onClick={() => setShowPopup((v) => !v)} />
          {showPopup && (
            <TempoRangePopup
              min={tempoRange.min}
              max={tempoRange.max}
              onChange={setTempoRange}
              onClose={() => setShowPopup(false)}
            />
          )}
        </div>
      ) : (
        <TempoLoader />
      )}
      <div className={styles.userContainer}>
        <TelegramUser />
      </div>
    </div>
  );
};

export default TopPanel;
