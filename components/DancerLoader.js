import React from 'react';

const DancerLoader = ({ text = 'Loading the dance floor...' }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
    <img
      src="/dancer.png"
      alt="Dancer loading"
      className="w-32 h-32 mb-4 animate-bounce"
      style={{ filter: 'grayscale(1) opacity(0.7)' }}
    />
    <p className="text-lg text-gray-500 font-semibold animate-pulse">{text}</p>
  </div>
);

export default DancerLoader; 