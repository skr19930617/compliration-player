from flask import Flask, Response, request, abort, send_file
import os
import mimetypes
from pathlib import Path
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
VIDEO_DIR = PROJECT_ROOT / "sample_videos"

print("Base Directory:", BASE_DIR)
print("Project Root:", PROJECT_ROOT)
print("Video Directory:", VIDEO_DIR)


@app.route('/')
def home():
    return "Welcome to the Flask server!"


@app.route('/api/videos')
def list_videos():
    print("Listing videos in directory:", VIDEO_DIR)
    try:
        video_files = [f.name for f in Path(
            VIDEO_DIR).iterdir() if f.suffix in ['.mp4', '.webm', '.avi']]
        print(video_files)
        return {"videos": video_files}
    except FileNotFoundError:
        abort(404, description="Video directory not found.")


@app.route("/api/video/<path:filename>")
def video_stream(filename):
    path = os.path.join(VIDEO_DIR, filename)
    if not os.path.exists(path):
        abort(404)

    file_size = os.path.getsize(path)
    range_header = request.headers.get("Range", None)

    if range_header:
        byte1, byte2 = range_header.replace("bytes=", "").split("-")
        byte1 = int(byte1)
        byte2 = int(byte2) if byte2 else file_size - 1
        length = byte2 - byte1 + 1

        with open(path, "rb") as f:
            f.seek(byte1)
            data = f.read(length)

        resp = Response(data,
                        status=206,
                        mimetype=mimetypes.guess_type(path)[0])
        resp.headers.add("Content-Range",
                         f"bytes {byte1}-{byte2}/{file_size}")
    else:
        resp = send_file(path, mimetype=mimetypes.guess_type(path)[0])
        resp.headers.add("Content-Length", str(file_size))

    resp.headers.add("Accept-Ranges", "bytes")
    return resp


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050)
