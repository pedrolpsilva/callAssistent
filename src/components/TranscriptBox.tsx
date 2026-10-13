import React, { useState } from 'react';
import { Copy, Check, MessageSquare, Search, FileText } from 'lucide-react';
import { TranscriptSegment } from '../types';

interface TranscriptBoxProps {
  segments: TranscriptSegment[];
  rawText: string;
}

export const TranscriptBox: React.FC<TranscriptBoxProps> = ({ segments, rawText }) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSegments = segments.filter(
    (seg) =>
      seg.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paleta de cores para os avatares dos falantes
  const getSpeakerColor = (speaker: string) => {
    if (speaker === 'Pedro Luiz') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (speaker.includes('1')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (speaker.includes('2')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  };

  if (segments.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <MessageSquare className="w-12 h-12 text-slate-700 mb-3 stroke-[1.5]" />
        <p className="text-sm font-medium text-slate-400">Nenhuma transcrição ativa no momento</p>
        <p className="text-xs text-slate-600 max-w-sm mt-1">
          Inicie uma gravação durante sua reunião no Meet, Teams ou Discord para transcrever as falas automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Barra de Ações Superior */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-200">Diálogo da Reunião</span>
          <span className="text-[11px] text-slate-500 font-mono">({segments.length} falas)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Busca na Transcrição */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar falas ou pessoas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-44 lg:w-56 bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Botão Copiar */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lista de Falas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredSegments.map((seg, idx) => {
          const isUser = seg.speaker === 'Pedro Luiz';
          const colorClass = getSpeakerColor(seg.speaker);

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-colors ${
                isUser ? 'bg-slate-950/80 border-emerald-950/60' : 'bg-slate-950/40 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-bold ${colorClass}`}>
                  {seg.speaker}
                  {isUser && <span className="text-[10px] font-normal opacity-80">(Você)</span>}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-1">{seg.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
