import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { SpeakerManager } from './components/SpeakerManager';
import { TranscriptBox } from './components/TranscriptBox';
import { DocPreview } from './components/DocPreview';
import { SettingsModal } from './components/SettingsModal';
import { SystemStatus, TranscriptSegment, StopResult } from './types';
import {
  fetchStatus,
  uploadAudioAndProcess,
  retryRecording,
  generateDocs,
  openFolder,
} from './services/api';
import { webAudioRecorder } from './services/webAudioRecorder';
import { MessageSquare, FileText, CheckCircle2, RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasTabAudio, setHasTabAudio] = useState(false);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);

  const [knownSpeakers, setKnownSpeakers] = useState<string[]>([]);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [rawText, setRawText] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [filePath, setFilePath] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'docs'>('transcript');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  const loadStatus = async () => {
    try {
      const data = await fetchStatus();
      setStatus(data);
    } catch (e) {
      // Backend pode estar iniciando
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // Cronômetro local da gravação web
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, isPaused]);

  const handleStart = async () => {
    try {
      const result = await webAudioRecorder.start(() => {
        showNotification('Compartilhamento da guia/tela encerrado no Chrome.');
      });
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setHasTabAudio(result.hasTabAudio);

      if (!result.hasTabAudio) {
        showNotification('Atenção: A opção "Compartilhar áudio" não foi marcada no Chrome. Apenas seu microfone será gravado.');
      } else {
        showNotification('Gravação iniciada: Microfone + Áudio da Guia conectados!');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar gravação.');
    }
  };

  const handlePause = () => {
    webAudioRecorder.pause();
    setIsPaused(true);
  };

  const handleResume = () => {
    webAudioRecorder.resume();
    setIsPaused(false);
  };

  const handleStop = async () => {
    setIsProcessing(true);
    setCanRetry(false);
    try {
      const blob = await webAudioRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      setLastBlob(blob);

      showNotification('Enviando áudio para processamento com Gemini...');

      const result: StopResult = await uploadAudioAndProcess(blob, {
        userName: 'Pedro Luiz',
        knownSpeakers,
        meetingTitle: 'Reunião de Produto e Desenvolvimento',
      });

      setRawText(result.transcript_raw);
      setSegments(result.segments);
      setSpeakers(result.speakers);
      setMarkdown(result.document_markdown);
      setFilePath(result.file_path);
      setFileName(result.file_name);
      await loadStatus();
      setActiveTab('docs');
      showNotification(`Ata processada e salva com sucesso: ${result.file_name}`);
    } catch (err: any) {
      setCanRetry(true);
      alert(err.message || 'Erro ao processar gravação');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    setIsProcessing(true);
    try {
      let result: StopResult;
      if (lastBlob) {
        result = await uploadAudioAndProcess(lastBlob, {
          userName: 'Pedro Luiz',
          knownSpeakers,
          meetingTitle: 'Reunião de Produto e Desenvolvimento',
        });
      } else {
        result = await retryRecording();
      }

      setRawText(result.transcript_raw);
      setSegments(result.segments);
      setSpeakers(result.speakers);
      setMarkdown(result.document_markdown);
      setFilePath(result.file_path);
      setFileName(result.file_name);
      setCanRetry(false);
      await loadStatus();
      setActiveTab('docs');
      showNotification(`Ata reprocessada com sucesso: ${result.file_name}`);
    } catch (err: any) {
      alert(err.message || 'Erro ao retentar processamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddKnownSpeaker = (name: string) => {
    if (!knownSpeakers.includes(name)) {
      setKnownSpeakers([...knownSpeakers, name]);
    }
  };

  const handleRenameSpeaker = (oldName: string, newName: string) => {
    setSpeakers(speakers.map((s) => (s === oldName ? newName : s)));
    setKnownSpeakers(knownSpeakers.map((s) => (s === oldName ? newName : s)));

    const updatedSegments = segments.map((seg) =>
      seg.speaker === oldName ? { ...seg, speaker: newName } : seg
    );
    setSegments(updatedSegments);

    const updatedRaw = updatedSegments.map((s) => `${s.speaker}: ${s.text}`).join('\n');
    setRawText(updatedRaw);

    showNotification(`Falante alterado: "${oldName}" ➔ "${newName}"`);
  };

  const handleRegenerateDocs = async () => {
    if (!rawText) return;
    setIsProcessing(true);
    try {
      const allParticipants = Array.from(new Set(['Pedro Luiz', ...speakers, ...knownSpeakers]));
      const res = await generateDocs(rawText, 'Reunião de Produto e Desenvolvimento', allParticipants);
      setMarkdown(res.document_markdown);
      setFilePath(res.file_path);
      setFileName(res.file_name);
      setActiveTab('docs');
      showNotification('Ata de reunião atualizada com sucesso!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Cabeçalho */}
      <Header
        status={status}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFolder={openFolder}
      />

      {/* Barra de Controles Web */}
      <ControlBar
        isRecording={isRecording}
        isPaused={isPaused}
        duration={duration}
        hasTabAudio={hasTabAudio}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        isProcessing={isProcessing}
      />

      {/* Banner de Retentativa quando houver instabilidade no Gemini */}
      {canRetry && !isProcessing && (
        <div className="bg-amber-950/80 border-b border-amber-500/40 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200">
          <span>O áudio da reunião está seguro no navegador. O Gemini passou por instabilidade temporária. Clique para processar agora:</span>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-md shadow-amber-900/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tentar Novamente</span>
          </button>
        </div>
      )}

      {/* Notificação Flutuante Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl shadow-emerald-950 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        
        {/* Painel Lateral: Participantes e Falantes */}
        <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4">
          <SpeakerManager
            speakers={speakers}
            knownSpeakers={knownSpeakers}
            onAddKnownSpeaker={handleAddKnownSpeaker}
            onRenameSpeaker={handleRenameSpeaker}
            onRegenerateDocs={handleRegenerateDocs}
            hasTranscript={segments.length > 0}
            isProcessing={isProcessing}
          />

          {/* Card com Metadados da Pasta de Gravação */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <span className="font-semibold text-slate-300">Destino dos Arquivos no Disco:</span>
            <p className="font-mono text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800 break-all select-all text-slate-300">
              {status?.output_dir || 'Carregando...'}
            </p>
            <p className="text-[11px] text-slate-500">
              Salvo automaticamente em formato Markdown com data e título.
            </p>
          </div>
        </div>

        {/* Painel Central com Abas: Transcrição e Ata Markdown */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          
          {/* Navegador de Abas */}
          <div className="flex items-center px-4 pt-3 border-b border-slate-800 gap-2 bg-slate-950/40">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors border-t border-x cursor-pointer ${
                activeTab === 'transcript'
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Transcrição das Vozes</span>
              {segments.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-400">
                  {segments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors border-t border-x cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ata de Reunião & Produto (.md)</span>
              {markdown && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Área de Visualização da Aba Ativa */}
          <div className="flex-1 p-3 overflow-hidden">
            {activeTab === 'transcript' ? (
              <TranscriptBox segments={segments} rawText={rawText} />
            ) : (
              <DocPreview
                markdown={markdown}
                filePath={filePath}
                fileName={fileName}
              />
            )}
          </div>

        </div>

      </div>

      {/* Modal de Configurações */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={() => {
          loadStatus();
          showNotification('Configurações salvas!');
        }}
      />
    </div>
  );
};
