import React from 'react';
import styles from '../styles/VersionPanel.module.css';
import DebugPanel from './DebugPanel';

const VersionPanel = () => {
  // Get version from environment variable embedded during build
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
  
  return (
    <div className={styles.versionPanel}>
      <span className={styles.versionText}>v{version}</span>
      <DebugPanel />
    </div>
  );
};

export default VersionPanel;
