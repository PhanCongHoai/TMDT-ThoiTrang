import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
# Fallback to backend/.env if ai-service/.env does not exist yet in local dev
if not os.getenv("DB_PASSWORD"):
    backend_env = BASE_DIR.parent / "backend" / ".env"
    if backend_env.exists():
        load_dotenv(backend_env)

AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))
AI_INTERNAL_API_KEY = os.getenv("AI_INTERNAL_API_KEY", "auralie_internal_ml_secret_2026")

DB_SERVER = os.getenv("DB_SERVER", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "1433")
DB_NAME = os.getenv("DB_NAME", "AURALIE_FashionDB")
DB_USER = os.getenv("DB_USER", "auralie_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "AuraliePassword2026@")
ODBC_DRIVER = os.getenv("ODBC_DRIVER", "ODBC Driver 17 for SQL Server")

ARTIFACTS_DIR = BASE_DIR / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

MIN_HISTORY_DAYS_FOR_ML = int(os.getenv("MIN_HISTORY_DAYS_FOR_ML", "30"))
MIN_SAMPLES_FOR_ML = int(os.getenv("MIN_SAMPLES_FOR_ML", "60"))
DRIFT_WAPE_THRESHOLD = float(os.getenv("DRIFT_WAPE_THRESHOLD", "0.35"))

