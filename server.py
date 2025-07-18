#!/usr/bin/env python3
"""
Simple HTTP Server for NitroPlcViewer
Serves the HTML files locally to avoid CORS issues with ES6 modules
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

def main():
    # Get the directory of this script
    script_dir = Path(__file__).parent.absolute()
    
    # Change to the script directory
    os.chdir(script_dir)
    
    # Server configuration
    PORT = 8000
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"🚀 Server started at http://localhost:{PORT}")
            print(f"📁 Serving files from: {script_dir}")
            print(f"📄 Available files:")
            print(f"   - http://localhost:{PORT}/RockwellViewer_SingleFile.html (works directly)")
            print(f"   - http://localhost:{PORT}/RockwellViewer_Modular.html (requires server)")
            print(f"   - http://localhost:{PORT}/RockwellViewer.html")
            print(f"\n🛑 Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Please stop the existing server first.")
        else:
            print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 