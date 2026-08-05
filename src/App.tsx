import React, { useState, useEffect, useCallback } from 'react';
import { User, Report, ReportStatus, UserRole } from './types';
import { getStoredUsers } from './data/initialUsers';
import { fetchAllReports, saveNewReport, updateReportStatusInCloud, fetchAllUsers } from './lib/cloudSync';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { UserView } from './components/UserView';
import { AdminView } from './components/AdminView';
import { UserManagerView } from './components/UserManagerView';
import { PromptModal } from './components/PromptModal';
import { ImageModal } from './components/ImageModal';
import { Bell } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('rc_os_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeAdmTab, setActiveAdmTab] = useState<'reports' | 'users'>('reports');
  const [reports, setReports] = useState<Report[]>(() => {
    try {
      const raw = localStorage.getItem('rc_os_reports');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [loadingReports, setLoadingReports] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync reports to localStorage
  useEffect(() => {
    if (reports.length > 0) {
      try {
        localStorage.setItem('rc_os_reports', JSON.stringify(reports));
      } catch (e) {
        console.warn('Erro ao salvar reports no localStorage:', e);
      }
    }
  }, [reports]);

  // Modals state
  const [promptReport, setPromptReport] = useState<Report | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Helper toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Fetch reports from Cloud Sync + API
  const fetchReports = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingReports(true);
      const data = await fetchAllReports(user.id, user.role);
      setReports((prev) => {
        if (user.role === 'adm' && prev.length > 0 && data.length > prev.length) {
          const newest = data[0];
          if (!prev.some((p) => p.id === newest.id)) {
            showToast(`Novo report recebido de ${newest.autor_nome}: "${newest.titulo}"`);
          }
        }
        return data;
      });
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [user, showToast]);

  // Initial fetch and polling fallback
  useEffect(() => {
    if (user) {
      fetchReports();
      // Poll every 3 seconds for updates
      const interval = setInterval(fetchReports, 3000);
      return () => clearInterval(interval);
    }
  }, [user, fetchReports]);

  // Server-Sent Events (SSE) for instant Realtime updates
  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource('/api/reports/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'STATUS_UPDATED' && data.report) {
          const updated: Report = data.report;
          setReports((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
          if (user.role === 'usuario' && updated.autor_id === user.id) {
            showToast(`Status do seu report "${updated.titulo}" atualizado para: ${updated.status.toUpperCase()}`);
          } else if (user.role === 'adm') {
            showToast(`Status do report de ${updated.autor_nome} alterado para: ${updated.status.toUpperCase()}`);
          }
        } else if (data.type === 'REPORT_CREATED' && data.report) {
          const newRep: Report = data.report;
          setReports((prev) => {
            if (prev.some((r) => r.id === newRep.id)) return prev;
            return [newRep, ...prev];
          });
          if (user.role === 'adm') {
            showToast(`Novo report recebido de ${newRep.autor_nome}: "${newRep.titulo}"`);
          }
        }
      } catch (e) {
        console.error('Error handling SSE message:', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [user, showToast]);

  // Handle Login
  const handleLogin = async (
    email: string,
    role: UserRole,
    nome?: string,
    password?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, nome, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('rc_os_user', JSON.stringify(data.user));
        return true;
      }
    } catch (err) {
      console.error('Login API error, using client fallback:', err);
    }

    // Client-side fallback if server API is unreachable or on static host (e.g. Vercel)
    const cleanEmail = email.trim();
    const storedUsers = getStoredUsers();
    const existingUser = storedUsers.find((u) => u.email.toLowerCase() === cleanEmail.toLowerCase());

    const isWilson = cleanEmail.toLowerCase() === 'wilson@recargaclub.com.br';
    const fallbackUser: User = existingUser || {
      id: isWilson ? 'user-adm-wilson' : `user-${Date.now()}`,
      email: cleanEmail,
      nome: nome ? nome.trim() : (isWilson ? 'Wilson' : cleanEmail.split('@')[0]),
      role: isWilson ? 'adm' : role,
      senha: password ? password.trim() : 'rcos1234@@',
      created_at: new Date().toISOString(),
    };
    setUser(fallbackUser);
    localStorage.setItem('rc_os_user', JSON.stringify(fallbackUser));
    return true;
  };

  // Handle Logout
  const handleLogout = () => {
    setUser(null);
    setReports([]);
    localStorage.removeItem('rc_os_user');
  };

  // Quick Switch User
  const handleSwitchUser = async (targetEmail: string, targetRole: UserRole) => {
    await handleLogin(targetEmail, targetRole);
  };

  // Submit new report (Consultor)
  const handleSubmitReport = async (
    newReportData: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status'>
  ): Promise<boolean> => {
    const newReport: Report = {
      id: `rep-${Date.now()}`,
      ...newReportData,
      status: 'novo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setReports((prev) => [newReport, ...prev]);
    await saveNewReport(newReport);
    return true;
  };

  // Update report status (ADM)
  const handleUpdateStatus = async (id: string, newStatus: ReportStatus): Promise<boolean> => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus, updated_at: new Date().toISOString() } : r))
    );
    await updateReportStatusInCloud(id, newStatus);
    return true;
  };

  // Expand prompt with Gemini AI API
  const handleExpandWithAI = async (report: Report): Promise<string> => {
    const res = await fetch('/api/gemini/expand-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.promptText;
    } else {
      const errData = await res.json();
      throw new Error(errData.error || 'Falha ao conectar com Gemini AI');
    }
  };

  return (
    <div className="min-h-screen bg-ice font-sans text-brand-dark antialiased selection:bg-[#FFC226] selection:text-[#1C1C1C]">
      {/* Navbar */}
      <Navbar
        user={user}
        activeAdmTab={activeAdmTab}
        onSelectAdmTab={setActiveAdmTab}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
      />

      {/* Floating Realtime Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <Bell className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main View Router */}
      <main className="pb-16">
        {!user ? (
          <LoginView onLogin={handleLogin} />
        ) : user.role === 'adm' ? (
          activeAdmTab === 'users' ? (
            <UserManagerView currentUser={user} />
          ) : (
            <AdminView
              user={user}
              reports={reports}
              onUpdateStatus={handleUpdateStatus}
              onRefresh={fetchReports}
              onOpenPromptModal={(r) => setPromptReport(r)}
              onOpenImageModal={(url) => setModalImage(url)}
            />
          )
        ) : (
          <UserView
            user={user}
            reports={reports}
            onSubmitReport={handleSubmitReport}
            onRefresh={fetchReports}
            onOpenImageModal={(url) => setModalImage(url)}
          />
        )}
      </main>

      {/* Modals */}
      <PromptModal
        report={promptReport}
        onClose={() => setPromptReport(null)}
        onExpandWithAI={handleExpandWithAI}
      />

      <ImageModal
        imageUrl={modalImage}
        onClose={() => setModalImage(null)}
      />
    </div>
  );
}
