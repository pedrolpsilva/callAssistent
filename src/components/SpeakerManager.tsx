import React, { useState } from 'react';
import { Users, UserPlus, Check, Edit2, Sparkles, UserCheck } from 'lucide-react';

interface SpeakerManagerProps {
  speakers: string[];
  knownSpeakers: string[];
  onAddKnownSpeaker: (name: string) => void;
  onRenameSpeaker: (oldName: string, newName: string) => void;
  onRegenerateDocs: () => void;
  hasTranscript: boolean;
  isProcessing: boolean;
}

export const SpeakerManager: React.FC<SpeakerManagerProps> = ({
  speakers,
  knownSpeakers,
  onAddKnownSpeaker,
  onRenameSpeaker,
  onRegenerateDocs,
  hasTranscript,
  isProcessing,
}) => {
  const [newSpeakerInput, setNewSpeakerInput] = useState('');
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const handleAddKnown = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpeakerInput.trim()) {
      onAddKnownSpeaker(newSpeakerInput.trim());
      setNewSpeakerInput('');
    }
  };

  const startEditing = (speaker: string) => {
    setEditingSpeaker(speaker);
    setRenameInput(speaker);
  };

  const saveRename = (oldName: string) => {
    if (renameInput.trim() && renameInput.trim() !== oldName) {
      onRenameSpeaker(oldName, renameInput.trim());
    }
    setEditingSpeaker(null);
  };

  // Combina lista de falantes únicos detectados + conhecidos
  const allSpeakers = Array.from(new Set(['Pedro Luiz', ...speakers, ...knownSpeakers]));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">Participantes & Identificação de Voz</h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">{allSpeakers.length} pessoas</span>
      </div>

      {/* Formulário para adicionar participantes esperados na call */}
      <form onSubmit={handleAddKnown} className="flex gap-2">
        <input
          type="text"
          placeholder="Ex: Lucas, Roberto..."
          value={newSpeakerInput}
          onChange={(e) => setNewSpeakerInput(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Adicionar</span>
        </button>
      </form>

      {/* Lista de Falantes */}
      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
        {allSpeakers.map((speaker, idx) => {
          const isUser = speaker === 'Pedro Luiz';
          const isEditing = editingSpeaker === speaker;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                isUser
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              {isUser ? (
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              )}

              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveRename(speaker)}
                    className="w-24 bg-slate-900 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => saveRename(speaker)}
                    className="p-1 hover:text-emerald-400 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="font-medium">
                  {speaker} {isUser && <span className="text-[10px] opacity-75 font-normal">(Você)</span>}
                </span>
              )}

              {!isUser && !isEditing && (
                <button
                  onClick={() => startEditing(speaker)}
                  title="Renomear participante"
                  className="p-1 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Botão de sincronização / regeneração da ata se alterou nomes */}
      {hasTranscript && (
        <button
          onClick={onRegenerateDocs}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Atualizar Ata com Nomes Corrigidos</span>
        </button>
      )}
    </div>
  );
};
