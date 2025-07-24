from pathlib import Path
import random
import json
import mimetypes
from flask import Flask, Response, request, abort, send_file, jsonify, render_template
from flask_cors import CORS


app = Flask(__name__, static_folder=str(Path(__file__).resolve().parent.parent / "dist" / "assets"),
            template_folder=str(Path(__file__).resolve().parent.parent / "dist"))
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
# Change this to your video directory
VIDEO_DIR = PROJECT_ROOT / "sample_videos"


METADATA_DIR = PROJECT_ROOT / "metadata"
METADATA_DIR.mkdir(parents=True, exist_ok=True)


def _build_tree(dir_path: Path):
    """dir_path 以下を {id,name,type,children[]} 形式で返す"""
    node = {
        "id": str(dir_path.relative_to(VIDEO_DIR)),
        "label": dir_path.name,
        "itemType": "directory" if dir_path.is_dir() else "file",
    }
    if dir_path.is_dir():
        node["children"] = [
            _build_tree(p) for p in sorted(dir_path.iterdir(), key=lambda x: x.name)
            if not p.name.startswith(".")          # 隠しファイル除外など
        ]
    return node


@app.route('/')
def home():
    return render_template('index.html')


@app.get("/api/build-tree")
def build_tree():
    tree = [_build_tree(VIDEO_DIR)]
    with open((METADATA_DIR / "tree.json"), 'w', encoding="UTF-8") as f:
        json.dump(tree, f, indent=2)
    return jsonify(tree)


@app.get("/api/tree")
def get_tree():
    if not (METADATA_DIR / "tree.json").exists():
        build_tree()
    try:
        with open((METADATA_DIR / "tree.json"), 'r', encoding="UTF-8") as f:
            tree = json.load(f)
        return jsonify(tree)
    except FileNotFoundError:
        abort(404, description="Tree metadata not found.")


@app.route('/api/videos')
def list_videos():
    print("Listing videos in directory:", request.args.get("directory"))
    directory = request.args.get("directory")
    try:
        video_files = [str(f.relative_to(VIDEO_DIR)) for f in Path(
            (VIDEO_DIR / directory)).iterdir() if f.suffix in ['.mp4', '.webm', '.avi']]
        random.shuffle(video_files)
        return video_files
    except FileNotFoundError:
        abort(404, description="Video directory not found.")


@app.route('/api/favorites')
def list_favorites():
    favorites_file = METADATA_DIR / "favorites.json"
    if not favorites_file.exists():
        with open(favorites_file, 'w', encoding="UTF-8") as f:
            json.dump([], f, indent=2)
        return jsonify([])
    try:
        with open(favorites_file, 'r', encoding="UTF-8") as f:
            favorites = json.load(f)
        return jsonify(sorted(favorites))
    except json.JSONDecodeError:
        abort(500, description="Error decoding favorites JSON.")


@app.route('/api/favorites/<path:filename>')
def toggle_favorites(filename):
    favorites_file = METADATA_DIR / "favorites.json"
    if not favorites_file.exists():
        with open(favorites_file, 'w', encoding="UTF-8") as f:
            json.dump([], f, indent=2)
    try:
        with open(favorites_file, 'r', encoding="UTF-8") as f:
            favorites = json.load(f)
        if filename not in favorites:
            favorites.append(filename)
        else:
            favorites.remove(filename)
        with open(favorites_file, 'w', encoding="UTF-8") as f:
            json.dump(favorites, f, indent=2)
        return jsonify(favorites)
    except json.JSONDecodeError:
        abort(500, description="Error decoding favorites JSON.")


@app.route("/api/video/metadata/<path:filename>")
def get_video_metadata(filename):
    metadata_file = METADATA_DIR / f"{filename}.json"
    if not metadata_file.exists():
        abort(404, description="Metadata file not found.")
    try:
        with open(metadata_file, 'r', encoding="UTF-8") as f:
            metadata = json.load(f)
        return jsonify(metadata)
    except json.JSONDecodeError:
        abort(500, description="Error decoding metadata JSON.")


@app.route("/api/video/metadata/<path:filename>", methods=["POST"])
def create_video_metadata(filename):
    metadata = request.json
    metadata_file = METADATA_DIR / f"{filename}.json"

    metadata_file.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(metadata_file, 'w', encoding="UTF-8") as f:
            json.dump(metadata, f, indent=2)
        return jsonify({"status": "success", "message": "Metadata created"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/video/<path:filename>")
def video_stream(filename):
    path = VIDEO_DIR / filename
    if not path.exists():
        abort(404)

    file_size = path.stat().st_size
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
