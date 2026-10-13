import React, { useState, useEffect } from 'react';
import { X, Key, Folder, Check } from 'lucide-react';
import { fetchConfig, updateConfig } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onConfigSaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConfig()
        .then((cfg) => {
          setApiKey(cfg.gemini_api_key || '');
          setOutputDir(cfg.output_dir || '');
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      await updateConfig(apiKey.trim(), outputDir.trim());
      setFeedback('Configurações salvas com sucesso!');
      onConfigSaved();
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback(err.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white">Configurações do CallAssistent</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* Chave API do Gemini */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <span>Chave da API do Google Gemini (GEMINI_API_KEY)</span>
            </label>
            <input
              type="password"
              placeholder="Cole sua chave de API do Google AI Studio..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Obtida gratuitamente no portal do Google AI Studio.
            </p>
          </div>

          {/* Diretório de Salvamento */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Pasta de Destino das Transcrições (.md)</span>
            </label>
            <input
              type="text"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Os arquivos são salvos como [ANO-MÊS-DIA]-[HORA-MINUTO-SEGUNDO].md.
            </p>
          </div>

          {feedback && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300">{feedback}</span>
            </div>
          )}

          {/* Rodapé com Botões */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
