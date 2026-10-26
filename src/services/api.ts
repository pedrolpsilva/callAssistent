import { SystemStatus, StopResult, AppConfig } from '../types';

const API_BASE = 'http://127.0.0.1:8765/api';

export async function fetchStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Falha ao obter status');
  return res.json();
}

export async function fetchWindows(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/windows`);
  if (!res.ok) throw new Error('Falha ao listar janelas');
  const data = await res.json();
  return data.windows || [];
}

export async function startRecording(windowTitle?: string, knownSpeakers?: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/record/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      window_title: windowTitle || null,
      user_name: 'Pedro Luiz',
      known_speakers: knownSpeakers || [],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Falha ao iniciar gravação');
  }
}

export async function pauseRecording(): Promise<void> {
  const res = await fetch(`${API_BASE}/record/pause`, { method: 'POST' });
  if (!res.ok) throw new Error('Falha ao pausar gravação');
}

export async function resumeRecording(): Promise<void> {
  const res = await fetch(`${API_BASE}/record/resume`, { method: 'POST' });
  if (!res.ok) throw new Error('Falha ao retomar gravação');
}

export async function stopRecording(): Promise<StopResult> {
  const res = await fetch(`${API_BASE}/record/stop`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Falha ao processar e parar gravação');
  }
  return res.json();
}

export async function retryRecording(): Promise<StopResult> {
  const res = await fetch(`${API_BASE}/record/retry`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Falha ao reprocessar gravação');
  }
  return res.json();
}

export async function uploadAudioAndProcess(
  audioBlob: Blob,
  metadata: {
    userName?: string;
    knownSpeakers?: string[];
    meetingTitle?: string;
  }
): Promise<StopResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('user_name', metadata.userName || 'Pedro Luiz');
  formData.append('known_speakers', JSON.stringify(metadata.knownSpeakers || []));
  formData.append('meeting_title', metadata.meetingTitle || 'Reunião de Alinhamento');

  const res = await fetch(`${API_BASE}/record/upload-audio`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Falha ao processar áudio com Gemini');
  }

  return res.json();
}

export async function generateDocs(
  transcriptText: string,
  meetingTitle: string,
  participants: string[]
): Promise<{ success: boolean; document_markdown: string; file_path: string; file_name: string }> {
  const res = await fetch(`${API_BASE}/generate-docs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript_text: transcriptText,
      meeting_title: meetingTitle,
      participants,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Falha ao gerar documentação');
  }
  return res.json();
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error('Falha ao carregar configurações');
  return res.json();
}

export async function updateConfig(apiKey?: string, outputDir?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gemini_api_key: apiKey,
      output_dir: outputDir,
    }),
  });
  if (!res.ok) throw new Error('Falha ao atualizar configurações');
}

export async function openFolder(): Promise<void> {
  const res = await fetch(`${API_BASE}/open-folder`, { method: 'POST' });
  if (!res.ok) throw new Error('Falha ao abrir pasta no Windows Explorer');
}

export async function openFile(filePath: string): Promise<void> {
  const res = await fetch(`${API_BASE}/open-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_path: filePath }),
  });
  if (!res.ok) throw new Error('Falha ao abrir arquivo no Windows');
}
