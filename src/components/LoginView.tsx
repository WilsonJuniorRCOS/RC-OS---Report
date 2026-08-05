import React, { useState } from 'react';
import { UserRole } from '../types';
import { ShieldCheck, User, LogIn, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string, role: UserRole, nome?: string, password?: string) => Promise<boolean>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleSelection, setRoleSelection] = useState<UserRole>('usuario');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor, informe o e-mail do usuário.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const ok = await onLogin(email.trim(), roleSelection, undefined, password);
      if (!ok) {
        setError('Credencial inválida, e-mail ou senha incorreta.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-ice">
      <div className="w-full max-w-md bg-white rounded-3xl border border-brand-warm shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-yellow text-brand-dark font-black text-xl mb-3 shadow-lg shadow-amber-400/20">
            RC
          </div>
          <h2 className="text-xl font-bold tracking-tight">RC OS — Report de Erros</h2>
          <p className="text-xs text-slate-400 mt-1">Acesso ao sistema interno de ocorrências e triagem</p>
        </div>

        {/* Form Container */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Usuário / E-mail
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@recargaclub.com.br"
                className="w-full px-4 py-2.5 text-sm bg-[#F8F5EC] border border-brand-warm rounded-xl focus:ring-2 focus:ring-amber-400 focus:bg-white outline-none transition-all text-slate-800"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Senha
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm bg-[#F8F5EC] border border-brand-warm rounded-xl focus:ring-2 focus:ring-amber-400 focus:bg-white outline-none transition-all text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Perfil de Acesso
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="role-usuario-option"
                  onClick={() => setRoleSelection('usuario')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    roleSelection === 'usuario'
                      ? 'bg-brand-yellow border-amber-400 text-brand-dark shadow-xs'
                      : 'bg-white border-brand-warm text-slate-600 hover:bg-[#F8F5EC]'
                  }`}
                >
                  <User className="w-4 h-4" /> Consultor
                </button>
                <button
                  type="button"
                  id="role-adm-option"
                  onClick={() => setRoleSelection('adm')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    roleSelection === 'adm'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-white border-brand-warm text-slate-600 hover:bg-[#F8F5EC]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" /> ADM
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={loading}
              className="w-full py-3 bg-brand-yellow hover:bg-[#EBB019] text-brand-dark font-black text-sm rounded-full shadow-md shadow-amber-400/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Entrar no RC OS
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
