import { memo } from 'react';

const ProgressBar = memo(({ 
  currentTime, 
  duration, 
  onProgressBarClick,
  progressBarRef,
  formatTime 
}) => {
  return (
    <div className="mb-4 flex-shrink-0">
      <div 
        className="h-1 bg-gray-600 rounded-full cursor-pointer"
        onClick={onProgressBarClick}
      >
        <div 
          ref={progressBarRef}
          className="h-full bg-blue-500 rounded-full relative"
          style={{ width: '0%' }}
        >
          <span className="absolute -right-1 -top-1 w-3 h-3 bg-white rounded-full"></span>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
