import React, { useState } from 'react';
import styles from '../styles/VersionPanel.module.css';
import DebugPanel from './DebugPanel';
import { useTelegramContext } from './TelegramUser';

const VersionPanel = () => {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
  const { config } = useTelegramContext();

  const toggleDebugPanel = () => {
    setShowDebugPanel(!showDebugPanel);
  };

  // Only show debug button if user is admin or in development mode
  const showDebugButton = config?.features?.debugPanel || process.env.NODE_ENV === 'development';

  return (
    <div className={styles.versionPanel}>
      <div className={styles.versionInfo}>
        <span className={styles.versionText}>v{version}</span>
        {showDebugButton && (
          <button
            onClick={toggleDebugPanel}
            className={styles.debugButton}
            title="Toggle Debug Panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="M10 8l6 0"></path>
              <path d="M8 12l8 0"></path>
              <path d="M10 16l6 0"></path>
            </svg>
          </button>
        )}
      </div>
      {showDebugPanel && <DebugPanel onClose={() => setShowDebugPanel(false)} />}
    </div>
  );
};

export default VersionPanel;
