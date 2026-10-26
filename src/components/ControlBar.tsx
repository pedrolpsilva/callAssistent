import React from 'react';
import { Play, Pause, Square, Loader2, Mic, Volume2, Globe } from 'lucide-react';

interface ControlBarProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  hasTabAudio: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isProcessing: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isRecording,
  isPaused,
  duration,
  hasTabAudio,
  onStart,
  onPause,
  onResume,
  onStop,
  isProcessing,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 p-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Lado Esquerdo: Orientações de Captura no Chrome (macOS & Windows) */}
        <div className="flex items-center gap-3 flex-1">
          {isRecording ? (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Microfone (Pedro Luiz) Ativo</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-300">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {hasTabAudio ? 'Áudio da Reunião (Guia/Tela) Ativo' : 'Áudio da Guia Conectado'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
              <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                <strong className="text-white">Google Chrome Web:</strong> Ao iniciar, selecione a guia da reunião (Meet, Teams, YouTube) e marque <strong className="text-cyan-300">"Compartilhar áudio"</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Lado Direito: Controles de Gravação */}
        <div className="flex items-center justify-between lg:justify-end gap-3">
          
          {/* Cronômetro */}
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse'}`} />
              <span className="font-mono text-sm font-bold text-white tracking-wider">
                {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Botões de Ação */}
          {isProcessing ? (
            <button
              disabled
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold cursor-not-allowed"
            >
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>Processando com Gemini...</span>
            </button>
          ) : !isRecording ? (
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Iniciar Gravação na Guia</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Retomar</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span>Pausar</span>
                </button>
              )}

              <button
                onClick={onStop}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-red-600/20 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Finalizar & Gerar Ata</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
