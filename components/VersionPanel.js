import React from 'react';
import styles from '../styles/VersionPanel.module.css';

const VersionPanel = () => {
  // Get version from environment variable embedded during build
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
  
  return (
    <div className={styles.versionPanel}>
      <span className={styles.versionText}>v{version}</span>
    </div>
  );
};

export default VersionPanel;
