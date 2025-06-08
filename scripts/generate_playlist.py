#!/usr/bin/env python3
"""
Playlist Generator Script

This script processes music files, converts them to MP3, generates AcoustID fingerprints,
uploads them to a server via SSH, and creates/updates playlist files.

Requirements:
- pip install pydub mutagen pyacoustid paramiko requests pillow librosa
- ffmpeg must be installed on the system
- librosa is optional but recommended for automatic tempo measurement
"""

import os
import sys
import json
import hashlib
import logging
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple, cast
import time
import io

# External dependencies
try:
    from pydub import AudioSegment
    from pydub.utils import which
    import mutagen  # type: ignore
    from mutagen.mp4 import MP4Cover
    import acoustid
    import paramiko
    from paramiko import SSHClient, SFTPClient
    import requests
except ImportError as e:
    print(f"Missing required dependency: {e}")
    print("Please install required packages:")
    print("pip install pydub mutagen pyacoustid paramiko requests pillow")
    sys.exit(1)

# Import optional dependencies with graceful fallbacks
PIL_AVAILABLE = False
Image = None
try:
    from PIL import Image  # type: ignore
    PIL_AVAILABLE = True
except ImportError:
    print("Warning: PIL/Pillow not available. Cover art extraction will be disabled.")

LIBROSA_AVAILABLE = False
librosa = None
try:
    import librosa  # type: ignore
    LIBROSA_AVAILABLE = True
except ImportError:
    print("Warning: librosa not available. Tempo measurement will be disabled.")

# Import ID3 classes with error handling for different mutagen versions
ID3NoHeaderError = Exception
APIC = None
try:
    from mutagen.id3._util import ID3NoHeaderError
except ImportError:
    try:
        from mutagen.id3 import ID3NoHeaderError  # type: ignore
    except ImportError:
        pass

try:
    from mutagen.id3._frames import APIC
except ImportError:
    try:
        from mutagen.id3 import APIC  # type: ignore
    except ImportError:
        pass

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PlaylistGenerator:
    def __init__(self, config_path: Optional[str] = None, style: Optional[str] = None, playlist_name: Optional[str] = None, allow_dummy: bool = False, skip_no_tempo: bool = False, temp_dir: str = "./temp_audio"):
        """Initialize the playlist generator with configuration."""
        self.config = self._load_config(config_path)
        self.style = style
        self.playlist_name = playlist_name
        self.skip_no_tempo = skip_no_tempo
        self.temp_dir = temp_dir
        self.processed_files = []
        self.skipped_files = []
        self.errors = []
        self.metadata_errors = []
        self.tempo_measured_files = []
        self.ssh_client = None
        self.sftp_client = None
        self.remote_audio_files = None  # Cache for remote audio files list
        
        # Create and ensure temp directory exists
        Path(self.temp_dir).mkdir(exist_ok=True)
        
        # Verify ffmpeg is available (skip for dummy instances)
        if not allow_dummy and not which("ffmpeg"):
            raise RuntimeError("ffmpeg is required but not found in PATH")
        
        # Verify style and playlist_name are provided (skip for dummy instances)
        if not allow_dummy:
            if not self.style:
                raise ValueError("Style must be provided")
            if not self.playlist_name:
                raise ValueError("Playlist name must be provided")
    
    def _load_config(self, config_path: Optional[str]) -> Dict:
        """Load configuration from file or use defaults."""
        default_config = {
            "acoustid": {
                "api_key": "YOUR_ACOUSTID_API_KEY"  # Get from https://acoustid.org/
            },
            "ssh": {
                "hostname": "your-server.com",
                "username": "username",
                "key_filename": "~/.ssh/id_rsa",
                "port": 22,
                "remote_path": "/var/www/",
                "audio_path": "public/audio",
                "playlists_path": "public/playlists",
                "styles_path": "public/styles"
            },
            "urls": {
                "base_url": "https://your-server.com"
            },
            "output": {
                "playlists_dir": "public/playlists",
                "styles_dir": "public/styles"
            },
            "audio": {
                "bitrate": "128k",
                "sample_rate": 44100
            }
        }
        
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        
        return default_config
    
    def _get_ssh_connection(self) -> Tuple[SSHClient, object]:
        """Get or create SSH connection and SFTP client."""
        if self.ssh_client is None or self.sftp_client is None:
            ssh_config = self.config["ssh"]
            
            self.ssh_client = SSHClient()
            self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Connect using key file
            key_path = os.path.expanduser(ssh_config["key_filename"])
            self.ssh_client.connect(
                hostname=ssh_config["hostname"],
                username=ssh_config["username"],
                port=ssh_config["port"],
                key_filename=key_path,
            )
            
            self.sftp_client = self.ssh_client.open_sftp()
        
        return self.ssh_client, self.sftp_client
    
    def _close_ssh_connection(self) -> None:
        """Close SSH connection and SFTP client."""
        if self.sftp_client:
            self.sftp_client.close()
            self.sftp_client = None
        if self.ssh_client:
            self.ssh_client.close()
            self.ssh_client = None
    
    def sync_playlists_from_server(self) -> bool:
        """Sync playlists directory from server. Fail if this step fails."""
        try:
            logger.info("Syncing playlists from server...")
            ssh, sftp = self._get_ssh_connection()
            sftp = cast(SFTPClient, sftp)
            ssh_config = self.config["ssh"]
            
            # Create local playlists directory
            local_playlists_dir = self.config["output"]["playlists_dir"]
            os.makedirs(local_playlists_dir, exist_ok=True)
            
            # Remote playlists path
            remote_playlists_path = os.path.join(ssh_config["remote_path"], ssh_config.get("playlists_path", "public/playlists"))
            
            try:
                # List files in remote playlists directory
                remote_files = sftp.listdir(remote_playlists_path)
                
                for remote_file in remote_files:
                    if remote_file.endswith('.json'):
                        remote_file_path = os.path.join(remote_playlists_path, remote_file).replace("\\", "/")
                        local_file_path = os.path.join(local_playlists_dir, remote_file)
                        
                        logger.info(f"Downloading playlist: {remote_file}")
                        sftp.get(remote_file_path, local_file_path)
                
                logger.info(f"Successfully synced {len([f for f in remote_files if f.endswith('.json')])} playlists from server")
                return True
                
            except FileNotFoundError:
                logger.info("Remote playlists directory does not exist yet, starting fresh")
                return True
                
        except Exception as e:
            logger.error(f"Failed to sync playlists from server: {e}")
            return False
    
    def sync_styles_from_server(self) -> bool:
        """Sync styles directory from server. Fail if this step fails."""
        try:
            logger.info("Syncing styles from server...")
            ssh, sftp = self._get_ssh_connection()
            sftp = cast(SFTPClient, sftp)
            ssh_config = self.config["ssh"]
            
            # Create local styles directory
            local_styles_dir = self.config["output"]["styles_dir"]
            os.makedirs(local_styles_dir, exist_ok=True)
            
            # Remote styles path
            remote_styles_path = os.path.join(ssh_config["remote_path"], ssh_config.get("styles_path", "public/styles"))
            
            try:
                # List files in remote styles directory
                remote_files = sftp.listdir(remote_styles_path)
                
                for remote_file in remote_files:
                    if remote_file.endswith('.json'):
                        remote_file_path = os.path.join(remote_styles_path, remote_file).replace("\\", "/")
                        local_file_path = os.path.join(local_styles_dir, remote_file)
                        
                        logger.info(f"Downloading style: {remote_file}")
                        sftp.get(remote_file_path, local_file_path)
                
                logger.info(f"Successfully synced {len([f for f in remote_files if f.endswith('.json')])} styles from server")
                return True
                
            except FileNotFoundError:
                logger.info("Remote styles directory does not exist yet, starting fresh")
                return True
                
        except Exception as e:
            logger.error(f"Failed to sync styles from server: {e}")
            return False
    
    def fetch_remote_audio_files(self) -> List[str]:
        """Fetch list of all files in remote audio folder."""
        if self.remote_audio_files is not None:
            return self.remote_audio_files
        
        try:
            logger.info("Fetching list of remote audio files...")
            ssh, sftp = self._get_ssh_connection()
            sftp = cast(SFTPClient, sftp)
            ssh_config = self.config["ssh"]
            
            # Remote audio path
            remote_audio_path = os.path.join(ssh_config["remote_path"], ssh_config.get("audio_path", "public/audio"))
            
            try:
                # List files in remote audio directory
                remote_files = sftp.listdir(remote_audio_path)
                # Filter for MP3 files only
                self.remote_audio_files = [f for f in remote_files if f.endswith('.mp3')]
                logger.info(f"Found {len(self.remote_audio_files)} audio files on remote server")
                return self.remote_audio_files
                
            except FileNotFoundError:
                logger.info("Remote audio directory does not exist yet, starting fresh")
                self.remote_audio_files = []
                return self.remote_audio_files
                
        except Exception as e:
            logger.error(f"Failed to fetch remote audio files: {e}")
            self.remote_audio_files = []
            return self.remote_audio_files
    
    def convert_to_mp3(self, input_path: str, output_path: str) -> bool:
        """Convert audio file to MP3 format."""
        try:
            logger.info(f"Converting {input_path} to MP3...")
            audio = AudioSegment.from_file(input_path)
            audio.export(
                output_path,
                format="mp3",
                bitrate=self.config["audio"]["bitrate"],
                parameters=["-ar", str(self.config["audio"]["sample_rate"])]
            )
            return True
        except Exception as e:
            logger.error(f"Error converting {input_path}: {e}")
            self.errors.append(f"Conversion error for {input_path}: {e}")
            return False
    
    def get_acoustid_fingerprint(self, file_path: str, existing_fingerprint: Optional[str] = None, original_file_path: Optional[str] = None) -> Optional[str]:
        """Get AcoustID fingerprint for audio file - either from existing tag or calculate new one."""
        if existing_fingerprint:
            logger.info(f"Using existing AcoustID fingerprint for {file_path}")
            return existing_fingerprint
        
        try:
            logger.info(f"Generating new AcoustID fingerprint for {file_path}...")
            duration, fingerprint = acoustid.fingerprint_file(file_path)
            if fingerprint is not None:
                fingerprint_str = fingerprint.decode('utf-8')
                # Save the fingerprint to the original file (not the converted MP3)
                target_file = original_file_path if original_file_path else file_path
                self.save_acoustid_fingerprint_to_file(target_file, fingerprint_str)
                return fingerprint_str
        except Exception as e:
            logger.error(f"Error generating fingerprint for {file_path}: {e}")
            self.errors.append(f"Fingerprint error for {file_path}: {e}")
            return None
    
    def save_acoustid_fingerprint_to_file(self, file_path: str, fingerprint: str) -> bool:
        """Save AcoustID fingerprint to the original audio file's metadata."""
        try:
            logger.info(f"Saving AcoustID fingerprint to {file_path}...")
            
            # Load the audio file for tag editing
            audio_file = mutagen.File(file_path)  # type: ignore
            if audio_file is None:
                logger.warning(f"Could not open {file_path} for tag writing")
                return False
            
            # Ensure tags exist
            if not hasattr(audio_file, 'tags') or audio_file.tags is None:
                audio_file.add_tags()
            
            # Add the fingerprint based on file type
            if hasattr(audio_file.tags, 'add'):
                # For ID3 tags (MP3)
                from mutagen.id3._frames import TXXX
                audio_file.tags.add(TXXX(encoding=3, desc='ACOUSTID_FINGERPRINT', text=[fingerprint]))
            else:
                # For other formats, try to add directly
                audio_file.tags['ACOUSTID_FINGERPRINT'] = fingerprint
            
            # Save the changes
            audio_file.save()
            logger.info(f"Successfully saved AcoustID fingerprint to {file_path}")
            return True
            
        except Exception as e:
            logger.warning(f"Could not save AcoustID fingerprint to {file_path}: {e}")
            # Don't treat this as a fatal error, just log it
            return False
    
    def get_sha1_hash(self, data: str) -> str:
        """Generate SHA1 hash of the given data."""
        return hashlib.sha1(data.encode('utf-8')).hexdigest()
    
    def extract_metadata(self, file_path: str) -> Dict:
        """Extract metadata from audio file."""
        metadata: Dict = {
            "title": None,
            "artist": None,
            "album": None,
            "tempo": None,
            "duration": None,
            "genre": None,
            "cover_data": None,
            "acoustid_fingerprint": None
        }
        
        try:
            # Use mutagen.File - it should be available as a function
            audio_file = mutagen.File(file_path)  # type: ignore
            if audio_file is None:
                logger.warning(f"Could not read metadata from {file_path}")
                return metadata
            
            # Extract duration from audio info
            if hasattr(audio_file, 'info') and hasattr(audio_file.info, 'length'):
                metadata["duration"] = int(audio_file.info.length)
            
            # Handle different tag formats
            if hasattr(audio_file, 'tags') and audio_file.tags:
                tags = audio_file.tags
                
                # Title
                for key in ['TIT2', 'TITLE', '\xa9nam']:
                    if key in tags:
                        metadata["title"] = str(tags[key][0]) if isinstance(tags[key], list) else str(tags[key])
                        break
                
                # Artist
                for key in ['TPE1', 'ARTIST', '\xa9ART']:
                    if key in tags:
                        metadata["artist"] = str(tags[key][0]) if isinstance(tags[key], list) else str(tags[key])
                        break
                
                # Album
                for key in ['TALB', 'ALBUM', '\xa9alb']:
                    if key in tags:
                        metadata["album"] = str(tags[key][0]) if isinstance(tags[key], list) else str(tags[key])
                        break
                
                # BPM/Tempo
                for key in ['TBPM', 'BPM', 'tmpo']:
                    if key in tags:
                        try:
                            metadata["tempo"] = int(float(str(tags[key][0]) if isinstance(tags[key], list) else str(tags[key])))
                        except (ValueError, TypeError):
                            pass
                        break
                
                # Genre
                for key in ['TCON', 'GENRE', '\xa9gen']:
                    if key in tags:
                        metadata["genre"] = str(tags[key][0]) if isinstance(tags[key], list) else str(tags[key])
                        break
                
                # AcoustID fingerprint
                for key in ['TXXX:ACOUSTID_FINGERPRINT', 'ACOUSTID_FINGERPRINT', 'acoustid_fingerprint']:
                    if key in tags:
                        metadata["acoustid_fingerprint"] = str(tags[key][0]) if isinstance(tags[key], list) else str(tags[key])
                        break
                
                # Extract cover art
                metadata["cover_data"] = self.extract_cover_art(audio_file, tags)
                
        except Exception as e:
            logger.error(f"Error extracting metadata from {file_path}: {e}")
            self.errors.append(f"Metadata error for {file_path}: {e}")
        
        return metadata

    def extract_cover_art(self, audio_file, tags) -> Optional[bytes]:
        """Extract cover art from audio file metadata."""
        try:
            # For ID3 tags (MP3)
            if 'APIC:' in tags:
                return tags['APIC:'].data
            elif 'APIC' in tags:
                return tags['APIC'].data
            
            # For MP4/M4A files
            if 'covr' in tags:
                cover = tags['covr'][0]
                if isinstance(cover, MP4Cover):
                    return bytes(cover)
                return cover
            
            # For other formats, try common cover art keys
            for key in tags.keys():
                if 'APIC' in str(key):
                    cover_tag = tags[key]
                    if hasattr(cover_tag, 'data'):
                        return cover_tag.data
                    return cover_tag
            
            return None
        except Exception as e:
            logger.debug(f"Could not extract cover art: {e}")
            return None

    def measure_tempo(self, file_path: str) -> Optional[int]:
        """Measure tempo of audio file using librosa."""
        if not LIBROSA_AVAILABLE or librosa is None:
            logger.warning(f"librosa not available, cannot measure tempo for {file_path}")
            return None
        
        try:
            logger.info(f"Measuring tempo for {file_path}...")
            
            # Load audio file
            y, sr = librosa.load(file_path, sr=None)
            
            # Extract tempo using beat tracking
            tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
            
            # Add debug logging for tempo type and value
            logger.debug(f"Tempo type: {type(tempo)}, value: {tempo}")
            
            # Handle both scalar and array cases
            import numpy as np
            if isinstance(tempo, np.ndarray) and tempo.size > 0:
                tempo_value = float(tempo.item() if tempo.size == 1 else tempo[0])
            else:
                tempo_value = float(tempo)

            measured_tempo = int(round(tempo_value))
            
            logger.info(f"Measured tempo: {measured_tempo} BPM for {file_path}")
            return measured_tempo
            
        except Exception as e:
            logger.error(f"Error measuring tempo for {file_path}: {e}")
            return None
    
    def save_tempo_to_metadata(self, file_path: str, tempo: int) -> bool:
        """Save measured tempo to the audio file's metadata."""
        try:
            logger.info(f"Saving measured tempo ({tempo} BPM) to {file_path}...")
            
            # Load the audio file for tag editing
            audio_file = mutagen.File(file_path)  # type: ignore
            if audio_file is None:
                logger.warning(f"Could not open {file_path} for tempo tag writing")
                return False
            
            # Ensure tags exist
            if not hasattr(audio_file, 'tags') or audio_file.tags is None:
                audio_file.add_tags()
            
            # Add the tempo based on file type
            if hasattr(audio_file.tags, 'add'):
                # For ID3 tags (MP3)
                from mutagen.id3._frames import TBPM
                audio_file.tags.add(TBPM(encoding=3, text=[str(tempo)]))
            else:
                # For other formats, try to add directly
                audio_file.tags['BPM'] = str(tempo)
            
            # Save the changes
            audio_file.save()
            logger.info(f"Successfully saved tempo ({tempo} BPM) to {file_path}")
            return True
            
        except Exception as e:
            logger.warning(f"Could not save tempo to {file_path}: {e}")
            # Don't treat this as a fatal error, just log it
            return False

    def validate_metadata(self, metadata: Dict, file_path: str) -> bool:
        """Validate that all required metadata is present."""
        missing_fields = []
        
        if not metadata.get("title"):
            missing_fields.append("title")
        if not metadata.get("artist"):
            missing_fields.append("artist")
        if not metadata.get("album"):
            missing_fields.append("album")
        if not metadata.get("tempo"):
            # Only require tempo if we're not skipping files without tempo
            if self.skip_no_tempo:
                logger.warning(f"Missing tempo in {file_path}, skipping due to --skip-no-tempo flag")
                return False
            else:
                missing_fields.append("tempo")
        if metadata.get("duration") is None:
            missing_fields.append("duration")
        
        if missing_fields:
            error_msg = f"Missing required metadata fields in {file_path}: {', '.join(missing_fields)}"
            logger.error(error_msg)
            self.metadata_errors.append(error_msg)
            return False
        
        return True

    def save_cover_image(self, cover_data: bytes, cover_filename: str, temp_dir: str) -> Optional[str]:
        """Save cover image to temporary file."""
        if not PIL_AVAILABLE or Image is None:
            logger.warning("PIL/Pillow not available, skipping cover image processing")
            return None
            
        try:
            # Try to open and validate the image
            image = Image.open(io.BytesIO(cover_data))
            
            # Convert to RGB if necessary and resize to 512x512
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Use backward-compatible resampling method
            try:
                # Try newer PIL API first
                image = image.resize((512, 512), Image.Resampling.LANCZOS)
            except AttributeError:
                # Fallback to older API - check if LANCZOS constant exists
                if hasattr(Image, 'LANCZOS'):
                    image = image.resize((512, 512), Image.LANCZOS)  # type: ignore
                else:
                    # Final fallback - use basic resize without resampling
                    image = image.resize((512, 512))
            
            # Save as JPEG
            cover_path = os.path.join(temp_dir, cover_filename)
            image.save(cover_path, 'JPEG', quality=85, optimize=True)
            
            return cover_path
        except Exception as e:
            logger.error(f"Error saving cover image {cover_filename}: {e}")
            return None
    
    def calculate_tempo_range_from_songs(self, songs: List[Dict]) -> Tuple[int, int]:
        """Calculate tempo range from minimal to maximal tempo for all songs in playlist."""
        if not songs:
            raise ValueError("Cannot calculate tempo range from empty song list")
        
        # Extract valid tempo values, filtering out None/invalid values
        valid_tempos = []
        for song in songs:
            tempo = song.get("tempo")
            if tempo is not None and isinstance(tempo, (int, float)) and tempo > 0:
                valid_tempos.append(int(tempo))
            else:
                logger.warning(f"Song {song.get('id', 'unknown')} has invalid tempo: {tempo}")
        
        if not valid_tempos:
            raise ValueError("No valid tempo values found in songs")
        
        min_tempo = min(valid_tempos)
        max_tempo = max(valid_tempos)
        
        logger.debug(f"Calculated tempo range from {len(valid_tempos)} songs: {min_tempo}-{max_tempo} BPM")
        
        return min_tempo, max_tempo
    
    def create_remote_directory(self, sftp: SFTPClient, remote_dir_path: str) -> bool:
        """Create remote directory with proper permissions (755) if it doesn't exist."""
        try:
            # Try to stat the directory first
            try:
                sftp.stat(remote_dir_path)
                logger.debug(f"Directory {remote_dir_path} already exists")
                return True
            except FileNotFoundError:
                # Directory doesn't exist, create it
                pass
            
            # Create parent directories recursively
            parent_dir = os.path.dirname(remote_dir_path)
            if parent_dir and parent_dir != remote_dir_path:
                self.create_remote_directory(sftp, parent_dir)
            
            # Create the directory
            logger.info(f"Creating remote directory: {remote_dir_path}")
            sftp.mkdir(remote_dir_path)
            
            # Set permissions to 755
            sftp.chmod(remote_dir_path, 0o755)
            logger.debug(f"Set directory permissions to 755 for {remote_dir_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error creating remote directory {remote_dir_path}: {e}")
            return False
    
    def upload_public_directory(self) -> bool:
        """Upload entire public directory to the server preserving directory structure."""
        try:
            public_dir = "public"
            if not os.path.exists(public_dir):
                logger.warning(f"Public directory {public_dir} does not exist, skipping upload")
                return True
            
            logger.info("Uploading public directory to server...")
            
            ssh_config = self.config["ssh"]
            
            ssh = SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Connect using key file
            key_path = os.path.expanduser(ssh_config["key_filename"])
            ssh.connect(
                hostname=ssh_config["hostname"],
                username=ssh_config["username"],
                port=ssh_config["port"],
                key_filename=key_path,
            )
            
            sftp = ssh.open_sftp()
            
            # Get the base remote path
            remote_base_path = ssh_config["remote_path"]
            
            uploaded_count = 0
            skipped_count = 0
            error_count = 0
            
            # Walk through the public directory recursively
            for root, dirs, files in os.walk(public_dir):
                # Create the corresponding remote directory structure
                relative_path = os.path.relpath(root, ".")
                remote_dir_path = os.path.join(remote_base_path, relative_path).replace("\\", "/")
                
                # Ensure remote directory exists
                if not self.create_remote_directory(sftp, remote_dir_path):
                    logger.error(f"Failed to create remote directory: {remote_dir_path}")
                    error_count += 1
                    continue
                
                # Upload all files in this directory
                for file in files:
                    local_file_path = os.path.join(root, file)
                    remote_file_path = os.path.join(remote_dir_path, file).replace("\\", "/")
                    
                    try:
                        # Check if file already exists on remote server
                        try:
                            sftp.stat(remote_file_path)
                            logger.debug(f"File {remote_file_path} already exists, skipping")
                            skipped_count += 1
                            continue
                        except FileNotFoundError:
                            # File doesn't exist, proceed with upload
                            pass
                        
                        logger.info(f"Uploading {local_file_path} to {remote_file_path}")
                        sftp.put(local_file_path, remote_file_path)
                        
                        # Set file permissions to 644
                        sftp.chmod(remote_file_path, 0o644)
                        uploaded_count += 1
                        
                    except Exception as e:
                        logger.error(f"Error uploading {local_file_path}: {e}")
                        error_count += 1
            
            sftp.close()
            ssh.close()
            
            logger.info(f"Public directory upload complete: {uploaded_count} uploaded, {skipped_count} skipped, {error_count} errors")
            return error_count == 0
            
        except Exception as e:
            logger.error(f"Error uploading public directory: {e}")
            self.errors.append(f"Public directory upload error: {e}")
            return False
    
    def upload_file_ssh(self, local_path: str, remote_filename: str, subfolder: str = "audio") -> bool:
        """Upload file to server via SSH with automatic directory creation and proper permissions."""
        try:
            ssh, sftp = self._get_ssh_connection()
            sftp = cast(SFTPClient, sftp)
            ssh_config = self.config["ssh"]
            
            # Determine the target directory based on subfolder
            if subfolder == "audio":
                target_dir = os.path.join(ssh_config["remote_path"], ssh_config.get("audio_path", "public/audio"))
            elif subfolder == "playlists":
                target_dir = os.path.join(ssh_config["remote_path"], ssh_config.get("playlists_path", "public/playlists"))
            elif subfolder == "styles":
                target_dir = os.path.join(ssh_config["remote_path"], ssh_config.get("styles_path", "public/styles"))
            else:
                target_dir = os.path.join(ssh_config["remote_path"], subfolder)
            
            # Ensure target directory exists
            if not self.create_remote_directory(sftp, target_dir):
                return False
            
            remote_path = os.path.join(target_dir, remote_filename)
            
            # Check if file already exists - only skip for audio files
            if subfolder == "audio":
                try:
                    sftp.stat(remote_path)
                    logger.info(f"Audio file {remote_filename} already exists on server, skipping upload")
                    return True
                except FileNotFoundError:
                    # File doesn't exist, proceed with upload
                    pass
            else:
                # For non-audio files (playlists, styles), allow overwriting
                try:
                    sftp.stat(remote_path)
                    logger.info(f"File {remote_filename} exists in {subfolder}, will overwrite")
                except FileNotFoundError:
                    # File doesn't exist, proceed with upload
                    pass
            
            # Add diagnostic logging
            logger.info(f"Current working directory: {os.getcwd()}")
            logger.info(f"Attempting to upload from: {local_path}")
            logger.info(f"File exists check: {os.path.exists(local_path)}")
            if os.path.exists(local_path):
                logger.info(f"File size: {os.path.getsize(local_path)} bytes")
            else:
                # Try to find the file in different locations
                logger.info("File not found, checking alternative paths...")
                alt_paths = [
                    os.path.join("scripts", local_path),
                    os.path.join(os.getcwd(), "scripts", local_path),
                    os.path.abspath(local_path)
                ]
                for alt_path in alt_paths:
                    logger.info(f"Checking: {alt_path} -> exists: {os.path.exists(alt_path)}")
            
            logger.info(f"Uploading {local_path} to {remote_path}...")
            sftp.put(local_path, remote_path)
            
            # Set file permissions to 644
            sftp.chmod(remote_path, 0o644)
            logger.debug(f"Set file permissions to 644 for {remote_path}")
            
            logger.info(f"Successfully uploaded {remote_filename} to {subfolder} subfolder")
            return True
            
        except Exception as e:
            logger.error(f"Error uploading {local_path}: {e}")
            self.errors.append(f"Upload error for {local_path}: {e}")
            return False
    
    def create_playlist_entry(self, metadata: Dict, fingerprint_hash: str, audio_url: str, cover_url: Optional[str] = None) -> Dict:
        """Create a playlist entry from metadata."""
        entry = {
            "id": fingerprint_hash,
            "title": metadata["title"],
            "artist": metadata["artist"],
            "album": metadata["album"],
            "tempo": metadata["tempo"],
            "duration": metadata["duration"],
            "audio": audio_url
        }
        
        # Only include cover if it's available
        if cover_url:
            entry["cover"] = cover_url
            
        return entry
    
    def update_playlist_file(self, song_entry: Dict) -> bool:
        """Update or create playlist file."""
        try:
            playlist_file = os.path.join(self.config["output"]["playlists_dir"], f"{self.playlist_name}.json")
            
            # Load existing playlist or create new one
            if os.path.exists(playlist_file):
                with open(playlist_file, 'r') as f:
                    playlist = json.load(f)
            else:
                # Create new playlist without tempo defaults - will be set from first song
                assert self.style is not None and self.playlist_name is not None
                playlist = {
                    "id": self.playlist_name,
                    "name": self.playlist_name.replace("_", " ").title(),
                    "style": self.style.replace("_", " ").title(),
                    "songs": []
                }
            
            # Check if song already exists
            existing_ids = [song["id"] for song in playlist["songs"]]
            if song_entry["id"] not in existing_ids:
                playlist["songs"].append(song_entry)
                
                # Calculate tempo range based on all songs including the new one
                min_tempo, max_tempo = self.calculate_tempo_range_from_songs(playlist["songs"])
                playlist["minTempo"] = min_tempo
                playlist["maxTempo"] = max_tempo
                
                # Save playlist locally
                os.makedirs(os.path.dirname(playlist_file), exist_ok=True)
                with open(playlist_file, 'w') as f:
                    json.dump(playlist, f, indent=2)
                
                # Upload playlist to remote server
                playlist_filename = f"{self.playlist_name}.json"
                if self.upload_file_ssh(playlist_file, playlist_filename, "playlists"):
                    logger.info(f"Uploaded playlist {playlist_filename} to remote server")
                else:
                    logger.warning(f"Failed to upload playlist {playlist_filename} to remote server")
                
                logger.info(f"Added song to playlist {self.playlist_name} (tempo range: {min_tempo}-{max_tempo} BPM)")
                return True
            else:
                logger.info(f"Song {song_entry['id']} already exists in playlist {self.playlist_name}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating playlist {self.playlist_name}: {e}")
            self.errors.append(f"Playlist update error for {self.playlist_name}: {e}")
            return False
    
    def update_style_file(self) -> bool:
        """Update style file to include new playlist or update existing playlist."""
        try:
            style_file = os.path.join(self.config["output"]["styles_dir"], f"{self.style}.json")
            
            # Load existing style file or create new one
            if os.path.exists(style_file):
                with open(style_file, 'r') as f:
                    style_data = json.load(f)
            else:
                assert self.style is not None
                style_data = {
                    "style": self.style.replace("_", " ").title(),
                    "playlists": []
                }
            
            # Load playlist to get current metadata
            playlist_file = os.path.join(self.config["output"]["playlists_dir"], f"{self.playlist_name}.json")
            if not os.path.exists(playlist_file):
                logger.warning(f"Playlist file {playlist_file} does not exist, cannot update style")
                return False
            
            with open(playlist_file, 'r') as f:
                playlist = json.load(f)
            
            # Create or update playlist entry
            playlist_entry = {
                "id": self.playlist_name,
                "name": playlist["name"],
                "minTempo": playlist["minTempo"],
                "maxTempo": playlist["maxTempo"],
                "description": playlist.get("description", f"Auto-generated playlist for {playlist['name']}")
            }
            
            # Check if playlist already exists in style
            existing_playlist_index = None
            for i, p in enumerate(style_data["playlists"]):
                if p["id"] == self.playlist_name:
                    existing_playlist_index = i
                    break
            
            if existing_playlist_index is not None:
                # Update existing playlist entry
                old_entry = style_data["playlists"][existing_playlist_index]
                style_data["playlists"][existing_playlist_index] = playlist_entry
                logger.info(f"Updated existing playlist {self.playlist_name} in style {self.style} "
                           f"(tempo range: {old_entry.get('minTempo', 'unknown')}-{old_entry.get('maxTempo', 'unknown')} → "
                           f"{playlist_entry['minTempo']}-{playlist_entry['maxTempo']} BPM)")
            else:
                # Add new playlist entry
                style_data["playlists"].append(playlist_entry)
                logger.info(f"Added new playlist {self.playlist_name} to style {self.style} "
                           f"(tempo range: {playlist_entry['minTempo']}-{playlist_entry['maxTempo']} BPM)")
            
            # Save style file locally
            os.makedirs(os.path.dirname(style_file), exist_ok=True)
            with open(style_file, 'w') as f:
                json.dump(style_data, f, indent=2)
            
            # Upload style file to remote server
            style_filename = f"{self.style}.json"
            if self.upload_file_ssh(style_file, style_filename, "styles"):
                logger.info(f"Uploaded style file {style_filename} to remote server")
            else:
                logger.warning(f"Failed to upload style file {style_filename} to remote server")
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating style file {self.style}: {e}")
            self.errors.append(f"Style file update error for {self.style}: {e}")
            return False
    
    def recalculate_all_playlist_tempos(self) -> None:
        """Recalculate tempo ranges for all existing playlists."""
        playlists_dir = self.config["output"]["playlists_dir"]
        if not os.path.exists(playlists_dir):
            return
        
        logger.info("Recalculating tempo ranges for existing playlists...")
        
        for playlist_file in os.listdir(playlists_dir):
            if playlist_file.endswith('.json'):
                playlist_path = os.path.join(playlists_dir, playlist_file)
                try:
                    with open(playlist_path, 'r') as f:
                        playlist = json.load(f)
                    
                    if 'songs' in playlist and playlist['songs']:
                        # Recalculate tempo range
                        min_tempo, max_tempo = self.calculate_tempo_range_from_songs(playlist['songs'])
                        
                        # Update if changed
                        if playlist.get('minTempo') != min_tempo or playlist.get('maxTempo') != max_tempo:
                            playlist['minTempo'] = min_tempo
                            playlist['maxTempo'] = max_tempo
                            
                            with open(playlist_path, 'w') as f:
                                json.dump(playlist, f, indent=2)
                            
                            logger.info(f"Updated tempo range for {playlist['name']}: {min_tempo}-{max_tempo} BPM")
                
                except Exception as e:
                    logger.error(f"Error recalculating tempo for {playlist_file}: {e}")
    
    def process_directory(self, input_dir: str, temp_dir: str) -> None:
        """Process all audio files in the input directory recursively."""
        input_path = Path(input_dir)
        temp_path = Path(temp_dir)
        temp_path.mkdir(exist_ok=True)
        
        # Supported audio formats
        audio_extensions = {'.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.wma'}
        
        logger.info(f"Processing directory: {input_dir}")
        
        # Fetch list of remote audio files at the beginning to optimize processing
        logger.info("Fetching remote audio files list for duplicate checking...")
        self.fetch_remote_audio_files()
        
        for file_path in input_path.rglob('*'):
            if file_path.suffix.lower() in audio_extensions:
                self.process_audio_file(str(file_path), str(temp_path))
        
        # Recalculate tempo ranges for all playlists after processing
        logger.info("Recalculating tempo ranges for all playlists...")
        self.recalculate_all_playlist_tempos()

        logger.info("Updating styles...")
        self.update_style_file()
        
        logger.info("Processing complete!")
        
        # Close SSH connection when done
        self._close_ssh_connection()
    
    def process_audio_file(self, input_file: str, temp_dir: str) -> None:
        """Process a single audio file."""
        try:
            logger.info(f"Processing: {input_file}")
            
            # Extract metadata first
            metadata = self.extract_metadata(input_file)
            
            # Get or calculate AcoustID fingerprint early, before heavy processing
            existing_fingerprint = metadata.get("acoustid_fingerprint")
            fingerprint = None
            
            if existing_fingerprint:
                fingerprint = existing_fingerprint
                logger.info(f"Using existing AcoustID fingerprint for {input_file}")
            else:
                # Need to calculate fingerprint - do this early
                logger.info(f"No existing AcoustID fingerprint found for {input_file}, calculating...")
                fingerprint = self.get_acoustid_fingerprint(input_file, None, None)
                if not fingerprint:
                    logger.error(f"Failed to generate AcoustID fingerprint for {input_file}")
                    return
            
            # Generate SHA1 hash of fingerprint to check remote existence
            fingerprint_hash = self.get_sha1_hash(fingerprint)
            remote_filename = f"{fingerprint_hash}.mp3"
            
            # Check if file with this AcoustID already exists on remote server
            remote_audio_files = self.fetch_remote_audio_files()
            if remote_filename in remote_audio_files:
                logger.info(f"File with AcoustID {fingerprint_hash} already exists on server, skipping processing and upload")
                
                # Still add to playlist even if file exists on server
                # But first validate basic metadata requirements
                if not metadata.get("title") or not metadata.get("artist") or not metadata.get("album"):
                    logger.warning(f"Skipping {input_file} - missing basic metadata (title, artist, or album)")
                    self.skipped_files.append(input_file)
                    return
                
                # Use existing remote file for playlist entry
                base_url = self.config.get("urls", {}).get("base_url", f"https://{self.config['ssh']['hostname']}")
                audio_path = self.config["ssh"].get("audio_path", "public/audio")
                audio_url = f"{base_url.rstrip('/')}/{audio_path.strip('/')}/{remote_filename}"
                
                # Create playlist entry with minimal metadata
                song_entry = self.create_playlist_entry(metadata, fingerprint_hash, audio_url)
                
                # Update playlist file
                if self.update_playlist_file(song_entry):
                    logger.info(f"Added existing file {input_file} to playlist")
                
                self.skipped_files.append(input_file)
                return
            
            # File doesn't exist on server, proceed with full processing
            logger.info(f"File {remote_filename} not found on server, proceeding with processing...")
            
            # Handle missing tempo
            if not metadata.get("tempo"):
                if self.skip_no_tempo:
                    logger.warning(f"Skipping {input_file} due to missing tempo (--skip-no-tempo enabled)")
                    self.skipped_files.append(input_file)
                    return
                else:
                    # Try to measure tempo
                    logger.info(f"No tempo found in metadata for {input_file}, attempting to measure...")
                    measured_tempo = self.measure_tempo(input_file)
                    
                    if measured_tempo:
                        # Update metadata with measured tempo
                        metadata["tempo"] = measured_tempo
                        
                        # Save tempo back to the original file
                        if self.save_tempo_to_metadata(input_file, measured_tempo):
                            self.tempo_measured_files.append({
                                "file": input_file,
                                "measured_tempo": measured_tempo
                            })
                            logger.info(f"Successfully measured and saved tempo ({measured_tempo} BPM) for {input_file}")
                        else:
                            logger.warning(f"Measured tempo ({measured_tempo} BPM) but failed to save to {input_file}")
                    else:
                        logger.error(f"Failed to measure tempo for {input_file}")
                        self.metadata_errors.append(f"Could not measure tempo for {input_file}")
                        return
            
            # Validate required metadata (after potential tempo measurement)
            if not self.validate_metadata(metadata, input_file):
                return
            
            # Convert to MP3 if necessary
            file_path = Path(input_file)
            if file_path.suffix.lower() != '.mp3':
                temp_mp3_path = os.path.join(temp_dir, f"{file_path.stem}.mp3")
                if not self.convert_to_mp3(input_file, temp_mp3_path):
                    return
                working_file = temp_mp3_path
            else:
                working_file = input_file
            
            # Save fingerprint to original file if it was calculated
            if not existing_fingerprint:
                self.save_acoustid_fingerprint_to_file(input_file, fingerprint)
            
            # Upload audio file to server
            if not self.upload_file_ssh(working_file, remote_filename, "audio"):
                return
            
            # Handle cover image
            cover_url = None
            if metadata.get("cover_data"):
                cover_filename = f"{fingerprint_hash}.jpg"
                cover_path = self.save_cover_image(metadata["cover_data"], cover_filename, temp_dir)
                if cover_path:
                    # Upload cover image
                    if self.upload_file_ssh(cover_path, cover_filename, "audio"):
                        # Use base URL from config
                        base_url = self.config.get("urls", {}).get("base_url", f"https://{self.config['ssh']['hostname']}")
                        audio_path = self.config["ssh"].get("audio_path", "public/audio")
                        cover_url = f"{base_url.rstrip('/')}/{audio_path.strip('/')}/{cover_filename}"
                        os.remove(cover_path)  # Clean up temp cover file
            
            # Create audio URL using base URL from config
            base_url = self.config.get("urls", {}).get("base_url", f"https://{self.config['ssh']['hostname']}")
            audio_path = self.config["ssh"].get("audio_path", "public/audio")
            audio_url = f"{base_url.rstrip('/')}/{audio_path.strip('/')}/{remote_filename}"
            
            # Create playlist entry
            song_entry = self.create_playlist_entry(metadata, fingerprint_hash, audio_url, cover_url)
            
            # Update playlist file
            if self.update_playlist_file(song_entry):
                # Update style file
                self.processed_files.append({
                    "original_file": input_file,
                    "fingerprint_hash": fingerprint_hash,
                    "style": self.style,
                    "playlist": self.playlist_name,
                    "metadata": metadata
                })
            else:
                self.skipped_files.append(input_file)
            
            # Clean up temporary file
            if working_file != input_file and os.path.exists(working_file):
                os.remove(working_file)
                
        except Exception as e:
            logger.error(f"Error processing {input_file}: {e}")
            self.errors.append(f"Processing error for {input_file}: {e}")
    
    def generate_summary(self) -> str:
        """Generate a summary report of the processing."""
        summary = f"""
Playlist Generation Summary
===========================

Successfully added tracks: {len(self.processed_files)}
Files skipped (duplicates): {len(self.skipped_files)}
Tempo measurements performed: {len(self.tempo_measured_files)}
Metadata errors: {len(self.metadata_errors)}
Processing errors: {len(self.errors)}

Style: {self.style}
Playlist: {self.playlist_name}
"""
        
        if self.tempo_measured_files:
            summary += "\nTempo Measurements:\n"
            for entry in self.tempo_measured_files:
                summary += f"  ♪ {entry['file']}: {entry['measured_tempo']} BPM\n"
        
        if self.metadata_errors:
            summary += "\nMetadata Errors:\n"
            for error in self.metadata_errors:
                summary += f"  ✗ {error}\n"
        
        if self.errors:
            summary += "\nProcessing Errors:\n"
            for error in self.errors:
                summary += f"  ✗ {error}\n"
        
        return summary


def main():
    parser = argparse.ArgumentParser(description="Generate playlists from music files")
    parser.add_argument("input_dir", nargs='?', help="Directory containing music files")
    parser.add_argument("--config", help="Configuration file path", default="config.json")
    parser.add_argument("--temp-dir", help="Temporary directory for conversions", default="/tmp/playlist_gen")
    parser.add_argument("--style", help="Music style (e.g., bachata, salsa, west_coast_swing)")
    parser.add_argument("--playlist", help="Playlist name")
    parser.add_argument("--recalculate-tempos", action="store_true", help="Recalculate tempo ranges for all existing playlists without processing new files")
    parser.add_argument("--skip-no-tempo", action="store_true", help="Skip songs that don't have tempo in metadata instead of measuring tempo")
    parser.add_argument("--upload-public", action="store_true", help="Upload all files from public directory to server")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        if args.upload_public:
            # Only upload public directory without processing new files
            logger.info("Uploading public directory to server...")
            dummy_generator = PlaylistGenerator(args.config, "dummy", "dummy", allow_dummy=True)
            if dummy_generator.upload_public_directory():
                logger.info("Public directory upload complete!")
            else:
                logger.error("Public directory upload failed!")
                sys.exit(1)
            return
        
        if args.recalculate_tempos:
            # Only recalculate tempo ranges without processing new files
            logger.info("Recalculating tempo ranges for all existing playlists...")
            dummy_generator = PlaylistGenerator(args.config, "dummy", "dummy", allow_dummy=True, temp_dir=args.temp_dir)
            dummy_generator.recalculate_all_playlist_tempos()
            logger.info("Tempo recalculation complete!")
            return
        
        # Standard processing mode - require all arguments
        if not args.input_dir:
            logger.error("Input directory is required unless using --recalculate-tempos")
            sys.exit(1)
        if not args.style:
            logger.error("Style is required unless using --recalculate-tempos")
            sys.exit(1)
        if not args.playlist:
            logger.error("Playlist name is required unless using --recalculate-tempos")
            sys.exit(1)
        
        if not os.path.exists(args.input_dir):
            logger.error(f"Input directory does not exist: {args.input_dir}")
            sys.exit(1)
        
        generator = PlaylistGenerator(args.config, args.style, args.playlist, skip_no_tempo=args.skip_no_tempo)
        generator.process_directory(args.input_dir, args.temp_dir)
        
        # Generate and print summary
        summary = generator.generate_summary()
        print(summary)
        
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()