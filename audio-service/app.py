"""
YouTube Audio Transcription Service
Downloads YouTube audio, transcribes with Groq Whisper, and translates to Chinese.
Deploy this to Railway.app or similar platform.
"""

import os
import tempfile
import base64
import logging
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from your Vercel app

# API Keys (set in Railway environment variables)
API_KEY = os.environ.get("API_KEY", "your-secret-api-key")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")

GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"


def verify_api_key():
    """Verify the API key from request headers."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return False
    token = auth_header.split(" ")[1]
    return token == API_KEY


def download_audio(video_id):
    """Download audio from YouTube and return file path."""
    if len(video_id) == 11 and "/" not in video_id:
        video_url = f"https://www.youtube.com/watch?v={video_id}"
    else:
        video_url = video_id
    
    logger.info(f"Downloading audio for: {video_url}")
    
    temp_dir = tempfile.mkdtemp()
    
    # Use very low quality to keep file size under Groq's 25MB limit
    # 24kbps * 60min = ~11MB, 24kbps * 120min = ~22MB
    ydl_opts = {
        "format": "worstaudio/worst",  # Get smallest audio format
        "outtmpl": os.path.join(temp_dir, "audio.%(ext)s"),
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "24",  # Very low quality for speech (still clear enough)
        }],
        "quiet": True,
        "no_warnings": True,
    }
    
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
        raise Exception("Failed to download audio")
    
    file_size = os.path.getsize(audio_file)
    file_size_mb = file_size / (1024 * 1024)
    logger.info(f"Downloaded: {title} ({duration}s, {file_size_mb:.1f}MB)")
    
    # Check if file is still too large for Groq (25MB limit)
    if file_size > 24 * 1024 * 1024:
        logger.warning(f"Audio file still too large ({file_size_mb:.1f}MB > 24MB)")
        raise Exception(f"Video too long ({duration}s). Maximum supported duration is about 120 minutes.")
    
    return audio_file, temp_dir, duration, title


def transcribe_with_groq(audio_file_path):
    """Transcribe audio using Groq Whisper API."""
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY not configured")
    
    logger.info("Transcribing audio with Groq Whisper...")
    
    with open(audio_file_path, "rb") as audio_file:
        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
            },
            files={
                "file": ("audio.mp3", audio_file, "audio/mpeg"),
            },
            data={
                "model": "whisper-large-v3",
                "response_format": "verbose_json",
                "language": "en",
            },
            timeout=300,  # 5 minutes timeout
        )
    
    if response.status_code != 200:
        logger.error(f"Groq API error: {response.status_code} - {response.text}")
        raise Exception(f"Groq API error: {response.status_code}")
    
    result = response.json()
    
    # Parse segments
    segments = []
    if "segments" in result:
        for seg in result["segments"]:
            segments.append({
                "start": seg.get("start", 0),
                "end": seg.get("end", 0),
                "text": seg.get("text", "").strip(),
            })
    elif "text" in result:
        # Fallback: single segment
        segments.append({
            "start": 0,
            "end": 0,
            "text": result["text"].strip(),
        })
    
    logger.info(f"Transcription complete: {len(segments)} segments")
    return segments


def translate_to_chinese(english_segments):
    """Translate English segments to Traditional Chinese using DeepSeek."""
    if not DEEPSEEK_API_KEY:
        logger.warning("DEEPSEEK_API_KEY not configured, skipping translation")
        return []
    
    logger.info(f"Translating {len(english_segments)} segments to Chinese...")
    
    chinese_segments = []
    batch_size = 20
    
    for i in range(0, len(english_segments), batch_size):
        batch = english_segments[i:i + batch_size]
        texts_to_translate = "\n".join([f"[{idx}] {seg['text']}" for idx, seg in enumerate(batch)])
        
        try:
            response = requests.post(
                DEEPSEEK_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a professional translator. Translate the following English subtitles to Traditional Chinese (繁體中文). Keep the [number] prefix for each line. Only output the translations, no explanations.",
                        },
                        {
                            "role": "user",
                            "content": texts_to_translate,
                        },
                    ],
                    "temperature": 0.3,
                },
                timeout=60,
            )
            
            if response.status_code != 200:
                logger.error(f"DeepSeek API error: {response.status_code}")
                # Use original text as fallback
                for seg in batch:
                    chinese_segments.append(seg.copy())
                continue
            
            result = response.json()
            translated_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            translated_lines = [line.strip() for line in translated_text.split("\n") if line.strip()]
            
            for j, seg in enumerate(batch):
                # Try to find matching translation
                translated_line = None
                for line in translated_lines:
                    if line.startswith(f"[{j}]"):
                        translated_line = line
                        break
                
                chinese_segments.append({
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": translated_line.replace(f"[{j}]", "").strip() if translated_line else seg["text"],
                })
        
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            for seg in batch:
                chinese_segments.append(seg.copy())
    
    logger.info("Translation complete")
    return chinese_segments


@app.route("/", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "YouTube Audio Transcription Service",
        "version": "2.0.0",
        "groq_configured": bool(GROQ_API_KEY),
        "deepseek_configured": bool(DEEPSEEK_API_KEY),
    })


@app.route("/transcribe", methods=["POST"])
def transcribe_video():
    """
    Full pipeline: Download audio, transcribe, and translate.
    
    Request body:
    {
        "videoId": "YouTube video ID",
        "translateToChinese": true
    }
    
    Response:
    {
        "success": true,
        "englishSubtitles": [...],
        "chineseSubtitles": [...],
        "duration": 123,
        "title": "Video Title"
    }
    """
    if not verify_api_key():
        return jsonify({"error": "Unauthorized"}), 401
    
    temp_dir = None
    
    try:
        data = request.get_json()
        video_id = data.get("videoId")
        translate_to_chinese_flag = data.get("translateToChinese", True)
        
        if not video_id:
            return jsonify({"error": "videoId is required"}), 400
        
        logger.info(f"Starting full transcription pipeline for: {video_id}")
        
        # Step 1: Download audio
        audio_file, temp_dir, duration, title = download_audio(video_id)
        
        # Step 2: Transcribe with Groq
        english_subtitles = transcribe_with_groq(audio_file)
        
        if not english_subtitles:
            return jsonify({
                "success": False,
                "error": "Transcription produced no results",
            }), 500
        
        # Step 3: Translate to Chinese (optional)
        chinese_subtitles = []
        if translate_to_chinese_flag:
            chinese_subtitles = translate_to_chinese(english_subtitles)
        
        logger.info(f"Pipeline complete: {len(english_subtitles)} segments")
        
        return jsonify({
            "success": True,
            "englishSubtitles": english_subtitles,
            "chineseSubtitles": chinese_subtitles,
            "duration": duration,
            "title": title,
        })
    
    except yt_dlp.utils.DownloadError as e:
        logger.error(f"Download error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to download video",
            "details": str(e),
        }), 400
    
    except Exception as e:
        logger.error(f"Pipeline error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500
    
    finally:
        # Cleanup temp directory
        if temp_dir and os.path.exists(temp_dir):
            import shutil
            try:
                shutil.rmtree(temp_dir)
            except:
                pass


@app.route("/download", methods=["POST"])
def download_audio_endpoint():
    """
    Download audio from YouTube video (kept for backward compatibility).
    """
    if not verify_api_key():
        return jsonify({"error": "Unauthorized"}), 401
    
    temp_dir = None
    
    try:
        data = request.get_json()
        video_id = data.get("videoId")
        
        if not video_id:
            return jsonify({"error": "videoId is required"}), 400
        
        audio_file, temp_dir, duration, title = download_audio(video_id)
        
        with open(audio_file, "rb") as f:
            audio_data = base64.b64encode(f.read()).decode("utf-8")
        
        file_size = os.path.getsize(audio_file)
        
        return jsonify({
            "success": True,
            "audio": audio_data,
            "format": "mp3",
            "duration": duration,
            "title": title,
            "size": file_size,
        })
    
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500
    
    finally:
        if temp_dir and os.path.exists(temp_dir):
            import shutil
            try:
                shutil.rmtree(temp_dir)
            except:
                pass


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
