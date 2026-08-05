import { Report, User } from '../types';
import { DEFAULT_USERS, getStoredUsers, saveStoredUsers, getDeletedUserIds, markUserAsDeleted } from '../data/initialUsers';

const CLOUD_SYNC_REPORTS_URL = 'https://jsonblob.com/api/jsonBlob/019fd29e-cc5a-7b43-ad5e-2babe8c8ceda';
const CLOUD_SYNC_USERS_URL = 'https://jsonblob.com/api/jsonBlob/019fd29e-f7f3-70f1-a891-2d2b69169cc5';

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

async function syncReportsToCloud(reports: Report[]): Promise<void> {
  try {
    await fetch(CLOUD_SYNC_REPORTS_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reports),
    });
  } catch (e) {
    console.warn('Erro na sincronização de reports com cloud:', e);
  }
}

async function syncUsersToCloud(users: User[]): Promise<void> {
  try {
    await fetch(CLOUD_SYNC_USERS_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users),
    });
  } catch (e) {
    console.warn('Erro na sincronização de usuários com cloud:', e);
  }
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
  } catch (e) {}

  // 2. Tenta Cloud JSONBlob compartilhado
  try {
    const res = await fetch(CLOUD_SYNC_REPORTS_URL);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        cloudReports = data;
      }
    }
  } catch (e) {}

  // 3. Unifica e combina por ID
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

  // Se o perfil for 'usuario' (Consultor), filtra para ver os seus próprios reports
  let filtered = allMerged;
  if (role === 'usuario' && userId) {
    filtered = allMerged.filter((r) => r.autor_id === userId || (userId.includes('jessica') && r.autor_nome === 'Jessica') || (userId.includes('johnatha') && r.autor_nome === 'Johnatha Francis'));
  }

  // Ordena os mais recentes primeiro
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return filtered;
}

/**
 * Cadastra um novo report no LocalStorage, no Servidor e na Cloud KV global.
 */
export async function saveNewReport(newReport: Report): Promise<void> {
  // Primeiro busca a versão atual da Nuvem para garantir que não perde reports de outros usuários
  let cloudReports: Report[] = [];
  try {
    const res = await fetch(CLOUD_SYNC_REPORTS_URL);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) cloudReports = data;
    }
  } catch (e) {}

  const localReports = getLocalReports();
  const map = new Map<string, Report>();

  cloudReports.forEach((r) => map.set(r.id, r));
  localReports.forEach((r) => map.set(r.id, r));
  map.set(newReport.id, newReport);

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

  // Sincroniza na Cloud
  await syncReportsToCloud(updated);
}

/**
 * Atualiza o status de um report (Novo, Em Andamento, Aprovado/Feito, Recusado).
 */
export async function updateReportStatusInCloud(reportId: string, status: Report['status']): Promise<Report | null> {
  let cloudReports: Report[] = [];
  try {
    const res = await fetch(CLOUD_SYNC_REPORTS_URL);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) cloudReports = data;
    }
  } catch (e) {}

  const localReports = getLocalReports();
  const map = new Map<string, Report>();

  cloudReports.forEach((r) => map.set(r.id, r));
  localReports.forEach((r) => map.set(r.id, r));

  let updatedReport: Report | null = null;
  const target = map.get(reportId);
  if (target) {
    target.status = status;
    target.updated_at = new Date().toISOString();
    updatedReport = { ...target };
  }

  const updatedList = Array.from(map.values());
  saveLocalReports(updatedList);

  // Tenta enviar para o servidor
  try {
    await fetch(`/api/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (e) {}

  await syncReportsToCloud(updatedList);
  return updatedReport;
}

/**
 * Busca todos os usuários sincronizando LocalStorage, Servidor e Cloud KV global.
 */
export async function fetchAllUsers(): Promise<User[]> {
  const localUsers = getStoredUsers();
  const deletedIds = getDeletedUserIds();
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
  DEFAULT_USERS.forEach((u) => {
    if (!deletedIds.includes(u.id) && !deletedIds.includes(u.email.toLowerCase())) {
      map.set(u.email.toLowerCase(), u);
    }
  });
  localUsers.forEach((u) => {
    if (!deletedIds.includes(u.id) && !deletedIds.includes(u.email.toLowerCase())) {
      map.set(u.email.toLowerCase(), u);
    }
  });
  serverUsers.forEach((u) => {
    if (!deletedIds.includes(u.id) && !deletedIds.includes(u.email.toLowerCase())) {
      map.set(u.email.toLowerCase(), u);
    }
  });
  cloudUsers.forEach((u) => {
    if (!deletedIds.includes(u.id) && !deletedIds.includes(u.email.toLowerCase())) {
      map.set(u.email.toLowerCase(), u);
    }
  });

  const merged = Array.from(map.values());
  saveStoredUsers(merged);
  await syncUsersToCloud(merged);
  return merged;
}

/**
 * Cadastra/Atualiza um usuário na Cloud KV e LocalStorage.
 */
export async function saveNewUser(newUser: User): Promise<void> {
  const current = getStoredUsers();
  const map = new Map<string, User>();
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

  await syncUsersToCloud(updated);
}

/**
 * Exclui um usuário da Cloud KV e LocalStorage.
 */
export async function deleteUserFromCloud(userId: string): Promise<void> {
  const current = getStoredUsers();
  const targetUser = current.find((u) => u.id === userId);

  markUserAsDeleted(userId, targetUser?.email);

  const updated = current.filter(
    (u) => u.id !== userId && u.email.toLowerCase() !== targetUser?.email.toLowerCase()
  );
  saveStoredUsers(updated);

  try {
    await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  } catch (e) {}

  await syncUsersToCloud(updated);
}
