import React from 'react';
import styles from '../styles/ProfilePanel.module.css';
import { useTelegramContext } from './TelegramUser';
import { useTranslation } from 'next-i18next';

const ProfilePanel = ({ onClose }) => {
  const { user } = useTelegramContext();
  const { t } = useTranslation('common');

  if (!user) {
    return null;
  }

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
      
      {/* User info */}
      <div className={styles.userInfo}>
        {user.photo_url ? (
          <img 
            src={user.photo_url} 
            alt={`${user.first_name}'s avatar`} 
            className={styles.avatar}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/100x100?text=U';
            }}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {user.first_name.charAt(0)}
          </div>
        )}
        
        <div className={styles.profileDetails}>
          <div className={styles.userName}>
            {user.first_name} {user.last_name || ''}
          </div>
          {user.username && (
            <div className={styles.userUsername}>
              @{user.username}
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('profile.comingSoon')}</h3>
        <div className={styles.profileContent}>
          <p className={styles.comingSoonMessage}>
            This panel will contain user profile settings and preferences in future updates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePanel;
