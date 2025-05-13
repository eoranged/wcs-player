import { useState, useRef, useCallback, useEffect } from 'react';
import { formatTime } from '../utils/formatters';

export const useAudioPlayer = (initialSongs = []) => {
  const [songs, setSongs] = useState(initialSongs);
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
  
  // Debug current state
  useEffect(() => {
    console.log('Audio Player State:', { 
      songsCount: songs?.length || 0, 
      currentSongIndex, 
      isPlaying, 
      currentSong: currentSong?.title || 'none',
      audioSrc: audioRef.current?.src || 'none'
    });
  }, [songs, currentSongIndex, isPlaying, currentSong]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) {
      console.error('Audio element not initialized');
      return;
    }
    
    console.log('Toggle play/pause, current state:', isPlaying ? 'playing' : 'paused');
    console.log('Audio source:', audioRef.current.src);
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Check if we have songs available
      if (!songs || songs.length === 0) {
        console.error('No songs available to play');
        alert('No songs available. The music library could not be loaded.');
        return;
      }
      
      // Make sure we have a valid audio source
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        console.log('No valid audio source, setting from current song');
        
        if (currentSong && currentSong.audio) {
          console.log('Setting audio source to:', currentSong.audio);
          audioRef.current.src = currentSong.audio;
          audioRef.current.load();
        } else {
          console.error('Current song has no audio URL');
          alert('The current song has no audio URL. Please select another song.');
          return;
        }
      }
      
      // Play with better error handling
      console.log('Attempting to play audio...');
      audioRef.current.play()
        .then(() => {
          console.log('Audio playback started successfully');
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
          alert(`Could not play audio: ${error.message}. This may be due to browser autoplay restrictions or a network issue.`);
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
        audioRef.current.src = songs[currentSongIndex].audio;
        audioRef.current.load();
        setIsInitialized(true);
        console.log('Audio source set to:', songs[currentSongIndex].audio);
      } else {
        console.error('No audio URL available for current song');
      }
    }
  }, [songs, currentSongIndex]);

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
    songs,
    setSongs,
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
