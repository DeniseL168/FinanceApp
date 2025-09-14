import configparser
import os

from factory import create_app

if __name__ == "__main__":
    app = create_app()
    app.config['DEBUG'] = True
    app.run(host="0.0.0.0", port=5000)  # Listen on all interfaces for device access
