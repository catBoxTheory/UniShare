"""
YouTube Audio Download Service
A simple Flask API that uses yt-dlp to download YouTube audio.
Deploy this to Railway.app or similar platform.
"""

import os
import tempfile
import base64
import logging
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from your Vercel app

# API Key for authentication (set in Railway environment variables)
API_KEY = os.environ.get("API_KEY", "your-secret-api-key")

def verify_api_key():
    """Verify the API key from request headers."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return False
    token = auth_header.split(" ")[1]
    return token == API_KEY


@app.route("/", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "YouTube Audio Download Service",
        "version": "1.0.0"
    })


@app.route("/download", methods=["POST"])
def download_audio():
    """
    Download audio from YouTube video.
    
    Request body:
    {
        "videoId": "YouTube video ID or URL",
        "format": "base64" or "url" (default: "base64")
    }
    
    Response:
    {
        "success": true,
        "audio": "base64 encoded audio data" or "temporary URL",
        "format": "mp3",
        "duration": 123.45
    }
    """
    # Verify API key
    if not verify_api_key():
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        data = request.get_json()
        video_id = data.get("videoId")
        output_format = data.get("format", "base64")
        
        if not video_id:
            return jsonify({"error": "videoId is required"}), 400
        
        # Build YouTube URL if only ID provided
        if len(video_id) == 11 and "/" not in video_id:
            video_url = f"https://www.youtube.com/watch?v={video_id}"
        else:
            video_url = video_id
        
        logger.info(f"Downloading audio for: {video_url}")
        
        # Create temp directory for download
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "audio.mp3")
            
            # yt-dlp options
            ydl_opts = {
                "format": "bestaudio/best",
                "outtmpl": os.path.join(temp_dir, "audio.%(ext)s"),
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "128",
                }],
                "quiet": True,
                "no_warnings": True,
                "extract_flat": False,
            }
            
            # Download audio
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=True)
                duration = info.get("duration", 0)
                title = info.get("title", "Unknown")
            
            # Find the downloaded file
            audio_file = None
            for f in os.listdir(temp_dir):
                if f.endswith(".mp3"):
                    audio_file = os.path.join(temp_dir, f)
                    break
            
            if not audio_file or not os.path.exists(audio_file):
                return jsonify({"error": "Failed to download audio"}), 500
            
            file_size = os.path.getsize(audio_file)
            logger.info(f"Downloaded: {title} ({duration}s, {file_size} bytes)")
            
            # Return based on format
            if output_format == "base64":
                with open(audio_file, "rb") as f:
                    audio_data = base64.b64encode(f.read()).decode("utf-8")
                
                return jsonify({
                    "success": True,
                    "audio": audio_data,
                    "format": "mp3",
                    "duration": duration,
                    "title": title,
                    "size": file_size
                })
            else:
                # For URL format, we'd need to upload to cloud storage
                # For now, return base64
                with open(audio_file, "rb") as f:
                    audio_data = base64.b64encode(f.read()).decode("utf-8")
                
                return jsonify({
                    "success": True,
                    "audio": audio_data,
                    "format": "mp3",
                    "duration": duration,
                    "title": title,
                    "size": file_size
                })
    
    except yt_dlp.utils.DownloadError as e:
        logger.error(f"Download error: {str(e)}")
        return jsonify({
            "error": "Failed to download video",
            "details": str(e)
        }), 400
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


@app.route("/info", methods=["POST"])
def get_video_info():
    """
    Get video information without downloading.
    
    Request body:
    {
        "videoId": "YouTube video ID or URL"
    }
    """
    # Verify API key
    if not verify_api_key():
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        data = request.get_json()
        video_id = data.get("videoId")
        
        if not video_id:
            return jsonify({"error": "videoId is required"}), 400
        
        # Build YouTube URL if only ID provided
        if len(video_id) == 11 and "/" not in video_id:
            video_url = f"https://www.youtube.com/watch?v={video_id}"
        else:
            video_url = video_id
        
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
        
        return jsonify({
            "success": True,
            "title": info.get("title"),
            "duration": info.get("duration"),
            "channel": info.get("channel"),
            "view_count": info.get("view_count"),
            "has_subtitles": bool(info.get("subtitles") or info.get("automatic_captions")),
        })
    
    except Exception as e:
        logger.error(f"Info error: {str(e)}")
        return jsonify({
            "error": "Failed to get video info",
            "details": str(e)
        }), 400


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

