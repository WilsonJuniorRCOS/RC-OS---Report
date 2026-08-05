import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl p-2 border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-slate-800 text-white">
          <span className="text-xs font-bold text-slate-300">Anexo de Ocorrência (Visualização Ampliada)</span>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Abrir Original
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950/50 min-h-[300px]">
          <img src={imageUrl} alt="Print da ocorrência" className="max-h-[75vh] object-contain rounded-lg shadow-lg" />
        </div>
      </div>
    </div>
  );
};
