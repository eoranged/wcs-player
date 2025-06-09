import { useEffect, useRef } from 'react';

export const useMediaSession = ({
  currentSong,
  isPlaying,
  playNextSong,
  playPreviousSong,
  togglePlayPause,
  currentTime,
  duration,
}) => {
  const mediaSessionRef = useRef(null);

  // Initialize Media Session API
  useEffect(() => {
    if ('mediaSession' in navigator) {
      mediaSessionRef.current = navigator.mediaSession;
      
      // Set action handlers
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          if (!isPlaying) {
            togglePlayPause();
          }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          if (isPlaying) {
            togglePlayPause();
          }
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          playPreviousSong();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          playNextSong();
        });

        // Seek handlers for more advanced control
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          // Seek backward by 10 seconds or the specified seek offset
          const skipTime = details.seekOffset || 10;
          const audio = document.querySelector('audio');
          if (audio) {
            audio.currentTime = Math.max(0, audio.currentTime - skipTime);
          }
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          // Seek forward by 10 seconds or the specified seek offset
          const skipTime = details.seekOffset || 10;
          const audio = document.querySelector('audio');
          if (audio) {
            audio.currentTime = Math.min(audio.duration, audio.currentTime + skipTime);
          }
        });

        navigator.mediaSession.setActionHandler('seekto', (details) => {
          const audio = document.querySelector('audio');
          if (audio && details.seekTime !== undefined) {
            audio.currentTime = details.seekTime;
          }
        });

        console.log('Media Session API initialized successfully');
      } catch (error) {
        console.warn('Error setting up Media Session handlers:', error);
      }
    } else {
      console.warn('Media Session API not supported in this browser');
    }

    // Cleanup function
    return () => {
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('previoustrack', null);
          navigator.mediaSession.setActionHandler('nexttrack', null);
          navigator.mediaSession.setActionHandler('seekbackward', null);
          navigator.mediaSession.setActionHandler('seekforward', null);
          navigator.mediaSession.setActionHandler('seekto', null);
        } catch (error) {
          console.warn('Error cleaning up Media Session handlers:', error);
        }
      }
    };
  }, [isPlaying, togglePlayPause, playNextSong, playPreviousSong]);

  // Update metadata when song changes
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong && currentSong.title) {
      try {
        const metadata = {
          title: currentSong.title || 'Unknown Title',
          artist: currentSong.artist || 'Unknown Artist',
          album: currentSong.album || 'Unknown Album',
        };

        // Add artwork if available
        if (currentSong.cover) {
          metadata.artwork = [
            {
              src: currentSong.cover,
              sizes: '512x512',
              type: 'image/jpeg',
            },
            {
              src: currentSong.cover,
              sizes: '256x256',
              type: 'image/jpeg',
            },
            {
              src: currentSong.cover,
              sizes: '128x128',
              type: 'image/jpeg',
            },
            {
              src: currentSong.cover,
              sizes: '96x96',
              type: 'image/jpeg',
            },
          ];
        }

        navigator.mediaSession.metadata = new MediaMetadata(metadata);
        console.log('Media Session metadata updated:', metadata);
      } catch (error) {
        console.warn('Error updating Media Session metadata:', error);
      }
    }
  }, [currentSong]);

  // Update playback state
  useEffect(() => {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch (error) {
        console.warn('Error updating Media Session playback state:', error);
      }
    }
  }, [isPlaying]);

  // Update position state for seek bar on lock screen
  useEffect(() => {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      try {
        if (duration && !isNaN(duration) && duration > 0) {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1.0,
            position: currentTime || 0,
          });
        }
      } catch (error) {
        console.warn('Error updating Media Session position state:', error);
      }
    }
  }, [currentTime, duration]);

  return {
    isMediaSessionSupported: 'mediaSession' in navigator,
  };
};