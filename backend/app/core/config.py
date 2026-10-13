import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega .env do projeto
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH)

DEFAULT_OUTPUT_DIR = r"C:\Users\pedri\OneDrive\Documentos\transcriptions"

class Settings:
    def __init__(self):
        self.gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
        self.gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
        self.output_dir: str = os.getenv("OUTPUT_DIR", DEFAULT_OUTPUT_DIR)
        self.port: int = int(os.getenv("PORT", "8765"))
        self.default_user_name: str = "Pedro Luiz"
        self._ensure_output_dir()

    def _ensure_output_dir(self):
        try:
            Path(self.output_dir).mkdir(parents=True, exist_ok=True)
        except Exception as e:
            print(f"[Config] Aviso ao criar pasta de destino: {e}")

    def update_config(self, api_key: str | None = None, output_dir: str | None = None):
        if api_key is not None:
            self.gemini_api_key = api_key
            os.environ["GEMINI_API_KEY"] = api_key
        if output_dir is not None:
            self.output_dir = output_dir
            os.environ["OUTPUT_DIR"] = output_dir
            self._ensure_output_dir()
        
        # Persiste no arquivo .env
        env_content = f"GEMINI_API_KEY={self.gemini_api_key}\nGEMINI_MODEL={self.gemini_model}\nOUTPUT_DIR={self.output_dir}\nPORT={self.port}\n"
        with open(ENV_PATH, "w", encoding="utf-8") as f:
            f.write(env_content)

settings = Settings()
