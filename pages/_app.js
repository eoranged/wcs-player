import '../styles/globals.css';
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>Telegram Audio Player</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        {isClient && <Component {...pageProps} />}
      </div>
    </>
  );
}
