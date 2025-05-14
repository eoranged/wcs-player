import { memo } from 'react';

const Thumb = memo(({ 
  position, 
  onMouseDown, 
  onTouchStart,
  isActive = false
}) => {
  return (
    <div 
      className={`thumb absolute w-5 h-5 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer shadow-md hover:bg-blue-400 transition-all duration-100 z-10 ${
        isActive ? 'active scale-110' : ''
      }`}
      style={{
        left: `${position}%`,
        top: '50%'
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    />
  );
});

Thumb.displayName = 'Thumb';

export default Thumb;
