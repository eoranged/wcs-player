import { useState, useEffect } from 'react';
import { fetchMusicLibrary, fetchPlaylists } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { captureError, isSentryInitialized } from '../utils/errorReporting';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import HomePage from '../components/HomePage';
import DancerLoader from '../components/DancerLoader';
import { usePlayerContext } from '../components/Layout';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default function Home() {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDancerLoader, setShowDancerLoader] = useState(true);

  // Use the player context from Layout
  const {
    songs,
    setSongs,
    selectedPlaylist,
    setSelectedPlaylist,
    tempoRange,
    setTempoRange,
    showFullPlayer,
    setShowFullPlayer,
  } = usePlayerContext();

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
  const fetchSongs = async (playlistId) => {
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

  // Re-filter songs when tempo range changes
  useEffect(() => {
    // Skip on initial render
    if (songs.length > 0 && selectedPlaylist) {
      console.log(`Tempo range changed to ${tempoRange.min}-${tempoRange.max} BPM, re-filtering songs...`);
      fetchSongs(selectedPlaylist.id);
    }
  }, [tempoRange]);

  useEffect(() => {
    // Show the dancer loader for 1.5 seconds on app start
    const timer = setTimeout(() => setShowDancerLoader(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setError(null);
    if (selectedPlaylist) {
      fetchSongs(selectedPlaylist.id);
    }
  };

  if (showDancerLoader) {
    return <DancerLoader text="Warming up the dance floor..." />;
  }

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

  // Show HomePage with playlist selection
  return (
    <div className="max-w-md mx-auto w-full flex flex-col">
      <HomePage
        tempoRange={tempoRange}
        onPlaylistSelect={async (playlist) => {
          setSelectedPlaylist(playlist);
          setIsLoading(true);
          try {
            const data = await fetchMusicLibrary(playlist.id);
            const filtered = filterSongsByTempo(data, tempoRange);
            setSongs(filtered);
            setError(null);
            
            // Show the full player when a playlist is selected and has songs
            if (filtered.length > 0) {
              setShowFullPlayer(true);
            }
          } catch (e) {
            setError('Failed to load playlist');
          } finally {
            setIsLoading(false);
          }
        }}
      />
    </div>
  );
}
