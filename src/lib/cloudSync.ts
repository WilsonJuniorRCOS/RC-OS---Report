import { Report, User } from '../types';
import { DEFAULT_USERS, getStoredUsers, saveStoredUsers } from '../data/initialUsers';

const CLOUD_SYNC_REPORTS_URL = 'https://kvdb.io/rc_os_reports_v2026/reports';
const CLOUD_SYNC_USERS_URL = 'https://kvdb.io/rc_os_reports_v2026/users';

function getLocalReports(): Report[] {
  try {
    const raw = localStorage.getItem('rc_os_reports');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports: Report[]): void {
  try {
    localStorage.setItem('rc_os_reports', JSON.stringify(reports));
  } catch (e) {
    console.warn('Erro ao salvar localReports:', e);
  }
}

function syncReportsToCloud(reports: Report[]): void {
  fetch(CLOUD_SYNC_REPORTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reports),
  }).catch(() => {});
}

function syncUsersToCloud(users: User[]): void {
  fetch(CLOUD_SYNC_USERS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(users),
  }).catch(() => {});
}

/**
 * Busca todos os reports sincronizando LocalStorage, API do Servidor e Cloud KV global.
 */
export async function fetchAllReports(userId?: string, role?: string): Promise<Report[]> {
  const localReports = getLocalReports();
  let serverReports: Report[] = [];
  let cloudReports: Report[] = [];

  // 1. Tenta API do servidor local/serverless
  try {
    const url = `/api/reports${role ? `?role=${encodeURIComponent(role)}&autor_id=${encodeURIComponent(userId || '')}` : ''}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.reports)) {
        serverReports = data.reports;
      }
    }
  } catch (e) {
    // Ignora silenciosamente
  }

  // 2. Tenta Cloud KV global compartilhado
  try {
    const res = await fetch(CLOUD_SYNC_REPORTS_URL);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        cloudReports = data;
      }
    }
  } catch (e) {
    // Ignora silenciosamente
  }

  // 3. Unifica e combina por ID mantendo a versão mais recente
  const map = new Map<string, Report>();

  localReports.forEach((r) => map.set(r.id, r));

  serverReports.forEach((r) => {
    const existing = map.get(r.id);
    if (!existing || new Date(r.updated_at || r.created_at) >= new Date(existing.updated_at || existing.created_at)) {
      map.set(r.id, r);
    }
  });

  cloudReports.forEach((r) => {
    const existing = map.get(r.id);
    if (!existing || new Date(r.updated_at || r.created_at) >= new Date(existing.updated_at || existing.created_at)) {
      map.set(r.id, r);
    }
  });

  let allMerged = Array.from(map.values());

  // Salva lista unificada no localStorage e na Cloud KV
  saveLocalReports(allMerged);
  syncReportsToCloud(allMerged);

  // Se o perfil for 'usuario' (Consultor), filtra para ver os seus próprios reports + os que foram criados no seu ID
  let filtered = allMerged;
  if (role === 'usuario' && userId) {
    filtered = allMerged.filter((r) => r.autor_id === userId);
  }

  // Ordena os mais recentes primeiro
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return filtered;
}

/**
 * Cadastra um novo report no LocalStorage, no Servidor e na Cloud KV global.
 */
export async function saveNewReport(newReport: Report): Promise<void> {
  const current = getLocalReports();
  const map = new Map<string, Report>();
  map.set(newReport.id, newReport);
  current.forEach((r) => map.set(r.id, r));
  const updated = Array.from(map.values());

  saveLocalReports(updated);

  // Tenta enviar para o servidor Express/Vercel
  try {
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReport),
    });
  } catch (e) {}

  // Sincroniza na Cloud KV
  syncReportsToCloud(updated);
}

/**
 * Atualiza o status de um report (Novo, Em Andamento, Aprovado/Feito, Recusado).
 */
export async function updateReportStatusInCloud(reportId: string, status: Report['status']): Promise<Report | null> {
  const current = getLocalReports();
  let updatedReport: Report | null = null;

  current.forEach((r) => {
    if (r.id === reportId) {
      r.status = status;
      r.updated_at = new Date().toISOString();
      updatedReport = { ...r };
    }
  });

  saveLocalReports(current);

  // Tenta enviar para o servidor
  try {
    await fetch(`/api/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (e) {}

  syncReportsToCloud(current);
  return updatedReport;
}

/**
 * Busca todos os usuários sincronizando LocalStorage, Servidor e Cloud KV global.
 */
export async function fetchAllUsers(): Promise<User[]> {
  const localUsers = getStoredUsers();
  let serverUsers: User[] = [];
  let cloudUsers: User[] = [];

  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.users)) serverUsers = data.users;
    }
  } catch (e) {}

  try {
    const res = await fetch(CLOUD_SYNC_USERS_URL);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) cloudUsers = data;
    }
  } catch (e) {}

  const map = new Map<string, User>();
  DEFAULT_USERS.forEach((u) => map.set(u.email.toLowerCase(), u));
  localUsers.forEach((u) => map.set(u.email.toLowerCase(), u));
  serverUsers.forEach((u) => map.set(u.email.toLowerCase(), u));
  cloudUsers.forEach((u) => map.set(u.email.toLowerCase(), u));

  const merged = Array.from(map.values());
  saveStoredUsers(merged);
  syncUsersToCloud(merged);
  return merged;
}

/**
 * Cadastra/Atualiza um usuário na Cloud KV e LocalStorage.
 */
export async function saveNewUser(newUser: User): Promise<void> {
  const current = getStoredUsers();
  const map = new Map<string, User>();
  DEFAULT_USERS.forEach((u) => map.set(u.email.toLowerCase(), u));
  current.forEach((u) => map.set(u.email.toLowerCase(), u));
  map.set(newUser.email.toLowerCase(), newUser);

  const updated = Array.from(map.values());
  saveStoredUsers(updated);

  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
  } catch (e) {}

  syncUsersToCloud(updated);
}

/**
 * Exclui um usuário da Cloud KV e LocalStorage.
 */
export async function deleteUserFromCloud(userId: string): Promise<void> {
  const current = getStoredUsers();
  const updated = current.filter((u) => u.id !== userId);
  saveStoredUsers(updated);

  try {
    await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  } catch (e) {}

  syncUsersToCloud(updated);
}
