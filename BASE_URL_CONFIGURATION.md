# Base URL Configuration

This Next.js app has been updated to support a single external base URL for styles, playlists, and audio files through environment variables. This allows you to serve all static assets from a CDN or external service instead of local files.

## Environment Variable

The following environment variable must be configured to use external resources:

### `NEXT_PUBLIC_BASE_URL`
- **Purpose**: Single base URL for all resource types (styles, playlists, and audio)
- **Required**: Yes (the app will not work without this configuration)
- **Example**: `https://cdn.example.com/music-app`
- **Files affected**: 
  - All JSON files in `/styles/` directory
  - All JSON files in `/playlists/` directory
  - All audio files referenced in playlists (if they don't start with `http`)

## Configuration Examples

### Production (External CDN)
```bash
# .env.production
NEXT_PUBLIC_BASE_URL=https://cdn.mycompany.com/music-app
```

### Development (External Server)
```bash
# .env.development
NEXT_PUBLIC_BASE_URL=https://api.mycompany.com/music-data
```

## How It Works

The app now requires all resources to be served from the configured base URL:

1. **Styles**: The app will fetch style configurations from:
   - `https://cdn.example.com/music-app/styles/west_coast_swing.json`
   - `https://cdn.example.com/music-app/styles/bachata.json`
   - `https://cdn.example.com/music-app/styles/salsa.json`

2. **Playlists**: The app will fetch playlist data from:
   - `https://cdn.example.com/music-app/playlists/wcs_beginner.json`
   - `https://cdn.example.com/music-app/playlists/bachata_moderna.json`
   - And all other playlist files

3. **Audio**: When processing audio URLs from playlists:
   - If the URL starts with `http`, it's used as-is
   - If not, it's prefixed with the base URL: `https://cdn.example.com/music-app/audio/song.mp3`

## File Structure Requirements

Your external server must have the following file structure:

```
your-cdn.com/music-app/
├── styles/
│   ├── west_coast_swing.json
│   ├── bachata.json
│   └── salsa.json
├── playlists/
│   ├── wcs_beginner.json
│   ├── wcs_intermediate.json
│   ├── wcs_advanced.json
│   ├── wcs_contemporary.json
│   ├── wcs_classics.json
│   ├── wcs_competitions.json
│   ├── wcs_showcase.json
│   ├── bachata_traditional.json
│   ├── bachata_moderna.json
│   ├── bachata_sensual.json
│   ├── salsa_cubana.json
│   ├── salsa_linea.json
│   └── salsa_romantica.json
└── audio/ (optional, if you want to serve audio files)
    ├── song1.mp3
    ├── song2.mp3
    └── ...
```

## Required Playlist Files

The application expects the following playlist files to be available:

- `bachata_moderna.json`
- `bachata_sensual.json`
- `bachata_traditional.json`
- `salsa_cubana.json`
- `salsa_linea.json`
- `salsa_romantica.json`
- `wcs_advanced.json`
- `wcs_beginner.json`
- `wcs_classics.json`
- `wcs_competitions.json`
- `wcs_contemporary.json`
- `wcs_intermediate.json`
- `wcs_showcase.json`

## CORS Considerations

When using external base URLs, ensure your external server has proper CORS headers configured to allow requests from your domain:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type
```

## Deployment

1. Set the `NEXT_PUBLIC_BASE_URL` environment variable in your deployment platform
2. Ensure the external URL is accessible and returns proper JSON responses
3. Upload all required style and playlist JSON files to your external server
4. Test the configuration in a staging environment before production deployment

## Error Handling

- If `NEXT_PUBLIC_BASE_URL` is not configured, the app will show configuration errors
- If external URLs fail to load, the app will display appropriate error messages
- The API endpoints will return 500 errors if the base URL is not configured
- Consider implementing retry logic or fallback mechanisms for production use

## Migration from Multiple Base URLs

If you previously used separate base URLs for styles, playlists, and audio, you need to:

1. Consolidate all resources under a single base URL structure
2. Update your environment variables to use `NEXT_PUBLIC_BASE_URL`
3. Remove the old environment variables:
   - `NEXT_PUBLIC_STYLES_BASE_URL`
   - `NEXT_PUBLIC_PLAYLISTS_BASE_URL`
   - `NEXT_PUBLIC_AUDIO_BASE_URL`