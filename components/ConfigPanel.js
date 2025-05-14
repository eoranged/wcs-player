import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/ConfigPanel.module.css';
import { useDebounce } from '../hooks/useDebounce';
import { useTranslation } from 'next-i18next';
import { fetchPlaylists } from '../utils/api';

const ConfigPanel = ({ onClose, tempoRange, onTempoRangeChange, selectedPlaylist, onPlaylistChange }) => {
  const { t } = useTranslation('common');
  
  // State initialization with memoized initial values to prevent re-renders
  const initialRange = useRef(tempoRange).current;
  const initialPlaylist = useRef(selectedPlaylist).current;
  
  const [localRange, setLocalRange] = useState(initialRange);
  const [musicStyle, setMusicStyle] = useState('West Coast Swing');
  const [playlistSearch, setPlaylistSearch] = useState(initialPlaylist ? initialPlaylist.name : '');
  const [playlists, setPlaylists] = useState([]);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(false);
  const [localSelectedPlaylist, setLocalSelectedPlaylist] = useState(initialPlaylist);
  const [isPlaylistDropdownOpen, setIsPlaylistDropdownOpen] = useState(false);
  
  // Refs for UI elements and interaction tracking
  const playlistChangeRef = useRef(false);
  const rangeChangeRef = useRef(false);
  
  const debouncedSearch = useDebounce(playlistSearch, 300);
  const trackRef = useRef(null);
  const isDraggingRef = useRef(null);
  const playlistInputRef = useRef(null);
  const playlistDropdownRef = useRef(null);

  // Handle thumb mouse down event
  const handleThumbMouseDown = (e, thumb) => {
    e.preventDefault();
    isDraggingRef.current = thumb;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle thumb touch start event
  const handleThumbTouchStart = (e, thumb) => {
    isDraggingRef.current = thumb;
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  // Handle mouse move event
  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    updateThumbPosition(e.clientX);
  };

  // Handle touch move event
  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    updateThumbPosition(e.touches[0].clientX);
  };

  // Handle mouse up event
  const handleMouseUp = () => {
    isDraggingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Handle touch end event
  const handleTouchEnd = () => {
    isDraggingRef.current = null;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  // Handle track click event
  const handleTrackClick = (e) => {
    e.preventDefault();
    if (!trackRef.current) return;
    
    // Calculate the position relative to the track
    const rect = trackRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    
    // Determine which thumb to move based on the click position
    const minPosition = (localRange.min - 20) / 180;
    const maxPosition = (localRange.max - 20) / 180;
    
    // Move the closest thumb
    if (Math.abs(position - minPosition) < Math.abs(position - maxPosition)) {
      updateTempoValue('min', Math.round(position * 180 + 20));
    } else {
      updateTempoValue('max', Math.round(position * 180 + 20));
    }
  };

  // Update thumb position based on mouse/touch position
  const updateThumbPosition = (clientX) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    let position = (clientX - rect.left) / rect.width;
    
    // Clamp position between 0 and 1
    position = Math.max(0, Math.min(1, position));
    
    // Convert position to tempo value (20-200 BPM)
    const tempoValue = Math.round(position * 180 + 20);
    
    // Update the appropriate thumb
    updateTempoValue(isDraggingRef.current, tempoValue);
  };

  // Update tempo value with constraints
  const updateTempoValue = (thumb, value) => {
    rangeChangeRef.current = true;
    setLocalRange(prev => {
      let newRange;
      if (thumb === 'min') {
        // Ensure min doesn't exceed max - 10
        const newMin = Math.min(value, prev.max - 10);
        newRange = { ...prev, min: newMin };
      } else if (thumb === 'max') {
        // Ensure max doesn't go below min + 10
        const newMax = Math.max(value, prev.min + 10);
        newRange = { ...prev, max: newMax };
      } else {
        newRange = prev;
      }
      
      console.log('ConfigPanel: Updating tempo range:', newRange);
      return newRange;
    });
  };

  // Load playlists only when music style changes
  const loadPlaylists = useCallback(async () => {
    if (!musicStyle) return;
    
    setIsPlaylistsLoading(true);
    try {
      console.log(`ConfigPanel: Loading playlists for ${musicStyle}`);
      const data = await fetchPlaylists(musicStyle);
      setPlaylists(data);
      
      // Only select first playlist if we don't have one selected yet
      if (data.length > 0 && !localSelectedPlaylist && !initialPlaylist) {
        console.log('ConfigPanel: Setting initial playlist selection');
        const firstPlaylist = data[0];
        setLocalSelectedPlaylist(firstPlaylist);
        setPlaylistSearch(firstPlaylist.name);
        playlistChangeRef.current = true;
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setIsPlaylistsLoading(false);
    }
  }, [musicStyle, initialPlaylist, localSelectedPlaylist]);
  
  // Load playlists when music style changes
  useEffect(() => {
    loadPlaylists();
  }, [musicStyle, loadPlaylists]);
  
  // Filter playlists based on search term and tempo range
  const filteredPlaylists = playlists.filter(playlist => {
    // First check if the playlist name or description matches the search term
    const matchesSearch = 
      playlist.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      playlist.description.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    // Then check if the playlist's tempo range overlaps with the selected tempo range
    // A playlist is excluded only if it's completely outside the selected range
    const matchesTempo = 
      !(playlist.tempoMax < localRange.min || playlist.tempoMin > localRange.max);
    
    return matchesSearch && matchesTempo;
  });
  
  // Notify parent component when playlist changes, but only when needed
  useEffect(() => {
    // Only call onPlaylistChange if the playlist was changed by user interaction
    if (playlistChangeRef.current && onPlaylistChange && localSelectedPlaylist) {
      console.log('ConfigPanel: Notifying parent of playlist change:', localSelectedPlaylist.name);
      onPlaylistChange(localSelectedPlaylist);
      playlistChangeRef.current = false;
    }
  }, [localSelectedPlaylist, onPlaylistChange]);
  
  // Update parent component when tempo range changes
  useEffect(() => {
    // Only call onTempoRangeChange if the range was changed by user interaction
    if (rangeChangeRef.current && onTempoRangeChange) {
      console.log('ConfigPanel: Notifying parent of tempo range change:', localRange);
      onTempoRangeChange(localRange);
      rangeChangeRef.current = false;
    }
  }, [localRange, onTempoRangeChange]);
  
  // Handle click outside playlist dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playlistDropdownRef.current && !playlistDropdownRef.current.contains(event.target) &&
          playlistInputRef.current && !playlistInputRef.current.contains(event.target)) {
        setIsPlaylistDropdownOpen(false);
        
        // If no playlist is selected and search is empty, restore the previous selection
        if (!localSelectedPlaylist && selectedPlaylist) {
          setLocalSelectedPlaylist(selectedPlaylist);
          setPlaylistSearch(selectedPlaylist.name);
        } else if (localSelectedPlaylist) {
          // Make sure the input shows the selected playlist name
          setPlaylistSearch(localSelectedPlaylist.name);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [localSelectedPlaylist, selectedPlaylist]);
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      // Apply final range value when closing
      if (onTempoRangeChange) {
        onTempoRangeChange(localRange);
      }
    };
  }, [localRange, onTempoRangeChange, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div className={styles.configPanel}>
      <div className={styles.configHeader}>
        <button 
          onClick={onClose} 
          className={styles.backButton} 
          title={t('controls.back')}
          aria-label={t('controls.back')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div className={styles.spacer}></div>
      </div>
      
      <div className={styles.configContent}>
        {/* Music Style Section */}
        <div className={styles.configSection}>
          <h4>{t('config.musicStyle')}</h4>
          <div className={styles.selectContainer}>
            <select 
              className={styles.select}
              value={musicStyle}
              onChange={(e) => setMusicStyle(e.target.value)}
              aria-label="Select music style"
            >
              <option value="West Coast Swing">West Coast Swing</option>
              <option value="Bachata">Bachata</option>
              <option value="Salsa">Salsa</option>
            </select>
            <div className={styles.selectArrow}></div>
          </div>
        </div>
        
        {/* Tempo Range Section - Placed right after style selection */}
        <div className={styles.configSection}>
          <h4>{t('config.tempoRange')}</h4>
          
          <div className={styles.tempoRangeSlider}>
            {/* Background track */}
            <div 
              ref={trackRef}
              className={styles.sliderTrack}
            >
              {/* Selected range */}
              <div 
                className={styles.sliderRange}
                style={{
                  left: `${((localRange.min - 20) / 180) * 100}%`,
                  right: `${100 - ((localRange.max - 20) / 180) * 100}%`
                }}
              ></div>
              
              {/* Min thumb */}
              <div 
                className={styles.sliderThumb}
                style={{
                  left: `${((localRange.min - 20) / 180) * 100}%`
                }}
                onMouseDown={(e) => handleThumbMouseDown(e, 'min')}
                onTouchStart={(e) => handleThumbTouchStart(e, 'min')}
              >
                <div className={styles.thumbLabel}>
                  {localRange.min}
                </div>
              </div>
              
              {/* Max thumb */}
              <div 
                className={styles.sliderThumb}
                style={{
                  left: `${((localRange.max - 20) / 180) * 100}%`
                }}
                onMouseDown={(e) => handleThumbMouseDown(e, 'max')}
                onTouchStart={(e) => handleThumbTouchStart(e, 'max')}
              >
                <div className={styles.thumbLabel}>
                  {localRange.max}
                </div>
              </div>
              
              {/* Clickable area */}
              <div 
                className={styles.sliderClickArea}
                onMouseDown={handleTrackClick}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const fakeEvent = { 
                    clientX: touch.clientX,
                    preventDefault: () => {}
                  };
                  handleTrackClick(fakeEvent);
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Playlists Section - Now comes after tempo range */}
        <div className={styles.configSection}>
          <h4>{t('config.playlists')}</h4>
          <div className={styles.comboboxContainer}>
            <div className={styles.inputContainer}>
              <input
                ref={playlistInputRef}
                type="text"
                className={styles.comboboxInput}
                placeholder={t('config.searchPlaylists')}
                value={playlistSearch}
                onChange={(e) => setPlaylistSearch(e.target.value)}
                onFocus={() => {
                  setIsPlaylistDropdownOpen(true);
                  // Reset search filter when opening dropdown
                  setPlaylistSearch('');
                }}
                aria-label="Search playlists"
              />
              <button 
                className={styles.comboboxButton}
                onClick={() => {
                  const newState = !isPlaylistDropdownOpen;
                  setIsPlaylistDropdownOpen(newState);
                  // Reset search filter when opening dropdown
                  if (newState) {
                    setPlaylistSearch('');
                  }
                }}
                aria-label="Toggle playlist dropdown"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
            
            {isPlaylistDropdownOpen && (
              <div className={styles.comboboxDropdown} ref={playlistDropdownRef}>
                {isPlaylistsLoading ? (
                  <div className={styles.loadingItem}>{t('config.loadingPlaylists')}</div>
                ) : filteredPlaylists.length > 0 ? (
                  filteredPlaylists.map(playlist => (
                    <div 
                      key={playlist.id}
                      className={styles.comboboxItem}
                      onClick={() => {
                        console.log('ConfigPanel: User selected playlist:', playlist.name);
                        playlistChangeRef.current = true;
                        setLocalSelectedPlaylist(playlist);
                        setPlaylistSearch(playlist.name);
                        setIsPlaylistDropdownOpen(false);
                      }}
                    >
                      <div className={styles.comboboxItemName}>{playlist.name}</div>
                      <div className={styles.comboboxItemDescription}>{playlist.description}</div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyItem}>{t('config.noPlaylistsFound')}</div>
                )}
              </div>
            )}
          </div>
          
          {localSelectedPlaylist && (
            <div className={styles.selectedPlaylist}>
              <div className={styles.selectedPlaylistName}>{localSelectedPlaylist.name}</div>
              <div className={styles.selectedPlaylistDescription}>{localSelectedPlaylist.description}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
