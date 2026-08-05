import React, { useState } from 'react';
import { Report, ReportStatus } from '../types';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Image as ImageIcon,
  Code2,
  Trash2,
  User as UserIcon,
  Calendar,
  AlertTriangle,
  FileText,
  Maximize2,
} from 'lucide-react';

interface ReportDetailModalProps {
  report: Report | null;
  onClose: () => void;
  onOpenPromptModal?: (report: Report) => void;
  onOpenImageModal?: (url: string) => void;
  onUpdateStatus?: (id: string, newStatus: ReportStatus) => Promise<boolean>;
  onDeleteReport?: (id: string) => Promise<boolean>;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onOpenPromptModal,
  onOpenImageModal,
  onUpdateStatus,
  onDeleteReport,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!report) return null;

  const isReclamacao = String(report.tipo || '').toLowerCase().includes('reclam');
  const isUrgente = String(report.prioridade || '').toLowerCase().includes('urg');

  const handleCopyLink = () => {
    if (!report.link) return;
    navigator.clipboard.writeText(report.link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getValidExternalUrl = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.includes('.')) {
      return `https://${trimmed}`;
    }
    return null;
  };

  const externalUrl = getValidExternalUrl(report.link);

  const handleStatusSelect = async (newStatus: ReportStatus) => {
    if (!onUpdateStatus) return;
    setUpdating(true);
    await onUpdateStatus(report.id, newStatus);
    setUpdating(false);
  };

  const handleDelete = async () => {
    if (!onDeleteReport) return;
    if (window.confirm(`Tem certeza que deseja excluir este report "${report.titulo}"?`)) {
      setUpdating(true);
      await onDeleteReport(report.id);
      setUpdating(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${
                isReclamacao
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
            >
              {isReclamacao ? '🚨 Reclamação' : '💡 Sugestão'}
            </span>

            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${
                isUrgente
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isUrgente ? '⚡ URGENTE' : 'NORMAL'}
            </span>

            <span className="text-xs text-slate-400 font-mono">ID: {report.id}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Title and Meta */}
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-snug">{report.titulo}</h2>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Autor: <strong className="text-slate-900">{report.autor_nome}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{new Date(report.created_at).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Link Informado */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Link Informado / Referência
            </label>
            <div className="flex items-center gap-2 bg-slate-900 text-slate-200 p-3 rounded-xl border border-slate-800 text-xs font-mono break-all">
              <span className="flex-1 select-all">{report.link || 'Nenhum link informado'}</span>

              {report.link && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar Link
                      </>
                    )}
                  </button>

                  {externalUrl && (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-sans font-bold flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir Link
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Descrição Detalhada */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" /> Descrição Completa na Íntegra
            </label>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans">
              {report.descricao}
            </div>
          </div>

          {/* Print Anexado */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-600" /> Print Anexado pelo Usuário
            </label>

            {report.print_url ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-950/90 p-2 text-center">
                <img
                  src={report.print_url}
                  alt="Print do report"
                  className="max-h-96 w-auto mx-auto object-contain rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => onOpenImageModal && onOpenImageModal(report.print_url!)}
                />
                <div className="mt-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onOpenImageModal && onOpenImageModal(report.print_url!)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" /> Ampliar Print em Tela Cheia
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400 italic">
                Nenhum print ou imagem anexado a este report.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {onUpdateStatus && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600">Status:</span>
                <select
                  value={report.status}
                  disabled={updating}
                  onChange={(e) => handleStatusSelect(e.target.value as ReportStatus)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="novo">Novo</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="aprovado">Feito / Concluído</option>
                  <option value="recusado">Recusado</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenPromptModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPromptModal(report);
                }}
                className="px-4 py-2 bg-brand-yellow hover:bg-[#EBB019] text-brand-dark text-xs font-black rounded-full transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-slate-900" /> Gerar Prompt IA
              </button>
            )}

            {onDeleteReport && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={updating}
                className="px-3.5 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-full transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
