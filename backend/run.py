import os
from app import create_app
from config import Config

app = create_app(Config)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "1").lower() in ("1", "true", "yes")
    print(f">> SpendWise Backend running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)

