import React, { useState, useEffect, createContext, useContext } from 'react';
import TopPanel from './TopPanel';
import { useTempoSlider } from '../hooks/useTempoSlider';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useMediaSession } from '../hooks/useMediaSession';
import Player from './Player';

// Create context for global player state
const PlayerContext = createContext();

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};

const Layout = ({ children }) => {
  const { tempoRange, setTempoRange } = useTempoSlider();
  const [songs, setSongs] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  // Use the audio player hook with the songs from state
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

  const currentSong = songs[currentSongIndex] || {};
  const hasActiveSong = songs.length > 0 && currentSong.title;

  // Initialize Media Session API for system-level controls
  const { isMediaSessionSupported } = useMediaSession({
    currentSong,
    isPlaying,
    playNextSong,
    playPreviousSong,
    togglePlayPause,
    currentTime,
    duration,
  });

  // Player context value
  const playerContextValue = {
    songs,
    setSongs,
    selectedPlaylist,
    setSelectedPlaylist,
    currentSong,
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
    showFullPlayer,
    setShowFullPlayer,
    tempoRange,
    setTempoRange,
    isMediaSessionSupported,
  };

  return (
    <PlayerContext.Provider value={playerContextValue}>
      <div className="relative min-h-screen flex flex-col">
        <TopPanel tempoRange={tempoRange} setTempoRange={setTempoRange} />
        <div className="flex-1 overflow-auto pb-20">
          {React.cloneElement(children, { tempoRange, setTempoRange })}
        </div>
        
        {/* Persistent Audio Element */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={playNextSong}
          className="hidden"
          preload="metadata"
        />

        {/* Mini Player - Always visible when there's an active song */}
        {hasActiveSong && !showFullPlayer && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-3 z-50">
            <div className="max-w-md mx-auto flex items-center space-x-3">
              {/* Album Art */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                {currentSong.cover ? (
                  <img
                    src={currentSong.cover}
                    alt={`${currentSong.title} album art`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 1v6m0 6v6"></path>
                      <path d="m21 12-6-3-6 3-6-3"></path>
                    </svg>
                  </div>
                )}
              </div>

              {/* Song Info */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => setShowFullPlayer(true)}
              >
                <p className="text-white text-sm font-medium truncate">{currentSong.title}</p>
                <p className="text-gray-400 text-xs truncate">{currentSong.artist}</p>
              </div>

              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 focus:outline-none flex-shrink-0"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto mt-2">
              <div
                className="relative h-1 bg-gray-700 rounded-full cursor-pointer overflow-hidden"
                onClick={handleProgressBarClick}
              >
                <div
                  ref={progressBarRef}
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Full Player Modal */}
        {showFullPlayer && hasActiveSong && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Now Playing</h3>
                <button
                  onClick={() => setShowFullPlayer(false)}
                  className="text-gray-400 hover:text-white focus:outline-none"
                  aria-label="Close player"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <Player
                currentSong={currentSong}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                progressBarRef={progressBarRef}
                formatTime={formatTime}
                handleProgressBarClick={handleProgressBarClick}
                playPreviousSong={playPreviousSong}
                togglePlayPause={togglePlayPause}
                playNextSong={playNextSong}
                selectedPlaylist={selectedPlaylist}
                tempoRange={tempoRange}
              />
            </div>
          </div>
        )}
      </div>
    </PlayerContext.Provider>
  );
};

export default Layout;
