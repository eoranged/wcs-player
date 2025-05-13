import { useState, useRef, useCallback, useEffect } from 'react';
import { formatTime } from '../utils/formatters';

export const useAudioPlayer = (initialSongs = []) => {
  // Use the songs passed from the parent component directly
  // This ensures we're always using the latest songs from the parent
  const songs = initialSongs;
  
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const animationRef = useRef(null);

  // Get current song safely
  const currentSong = songs && songs.length > 0 ? songs[currentSongIndex] || {} : {};
  
  // Log significant state changes only
  useEffect(() => {
    // Only log when playback state changes or song changes
    if (songs?.length > 0) {
      const songTitle = currentSong?.title || 'unknown';
      if (isPlaying) {
        console.log(`Playing: ${songTitle} (${currentSongIndex + 1}/${songs.length})`);
      }
    }
  }, [isPlaying, currentSongIndex, currentSong?.title]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) {
      console.error('Audio element not initialized');
      return;
    }
    
    if (isPlaying) {
      // If already playing, pause
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If paused, start playing
      
      // Check if we have songs available
      if (!songs || songs.length === 0) {
        console.error('No songs available to play');
        alert('No songs available. Please wait for the music library to load or try again later.');
        return;
      }
      
      // Make sure we have a valid audio source
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        if (currentSong && currentSong.audio) {
          audioRef.current.src = currentSong.audio;
          audioRef.current.load();
        } else {
          console.error('Current song has no audio URL');
          alert('The current song has no audio URL. Please try again later.');
          return;
        }
      }
      
      // Play with better error handling
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
          
          // More user-friendly error message
          if (error.name === 'NotAllowedError') {
            alert('Playback was blocked by your browser. Please interact with the page first (click anywhere) and try again.');
          } else {
            alert(`Could not play audio: ${error.message}. This may be due to browser autoplay restrictions or a network issue.`);
          }
        });
    }
  }, [isPlaying, songs, currentSong]);

  const playNextSong = useCallback(() => {
    setCurrentSongIndex(prevIndex => 
      prevIndex === songs.length - 1 ? 0 : prevIndex + 1
    );
  }, [songs.length]);

  const playPreviousSong = useCallback(() => {
    setCurrentSongIndex(prevIndex =>
      prevIndex === 0 ? songs.length - 1 : prevIndex - 1
    );
  }, [songs.length]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    setCurrentTime(current);
    setDuration(duration || 0);
    
    if (progressBarRef.current) {
      const progressPercent = (current / duration) * 100;
      progressBarRef.current.style.width = `${progressPercent}%`;
    }
  }, []);

  const handleProgressBarClick = useCallback((e) => {
    if (!audioRef.current) return;
    
    const progressBar = e.currentTarget;
    const clickPosition = e.clientX - progressBar.getBoundingClientRect().left;
    const progressBarWidth = progressBar.clientWidth;
    const clickPositionPercent = (clickPosition / progressBarWidth) * 100;
    const timeToSeek = (clickPositionPercent / 100) * duration;
    
    audioRef.current.currentTime = timeToSeek;
    setCurrentTime(timeToSeek);
  }, [duration]);

  // Update audio source when song changes
  useEffect(() => {
    if (songs.length > 0 && audioRef.current) {
      console.log('Updating audio source to:', currentSong.audio || 'none');
      
      // Only update if we have a valid audio source
      if (currentSong.audio) {
        audioRef.current.src = currentSong.audio;
        audioRef.current.load(); // Force reload of the audio source
        
        if (isPlaying) {
          console.log('Auto-playing after source change');
          audioRef.current.play()
            .then(() => {
              console.log('Playback started after source change');
            })
            .catch(error => {
              console.error('Error playing audio after source change:', error);
              setIsPlaying(false);
            });
        }
      } else {
        console.error('No audio source available for current song');
        setIsPlaying(false);
      }
    }
  }, [currentSongIndex, songs, isPlaying, currentSong?.audio]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Initialize audio element when songs are loaded
  useEffect(() => {
    if (songs && songs.length > 0 && audioRef.current) {
      console.log('Songs available, initializing audio element with:', songs[currentSongIndex]?.title);
      
      // Always set the source when songs change
      if (songs[currentSongIndex]?.audio) {
        // Set the source and load the audio
        audioRef.current.src = songs[currentSongIndex].audio;
        audioRef.current.load();
        
        // Mark as initialized
        setIsInitialized(true);
        console.log('Audio source set to:', songs[currentSongIndex].audio);
        
        // Set the volume (in case it was reset)
        audioRef.current.volume = 0.7;
        
        // Set preload to metadata to get duration info
        audioRef.current.preload = 'metadata';
      } else {
        console.error('No audio URL available for current song');
      }
    }
  }, [songs, currentSongIndex]);
  
  // Initialize audio when songs are loaded
  useEffect(() => {
    if (songs && songs.length > 0 && audioRef.current && !isInitialized) {
      if (songs[0]?.audio) {
        // Set up audio element with first song
        audioRef.current.src = songs[0].audio;
        audioRef.current.load();
        audioRef.current.volume = 0.7;
        audioRef.current.preload = 'metadata';
        setIsInitialized(true);
        console.log('Audio player initialized with first song');
      }
    }
  }, [songs, audioRef, isInitialized]);

  // Add error event listener to audio element
  useEffect(() => {
    const handleError = (e) => {
      console.error('Audio element error:', e);
      console.error('Error code:', audioRef.current?.error?.code);
      console.error('Error message:', audioRef.current?.error?.message);
      setIsPlaying(false);
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('error', handleError);
      return () => {
        audioRef.current?.removeEventListener('error', handleError);
      };
    }
  }, [audioRef]);

  return {
    // Don't return setSongs as we're not managing songs state internally anymore
    currentSongIndex,
    setCurrentSongIndex,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    audioRef,
    progressBarRef,
    togglePlayPause,
    playNextSong,
    playPreviousSong,
    handleTimeUpdate,
    handleProgressBarClick,
    formatTime,
  };
};
