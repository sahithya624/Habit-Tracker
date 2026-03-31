"""
Render compatibility entrypoint.

Allows `uvicorn backend.main:app` to work when the service Root Directory is `backend`.
"""

from main import app

