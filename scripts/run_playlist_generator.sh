#!/bin/bash

# Playlist Generator Runner Script
# This script sets up the environment and runs the playlist generator

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Telegram Audio Player - Playlist Generator${NC}"
echo "=============================================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is required but not installed.${NC}"
    exit 1
fi

# Check if ffmpeg is available
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: FFmpeg is required but not installed.${NC}"
    echo "Please install FFmpeg:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu/Debian: sudo apt install ffmpeg"
    echo "  Windows: choco install ffmpeg"
    exit 1
fi

# Check if virtual environment exists
VENV_DIR="$PROJECT_ROOT/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv "$VENV_DIR"
    # Install/upgrade requirements
    echo -e "${YELLOW}Installing/updating dependencies...${NC}"
    pip install -q --upgrade pip
    pip install -q -r "$SCRIPT_DIR/requirements.txt"
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source "$VENV_DIR/bin/activate"

#
# Check if config file exists
CONFIG_FILE="$SCRIPT_DIR/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}Configuration file not found. Creating from template...${NC}"
    cp "$SCRIPT_DIR/config.json.template" "$CONFIG_FILE"
    echo -e "${RED}Please edit $CONFIG_FILE with your settings before running again.${NC}"
    echo "Required settings:"
    echo "  - AcoustID API key (get from https://acoustid.org/)"
    echo "  - SSH server details for file upload"
    exit 1
fi

# Change to project root directory
cd "$PROJECT_ROOT"

# Run the playlist generator
echo -e "${GREEN}Running playlist generator...${NC}"
python "$SCRIPT_DIR/generate_playlist.py" "$@"

echo -e "${GREEN}Playlist generation complete!${NC}"