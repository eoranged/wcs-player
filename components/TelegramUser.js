import { useState, useEffect, createContext, useContext, useRef } from 'react';
import styles from '../styles/TelegramUser.module.css';
import { useAppConfig } from '../hooks/useAppConfig';
import { setUserContext, captureError, isSentryInitialized } from '../utils/errorReporting';

// Create context for sharing user data and config
export const TelegramContext = createContext({
  user: null,
  config: {
    isAdmin: false,
    features: { debugPanel: false }
  }
});

// Hook to use the telegram context
export const useTelegramContext = () => useContext(TelegramContext);

// Provider component
export const TelegramProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  const initCompletedRef = useRef(false);
  
  // Get app config based on user
  const { config } = useAppConfig(user);

  useEffect(() => {
    // Prevent initialization if we've already completed it or made too many attempts
    if (initCompletedRef.current || initAttempts > 2) {
      return;
    }

    // Function to initialize Telegram WebApp
    const initTelegramWebApp = () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          return;
        }

        // Check if Telegram WebApp is available
        if (!window.Telegram || !window.Telegram.WebApp) {
          // In development, create a mock user after the first attempt
          if (process.env.NODE_ENV === 'development' && initAttempts > 0) {
            createMockUser();
          }
          return;
        }

        // We have confirmed Telegram WebApp is available
        setIsTelegramApp(true);
        
        // Only log properties on first attempt to avoid console spam
        if (initAttempts === 0) {
          console.log('Telegram WebApp properties:', {
            initData: window.Telegram.WebApp.initData,
            initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
            user: window.Telegram.WebApp.initDataUnsafe?.user,
            directUser: window.Telegram.WebApp.user
          });
        }
        
        // Try to get user data
        try {
          // Direct access to WebApp.user is the most reliable method
          if (window.Telegram.WebApp.user) {
            setUser(window.Telegram.WebApp.user);
            if (initAttempts === 0) {
              console.log('User found directly:', window.Telegram.WebApp.user);
              
              // Set user context in Sentry if initialized
              if (isSentryInitialized()) {
                setUserContext(window.Telegram.WebApp.user);
                console.log('User context set in Sentry');
              }
            }
            initCompletedRef.current = true;
            return;
          }
          
          // Try through initDataUnsafe
          const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
          if (initDataUnsafe && initDataUnsafe.user) {
            setUser(initDataUnsafe.user);
            if (initAttempts === 0) {
              console.log('User found through initDataUnsafe:', initDataUnsafe.user);
            }
            initCompletedRef.current = true;
            return;
          }
          
          // If we're here, we couldn't find user data
          if (initAttempts === 0) {
            console.log('No user data found in Telegram WebApp');
          }
          
          // For testing purposes, create a mock user in development
          if (process.env.NODE_ENV === 'development' && initAttempts > 0) {
            createMockUser();
          }
        } catch (userError) {
          if (initAttempts === 0) {
            console.error('Error accessing user data:', userError);
            // Report error to Sentry if initialized
            captureError(userError, { component: 'TelegramProvider', action: 'accessUserData', initAttempts });
          }
          
          // Create mock user in development on error
          if (process.env.NODE_ENV === 'development') {
            createMockUser();
          }
        }
      } catch (error) {
        if (initAttempts === 0) {
          console.error('Error initializing Telegram WebApp:', error);
          // Report error to Sentry if initialized
          captureError(error, { component: 'TelegramProvider', action: 'initTelegramWebApp', initAttempts });
        }
      }
    };
    
    // Helper function to create a mock user in development
    const createMockUser = () => {
      if (!user && !initCompletedRef.current) {
        const mockUser = {
          id: 12345,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          photo_url: 'https://placehold.co/100x100?text=TU'
        };
        setUser(mockUser);
        if (initAttempts === 0) {
          console.log('Created mock user for development');
        }
        initCompletedRef.current = true;
      }
    };

    // Run initialization
    initTelegramWebApp();
    setInitAttempts(prev => prev + 1);

    // Add a small delay and try again (sometimes Telegram WebApp loads after our component)
    // But only do this once to avoid infinite retries
    if (initAttempts < 2) {
      const retryTimeout = setTimeout(() => {
        if (!user && !initCompletedRef.current) {
          initTelegramWebApp();
          setInitAttempts(prev => prev + 1);
        }
      }, 1000);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [initAttempts, user]);

  return (
    <TelegramContext.Provider value={{ user, config }}>
      {children}
    </TelegramContext.Provider>
  );
};

// User display component
const TelegramUser = () => {
  const { user } = useTelegramContext();

  // Don't render anything if no user
  if (!user) {
    return null;
  }

  return (
    <div className={styles.telegramUser}>
      {user.photo_url && (
        <img 
          src={user.photo_url} 
          alt={`${user.first_name}'s avatar`} 
          className={styles.avatar}
          onError={(e) => {
            // Only log error once
            if (!e.target.hasErrorLogged) {
              console.error('Error loading avatar image');
              e.target.hasErrorLogged = true;
            }
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/30x30?text=U';
          }}
        />
      )}
      <span className={styles.userName}>
        {user.first_name} {user.last_name || ''}
      </span>
    </div>
  );
};

export default TelegramUser;
