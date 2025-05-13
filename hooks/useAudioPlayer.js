import { useState, useRef, useCallback, useEffect } from 'react';
import { formatTime } from '../utils/formatters';

export const useAudioPlayer = (initialSongs = []) => {
  const [songs, setSongs] = useState(initialSongs);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const animationRef = useRef(null);

  const currentSong = songs[currentSongIndex] || {};

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

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
      audioRef.current.src = currentSong.audio || '';
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
      }
    }
  }, [currentSongIndex, songs, isPlaying, currentSong.audio]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    songs,
    setSongs,
    currentSongIndex,
    setCurrentSongIndex,
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
  };
};
