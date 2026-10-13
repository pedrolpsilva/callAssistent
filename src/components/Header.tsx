import React from 'react';
import { Mic, Settings, Folder, CheckCircle2, AlertCircle } from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  onOpenSettings: () => void;
  onOpenFolder: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onOpenSettings, onOpenFolder }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white">CallAssistent</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
              Google Gemini
            </span>
          </div>
          <p className="text-xs text-slate-400">Transcrição de Reuniões & Atas de Engenharia</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status da Chave de API */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
          {status?.has_api_key ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">Gemini Conectado</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-medium">Sem Chave API</span>
            </>
          )}
        </div>

        {/* Botão de abrir pasta de transcrições */}
        <button
          onClick={onOpenFolder}
          title="Abrir pasta de transcrições no Windows"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-xs font-medium cursor-pointer"
        >
          <Folder className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">Transcrições</span>
        </button>

        {/* Botão de Configurações */}
        <button
          onClick={onOpenSettings}
          title="Configurações"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
