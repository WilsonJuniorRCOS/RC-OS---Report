import React, { useState } from 'react';
import { FilterOptions, Report, ReportPrioridade, ReportStatus, ReportTipo, User } from '../types';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Code2,
  Filter,
  Search,
  RefreshCw,
  User as UserIcon,
  AlertTriangle,
} from 'lucide-react';

interface AdminViewProps {
  user: User;
  reports: Report[];
  onUpdateStatus: (id: string, newStatus: ReportStatus) => Promise<boolean>;
  onRefresh: () => void;
  onOpenPromptModal: (report: Report) => void;
  onOpenImageModal: (url: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  user,
  reports,
  onUpdateStatus,
  onRefresh,
  onOpenPromptModal,
  onOpenImageModal,
}) => {
  // Filters
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'todos'>('todos');
  const [filterPrioridade, setFilterPrioridade] = useState<ReportPrioridade | 'todas'>('todas');
  const [filterTipo, setFilterTipo] = useState<ReportTipo | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Stats calculation
  const totalReports = reports.length;
  const countNovos = reports.filter((r) => r.status === 'novo').length;
  const countEmAndamento = reports.filter((r) => r.status === 'em_andamento').length;
  const countAprovados = reports.filter((r) => r.status === 'aprovado').length;
  const countRecusados = reports.filter((r) => r.status === 'recusado').length;

  // Filter logic
  const filteredReports = reports.filter((r) => {
    if (filterStatus !== 'todos' && r.status !== filterStatus) return false;
    if (filterPrioridade !== 'todas' && r.prioridade !== filterPrioridade) return false;
    if (filterTipo !== 'todos' && r.tipo !== filterTipo) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = r.titulo.toLowerCase().includes(term);
      const matchDesc = r.descricao.toLowerCase().includes(term);
      const matchAuthor = r.autor_nome.toLowerCase().includes(term);
      const matchLink = r.link.toLowerCase().includes(term);
      return matchTitle || matchDesc || matchAuthor || matchLink;
    }

    return true;
  });

  const handleStatusChange = async (id: string, newStatus: ReportStatus) => {
    setUpdatingId(id);
    try {
      await onUpdateStatus(id, newStatus);
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + (err?.message || 'Falha de comunicação'));
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'novo':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Novo
          </span>
        );
      case 'em_andamento':
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-600 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            Em Andamento
          </span>
        );
      case 'aprovado':
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Feito
          </span>
        );
      case 'recusado':
        return (
          <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Recusado
          </span>
        );
    }
  };

  const getPriorityBadge = (p: ReportPrioridade) => {
    switch (p) {
      case 'urgente':
        return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Urgente</span>;
      case 'normal':
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wide">Normal</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-brand-warm p-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" /> Painel de Triagem RC OS
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie os chamados dos consultores, altere status e gere o prompt formatado para correção.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:text-slate-900 bg-[#F8F5EC] hover:bg-slate-200/80 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer border border-brand-warm disabled:opacity-70"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Quick Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterStatus('todos')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              filterStatus === 'todos'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-brand-warm hover:bg-[#F8F5EC]'
            }`}
          >
            Todos ({totalReports})
          </button>
          <button
            onClick={() => setFilterStatus('novo')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              filterStatus === 'novo'
                ? 'bg-brand-yellow text-brand-dark border-amber-400 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            Novos ({countNovos})
          </button>
          <button
            onClick={() => setFilterStatus('em_andamento')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              filterStatus === 'em_andamento'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            Em Andamento ({countEmAndamento})
          </button>
          <button
            onClick={() => setFilterStatus('aprovado')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              filterStatus === 'aprovado'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Feitos ({countAprovados})
          </button>
          <button
            onClick={() => setFilterStatus('recusado')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              filterStatus === 'recusado'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            Recusados ({countRecusados})
          </button>
        </div>

        {/* Realtime Note & Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar título, autor ou link..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-brand-warm rounded-full outline-none focus:ring-2 focus:ring-amber-400 text-slate-800"
            />
          </div>
          <span className="text-xs text-slate-400 italic shrink-0 hidden sm:inline">
            Atualizado em tempo real
          </span>
        </div>
      </div>

      {/* Main Table / Data View Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">Nenhum report encontrado.</p>
            <p className="text-xs text-slate-500 mt-1">Ajuste os filtros de busca para encontrar registros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200">
                <tr className="h-10">
                  <th className="px-6 font-bold uppercase tracking-widest">Autor</th>
                  <th className="px-4 font-bold uppercase tracking-widest">Título / Detalhes</th>
                  <th className="px-4 font-bold uppercase tracking-widest">Prioridade</th>
                  <th className="px-4 font-bold uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 text-right font-bold uppercase tracking-widest">Ações & Triagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Autor */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-yellow text-brand-dark flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                          {report.autor_nome
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">{report.autor_nome}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {new Date(report.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Título & Categoria */}
                    <td className="px-4 py-4 align-top max-w-sm">
                      <div className="text-sm font-semibold text-slate-900 leading-tight">{report.titulo}</div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-medium capitalize text-slate-600">
                          {String(report.tipo || '').toLowerCase().includes('reclam') ? '🚨 Reclamação' : '💡 Sugestão'}
                        </span>
                        <span>•</span>
                        <a
                          href={report.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[10px]"
                        >
                          <ExternalLink className="w-3 h-3" /> Link
                        </a>
                        {report.print_url && (
                          <button
                            type="button"
                            onClick={() => onOpenImageModal(report.print_url!)}
                            className="text-indigo-600 hover:underline flex items-center gap-1 text-[10px] font-bold"
                          >
                            <ImageIcon className="w-3 h-3" /> Print
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {report.descricao}
                      </p>
                    </td>

                    {/* Prioridade */}
                    <td className="px-4 py-4 align-top whitespace-nowrap">
                      {getPriorityBadge(report.prioridade)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 align-top text-center whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4 align-top text-right space-y-2 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={report.status}
                          disabled={updatingId === report.id}
                          onChange={(e) => handleStatusChange(report.id, e.target.value as ReportStatus)}
                          className="px-2 py-1 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="novo">Status: Novo</option>
                          <option value="em_andamento">Em Andamento</option>
                          <option value="aprovado">Feito</option>
                          <option value="recusado">Recusar</option>
                        </select>

                        <button
                          type="button"
                          id={`btn-gerar-prompt-${report.id}`}
                          onClick={() => onOpenPromptModal(report)}
                          className="px-3.5 py-1 bg-brand-yellow hover:bg-[#EBB019] text-brand-dark text-xs font-black rounded-full transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Code2 className="w-3.5 h-3.5 text-slate-900" /> Prompt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
