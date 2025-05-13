import React from 'react';
import VersionPanel from './VersionPanel';

const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="flex-1 overflow-auto">
        {children}
      </div>
      
      <VersionPanel />
    </div>
  );
};

export default Layout;
