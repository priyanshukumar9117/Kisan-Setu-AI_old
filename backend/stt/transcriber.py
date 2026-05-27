import os
import whisper
import tempfile

try:
    import imageio_ffmpeg
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    
    # Create a temp directory for the symlink
    temp_bin = os.path.join(tempfile.gettempdir(), 'ffmpeg_bin')
    os.makedirs(temp_bin, exist_ok=True)
    symlink_path = os.path.join(temp_bin, 'ffmpeg')
    
    if not os.path.exists(symlink_path):
        os.symlink(ffmpeg_exe, symlink_path)
        
    os.environ["PATH"] = temp_bin + os.pathsep + os.environ.get("PATH", "")
except ImportError:
    pass

import ssl
ssl._create_default_https_context = ssl._create_unverified_context

_model = None

def get_model():
    global _model
    if _model is None:
        # Load the small/base model for local offline usage
        print("Loading Whisper model (this may take a moment on first run)...")
        _model = whisper.load_model("base")
    return _model

def transcribe_audio(file_path: str) -> str:
    """Transcribe audio file to text using OpenAI Whisper."""
    if not os.path.exists(file_path):
        print(f"Audio file not found: {file_path}")
        return ""
    
    try:
        model = get_model()
        result = model.transcribe(file_path, fp16=False)
        return result.get("text", "").strip()
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return ""
