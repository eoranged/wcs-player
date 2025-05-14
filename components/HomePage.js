import React, { useState, useEffect } from 'react';
import { fetchPlaylists } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

const MUSIC_STYLES = [
  { key: 'West Coast Swing', label: 'West Coast Swing' },
  { key: 'Bachata', label: 'Bachata' },
  { key: 'Salsa', label: 'Salsa' },
];

const PLACEHOLDER_IMG = 'https://placehold.co/100x80?text=Playlist';

const HomePage = ({ tempoRange }) => {
  const [selectedStyle, setSelectedStyle] = useState('West Coast Swing');
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPlaylists(selectedStyle)
      .then((data) => setPlaylists(data))
      .finally(() => setIsLoading(false));
  }, [selectedStyle]);

  // Helper to get only the first row of the description
  const getFirstRow = (desc) => desc.split('\n')[0];

  // Filter playlists by tempo range
  const filteredPlaylists = playlists.filter((playlist) => {
    if (!tempoRange) return true;
    return playlist.minTempo <= tempoRange.max && playlist.maxTempo >= tempoRange.min;
  });

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 py-6">
      {/* Music Styles Bar */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {MUSIC_STYLES.map((style) => (
          <button
            key={style.key}
            className={`px-5 py-2 rounded-full font-semibold text-base whitespace-nowrap transition-colors duration-150 focus:outline-none ${
              selectedStyle === style.key
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
            onClick={() => setSelectedStyle(style.key)}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Playlists Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <LoadingSpinner text="Loading playlists..." />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {filteredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="relative bg-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col cursor-pointer group"
              title={playlist.description}
            >
              {/* Image with overlay */}
              <div className="relative w-full aspect-square h-20 sm:h-24">
                <img
                  src={PLACEHOLDER_IMG}
                  alt="Playlist cover"
                  className="w-full h-full object-cover"
                />
                {/* Overlay for title and tempo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-1">
                  <div className="text-white font-bold text-xs truncate drop-shadow-md leading-tight">{playlist.name}</div>
                  <div className="text-[10px] text-green-200 font-semibold drop-shadow-md leading-tight">{playlist.minTempo}-{playlist.maxTempo} BPM</div>
                </div>
              </div>
              {/* Description (first row only) */}
              <div className="px-1 pb-2 pt-1 text-[11px] text-gray-200 truncate" style={{whiteSpace: 'nowrap'}}>
                {getFirstRow(playlist.description)}
              </div>
            </div>
          ))}
          {filteredPlaylists.length === 0 && (
            <div className="col-span-3 text-center text-gray-400">No playlists found for this style and tempo range.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage; 