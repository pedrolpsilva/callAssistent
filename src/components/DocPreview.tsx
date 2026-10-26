import React, { useState } from 'react';
import { FileText, Copy, Check, ExternalLink, Folder, Sparkles, Download } from 'lucide-react';
import { openFolder, openFile } from '../services/api';

interface DocPreviewProps {
  markdown: string;
  filePath: string;
  fileName: string;
}

export const DocPreview: React.FC<DocPreviewProps> = ({ markdown, filePath, fileName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'Ata-Reuniao.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenFile = async () => {
    if (filePath) {
      await openFile(filePath).catch((err) => alert(err.message));
    }
  };

  const handleOpenFolder = async () => {
    await openFolder().catch((err) => alert(err.message));
  };

  if (!markdown) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <Sparkles className="w-12 h-12 text-slate-700 mb-3 stroke-[1.5]" />
        <p className="text-sm font-medium text-slate-400">Nenhuma ata ou documentação gerada</p>
        <p className="text-xs text-slate-600 max-w-sm mt-1">
          Ao finalizar uma gravação, o Google Gemini sintetizará automaticamente o Resumo Executivo, Decisões Técnicas e Próximos Passos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Barra de Ações Superior */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950/60 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-xs font-semibold text-slate-200">Ata de Reunião & Produto</span>
            {fileName && (
              <span className="ml-2 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {fileName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {filePath && (
            <button
              onClick={handleOpenFile}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium border border-blue-500/30 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir no Editor</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors cursor-pointer"
            title="Baixar arquivo Markdown diretamente no navegador"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Baixar .md</span>
          </button>

          <button
            onClick={handleOpenFolder}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Abrir Pasta</span>
          </button>

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
                <span>Copiar .md</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo Renderizado da Ata */}
      <div className="flex-1 overflow-y-auto p-6 text-slate-200 font-sans text-xs sm:text-sm leading-relaxed space-y-4 select-text">
        <pre className="whitespace-pre-wrap font-sans bg-slate-950 p-5 rounded-xl border border-slate-800/80 leading-relaxed text-slate-300 text-xs sm:text-sm selection:bg-blue-600 selection:text-white">
          {markdown}
        </pre>
      </div>
    </div>
  );
};
