import React from 'react';
import VersionPanel from './VersionPanel';

const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen">
      {children}
      <VersionPanel />
    </div>
  );
};

export default Layout;
