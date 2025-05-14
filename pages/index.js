import { useState, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useTempoSlider } from '../hooks/useTempoSlider';
import { fetchMusicLibrary } from '../utils/api';
import ProgressBar from '../components/ProgressBar';
import Icon from '../components/Icon';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import TelegramUser from '../components/TelegramUser';
import ConfigPanel from '../components/ConfigPanel';
import VersionPanel from '../components/VersionPanel';
import { captureError, isSentryInitialized } from '../utils/errorReporting';

export default function Home() {
  // Initialize with empty array - songs will be fetched from API
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(false);

  // Use the audio player hook with the songs from state
  // This ensures the hook always has the latest songs
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
    setTempoRange,
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
      console.log('Fetching music library from API...');
      
      // Use the fixed fetchMusicLibrary utility which handles trailing slashes
      const data = await fetchMusicLibrary();
      
      // Check if we got valid data
      if (data && Array.isArray(data) && data.length > 0) {
        console.log(`Setting songs state with ${data.length} songs from API`);
        setSongs(data);
        setError(null);
        return data;
      } else {
        console.error('API returned empty or invalid data');
        setSongs([]);
        setError('No songs available. The API returned empty data.');
        return [];
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setSongs([]);
      setError(`Failed to load music library: ${error.message}. Please try again later.`);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch default playlist (West Coast Swing)
  const fetchDefaultPlaylist = async () => {
    try {
      setIsPlaylistsLoading(true);
      console.log('Fetching default playlist (West Coast Swing)...');
      
      const response = await fetch('/api/playlists?style=West%20Coast%20Swing');
      if (!response.ok) throw new Error('Failed to fetch playlists');
      
      const playlists = await response.json();
      if (playlists && playlists.length > 0) {
        console.log(`Found ${playlists.length} playlists for West Coast Swing`);
        setSelectedPlaylist(playlists[0]);
        console.log(`Selected default playlist: ${playlists[0].name}`);
      }
    } catch (error) {
      console.error('Error fetching default playlist:', error);
      // Report error to Sentry if initialized
      captureError(error, { component: 'Player', action: 'fetchDefaultPlaylist' });
    } finally {
      setIsPlaylistsLoading(false);
    }
  };

  // Load songs and default playlist on component mount
  useEffect(() => {
    console.log('Component mounted, fetching songs from API...');
    
    // Log Sentry initialization status
    console.log(`Sentry initialization status: ${isSentryInitialized() ? 'Initialized' : 'Not initialized'}`);
    
    fetchSongs();
    fetchDefaultPlaylist();
  }, []);
  
  // Log initial songs load - only once
  useEffect(() => {
    if (songs.length > 0) {
      console.log(`Songs loaded from API: ${songs.length} songs available`);
    }
  }, [songs.length > 0]); // This will only run once when songs are first loaded

  // Initialize player when songs are first loaded
  useEffect(() => {
    // Only run this effect when songs array changes
    if (songs.length > 0) {
      console.log(`Songs loaded: ${songs.length} songs available`);
      console.log('First song:', songs[0].title);
      
      // Reset player state when songs are first loaded
      if (currentSongIndex === 0 && !isPlaying && currentTime === 0) {
        // Use song duration if available, otherwise set to 0
        const songDuration = songs[0].duration || 0;
        setDuration(songDuration);
      }
    } else if (songs.length === 0) {
      console.log('No songs available in state');
    }
    // Only depend on songs array, not the playback state
  }, [songs]);

  const handleRetry = () => {
    setError(null);
    fetchSongs();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <LoadingSpinner text="Loading music library..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] p-4">
        <ErrorMessage message={error} onRetry={handleRetry} className="max-w-md" />
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-center">
          <p className="text-gray-300 mb-4">No songs available</p>
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
    <div className="max-w-md mx-auto w-full flex flex-col">
      <div className="bg-gray-800 rounded-2xl p-4 shadow-2xl flex flex-col overflow-hidden">
        {/* Top user info */}
        <div className="flex justify-end mb-2 -mt-1">
          <TelegramUser />
        </div>
        
        {!showConfigPanel ? (
          /* Player Content */
          <>
            {/* Album Art */}
            <div className="relative pt-[50%] mb-4 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0 max-w-[250px] mx-auto w-full">
              {currentSong.cover && (
                <img 
                  src={currentSong.cover} 
                  alt={`${currentSong.title} album art`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>

            {/* Song Info */}
            <div className="mb-4 text-center">
              <h2 className="text-xl font-semibold text-white mb-1">{currentSong.title}</h2>
              <p className="text-gray-400">{currentSong.artist}</p>
              <p className="text-gray-500 text-sm">{currentSong.album}</p>
              
              {/* Playlist, Tempo Info and Config Button */}
              <div className="mt-3 pt-2 border-t border-gray-700 relative">
                <div className="flex flex-col items-center">
                  {selectedPlaylist && (
                    <div className="flex items-center justify-center mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 mr-1">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                      </svg>
                      <p className="text-blue-400 text-xs">{selectedPlaylist.name}</p>
                    </div>
                  )}
                  
                  {tempoRange && (
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 mr-1">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <p className="text-green-400 text-xs">{tempoRange.min}-{tempoRange.max} BPM</p>
                    </div>
                  )}
                </div>
                
                {/* Config Button - Positioned Absolutely */}
                <button
                  onClick={() => setShowConfigPanel(true)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                  title="Settings"
                  aria-label="Open settings"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div 
                className="relative h-2 bg-gray-700 rounded-full cursor-pointer"
                ref={progressBarRef}
                onClick={handleProgressBarClick}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full -translate-y-1/2 translate-x-1/2 shadow-md"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
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
          </>
        ) : (
          /* Config Panel Content */
          <ConfigPanel
            onClose={() => setShowConfigPanel(false)}
            tempoRange={tempoRange}
            onTempoRangeChange={setTempoRange}
            selectedPlaylist={selectedPlaylist}
            onPlaylistChange={setSelectedPlaylist}
          />
        )}
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
