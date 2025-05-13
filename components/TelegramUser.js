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
        
        // Log all available properties for debugging
        console.log('Telegram WebApp properties:', {
          initData: window.Telegram.WebApp.initData,
          initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
          user: window.Telegram.WebApp.initDataUnsafe?.user,
          directUser: window.Telegram.WebApp.user
        });
        
        // Try to get user data
        try {
          // Direct access to WebApp.user is the most reliable method
          if (window.Telegram.WebApp.user) {
            setUser(window.Telegram.WebApp.user);
            console.log('User found directly:', window.Telegram.WebApp.user);
            return;
          }
          
          // Try through initDataUnsafe
          const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
          if (initDataUnsafe && initDataUnsafe.user) {
            setUser(initDataUnsafe.user);
            console.log('User found through initDataUnsafe:', initDataUnsafe.user);
            return;
          }
          
          // If we're here, we couldn't find user data
          console.log('No user data found in Telegram WebApp');
          
          // For testing purposes, create a mock user
          if (process.env.NODE_ENV === 'development') {
            const mockUser = {
              id: 12345,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              photo_url: 'https://placehold.co/100x100?text=TU'
            };
            setUser(mockUser);
            console.log('Created mock user for development:', mockUser);
          }
        } catch (userError) {
          console.error('Error accessing user data:', userError);
        }
      } catch (error) {
        console.error('Error initializing Telegram WebApp:', error);
      }
    };

    // Run initialization
    initTelegramWebApp();

    // Add a small delay and try again (sometimes Telegram WebApp loads after our component)
    const retryTimeout = setTimeout(() => {
      if (!user) {
        console.log('Retrying Telegram WebApp initialization...');
        initTelegramWebApp();
      }
    }, 1000);

    return () => clearTimeout(retryTimeout);
  }, [user]);

  // Don't render anything if we're not in a Telegram app and not in development
  if (!isTelegramApp && process.env.NODE_ENV !== 'development') {
    return null;
  }

  // If we have user data, show the user info
  if (user) {
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
  }
  
  // In development, show debug info if no user
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className={styles.telegramUser}>
        <span className={styles.debugInfo}>Telegram: {isTelegramApp ? 'Yes' : 'No'}</span>
      </div>
    );
  }
  
  return null;
};

export default TelegramUser;
