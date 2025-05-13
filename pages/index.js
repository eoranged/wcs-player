import { useState, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useTempoSlider } from '../hooks/useTempoSlider';
import { fetchMusicLibrary } from '../utils/api';
import ProgressBar from '../components/ProgressBar';
import TempoSlider from '../components/TempoSlider';
import Icon from '../components/Icon';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use the audio player hook
  const {
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    audioRef,
    progressBarRef,
    togglePlayPause,
    playNextSong,
    playPreviousSong,
    handleTimeUpdate,
    handleProgressBarClick,
    formatTime,
    setCurrentSongIndex,
    setIsPlaying,
    setCurrentTime,
    setDuration,
  } = useAudioPlayer(songs);

  // Use the tempo slider hook
  const {
    tempoRange,
    setAudioRef,
    handleTrackClick,
    handleThumbMouseDown,
    handleThumbTouchStart,
  } = useTempoSlider();

  // Set the audio element reference in the tempo slider hook
  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef.current);
    }
  }, [audioRef, setAudioRef]);

  // Fetch songs from the API
  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      const data = await fetchMusicLibrary();
      setSongs(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError('Failed to load music library. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchSongs();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner text="Loading music library..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <ErrorMessage message={error} onRetry={handleRetry} className="max-w-md" />
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No songs available</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
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
