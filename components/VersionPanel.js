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

  // Only show debug button if user has permission based on config
  const showDebugButton = config?.features?.debugPanel === true;

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
              <path d="M8 2l1.5 5h5L16 2"></path>
              <path d="M9.5 7L5 13l2.5 4"></path>
              <path d="M14.5 7l4.5 6-2.5 4"></path>
              <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
              <path d="M12 17l0 3"></path>
            </svg>
          </button>
        )}
      </div>
      {showDebugPanel && <DebugPanel onClose={() => setShowDebugPanel(false)} />}
    </div>
  );
};

export default VersionPanel;
