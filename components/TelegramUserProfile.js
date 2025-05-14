import React, { useState, useEffect } from 'react';
import styles from '../styles/TelegramUserProfile.module.css';
import { useTelegramContext } from './TelegramUser';

const TelegramUserProfile = ({ onClose }) => {
  const { user } = useTelegramContext();
  const [selectedLanguage, setSelectedLanguage] = useState('ru'); // Default to Russian

  // Set initial language based on user's language code
  useEffect(() => {
    if (user?.language_code) {
      // Only switch to English if language code is 'en'
      // Otherwise keep Russian as default
      if (user.language_code.toLowerCase() === 'en') {
        setSelectedLanguage('en');
      }
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ];

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    // Here you would typically save the language preference
    console.log(`Language changed to: ${langCode}`);
  };

  return (
    <div className={styles.container}>
      {/* Header with back button */}
      <div className={styles.header}>
        <button 
          onClick={onClose}
          className={styles.backButton}
          aria-label="Back to player"
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
        {user.photo_url && (
          <img 
            src={user.photo_url} 
            alt={`${user.first_name}'s avatar`} 
            className={styles.avatar}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/60x60?text=U';
            }}
          />
        )}
        <div className={styles.userName}>
          {user.first_name} {user.last_name || ''}
        </div>
      </div>
      
      {/* Language selector */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Select Language</h3>
        <div className={styles.languageSelector}>
          {languages.map((language) => (
            <div 
              key={language.code} 
              className={`${styles.languageOption} ${selectedLanguage === language.code ? styles.selectedLanguage : ''}`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <span className={styles.languageFlag}>{language.flag}</span>
              <span className={styles.languageName}>{language.name}</span>
              {selectedLanguage === language.code && (
                <span className={styles.checkmark}>✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TelegramUserProfile;
