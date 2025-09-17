# Simple Flask echo server, all-in-one Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

RUN pip install --no-cache-dir flask

# Write the app in-place
RUN set -eux; cat > /app.py <<'PY'
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route("/", methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"])
def echo():
    return jsonify({
        "path": request.path,
        "method": request.method,
        "args": request.args.to_dict(flat=False),
        "form": request.form.to_dict(flat=False),
        "json": request.get_json(silent=True),
        "headers": dict(request.headers),
        "data": request.get_data(as_text=True),
        "remote_addr": request.remote_addr,
    })

@app.route("/healthz", methods=["GET"])
def healthz():
    return "ok", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
PY

EXPOSE 8000
CMD ["python", "/app.py"]
