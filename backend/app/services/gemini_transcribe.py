import os
import re
import time
from pathlib import Path
from google import genai
from google.genai import types
from google.genai.errors import ServerError, APIError
from app.core.config import settings

class GeminiTranscribeService:
    def transcribe_audio(
        self,
        wav_path: str,
        user_name: str = "Pedro Luiz",
        known_speakers: list[str] | None = None,
        user_timeline: list[dict] | None = None
    ) -> dict:
        if not settings.gemini_api_key:
            return {
                "success": False,
                "error": "Chave da API do Google Gemini (GEMINI_API_KEY) não configurada."
            }

        client = genai.Client(api_key=settings.gemini_api_key)
        
        # Faz upload do arquivo WAV para a API do Gemini
        audio_file = client.files.upload(file=wav_path)

        speakers_hint = ""
        if known_speakers:
            speakers_hint = f"Participantes conhecidos nesta reunião: {', '.join(known_speakers)}.\n"

        prompt = f"""Você é um especialista em transcrição e diarização de reuniões em Português do Brasil.
Transcreva o áudio completo em anexo, identificando e separando cada falante.

Contexto da gravação:
- O dono desta máquina chama-se "{user_name}". Ele gravou diretamente pelo microfone.
{speakers_hint}
Formato de saída obrigatório (sem introduções, sem preâmbulos, apenas as falas linha por linha):
Nome: Frase dita pela pessoa
Outro Nome: Resposta da pessoa

Exemplo:
{user_name}: Eu estou tentando dizer que precisamos fechar o escopo.
Lucas: Concordo, vamos definir os prazos.
Roberto: Perfeito, vou assumir a parte de backend.

Se não souber o nome exato de um participante externo, use 'Participante 1', 'Participante 2', etc.
Transcreva fielmente todas as palavras ditas no áudio."""

        raw_text = ""
        fallback_models = [settings.gemini_model, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash"]
        models_to_try = []
        for m in fallback_models:
            if m and m not in models_to_try:
                models_to_try.append(m)

        try:
            success = False
            last_err_msg = ""
            for model_name in models_to_try:
                for attempt in range(2):
                    try:
                        print(f"[Gemini Transcribe] Tentando modelo {model_name} (tentativa {attempt + 1}/2)...")
                        response = client.models.generate_content(
                            model=model_name,
                            contents=[audio_file, prompt],
                        )
                        raw_text = response.text or ""
                        success = True
                        break
                    except Exception as e:
                        last_err_msg = str(e)
                        is_503 = "503" in last_err_msg or "UNAVAILABLE" in last_err_msg
                        print(f"[Gemini Transcribe] Erro com {model_name}: {last_err_msg[:100]}")
                        if is_503 and attempt == 0:
                            time.sleep(2.0)
                            continue
                        break
                if success:
                    break

            if not success:
                return {
                    "success": False,
                    "error": f"Servidores do Google temporariamente ocupados (503). Tente novamente em instantes. Detalhes: {last_err_msg[:120]}"
                }
        finally:
            # Limpa o arquivo da nuvem após o processamento
            try:
                client.files.delete(name=audio_file.name)
            except Exception:
                pass

        # Faz o parse das falas
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        segments = []
        speakers_set = set()

        for line in lines:
            match = re.match(r"^([^:]+):\s*(.+)$", line)
            if match:
                speaker = match.group(1).strip()
                text = match.group(2).strip()
                segments.append({"speaker": speaker, "text": text})
                speakers_set.add(speaker)
            else:
                # Caso venha linha contínua
                if segments:
                    segments[-1]["text"] += " " + line
                else:
                    segments.append({"speaker": "Participante", "text": line})

        return {
            "success": True,
            "raw_text": raw_text,
            "segments": segments,
            "speakers": list(speakers_set)
        }

gemini_transcribe_service = GeminiTranscribeService()
