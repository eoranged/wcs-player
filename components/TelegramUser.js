import { useEffect, useState } from 'react';
import styles from '../styles/TelegramUser.module.css';

const TelegramUser = () => {
  const [user, setUser] = useState(null);
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  useEffect(() => {
    // Function to initialize Telegram WebApp
    const initTelegramWebApp = () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          setDebugInfo('Not in browser environment');
          return;
        }

        // Check if Telegram WebApp is available
        if (!window.Telegram) {
          setDebugInfo('window.Telegram not found');
          return;
        }

        if (!window.Telegram.WebApp) {
          setDebugInfo('window.Telegram.WebApp not found');
          return;
        }

        // We have confirmed Telegram WebApp is available
        setIsTelegramApp(true);
        setDebugInfo('Telegram WebApp found');
        
        // Try to get user data
        try {
          const initData = window.Telegram.WebApp.initData;
          const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
          
          setDebugInfo(`InitData: ${initData ? 'exists' : 'missing'}, InitDataUnsafe: ${initDataUnsafe ? 'exists' : 'missing'}`);
          
          if (initDataUnsafe && initDataUnsafe.user) {
            setUser(initDataUnsafe.user);
            setDebugInfo(`User found: ${initDataUnsafe.user.first_name}`);
          } else {
            // Try alternative method - directly access user
            const webAppUser = window.Telegram.WebApp.user;
            if (webAppUser) {
              setUser(webAppUser);
              setDebugInfo(`User found via WebApp.user: ${webAppUser.first_name}`);
            } else {
              setDebugInfo('No user data found in Telegram WebApp');
            }
          }
        } catch (userError) {
          setDebugInfo(`Error accessing user data: ${userError.message}`);
        }
      } catch (error) {
        setDebugInfo(`Error initializing: ${error.message}`);
      }
    };

    // Run initialization
    initTelegramWebApp();

    // Add a small delay and try again (sometimes Telegram WebApp loads after our component)
    const retryTimeout = setTimeout(() => {
      if (!isTelegramApp) {
        setDebugInfo('Retrying initialization...');
        initTelegramWebApp();
      }
    }, 1000);

    return () => clearTimeout(retryTimeout);
  }, [isTelegramApp]);

  // Always render something in development for debugging
  const isDev = process.env.NODE_ENV === 'development';

  // In production, don't render anything if not in Telegram or no user data
  if (!isDev && !isTelegramApp) {
    return null;
  }

  return (
    <div className={styles.telegramUser}>
      {user && user.photo_url && (
        <img 
          src={user.photo_url} 
          alt={`${user.first_name}'s avatar`} 
          className={styles.avatar}
        />
      )}
      {user ? (
        <span className={styles.userName}>
          {user.first_name} {user.last_name || ''}
        </span>
      ) : (
        <span className={styles.debugInfo}>{debugInfo}</span>
      )}
    </div>
  );
};

export default TelegramUser;
