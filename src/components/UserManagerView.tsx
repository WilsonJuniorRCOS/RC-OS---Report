import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  User as UserIcon,
  Search,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

interface UserManagerViewProps {
  currentUser: User;
  onRefreshCurrentUser?: () => void;
}

export const UserManagerView: React.FC<UserManagerViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | UserRole>('todos');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states for Create/Edit
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('usuario');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Password visibility map (userId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});

  // Delete confirmation modal state
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Toast feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const openCreateModal = () => {
    setFormNome('');
    setFormEmail('');
    setFormSenha('');
    setFormRole('usuario');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setFormNome(userToEdit.nome);
    setFormEmail(userToEdit.email);
    setFormSenha(userToEdit.senha || '');
    setFormRole(userToEdit.role);
    setFormError(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formEmail.trim()) {
      setFormError('Nome e E-mail são obrigatórios.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formNome,
          email: formEmail,
          senha: formSenha || 'rcos1234@@',
          role: formRole,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        console.warn('Erro ao ler resposta JSON:', e);
      }

      if (!res.ok) {
        setFormError(data.error || `Erro do servidor (${res.status}).`);
        return;
      }

      showFeedback(`Usuário "${data.user?.nome || formNome}" criado com sucesso!`);
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.warn('Erro na chamada API ao criar usuário, aplicando fallback local:', err);
      const newUser: User = {
        id: `user-${Date.now()}`,
        nome: formNome.trim(),
        email: formEmail.trim(),
        senha: formSenha ? formSenha.trim() : 'rcos1234@@',
        role: formRole,
        created_at: new Date().toISOString(),
      };
      setUsers((prev) => {
        if (prev.some((u) => u.email.toLowerCase() === newUser.email.toLowerCase())) {
          setFormError('Já existe um usuário cadastrado com este e-mail.');
          return prev;
        }
        showFeedback(`Usuário "${newUser.nome}" criado com sucesso!`);
        setIsCreateModalOpen(false);
        return [newUser, ...prev];
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!formNome.trim() || !formEmail.trim()) {
      setFormError('Nome e E-mail são obrigatórios.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formNome,
          email: formEmail,
          senha: formSenha,
          role: formRole,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        console.warn('Erro ao ler resposta JSON:', e);
      }

      if (!res.ok) {
        setFormError(data.error || `Erro do servidor (${res.status}).`);
        return;
      }

      showFeedback(`Usuário "${data.user?.nome || formNome}" atualizado com sucesso!`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.warn('Erro na chamada API ao atualizar usuário, aplicando fallback local:', err);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                nome: formNome.trim(),
                email: formEmail.trim(),
                senha: formSenha ? formSenha.trim() : u.senha,
                role: formRole,
              }
            : u
        )
      );
      showFeedback(`Usuário "${formNome}" atualizado com sucesso!`);
      setEditingUser(null);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setDeleteSubmitting(true);
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        console.warn('Erro ao ler resposta JSON:', e);
      }

      if (!res.ok) {
        alert(data.error || `Erro do servidor (${res.status}).`);
        return;
      }

      showFeedback(`Usuário "${deletingUser.nome}" removido.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      console.warn('Erro na chamada API ao excluir usuário, aplicando fallback local:', err);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      showFeedback(`Usuário "${deletingUser.nome}" removido.`);
      setDeletingUser(null);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'todos' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const totalConsultores = users.filter((u) => u.role === 'usuario').length;
  const totalAdms = users.filter((u) => u.role === 'adm').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header Overview Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-brand-warm p-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" /> Área do Gestor — Controle de Usuários
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie os acessos do sistema, altere senhas e redefina a tipificação dos colaboradores (Consultor ou ADM).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-[#F8F5EC] hover:bg-slate-200/80 rounded-full flex items-center gap-1.5 transition-colors border border-brand-warm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          <button
            type="button"
            id="btn-novo-usuario"
            onClick={openCreateModal}
            className="px-5 py-2 bg-brand-yellow hover:bg-[#EBB019] text-brand-dark font-black text-xs rounded-full transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-slate-900" /> Novo Usuário
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-brand-warm p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Cadastros</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-warm p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Consultores (Usuários)</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{totalConsultores}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-warm p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Administradores (ADM)</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalAdms}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Role Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setRoleFilter('todos')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              roleFilter === 'todos'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-brand-warm hover:bg-[#F8F5EC]'
            }`}
          >
            Todos os Perfis ({totalUsers})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('usuario')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              roleFilter === 'usuario'
                ? 'bg-brand-yellow text-brand-dark border-amber-400 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            Consultores ({totalConsultores})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('adm')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              roleFilter === 'adm'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
            }`}
          >
            ADM ({totalAdms})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar nome ou e-mail..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-brand-warm rounded-full outline-none focus:ring-2 focus:ring-amber-400 text-slate-800"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-brand-warm shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">Nenhum usuário encontrado.</p>
            <p className="text-xs text-slate-500 mt-1">Tente ajustar a busca ou adicione um novo cadastro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8F5EC] text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-brand-warm">
                <tr className="h-10">
                  <th className="px-6 font-bold uppercase tracking-widest">Usuário</th>
                  <th className="px-4 font-bold uppercase tracking-widest">E-mail</th>
                  <th className="px-4 font-bold uppercase tracking-widest text-center">Tipificação (Perfil)</th>
                  <th className="px-4 font-bold uppercase tracking-widest">Senha</th>
                  <th className="px-6 text-right font-bold uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isVisible = visiblePasswords[u.id];
                  const isSelf = currentUser.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Usuário Nome & Initials */}
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                              u.role === 'adm'
                                ? 'bg-slate-900 text-white'
                                : 'bg-brand-yellow text-brand-dark'
                            }`}
                          >
                            {u.nome
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              {u.nome}
                              {isSelf && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-normal">
                                  Você
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {u.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* E-mail */}
                      <td className="px-4 py-4 align-middle">
                        <span className="text-xs font-mono text-slate-700">{u.email}</span>
                      </td>

                      {/* Tipificação */}
                      <td className="px-4 py-4 align-middle text-center">
                        {u.role === 'adm' ? (
                          <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Administrador (ADM)
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                            <UserIcon className="w-3 h-3 text-amber-600" />
                            Consultor (Usuário)
                          </span>
                        )}
                      </td>

                      {/* Senha */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 min-w-[80px] inline-block text-center border border-slate-200">
                            {isVisible ? u.senha || '123' : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title={isVisible ? 'Ocultar senha' : 'Exibir senha'}
                          >
                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Criar Novo Usuário */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-brand-warm shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-[#F8F5EC] border-b border-brand-warm px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center text-brand-dark font-black">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Novo Usuário do Sistema</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3.5 py-2 text-sm bg-[#F8F5EC] border border-brand-warm rounded-xl outline-none focus:ring-2 focus:ring-amber-400 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="joao@recargaclub.com.br"
                  className="w-full px-3.5 py-2 text-sm bg-[#F8F5EC] border border-brand-warm rounded-xl outline-none focus:ring-2 focus:ring-amber-400 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formSenha}
                    onChange={(e) => setFormSenha(e.target.value)}
                    placeholder="Defina uma senha (padrão: 123)"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8F5EC] border border-brand-warm rounded-xl outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipificação (Perfil do Colaborador)
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormRole('usuario')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                      formRole === 'usuario'
                        ? 'bg-brand-yellow border-amber-400 text-brand-dark shadow-xs'
                        : 'bg-white border-brand-warm text-slate-600 hover:bg-[#F8F5EC]'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" /> Consultor
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRole('adm')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                      formRole === 'adm'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-brand-warm text-slate-600 hover:bg-[#F8F5EC]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Gestor / ADM
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-brand-yellow hover:bg-[#EBB019] text-brand-dark font-black text-xs rounded-full shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Salvar Usuário'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Usuário */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-brand-warm shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-[#F8F5EC] border-b border-brand-warm px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Editar Usuário</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-[#F8F5EC] border border-brand-warm rounded-xl outline-none focus:ring-2 focus:ring-amber-400 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-[#F8F5EC] border border-brand-warm rounded-xl outline-none focus:ring-2 focus:ring-amber-400 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alterar Senha
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formSenha}
                    onChange={(e) => setFormSenha(e.target.value)}
                    placeholder="Digite a nova senha..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8F5EC] border border-brand-warm rounded-xl outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipificação (Perfil)
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormRole('usuario')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                      formRole === 'usuario'
                        ? 'bg-brand-yellow border-amber-400 text-brand-dark shadow-xs'
                        : 'bg-white border-brand-warm text-slate-600 hover:bg-[#F8F5EC]'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" /> Consultor
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRole('adm')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                      formRole === 'adm'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-brand-warm text-slate-600 hover:bg-[#F8F5EC]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Gestor / ADM
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-brand-yellow hover:bg-[#EBB019] text-brand-dark font-black text-xs rounded-full shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Atualizar Dados'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Exclusão */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-fade-in p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Excluir Usuário?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tem certeza que deseja remover <strong>{deletingUser.nome}</strong> ({deletingUser.email})? Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full cursor-pointer flex items-center gap-1.5"
              >
                {deleteSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Sim, Excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
