import React from 'react';
import TopPanel from './TopPanel';
import { useTempoSlider } from '../hooks/useTempoSlider';

const Layout = ({ children }) => {
  const { tempoRange, setTempoRange } = useTempoSlider();
  return (
    <div className="relative min-h-screen flex flex-col pb-16">
      <TopPanel tempoRange={tempoRange} setTempoRange={setTempoRange} />
      <div className="flex-1 overflow-auto">
        {React.cloneElement(children, { tempoRange, setTempoRange })}
      </div>
    </div>
  );
};

export default Layout;
