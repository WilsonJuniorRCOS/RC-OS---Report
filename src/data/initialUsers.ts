import { User } from '../types';

export const DEFAULT_USERS: User[] = [
  {
    id: 'user-adm-wilson',
    email: 'wilson@recargaclub.com.br',
    nome: 'Wilson',
    role: 'adm',
    senha: 'rcos1234@@wil',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-adm-1',
    email: 'adm@recargaclub.com.br',
    nome: 'Carlos ADM',
    role: 'adm',
    senha: '123',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-johnatha',
    email: 'johnatha.francis@recargaclub.com.br',
    nome: 'Johnatha Francis',
    role: 'usuario',
    senha: 'rcos1234@@',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-ronieckson',
    email: 'ronieckson.silva@recargaclub.com.br',
    nome: 'Ronieckson Silva',
    role: 'usuario',
    senha: 'rcos1234@@',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-lucas',
    email: 'lucas.luz@recargaclub.com.br',
    nome: 'Lucas Luz',
    role: 'usuario',
    senha: 'rcos1234@@',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-franciele',
    email: 'franciele.matias@recargaclub.com.br',
    nome: 'Franciele Matias',
    role: 'usuario',
    senha: 'rcos1234@@',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-italo',
    email: 'italo.rodrigo@recargaclub.com.br',
    nome: 'Italo Rodrigo',
    role: 'usuario',
    senha: 'rcos1234@@',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-jessica',
    email: 'jessica@recargaclub.com.br',
    nome: 'Jessica',
    role: 'usuario',
    senha: 'rcos1234@@',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-maria-juliana',
    email: 'maria.juliana@recargaclub.com.br',
    nome: 'Maria Juliana',
    role: 'usuario',
    senha: 'rcos1234@@',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-aline',
    email: 'aline.gomes@recargaclub.com.br',
    nome: 'Aline Gomes',
    role: 'usuario',
    senha: 'rcos1234@@',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-aua-amorim',
    email: 'aua.amorim@recargaclub.com.br',
    nome: 'Auã Amorim',
    role: 'usuario',
    senha: 'rcos1234@@',
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem('rc_os_users_list');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default users exist in case localStorage is missing any default ones
        const emailMap = new Map<string, User>();
        DEFAULT_USERS.forEach((u) => emailMap.set(u.email.toLowerCase(), u));
        parsed.forEach((u) => emailMap.set(u.email.toLowerCase(), u));
        const merged = Array.from(emailMap.values());
        saveStoredUsers(merged);
        return merged;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler rc_os_users_list do localStorage', e);
  }
  saveStoredUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

export function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem('rc_os_users_list', JSON.stringify(users));
  } catch (e) {
    console.warn('Erro ao salvar rc_os_users_list no localStorage', e);
  }
}
