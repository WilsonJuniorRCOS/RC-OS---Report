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

export function getDeletedUserIds(): string[] {
  try {
    const raw = localStorage.getItem('rc_os_deleted_user_ids');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markUserAsDeleted(userId: string, email?: string): void {
  const ids = getDeletedUserIds();
  if (!ids.includes(userId)) ids.push(userId);
  if (email && !ids.includes(email.toLowerCase())) ids.push(email.toLowerCase());
  try {
    localStorage.setItem('rc_os_deleted_user_ids', JSON.stringify(ids));
  } catch (e) {}
}

export function getStoredUsers(): User[] {
  const deletedIds = getDeletedUserIds();
  try {
    const raw = localStorage.getItem('rc_os_users_list');
    if (raw) {
      const parsed: User[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(
          (u) => !deletedIds.includes(u.id) && !deletedIds.includes(u.email.toLowerCase())
        );
      }
    }
  } catch (e) {
    console.warn('Erro ao ler rc_os_users_list do localStorage', e);
  }
  const initial = DEFAULT_USERS.filter(
    (u) => !deletedIds.includes(u.id) && !deletedIds.includes(u.email.toLowerCase())
  );
  saveStoredUsers(initial);
  return initial;
}

export function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem('rc_os_users_list', JSON.stringify(users));
  } catch (e) {
    console.warn('Erro ao salvar rc_os_users_list no localStorage', e);
  }
}
