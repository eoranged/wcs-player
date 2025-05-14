import { useState, useEffect, useRef, createContext, useContext } from 'react';
import styles from '../styles/TelegramUser.module.css';
import { useAppConfig } from '../hooks/useAppConfig';
import { setUserContext, captureError, isSentryInitialized } from '../utils/errorReporting';
import { useTranslation } from 'next-i18next';

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
const TelegramUser = ({ onMenuItemClick }) => {
  const { t } = useTranslation('common');
  const { user } = useTelegramContext();
  const [initials, setInitials] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user && user.first_name) {
      const firstNameInitial = user.first_name.charAt(0);
      const lastNameInitial = user.last_name ? user.last_name.charAt(0) : '';
      setInitials(`${firstNameInitial}${lastNameInitial}`);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return null;
  }

  const fullName = `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemSelect = (menuItem) => {
    setIsMenuOpen(false);
    if (onMenuItemClick) {
      onMenuItemClick(menuItem);
    }
  };

  return (
    <div className={styles.telegramUserContainer} ref={menuRef}>
      <div 
        className={styles.telegramUser} 
        role="button"
        aria-label="User menu"
        title="Click to open user menu"
        onClick={handleMenuToggle}
      >
        {user.photo_url ? (
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
        ) : (
          <div className={styles.avatarPlaceholder}>
            {user.first_name.charAt(0)}
          </div>
        )}
      </div>

      {isMenuOpen && (
        <div className={styles.dropdown}>
          <div 
            className={styles.dropdownItem}
            onClick={() => handleMenuItemSelect('profile')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>{t('menu.profile')}</span>
          </div>
          <div 
            className={styles.dropdownItem}
            onClick={() => handleMenuItemSelect('settings')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>{t('menu.settings')}</span>
          </div>
          <div 
            className={styles.dropdownItem}
            onClick={() => handleMenuItemSelect('help')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>{t('menu.help')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramUser;
