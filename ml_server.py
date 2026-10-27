#!/usr/bin/env python3
"""
AgriSense AI - Standalone Python Computer Vision & Deep Learning Microservice
Compatible with TensorFlow / PyTorch / OpenCV produce grading pipelines.
Provides HTTP API endpoints on port 8000 (or invocable directly from Express backend).
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import sys
from ml_engine import parse_image_data, run_grading_pipeline

PORT = int(os.environ.get("PY_PORT", 8000))

class AgriSenseHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        if self.path == "/health":
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "healthy",
                "framework": "PyTorch / TensorFlow Transfer Learning Model",
                "produce_supported": ["Apple", "Tomato"],
                "version": "2.4.0"
            }).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_POST(self):
        if self.path == "/api/grade" or self.path == "/grade":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(body)
                raw_image = data.get("image", "")
                commodity = data.get("commodity", "auto")
                district = data.get("district", "Kolhapur")
                
                image_bytes, _ = parse_image_data(raw_image)
                analysis = run_grading_pipeline(image_bytes, commodity, district)
                self._set_headers(200)
                self.wfile.write(json.dumps(analysis).encode())
            except Exception as e:
                self._set_headers(400)
                self.wfile.write(json.dumps({"status": "error", "error": str(e)}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode())

def run():
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, AgriSenseHandler)
    print(f"AgriSense AI Python ML Engine listening on port {PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
