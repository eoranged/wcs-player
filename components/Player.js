import React from 'react';

export default function Player({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  progressBarRef,
  formatTime,
  handleProgressBarClick,
  playPreviousSong,
  togglePlayPause,
  playNextSong,
  selectedPlaylist,
  tempoRange,
  setShowConfigPanel,
}) {
  return (
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
          className="relative h-2 bg-gray-700 rounded-full cursor-pointer overflow-hidden"
          onClick={handleProgressBarClick}
        >
          {/* Background track indicator */}
          <div className="absolute top-0 left-0 h-full w-full bg-gray-600 rounded-full"></div>
          {/* Playback progress */}
          <div 
            ref={progressBarRef}
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
  );
} 