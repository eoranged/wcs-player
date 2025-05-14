import React, { useRef, useState, useEffect } from 'react';
import Thumb from './Thumb';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const TempoSlider = ({
  value = { min: 80, max: 100 },
  onChange,
  minLimit = 20,
  maxLimit = 200,
  minDistance = 10,
  className = ''
}) => {
  const [localRange, setLocalRange] = useState(value);
  const [activeThumb, setActiveThumb] = useState(null);
  const sliderRef = useRef(null);

  // Keep local state in sync with parent
  useEffect(() => {
    setLocalRange(value);
  }, [value.min, value.max]);

  // Drag logic
  useEffect(() => {
    if (!activeThumb) return;
    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clamp(clientX - rect.left, 0, rect.width);
      const percent = x / rect.width;
      const val = Math.round(minLimit + percent * (maxLimit - minLimit));
      setLocalRange((prev) => {
        if (activeThumb === 'min') {
          return { ...prev, min: Math.min(val, prev.max - minDistance) };
        } else {
          return { ...prev, max: Math.max(val, prev.min + minDistance) };
        }
      });
    };
    const handleUp = () => {
      setActiveThumb(null);
      if (onChange) onChange(localRange);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [activeThumb, localRange, minLimit, maxLimit, minDistance, onChange]);

  // Track click
  const handleTrackClick = (e) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clamp(clientX - rect.left, 0, rect.width);
    const percent = x / rect.width;
    const val = Math.round(minLimit + percent * (maxLimit - minLimit));
    const minDist = Math.abs(localRange.min - val);
    const maxDist = Math.abs(localRange.max - val);
    if (minDist < maxDist) {
      setLocalRange((prev) => {
        const newRange = { ...prev, min: Math.min(val, prev.max - minDistance) };
        if (onChange) onChange(newRange);
        return newRange;
      });
    } else {
      setLocalRange((prev) => {
        const newRange = { ...prev, max: Math.max(val, prev.min + minDistance) };
        if (onChange) onChange(newRange);
        return newRange;
      });
    }
  };

  const minPosition = ((localRange.min - minLimit) / (maxLimit - minLimit)) * 100;
  const maxPosition = ((localRange.max - minLimit) / (maxLimit - minLimit)) * 100;

  return (
    <div className={`w-full ${className}`}>
      <div ref={sliderRef} className="relative h-12 select-none" style={{ touchAction: 'none' }}>
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-700 rounded-full -translate-y-1/2" />
        {/* Selected range */}
        <div
          className="absolute top-1/2 h-1.5 bg-blue-500 rounded-full -translate-y-1/2"
          style={{ left: `${minPosition}%`, right: `${100 - maxPosition}%` }}
        />
        {/* Min thumb */}
        <Thumb
          position={minPosition}
          onMouseDown={() => setActiveThumb('min')}
          onTouchStart={() => setActiveThumb('min')}
        />
        {/* Max thumb */}
        <Thumb
          position={maxPosition}
          onMouseDown={() => setActiveThumb('max')}
          onTouchStart={() => setActiveThumb('max')}
        />
        {/* Clickable track */}
        <div
          className="absolute inset-0 cursor-pointer"
          onMouseDown={handleTrackClick}
          onTouchStart={handleTrackClick}
        />
      </div>
      <div className="flex w-full justify-between mt-2 text-xs text-green-400 font-bold">
        <span>Min: {localRange.min}</span>
        <span>Max: {localRange.max}</span>
      </div>
    </div>
  );
};

export default TempoSlider;
