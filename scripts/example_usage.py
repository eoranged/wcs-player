#!/usr/bin/env python3
"""
Example usage of the Playlist Generator

This script demonstrates how to use the PlaylistGenerator class programmatically.
"""

import os
import sys
from generate_playlist import PlaylistGenerator

def example_usage():
    """Example of how to use the PlaylistGenerator programmatically."""
    
    # Define style and playlist name - these are now required
    style = "bachata"  # e.g., bachata, salsa, west_coast_swing
    playlist_name = "my_bachata_collection"
    
    try:
        # Create generator instance with required style and playlist name
        # The config file path is optional (defaults to "config.json")
        generator = PlaylistGenerator(
            config_path="config.json",
            style=style,
            playlist_name=playlist_name
        )
        
        # Process a single file
        input_file = "/path/to/your/music/file.mp3"
        if os.path.exists(input_file):
            print(f"Processing single file: {input_file}")
            generator.process_audio_file(input_file, "./temp_audio")
        
        # Or process an entire directory
        input_directory = "/path/to/your/music/directory"
        if os.path.exists(input_directory):
            print(f"Processing directory: {input_directory}")
            generator.process_directory(input_directory)
        
        # Generate summary
        summary = generator.generate_summary()
        print("\n" + summary)
        
    except Exception as e:
        print(f"Error: {e}")
        return False
    
    return True

def test_metadata_extraction():
    """Test metadata extraction functionality."""
    from generate_playlist import PlaylistGenerator
    
    # You must specify style and playlist name even for testing
    style = "bachata"
    playlist_name = "test_playlist"
    
    try:
        generator = PlaylistGenerator(
            config_path="config.json",
            style=style,
            playlist_name=playlist_name
        )
        
        # Test with a sample file (replace with actual file path)
        test_file = "/path/to/test/audio/file.mp3"
        
        if os.path.exists(test_file):
            print(f"Testing metadata extraction for: {test_file}")
            metadata = generator.extract_metadata(test_file)
            
            print("Extracted metadata:")
            for key, value in metadata.items():
                if key == "cover_data" and value:
                    print(f"  {key}: <binary data, {len(value)} bytes>")
                else:
                    print(f"  {key}: {value}")
            
            # Test metadata validation
            is_valid = generator.validate_metadata(metadata, test_file)
            print(f"Metadata is valid: {is_valid}")
            
            print(f"Using style: {style}")
            print(f"Using playlist: {playlist_name}")
        else:
            print(f"Test file not found: {test_file}")
    except Exception as e:
        print(f"Error during testing: {e}")

if __name__ == "__main__":
    print("Playlist Generator Example Usage")
    print("================================")
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "test":
            test_metadata_extraction()
        else:
            print("Usage: python example_usage.py [test]")
    else:
        example_usage()