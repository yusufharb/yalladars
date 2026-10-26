import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_USERS,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_GROUPS,
  INITIAL_MEMBERS,
  INITIAL_PARENT_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_HOMEWORK,
  INITIAL_ASSESSMENTS,
  INITIAL_GRADES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTES,
  INITIAL_NOTIFICATIONS,
  INITIAL_JOIN_REQUESTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_REPORTS,
  INITIAL_PAYMENTS,
  INITIAL_MATERIALS,
  INITIAL_BADGES,
  INITIAL_QUIZZES,
  INITIAL_QUIZ_SUBMISSIONS,
  INITIAL_CERTIFICATES,
  INITIAL_LIVE_SESSIONS,
} from './src/data/mockInitialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DB_DIR, 'cloud_sync_db.json');

interface CloudDatabase {
  users: any[];
  teachers: any[];
  students: any[];
  groups: any[];
  members: any[];
  parentStudents: any[];
  attendance: any[];
  homework: any[];
  assessments: any[];
  grades: any[];
  announcements: any[];
  notes: any[];
  notifications: any[];
  joinRequests: any[];
  auditLogs: any[];
  reports: any[];
  payments: any[];
  materials: any[];
  badges: any[];
  quizzes: any[];
  quizSubmissions: any[];
  certificates: any[];
  liveSessions: any[];
  lastModified: number;
}

function getInitialDatabase(): CloudDatabase {
  return {
    users: [...INITIAL_USERS],
    teachers: [...INITIAL_TEACHERS],
    students: [...INITIAL_STUDENTS],
    groups: [...INITIAL_GROUPS],
    members: [...INITIAL_MEMBERS],
    parentStudents: [...INITIAL_PARENT_STUDENTS],
    attendance: [...INITIAL_ATTENDANCE],
    homework: [...INITIAL_HOMEWORK],
    assessments: [...INITIAL_ASSESSMENTS],
    grades: [...INITIAL_GRADES],
    announcements: [...INITIAL_ANNOUNCEMENTS],
    notes: [...INITIAL_NOTES],
    notifications: [...INITIAL_NOTIFICATIONS],
    joinRequests: [...INITIAL_JOIN_REQUESTS],
    auditLogs: [...INITIAL_AUDIT_LOGS],
    reports: [...INITIAL_REPORTS],
    payments: [...INITIAL_PAYMENTS],
    materials: [...INITIAL_MATERIALS],
    badges: [...INITIAL_BADGES],
    quizzes: [...INITIAL_QUIZZES],
    quizSubmissions: [...INITIAL_QUIZ_SUBMISSIONS],
    certificates: [...INITIAL_CERTIFICATES],
    liveSessions: [...INITIAL_LIVE_SESSIONS],
    lastModified: Date.now(),
  };
}

function sanitizeCollection(arr: any[], idField: string = 'id'): any[] {
  if (!Array.isArray(arr)) return [];
  const flattened = arr.flat(Infinity);
  const result: any[] = [];
  const seen = new Set<string>();

  for (const item of flattened) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const itemId = String(item[idField] || item.id || '');
    if (itemId) {
      if (seen.has(itemId)) {
        const existingIdx = result.findIndex(
          (x) => String(x[idField] || x.id) === itemId
        );
        if (existingIdx >= 0) {
          result[existingIdx] = { ...result[existingIdx], ...item };
        }
        continue;
      }
      seen.add(itemId);
    }
    result.push(item);
  }
  return result;
}

function sanitizeDatabase(database: CloudDatabase): CloudDatabase {
  database.users = sanitizeCollection(database.users, 'id');
  database.teachers = sanitizeCollection(database.teachers, 'teacherId');
  database.students = sanitizeCollection(database.students, 'studentId');
  database.groups = sanitizeCollection(database.groups, 'groupId');
  database.members = sanitizeCollection(database.members, 'studentId');
  database.parentStudents = sanitizeCollection(database.parentStudents, 'studentId');
  database.attendance = sanitizeCollection(database.attendance, 'attendanceId');
  database.homework = sanitizeCollection(database.homework, 'homeworkId');
  database.assessments = sanitizeCollection(database.assessments, 'assessmentId');
  database.grades = sanitizeCollection(database.grades, 'gradeId');
  database.announcements = sanitizeCollection(database.announcements, 'announcementId');
  database.notes = sanitizeCollection(database.notes, 'noteId');
  database.notifications = sanitizeCollection(database.notifications, 'notificationId');
  database.joinRequests = sanitizeCollection(database.joinRequests, 'requestId');
  database.auditLogs = sanitizeCollection(database.auditLogs, 'id');
  database.reports = sanitizeCollection(database.reports, 'id');
  database.payments = sanitizeCollection(database.payments, 'paymentId');
  database.materials = sanitizeCollection(database.materials, 'materialId');
  database.badges = sanitizeCollection(database.badges, 'badgeId');
  database.quizzes = sanitizeCollection(database.quizzes, 'quizId');
  database.quizSubmissions = sanitizeCollection(database.quizSubmissions, 'submissionId');
  database.certificates = sanitizeCollection(database.certificates, 'certificateId');
  database.liveSessions = sanitizeCollection(database.liveSessions, 'sessionId');
  return database;
}

function loadDatabase(): CloudDatabase {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.groups)) {
        return sanitizeDatabase(parsed);
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Warning loading database file, falling back to seed:', err);
  }
  const initial = sanitizeDatabase(getInitialDatabase());
  saveDatabase(initial);
  return initial;
}

function saveDatabase(dbToSave: CloudDatabase): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    sanitizeDatabase(dbToSave);
    dbToSave.lastModified = Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(dbToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CloudSync] Error saving database file:', err);
  }
}

// In-memory active database reference
let db: CloudDatabase = loadDatabase();

async function startServer() {
  const app = express();

  // CORS and body parser
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Id');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '15mb' }));

  // --- API Endpoints ---
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'YallaDars V2 Cloud Sync Engine',
      serverTime: new Date().toISOString(),
      timestamp: Date.now(),
      lastModified: db.lastModified,
      billing: 'ZERO_BILLING_FREE_TIER_COMPLIANT',
    });
  });

  // --- Gemini AI Assistant Chat Endpoint ---
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const {
        messages,
        systemInstruction,
        model = 'gemini-3.8-flash',
        role = 'student',
      } = req.body || {};

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid messages array',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured on the server',
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

      // Default role-specific educational system instructions
      const defaultInstruction =
        role === 'teacher'
          ? 'أنت "مساعد المعلم الذكي" في تطبيق يلا درس في مصر. ساعد المدرس في صياغة أسئلة امتحانات، ملخصات سريعة، أفكار لتشجيع الطلاب، وإعداد خطط حصص تفاعلية بأسلوب تربوي محفز ومحترف وبلهجة مصرية عربية فصيحة وواضحة.'
          : role === 'parent'
          ? 'أنت "المستشار التربوي لولي الأمر" في منصة يلا درس. تساعد أولياء الأمور في فهم مستوى أبنائهم الدراسي، كيفية تحفيزهم على المذاكرة، وتنظيم وقت المذاكرة اليومي بأسلوب تربوي لطيف ومطمئن.'
          : 'أنت "المعلم الذكي ورفيق المذاكرة" للطلاب في مصر عبر منصة يلا درس. ساعد الطالب في شرح الدروس، تبسيط القوانين والمسائل، حل الأسئلة الصعبة خطوة بخطوة، وتقديم نصائح للمذاكرة بأسلوب مشجع وممتع وبسيط.';

      // Format messages into contents format for @google/genai
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // Fallback model sequence to guarantee 100% free uptime during 503 spikes
      const candidateModels = Array.from(
        new Set([
          model || 'gemini-3.8-flash',
          'gemini-3.8-flash',
          'gemini-3.1-flash-lite',
          'gemini-3.5-flash',
          'gemini-flash-latest',
        ])
      );

      let lastError: any = null;
      let replyText = '';
      let successfulModel = '';

      for (const targetModel of candidateModels) {
        try {
          console.log(`[Gemini API] Attempting generateContent with model: ${targetModel}`);
          const response = await ai.models.generateContent({
            model: targetModel,
            contents,
            config: {
              systemInstruction: systemInstruction || defaultInstruction,
              temperature: 0.7,
            },
          });

          if (response && response.text) {
            replyText = response.text;
            successfulModel = targetModel;
            break;
          }
        } catch (callErr: any) {
          lastError = callErr;
          console.warn(`[Gemini API] Model ${targetModel} encountered error:`, callErr?.message || callErr);
          
          // Small pause before trying the next fallback model (150ms)
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      if (replyText) {
        return res.json({
          success: true,
          reply: replyText,
          model: successfulModel,
        });
      }

      // If all candidate models had temporary 503 or overload, return a helpful, friendly message
      const isOverloaded =
        lastError?.status === 'UNAVAILABLE' ||
        lastError?.code === 503 ||
        JSON.stringify(lastError || {}).includes('503') ||
        JSON.stringify(lastError || {}).includes('high demand');

      if (isOverloaded) {
        return res.json({
          success: true,
          reply:
            '⚠️ عذراً، سيرفرات الذكاء الاصطناعي تشهد ضغطاً مؤقتاً كبيراً جداً في هذه اللحظة (High Demand 503). تم تفعيل التحويل التلقائي بين النماذج المجانية، يرجى إعادة إرسال رسالتك الآن أو بعد ثوانٍ قليلة وسيعمل معك مباشرة بإذن الله!',
          model: 'fallback-notice',
        });
      }

      throw lastError || new Error('All candidate models failed');
    } catch (err: any) {
      console.error('[Gemini API] Final Error in chat endpoint:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to generate response from Gemini',
      });
    }
  });

  // Pull current state or delta
  app.get('/api/sync/state', (req, res) => {
    const since = parseInt((req.query.since as string) || '0', 10);
    res.json({
      success: true,
      serverTimestamp: Date.now(),
      lastModified: db.lastModified,
      hasUpdates: since === 0 || db.lastModified > since,
      state: db,
    });
  });

  // Push updates from Teacher / Student / Parent / Admin device
  app.post('/api/sync/push', (req, res) => {
    try {
      const { clientId, clientTimestamp, entities, changes } = req.body || {};
      let appliedCount = 0;

      // Handle batch entity format
      if (entities && typeof entities === 'object') {
        const mergeCollection = (key: keyof CloudDatabase, idField: string) => {
          const incoming = entities[key];
          if (Array.isArray(incoming) && Array.isArray(db[key])) {
            const list = db[key] as any[];
            for (const item of incoming) {
              const itemId = item[idField] || item.id;
              if (!itemId) continue;
              const idx = list.findIndex((x) => (x[idField] || x.id) === itemId);
              if (idx >= 0) {
                list[idx] = { ...list[idx], ...item };
              } else {
                list.push(item);
              }
              appliedCount++;
            }
          }
        };

        mergeCollection('groups', 'groupId');
        mergeCollection('attendance', 'attendanceId');
        mergeCollection('homework', 'homeworkId');
        mergeCollection('assessments', 'assessmentId');
        mergeCollection('grades', 'gradeId');
        mergeCollection('members', 'groupId'); // handled below with composite
        mergeCollection('announcements', 'announcementId');
        mergeCollection('notes', 'noteId');
        mergeCollection('notifications', 'notificationId');
        mergeCollection('joinRequests', 'requestId');
        mergeCollection('parentStudents', 'studentId');
        mergeCollection('reports', 'id');
        mergeCollection('users', 'id');
        mergeCollection('payments', 'paymentId');
        mergeCollection('materials', 'materialId');
        mergeCollection('badges', 'badgeId');
        mergeCollection('quizzes', 'quizId');
        mergeCollection('quizSubmissions', 'submissionId');
        mergeCollection('certificates', 'certificateId');
        mergeCollection('liveSessions', 'sessionId');

        // Specific composite check for group members
        if (Array.isArray(entities.members)) {
          for (const m of entities.members) {
            const idx = db.members.findIndex(
              (x) => x.groupId === m.groupId && x.studentId === m.studentId
            );
            if (idx >= 0) {
              db.members[idx] = { ...db.members[idx], ...m };
            } else {
              db.members.push(m);
            }
          }
        }
      }

      // Handle atomic change list format
      if (Array.isArray(changes)) {
        for (const change of changes) {
          const { entityType, action, id, data } = change;
          const targetKey = entityType as keyof CloudDatabase;
          if (Array.isArray(db[targetKey])) {
            const list = db[targetKey] as any[];
            if (action === 'delete') {
              const idx = list.findIndex((x) => (x.id || x[`${entityType}Id`]) === id);
              if (idx >= 0) {
                list.splice(idx, 1);
                appliedCount++;
              }
            } else {
              // upsert: data can be an object or an array of objects
              const itemsToUpsert = Array.isArray(data) ? data.flat(Infinity) : [data];
              for (const item of itemsToUpsert) {
                if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
                const itemId = item.id || item[`${entityType}Id`] || id;
                if (!itemId) continue;
                const idx = list.findIndex((x) => (x.id || x[`${entityType}Id`]) === itemId);
                if (idx >= 0) {
                  list[idx] = { ...list[idx], ...item };
                } else {
                  list.push(item);
                }
                appliedCount++;
              }
            }
          }
        }
      }

      saveDatabase(db);

      res.json({
        success: true,
        serverTimestamp: Date.now(),
        appliedCount,
        lastModified: db.lastModified,
        state: db,
      });
    } catch (err: any) {
      console.error('[CloudSync] Error in push:', err);
      res.status(500).json({ success: false, error: err?.message || 'Sync error' });
    }
  });

  // Reset database back to clean initial demo state
  app.post('/api/sync/reset', (req, res) => {
    db = getInitialDatabase();
    saveDatabase(db);
    res.json({
      success: true,
      serverTimestamp: Date.now(),
      message: 'Cloud database reset to seed data',
      state: db,
    });
  });

  // Dev server with Vite middlewares OR Production static files
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[YallaDars] Server listening on http://0.0.0.0:${PORT} (Zero Billing Mode)`);
  });
}

startServer().catch((err) => {
  console.error('[YallaDars] Failed to start server:', err);
  process.exit(1);
});
