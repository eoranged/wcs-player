import React from 'react';
import styles from '../styles/HelpPanel.module.css';
import { useTranslation } from 'next-i18next';

const HelpPanel = ({ onClose }) => {
  const { t } = useTranslation('common');

  return (
    <div className={styles.container}>
      {/* Header with back button */}
      <div className={styles.header}>
        <button 
          onClick={onClose}
          className={styles.backButton}
          aria-label={t('controls.back')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div className={styles.spacer}></div>
      </div>
      
      {/* Help content */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('help.title')}</h3>
        
        <div className={styles.helpContent}>
          <div className={styles.helpItem}>
            <h4>{t('help.playback')}</h4>
            <p>{t('help.playbackDescription')}</p>
          </div>
          
          <div className={styles.helpItem}>
            <h4>{t('help.tempo')}</h4>
            <p>{t('help.tempoDescription')}</p>
          </div>
          
          <div className={styles.helpItem}>
            <h4>{t('help.playlists')}</h4>
            <p>{t('help.playlistsDescription')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;
