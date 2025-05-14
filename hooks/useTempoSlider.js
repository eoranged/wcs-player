import { useState, useCallback, useEffect } from 'react';

export const useTempoSlider = (initialMin = 80, initialMax = 100) => {
  const [tempoRange, setTempoRange] = useState({ min: initialMin, max: initialMax });
  const [activeThumb, setActiveThumb] = useState(null);
  const [audioElement, setAudioElement] = useState(null);

  const calculateValueFromPosition = useCallback((clientX, slider) => {
    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    return Math.round(20 + percentage * 180); // 20-200 BPM range
  }, []);

  const updateTempo = useCallback((newMin, newMax) => {
    const min = Math.min(Math.max(20, newMin), 200);
    const max = Math.max(Math.min(200, newMax), 40);
    
    setTempoRange({ min, max });
    
    // Update audio playback rate if audio element is available
    if (audioElement) {
      if (activeThumb === 'min') {
        audioElement.playbackRate = min / 100;
      } else if (activeThumb === 'max') {
        audioElement.playbackRate = max / 100;
      }
    }
    
    return { min, max };
  }, [activeThumb, audioElement]);

  const handleSliderMouseMove = useCallback((e) => {
    if (!activeThumb) return;
    
    e.preventDefault();
    const slider = document.querySelector('.relative.h-12');
    if (!slider) return;
    
    const value = calculateValueFromPosition(e.clientX, slider);
    
    if (activeThumb === 'min') {
      updateTempo(value, tempoRange.max);
    } else if (activeThumb === 'max') {
      updateTempo(tempoRange.min, value);
    }
  }, [activeThumb, calculateValueFromPosition, tempoRange.min, tempoRange.max, updateTempo]);

  const handleTrackClick = useCallback((e) => {
    const slider = e.currentTarget;
    const value = calculateValueFromPosition(e.clientX, slider);
    
    // Calculate which thumb is closer to the clicked position
    const minDist = Math.abs(tempoRange.min - value);
    const maxDist = Math.abs(tempoRange.max - value);
    
    if (minDist < maxDist) {
      // Move min thumb
      updateTempo(value, tempoRange.max);
      setActiveThumb('min');
    } else {
      // Move max thumb
      updateTempo(tempoRange.min, value);
      setActiveThumb('max');
    }
  }, [calculateValueFromPosition, tempoRange.min, tempoRange.max, updateTempo]);
  
  const handleDocumentMouseUp = useCallback(() => {
    // Remove active class from all thumbs
    document.querySelectorAll('.thumb').forEach(thumb => {
      thumb.classList.remove('active');
    });
    setActiveThumb(null);
  }, []);
  
  // Set up event listeners for mouse/touch events
  useEffect(() => {
    if (activeThumb) {
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      document.addEventListener('mousemove', handleSliderMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      document.addEventListener('touchmove', handleSliderMouseMove, { passive: false });
      document.addEventListener('touchend', handleDocumentMouseUp);
      
      return () => {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleSliderMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
        document.removeEventListener('touchmove', handleSliderMouseMove);
        document.removeEventListener('touchend', handleDocumentMouseUp);
      };
    }
  }, [activeThumb, handleDocumentMouseUp, handleSliderMouseMove]);

  // Update audio element reference when it changes
  const setAudioRef = useCallback((element) => {
    if (element) {
      setAudioElement(element);
    }
  }, []);

  return {
    tempoRange,
    setTempoRange,
    activeThumb,
    setActiveThumb,
    setAudioRef,
    handleTrackClick,
    handleThumbMouseDown: (e, thumb) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveThumb(thumb);
      e.currentTarget.classList.add('active');
    },
    handleThumbTouchStart: (e, thumb) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveThumb(thumb);
    },
  };
};
