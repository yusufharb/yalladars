import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
  INITIAL_HOMEWORK_SUBMISSIONS,
  INITIAL_ASSISTANT_PERMISSIONS,
} from './src/data/mockInitialData.ts';

const PORT = Number(process.env.PORT) || 3000;
const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'yalladars_cloud_db.json');
const DB_TMP_PATH = path.resolve(process.cwd(), 'data', 'yalladars_cloud_db.json.tmp');
const DB_BAK_PATH = path.resolve(process.cwd(), 'data', 'yalladars_cloud_db.json.bak');
const LOCAL_DEV_SECRET_FILE = path.resolve(process.cwd(), '.local_jwt_secret');

const dataDir = path.dirname(DB_FILE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ============================================================================
// 1. Strict JWT Secret Initialization (No Hardcoded Fallback Secret)
// ============================================================================

function loadOrInitJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret) {
    if (envSecret.length >= 32) {
      return envSecret;
    }
    return crypto.createHash('sha256').update(envSecret).digest('hex');
  }

  try {
    if (fs.existsSync(LOCAL_DEV_SECRET_FILE)) {
      const existing = fs.readFileSync(LOCAL_DEV_SECRET_FILE, 'utf-8').trim();
      if (existing.length >= 64) {
        return existing;
      }
    }
    const generated = crypto.randomBytes(64).toString('hex');
    fs.writeFileSync(LOCAL_DEV_SECRET_FILE, generated, { encoding: 'utf-8', mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(64).toString('hex');
  }
}

const JWT_SECRET = loadOrInitJwtSecret();

// ============================================================================
// 2. Password Hashing (scrypt + timingSafeEqual) & JWT Verification
// ============================================================================

export function hashPassword(password: string, salt?: string): string {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, useSalt, 64).toString('hex');
  return `scrypt$${useSalt}$${derived}`;
}

export function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!password || typeof password !== 'string' || !storedHash) return false;
  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const [, salt, originalHash] = parts;
    const candidateHash = crypto.scryptSync(password, salt, 64).toString('hex');
    try {
      const origBuf = Buffer.from(originalHash, 'hex');
      const candBuf = Buffer.from(candidateHash, 'hex');
      if (origBuf.length !== candBuf.length) return false;
      return crypto.timingSafeEqual(origBuf, candBuf);
    } catch {
      return false;
    }
  }
  if (storedHash.startsWith('sha256$')) {
    const originalHex = storedHash.slice('sha256$'.length);
    const candidateHex = sha256Hex(`yalladars_salt_2026:${password}`);
    try {
      const origBuf = Buffer.from(originalHex, 'utf-8');
      const candBuf = Buffer.from(candidateHex, 'utf-8');
      return origBuf.length === candBuf.length && crypto.timingSafeEqual(origBuf, candBuf);
    } catch {
      return false;
    }
  }
  return false;
}

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser extends AuthTokenPayload {
  name: string;
  status: string;
}

export function signAuthToken(user: { id: string; email: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthTokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payloadB64}`)
    .digest('base64url');
  return `${header}.${payloadB64}.${signature}`;
}

export function verifyAuthToken(token?: string): AuthTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const clean = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  const parts = clean.split('.');
  if (parts.length !== 3) return null;
  const [header, payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payloadB64}`)
    .digest('base64url');
  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as AuthTokenPayload;
    if (!payload || !payload.id || !payload.role || !payload.exp) {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// ============================================================================
// 3. Database Schema, Composite Keys & Atomic Persistence Layer
// ============================================================================

export interface TombstoneEntry {
  id: string;
  entityType: string;
  deletedAt: number;
  deletedBy?: string;
}

interface CloudDatabase {
  lastUpdated: number;
  users: any[];
  teacherProfiles: any[];
  studentProfiles: any[];
  groups: any[];
  members: any[];
  parentStudents: any[];
  attendance: any[];
  homework: any[];
  assessments: any[];
  grades: any[];
  announcements: any[];
  notes: any[];
  joinRequests: any[];
  notifications: any[];
  auditLogs: any[];
  reports: any[];
  payments: any[];
  materials: any[];
  badges: any[];
  quizzes: any[];
  quizSubmissions: any[];
  certificates: any[];
  liveSessions: any[];
  homeworkSubmissions: any[];
  assistantPermissions: any[];
  tombstones: TombstoneEntry[];
  syncLog: Array<{
    syncId: string;
    clientId: string;
    timestamp: number;
    changesCount: number;
  }>;
}

function buildSeededDefaultDb(): CloudDatabase {
  return {
    lastUpdated: Date.now(),
    users: INITIAL_USERS.map((u) => ({
      ...u,
      passwordHash: hashPassword('123456'),
    })),
    teacherProfiles: [...INITIAL_TEACHERS],
    studentProfiles: [...INITIAL_STUDENTS],
    groups: [...INITIAL_GROUPS],
    members: [...INITIAL_MEMBERS],
    parentStudents: [...INITIAL_PARENT_STUDENTS],
    attendance: [...INITIAL_ATTENDANCE],
    homework: [...INITIAL_HOMEWORK],
    assessments: [...INITIAL_ASSESSMENTS],
    grades: [...INITIAL_GRADES],
    announcements: [...INITIAL_ANNOUNCEMENTS],
    notes: [...INITIAL_NOTES],
    joinRequests: [...INITIAL_JOIN_REQUESTS],
    notifications: [...INITIAL_NOTIFICATIONS],
    auditLogs: [...INITIAL_AUDIT_LOGS],
    reports: [...INITIAL_REPORTS],
    payments: [...INITIAL_PAYMENTS],
    materials: [...INITIAL_MATERIALS],
    badges: [...INITIAL_BADGES],
    quizzes: [...INITIAL_QUIZZES],
    quizSubmissions: [...INITIAL_QUIZ_SUBMISSIONS],
    certificates: [...INITIAL_CERTIFICATES],
    liveSessions: [...INITIAL_LIVE_SESSIONS],
    homeworkSubmissions: [...INITIAL_HOMEWORK_SUBMISSIONS],
    assistantPermissions: [...INITIAL_ASSISTANT_PERMISSIONS],
    tombstones: [],
    syncLog: [],
  };
}

export function getEntityKey(collectionName: string, item: any): string {
  if (!item || typeof item !== 'object') return '';
  switch (collectionName) {
    case 'members':
      return item.groupId && item.studentId ? `${item.groupId}_${item.studentId}` : String(item.id || '');
    case 'parentStudents':
      return item.parentId && item.studentId ? `${item.parentId}_${item.studentId}` : String(item.id || '');
    case 'users':
    case 'auditLogs':
    case 'reports':
      return String(item.id || '');
    case 'teacherProfiles':
      return String(item.teacherId || '');
    case 'studentProfiles':
      return String(item.studentId || '');
    case 'groups':
      return String(item.groupId || '');
    case 'attendance':
      return String(item.attendanceId || `${item.groupId}_${item.date}_${item.studentId}`);
    case 'homework':
      return String(item.homeworkId || '');
    case 'assessments':
      return String(item.assessmentId || '');
    case 'grades':
      return String(item.gradeId || '');
    case 'announcements':
      return String(item.announcementId || '');
    case 'notes':
      return String(item.noteId || '');
    case 'joinRequests':
      return String(item.requestId || '');
    case 'notifications':
      return String(item.notificationId || '');
    case 'payments':
      return String(item.paymentId || '');
    case 'materials':
      return String(item.materialId || '');
    case 'badges':
      return String(item.badgeId || '');
    case 'quizzes':
      return String(item.quizId || '');
    case 'quizSubmissions':
      return String(item.submissionId || '');
    case 'certificates':
      return String(item.certificateId || '');
    case 'liveSessions':
      return String(item.sessionId || '');
    case 'homeworkSubmissions':
      return String(item.submissionId || (item.homeworkId && item.studentId ? `hw_sub_${item.homeworkId}_${item.studentId}` : ''));
    case 'assistantPermissions':
      return String(item.assistantId || '');
    default:
      return String(item.id || '');
  }
}

const ALL_COLLECTIONS = [
  'users',
  'teacherProfiles',
  'studentProfiles',
  'groups',
  'members',
  'parentStudents',
  'attendance',
  'homework',
  'assessments',
  'grades',
  'announcements',
  'notes',
  'joinRequests',
  'notifications',
  'auditLogs',
  'reports',
  'payments',
  'materials',
  'badges',
  'quizzes',
  'quizSubmissions',
  'certificates',
  'liveSessions',
  'homeworkSubmissions',
  'assistantPermissions',
] as const;

let database: CloudDatabase = buildSeededDefaultDb();
let isWritingDb = false;
let pendingWrite = false;

function saveDatabase() {
  if (isWritingDb) {
    pendingWrite = true;
    return;
  }
  isWritingDb = true;
  try {
    database.lastUpdated = Date.now();
    const serialized = JSON.stringify(database, null, 2);

    const fd = fs.openSync(DB_TMP_PATH, 'w', 0o600);
    try {
      fs.writeFileSync(fd, serialized, 'utf-8');
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }

    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        fs.copyFileSync(DB_FILE_PATH, DB_BAK_PATH);
      } catch {
        // ignore backup copy warning
      }
    }

    fs.renameSync(DB_TMP_PATH, DB_FILE_PATH);
  } catch (err) {
    console.error('Failed to save cloud database atomically:', err);
  } finally {
    isWritingDb = false;
    if (pendingWrite) {
      pendingWrite = false;
      saveDatabase();
    }
  }
}

function sanitizeCollectionByCompositeKey(list: any[], collectionName: string): any[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  return list.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    const key = getEntityKey(collectionName, item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateServerUniqueLinkingCode(): string {
  const usedCodes = new Set(
    (database.studentProfiles || [])
      .map((p: any) => String(p?.linkingCode || '').trim().toUpperCase())
      .filter(Boolean)
  );
  INITIAL_STUDENTS.forEach((s) => usedCodes.add(s.linkingCode.toUpperCase()));

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 200; attempt++) {
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const candidate = `YD-LK-${randomPart}`;
    if (!usedCodes.has(candidate)) {
      return candidate;
    }
  }
  return `YD-LK-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function ensureStudentProfilesIntegrity(): boolean {
  let changed = false;

  if (!Array.isArray(database.studentProfiles)) {
    database.studentProfiles = [...INITIAL_STUDENTS];
    changed = true;
  }
  if (!Array.isArray(database.parentStudents)) {
    database.parentStudents = [...INITIAL_PARENT_STUDENTS];
    changed = true;
  }

  const seenCodes = new Set<string>();
  for (const sp of database.studentProfiles) {
    if (sp.studentId === 'user_student_1') {
      if (sp.linkingCode !== 'YD-LK-1001') {
        sp.linkingCode = 'YD-LK-1001';
        changed = true;
      }
      seenCodes.add('YD-LK-1001');
    }
  }

  for (const sp of database.studentProfiles) {
    if (sp.studentId === 'user_student_1') continue;
    const code = String(sp.linkingCode || '').trim().toUpperCase();
    if (!code || code === 'YD-LK-1001' || seenCodes.has(code)) {
      sp.linkingCode = generateServerUniqueLinkingCode();
      changed = true;
    }
    seenCodes.add(String(sp.linkingCode).toUpperCase());
  }

  for (const u of database.users) {
    if (u && u.role === 'student' && !database.studentProfiles.some((sp) => sp.studentId === u.id)) {
      const newCode = u.id === 'user_student_1' ? 'YD-LK-1001' : generateServerUniqueLinkingCode();
      seenCodes.add(newCode);
      database.studentProfiles.push({
        studentId: u.id,
        grade: 'الصف الأول الثانوي',
        school: 'مدرسة حكومية',
        linkingCode: newCode,
      });
      changed = true;
    }
    if (u && u.role === 'assistant' && !database.assistantPermissions.some((ap) => ap.assistantId === u.id)) {
      database.assistantPermissions.push({
        assistantId: u.id,
        teacherId: 'user_teacher_1',
        canRecordAttendance: true,
        canSearchStudents: true,
        canManagePayments: false,
        canManageJoinRequests: false,
        canManageHomework: false,
        updatedAt: new Date().toISOString().split('T')[0],
      });
      changed = true;
    }
  }

  return changed;
}

function loadDatabase() {
  const tryParseFile = (filePath: string): any | null => {
    if (!fs.existsSync(filePath)) return null;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error(`Corrupted DB file detected at ${filePath}:`, e);
      return null;
    }
  };

  let parsed = tryParseFile(DB_FILE_PATH);
  let recoveredFromBackup = false;

  if (!parsed && fs.existsSync(DB_BAK_PATH)) {
    parsed = tryParseFile(DB_BAK_PATH);
    if (parsed) {
      recoveredFromBackup = true;
      console.warn('Successfully recovered database from .bak backup.');
    }
  }

  if (parsed && typeof parsed === 'object') {
    const defaultSeed = buildSeededDefaultDb();
    database = { ...defaultSeed, ...parsed };

    if (!Array.isArray(database.users) || database.users.length === 0) {
      database = {
        ...defaultSeed,
        tombstones: Array.isArray(parsed.tombstones) ? parsed.tombstones : [],
      };
    }

    if (!Array.isArray(database.tombstones)) {
      database.tombstones = [];
    }

    for (const col of ALL_COLLECTIONS) {
      const tombstoneIds = new Set(
        database.tombstones.filter((t) => t.entityType === col).map((t) => t.id)
      );
      database[col] = sanitizeCollectionByCompositeKey(database[col], col).filter(
        (item) => !tombstoneIds.has(getEntityKey(col, item))
      );
    }

    let usersUpdated = false;
    database.users.forEach((u) => {
      if (!u.passwordHash || !String(u.passwordHash).startsWith('scrypt$')) {
        u.passwordHash = hashPassword('123456');
        usersUpdated = true;
      }
    });

    const profilesUpdated = ensureStudentProfilesIntegrity();

    if (recoveredFromBackup) {
      database.auditLogs.unshift({
        id: `audit_${Date.now()}_recovery`,
        userId: 'system',
        userName: 'النظام',
        userRole: 'admin',
        action: 'استعادة تلقائية لقاعدة البيانات',
        details: 'تم اكتشاف تلف في الملف الرئيسي واستعادة آخر نسخة احتياطية سليمة تلقائياً',
        timestamp: new Date().toISOString(),
      });
    }

    if (usersUpdated || profilesUpdated || recoveredFromBackup) {
      saveDatabase();
    }
  } else {
    database = buildSeededDefaultDb();
    ensureStudentProfilesIntegrity();
    saveDatabase();
  }
}

loadDatabase();

// ============================================================================
// 4. Authentication & Active Session Verification Helper
// ============================================================================

function getAuthenticatedUser(req: express.Request): AuthenticatedUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const payload = verifyAuthToken(authHeader);
  if (!payload) return null;

  const dbUser = database.users.find((u) => u && u.id === payload.id);
  if (!dbUser || dbUser.status === 'suspended') {
    return null;
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    name: dbUser.name,
    status: dbUser.status || 'active',
    iat: payload.iat,
    exp: payload.exp,
  };
}

function sanitizeUserForClient(u: any) {
  if (!u || typeof u !== 'object') return u;
  const { passwordHash, resetToken, verificationToken, ...safeUser } = u;
  return safeUser;
}

// ============================================================================
// 5. Strict Role-Based & Record-Level Data Isolation (Pull State)
// ============================================================================

function getFilteredStateForClient(authUser: AuthenticatedUser) {
  const { role, id: userId } = authUser;
  const sanitizedAllUsers = database.users.map(sanitizeUserForClient);

  if (role === 'admin') {
    return {
      ...database,
      users: sanitizedAllUsers,
    };
  }

  if (role === 'teacher') {
    const myGroups = database.groups.filter((g) => g && g.teacherId === userId);
    const myGroupIds = new Set(myGroups.map((g) => g.groupId));
    const myMembers = database.members.filter((m) => m && myGroupIds.has(m.groupId));
    const myJoinRequests = database.joinRequests.filter(
      (r) => r && (myGroupIds.has(r.groupId) || r.teacherId === userId)
    );

    const myStudentIds = new Set<string>();
    myMembers.forEach((m) => myStudentIds.add(m.studentId));
    myJoinRequests.forEach((r) => myStudentIds.add(r.studentId));

    const myParentLinks = database.parentStudents.filter(
      (ps) => ps && myStudentIds.has(ps.studentId)
    );
    const myParentIds = new Set(myParentLinks.map((ps) => ps.parentId));

    const myQuizzes = database.quizzes.filter((q) => q && myGroupIds.has(q.groupId));
    const myQuizIds = new Set(myQuizzes.map((q) => q.quizId));

    const visibleUsers = sanitizedAllUsers.filter(
      (u) =>
        u.id === userId ||
        u.role === 'assistant' ||
        myStudentIds.has(u.id) ||
        myParentIds.has(u.id)
    );

    return {
      lastUpdated: database.lastUpdated,
      users: visibleUsers,
      teacherProfiles: database.teacherProfiles.filter((tp) => tp.teacherId === userId),
      studentProfiles: database.studentProfiles.filter((sp) => myStudentIds.has(sp.studentId)),
      groups: myGroups,
      members: myMembers,
      parentStudents: myParentLinks,
      attendance: database.attendance.filter((a) => myGroupIds.has(a.groupId)),
      homework: database.homework.filter((h) => myGroupIds.has(h.groupId)),
      assessments: database.assessments.filter(
        (a) => myGroupIds.has(a.groupId) || a.teacherId === userId
      ),
      grades: database.grades.filter((g) => myGroupIds.has(g.groupId)),
      announcements: database.announcements.filter((a) => myGroupIds.has(a.groupId)),
      notes: database.notes.filter(
        (n) =>
          n.teacherId === userId ||
          myGroupIds.has(n.groupId) ||
          (myStudentIds.has(n.studentId) && n.visibility === 'parent_visible')
      ),
      joinRequests: myJoinRequests,
      notifications: database.notifications.filter((n) => n.userId === userId),
      auditLogs: database.auditLogs.filter(
        (l) => l.userId === userId || myGroupIds.has(l.userId)
      ),
      reports: database.reports.filter((r) => r.userId === userId),
      payments: database.payments.filter((p) => myGroupIds.has(p.groupId)),
      materials: database.materials.filter((m) => myGroupIds.has(m.groupId)),
      badges: database.badges.filter(
        (b) => myGroupIds.has(b.groupId) || myStudentIds.has(b.studentId)
      ),
      quizzes: myQuizzes,
      quizSubmissions: database.quizSubmissions.filter(
        (qs) => myQuizIds.has(qs.quizId) || myStudentIds.has(qs.studentId)
      ),
      certificates: database.certificates.filter(
        (c) => myGroupIds.has(c.groupId) || myStudentIds.has(c.studentId)
      ),
      liveSessions: database.liveSessions.filter(
        (s) => myGroupIds.has(s.groupId) || s.teacherId === userId
      ),
      homeworkSubmissions: database.homeworkSubmissions.filter(
        (hs) => myGroupIds.has(hs.groupId) || myStudentIds.has(hs.studentId)
      ),
      assistantPermissions: database.assistantPermissions.filter(
        (ap) => ap.teacherId === userId || ap.teacherId === 'user_teacher_1'
      ),
      tombstones: database.tombstones,
    };
  }

  if (role === 'assistant') {
    const assignedGroups = database.groups.filter(
      (g) =>
        g &&
        (g.assistantId === userId ||
          (Array.isArray(g.assistantIds) && g.assistantIds.includes(userId)) ||
          g.teacherId === 'user_teacher_1')
    );
    const assignedGroupIds = new Set(assignedGroups.map((g) => g.groupId));
    const groupMembers = database.members.filter((m) => assignedGroupIds.has(m.groupId));
    const studentIds = new Set(groupMembers.map((m) => m.studentId));
    const teacherIds = new Set(assignedGroups.map((g) => g.teacherId));
    const parentLinks = database.parentStudents.filter((ps) => studentIds.has(ps.studentId));
    const parentIds = new Set(parentLinks.map((ps) => ps.parentId));
    const groupQuizzes = database.quizzes.filter((q) => assignedGroupIds.has(q.groupId));
    const quizIds = new Set(groupQuizzes.map((q) => q.quizId));

    return {
      lastUpdated: database.lastUpdated,
      users: sanitizedAllUsers.filter(
        (u) =>
          u.id === userId ||
          teacherIds.has(u.id) ||
          studentIds.has(u.id) ||
          parentIds.has(u.id)
      ),
      teacherProfiles: database.teacherProfiles.filter((tp) => teacherIds.has(tp.teacherId)),
      studentProfiles: database.studentProfiles.filter((sp) => studentIds.has(sp.studentId)),
      groups: assignedGroups,
      members: groupMembers,
      parentStudents: parentLinks,
      attendance: database.attendance.filter((a) => assignedGroupIds.has(a.groupId)),
      homework: database.homework.filter((h) => assignedGroupIds.has(h.groupId)),
      assessments: database.assessments.filter((a) => assignedGroupIds.has(a.groupId)),
      grades: database.grades.filter((g) => assignedGroupIds.has(g.groupId)),
      announcements: database.announcements.filter((a) => assignedGroupIds.has(a.groupId)),
      notes: database.notes.filter(
        (n) => studentIds.has(n.studentId) && n.visibility === 'parent_visible'
      ),
      joinRequests: database.joinRequests.filter((r) => assignedGroupIds.has(r.groupId)),
      notifications: database.notifications.filter((n) => n.userId === userId),
      auditLogs: database.auditLogs.filter((l) => l.userId === userId),
      reports: database.reports.filter((r) => r.userId === userId),
      payments: database.payments.filter((p) => assignedGroupIds.has(p.groupId)),
      materials: database.materials.filter((m) => assignedGroupIds.has(m.groupId)),
      badges: database.badges.filter((b) => assignedGroupIds.has(b.groupId)),
      quizzes: groupQuizzes,
      quizSubmissions: database.quizSubmissions.filter((qs) => quizIds.has(qs.quizId)),
      certificates: database.certificates.filter((c) => assignedGroupIds.has(c.groupId)),
      liveSessions: database.liveSessions.filter((s) => assignedGroupIds.has(s.groupId)),
      homeworkSubmissions: database.homeworkSubmissions.filter((hs) => assignedGroupIds.has(hs.groupId)),
      assistantPermissions: database.assistantPermissions.filter((ap) => ap.assistantId === userId),
      tombstones: database.tombstones,
    };
  }

  if (role === 'student') {
    const myMemberships = database.members.filter(
      (m) => m && m.studentId === userId && m.status === 'active'
    );
    const myGroupIds = new Set(myMemberships.map((m) => m.groupId));
    const myGroups = database.groups.filter((g) => g && myGroupIds.has(g.groupId));
    const myTeacherIds = new Set(myGroups.map((g) => g.teacherId));

    return {
      lastUpdated: database.lastUpdated,
      users: sanitizedAllUsers.filter((u) => u.id === userId || myTeacherIds.has(u.id)),
      teacherProfiles: database.teacherProfiles.filter((tp) => myTeacherIds.has(tp.teacherId)),
      studentProfiles: database.studentProfiles.filter((sp) => sp.studentId === userId),
      groups: myGroups,
      members: myMemberships,
      parentStudents: database.parentStudents.filter((ps) => ps.studentId === userId),
      attendance: database.attendance.filter((a) => a.studentId === userId),
      homework: database.homework.filter((h) => myGroupIds.has(h.groupId)),
      assessments: database.assessments.filter((a) => myGroupIds.has(a.groupId)),
      grades: database.grades.filter((g) => g.studentId === userId),
      announcements: database.announcements.filter((a) => myGroupIds.has(a.groupId)),
      notes: database.notes.filter(
        (n) => n.studentId === userId && n.visibility !== 'teacher_only'
      ),
      joinRequests: database.joinRequests.filter((r) => r.studentId === userId),
      notifications: database.notifications.filter((n) => n.userId === userId),
      auditLogs: database.auditLogs.filter((l) => l.userId === userId),
      reports: database.reports.filter((r) => r.userId === userId),
      payments: database.payments.filter((p) => p.studentId === userId),
      materials: database.materials.filter((m) => myGroupIds.has(m.groupId)),
      badges: database.badges.filter((b) => b.studentId === userId),
      quizzes: database.quizzes.filter((q) => myGroupIds.has(q.groupId)),
      quizSubmissions: database.quizSubmissions.filter((qs) => qs.studentId === userId),
      certificates: database.certificates.filter((c) => c.studentId === userId),
      liveSessions: database.liveSessions.filter((s) => myGroupIds.has(s.groupId)),
      homeworkSubmissions: database.homeworkSubmissions.filter((hs) => hs.studentId === userId),
      assistantPermissions: [],
      tombstones: database.tombstones,
    };
  }

  if (role === 'parent') {
    const myLinks = database.parentStudents.filter(
      (ps) => ps && ps.parentId === userId && ps.status === 'active'
    );
    const myChildIds = new Set(myLinks.map((ps) => ps.studentId));
    const childMemberships = database.members.filter(
      (m) => m && myChildIds.has(m.studentId) && m.status === 'active'
    );
    const childGroupIds = new Set(childMemberships.map((m) => m.groupId));
    const childGroups = database.groups.filter((g) => g && childGroupIds.has(g.groupId));
    const childTeacherIds = new Set(childGroups.map((g) => g.teacherId));

    return {
      lastUpdated: database.lastUpdated,
      users: sanitizedAllUsers.filter(
        (u) => u.id === userId || myChildIds.has(u.id) || childTeacherIds.has(u.id)
      ),
      teacherProfiles: database.teacherProfiles.filter((tp) => childTeacherIds.has(tp.teacherId)),
      studentProfiles: database.studentProfiles.filter((sp) => myChildIds.has(sp.studentId)),
      groups: childGroups,
      members: childMemberships,
      parentStudents: myLinks,
      attendance: database.attendance.filter((a) => myChildIds.has(a.studentId)),
      homework: database.homework.filter((h) => childGroupIds.has(h.groupId)),
      assessments: database.assessments.filter((a) => childGroupIds.has(a.groupId)),
      grades: database.grades.filter((g) => myChildIds.has(g.studentId)),
      announcements: database.announcements.filter((a) => childGroupIds.has(a.groupId)),
      notes: database.notes.filter(
        (n) => myChildIds.has(n.studentId) && n.visibility === 'parent_visible'
      ),
      joinRequests: database.joinRequests.filter((r) => myChildIds.has(r.studentId)),
      notifications: database.notifications.filter((n) => n.userId === userId),
      auditLogs: database.auditLogs.filter((l) => l.userId === userId),
      reports: database.reports.filter((r) => r.userId === userId),
      payments: database.payments.filter((p) => myChildIds.has(p.studentId)),
      materials: database.materials.filter((m) => childGroupIds.has(m.groupId)),
      badges: database.badges.filter((b) => myChildIds.has(b.studentId)),
      quizzes: database.quizzes.filter((q) => childGroupIds.has(q.groupId)),
      quizSubmissions: database.quizSubmissions.filter((qs) => myChildIds.has(qs.studentId)),
      certificates: database.certificates.filter((c) => myChildIds.has(c.studentId)),
      liveSessions: database.liveSessions.filter((s) => childGroupIds.has(s.groupId)),
      homeworkSubmissions: database.homeworkSubmissions.filter((hs) => myChildIds.has(hs.studentId)),
      assistantPermissions: [],
      tombstones: database.tombstones,
    };
  }

  return {
    lastUpdated: database.lastUpdated,
    users: [],
    teacherProfiles: [],
    studentProfiles: [],
    groups: [],
    members: [],
    parentStudents: [],
    attendance: [],
    homework: [],
    assessments: [],
    grades: [],
    announcements: [],
    notes: [],
    joinRequests: [],
    notifications: [],
    auditLogs: [],
    reports: [],
    payments: [],
    materials: [],
    badges: [],
    quizzes: [],
    quizSubmissions: [],
    certificates: [],
    liveSessions: [],
    homeworkSubmissions: [],
    assistantPermissions: [],
    tombstones: [],
  };
}

// ============================================================================
// 6. Comprehensive Relational & Ownership Write Validation Matrix
// ============================================================================

function isTeacherOwnerOfGroup(teacherId: string, groupId?: string): boolean {
  if (!teacherId || !groupId) return false;
  return database.groups.some((g) => g && g.groupId === groupId && g.teacherId === teacherId);
}

function isAssistantAllowedForGroup(assistantId: string, groupId?: string): boolean {
  if (!assistantId || !groupId) return false;
  return database.groups.some(
    (g) =>
      g &&
      g.groupId === groupId &&
      (g.assistantId === assistantId ||
        (Array.isArray(g.assistantIds) && g.assistantIds.includes(assistantId)) ||
        g.teacherId === 'user_teacher_1')
  );
}

function getServerAssistantPermissions(assistantId: string, groupId?: string) {
  const group = groupId ? database.groups.find((g) => g && g.groupId === groupId) : undefined;
  const teacherId = group?.teacherId || 'user_teacher_1';
  const found =
    database.assistantPermissions.find(
      (p) => p && p.assistantId === assistantId && p.teacherId === teacherId
    ) || database.assistantPermissions.find((p) => p && p.assistantId === assistantId);
  if (found) return found;
  return {
    assistantId,
    teacherId,
    canRecordAttendance: true,
    canSearchStudents: true,
    canManagePayments: false,
    canManageJoinRequests: false,
    canManageHomework: false,
  };
}

function isStudentMemberOfGroup(studentId: string, groupId?: string): boolean {
  if (!studentId || !groupId) return false;
  return database.members.some(
    (m) => m && m.groupId === groupId && m.studentId === studentId && m.status === 'active'
  );
}

function isStudentInTeacherGroups(teacherId: string, studentId?: string): boolean {
  if (!teacherId || !studentId) return false;
  const teacherGroupIds = new Set(
    database.groups.filter((g) => g && g.teacherId === teacherId).map((g) => g.groupId)
  );
  return (
    database.members.some(
      (m) => m && teacherGroupIds.has(m.groupId) && m.studentId === studentId
    ) ||
    database.joinRequests.some(
      (r) => r && teacherGroupIds.has(r.groupId) && r.studentId === studentId
    )
  );
}

function validateRecordWrite(
  authUser: AuthenticatedUser,
  entityType: string,
  action: 'upsert' | 'delete',
  payload: any,
  entityId?: string
): { allowed: boolean; reason?: string } {
  const { role, id: userId } = authUser;

  if (!ALL_COLLECTIONS.includes(entityType as any)) {
    return { allowed: false, reason: `نوع الكيان غير معروف: ${entityType}` };
  }

  if (role === 'admin') {
    return { allowed: true };
  }

  const targetCol = (database as any)[entityType] as any[];
  const recordKey =
    action === 'delete'
      ? String(entityId || '')
      : getEntityKey(entityType, payload) || String(entityId || '');
  const existingRecord = Array.isArray(targetCol)
    ? targetCol.find((item) => getEntityKey(entityType, item) === recordKey)
    : undefined;
  const targetObj = action === 'delete' ? existingRecord : payload;

  switch (entityType) {
    case 'users': {
      if (action === 'delete') {
        return { allowed: false, reason: 'حذف المستخدمين متاح لمدير النظام فقط' };
      }
      if (!targetObj || targetObj.id !== userId) {
        return { allowed: false, reason: 'لا يمكنك تعديل حساب مستخدم آخر' };
      }
      if (existingRecord && targetObj.role && targetObj.role !== existingRecord.role) {
        return { allowed: false, reason: 'غير مصرح بتغيير دور المستخدم أو تصعيد الصلاحيات' };
      }
      if (existingRecord && targetObj.status && targetObj.status !== existingRecord.status) {
        return { allowed: false, reason: 'غير مصرح بتغيير حالة تفعيل الحساب' };
      }
      return { allowed: true };
    }

    case 'teacherProfiles': {
      if (role !== 'teacher' || (targetObj && targetObj.teacherId !== userId)) {
        return { allowed: false, reason: 'تعديل ملف المدرس متاح للمدرس صاحب الحساب فقط' };
      }
      return { allowed: true };
    }

    case 'assistantPermissions': {
      if (role !== 'teacher') {
        return { allowed: false, reason: 'إدارة صلاحيات المساعد متاحة للمدرس فقط' };
      }
      if (targetObj?.teacherId && targetObj.teacherId !== userId) {
        return { allowed: false, reason: 'لا يمكنك تعديل صلاحيات مساعد يتبع مدرساً آخر' };
      }
      return { allowed: true };
    }

    case 'studentProfiles': {
      if (action === 'delete') {
        return { allowed: false, reason: 'غير مصرح بحذف ملف الطالب' };
      }
      const studentId = targetObj?.studentId || recordKey;
      if (role === 'student' && studentId === userId) {
        if (targetObj?.linkingCode) {
          const codeUpper = String(targetObj.linkingCode).trim().toUpperCase();
          const conflict = database.studentProfiles.some(
            (sp) => sp.studentId !== userId && String(sp.linkingCode).toUpperCase() === codeUpper
          );
          if (conflict) {
            return { allowed: false, reason: 'كود الربط مستخدم بالفعل لطالب آخر' };
          }
        }
        return { allowed: true };
      }
      if (role === 'teacher' && isStudentInTeacherGroups(userId, studentId)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'غير مصرح بتعديل ملف طالب لا يتبعك' };
    }

    case 'groups': {
      if (role !== 'teacher') {
        return { allowed: false, reason: 'إدارة المجموعات متاحة للمدرس المالك فقط' };
      }
      if (existingRecord && existingRecord.teacherId !== userId) {
        return { allowed: false, reason: 'لا يمكنك تعديل أو حذف مجموعة يملكها مدرس آخر' };
      }
      if (action === 'upsert' && targetObj?.teacherId && targetObj.teacherId !== userId) {
        return { allowed: false, reason: 'لا يمكنك إنشاء مجموعة باسم مدرس آخر' };
      }
      return { allowed: true };
    }

    case 'members': {
      const groupId = targetObj?.groupId || recordKey.split('_')[0];
      const studentId = targetObj?.studentId || recordKey.split('_').slice(1).join('_');
      if (role === 'teacher' && isTeacherOwnerOfGroup(userId, groupId)) {
        return { allowed: true };
      }
      if (role === 'assistant' && isAssistantAllowedForGroup(userId, groupId)) {
        const perms = getServerAssistantPermissions(userId, groupId);
        if (!perms.canManageJoinRequests) {
          return { allowed: false, reason: 'صلاحية تعديل عضويات الطلاب غير مفعلة لحساب المساعد' };
        }
        return { allowed: true };
      }
      if (role === 'student' && studentId === userId) {
        if (action === 'delete') return { allowed: true };
        const group = database.groups.find((g) => g.groupId === groupId);
        if (!group) return { allowed: false, reason: 'المجموعة غير موجودة' };
        if (group.status === 'paused') {
          return { allowed: false, reason: 'المجموعة متوقفة حالياً عن قبول الطلاب' };
        }
        if (group.joinApprovalMode === 'requires_approval' && !existingRecord) {
          return { allowed: false, reason: 'هذه المجموعة تتطلب إرسال طلب انضمام وموافقة المدرس أولاً' };
        }
        return { allowed: true };
      }
      return { allowed: false, reason: 'غير مصرح بتعديل عضوية هذه المجموعة' };
    }

    case 'parentStudents': {
      const parentId = targetObj?.parentId || recordKey.split('_')[0];
      const studentId = targetObj?.studentId || recordKey.split('_').slice(1).join('_');

      if (action === 'delete') {
        if ((role === 'parent' && parentId === userId) || (role === 'student' && studentId === userId)) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'غير مصرح بإلغاء ربط لا يخص حسابك' };
      }

      if (role !== 'parent' || parentId !== userId) {
        return { allowed: false, reason: 'ربط الأبناء متاح لولي الأمر صاحب الحساب فقط' };
      }

      if (existingRecord && existingRecord.parentId === userId && existingRecord.studentId === studentId) {
        return { allowed: true };
      }

      const providedCode = String(targetObj?.linkingCode || targetObj?.linkingCodeUsed || '')
        .trim()
        .toUpperCase();
      const studentProfile = database.studentProfiles.find((sp) => sp.studentId === studentId);
      if (
        !studentProfile ||
        !providedCode ||
        String(studentProfile.linkingCode).trim().toUpperCase() !== providedCode
      ) {
        return {
          allowed: false,
          reason: 'لا يمكن ربط الطالب بدون التحقق من كود الربط الصحيح على الخادم',
        };
      }
      return { allowed: true };
    }

    case 'attendance': {
      const groupId = targetObj?.groupId || existingRecord?.groupId;
      if (role === 'teacher' && isTeacherOwnerOfGroup(userId, groupId)) {
        return { allowed: true };
      }
      if (role === 'assistant' && isAssistantAllowedForGroup(userId, groupId)) {
        const perms = getServerAssistantPermissions(userId, groupId);
        if (!perms.canRecordAttendance) {
          return { allowed: false, reason: 'صلاحية تسجيل الحضور غير مفعلة لحساب المساعد' };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `غير مصرح لدور (${role}) بتعديل سجلات الحضور لهذه المجموعة`,
      };
    }

    case 'payments': {
      const groupId = targetObj?.groupId || existingRecord?.groupId;
      if (role === 'teacher' && isTeacherOwnerOfGroup(userId, groupId)) {
        return { allowed: true };
      }
      if (role === 'assistant' && isAssistantAllowedForGroup(userId, groupId)) {
        const perms = getServerAssistantPermissions(userId, groupId);
        if (!perms.canManagePayments) {
          return { allowed: false, reason: 'صلاحية إدارة المصروفات والتحصيل غير مفعلة لحساب المساعد' };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `غير مصرح لدور (${role}) بتعديل سجلات المصروفات لهذه المجموعة`,
      };
    }

    case 'homework': {
      const groupId = targetObj?.groupId || existingRecord?.groupId;
      if (role === 'teacher' && isTeacherOwnerOfGroup(userId, groupId)) {
        return { allowed: true };
      }
      if (role === 'assistant' && isAssistantAllowedForGroup(userId, groupId)) {
        const perms = getServerAssistantPermissions(userId, groupId);
        if (!perms.canManageHomework) {
          return { allowed: false, reason: 'صلاحية متابعة الواجبات غير مفعلة لحساب المساعد' };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `غير مصرح لدور (${role}) بتعديل الواجبات لهذه المجموعة`,
      };
    }

    case 'homeworkSubmissions': {
      if (action === 'delete') {
        return { allowed: false, reason: 'لا يمكن حذف تسليمات الواجبات' };
      }
      const groupId = targetObj?.groupId || existingRecord?.groupId;
      const studentId = targetObj?.studentId || existingRecord?.studentId;
      if (role === 'student') {
        if (studentId !== userId) {
          return { allowed: false, reason: 'لا يمكنك تسليم واجب نيابة عن طالب آخر' };
        }
        if (!isStudentMemberOfGroup(userId, groupId)) {
          return { allowed: false, reason: 'يجب أن تكون عضواً في المجموعة لتسليم هذا الواجب' };
        }
        if (existingRecord && existingRecord.status === 'graded' && targetObj?.score !== existingRecord.score) {
          return { allowed: false, reason: 'لا يمكن للطالب تعديل درجة الواجب المرصودة' };
        }
        return { allowed: true };
      }
      if (role === 'teacher' && isTeacherOwnerOfGroup(userId, groupId)) {
        return { allowed: true };
      }
      if (role === 'assistant' && isAssistantAllowedForGroup(userId, groupId)) {
        const perms = getServerAssistantPermissions(userId, groupId);
        if (perms.canManageHomework) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'صلاحية متابعة الواجبات غير مفعلة لحساب المساعد' };
      }
      return { allowed: false, reason: 'غير مصرح بتعديل تسليم الواجب' };
    }

    case 'grades': {
      const groupId = targetObj?.groupId || existingRecord?.groupId;
      const studentId = targetObj?.studentId || existingRecord?.studentId;
      if (role === 'teacher' && isTeacherOwnerOfGroup(userId, groupId)) {
        return { allowed: true };
      }
      // Allow student's self-graded practice quiz grade record (prefixed grade_quiz_)
      if (
        role === 'student' &&
        studentId === userId &&
        String(targetObj?.gradeId || '').startsWith('grade_quiz_') &&
        isStudentMemberOfGroup(userId, groupId)
      ) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `غير مصرح لدور (${role}) برصد أو تعديل الدرجات لهذه المجموعة`,
      };
    }

    case 'assessments':
    case 'announcements':
    case 'materials':
    case 'quizzes': {
      const groupId = targetObj?.groupId || existingRecord?.groupId;
      if (role === 'teacher' && isTeacherOwnerOfGroup(userId, groupId)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `غير مصرح لدور (${role}) بتعديل سجلات (${entityType}) لهذه المجموعة`,
      };
    }

    case 'badges':
    case 'certificates':
    case 'liveSessions': {
      const groupId = targetObj?.groupId || existingRecord?.groupId;
      if (role === 'teacher' && isTeacherOwnerOfGroup(userId, groupId)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'هذا الإجراء متاح لمدرس المجموعة فقط' };
    }

    case 'notes': {
      if (role === 'teacher') {
        const noteTeacherId = targetObj?.teacherId || existingRecord?.teacherId;
        const noteGroupId = targetObj?.groupId || existingRecord?.groupId;
        const studentId = targetObj?.studentId || existingRecord?.studentId;
        const ownsGroup = Boolean(noteGroupId && isTeacherOwnerOfGroup(userId, noteGroupId));
        if (
          ownsGroup ||
          (noteTeacherId === userId && isStudentInTeacherGroups(userId, studentId))
        ) {
          return { allowed: true };
        }
      }
      return { allowed: false, reason: 'إضافة وتعديل الملاحظات متاحة لمدرس الطالب فقط' };
    }

    case 'quizSubmissions': {
      if (action === 'delete') {
        return { allowed: false, reason: 'لا يمكن حذف تسليمات الاختبارات' };
      }
      const quizId = targetObj?.quizId;
      const studentId = targetObj?.studentId;
      const quiz = database.quizzes.find((q) => q.quizId === quizId);
      if (!quiz) {
        return { allowed: false, reason: 'الاختبار غير موجود' };
      }
      if (role === 'student') {
        if (studentId !== userId) {
          return { allowed: false, reason: 'لا يمكنك تسليم اختبار نيابة عن طالب آخر' };
        }
        if (!isStudentMemberOfGroup(userId, quiz.groupId)) {
          return { allowed: false, reason: 'يجب أن تكون عضواً في المجموعة لتسليم هذا الاختبار' };
        }
        return { allowed: true };
      }
      if (role === 'teacher' && isTeacherOwnerOfGroup(userId, quiz.groupId)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'غير مصرح بتعديل تسليم الاختبار' };
    }

    case 'joinRequests': {
      const groupId = targetObj?.groupId || existingRecord?.groupId;
      const studentId = targetObj?.studentId || existingRecord?.studentId;
      if (role === 'student') {
        if (action === 'upsert' && !existingRecord && studentId === userId && targetObj?.status === 'pending') {
          return { allowed: true };
        }
        return { allowed: false, reason: 'لا يمكن للطالب قبول طلب الانضمام أو تعديل طلبات الآخرين' };
      }
      if (role === 'teacher' && isTeacherOwnerOfGroup(userId, groupId)) {
        return { allowed: true };
      }
      if (role === 'assistant' && isAssistantAllowedForGroup(userId, groupId)) {
        const perms = getServerAssistantPermissions(userId, groupId);
        if (perms.canManageJoinRequests) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'صلاحية مراجعة طلبات الانضمام غير مفعلة لحساب المساعد' };
      }
      return { allowed: false, reason: 'غير مصرح بإدارة طلبات الانضمام لهذه المجموعة' };
    }

    case 'notifications': {
      if (action === 'delete') {
        if (existingRecord && existingRecord.userId === userId) return { allowed: true };
        return { allowed: false, reason: 'لا يمكنك حذف إشعارات مستخدم آخر' };
      }
      if (existingRecord) {
        if (existingRecord.userId === userId) return { allowed: true };
        return { allowed: false, reason: 'لا يمكنك تعديل إشعارات مستخدم آخر' };
      }
      return { allowed: true };
    }

    case 'auditLogs': {
      if (action === 'delete' || existingRecord) {
        return { allowed: false, reason: 'سجلات التدقيق غير قابلة للتعديل أو الحذف' };
      }
      if (targetObj?.userId === userId || (role === 'teacher' && isTeacherOwnerOfGroup(userId, targetObj?.userId))) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'لا يمكنك إضافة سجل تدقيق باسم مستخدم آخر' };
    }

    case 'reports': {
      if (action === 'delete') {
        return { allowed: false, reason: 'حذف البلاغات متاح لمدير النظام فقط' };
      }
      if (!existingRecord && targetObj?.userId === userId) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'تعديل حالة البلاغات متاح لمدير النظام فقط' };
    }

    default:
      return { allowed: false, reason: 'عملية غير مصرح بها' };
  }
}

// ============================================================================
// 7. Rate Limiting for Linking Code Attempts
// ============================================================================

const linkingRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkLinkingRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = linkingRateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    linkingRateLimitMap.set(key, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 15) {
    return false;
  }
  entry.count += 1;
  return true;
}

// ============================================================================
// 8. Express Server & Routes
// ============================================================================

async function startServer() {
  const app = express();

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: 'YallaDars - يلا درس',
      serverTime: new Date().toISOString(),
      timestamp: Date.now(),
      billing: '100% Free & Self-Hosted',
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'الجلسة غير صالحة أو منتهية الصلاحية',
      });
    }
    const dbUser = database.users.find((u) => u.id === authUser.id);
    const studentProfile =
      authUser.role === 'student'
        ? database.studentProfiles.find((sp) => sp.studentId === authUser.id)
        : undefined;
    const teacherProfile =
      authUser.role === 'teacher'
        ? database.teacherProfiles.find((tp) => tp.teacherId === authUser.id)
        : undefined;

    res.json({
      success: true,
      user: sanitizeUserForClient(dbUser),
      studentProfile,
      teacherProfile,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password, isDemoQuickLogin } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = database.users.find((u) => String(u.email || '').toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'هذا الحساب موقوف حالياً من قبل الإدارة.',
      });
    }

    const isBuiltInDemoUser = INITIAL_USERS.some((initU) => initU.id === user.id);
    const passwordValid =
      (isDemoQuickLogin === true && isBuiltInDemoUser && process.env.DISABLE_DEMO_MODE !== 'true') ||
      verifyPassword(String(password || ''), user.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.',
      });
    }

    const token = signAuthToken({ id: user.id, email: user.email, role: user.role });
    const studentProfile =
      user.role === 'student'
        ? database.studentProfiles.find((sp) => sp.studentId === user.id)
        : undefined;
    const teacherProfile =
      user.role === 'teacher'
        ? database.teacherProfiles.find((tp) => tp.teacherId === user.id)
        : undefined;

    res.json({
      success: true,
      token,
      user: sanitizeUserForClient(user),
      studentProfile,
      teacherProfile,
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { id, name, email, password, role, phone, subject, city, grade, school, linkingCode } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'الاسم الكامل مطلوب' });
    }
    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال بريد إلكتروني صحيح' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({
        success: false,
        error: 'كلمة المرور مطلوبة ويجب ألا تقل عن 6 أحرف',
      });
    }

    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'لا يمكن إنشاء حساب مدير نظام عبر التسجيل العام',
      });
    }

    const validRoles = ['teacher', 'assistant', 'student', 'parent'];
    const safeRole = validRoles.includes(role) ? role : 'student';
    const cleanEmail = String(email).trim().toLowerCase();

    const existingUser = database.users.find((u) => String(u.email || '').toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.',
      });
    }

    const userId =
      id &&
      typeof id === 'string' &&
      !database.users.some((u) => u.id === id) &&
      !INITIAL_USERS.some((u) => u.id === id)
        ? id
        : `user_${safeRole}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const newUser = {
      id: userId,
      name: String(name).trim(),
      email: cleanEmail,
      role: safeRole,
      phone: phone ? String(phone).trim() : '',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      passwordHash: hashPassword(String(password)),
    };

    database.users.push(newUser);

    let createdStudentProfile: any = undefined;
    let createdTeacherProfile: any = undefined;

    if (safeRole === 'teacher') {
      createdTeacherProfile = {
        teacherId: userId,
        subject: subject?.trim() || 'مادة عامة',
        grades: [grade || 'الصف الأول الثانوي'],
        city: city?.trim() || 'القاهرة',
      };
      database.teacherProfiles.push(createdTeacherProfile);
    } else if (safeRole === 'student') {
      const requestedCode = linkingCode ? String(linkingCode).trim().toUpperCase() : '';
      const isRequestedCodeFree =
        requestedCode &&
        requestedCode !== 'YD-LK-1001' &&
        !database.studentProfiles.some(
          (p) => String(p.linkingCode || '').toUpperCase() === requestedCode
        );
      const codeToUse = isRequestedCodeFree ? requestedCode : generateServerUniqueLinkingCode();

      createdStudentProfile = {
        studentId: userId,
        grade: grade || 'الصف الأول الثانوي',
        school: school?.trim() || 'مدرسة حكومية / خاصة',
        linkingCode: codeToUse,
      };
      database.studentProfiles.push(createdStudentProfile);
    } else if (safeRole === 'assistant') {
      database.assistantPermissions.push({
        assistantId: userId,
        teacherId: 'user_teacher_1',
        canRecordAttendance: true,
        canSearchStudents: true,
        canManagePayments: false,
        canManageJoinRequests: false,
        canManageHomework: false,
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }

    saveDatabase();

    const token = signAuthToken({ id: newUser.id, email: newUser.email, role: newUser.role });
    res.status(201).json({
      success: true,
      token,
      user: sanitizeUserForClient(newUser),
      linkingCode: createdStudentProfile?.linkingCode,
      studentProfile: createdStudentProfile,
      teacherProfile: createdTeacherProfile,
    });
  });

  app.put('/api/auth/profile', (req, res) => {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول لتحديث الملف الشخصي' });
    }

    const { name, phone, subject, city, grade, school } = req.body || {};
    const user = database.users.find((u) => u.id === authUser.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    if (name && String(name).trim()) {
      user.name = String(name).trim();
    }
    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    if (authUser.role === 'teacher') {
      let tp = database.teacherProfiles.find((p) => p.teacherId === authUser.id);
      if (!tp) {
        tp = {
          teacherId: authUser.id,
          subject: subject?.trim() || 'مادة عامة',
          grades: [grade || 'الصف الأول الثانوي'],
          city: city?.trim() || 'القاهرة',
        };
        database.teacherProfiles.push(tp);
      } else {
        if (subject !== undefined) tp.subject = String(subject).trim();
        if (city !== undefined) tp.city = String(city).trim();
      }
    } else if (authUser.role === 'student') {
      let sp = database.studentProfiles.find((p) => p.studentId === authUser.id);
      if (!sp) {
        sp = {
          studentId: authUser.id,
          grade: grade || 'الصف الأول الثانوي',
          school: school?.trim() || 'مدرسة حكومية',
          linkingCode: generateServerUniqueLinkingCode(),
        };
        database.studentProfiles.push(sp);
      } else {
        if (grade !== undefined) sp.grade = String(grade).trim();
        if (school !== undefined) sp.school = String(school).trim();
      }
    }

    saveDatabase();
    res.json({
      success: true,
      user: sanitizeUserForClient(user),
    });
  });

  app.post('/api/auth/change-password', (req, res) => {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول لتغيير كلمة المرور' });
    }

    const { userId, currentPassword, newPassword } = req.body || {};
    const targetUserId = authUser.role === 'admin' && userId ? String(userId) : authUser.id;

    if (userId && userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'لا يمكنك تغيير كلمة مرور مستخدم آخر' });
    }

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        error: 'كلمة المرور الجديدة يجب أن تتكون من 6 أحرف على الأقل',
      });
    }

    const user = database.users.find((u) => u.id === targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    if (authUser.role !== 'admin') {
      if (!currentPassword || !verifyPassword(String(currentPassword), user.passwordHash)) {
        return res.status(401).json({
          success: false,
          error: 'كلمة المرور الحالية غير صحيحة',
        });
      }
    }

    user.passwordHash = hashPassword(String(newPassword));
    saveDatabase();

    res.json({ success: true });
  });

  app.post('/api/parent/preview-student', (req, res) => {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول أولاً' });
    }
    if (authUser.role !== 'parent' && authUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'هذه الميزة مخصصة لأولياء الأمور فقط' });
    }

    const rateKey = `preview_${authUser.id || req.ip}`;
    if (!checkLinkingRateLimit(rateKey)) {
      return res.status(429).json({
        found: false,
        error: 'تم تجاوز الحد المسموح لمحاولات البحث. يرجى الانتظار دقائق والمحاولة مجدداً.',
      });
    }

    const cleanCode = String(req.body?.linkingCode || req.body?.code || '').trim().toUpperCase();
    if (!cleanCode) {
      return res.json({ success: true, found: false });
    }

    const studentProfile = database.studentProfiles.find(
      (sp) => String(sp.linkingCode || '').trim().toUpperCase() === cleanCode
    );
    if (!studentProfile) {
      return res.json({ success: true, found: false });
    }

    const studentUser = database.users.find(
      (u) => u && u.id === studentProfile.studentId && u.role === 'student'
    );
    if (!studentUser) {
      return res.json({ success: true, found: false });
    }

    const alreadyLinked = database.parentStudents.some(
      (ps) =>
        ps.parentId === authUser.id &&
        ps.studentId === studentProfile.studentId &&
        ps.status === 'active'
    );

    res.json({
      success: true,
      found: true,
      studentId: studentProfile.studentId,
      studentName: studentUser.name,
      grade: studentProfile.grade,
      school: studentProfile.school,
      alreadyLinked,
    });
  });

  app.post('/api/parent/link-student', (req, res) => {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول أولاً' });
    }
    if (authUser.role !== 'parent' && authUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'ربط الأبناء متاح لأولياء الأمور فقط' });
    }

    const rateKey = `link_${authUser.id || req.ip}`;
    if (!checkLinkingRateLimit(rateKey)) {
      return res.status(429).json({
        success: false,
        error: 'تم تجاوز الحد المسموح لمحاولات الربط. يرجى المحاولة بعد قليل.',
      });
    }

    const cleanCode = String(req.body?.linkingCode || req.body?.code || '').trim().toUpperCase();
    if (!cleanCode) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال كود ربط الطالب' });
    }

    const studentProfile = database.studentProfiles.find(
      (sp) => String(sp.linkingCode || '').trim().toUpperCase() === cleanCode
    );
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        error: 'كود الطالب غير صحيح أو تم تغييره. اطلب من ابنك كود الربط الصحيح من صفحته الشخصية.',
      });
    }

    const studentUser = database.users.find(
      (u) => u && u.id === studentProfile.studentId && u.role === 'student'
    );
    if (!studentUser || studentUser.status === 'suspended') {
      return res.status(404).json({
        success: false,
        error: 'حساب الطالب غير متاح حالياً',
      });
    }

    const existingLink = database.parentStudents.find(
      (ps) =>
        ps.parentId === authUser.id &&
        ps.studentId === studentUser.id &&
        ps.status === 'active'
    );
    if (existingLink) {
      return res.status(409).json({
        success: false,
        error: 'تم ربط هذا الطالب بحسابك من قبل!',
      });
    }

    const compKey = `${authUser.id}_${studentUser.id}`;
    database.tombstones = database.tombstones.filter(
      (t) => !(t.entityType === 'parentStudents' && t.id === compKey)
    );

    const newLink = {
      parentId: authUser.id,
      studentId: studentUser.id,
      studentName: studentUser.name,
      grade: studentProfile.grade,
      school: studentProfile.school,
      linkedAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    database.parentStudents.push(newLink);

    database.notifications.unshift({
      notificationId: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId: authUser.id,
      title: 'تم ربط الابن بنجاح',
      body: `تم ربط حساب الابن (${studentUser.name}) بحسابك بنجاح. يمكنك الآن متابعة حضوره ودرجاته وواجباته.`,
      type: 'session',
      read: false,
      createdAt: new Date().toISOString(),
    });

    database.auditLogs.unshift({
      id: `audit_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'ربط حساب طالب بولي أمر',
      details: `تم ربط الطالب (${studentUser.name}) بحساب ولي الأمر (${authUser.name}) عبر الكود ${cleanCode}`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase();

    res.json({
      success: true,
      studentId: studentUser.id,
      studentName: studentUser.name,
      link: newLink,
      state: getFilteredStateForClient(authUser),
    });
  });

  app.post('/api/student/join-group', (req, res) => {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول أولاً' });
    }
    if (authUser.role !== 'student') {
      return res.status(403).json({ success: false, error: 'الانضمام للمجموعات متاح للطلاب فقط' });
    }

    const cleanCode = String(req.body?.joinCode || req.body?.code || '').trim().toUpperCase();
    if (!cleanCode) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال كود الانضمام' });
    }

    const group = database.groups.find(
      (g) => g && String(g.joinCode || '').trim().toUpperCase() === cleanCode
    );
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'كود الانضمام غير صحيح، تأكد من الكود وأعد المحاولة',
      });
    }

    if (group.status === 'paused') {
      return res.status(400).json({
        success: false,
        error: 'هذه المجموعة متوقفة حالياً عن قبول انضمام طلاب جدد',
      });
    }

    const alreadyMember = database.members.some(
      (m) => m.groupId === group.groupId && m.studentId === authUser.id && m.status === 'active'
    );
    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        error: 'أنت منضم بالفعل إلى هذه المجموعة!',
      });
    }

    const studentProfile = database.studentProfiles.find((s) => s.studentId === authUser.id);

    if (group.joinApprovalMode === 'requires_approval') {
      const existingReq = database.joinRequests.find(
        (r) =>
          r.groupId === group.groupId &&
          r.studentId === authUser.id &&
          r.status === 'pending'
      );
      if (existingReq) {
        return res.status(409).json({
          success: false,
          error: 'طلب انضمامك قيد المراجعة لدى المدرس بالفعل',
        });
      }

      database.joinRequests.unshift({
        requestId: `req_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        groupId: group.groupId,
        groupName: group.name,
        teacherId: group.teacherId,
        studentId: authUser.id,
        studentName: authUser.name,
        studentGrade: studentProfile?.grade || group.grade,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      });

      database.notifications.unshift({
        notificationId: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        userId: group.teacherId,
        title: 'طلب انضمام جديد',
        body: `طلب الطالب (${authUser.name}) الانضمام إلى مجموعة: ${group.name}`,
        type: 'request',
        read: false,
        createdAt: new Date().toISOString(),
      });

      saveDatabase();
      return res.json({
        success: true,
        group,
        pendingApproval: true,
        state: getFilteredStateForClient(authUser),
      });
    }

    const compKey = `${group.groupId}_${authUser.id}`;
    database.tombstones = database.tombstones.filter(
      (t) => !(t.entityType === 'members' && t.id === compKey)
    );

    database.members.push({
      groupId: group.groupId,
      studentId: authUser.id,
      studentName: authUser.name,
      studentGrade: studentProfile?.grade || group.grade,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'active',
    });

    database.notifications.unshift({
      notificationId: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId: authUser.id,
      title: 'تم الانضمام بنجاح',
      body: `انضممت بنجاح إلى مجموعة: ${group.name} للأستاذ ${group.teacherName}`,
      type: 'session',
      read: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    res.json({
      success: true,
      group,
      pendingApproval: false,
      state: getFilteredStateForClient(authUser),
    });
  });

  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { prompt, role, userName, history } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ success: false, error: 'الرسالة مطلوبة' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          error: 'مفتاح GEMINI_API_KEY غير مضبوط في الخادم حالياً.',
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const roleDescription =
        role === 'teacher'
          ? 'مدرس مصري'
          : role === 'student'
          ? 'طالب في المرحلة الإعدادية أو الثانوية في مصر'
          : role === 'parent'
          ? 'ولي أمر طالب في مصر'
          : 'مشرف تعليمي';

      const systemInstruction = `أنت المساعد التعليمي الذكي الرسمي لتطبيق "يلا درس" (Yalla Dars) في مصر.
المستخدم الحالي هو: ${userName || 'مستخدم'} (${roleDescription}).
مهمتك:
1. إذا كان المستخدم طالباً: اشرح له المفاهيم الدراسية خطوة بخطوة بطريقة مبسطة ومشجعة باللغة العربية الواضحة، وساعده في فهم المسائل (رياضيات، علوم، لغة عربية، إنجليزي، فيزياء، كيمياء) وتنظيم وقت المذاكرة.
2. إذا كان المستخدم مدرساً: ساعده في صياغة أسئلة اختبارات سريعة، أفكار شرح مبتكرة، رسائل تربوية لأولياء الأمور، أو خطط دروس.
3. إذا كان المستخدم ولي أمر: قدم له نصائح تربوية عملية لمتابعة ابنه وتحفيزه دراسياً.
اجعل إجاباتك منظمة، واضحة، ودودة، ومختصرة قدر الإمكان لتناسب شاشة الهاتف المحمول.`;

      let fullPrompt = prompt;
      if (Array.isArray(history) && history.length > 0) {
        const recentHistory = history
          .slice(-6)
          .map((m: any) => `${m.sender === 'user' ? 'المستخدم' : 'المساعد'}: ${m.text}`)
          .join('\n');
        fullPrompt = `سجل المحادثة السابقة:\n${recentHistory}\n\nسؤال المستخدم الجديد:\n${prompt}`;
      }

      const modelsToTry = ['gemini-3-flash-preview', 'gemini-2.5-flash'];
      let replyText = '';
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: fullPrompt,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          if (response && response.text) {
            replyText = response.text;
            break;
          }
        } catch (modelErr: any) {
          lastError = modelErr;
          console.warn(`Model ${modelName} failed, trying fallback...`, modelErr?.message);
        }
      }

      if (!replyText) {
        throw lastError || new Error('تعذر الحصول على رد من نموذج الذكاء الاصطناعي');
      }

      res.json({
        success: true,
        reply: replyText,
      });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({
        success: false,
        error: 'حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.',
      });
    }
  });

  app.get('/api/sync/state', (req, res) => {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح بالوصول إلى حالة المزامنة بدون تسجيل الدخول (401 Unauthorized)',
      });
    }

    const since = Number(req.query.since) || 0;
    res.json({
      success: true,
      serverTimestamp: Date.now(),
      lastModified: database.lastUpdated,
      hasUpdates: database.lastUpdated >= since,
      state: getFilteredStateForClient(authUser),
    });
  });

  app.post('/api/sync/push', (req, res) => {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح بإرسال تغييرات المزامنة بدون تسجيل الدخول (401 Unauthorized)',
      });
    }

    const { clientId = 'unknown_client', changes = [], tombstones = [] } = req.body || {};

    let appliedCount = 0;
    const appliedChangeIds: string[] = [];
    const rejectedChanges: Array<{
      id: string;
      entityType: string;
      entityId: string;
      action: string;
      reason: string;
    }> = [];

    const applySingleUpsert = (entityType: string, payload: any, fallbackId?: string) => {
      const targetCol = (database as any)[entityType] as any[];
      const itemKey = getEntityKey(entityType, payload) || String(fallbackId || '');
      if (!itemKey || !Array.isArray(targetCol)) return false;

      database.tombstones = database.tombstones.filter(
        (t) => !(t.entityType === entityType && t.id === itemKey)
      );

      const idx = targetCol.findIndex(
        (existing: any) => getEntityKey(entityType, existing) === itemKey
      );

      if (idx >= 0) {
        if (entityType === 'users') {
          const existingUser = targetCol[idx];
          targetCol[idx] = {
            ...existingUser,
            ...payload,
            role: authUser.role === 'admin' ? payload.role || existingUser.role : existingUser.role,
            status: authUser.role === 'admin' ? payload.status || existingUser.status : existingUser.status,
            passwordHash: existingUser.passwordHash,
          };
        } else {
          targetCol[idx] = { ...targetCol[idx], ...payload };
        }
      } else {
        if (entityType === 'users' && authUser.role !== 'admin') {
          return false;
        }
        targetCol.push(payload);
      }
      return true;
    };

    const applySingleDelete = (entityType: string, entityId: string) => {
      const targetCol = (database as any)[entityType] as any[];
      if (!entityId || !Array.isArray(targetCol)) return false;

      if (!database.tombstones.some((t) => t.entityType === entityType && t.id === entityId)) {
        database.tombstones.push({
          id: entityId,
          entityType,
          deletedAt: Date.now(),
          deletedBy: authUser.id,
        });
      }

      const beforeLen = targetCol.length;
      (database as any)[entityType] = targetCol.filter(
        (item: any) => getEntityKey(entityType, item) !== entityId
      );
      return (database as any)[entityType].length !== beforeLen || true;
    };

    if (Array.isArray(tombstones)) {
      for (const tomb of tombstones) {
        if (!tomb || !tomb.id || !tomb.entityType) continue;
        const validation = validateRecordWrite(
          authUser,
          String(tomb.entityType),
          'delete',
          null,
          String(tomb.id)
        );
        if (validation.allowed) {
          if (applySingleDelete(String(tomb.entityType), String(tomb.id))) {
            appliedCount++;
          }
        }
      }
    }

    if (Array.isArray(changes) && changes.length > 0) {
      for (const change of changes) {
        if (!change || typeof change !== 'object') continue;
        const changeId = String(change.id || `chg_${Date.now()}`);
        const entityType = String(change.entityType || '');
        const action = change.action === 'delete' ? 'delete' : 'upsert';
        const entityId = String(change.entityId || '');
        const payload = change.payload;

        if (action === 'upsert' && Array.isArray(payload)) {
          let anyApplied = false;
          let firstRejectionReason: string | null = null;
          for (const item of payload) {
            if (!item || typeof item !== 'object') continue;
            const itemKey = getEntityKey(entityType, item);
            const targetCol = (database as any)[entityType] as any[];
            const existing = Array.isArray(targetCol)
              ? targetCol.find((e) => getEntityKey(entityType, e) === itemKey)
              : undefined;
            if (existing && JSON.stringify(existing) === JSON.stringify(item)) {
              continue;
            }
            const check = validateRecordWrite(authUser, entityType, 'upsert', item, itemKey);
            if (check.allowed) {
              if (applySingleUpsert(entityType, item, itemKey)) {
                appliedCount++;
                anyApplied = true;
              }
            } else if (!firstRejectionReason) {
              firstRejectionReason = check.reason || 'غير مصرح بتعديل هذا السجل';
            }
          }
          if (anyApplied || !firstRejectionReason) {
            appliedChangeIds.push(changeId);
          } else {
            rejectedChanges.push({
              id: changeId,
              entityType,
              entityId,
              action,
              reason: firstRejectionReason,
            });
          }
          continue;
        }

        const validation = validateRecordWrite(authUser, entityType, action, payload, entityId);
        if (!validation.allowed) {
          rejectedChanges.push({
            id: changeId,
            entityType,
            entityId: entityId || getEntityKey(entityType, payload),
            action,
            reason: validation.reason || 'غير مصرح لك بتعديل هذا السجل',
          });
          continue;
        }

        if (action === 'delete') {
          applySingleDelete(entityType, entityId);
          appliedCount++;
          appliedChangeIds.push(changeId);
        } else if (action === 'upsert' && payload && typeof payload === 'object') {
          if (applySingleUpsert(entityType, payload, entityId)) {
            appliedCount++;
            appliedChangeIds.push(changeId);
          } else {
            rejectedChanges.push({
              id: changeId,
              entityType,
              entityId,
              action,
              reason: 'بيانات السجل غير مكتملة أو غير صالحة',
            });
          }
        }
      }
    }

    if (database.tombstones.length > 1000) {
      database.tombstones = database.tombstones.slice(-1000);
    }

    if (appliedCount > 0) {
      database.syncLog.unshift({
        syncId: `sync_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        clientId,
        timestamp: Date.now(),
        changesCount: appliedCount,
      });
      database.syncLog = database.syncLog.slice(0, 100);
      ensureStudentProfilesIntegrity();
      saveDatabase();
    }

    res.json({
      success: true,
      serverTimestamp: database.lastUpdated,
      appliedCount,
      appliedChangeIds,
      rejectedChanges,
      state: getFilteredStateForClient(authUser),
    });
  });

  app.post('/api/sync/reset', (req, res) => {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'يجب تسجيل الدخول كمدير نظام لتنفيذ هذا الإجراء (401 Unauthorized)',
      });
    }

    if (authUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'إعادة ضبط قاعدة البيانات محصورة بمدير النظام (Admin) فقط (403 Forbidden)',
      });
    }

    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_RESET !== 'true') {
      return res.status(403).json({
        success: false,
        error: 'إعادة الضبط الكاملة معطلة في بيئة الإنتاج لحماية بيانات المستخدمين.',
      });
    }

    database = buildSeededDefaultDb();
    ensureStudentProfilesIntegrity();

    database.auditLogs.unshift({
      id: `audit_${Date.now()}_reset`,
      userId: authUser.id,
      userName: authUser.name,
      userRole: 'admin',
      action: 'إعادة ضبط قاعدة البيانات',
      details: `قام مدير النظام (${authUser.email}) بإعادة تهيئة البيانات الافتراضية`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase();

    res.json({
      success: true,
      serverTimestamp: database.lastUpdated,
      state: getFilteredStateForClient(authUser),
    });
  });

  const distPath = path.join(process.cwd(), 'dist');
  const distIndex = path.join(distPath, 'index.html');

  if (process.env.NODE_ENV !== 'production' || !fs.existsSync(distIndex)) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(distIndex);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 YallaDars Server & Secure Sync Engine running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
