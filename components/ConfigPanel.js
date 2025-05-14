import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/ConfigPanel.module.css';
import { useDebounce } from '../hooks/useDebounce';

const ConfigPanel = ({ onClose, tempoRange, onTempoRangeChange, selectedPlaylist, onPlaylistChange }) => {
  const [localRange, setLocalRange] = useState(tempoRange);
  const [musicStyle, setMusicStyle] = useState('West Coast Swing');
  const [playlistSearch, setPlaylistSearch] = useState(selectedPlaylist ? selectedPlaylist.name : '');
  const [playlists, setPlaylists] = useState([]);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(false);
  const [localSelectedPlaylist, setLocalSelectedPlaylist] = useState(selectedPlaylist);
  const [isPlaylistDropdownOpen, setIsPlaylistDropdownOpen] = useState(false);
  
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
      
      return newRange;
    });
  };

  // Fetch playlists when music style changes or search term is updated
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!musicStyle) return;
      
      setIsPlaylistsLoading(true);
      try {
        const response = await fetch(`/api/playlists?style=${encodeURIComponent(musicStyle)}`);
        if (!response.ok) throw new Error('Failed to fetch playlists');
        
        const data = await response.json();
        setPlaylists(data);
      } catch (error) {
        console.error('Error fetching playlists:', error);
      } finally {
        setIsPlaylistsLoading(false);
      }
    };
    
    fetchPlaylists();
  }, [musicStyle]);
  
  // Filter playlists based on search term
  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    playlist.description.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  
  // Update parent component when local selected playlist changes
  useEffect(() => {
    if (onPlaylistChange && localSelectedPlaylist) {
      onPlaylistChange(localSelectedPlaylist);
    }
  }, [localSelectedPlaylist, onPlaylistChange]);
  
  // Update parent component when tempo range changes
  useEffect(() => {
    if (onTempoRangeChange) {
      onTempoRangeChange(localRange);
    }
  }, [localRange, onTempoRangeChange]);
  
  // Handle click outside playlist dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playlistDropdownRef.current && !playlistDropdownRef.current.contains(event.target) &&
          playlistInputRef.current && !playlistInputRef.current.contains(event.target)) {
        setIsPlaylistDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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
          title="Back to player"
          aria-label="Back to player"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h3>Settings</h3>
        <div className={styles.spacer}></div>
      </div>
      
      <div className={styles.configContent}>
        <div className={styles.configSection}>
          <h4>Music Style</h4>
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
        
        <div className={styles.configSection}>
          <h4>Playlist</h4>
          <div className={styles.comboboxContainer}>
            <div className={styles.inputContainer}>
              <input
                ref={playlistInputRef}
                type="text"
                className={styles.comboboxInput}
                placeholder="Search playlists..."
                value={playlistSearch}
                onChange={(e) => setPlaylistSearch(e.target.value)}
                onFocus={() => setIsPlaylistDropdownOpen(true)}
                aria-label="Search playlists"
              />
              <button 
                className={styles.comboboxButton}
                onClick={() => setIsPlaylistDropdownOpen(!isPlaylistDropdownOpen)}
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
                  <div className={styles.loadingItem}>Loading playlists...</div>
                ) : filteredPlaylists.length > 0 ? (
                  filteredPlaylists.map(playlist => (
                    <div 
                      key={playlist.id}
                      className={styles.comboboxItem}
                      onClick={() => {
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
                  <div className={styles.emptyItem}>No playlists found</div>
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
        
        <div className={styles.configSection}>
          <h4>Tempo Range</h4>
          
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
      </div>
    </div>
  );
};

export default ConfigPanel;
