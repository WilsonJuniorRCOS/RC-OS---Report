export type UserRole = 'usuario' | 'adm';

export interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  senha?: string;
  created_at?: string;
}

export type ReportTipo = 'sugestao' | 'reclamacao';
export type ReportPrioridade = 'urgente' | 'normal';
export type ReportStatus = 'novo' | 'em_andamento' | 'aprovado' | 'recusado';

export interface Report {
  id: string;
  titulo: string;
  tipo: ReportTipo;
  link: string;
  prioridade: ReportPrioridade;
  descricao: string;
  print_url?: string;
  autor_id: string;
  autor_nome: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface FilterOptions {
  status?: ReportStatus | 'todos';
  prioridade?: ReportPrioridade | 'todas';
  tipo?: ReportTipo | 'todos';
  search?: string;
}

export interface PromptTemplateInput {
  report: Report;
  modulo?: string;
  comportamentoBase?: string;
  detalhamento?: string;
  solucaoPrincipal?: string;
  solucaoSecundaria?: string;
  investigacaoItems?: string[];
  validacaoItems?: string[];
}
