# Base URL Configuration

This Next.js app has been updated to support external base URLs for styles, playlists, and audio files through environment variables. This allows you to serve static assets from CDNs or external services instead of the local `/public` folder.

## Environment Variables

The following environment variables can be configured to use external base URLs:

### `NEXT_PUBLIC_STYLES_BASE_URL`
- **Purpose**: Base URL for style configuration files
- **Default**: Empty (uses local `/public/styles/` folder)
- **Example**: `https://cdn.example.com/music-app`
- **Files affected**: 
  - `/styles/west_coast_swing.json`
  - `/styles/bachata.json`
  - `/styles/salsa.json`

### `NEXT_PUBLIC_PLAYLISTS_BASE_URL`
- **Purpose**: Base URL for playlist files
- **Default**: Empty (uses local `/public/playlists/` folder)
- **Example**: `https://api.example.com/music-app`
- **Files affected**: All JSON files in `/playlists/` directory

### `NEXT_PUBLIC_AUDIO_BASE_URL`
- **Purpose**: Base URL for audio files
- **Default**: Empty (uses URLs as-is from playlist files)
- **Example**: `https://audio-cdn.example.com`
- **Usage**: Applied to audio URLs that don't start with `http`

## Configuration Examples

### Development (Local Files)
```bash
# .env.development
NEXT_PUBLIC_STYLES_BASE_URL=
NEXT_PUBLIC_PLAYLISTS_BASE_URL=
NEXT_PUBLIC_AUDIO_BASE_URL=
```

### Production (External CDN)
```bash
# .env.production
NEXT_PUBLIC_STYLES_BASE_URL=https://cdn.mycompany.com/music-app
NEXT_PUBLIC_PLAYLISTS_BASE_URL=https://api.mycompany.com/music-data
NEXT_PUBLIC_AUDIO_BASE_URL=https://audio-cdn.mycompany.com
```

### Mixed Configuration
```bash
# Use external API for playlists but local styles and audio
NEXT_PUBLIC_STYLES_BASE_URL=
NEXT_PUBLIC_PLAYLISTS_BASE_URL=https://api.mycompany.com/music-data
NEXT_PUBLIC_AUDIO_BASE_URL=
```

## How It Works

1. **Styles**: When fetching style configurations, the app will look for files like:
   - Local: `/styles/west_coast_swing.json`
   - External: `https://cdn.example.com/music-app/styles/west_coast_swing.json`

2. **Playlists**: When fetching playlist data, the app will look for files like:
   - Local: `/playlists/wcs_beginner.json`
   - External: `https://api.example.com/music-app/playlists/wcs_beginner.json`

3. **Audio**: When processing audio URLs from playlists:
   - If the URL starts with `http`, it's used as-is
   - If not, and `NEXT_PUBLIC_AUDIO_BASE_URL` is set, it's prefixed with the base URL
   - Otherwise, the original URL is used (typically for local files)

## File Structure Requirements

If using external URLs, ensure your external server has the same file structure as the local `/public` folder:

```
your-cdn.com/
├── styles/
│   ├── west_coast_swing.json
│   ├── bachata.json
│   └── salsa.json
└── playlists/
    ├── wcs_beginner.json
    ├── wcs_intermediate.json
    └── ...
```

## CORS Considerations

When using external base URLs, ensure your external servers have proper CORS headers configured to allow requests from your domain.

## Deployment

1. Set the appropriate environment variables in your deployment platform
2. Ensure external URLs are accessible and return proper JSON responses
3. Test the configuration in a staging environment before production deployment

## Fallback Behavior

- If external URLs fail to load, the app will throw an error
- The UI is designed to handle these gracefully where possible
- Consider implementing retry logic or fallback mechanisms for production use