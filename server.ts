import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { Report, User } from './src/types';

const app = express();
const PORT = 3000;

// Body parser with 20MB limit for image attachments (Base64)
app.use(express.json({ limit: '20mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface Database {
  users: User[];
  reports: Report[];
}

// Initial seed data
const initialUsers: User[] = [
  {
    id: 'user-adm-1',
    email: 'adm@recargaclub.com.br',
    nome: 'Carlos ADM',
    role: 'adm',
    senha: '123',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-consultor-1',
    email: 'auan@recargaclub.com.br',
    nome: 'Auã Silva',
    role: 'usuario',
    senha: '123',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-consultor-2',
    email: 'mariana@recargaclub.com.br',
    nome: 'Mariana Costa',
    role: 'usuario',
    senha: '123',
    created_at: new Date().toISOString(),
  },
];

const initialReports: Report[] = [
  {
    id: 'rep-1',
    titulo: 'Erro ao calcular comissão no checkout do cliente',
    tipo: 'reclamacao',
    link: 'https://rc-os.internal/negocios/10492',
    prioridade: 'urgente',
    descricao: 'Ao tentar finalizar a negociação de um cliente corporate, o sistema calcula a taxa zerada e impede a emissão do comprovante.',
    autor_id: 'user-consultor-1',
    autor_nome: 'Auã Silva',
    status: 'novo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'rep-2',
    titulo: 'Adicionar filtro por data de validade na listagem de cadastros',
    tipo: 'sugestao',
    link: 'https://rc-os.internal/cadastros',
    prioridade: 'normal',
    descricao: 'Seria muito útil para a equipe de atendimento conseguir filtrar os parceiros ativos que expiram nos próximos 30 dias.',
    autor_id: 'user-consultor-2',
    autor_nome: 'Mariana Costa',
    status: 'em_andamento',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

function readDB(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const db: Database = JSON.parse(data);
      let dirty = false;
      // Ensure all users have default password if missing and sanitize report priorities
      db.users.forEach((u) => {
        if (!u.senha) {
          u.senha = '123';
          dirty = true;
        }
        if (!u.created_at) {
          u.created_at = new Date().toISOString();
          dirty = true;
        }
      });
      db.reports.forEach((r) => {
        if (r.prioridade !== 'urgente' && r.prioridade !== 'normal') {
          r.prioridade = r.prioridade === 'alta' ? 'urgente' : 'normal';
          dirty = true;
        }
      });
      if (dirty) writeDB(db);
      return db;
    }
  } catch (err) {
    console.error('Error reading DB file, reinitializing:', err);
  }
  const defaultDb: Database = {
    users: initialUsers,
    reports: initialReports,
  };
  writeDB(defaultDb);
  return defaultDb;
}

function writeDB(db: Database) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// Ensure DB is seeded
readDB();

// Server-Sent Events (SSE) connections for real-time updates
type SSEClient = express.Response;
let sseClients: SSEClient[] = [];

function broadcastUpdate(type: 'REPORT_CREATED' | 'STATUS_UPDATED', report: Report) {
  const data = JSON.stringify({ type, report, timestamp: new Date().toISOString() });
  sseClients.forEach((client) => {
    client.write(`data: ${data}\n\n`);
  });
}

// --- SSE Endpoint ---
app.get('/api/reports/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);
  sseClients.push(res);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c !== res);
  });
});

// --- Auth Endpoints ---
app.post('/api/auth/login', (req, res) => {
  const { email, password, role, nome } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório.' });
  }

  const db = readDB();
  let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    user = {
      id: `user-${Date.now()}`,
      email: email.trim(),
      nome: nome ? nome.trim() : email.split('@')[0],
      role: role === 'adm' ? 'adm' : 'usuario',
      senha: password ? password.trim() : '123',
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    writeDB(db);
  } else {
    // If password is sent, validate it (if user has a set password)
    if (password && user.senha && user.senha !== password.trim()) {
      return res.status(401).json({ error: 'Senha incorreta para este usuário.' });
    }
    if (role && user.role !== role) {
      user.role = role;
      writeDB(db);
    }
  }

  return res.json({ success: true, user });
});

app.post('/api/auth/register', (req, res) => {
  const { email, nome, role, password } = req.body;
  if (!email || !nome) {
    return res.status(400).json({ error: 'Nome e E-mail são obrigatórios.' });
  }

  const db = readDB();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    email: email.trim(),
    nome: nome.trim(),
    role: role === 'adm' ? 'adm' : 'usuario',
    senha: password ? password.trim() : '123',
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  return res.json({ success: true, user: newUser });
});

// --- User Management Endpoints (Área do Gestor) ---
app.get('/api/users', (req, res) => {
  const db = readDB();
  return res.json({ users: db.users });
});

app.post('/api/users', (req, res) => {
  const { nome, email, senha, role } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ error: 'Nome e E-mail são obrigatórios.' });
  }

  const db = readDB();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Já existe um usuário com este e-mail.' });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    nome: nome.trim(),
    email: email.trim(),
    senha: senha ? senha.trim() : '123',
    role: role === 'adm' ? 'adm' : 'usuario',
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  return res.status(201).json({ success: true, user: newUser });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, role } = req.body;

  const db = readDB();
  const user = db.users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
    const emailOccupied = db.users.some(
      (u) => u.id !== id && u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (emailOccupied) {
      return res.status(400).json({ error: 'E-mail já está em uso por outro usuário.' });
    }
    user.email = email.trim();
  }

  if (nome) user.nome = nome.trim();
  if (role && (role === 'adm' || role === 'usuario')) user.role = role;
  if (senha) user.senha = senha.trim();

  writeDB(db);
  return res.json({ success: true, user });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;

  const db = readDB();
  const userIndex = db.users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Check if trying to delete the only ADM
  const admCount = db.users.filter((u) => u.role === 'adm').length;
  if (db.users[userIndex].role === 'adm' && admCount <= 1) {
    return res.status(400).json({ error: 'Não é possível excluir o único administrador do sistema.' });
  }

  db.users.splice(userIndex, 1);
  writeDB(db);

  return res.json({ success: true, message: 'Usuário excluído com sucesso.' });
});

// --- Reports Endpoints ---
app.get('/api/reports', (req, res) => {
  const db = readDB();
  const { autor_id, role, status, prioridade, tipo } = req.query;

  let filtered = db.reports;

  // Filter by user role if not ADM
  if (role === 'usuario' && autor_id) {
    filtered = filtered.filter((r) => r.autor_id === String(autor_id));
  } else if (autor_id && role !== 'adm') {
    filtered = filtered.filter((r) => r.autor_id === String(autor_id));
  }

  if (status && status !== 'todos') {
    filtered = filtered.filter((r) => r.status === status);
  }
  if (prioridade && prioridade !== 'todas') {
    filtered = filtered.filter((r) => r.prioridade === prioridade);
  }
  if (tipo && tipo !== 'todos') {
    filtered = filtered.filter((r) => r.tipo === tipo);
  }

  // Newest first
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return res.json({ reports: filtered });
});

app.post('/api/reports', (req, res) => {
  const { titulo, tipo, link, prioridade, descricao, print_url, autor_id, autor_nome } = req.body;

  // Validate 5 mandatory fields
  const missing: string[] = [];
  if (!titulo || !titulo.trim()) missing.push('TÍTULO DO REPORT');
  if (!tipo) missing.push('TIPO');
  if (!link || !link.trim()) missing.push('LINK DA CONVERSA OU NEGÓCIO');
  if (!prioridade) missing.push('PRIORIDADE');
  if (!descricao || !descricao.trim()) missing.push('DESCRIÇÃO DO ERRO');

  if (missing.length > 0) {
    return res.status(400).json({
      error: `Campos obrigatórios ausentes: ${missing.join(', ')}.`,
      missingFields: missing,
    });
  }

  const db = readDB();
  const newReport: Report = {
    id: `rep-${Date.now()}`,
    titulo: titulo.trim(),
    tipo,
    link: link.trim(),
    prioridade,
    descricao: descricao.trim(),
    print_url: print_url || undefined,
    autor_id: autor_id || 'anonymous',
    autor_nome: autor_nome || 'Usuário RC OS',
    status: 'novo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.reports.unshift(newReport);
  writeDB(db);

  broadcastUpdate('REPORT_CREATED', newReport);

  return res.status(201).json({ success: true, report: newReport });
});

app.patch('/api/reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['novo', 'em_andamento', 'aprovado', 'recusado'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  const db = readDB();
  const report = db.reports.find((r) => r.id === id);

  if (!report) {
    return res.status(404).json({ error: 'Report não encontrado.' });
  }

  report.status = status;
  report.updated_at = new Date().toISOString();
  writeDB(db);

  broadcastUpdate('STATUS_UPDATED', report);

  return res.json({ success: true, report });
});

// --- Gemini AI Expansion Endpoint ---
app.post('/api/gemini/expand-prompt', async (req, res) => {
  try {
    const { report } = req.body;
    if (!report || !report.titulo || !report.descricao) {
      return res.status(400).json({ error: 'Dados do report incompletos.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Chave GEMINI_API_KEY não configurada no ambiente.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptText = `Você é um Engenheiro de Software Sênior especialista no sistema interno RC OS.
Analise o seguinte report de bug/sugestão enviado por um usuário do RC OS e preencha o template técnico de prompt.

DADOS DO REPORT:
- Título: ${report.titulo}
- Tipo: ${report.tipo}
- Prioridade: ${report.prioridade}
- Autor: ${report.autor_nome}
- Link informado: ${report.link}
- Descrição detalhada: ${report.descricao}

MANTENHA RIGOROSAMENTE A ESTRUTURA DO TEMPLATE ABAIXO.
Substitua os [PREENCHER — ...] com análises técnicas inteligentes e precisas baseadas na descrição do erro.

TEMPLATE EXATO A RETORNAR:

CONTEXTO
Módulo: [Identifique o provável módulo do RC OS, ex: Vendas, Financeiro, Checkout, Cadastros, Atendimento]
Comportamento base do sistema: [Descreva em 1-2 frases como o sistema deveria funcionar normalmente para este caso]
Caso de referência:
Link informado pelo usuário: ${report.link}
Autor do report: ${report.autor_nome}
Tipo: ${report.tipo}  |  Prioridade: ${report.prioridade}

PROBLEMA
${report.descricao}
[Adicione detalhamento técnico provável da causa raiz, ex: erro de estado, exceção em API de integração, arredondamento numérico, token expirado]

COMPORTAMENTO ESPERADO
[Solução principal esperada em detalhes técnicos]
[Solução secundária ou fallback defensivo se houver]

O QUE PRECISA SER INVESTIGADO / CORRIGIDO
1. [Primeiro ponto técnico a investigar/corrigir]
2. [Segundo ponto técnico a investigar/corrigir]
3. [Terceiro ponto técnico a investigar/corrigir]

VALIDAÇÃO
- [Passo de teste manual 1]
- [Passo de teste manual 2]
- [Confirmar que cálculos/indexações dependentes refletem a correção]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptText,
    });

    const expandedText = response.text || '';
    return res.json({ success: true, promptText: expandedText });
  } catch (error: any) {
    console.error('Error expanding prompt with Gemini:', error);
    return res.status(500).json({
      error: 'Falha ao gerar prompt expandido com IA: ' + (error?.message || 'Erro desconhecido'),
    });
  }
});

// --- Vite / Static Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RC OS Reports App rodando na porta ${PORT}`);
  });
}

startServer();
