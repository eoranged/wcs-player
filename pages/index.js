import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [tempo, setTempo] = useState(100);
  
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        // Use absolute URL in development, relative in production
        const baseUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000' 
          : '';
        const response = await fetch(`${baseUrl}/api/music`);
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
    const newTempo = parseFloat(e.target.value);
    setTempo(newTempo);
    audioRef.current.playbackRate = newTempo / 100;
  };

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
    <div className="max-w-md mx-auto">
      <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
        {/* Album Art */}
        <div className="relative pt-[100%] mb-6 rounded-xl overflow-hidden bg-gray-700">
          {currentSong.cover && (
            <img
              src={currentSong.cover}
              alt={currentSong.title}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          )}
        </div>

        {/* Song Info */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-1">{currentSong.title}</h2>
          <p className="text-gray-300">{currentSong.artist}</p>
          <p className="text-sm text-gray-400">{currentSong.album}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
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

        {/* Tempo Control */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Tempo: {tempo}%</span>
            <div>
              <span className="mr-2">Min</span>
              <span>Max</span>
            </div>
          </div>
          <input
            type="range"
            min="50"
            max="200"
            value={tempo}
            onChange={handleTempoChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center space-x-8">
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
