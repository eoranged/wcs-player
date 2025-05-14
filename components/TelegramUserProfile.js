import React from 'react';
import styles from '../styles/TelegramUserProfile.module.css';
import { useTelegramContext } from './TelegramUser';

const TelegramUserProfile = ({ onClose }) => {
  const { user } = useTelegramContext();

  if (!user) {
    return null;
  }

  // Format user data for display
  const userFields = [
    { label: 'User ID', value: user.id },
    { label: 'First Name', value: user.first_name },
    { label: 'Last Name', value: user.last_name || 'Not provided' },
    { label: 'Username', value: user.username ? `@${user.username}` : 'Not provided' },
    { label: 'Language Code', value: user.language_code || 'Not provided' },
    { label: 'Is Premium', value: user.is_premium ? 'Yes' : 'No' },
    { label: 'Allows Write', value: user.allows_write_to_pm ? 'Yes' : 'No' }
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.profileCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.profileHeader}>
          {user.photo_url && (
            <img 
              src={user.photo_url} 
              alt={`${user.first_name}'s avatar`} 
              className={styles.profileAvatar}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/100x100?text=U';
              }}
            />
          )}
          <h2 className={styles.profileName}>
            {user.first_name} {user.last_name || ''}
          </h2>
          {user.username && (
            <p className={styles.profileUsername}>@{user.username}</p>
          )}
        </div>
        
        <div className={styles.profileDetails}>
          <h3>Telegram Profile Information</h3>
          <div className={styles.profileFields}>
            {userFields.map((field, index) => (
              <div key={index} className={styles.profileField}>
                <span className={styles.fieldLabel}>{field.label}:</span>
                <span className={styles.fieldValue}>{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramUserProfile;
