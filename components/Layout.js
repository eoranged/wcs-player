import React from 'react';
import VersionPanel from './VersionPanel';
import TelegramUser from './TelegramUser';

const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen">
      {/* TelegramUser component at the top level */}
      <TelegramUser />
      
      {children}
      <VersionPanel />
    </div>
  );
};

export default Layout;
