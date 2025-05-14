import { useState, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { fetchMusicLibrary, fetchPlaylists } from '../utils/api';
import ProgressBar from '../components/ProgressBar';
import Icon from '../components/Icon';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import TelegramUser from '../components/TelegramUser';
import TelegramUserProfile from '../components/TelegramUserProfile';
import ProfilePanel from '../components/ProfilePanel';
import HelpPanel from '../components/HelpPanel';
import ConfigPanel from '../components/ConfigPanel';
import { captureError, isSentryInitialized } from '../utils/errorReporting';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Player from '../components/Player';
import HomePage from '../components/HomePage';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default function Home({ tempoRange, setTempoRange }) {
  const { t } = useTranslation('common');
  // Initialize with empty array - songs will be fetched from API
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'profile', 'settings', 'help', or null
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

  // Filter songs by tempo range
  const filterSongsByTempo = (songs, range) => {
    if (!songs || !Array.isArray(songs) || songs.length === 0) {
      return [];
    }
    
    // Filter songs to only include those within the tempo range
    return songs.filter(song => {
      const tempo = song.tempo;
      return tempo >= range.min && tempo <= range.max;
    });
  };
  
  // Fetch songs from local JSON files and filter by tempo range
  const fetchSongs = async (playlistId = 'wcs_beginner') => {
    try {
      setIsLoading(true);
      console.log(`Fetching songs for playlist: ${playlistId}...`);
      
      // Use the fetchMusicLibrary utility which now loads from local JSON files
      const data = await fetchMusicLibrary(playlistId);
      
      // Check if we got valid data
      if (data && Array.isArray(data) && data.length > 0) {
        console.log(`Fetched ${data.length} songs from local JSON`);
        
        // Filter songs by tempo range
        const filteredSongs = filterSongsByTempo(data, tempoRange);
        console.log(`Filtered to ${filteredSongs.length} songs within tempo range ${tempoRange.min}-${tempoRange.max} BPM`);
        
        if (filteredSongs.length > 0) {
          setSongs(filteredSongs);
          setError(null);
          return filteredSongs;
        } else {
          // If no songs match the tempo range, show all songs but display a warning
          setSongs(data);
          setError(`No songs match the current tempo range (${tempoRange.min}-${tempoRange.max} BPM). Showing all songs.`);
          return data;
        }
      } else {
        console.error('No songs found in the playlist');
        setSongs([]);
        setError('No songs available in this playlist.');
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
      
      const playlists = await fetchPlaylists('West Coast Swing');
      if (playlists && playlists.length > 0) {
        console.log(`Found ${playlists.length} playlists for West Coast Swing`);
        setSelectedPlaylist(playlists[0]);
        console.log(`Selected default playlist: ${playlists[0].name}`);
        
        // Load songs for the default playlist
        await fetchSongs(playlists[0].id);
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

  // Re-filter songs when tempo range changes
  useEffect(() => {
    // Skip on initial render
    if (songs.length > 0 && selectedPlaylist) {
      console.log(`Tempo range changed to ${tempoRange.min}-${tempoRange.max} BPM, re-filtering songs...`);
      fetchSongs(selectedPlaylist.id);
    }
  }, [tempoRange]);
  
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

  return (
    <div className="max-w-md mx-auto w-full flex flex-col">
      {/* Home Page Music Styles and Albums */}
      <HomePage tempoRange={tempoRange} />
    </div>
  );
}
