import React from 'react';
import { Play, Pause, Square, Loader2, Monitor, RefreshCw, Mic, Volume2 } from 'lucide-react';
import { SystemStatus } from '../types';

interface ControlBarProps {
  status: SystemStatus | null;
  windows: string[];
  selectedWindow: string;
  onSelectWindow: (w: string) => void;
  onRefreshWindows: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isProcessing: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  status,
  windows,
  selectedWindow,
  onSelectWindow,
  onRefreshWindows,
  onStart,
  onPause,
  onResume,
  onStop,
  isProcessing,
}) => {
  const isRecording = status?.is_recording ?? false;
  const isPaused = status?.is_paused ?? false;
  const duration = status?.duration ?? 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 p-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Lado Esquerdo: Seletor de Janela da Reunião (Modo 3) */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 whitespace-nowrap">
            <Monitor className="w-4 h-4 text-blue-400" />
            <span>Janela da Reunião:</span>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <select
              value={selectedWindow}
              onChange={(e) => onSelectWindow(e.target.value)}
              disabled={isRecording}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
            >
              <option value="">Nenhuma janela específica (Monitorar Áudio Geral do PC)</option>
              {windows.map((win, idx) => (
                <option key={idx} value={win}>
                  {win}
                </option>
              ))}
            </select>

            <button
              onClick={onRefreshWindows}
              disabled={isRecording}
              title="Atualizar lista de janelas abertas"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Lado Direito: Controles de Gravação */}
        <div className="flex items-center justify-between lg:justify-end gap-3">
          
          {/* Indicadores de canais de áudio ativos */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border-r border-slate-800 pr-4">
            <div className="flex items-center gap-1 text-emerald-400" title="Microfone isolado de Pedro Luiz">
              <Mic className="w-3.5 h-3.5" />
              <span className="font-medium">Você (Pedro Luiz)</span>
            </div>
            <span>+</span>
            <div className="flex items-center gap-1 text-blue-400" title="Áudio dos outros participantes pelo som do Windows">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Som do PC</span>
            </div>
          </div>

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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold"
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
              <span>Iniciar Gravação</span>
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
