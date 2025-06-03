# Playlist Generator Script

This Python script processes music files from a directory, converts them to MP3 format, generates AcoustID fingerprints, uploads them to a server via SSH, and creates/updates playlist files for the Telegram Audio Player.

## Features

- **Audio Conversion**: Converts any audio format to MP3 using FFmpeg
- **Audio Fingerprinting**: Generates AcoustID fingerprints for duplicate detection
- **Metadata Extraction**: Extracts title, artist, album, tempo, and genre from audio files
- **Smart Categorization**: Automatically categorizes music into dance styles (Bachata, Salsa, West Coast Swing)
- **SSH Upload**: Uploads files to server without overwriting existing files
- **Playlist Management**: Creates and updates JSON playlist files
- **Style Management**: Updates style configuration files
- **Comprehensive Logging**: Detailed logging and summary reports

## Prerequisites

### System Requirements

1. **Python 3.8+**
2. **FFmpeg** - Required for audio conversion
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   
   # Windows (using chocolatey)
   choco install ffmpeg
   ```

### Python Dependencies

Install the required Python packages:

```bash
pip install -r requirements.txt
```

### AcoustID API Key

1. Register at [AcoustID.org](https://acoustid.org/)
2. Get your API key from your account settings
3. Add it to your configuration file

## Setup

1. **Copy the configuration template:**
   ```bash
   cp config.json.template config.json
   ```

2. **Edit the configuration file:**
   ```json
   {
     "acoustid": {
       "api_key": "your-actual-acoustid-api-key"
     },
     "ssh": {
       "hostname": "your-server.com",
       "username": "your-username",
       "key_filename": "~/.ssh/id_rsa",
       "remote_path": "/var/www/audio/"
     },
     "output": {
       "playlists_dir": "public/playlists",
       "styles_dir": "public/styles"
     },
     "audio": {
       "bitrate": "128k",
       "sample_rate": 44100
     },
     "tempo": {
       "default_min": 80,
       "default_max": 140
     }
   }
   ```

3. **Set up SSH key authentication:**
   - Ensure your SSH key is set up for passwordless login to your server
   - Test the connection: `ssh your-username@your-server.com`

## Usage

### Basic Usage

```bash
python generate_playlist.py /path/to/music/directory
```

### Advanced Usage

```bash
# Use custom configuration file
python generate_playlist.py /path/to/music --config my_config.json

# Use custom temporary directory
python generate_playlist.py /path/to/music --temp-dir /tmp/audio_processing

# Enable verbose logging
python generate_playlist.py /path/to/music --verbose
```

### Command Line Options

- `input_dir`: Directory containing music files (required)
- `--config`: Path to configuration file (default: config.json)
- `--temp-dir`: Temporary directory for file conversions (default: ./temp_audio)
- `--verbose`, `-v`: Enable verbose logging

## How It Works

1. **File Discovery**: Recursively scans the input directory for audio files
2. **Format Conversion**: Converts non-MP3 files to MP3 format
3. **Metadata Extraction**: Extracts metadata using mutagen library
4. **Fingerprinting**: Generates AcoustID fingerprint for each file
5. **Hash Generation**: Creates SHA1 hash of fingerprint for unique filename
6. **Upload**: Uploads MP3 file to server (skips if already exists)
7. **Style Detection**: Determines dance style based on metadata and tempo
8. **Playlist Assignment**: Assigns to appropriate playlist based on style and characteristics
9. **File Updates**: Updates playlist and style JSON files
10. **Summary Report**: Generates comprehensive processing report

## Supported Audio Formats

- MP3
- WAV
- FLAC
- AAC
- M4A
- OGG
- WMA

## Dance Style Detection

The script automatically categorizes music into dance styles:

### Bachata
- **Traditional**: Classic Dominican bachata (90-120 BPM)
- **Moderna**: Modern bachata with urban influences (100-130 BPM)
- **Sensual**: Slower, more sensual bachata (80-110 BPM)

### Salsa
- **Cubana**: Cuban-style salsa
- **Linea**: Linear salsa (default)
- **Romantica**: Romantic salsa

### West Coast Swing
- **Beginner**: Slower tempo (≤90 BPM)
- **Intermediate**: Medium tempo (91-110 BPM)
- **Advanced**: Faster tempo (>110 BPM)
- **Competitions**: Competition-style music
- **Showcase**: Showcase performance music
- **Contemporary**: Modern WCS music
- **Classics**: Classic WCS songs

## File Structure

The script creates/updates files in the following structure:

```
public/
├── playlists/
│   ├── bachata_moderna.json
│   ├── bachata_sensual.json
│   ├── bachata_traditional.json
│   ├── salsa_cubana.json
│   ├── salsa_linea.json
│   ├── salsa_romantica.json
│   ├── wcs_advanced.json
│   ├── wcs_beginner.json
│   ├── wcs_classics.json
│   ├── wcs_competitions.json
│   ├── wcs_contemporary.json
│   ├── wcs_intermediate.json
│   └── wcs_showcase.json
└── styles/
    ├── bachata.json
    ├── salsa.json
    └── west_coast_swing.json
```

## Playlist File Format

Each playlist file contains:

```json
{
  "id": "playlist_id",
  "name": "Playlist Name",
  "style": "Dance Style",
  "minTempo": 80,
  "maxTempo": 140,
  "songs": [
    {
      "id": "sha1_hash_of_fingerprint",
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "tempo": 120,
      "duration": 240,
      "cover": "https://placehold.co/512x512?text=Song+Title",
      "audio": "https://your-server.com/audio/sha1_hash.mp3"
    }
  ]
}
```

## Error Handling

The script includes comprehensive error handling:

- **Conversion Errors**: Logged when audio conversion fails
- **Fingerprint Errors**: Logged when fingerprint generation fails
- **Upload Errors**: Logged when SSH upload fails
- **Metadata Errors**: Logged when metadata extraction fails
- **File Access Errors**: Logged when file operations fail

## Summary Reports

After processing, the script generates:

1. **Console Output**: Real-time progress and summary
2. **Summary File**: Detailed report saved as `playlist_generation_summary_[timestamp].txt`

The summary includes:
- Number of files processed
- Number of files skipped
- List of errors
- Details for each processed file

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Install FFmpeg and ensure it's in your PATH
   - Test with: `ffmpeg -version`

2. **SSH connection failed**
   - Verify SSH key authentication works
   - Test manual connection: `ssh user@server`
   - Check file permissions on SSH key

3. **AcoustID API errors**
   - Verify API key is correct
   - Check internet connection
   - Ensure API key has sufficient quota

4. **Permission errors**
   - Ensure write permissions for output directories
   - Check temp directory permissions

5. **Import errors**
   - Install all required packages: `pip install -r requirements.txt`
   - Verify Python version compatibility

### Debug Mode

Enable verbose logging for detailed debugging:

```bash
python generate_playlist.py /path/to/music --verbose
```

## Security Considerations

- Store SSH keys securely with appropriate permissions (600)
- Use SSH key authentication instead of passwords
- Limit SSH user permissions on the server
- Keep AcoustID API key secure and don't commit to version control

## Contributing

When modifying the script:

1. Test with a small set of files first
2. Backup existing playlist/style files
3. Use verbose logging during development
4. Validate JSON output format
5. Test SSH connectivity and permissions

## License

This script is part of the Telegram Audio Player project.