import os
import sys

# Tambahkan path aplikasi ke sys.path agar Passenger mengenali folder backend
sys.path.insert(0, os.path.dirname(__file__))

# Import aplikasi FastAPI Anda
from main import app as fastapi_app

# Gunakan a2wsgi untuk menghubungkan ASGI (FastAPI) dengan WSGI (Passenger cPanel)
from a2wsgi import ASGIMiddleware

application = ASGIMiddleware(fastapi_app)
