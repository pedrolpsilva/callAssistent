import os
import sys
import json
import time
import subprocess
import tempfile
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import settings
from app.core.audio_recorder import recorder
from app.core.window_tracker import window_tracker
from app.services.gemini_transcribe import gemini_transcribe_service
from app.services.gemini_summarizer import gemini_summarizer_service

def open_path_native(path: str):
    try:
        if sys.platform == "win32":
            os.startfile(path)
        elif sys.platform == "darwin":
            subprocess.run(["open", path], check=False)
        else:
            subprocess.run(["xdg-open", path], check=False)
    except Exception as e:
        print(f"[OpenPath] Erro ao abrir caminho {path}: {e}")

app = FastAPI(title="CallAssistent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de requisição
class StartRecordRequest(BaseModel):
    window_title: str | None = None
    user_name: str | None = "Pedro Luiz"
    known_speakers: list[str] | None = None

class GenerateDocsRequest(BaseModel):
    transcript_text: str
    meeting_title: str | None = "Reunião de Alinhamento"
    participants: list[str] | None = None

class ConfigUpdateRequest(BaseModel):
    gemini_api_key: str | None = None
    output_dir: str | None = None
    gemini_model: str | None = None

class OpenFileRequest(BaseModel):
    file_path: str

# Estado da última sessão
last_session = {
    "user_name": "Pedro Luiz",
    "known_speakers": [],
    "temp_wav": None
}

@app.get("/api/status")
def get_status():
    return {
        "is_recording": recorder.is_recording,
        "is_paused": recorder.is_paused,
        "duration": round(recorder.duration_seconds, 1),
        "output_dir": settings.output_dir,
        "has_api_key": bool(settings.gemini_api_key),
        "model": settings.gemini_model,
        "default_user_name": settings.default_user_name,
        "platform": settings.platform
    }

@app.get("/api/windows")
def list_windows():
    return {"windows": window_tracker.get_meeting_windows()}

@app.post("/api/record/upload-audio")
async def upload_audio(
    audio: UploadFile = File(...),
    user_name: str = Form("Pedro Luiz"),
    known_speakers: str = Form("[]"),
    meeting_title: str = Form("Reunião de Alinhamento")
):
    try:
        parsed_speakers = json.loads(known_speakers) if known_speakers else []
    except Exception:
        parsed_speakers = [s.strip() for s in known_speakers.split(",") if s.strip()]

    last_session["user_name"] = user_name
    last_session["known_speakers"] = parsed_speakers

    ext = ".webm"
    if audio.filename:
        _, file_ext = os.path.splitext(audio.filename)
        if file_ext:
            ext = file_ext.lower()

    temp_audio = Path(tempfile.gettempdir()) / f"call_assist_web_{int(os.getpid())}_{int(time.time())}{ext}"
    content = await audio.read()
    with open(temp_audio, "wb") as f:
        f.write(content)

    last_session["temp_wav"] = str(temp_audio)

    # 1. Transcreve com Gemini (com retry automático e fallback)
    transcribe_result = gemini_transcribe_service.transcribe_audio(
        wav_path=str(temp_audio),
        user_name=user_name,
        known_speakers=parsed_speakers
    )

    if not transcribe_result.get("success"):
        raise HTTPException(
            status_code=503,
            detail=transcribe_result.get("error", "Erro ao transcrever com Gemini.")
        )

    raw_text = transcribe_result.get("raw_text", "")
    speakers = transcribe_result.get("speakers", [])

    # 2. Gera documentação técnica / produto em Markdown
    all_participants = list(set([user_name] + speakers))
    doc_result = gemini_summarizer_service.generate_documentation(
        transcript_text=raw_text,
        meeting_title=meeting_title,
        participants=all_participants
    )

    if not doc_result.get("success"):
        raise HTTPException(
            status_code=503,
            detail=doc_result.get("error", "Erro ao gerar documentação com o Gemini.")
        )

    return {
        "success": True,
        "transcript_raw": raw_text,
        "segments": transcribe_result.get("segments", []),
        "speakers": speakers,
        "document_markdown": doc_result.get("document_markdown", ""),
        "file_path": doc_result.get("file_path", ""),
        "file_name": doc_result.get("file_name", "")
    }

@app.post("/api/record/start")
def start_record(req: StartRecordRequest):
    last_session["user_name"] = req.user_name or settings.default_user_name
    last_session["known_speakers"] = req.known_speakers or []
    
    started = recorder.start()
    if not started:
        raise HTTPException(status_code=400, detail="Gravação já em andamento.")
    
    if req.window_title:
        window_tracker.start_tracking(req.window_title)
    
    return {"success": True, "message": "Gravação iniciada com sucesso."}

@app.post("/api/record/pause")
def pause_record():
    success = recorder.pause()
    return {"success": success}

@app.post("/api/record/resume")
def resume_record():
    success = recorder.resume()
    return {"success": success}

@app.post("/api/record/stop")
def stop_record():
    temp_wav = Path(tempfile.gettempdir()) / f"call_assist_{int(os.getpid())}.wav"
    rec_result = recorder.stop(str(temp_wav))
    window_events = window_tracker.stop_tracking()
    
    if not rec_result.get("success"):
        raise HTTPException(status_code=400, detail=rec_result.get("error", "Erro ao parar gravação."))

    last_session["temp_wav"] = str(temp_wav)
    last_session["user_timeline"] = rec_result.get("user_timeline")
    last_session["duration"] = rec_result.get("duration", 0)
    last_session["window_events"] = window_events
    
    # 1. Transcreve com Gemini (com retry automático e fallback de modelo)
    transcribe_result = gemini_transcribe_service.transcribe_audio(
        wav_path=str(temp_wav),
        user_name=last_session["user_name"],
        known_speakers=last_session["known_speakers"],
        user_timeline=rec_result.get("user_timeline")
    )

    if not transcribe_result.get("success"):
        raise HTTPException(
            status_code=503,
            detail=transcribe_result.get("error", "Servidor do Gemini em alta demanda. Você pode tentar novamente com o botão Retentar.")
        )

    raw_text = transcribe_result.get("raw_text", "")
    speakers = transcribe_result.get("speakers", [])

    # 2. Gera documentação técnica / produto em Markdown
    all_participants = list(set([last_session["user_name"]] + speakers))
    doc_result = gemini_summarizer_service.generate_documentation(
        transcript_text=raw_text,
        meeting_title="Reunião de Alinhamento e Produto",
        participants=all_participants
    )

    if not doc_result.get("success"):
        raise HTTPException(
            status_code=503,
            detail=doc_result.get("error", "Erro ao gerar documentação com o Gemini.")
        )

    return {
        "success": True,
        "duration": rec_result.get("duration", 0),
        "transcript_raw": raw_text,
        "segments": transcribe_result.get("segments", []),
        "speakers": speakers,
        "document_markdown": doc_result.get("document_markdown", ""),
        "file_path": doc_result.get("file_path", ""),
        "file_name": doc_result.get("file_name", ""),
        "window_events": window_events
    }

@app.post("/api/record/retry")
def retry_last_recording():
    temp_wav = last_session.get("temp_wav")
    if not temp_wav or not Path(temp_wav).exists():
        raise HTTPException(status_code=400, detail="Nenhum áudio gravado recentemente encontrado para reprocessar.")

    transcribe_result = gemini_transcribe_service.transcribe_audio(
        wav_path=temp_wav,
        user_name=last_session.get("user_name", "Pedro Luiz"),
        known_speakers=last_session.get("known_speakers", []),
        user_timeline=last_session.get("user_timeline")
    )

    if not transcribe_result.get("success"):
        raise HTTPException(
            status_code=503,
            detail=transcribe_result.get("error", "Servidores do Gemini ainda estão sobrecarregados. Aguarde alguns segundos.")
        )

    raw_text = transcribe_result.get("raw_text", "")
    speakers = transcribe_result.get("speakers", [])
    all_participants = list(set([last_session.get("user_name", "Pedro Luiz")] + speakers))

    doc_result = gemini_summarizer_service.generate_documentation(
        transcript_text=raw_text,
        meeting_title="Reunião de Alinhamento e Produto",
        participants=all_participants
    )

    return {
        "success": True,
        "duration": last_session.get("duration", 0),
        "transcript_raw": raw_text,
        "segments": transcribe_result.get("segments", []),
        "speakers": speakers,
        "document_markdown": doc_result.get("document_markdown", ""),
        "file_path": doc_result.get("file_path", ""),
        "file_name": doc_result.get("file_name", ""),
        "window_events": last_session.get("window_events", [])
    }

@app.post("/api/generate-docs")
def generate_docs(req: GenerateDocsRequest):
    result = gemini_summarizer_service.generate_documentation(
        transcript_text=req.transcript_text,
        meeting_title=req.meeting_title or "Reunião de Produto",
        participants=req.participants or ["Pedro Luiz"]
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result

@app.get("/api/config")
def get_config():
    return {
        "gemini_api_key": settings.gemini_api_key,
        "gemini_model": settings.gemini_model,
        "output_dir": settings.output_dir,
        "port": settings.port,
        "default_user_name": settings.default_user_name
    }

@app.post("/api/config")
def update_config(req: ConfigUpdateRequest):
    settings.update_config(api_key=req.gemini_api_key, output_dir=req.output_dir)
    return {"success": True, "message": "Configurações atualizadas."}

@app.post("/api/open-folder")
def open_folder():
    try:
        open_path_native(settings.output_dir)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/open-file")
def open_file(req: OpenFileRequest):
    try:
        open_path_native(req.file_path)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
