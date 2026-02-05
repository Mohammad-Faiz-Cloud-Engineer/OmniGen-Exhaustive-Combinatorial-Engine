# OmniGen - Exhaustive Combinatorial Engine

OmniGen is a high-performance, full-stack application designed to generate exhaustive string combinations (`itertools.product`). It streams results in real-time to text, markdown, and PDF formats while providing a live dashboard for monitoring.

## Features

- **Mathematical Engine**: Built with Python (`itertools`), ensuring mathematically complete generation of $C^L$ combinations.
- **Real-Time Dashbard**: Node.js & Socket.io frontend displaying live CPS (Combinations Per Second), total count, and file sizes.
- **Multi-Format Streaming**: Writes to `.txt`, `.md`, and `.pdf` simultaneously.
- **Safe Stopping**: Handles SIGTERM gracefully to finalize PDF structures properly using ReportLab's `canvas.save()`.
- **Disk Safety**: Monitors disk usage and auto-stops if space falls below safe limits.

## Installation

### Prerequisites
- Node.js & npm
- Python 3.x

### Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *Note: If you are on a managed system (like Debian 12+ or Ubuntu 24.04+), you may need `pip install --user --break-system-packages -r requirements.txt` or set up a venv.*

## Usage

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open the interface:**
   Go to [http://localhost:3000](http://localhost:3000).

3. **Generate:**
   - Configure character sets (A-Z, 0-9, Symbols).
   - Set length range (e.g., 1-4).
   - Click "Start Generation".

4. **Stop & Download:**
   - Click "Stop" to safely halt the process.
   - Download the generated `.txt`, `.md`, or `.pdf` files.

## Project Structure

- `generator.py`: Core logic for combinatorial generation and file streaming.
- `server.js`: Express server dealing with IPC (Child Process) and Websockets.
- `public/`: Frontend assets (Tailwind CSS, Socket.io client).

## License

MIT
