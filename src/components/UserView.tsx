import React, { useState } from 'react';
import { Report, ReportPrioridade, ReportTipo, User } from '../types';
import { Send, Image as ImageIcon, CheckCircle2, AlertTriangle, ExternalLink, X, Clock, RefreshCw } from 'lucide-react';

interface UserViewProps {
  user: User;
  reports: Report[];
  onSubmitReport: (newReport: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<boolean>;
  onRefresh?: () => void;
  onOpenImageModal?: (url: string) => void;
}

export const UserView: React.FC<UserViewProps> = ({
  user,
  reports,
  onSubmitReport,
  onRefresh,
  onOpenImageModal,
}) => {
  // Form state
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<ReportTipo>('reclamacao');
  const [link, setLink] = useState('');
  const [prioridade, setPrioridade] = useState<ReportPrioridade>('normal');
  const [descricao, setDescricao] = useState('');
  const [printUrl, setPrintUrl] = useState<string | null>(null);

  // Validation state
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Field validation helper
  const isTituloValid = titulo.trim().length > 0;
  const isLinkValid = link.trim().length > 0;
  const isDescricaoValid = descricao.trim().length > 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem (PNG/JPG).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrintUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setSuccessMsg(null);

    // Validate all 5 required fields
    if (!isTituloValid || !isLinkValid || !isDescricaoValid || !tipo || !prioridade) {
      return;
    }

    setSubmitting(true);
    try {
      const ok = await onSubmitReport({
        titulo: titulo.trim(),
        tipo,
        link: link.trim(),
        prioridade,
        descricao: descricao.trim(),
        print_url: printUrl || undefined,
        autor_id: user.id,
        autor_nome: user.nome,
      });

      if (ok) {
        setSuccessMsg('Report registrado com sucesso! O status "Novo" já está disponível para triagem.');
        // Reset form
        setTitulo('');
        setTipo('reclamacao');
        setLink('');
        setPrioridade('normal');
        setDescricao('');
        setPrintUrl(null);
        setAttemptedSubmit(false);
      }
    } catch (err: any) {
      alert('Erro ao enviar report: ' + (err?.message || 'Erro de conexão'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'novo':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Novo
          </span>
        );
      case 'em_andamento':
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            Em Andamento
          </span>
        );
      case 'aprovado':
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Aprovado
          </span>
        );
      case 'recusado':
        return (
          <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Recusado
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (p: ReportPrioridade) => {
    switch (p) {
      case 'urgente':
        return <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase tracking-wide">Urgente</span>;
      case 'normal':
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wide">Normal</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Intro Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Área do Consultor — {user.nome}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registre ocorrências ou sugestões do sistema RC OS. Acompanhe a triagem do ADM em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar Lista
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FORM: Registrar Report (Left Column) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-brand-warm shadow-xs p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
            <Send className="w-5 h-5 text-amber-500" /> Registrar Novo Report
          </h3>

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Sucesso!</p>
                <p>{successMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. TÍTULO DO REPORT */}
            <div className="space-y-1.5">
              <label htmlFor="field-titulo" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                1. Título do Report <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Erro no cálculo de ICMS"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                  attemptedSubmit && !isTituloValid
                    ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200'
                    : 'border-brand-warm bg-[#F8F5EC] focus:bg-white focus:ring-2 focus:ring-amber-400'
                }`}
              />
              {attemptedSubmit && !isTituloValid && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Título é obrigatório.
                </p>
              )}
            </div>

            {/* 2. TIPO & 4. PRIORIDADE */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="field-tipo" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  2. Tipo <span className="text-rose-500">*</span>
                </label>
                <select
                  id="field-tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as ReportTipo)}
                  className="w-full px-3 py-2 border border-brand-warm rounded-xl text-sm bg-[#F8F5EC] font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="reclamacao">Reclamação</option>
                  <option value="sugestao">Sugestão</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="field-prioridade" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  4. Prioridade <span className="text-rose-500">*</span>
                </label>
                <select
                  id="field-prioridade"
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as ReportPrioridade)}
                  className="w-full px-3 py-2 border border-brand-warm rounded-xl text-sm bg-[#F8F5EC] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-400 font-bold"
                >
                  <option value="urgente">Urgente</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </div>

            {/* 3. LINK DA CONVERSA OU NEGÓCIO */}
            <div className="space-y-1.5">
              <label htmlFor="field-link" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                3. Link do Negócio / Conversa <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-link"
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://rc-os.com/negocio/123"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                  attemptedSubmit && !isLinkValid
                    ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200'
                    : 'border-brand-warm bg-[#F8F5EC] focus:bg-white focus:ring-2 focus:ring-amber-400'
                }`}
              />
              {attemptedSubmit && !isLinkValid && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Link de referência é obrigatório.
                </p>
              )}
            </div>

            {/* 5. DESCRIÇÃO DO ERRO */}
            <div className="space-y-1.5">
              <label htmlFor="field-descricao" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                5. Descrição Detalhada <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="field-descricao"
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o que ocorreu..."
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none resize-none transition-all ${
                  attemptedSubmit && !isDescricaoValid
                    ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200'
                    : 'border-brand-warm bg-[#F8F5EC] focus:bg-white focus:ring-2 focus:ring-amber-400'
                }`}
              />
              {attemptedSubmit && !isDescricaoValid && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> A descrição é obrigatória.
                </p>
              )}
            </div>

            {/* 6. ANEXAR PRINT */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                6. Anexo (Print) <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              {!printUrl ? (
                <div className="border-2 border-dashed border-brand-warm rounded-xl p-3 text-center bg-[#F8F5EC] cursor-pointer hover:border-amber-400 transition-colors">
                  <input
                    type="file"
                    id="field-print"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="field-print" className="cursor-pointer flex flex-col items-center justify-center gap-1">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">Clique para selecionar imagem</span>
                  </label>
                </div>
              ) : (
                <div className="relative inline-block border rounded-xl overflow-hidden bg-slate-900 shadow-sm">
                  <img src={printUrl} alt="Preview do anexo" className="h-28 object-contain" />
                  <button
                    type="button"
                    onClick={() => setPrintUrl(null)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow cursor-pointer"
                    title="Remover anexo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit button (Recarga Club Pill Amarelo) */}
            <button
              type="submit"
              id="btn-submit-report"
              disabled={submitting}
              className="w-full mt-4 bg-brand-yellow hover:bg-[#EBB019] text-brand-dark font-black py-3 px-6 rounded-full transition-all shadow-md shadow-amber-400/20 flex items-center justify-center gap-2 text-sm tracking-wide disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> ENVIAR REPORT
                </>
              )}
            </button>
          </form>
        </div>

        {/* LISTA: Meus Reports (Right Column) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Meus Reports
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-brand-yellow text-brand-dark font-black shadow-xs">
                {reports.length}
              </span>
            </h3>
            <span className="text-xs text-slate-400 italic flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Atualizado em tempo real
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhum report enviado por você ainda.</p>
              <p className="text-xs text-slate-400 mt-1">Preencha o formulário para registrar sua primeira ocorrência.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded ${
                          report.tipo === 'reclamacao'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {report.tipo === 'reclamacao' ? 'Reclamação' : 'Sugestão'}
                      </span>
                      {getPriorityBadge(report.prioridade)}
                      <span className="text-[11px] text-slate-400">
                        {new Date(report.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {/* Status Highlight Badge */}
                    <div>{getStatusBadge(report.status)}</div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">{report.titulo}</h4>
                    <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-line leading-relaxed">
                      {report.descricao}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <a
                      href={report.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold truncate max-w-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{report.link}</span>
                    </a>

                    {report.print_url && onOpenImageModal && (
                      <button
                        type="button"
                        onClick={() => onOpenImageModal(report.print_url!)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Ver Print
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
