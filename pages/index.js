import { useState, useEffect, useRef, useCallback } from 'react';

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [tempoRange, setTempoRange] = useState({ min: 80, max: 100 });
  const [activeThumb, setActiveThumb] = useState(null); // 'min' or 'max'
  
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch('/api/music');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSongs(data);
      } catch (error) {
        console.error('Error fetching songs:', error);
        // Fallback to sample data if API fails
        setSongs([
          {
            id: 1,
            title: 'Bohemian Rhapsody',
            artist: 'Queen',
            album: 'A Night at the Opera',
            cover: 'https://i.scdn.co/image/ab67616d0000b273e319baafd16e84f040e8c4ea',
            audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            tempo: 120
          },
          {
            id: 2,
            title: 'Stairway to Heaven',
            artist: 'Led Zeppelin',
            album: 'Led Zeppelin IV',
            cover: 'https://i.scdn.co/image/ab67616d0000b2733d92b2ad5af9fbc8637425f0',
            audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            tempo: 80
          },
          {
            id: 3,
            title: 'Hotel California',
            artist: 'Eagles',
            album: 'Hotel California',
            cover: 'https://i.scdn.co/image/ab67616d0000b273d5fccf9ce08b6a7e03ec5315',
            audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            tempo: 140
          }
        ]);
      }
    };

    fetchSongs();
  }, []);

  useEffect(() => {
    if (songs.length > 0) {
      if (audioRef.current) {
        audioRef.current.src = songs[currentSongIndex]?.audio;
        if (isPlaying) {
          audioRef.current.play();
        }
      }
    }
  }, [currentSongIndex, songs]);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playNextSong = () => {
    setCurrentSongIndex((prevIndex) => 
      prevIndex === songs.length - 1 ? 0 : prevIndex + 1
    );
  };

  const playPreviousSong = () => {
    setCurrentSongIndex((prevIndex) =>
      prevIndex === 0 ? songs.length - 1 : prevIndex - 1
    );
  };

  const handleTimeUpdate = () => {
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    setCurrentTime(current);
    setDuration(duration || 0);
    
    if (progressBarRef.current) {
      const progressPercent = (current / duration) * 100;
      progressBarRef.current.style.width = `${progressPercent}%`;
    }
    
    if (current >= duration) {
      playNextSong();
    }
  };

  const handleProgressBarClick = (e) => {
    const progressBar = e.currentTarget;
    const clickPosition = e.clientX - progressBar.getBoundingClientRect().left;
    const progressBarWidth = progressBar.clientWidth;
    const clickPositionPercent = clickPosition / progressBarWidth;
    const timeToSeek = clickPositionPercent * duration;
    
    audioRef.current.currentTime = timeToSeek;
    setCurrentTime(timeToSeek);
  };

  const handleTempoChange = (e) => {
    const value = parseInt(e.target.value);
    
    if (activeThumb === 'min') {
      const newMin = Math.min(value, tempoRange.max - 10); // Ensure min is at least 10 less than max
      setTempoRange(prev => ({ ...prev, min: newMin }));
      if (audioRef.current) {
        audioRef.current.playbackRate = newMin / 100;
      }
    } else if (activeThumb === 'max') {
      const newMax = Math.max(value, tempoRange.min + 10); // Ensure max is at least 10 more than min
      setTempoRange(prev => ({ ...prev, max: newMax }));
      if (audioRef.current) {
        audioRef.current.playbackRate = newMax / 100;
      }
    }
  };
  
  const calculateValueFromPosition = useCallback((clientX, slider) => {
    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    return Math.round(20 + percentage * 180); // 20-200 BPM range
  }, []);

  const handleSliderMouseMove = useCallback((e) => {
    if (!activeThumb) return;
    
    e.preventDefault();
    
    // Get the slider element
    const slider = document.querySelector('.relative.h-12');
    if (!slider) return;
    
    const value = calculateValueFromPosition(e.clientX, slider);
    
    if (activeThumb === 'min') {
      const newMin = Math.min(Math.max(20, value), tempoRange.max - 10);
      setTempoRange(prev => ({ ...prev, min: newMin }));
      if (audioRef.current) {
        audioRef.current.playbackRate = newMin / 100;
      }
    } else if (activeThumb === 'max') {
      const newMax = Math.max(Math.min(200, value), tempoRange.min + 10);
      setTempoRange(prev => ({ ...prev, max: newMax }));
      if (audioRef.current) {
        audioRef.current.playbackRate = newMax / 100;
      }
    }
  }, [activeThumb, tempoRange.min, tempoRange.max, calculateValueFromPosition]);
  
  const handleTrackClick = useCallback((e) => {
    const slider = e.currentTarget;
    const value = calculateValueFromPosition(e.clientX, slider);
    
    // Calculate which thumb is closer to the clicked position
    const minDist = Math.abs(tempoRange.min - value);
    const maxDist = Math.abs(tempoRange.max - value);
    
    if (minDist < maxDist) {
      // Move min thumb
      const newMin = Math.min(Math.max(20, value), tempoRange.max - 10);
      setTempoRange(prev => ({ ...prev, min: newMin }));
      if (audioRef.current) {
        audioRef.current.playbackRate = newMin / 100;
      }
    } else {
      // Move max thumb
      const newMax = Math.max(Math.min(200, value), tempoRange.min + 10);
      setTempoRange(prev => ({ ...prev, max: newMax }));
      if (audioRef.current) {
        audioRef.current.playbackRate = newMax / 100;
      }
    }
  }, [tempoRange.min, tempoRange.max, calculateValueFromPosition]);
  
  const handleDocumentMouseUp = useCallback((e) => {
    // Remove active class from all thumbs
    document.querySelectorAll('.thumb').forEach(thumb => {
      thumb.classList.remove('active');
    });
    setActiveThumb(null);
  }, []);
  
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
  }, [activeThumb, handleSliderMouseMove, handleDocumentMouseUp]);

  // Update playback rate when song changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = tempoRange.min / 100;
    }
  }, [currentSongIndex, tempoRange.min]);
  
  const handleThumbMouseDown = useCallback((e, thumb) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveThumb(thumb);
    
    // Add active class for visual feedback
    e.currentTarget.classList.add('active');
  }, []);
  
  const handleThumbTouchStart = useCallback((e, thumb) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveThumb(thumb);
  }, []);

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (songs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading music library...</p>
        </div>
      </div>
    );
  }

  const currentSong = songs[currentSongIndex];

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col">
      <div className="bg-gray-800 rounded-2xl p-4 shadow-2xl flex-1 flex flex-col overflow-hidden">
        {/* Album Art */}
        <div className="relative pt-[80%] mb-4 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
          {currentSong.cover && (
            <img
              src={currentSong.cover}
              alt={currentSong.title}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          )}
        </div>

        {/* Song Info */}
        <div className="text-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold mb-1">{currentSong.title}</h2>
          <p className="text-gray-300">{currentSong.artist}</p>
          <p className="text-sm text-gray-400">{currentSong.album}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 flex-shrink-0">
          <div 
            className="h-1 bg-gray-600 rounded-full cursor-pointer"
            onClick={handleProgressBarClick}
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

        {/* Tempo Range Control */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex justify-between text-sm text-gray-300 mb-4">
            <span>Tempo Range:</span>
            <span>{tempoRange.min} - {tempoRange.max} BPM</span>
          </div>
          
          <div className="relative h-12">
            {/* Background track */}
            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-700 rounded-full -translate-y-1/2">
              {/* Selected range */}
              <div 
                className="absolute h-full bg-blue-500 rounded-full"
                style={{
                  left: `${((tempoRange.min - 20) / 180) * 100}%`,
                  right: `${100 - ((tempoRange.max - 20) / 180) * 100}%`
                }}
              ></div>
            </div>
            
            {/* Min thumb */}
            <div 
              className="thumb absolute w-5 h-5 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer shadow-md hover:bg-blue-400 active:scale-110 transition-all duration-100 z-10"
              style={{
                left: `${((tempoRange.min - 20) / 180) * 100}%`,
                top: '50%'
              }}
              onMouseDown={(e) => handleThumbMouseDown(e, 'min')}
              onTouchStart={(e) => handleThumbTouchStart(e, 'min')}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-blue-400">
                {tempoRange.min}
              </div>
            </div>
            
            {/* Max thumb */}
            <div 
              className="thumb absolute w-5 h-5 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer shadow-md hover:bg-blue-400 active:scale-110 transition-all duration-100 z-10"
              style={{
                left: `${((tempoRange.max - 20) / 180) * 100}%`,
                top: '50%'
              }}
              onMouseDown={(e) => handleThumbMouseDown(e, 'max')}
              onTouchStart={(e) => handleThumbTouchStart(e, 'max')}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-blue-400">
                {tempoRange.max}
              </div>
            </div>
            
            {/* Clickable track for better UX */}
            <div 
              className="absolute inset-0 cursor-pointer"
              onMouseDown={handleTrackClick}
              onTouchStart={(e) => {
                // For touch devices, use the first touch point
                const touch = e.touches[0];
                const fakeEvent = { 
                  clientX: touch.clientX,
                  currentTarget: e.currentTarget,
                  preventDefault: () => {}
                };
                handleTrackClick(fakeEvent);
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center space-x-8 mt-auto mb-2">
          <button 
            onClick={playPreviousSong}
            className="text-gray-300 hover:text-white focus:outline-none"
            aria-label="Previous song"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l-7-7 7-7m7 14l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={togglePlayPause}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 focus:outline-none"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          
          <button 
            onClick={playNextSong}
            className="text-gray-300 hover:text-white focus:outline-none"
            aria-label="Next song"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={playNextSong}
        className="hidden"
        preload="metadata"
      />
    </div>
  );
}
