import sys
from pathlib import Path

# Adiciona o diretório backend ao sys.path
BASE_BACKEND = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_BACKEND))

import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print(f"[CallAssistent] Iniciando backend na porta {settings.port}...")
    uvicorn.run("app.api.server:app", host="127.0.0.1", port=settings.port, reload=False)
