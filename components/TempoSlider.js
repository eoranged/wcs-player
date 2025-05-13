import { memo } from 'react';
import Thumb from './Thumb';

const TempoSlider = memo(({ 
  tempoRange, 
  onTrackClick, 
  onThumbMouseDown, 
  onThumbTouchStart 
}) => {
  const minPosition = ((tempoRange.min - 20) / 180) * 100;
  const maxPosition = ((tempoRange.max - 20) / 180) * 100;

  return (
    <div className="relative h-12">
      {/* Background track */}
      <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-700 rounded-full -translate-y-1/2">
        {/* Selected range */}
        <div 
          className="absolute h-full bg-blue-500 rounded-full"
          style={{
            left: `${minPosition}%`,
            right: `${100 - maxPosition}%`
          }}
        ></div>
      </div>
      
      {/* Min thumb */}
      <Thumb
        value={tempoRange.min}
        position={minPosition}
        onMouseDown={(e) => onThumbMouseDown(e, 'min')}
        onTouchStart={(e) => onThumbTouchStart(e, 'min')}
      />
      
      {/* Max thumb */}
      <Thumb
        value={tempoRange.max}
        position={maxPosition}
        onMouseDown={(e) => onThumbMouseDown(e, 'max')}
        onTouchStart={(e) => onThumbTouchStart(e, 'max')}
      />
      
      {/* Clickable track */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onMouseDown={onTrackClick}
        onTouchStart={(e) => {
          // For touch devices, use the first touch point
          const touch = e.touches[0];
          const fakeEvent = { 
            clientX: touch.clientX,
            currentTarget: e.currentTarget,
            preventDefault: () => {}
          };
          onTrackClick(fakeEvent);
        }}
      />
    </div>
  );
});

TempoSlider.displayName = 'TempoSlider';

export default TempoSlider;
