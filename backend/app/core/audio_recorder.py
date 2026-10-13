import os
import time
import threading
from pathlib import Path
import numpy as np
import soundcard as sc
import soundfile as sf
import warnings

# Suprime aviso inofensivo de descontinuidade de dados/silêncio do Windows
warnings.filterwarnings("ignore", category=sc.SoundcardRuntimeWarning)

class AudioRecorder:
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self.is_recording = False
        self.is_paused = False
        self._thread: threading.Thread | None = None
        
        self.mic_chunks: list[np.ndarray] = []
        self.loopback_chunks: list[np.ndarray] = []
        
        self.start_time: float = 0.0
        self.duration_seconds: float = 0.0
        self.lock = threading.Lock()

    def start(self):
        with self.lock:
            if self.is_recording:
                return False
            
            self.is_recording = True
            self.is_paused = False
            self.mic_chunks = []
            self.loopback_chunks = []
            self.start_time = time.time()
            self.duration_seconds = 0.0
            
            self._thread = threading.Thread(target=self._record_loop, daemon=True)
            self._thread.start()
            return True

    def pause(self):
        with self.lock:
            if self.is_recording and not self.is_paused:
                self.is_paused = True
                return True
            return False

    def resume(self):
        with self.lock:
            if self.is_recording and self.is_paused:
                self.is_paused = False
                return True
            return False

    def stop(self, output_wav_path: str) -> dict:
        with self.lock:
            if not self.is_recording:
                return {"success": False, "error": "Gravação não iniciada."}
            
            self.is_recording = False
            self.is_paused = False

        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3.0)

        # Processa e salva o áudio
        if not self.mic_chunks and not self.loopback_chunks:
            return {"success": False, "error": "Nenhum áudio capturado."}

        # Concatena os chunks
        mic_audio = np.concatenate(self.mic_chunks, axis=0) if self.mic_chunks else np.zeros((1, 1), dtype=np.float32)
        loop_audio = np.concatenate(self.loopback_chunks, axis=0) if self.loopback_chunks else np.zeros((1, 1), dtype=np.float32)

        # Garante o mesmo comprimento
        min_len = min(len(mic_audio), len(loop_audio))
        if min_len > 0:
            mic_audio = mic_audio[:min_len]
            loop_audio = loop_audio[:min_len]
        else:
            # Caso um dos dois esteja vazio
            max_len = max(len(mic_audio), len(loop_audio))
            if len(mic_audio) < max_len:
                mic_audio = np.pad(mic_audio, ((0, max_len - len(mic_audio)), (0, 0)))
            if len(loop_audio) < max_len:
                loop_audio = np.pad(loop_audio, ((0, max_len - len(loop_audio)), (0, 0)))

        # Mixagem estéreo: Canal 0 = Microfone (Você), Canal 1 = Loopback (Outros)
        # E uma versão mono mista balanceada para envio à IA
        mixed_mono = 0.5 * mic_audio[:, 0] + 0.5 * loop_audio[:, 0]
        
        # Cria diretório do arquivo se não existir
        Path(output_wav_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Salva o arquivo de áudio WAV mixado (16kHz, mono, float32 ou pcm16)
        sf.write(output_wav_path, mixed_mono, self.sample_rate, subtype="PCM_16")

        # Salva também um mapa de atividade do microfone local (quem falou quando)
        # Calcula energia RMS por janela de 0.5s para identificar fala do usuário
        window_size = int(self.sample_rate * 0.5)
        user_speech_timeline = []
        for i in range(0, len(mic_audio), window_size):
            window_mic = mic_audio[i : i + window_size]
            window_loop = loop_audio[i : i + window_size]
            rms_mic = np.sqrt(np.mean(window_mic**2))
            rms_loop = np.sqrt(np.mean(window_loop**2))
            sec = round(i / self.sample_rate, 2)
            # Se microfone tiver sinal relevante e maior que ruído de fundo
            is_user = rms_mic > 0.015 and rms_mic > rms_loop * 0.8
            user_speech_timeline.append({"time": sec, "is_local_user": bool(is_user)})

        actual_duration = len(mixed_mono) / self.sample_rate
        return {
            "success": True,
            "wav_path": output_wav_path,
            "duration": actual_duration,
            "user_timeline": user_speech_timeline
        }

    def _record_loop(self):
        try:
            default_speaker = sc.default_speaker()
            default_mic = sc.default_microphone()
            loopback = sc.get_microphone(id=str(default_speaker.name), include_loopback=True)
        except Exception as e:
            print(f"[AudioRecorder] Erro ao obter dispositivos de áudio: {e}")
            return

        chunk_size = int(self.sample_rate * 0.25)  # 250ms por bloco
        
        try:
            with default_mic.recorder(samplerate=self.sample_rate, channels=1) as mic_rec, \
                 loopback.recorder(samplerate=self.sample_rate, channels=1) as loop_rec:
                
                while self.is_recording:
                    if self.is_paused:
                        time.sleep(0.1)
                        continue
                    
                    data_mic = mic_rec.record(numframes=chunk_size)
                    data_loop = loop_rec.record(numframes=chunk_size)
                    
                    self.mic_chunks.append(data_mic)
                    self.loopback_chunks.append(data_loop)
                    self.duration_seconds = (len(self.mic_chunks) * chunk_size) / self.sample_rate
        except Exception as e:
            print(f"[AudioRecorder] Erro durante gravação: {e}")

recorder = AudioRecorder()
