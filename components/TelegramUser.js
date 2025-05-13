import { useEffect, useState } from 'react';
import styles from '../styles/TelegramUser.module.css';

const TelegramUser = () => {
  const [user, setUser] = useState(null);
  const [isTelegramApp, setIsTelegramApp] = useState(false);

  useEffect(() => {
    // Check if Telegram WebApp is available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setIsTelegramApp(true);
      
      // Get user info from Telegram WebApp
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
      if (tgUser) {
        setUser(tgUser);
      }
    }
  }, []);

  // Don't render anything if not in Telegram or no user data
  if (!isTelegramApp || !user) {
    return null;
  }

  return (
    <div className={styles.telegramUser}>
      {user.photo_url && (
        <img 
          src={user.photo_url} 
          alt={`${user.first_name}'s avatar`} 
          className={styles.avatar}
        />
      )}
      <span className={styles.userName}>
        {user.first_name} {user.last_name || ''}
      </span>
    </div>
  );
};

export default TelegramUser;
