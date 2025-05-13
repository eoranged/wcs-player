import '../styles/globals.css';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Layout from '../components/Layout';

export default function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);
  const [telegramLoaded, setTelegramLoaded] = useState(false);

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Telegram WebApp when script is loaded
  useEffect(() => {
    if (telegramLoaded && typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // Log Telegram WebApp initialization
      console.log('Telegram WebApp initialized:', {
        platform: window.Telegram.WebApp.platform,
        version: window.Telegram.WebApp.version,
        colorScheme: window.Telegram.WebApp.colorScheme,
        initDataUnsafe: window.Telegram.WebApp.initDataUnsafe ? 'exists' : 'missing',
        user: window.Telegram.WebApp.initDataUnsafe?.user ? 'exists' : 'missing'
      });

      // Set theme based on Telegram WebApp
      if (window.Telegram.WebApp.colorScheme) {
        document.documentElement.setAttribute('data-theme', window.Telegram.WebApp.colorScheme);
      }

      // Tell Telegram WebApp we're ready
      window.Telegram.WebApp.ready();
    }
  }, [telegramLoaded]);

  // Handle Telegram script load event
  const handleTelegramScriptLoad = () => {
    console.log('Telegram WebApp script loaded');
    setTelegramLoaded(true);
  };

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>Telegram Audio Player</title>
      </Head>

      {/* Load Telegram WebApp script with next/script for better control */}
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={handleTelegramScriptLoad}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        {isClient && (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
      </div>
    </>
  );
}
