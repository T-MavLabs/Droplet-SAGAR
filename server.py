#!/usr/bin/env python3
"""
Minimal HTTP server for Raspberry Pi / Alpine Linux
Serves the React production build
"""
import http.server
import socketserver
import os
import sys
from pathlib import Path

PORT = int(os.environ.get('PORT', 3000))
BUILD_DIR = Path(__file__).parent / 'build'

class DropletHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BUILD_DIR), **kwargs)
    
    def end_headers(self):
        # Add CORS headers if needed
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()
    
    def do_GET(self):
        # Handle React Router - serve index.html for all routes
        if self.path != '/' and not '.' in self.path.split('/')[-1]:
            self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    if not BUILD_DIR.exists():
        print(f"Error: Build directory not found: {BUILD_DIR}")
        print("Please run 'npm run build' first")
        sys.exit(1)
    
    os.chdir(BUILD_DIR)
    
    with socketserver.TCPServer(("", PORT), DropletHTTPRequestHandler) as httpd:
        print(f"Droplet server running on port {PORT}")
        print(f"Open http://localhost:{PORT} in your browser")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()

