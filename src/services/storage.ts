import {
  User,
  TeacherProfile,
  StudentProfile,
  Group,
  GroupMember,
  ParentStudent,
  AttendanceRecord,
  Homework,
  GradeRecord,
  Announcement,
  StudentNote,
  AppNotification,
  AppReport,
  AttendanceStatus,
  UserRole,
  GroupStatus,
  JoinApprovalMode,
  Assessment,
  JoinRequest,
  AuditLogEntry,
  AttendanceReportSummary,
  ReminderSetting,
  TuitionPayment,
  GroupMaterial,
  StudentBadge,
  PracticeQuiz,
  QuizSubmission,
  StudentCertificate,
  PaymentStatus,
  MaterialType,
  BadgeType,
  LiveSession,
  LiveClassPlatform,
  HomeworkSubmission,
  AssistantPermissions
} from '../types';
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
  INITIAL_ASSISTANT_PERMISSIONS
} from '../data/mockInitialData';
import { syncEngine } from './syncEngine';

const STORAGE_KEYS = {
  USERS: 'yd_users_v2',
  TEACHERS: 'yd_teachers_v2',
  STUDENTS: 'yd_students_v2',
  GROUPS: 'yd_groups_v2',
  MEMBERS: 'yd_members_v2',
  PARENT_STUDENTS: 'yd_parent_students_v2',
  ATTENDANCE: 'yd_attendance_v2',
  HOMEWORK: 'yd_homework_v2',
  ASSESSMENTS: 'yd_assessments_v2',
  GRADES: 'yd_grades_v2',
  ANNOUNCEMENTS: 'yd_announcements_v2',
  NOTES: 'yd_notes_v2',
  NOTIFICATIONS: 'yd_notifications_v2',
  JOIN_REQUESTS: 'yd_join_requests_v2',
  AUDIT_LOGS: 'yd_audit_logs_v2',
  REPORTS: 'yd_reports_v2',
  REMINDER_SETTING: 'yd_reminder_setting_v2',
  CURRENT_USER: 'yd_current_user_v2',
  INITIALIZED: 'yd_initialized_v2_final',
  PAYMENTS: 'yd_payments_v2',
  MATERIALS: 'yd_materials_v2',
  BADGES: 'yd_badges_v2',
  QUIZZES: 'yd_quizzes_v2',
  QUIZ_SUBMISSIONS: 'yd_quiz_submissions_v2',
  CERTIFICATES: 'yd_certificates_v2',
  LIVE_SESSIONS: 'yd_live_sessions_v2',
  HOMEWORK_SUBMISSIONS: 'yd_homework_submissions_v2',
  ASSISTANT_PERMISSIONS: 'yd_assistant_permissions_v2',
};

class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initIfEmpty();
    syncEngine.registerStorageHandlers(
      this.importServerState.bind(this),
      this.exportAllDataForSync.bind(this)
    );
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error notifying storage listener:', e);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public exportAllDataForSync() {
    const teachers = this.getTeachers();
    const students = this.getStudentProfiles();
    return {
      users: this.getUsers(),
      teachers,
      teacherProfiles: teachers,
      students,
      studentProfiles: students,
      groups: this.getGroups(),
      members: this.getMembers(),
      parentStudents: this.getParentStudents(),
      attendance: this.getAttendance(),
      homework: this.getHomework(),
      assessments: this.getAssessments(),
      grades: this.getGrades(),
      announcements: this.getAnnouncements(),
      notes: this.getNotes(),
      notifications: this.getNotifications(),
      joinRequests: this.getJoinRequests(),
      auditLogs: this.getAuditLogs(),
      reports: this.getReports(),
      payments: this.getTuitionPayments(),
      materials: this.getMaterials(),
      badges: this.getBadges(),
      quizzes: this.getQuizzes(),
      quizSubmissions: this.getQuizSubmissions(),
      certificates: this.getCertificates(),
      liveSessions: this.getLiveSessions(),
      homeworkSubmissions: this.getHomeworkSubmissions(),
      assistantPermissions: this.getAssistantPermissions(),
      tombstones: syncEngine.getTombstones(),
    };
  }

  private getEntityRecordKey(entityType: string, item: any): string {
    if (!item || typeof item !== 'object') return '';
    switch (entityType) {
      case 'users':
      case 'auditLogs':
      case 'reports':
        return String(item.id || '');
      case 'teacherProfiles':
      case 'teachers':
        return String(item.teacherId || '');
      case 'studentProfiles':
      case 'students':
        return String(item.studentId || '');
      case 'groups':
        return String(item.groupId || '');
      case 'members':
        return item.groupId && item.studentId ? `${item.groupId}_${item.studentId}` : '';
      case 'parentStudents':
        return item.parentId && item.studentId ? `${item.parentId}_${item.studentId}` : '';
      case 'attendance':
        return String(item.attendanceId || '');
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
      case 'notifications':
        return String(item.notificationId || '');
      case 'joinRequests':
        return String(item.requestId || '');
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
        return String(item.submissionId || (item.homeworkId && item.studentId ? `hwsub_${item.homeworkId}_${item.studentId}` : ''));
      case 'assistantPermissions':
        return String(item.permissionId || (item.teacherId && item.assistantId ? `${item.teacherId}_${item.assistantId}` : ''));
      default:
        return String(item.id || '');
    }
  }

  public importServerState(serverState: any) {
    if (!serverState || typeof serverState !== 'object') return;
    if (Array.isArray(serverState.tombstones)) {
      const localTombs = syncEngine.getTombstones();
      const mergedTombs = [...localTombs];
      serverState.tombstones.forEach((t: any) => {
        if (t && t.id && t.entityType && !mergedTombs.some((lt) => lt.entityType === t.entityType && lt.id === t.id)) {
          mergedTombs.push(t);
        }
      });
      syncEngine.setTombstones(mergedTombs);
    }

    const activeTombstones = syncEngine.getTombstones();
    const pendingQueue = syncEngine.getQueue();

    const isDeleted = (entityType: string, key: string) =>
      activeTombstones.some((t) => t.entityType === entityType && t.id === key) ||
      pendingQueue.some((q) => q.entityType === entityType && q.action === 'delete' && q.entityId === key);

    const mergeWithPendingUpserts = (list: any[], entityType: string, keyFn: (item: any) => string) => {
      if (!Array.isArray(list)) return [];
      const flat = list.flat(Infinity).filter((item) => item && typeof item === 'object' && !Array.isArray(item));
      const byKey = new Map<string, any>();
      for (const item of flat) {
        const k = keyFn(item);
        if (!k || isDeleted(entityType, k)) continue;
        byKey.set(k, item);
      }
      // Overlay any pending local upserts that haven't been confirmed by the server yet
      for (const q of pendingQueue) {
        if (q.entityType === entityType && q.action === 'upsert' && q.payload && typeof q.payload === 'object') {
          const k = keyFn(q.payload) || q.entityId;
          if (k && !isDeleted(entityType, k)) {
            byKey.set(k, q.payload);
          }
        }
      }
      return Array.from(byKey.values());
    };

    if (Array.isArray(serverState.users)) {
      const existingUsers = this.getUsers();
      const serverUsers = mergeWithPendingUpserts(serverState.users, 'users', (u) => u.id).map((u) => {
        const prev = existingUsers.find((eu) => eu.id === u.id);
        return {
          ...u,
          passwordHash: u.passwordHash || prev?.passwordHash,
        };
      });
      this.set(STORAGE_KEYS.USERS, serverUsers, false);
    }
    const incomingTeachers = serverState.teacherProfiles || serverState.teachers;
    if (Array.isArray(incomingTeachers)) {
      const mergedTeachers = mergeWithPendingUpserts(incomingTeachers, 'teacherProfiles', (t) => t.teacherId);
      this.set(STORAGE_KEYS.TEACHERS, mergedTeachers, false);
    }
    const incomingStudents = serverState.studentProfiles || serverState.students;
    if (Array.isArray(incomingStudents)) {
      const mergedStudents = mergeWithPendingUpserts(incomingStudents, 'studentProfiles', (s) => s.studentId);
      this.set(STORAGE_KEYS.STUDENTS, mergedStudents, false);
    }
    if (Array.isArray(serverState.groups)) {
      this.set(STORAGE_KEYS.GROUPS, mergeWithPendingUpserts(serverState.groups, 'groups', (g) => g.groupId), false);
    }
    if (Array.isArray(serverState.members)) {
      this.set(
        STORAGE_KEYS.MEMBERS,
        mergeWithPendingUpserts(serverState.members, 'members', (m) => `${m.groupId}_${m.studentId}`),
        false
      );
    }
    if (Array.isArray(serverState.parentStudents)) {
      this.set(
        STORAGE_KEYS.PARENT_STUDENTS,
        mergeWithPendingUpserts(serverState.parentStudents, 'parentStudents', (ps) => `${ps.parentId}_${ps.studentId}`),
        false
      );
    }
    if (Array.isArray(serverState.attendance)) {
      this.set(STORAGE_KEYS.ATTENDANCE, mergeWithPendingUpserts(serverState.attendance, 'attendance', (a) => a.attendanceId), false);
    }
    if (Array.isArray(serverState.homework)) {
      this.set(STORAGE_KEYS.HOMEWORK, mergeWithPendingUpserts(serverState.homework, 'homework', (h) => h.homeworkId), false);
    }
    if (Array.isArray(serverState.assessments)) {
      this.set(STORAGE_KEYS.ASSESSMENTS, mergeWithPendingUpserts(serverState.assessments, 'assessments', (a) => a.assessmentId), false);
    }
    if (Array.isArray(serverState.grades)) {
      this.set(STORAGE_KEYS.GRADES, mergeWithPendingUpserts(serverState.grades, 'grades', (g) => g.gradeId), false);
    }
    if (Array.isArray(serverState.announcements)) {
      this.set(STORAGE_KEYS.ANNOUNCEMENTS, mergeWithPendingUpserts(serverState.announcements, 'announcements', (a) => a.announcementId), false);
    }
    if (Array.isArray(serverState.notes)) {
      this.set(STORAGE_KEYS.NOTES, mergeWithPendingUpserts(serverState.notes, 'notes', (n) => n.noteId), false);
    }
    if (Array.isArray(serverState.notifications)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, mergeWithPendingUpserts(serverState.notifications, 'notifications', (n) => n.notificationId), false);
    }
    if (Array.isArray(serverState.joinRequests)) {
      this.set(STORAGE_KEYS.JOIN_REQUESTS, mergeWithPendingUpserts(serverState.joinRequests, 'joinRequests', (r) => r.requestId), false);
    }
    if (Array.isArray(serverState.auditLogs)) {
      this.set(STORAGE_KEYS.AUDIT_LOGS, mergeWithPendingUpserts(serverState.auditLogs, 'auditLogs', (l) => l.id), false);
    }
    if (Array.isArray(serverState.reports)) {
      this.set(STORAGE_KEYS.REPORTS, mergeWithPendingUpserts(serverState.reports, 'reports', (r) => r.id), false);
    }
    if (Array.isArray(serverState.payments)) {
      this.set(STORAGE_KEYS.PAYMENTS, mergeWithPendingUpserts(serverState.payments, 'payments', (p) => p.paymentId), false);
    }
    if (Array.isArray(serverState.materials)) {
      this.set(STORAGE_KEYS.MATERIALS, mergeWithPendingUpserts(serverState.materials, 'materials', (m) => m.materialId), false);
    }
    if (Array.isArray(serverState.badges)) {
      this.set(STORAGE_KEYS.BADGES, mergeWithPendingUpserts(serverState.badges, 'badges', (b) => b.badgeId), false);
    }
    if (Array.isArray(serverState.quizzes)) {
      this.set(STORAGE_KEYS.QUIZZES, mergeWithPendingUpserts(serverState.quizzes, 'quizzes', (q) => q.quizId), false);
    }
    if (Array.isArray(serverState.quizSubmissions)) {
      this.set(STORAGE_KEYS.QUIZ_SUBMISSIONS, mergeWithPendingUpserts(serverState.quizSubmissions, 'quizSubmissions', (s) => s.submissionId), false);
    }
    if (Array.isArray(serverState.certificates)) {
      this.set(STORAGE_KEYS.CERTIFICATES, mergeWithPendingUpserts(serverState.certificates, 'certificates', (c) => c.certificateId), false);
    }
    if (Array.isArray(serverState.liveSessions)) {
      this.set(STORAGE_KEYS.LIVE_SESSIONS, mergeWithPendingUpserts(serverState.liveSessions, 'liveSessions', (s) => s.sessionId), false);
    }
    if (Array.isArray(serverState.homeworkSubmissions)) {
      this.set(
        STORAGE_KEYS.HOMEWORK_SUBMISSIONS,
        mergeWithPendingUpserts(serverState.homeworkSubmissions, 'homeworkSubmissions', (s) => s.submissionId || `hwsub_${s.homeworkId}_${s.studentId}`),
        false
      );
    }
    if (Array.isArray(serverState.assistantPermissions)) {
      this.set(
        STORAGE_KEYS.ASSISTANT_PERMISSIONS,
        mergeWithPendingUpserts(serverState.assistantPermissions, 'assistantPermissions', (p) => p.permissionId || `${p.teacherId}_${p.assistantId}`),
        false
      );
    }
    this.repairParentStudentLinks(false);
    this.notify();
  }

  public initIfEmpty(forceReset = false) {
    if (typeof window === 'undefined') return;

    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized || forceReset) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(INITIAL_GROUPS));
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
      localStorage.setItem(STORAGE_KEYS.PARENT_STUDENTS, JSON.stringify(INITIAL_PARENT_STUDENTS));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
      localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(INITIAL_HOMEWORK));
      localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(INITIAL_ASSESSMENTS));
      localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(INITIAL_GRADES));
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(INITIAL_NOTES));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      localStorage.setItem(STORAGE_KEYS.JOIN_REQUESTS, JSON.stringify(INITIAL_JOIN_REQUESTS));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(INITIAL_MATERIALS));
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(INITIAL_BADGES));
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(INITIAL_QUIZZES));
      localStorage.setItem(STORAGE_KEYS.QUIZ_SUBMISSIONS, JSON.stringify(INITIAL_QUIZ_SUBMISSIONS));
      localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(INITIAL_CERTIFICATES));
      localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(INITIAL_LIVE_SESSIONS));
      localStorage.setItem(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, JSON.stringify(INITIAL_HOMEWORK_SUBMISSIONS));
      localStorage.setItem(STORAGE_KEYS.ASSISTANT_PERMISSIONS, JSON.stringify(INITIAL_ASSISTANT_PERMISSIONS));
      localStorage.setItem(
        STORAGE_KEYS.REMINDER_SETTING,
        JSON.stringify({ enabled: true, minutesBefore: 30 })
      );
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      this.notify();
    } else {
      if (!localStorage.getItem(STORAGE_KEYS.HOMEWORK_SUBMISSIONS)) {
        localStorage.setItem(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, JSON.stringify(INITIAL_HOMEWORK_SUBMISSIONS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ASSISTANT_PERMISSIONS)) {
        localStorage.setItem(STORAGE_KEYS.ASSISTANT_PERMISSIONS, JSON.stringify(INITIAL_ASSISTANT_PERMISSIONS));
      }
      // Clean any legacy nested arrays in localStorage without re-injecting unfiltered seed data
      try {
        const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        if (storedUsers) {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.some((x: any) => Array.isArray(x))) {
            const cleaned = parsed.flat(Infinity).filter((x: any) => x && typeof x === 'object' && !Array.isArray(x));
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleaned));
          }
        }
        this.repairParentStudentLinks(false);
      } catch {}
    }
  }

  public generateUniqueLinkingCode(existingProfiles?: StudentProfile[]): string {
    const profiles = existingProfiles || this.getStudentProfiles();
    const usedCodes = new Set(
      profiles.map((p) => (p.linkingCode || '').trim().toUpperCase()).filter(Boolean)
    );
    // Reserve all initial demo codes so a newly registered student never gets a demo code
    INITIAL_STUDENTS.forEach((s) => usedCodes.add(s.linkingCode.toUpperCase()));

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 100; attempt++) {
      let randomPart = '';
      for (let i = 0; i < 4; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const candidate = `YD-LK-${randomPart}`;
      if (!usedCodes.has(candidate)) {
        return candidate;
      }
    }
    return `YD-LK-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  }

  public repairParentStudentLinks(shouldSaveToSync = false): void {
    const users = this.getUsers();
    const students = this.getStudentProfiles();
    let studentsChanged = false;

    // 1. Ensure every student user has a StudentProfile with a unique linkingCode
    const seenCodes = new Set<string>();
    // Reserve YD-LK-1001 strictly for user_student_1
    for (const s of students) {
      if (s.studentId === 'user_student_1') {
        if (s.linkingCode !== 'YD-LK-1001') {
          s.linkingCode = 'YD-LK-1001';
          studentsChanged = true;
        }
        seenCodes.add('YD-LK-1001');
      }
    }

    for (const s of students) {
      if (s.studentId === 'user_student_1') continue;
      const normCode = (s.linkingCode || '').trim().toUpperCase();
      if (!normCode || normCode === 'YD-LK-1001' || seenCodes.has(normCode)) {
        s.linkingCode = this.generateUniqueLinkingCode(students);
        studentsChanged = true;
      }
      seenCodes.add(s.linkingCode.toUpperCase());
    }

    for (const u of users) {
      if (u.role === 'student' && !students.some((s) => s.studentId === u.id)) {
        const newCode = this.generateUniqueLinkingCode(students);
        seenCodes.add(newCode);
        students.push({
          studentId: u.id,
          grade: 'الصف الأول الثانوي',
          school: 'مدرسة حكومية',
          linkingCode: newCode,
        });
        studentsChanged = true;
      }
    }

    if (studentsChanged) {
      this.set(STORAGE_KEYS.STUDENTS, students, shouldSaveToSync);
    }

    // 2. Keep studentName, grade, and school in sync with canonical user & profile records
    const parentStudents = this.getParentStudents();
    let psChanged = false;

    for (const ps of parentStudents) {
      const su = users.find((u) => u.id === ps.studentId);
      const sp = students.find((s) => s.studentId === ps.studentId);
      if (su && su.name && ps.studentName !== su.name) {
        ps.studentName = su.name;
        psChanged = true;
      }
      if (sp && sp.grade && ps.grade !== sp.grade) {
        ps.grade = sp.grade;
        psChanged = true;
      }
      if (sp && sp.school && ps.school !== sp.school) {
        ps.school = sp.school;
        psChanged = true;
      }
    }

    if (psChanged) {
      this.set(STORAGE_KEYS.PARENT_STUDENTS, parentStudents, shouldSaveToSync);
    }
  }

  public resetToDefaultDemo() {
    this.initIfEmpty(true);
    syncEngine.resetCloudData();
  }

  private get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const flattened = parsed.flat(Infinity);
        return flattened.filter((item: any) => item && typeof item === 'object' && !Array.isArray(item)) as unknown as T;
      }
      return parsed as T;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T, shouldEnqueueSync = true): void {
    if (typeof window === 'undefined') return;
    const sanitizedValue = Array.isArray(value)
      ? (value.flat(Infinity).filter((item: any) => item && typeof item === 'object' && !Array.isArray(item)) as unknown as T)
      : value;

    const keyMap: Record<string, string> = {
      [STORAGE_KEYS.USERS]: 'users',
      [STORAGE_KEYS.TEACHERS]: 'teacherProfiles',
      [STORAGE_KEYS.STUDENTS]: 'studentProfiles',
      [STORAGE_KEYS.GROUPS]: 'groups',
      [STORAGE_KEYS.MEMBERS]: 'members',
      [STORAGE_KEYS.PARENT_STUDENTS]: 'parentStudents',
      [STORAGE_KEYS.ATTENDANCE]: 'attendance',
      [STORAGE_KEYS.HOMEWORK]: 'homework',
      [STORAGE_KEYS.ASSESSMENTS]: 'assessments',
      [STORAGE_KEYS.GRADES]: 'grades',
      [STORAGE_KEYS.ANNOUNCEMENTS]: 'announcements',
      [STORAGE_KEYS.NOTES]: 'notes',
      [STORAGE_KEYS.NOTIFICATIONS]: 'notifications',
      [STORAGE_KEYS.JOIN_REQUESTS]: 'joinRequests',
      [STORAGE_KEYS.AUDIT_LOGS]: 'auditLogs',
      [STORAGE_KEYS.REPORTS]: 'reports',
      [STORAGE_KEYS.PAYMENTS]: 'payments',
      [STORAGE_KEYS.MATERIALS]: 'materials',
      [STORAGE_KEYS.BADGES]: 'badges',
      [STORAGE_KEYS.QUIZZES]: 'quizzes',
      [STORAGE_KEYS.QUIZ_SUBMISSIONS]: 'quizSubmissions',
      [STORAGE_KEYS.CERTIFICATES]: 'certificates',
      [STORAGE_KEYS.LIVE_SESSIONS]: 'liveSessions',
      [STORAGE_KEYS.HOMEWORK_SUBMISSIONS]: 'homeworkSubmissions',
      [STORAGE_KEYS.ASSISTANT_PERMISSIONS]: 'assistantPermissions',
    };

    const entityType = keyMap[key];
    let previousItemsMap = new Map<string, string>();
    if (shouldEnqueueSync && entityType && Array.isArray(sanitizedValue)) {
      const prevArr = this.get<any[]>(key, []);
      for (const prevItem of prevArr) {
        const k = this.getEntityRecordKey(entityType, prevItem);
        if (k) {
          previousItemsMap.set(k, JSON.stringify(prevItem));
        }
      }
    }

    localStorage.setItem(key, JSON.stringify(sanitizedValue));

    if (shouldEnqueueSync && entityType && Array.isArray(sanitizedValue)) {
      for (const item of sanitizedValue) {
        const recordKey = this.getEntityRecordKey(entityType, item);
        if (!recordKey) continue;
        const serialized = JSON.stringify(item);
        if (previousItemsMap.get(recordKey) !== serialized) {
          if (entityType === 'users') {
            const { passwordHash, ...safeUser } = item as any;
            syncEngine.enqueueChange(entityType, 'upsert', recordKey, safeUser);
          } else {
            syncEngine.enqueueChange(entityType, 'upsert', recordKey, item);
          }
        }
      }
    }

    this.notify();
  }

  // --- Auth / Current User ---
  public getCurrentUser(): User | null {
    return this.get<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  public setCurrentUser(user: User | null): void {
    if (typeof window === 'undefined') return;
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      this.notify();
      return;
    }
    this.set(STORAGE_KEYS.CURRENT_USER, user, false);
  }

  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, []);
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  private hashPasswordLocal(password: string): string {
    // Deterministic salted hash for offline verification compatibility
    const salted = `yalladars_salt_2026:${password}`;
    let h1 = 0xdeadbeef ^ salted.length;
    let h2 = 0x41c6ce57 ^ salted.length;
    for (let i = 0, ch; i < salted.length; i++) {
      ch = salted.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hex = (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
    return `local$${hex}`;
  }

  private verifyPasswordLocal(password: string, storedHash?: string): boolean {
    if (!password) return false;
    if (!storedHash || storedHash.startsWith('scrypt$')) {
      // Initial demo accounts default password is '123456' when offline
      return password === '123456';
    }
    if (storedHash.startsWith('local$')) {
      return this.hashPasswordLocal(password) === storedHash;
    }
    return storedHash === password;
  }

  public registerUser(params: {
    id?: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    phone?: string;
    subject?: string;
    city?: string;
    grade?: string;
    school?: string;
    linkingCode?: string;
  }): { success: boolean; user?: User; linkingCode?: string; error?: string } {
    const users = this.getUsers();
    const cleanEmail = params.email.trim().toLowerCase();

    if (!params.name.trim()) {
      return { success: false, error: 'الاسم مطلوب' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'البريد الإلكتروني غير صحيح' };
    }
    if (!params.password || params.password.length < 6) {
      return { success: false, error: 'كلمة المرور مطلوبة ويجب ألا تقل عن 6 أحرف' };
    }

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً' };
    }

    const newId = params.id || `user_${params.role}_${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: params.name.trim(),
      email: cleanEmail,
      role: params.role,
      phone: params.phone?.trim() || '',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      passwordHash: this.hashPasswordLocal(params.password),
    };

    users.push(newUser);
    this.set(STORAGE_KEYS.USERS, users);

    let generatedLinkingCode: string | undefined;

    // Profile specifics
    if (params.role === 'teacher') {
      const teachers = this.get<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, []);
      teachers.push({
        teacherId: newId,
        subject: params.subject?.trim() || 'عام',
        grades: params.grade ? [params.grade] : ['المرحلة الثانوية'],
        city: params.city?.trim() || 'القاهرة',
      });
      this.set(STORAGE_KEYS.TEACHERS, teachers);
    } else if (params.role === 'student') {
      const students = this.get<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
      generatedLinkingCode = params.linkingCode || this.generateUniqueLinkingCode(students);
      students.push({
        studentId: newId,
        grade: params.grade?.trim() || 'الصف الأول الثانوي',
        school: params.school?.trim() || 'مدرسة حكومية',
        linkingCode: generatedLinkingCode,
      });
      this.set(STORAGE_KEYS.STUDENTS, students);
    } else if (params.role === 'assistant') {
      const perms = this.get<AssistantPermissions[]>(STORAGE_KEYS.ASSISTANT_PERMISSIONS, []);
      const defaultTeacherId = 'user_teacher_1';
      perms.push({
        permissionId: `${defaultTeacherId}_${newId}`,
        teacherId: defaultTeacherId,
        assistantId: newId,
        assistantName: newUser.name,
        assistantEmail: newUser.email,
        allowedGroupIds: this.getGroupsByTeacher(defaultTeacherId).map((g) => g.groupId),
        canRecordAttendance: true,
        canSearchStudents: true,
        canManagePayments: false,
        canManageJoinRequests: false,
        canManageHomework: false,
        updatedAt: new Date().toISOString(),
      });
      this.set(STORAGE_KEYS.ASSISTANT_PERMISSIONS, perms);
    }

    this.setCurrentUser(newUser);
    return { success: true, user: newUser, linkingCode: generatedLinkingCode };
  }

  public getTeachers(): TeacherProfile[] {
    return this.get<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, []);
  }

  public getTeacherProfile(teacherId: string): TeacherProfile | undefined {
    return this.getTeachers().find((t) => t.teacherId === teacherId);
  }

  public updateUserProfile(userId: string, updates: Partial<User>): boolean {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      this.set(STORAGE_KEYS.USERS, users);
      const curr = this.getCurrentUser();
      if (curr && curr.id === userId) {
        this.setCurrentUser(users[idx]);
      }
      return true;
    }
    return false;
  }

  public updateTeacherProfile(teacherId: string, updates: Partial<TeacherProfile>): boolean {
    const teachers = this.getTeachers();
    const idx = teachers.findIndex((t) => t.teacherId === teacherId);
    if (idx >= 0) {
      teachers[idx] = { ...teachers[idx], ...updates };
      this.set(STORAGE_KEYS.TEACHERS, teachers);
      return true;
    }
    return false;
  }

  public updateStudentProfile(studentId: string, updates: Partial<StudentProfile>): boolean {
    const students = this.getStudentProfiles();
    const idx = students.findIndex((s) => s.studentId === studentId);
    if (idx >= 0) {
      students[idx] = { ...students[idx], ...updates };
      this.set(STORAGE_KEYS.STUDENTS, students);
      return true;
    }
    return false;
  }

  public loginUser(
    email: string,
    password?: string,
    isDemoQuickLogin = false
  ): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      return { success: false, error: 'الحساب غير موجود، يرجى إنشاء حساب جديد' };
    }
    if (found.status === 'suspended') {
      return { success: false, error: 'تم تعطيل هذا الحساب من قبل الإدارة' };
    }

    if (!isDemoQuickLogin) {
      if (!password) {
        return { success: false, error: 'يرجى إدخال كلمة المرور' };
      }
      if (!this.verifyPasswordLocal(password, found.passwordHash)) {
        return { success: false, error: 'كلمة المرور غير صحيحة' };
      }
    }

    this.setCurrentUser(found);
    return { success: true, user: found };
  }

  public changeUserPassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): { success: boolean; error?: string } {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'كلمة المرور الجديدة يجب أن تتكون من 6 أحرف على الأقل' };
    }
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) {
      return { success: false, error: 'المستخدم غير موجود' };
    }
    if (currentPassword && !this.verifyPasswordLocal(currentPassword, users[idx].passwordHash)) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
    }
    users[idx].passwordHash = this.hashPasswordLocal(newPassword);
    this.set(STORAGE_KEYS.USERS, users);
    this.addAuditLog({
      userId,
      userName: users[idx].name,
      userRole: users[idx].role,
      action: 'تغيير كلمة المرور',
      details: 'تم تحديث كلمة المرور وتشفيرها بنجاح',
    });
    return { success: true };
  }

  // --- Groups ---
  public getGroups(): Group[] {
    return this.get<Group[]>(STORAGE_KEYS.GROUPS, []);
  }

  public getGroupsByTeacher(teacherId: string): Group[] {
    return this.getGroups().filter((g) => g.teacherId === teacherId);
  }

  public getGroupById(groupId: string): Group | undefined {
    return this.getGroups().find((g) => g.groupId === groupId);
  }

  public createGroup(params: {
    teacherId: string;
    teacherName: string;
    name: string;
    subject: string;
    grade: string;
    location: string;
    days: string[];
    startTime: string;
    durationMinutes: number;
    joinApprovalMode?: JoinApprovalMode;
  }): { success: boolean; group?: Group; error?: string } {
    if (!params.name.trim()) return { success: false, error: 'اسم المجموعة مطلوب' };
    if (!params.subject.trim()) return { success: false, error: 'المادة مطلوبة' };

    const groups = this.getGroups();
    let joinCode = `YD-${Math.floor(1000 + Math.random() * 9000)}`;
    while (groups.some((g) => g.joinCode === joinCode)) {
      joinCode = `YD-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const newGroup: Group = {
      groupId: `group_${Date.now()}`,
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      name: params.name.trim(),
      subject: params.subject.trim(),
      grade: params.grade.trim() || 'الصف الأول الثانوي',
      location: params.location.trim() || 'السنتر',
      days: params.days.length > 0 ? params.days : ['السبت'],
      startTime: params.startTime || '05:00 م',
      durationMinutes: params.durationMinutes || 90,
      joinCode,
      status: 'active',
      joinApprovalMode: params.joinApprovalMode || 'auto',
      createdAt: new Date().toISOString(),
    };

    groups.unshift(newGroup);
    this.set(STORAGE_KEYS.GROUPS, groups);

    this.addAuditLog({
      userId: params.teacherId,
      userName: params.teacherName,
      userRole: 'teacher',
      action: 'إنشاء مجموعة جديدة',
      details: `تم إنشاء المجموعة ${newGroup.name} بكود انضمام ${newGroup.joinCode}`,
    });

    return { success: true, group: newGroup };
  }

  public toggleGroupStatus(groupId: string): { success: boolean; newStatus?: GroupStatus; error?: string } {
    const groups = this.getGroups();
    const target = groups.find((g) => g.groupId === groupId);
    if (!target) return { success: false, error: 'المجموعة غير موجودة' };

    const newStatus: GroupStatus = target.status === 'active' ? 'paused' : 'active';
    target.status = newStatus;
    this.set(STORAGE_KEYS.GROUPS, groups);

    const curr = this.getCurrentUser();
    this.addAuditLog({
      userId: curr?.id || target.teacherId,
      userName: curr?.name || target.teacherName,
      userRole: 'teacher',
      action: newStatus === 'paused' ? 'إيقاف مجموعة مؤقتاً' : 'تفعيل مجموعة',
      details: `تم تعديل حالة المجموعة ${target.name} إلى ${newStatus === 'paused' ? 'متوقفة' : 'نشطة'}`,
    });

    return { success: true, newStatus };
  }

  public setGroupApprovalMode(groupId: string, mode: JoinApprovalMode): boolean {
    const groups = this.getGroups();
    const target = groups.find((g) => g.groupId === groupId);
    if (!target) return false;

    target.joinApprovalMode = mode;
    this.set(STORAGE_KEYS.GROUPS, groups);
    return true;
  }

  public regenerateGroupJoinCode(groupId: string): { success: boolean; newCode?: string; error?: string } {
    const groups = this.getGroups();
    const target = groups.find((g) => g.groupId === groupId);
    if (!target) return { success: false, error: 'المجموعة غير موجودة' };

    let newCode = `YD-${Math.floor(1000 + Math.random() * 9000)}`;
    while (groups.some((g) => g.joinCode === newCode)) {
      newCode = `YD-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const oldCode = target.joinCode;
    target.joinCode = newCode;
    this.set(STORAGE_KEYS.GROUPS, groups);

    const curr = this.getCurrentUser();
    this.addAuditLog({
      userId: curr?.id || target.teacherId,
      userName: curr?.name || target.teacherName,
      userRole: 'teacher',
      action: 'تغيير كود انضمام المجموعة',
      details: `تم تغيير كود المجموعة (${target.name}) من ${oldCode} إلى ${newCode}`,
    });

    return { success: true, newCode };
  }

  public deleteGroup(groupId: string): { success: boolean; error?: string } {
    const groups = this.getGroups();
    const target = groups.find((g) => g.groupId === groupId);
    if (!target) return { success: false, error: 'المجموعة غير موجودة' };

    const curr = this.getCurrentUser();
    syncEngine.addTombstone('groups', groupId, curr?.id);
    const filtered = groups.filter((g) => g.groupId !== groupId);
    this.set(STORAGE_KEYS.GROUPS, filtered);

    this.addAuditLog({
      userId: curr?.id || target.teacherId,
      userName: curr?.name || target.teacherName,
      userRole: 'teacher',
      action: 'حذف مجموعة',
      details: `تم حذف المجموعة (${target.name}) نهائياً`,
    });

    return { success: true };
  }

  public updateGroup(groupId: string, updates: Partial<Group>): { success: boolean; group?: Group; error?: string } {
    const groups = this.getGroups();
    const target = groups.find((g) => g.groupId === groupId);
    if (!target) return { success: false, error: 'المجموعة غير موجودة' };
    Object.assign(target, updates);
    this.set(STORAGE_KEYS.GROUPS, groups);
    return { success: true, group: target };
  }

  // --- Assistant Permissions Management ---
  public getAssistantPermissions(): AssistantPermissions[] {
    return this.get<AssistantPermissions[]>(STORAGE_KEYS.ASSISTANT_PERMISSIONS, []);
  }

  public getAssistantPermissionsForTeacher(teacherId: string): AssistantPermissions[] {
    const allPerms = this.getAssistantPermissions();
    const assistantUsers = this.getUsers().filter((u) => u.role === 'assistant' && u.status === 'active');
    const teacherGroups = this.getGroupsByTeacher(teacherId).map((g) => g.groupId);

    const result: AssistantPermissions[] = [];
    for (const assistant of assistantUsers) {
      const existing = allPerms.find(
        (p) => p.teacherId === teacherId && p.assistantId === assistant.id
      );
      if (existing) {
        result.push({
          ...existing,
          assistantName: assistant.name,
          assistantEmail: assistant.email,
        });
      } else {
        result.push({
          permissionId: `${teacherId}_${assistant.id}`,
          teacherId,
          assistantId: assistant.id,
          assistantName: assistant.name,
          assistantEmail: assistant.email,
          allowedGroupIds: teacherGroups,
          canRecordAttendance: true,
          canSearchStudents: true,
          canManagePayments: false,
          canManageJoinRequests: false,
          canManageHomework: false,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    return result;
  }

  public getEffectiveAssistantPermissions(assistantId: string, teacherId = 'user_teacher_1'): AssistantPermissions {
    const allPerms = this.getAssistantPermissions();
    const existing =
      allPerms.find((p) => p.assistantId === assistantId && p.teacherId === teacherId) ||
      allPerms.find((p) => p.assistantId === assistantId);
    if (existing) return existing;

    const assistantUser = this.getUserById(assistantId);
    return {
      permissionId: `${teacherId}_${assistantId}`,
      teacherId,
      assistantId,
      assistantName: assistantUser?.name || 'مساعد المدرس',
      assistantEmail: assistantUser?.email,
      allowedGroupIds: this.getGroupsByTeacher(teacherId).map((g) => g.groupId),
      canRecordAttendance: true,
      canSearchStudents: true,
      canManagePayments: false,
      canManageJoinRequests: false,
      canManageHomework: false,
      updatedAt: new Date().toISOString(),
    };
  }

  public saveAssistantPermissions(
    params: Omit<AssistantPermissions, 'permissionId' | 'updatedAt'>
  ): AssistantPermissions {
    const allPerms = this.getAssistantPermissions();
    const permissionId = `${params.teacherId}_${params.assistantId}`;
    const updatedRecord: AssistantPermissions = {
      ...params,
      permissionId,
      updatedAt: new Date().toISOString(),
    };

    const idx = allPerms.findIndex((p) => p.permissionId === permissionId);
    if (idx >= 0) {
      allPerms[idx] = updatedRecord;
    } else {
      allPerms.push(updatedRecord);
    }

    this.set(STORAGE_KEYS.ASSISTANT_PERMISSIONS, allPerms);

    const curr = this.getCurrentUser();
    this.addAuditLog({
      userId: curr?.id || params.teacherId,
      userName: curr?.name || 'المدرس',
      userRole: 'teacher',
      action: 'تحديث صلاحيات المساعد',
      details: `تم تحديث صلاحيات المساعد (${params.assistantName}) — الحضور: ${params.canRecordAttendance ? 'نعم' : 'لا'}، المصروفات: ${params.canManagePayments ? 'نعم' : 'لا'}، الطلبات: ${params.canManageJoinRequests ? 'نعم' : 'لا'}، الواجبات: ${params.canManageHomework ? 'نعم' : 'لا'}`,
    });

    return updatedRecord;
  }

  // --- Members / Join Code & Approval Flow ---
  public getMembers(): GroupMember[] {
    return this.get<GroupMember[]>(STORAGE_KEYS.MEMBERS, []);
  }

  public getMembersByGroup(groupId: string): GroupMember[] {
    return this.getMembers().filter((m) => m.groupId === groupId && m.status === 'active');
  }

  public getGroupsForStudent(studentId: string): Group[] {
    const memberGroupIds = this.getMembers()
      .filter((m) => m.studentId === studentId && m.status === 'active')
      .map((m) => m.groupId);
    return this.getGroups().filter((g) => memberGroupIds.includes(g.groupId));
  }

  public getJoinRequests(): JoinRequest[] {
    return this.get<JoinRequest[]>(STORAGE_KEYS.JOIN_REQUESTS, []);
  }

  public getPendingJoinRequestsForTeacher(teacherId: string): JoinRequest[] {
    return this.getJoinRequests().filter((r) => r.teacherId === teacherId && r.status === 'pending');
  }

  public getJoinRequestsByGroup(groupId: string): JoinRequest[] {
    return this.getJoinRequests().filter((r) => r.groupId === groupId && r.status === 'pending');
  }

  public joinGroupByCode(student: User, joinCode: string): {
    success: boolean;
    group?: Group;
    pendingApproval?: boolean;
    error?: string;
  } {
    const cleanCode = joinCode.trim().toUpperCase();
    const group = this.getGroups().find((g) => g.joinCode.toUpperCase() === cleanCode);

    if (!group) {
      return { success: false, error: 'كود الانضمام غير صحيح، تأكد من الكود وأعد المحاولة' };
    }

    if (group.status === 'paused') {
      return { success: false, error: 'هذه المجموعة متوقفة حالياً عن قبول انضمام طلاب جدد' };
    }

    const members = this.getMembers();
    const alreadyMember = members.some(
      (m) => m.groupId === group.groupId && m.studentId === student.id && m.status === 'active'
    );

    if (alreadyMember) {
      return { success: false, error: 'أنت منضم بالفعل إلى هذه المجموعة!' };
    }

    const studentProfile = this.getStudentProfiles().find((s) => s.studentId === student.id);

    // If requires approval, create JoinRequest
    if (group.joinApprovalMode === 'requires_approval') {
      const requests = this.getJoinRequests();
      const existingReq = requests.find(
        (r) => r.groupId === group.groupId && r.studentId === student.id && r.status === 'pending'
      );
      if (existingReq) {
        return { success: false, error: 'طلب انضمامك قيد المراجعة لدى المدرس بالفعل' };
      }

      requests.unshift({
        requestId: `req_${Date.now()}`,
        groupId: group.groupId,
        groupName: group.name,
        teacherId: group.teacherId,
        studentId: student.id,
        studentName: student.name,
        studentGrade: studentProfile?.grade || group.grade,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      });
      this.set(STORAGE_KEYS.JOIN_REQUESTS, requests);

      // Notify teacher
      this.addNotification({
        userId: group.teacherId,
        title: 'طلب انضمام جديد',
        body: `طلب الطالب (${student.name}) الانضمام إلى مجموعة: ${group.name}`,
        type: 'request',
      });

      return { success: true, group, pendingApproval: true };
    }

    // Auto join directly
    members.push({
      groupId: group.groupId,
      studentId: student.id,
      studentName: student.name,
      studentGrade: studentProfile?.grade || group.grade,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'active',
    });

    this.set(STORAGE_KEYS.MEMBERS, members);

    this.addNotification({
      userId: student.id,
      title: 'تم الانضمام بنجاح',
      body: `انضممت بنجاح إلى مجموعة: ${group.name} للأستاذ ${group.teacherName}`,
      type: 'session',
    });

    return { success: true, group, pendingApproval: false };
  }

  public handleJoinRequest(requestId: string, action: 'accept' | 'reject'): { success: boolean; error?: string } {
    const requests = this.getJoinRequests();
    const req = requests.find((r) => r.requestId === requestId);
    if (!req) return { success: false, error: 'الطلب غير موجود' };

    req.status = action === 'accept' ? 'accepted' : 'rejected';
    this.set(STORAGE_KEYS.JOIN_REQUESTS, requests);

    if (action === 'accept') {
      const members = this.getMembers();
      if (!members.some((m) => m.groupId === req.groupId && m.studentId === req.studentId)) {
        members.push({
          groupId: req.groupId,
          studentId: req.studentId,
          studentName: req.studentName,
          studentGrade: req.studentGrade,
          joinedAt: new Date().toISOString().split('T')[0],
          status: 'active',
        });
        this.set(STORAGE_KEYS.MEMBERS, members);
      }

      this.addNotification({
        userId: req.studentId,
        title: 'تم قبول طلب الانضمام',
        body: `وافق المدرس على طلب انضمامك إلى مجموعة: ${req.groupName}`,
        type: 'session',
      });
    }

    return { success: true };
  }

  // --- Student Profiles & Parent Linking ---
  public getStudentProfiles(): StudentProfile[] {
    return this.get<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
  }

  public getStudentProfile(studentId: string): StudentProfile | undefined {
    const profiles = this.getStudentProfiles();
    const existing = profiles.find((s) => s.studentId === studentId);
    if (existing) {
      // Ensure non-demo students never accidentally share YD-LK-1001
      if (studentId !== 'user_student_1' && existing.linkingCode === 'YD-LK-1001') {
        existing.linkingCode = this.generateUniqueLinkingCode(profiles);
        this.set(STORAGE_KEYS.STUDENTS, profiles);
      }
      return existing;
    }

    // Auto-create StudentProfile if a student user exists without a profile
    const user = this.getUserById(studentId) || (this.getCurrentUser()?.id === studentId ? this.getCurrentUser() : undefined);
    if (user && user.role === 'student') {
      const newProfile: StudentProfile = {
        studentId: user.id,
        grade: 'الصف الأول الثانوي',
        school: 'مدرسة حكومية',
        linkingCode: studentId === 'user_student_1' ? 'YD-LK-1001' : this.generateUniqueLinkingCode(profiles),
      };
      profiles.push(newProfile);
      this.set(STORAGE_KEYS.STUDENTS, profiles);
      return newProfile;
    }
    return undefined;
  }

  public regenerateStudentLinkingCode(studentId: string): string {
    const profiles = this.getStudentProfiles();
    let prof = profiles.find((s) => s.studentId === studentId);
    const newCode = this.generateUniqueLinkingCode(profiles);
    if (prof) {
      prof.linkingCode = newCode;
      this.set(STORAGE_KEYS.STUDENTS, profiles);
    } else {
      prof = {
        studentId,
        grade: 'الصف الأول الثانوي',
        school: 'مدرسة حكومية',
        linkingCode: newCode,
      };
      profiles.push(prof);
      this.set(STORAGE_KEYS.STUDENTS, profiles);
    }
    const studentUser = this.getUserById(studentId);
    this.addAuditLog({
      userId: studentId,
      userName: studentUser?.name || 'طالب',
      userRole: 'student',
      action: 'توليد كود ربط جديد',
      details: `تم تجديد كود الربط إلى ${newCode}`,
    });
    return newCode;
  }

  public getParentStudents(): ParentStudent[] {
    return this.get<ParentStudent[]>(STORAGE_KEYS.PARENT_STUDENTS, []);
  }

  public getStudentsForParent(parentId: string): ParentStudent[] {
    return this.getParentStudents().filter((ps) => ps.parentId === parentId && ps.status === 'active');
  }

  public previewStudentByLinkingCode(
    linkingCode: string,
    parentId?: string
  ): {
    found: boolean;
    studentId?: string;
    studentName?: string;
    grade?: string;
    school?: string;
    alreadyLinked?: boolean;
  } {
    const cleanCode = linkingCode.trim().toUpperCase();
    if (!cleanCode) return { found: false };
    // Ensure all registered students have profiles before searching
    this.repairParentStudentLinks(false);
    const studentProfile = this.getStudentProfiles().find((s) => s.linkingCode.toUpperCase() === cleanCode);
    if (!studentProfile) return { found: false };

    const studentUser = this.getUserById(studentProfile.studentId);
    const memberRecord = this.getMembers().find((m) => m.studentId === studentProfile.studentId);
    const resolvedName = studentUser?.name || memberRecord?.studentName;
    if (!resolvedName) return { found: false };

    const alreadyLinked = parentId
      ? this.getParentStudents().some(
          (ps) => ps.parentId === parentId && ps.studentId === studentProfile.studentId && ps.status === 'active'
        )
      : false;

    return {
      found: true,
      studentId: studentProfile.studentId,
      studentName: resolvedName,
      grade: studentProfile.grade,
      school: studentProfile.school,
      alreadyLinked,
    };
  }

  public linkChildByCode(parentId: string, linkingCode: string): { success: boolean; studentName?: string; error?: string } {
    const cleanCode = linkingCode.trim().toUpperCase();
    this.repairParentStudentLinks(false);
    const studentProfile = this.getStudentProfiles().find((s) => s.linkingCode.toUpperCase() === cleanCode);

    if (!studentProfile) {
      return { success: false, error: 'كود الطالب غير صحيح، اطلب من ابنك كود الربط من صفحته الشخصية' };
    }

    const studentUser = this.getUserById(studentProfile.studentId);
    const memberRecord = this.getMembers().find((m) => m.studentId === studentProfile.studentId);
    const resolvedStudentName = studentUser?.name || memberRecord?.studentName;
    if (!resolvedStudentName) {
      return { success: false, error: 'بيانات الطالب غير متوفرة' };
    }

    const parentStudents = this.getParentStudents();
    const alreadyLinked = parentStudents.some((ps) => ps.parentId === parentId && ps.studentId === studentProfile.studentId);

    if (alreadyLinked) {
      return { success: false, error: 'تم ربط هذا الطالب بحسابك من قبل!' };
    }

    // Remove any previous tombstone if re-linking
    syncEngine.removeTombstone('parentStudents', `${parentId}_${studentProfile.studentId}`);

    parentStudents.push({
      parentId,
      studentId: studentProfile.studentId,
      studentName: resolvedStudentName,
      grade: studentProfile.grade,
      school: studentProfile.school,
      linkedAt: new Date().toISOString().split('T')[0],
      status: 'active',
    });

    this.set(STORAGE_KEYS.PARENT_STUDENTS, parentStudents);

    this.addNotification({
      userId: parentId,
      title: 'تم ربط الابن بنجاح',
      body: `تم ربط حساب الابن (${resolvedStudentName}) بحسابك بنجاح. يمكنك الآن متابعة حضوره ودرجاته وواجباته.`,
      type: 'session',
    });

    return { success: true, studentName: resolvedStudentName };
  }

  public unlinkChild(parentId: string, studentId: string): boolean {
    const parentStudents = this.getParentStudents();
    const target = parentStudents.find((ps) => ps.parentId === parentId && ps.studentId === studentId);
    if (target) {
      syncEngine.addTombstone('parentStudents', `${parentId}_${studentId}`, parentId);
      const filtered = parentStudents.filter((ps) => !(ps.parentId === parentId && ps.studentId === studentId));
      this.set(STORAGE_KEYS.PARENT_STUDENTS, filtered);

      this.addAuditLog({
        userId: parentId,
        userName: 'ولي أمر',
        userRole: 'parent',
        action: 'إلغاء ربط ابن',
        details: `تم إلغاء ربط الابن ${target.studentName}`,
      });
      return true;
    }
    return false;
  }

  // --- Attendance ---
  public getAttendance(): AttendanceRecord[] {
    return this.get<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  }

  public getAttendanceByGroupAndDate(groupId: string, date: string): AttendanceRecord[] {
    return this.getAttendance().filter((a) => a.groupId === groupId && a.date === date);
  }

  public getAttendanceForStudent(studentId: string): AttendanceRecord[] {
    return this.getAttendance().filter((a) => a.studentId === studentId);
  }

  public saveAttendanceBatch(params: {
    groupId: string;
    date: string;
    records: { studentId: string; studentName: string; status: AttendanceStatus }[];
    isOnline?: boolean;
    modifiedByName?: string;
  }): { success: boolean; count: number; error?: string } {
    if (!params.groupId || !params.date) {
      return { success: false, count: 0, error: 'بيانات الحضور غير مكتملة' };
    }

    const isOnline = params.isOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);
    const allAttendance = this.getAttendance();
    const modifiedBy = params.modifiedByName || 'المدرس';

    params.records.forEach((rec) => {
      const index = allAttendance.findIndex(
        (a) => a.groupId === params.groupId && a.studentId === rec.studentId && a.date === params.date
      );
      const isNewOrStatusChanged = index === -1 || allAttendance[index].status !== rec.status;

      if (index >= 0) {
        const existing = allAttendance[index];
        const history = existing.history ? [...existing.history] : [];
        if (existing.status !== rec.status) {
          history.push({
            oldStatus: existing.status,
            newStatus: rec.status,
            modifiedAt: new Date().toISOString(),
            modifiedBy,
          });

          this.addAuditLog({
            userId: existing.groupId,
            userName: modifiedBy,
            userRole: 'teacher',
            action: 'تعديل حضور سابق',
            details: `تعديل حالة الطالب (${rec.studentName}) من ${existing.status} إلى ${rec.status} في حصة ${params.date}`,
          });
        }

        allAttendance[index] = {
          ...existing,
          status: rec.status,
          history,
          synced: isOnline,
        };
      } else {
        const newRecord: AttendanceRecord = {
          attendanceId: `att_${Date.now()}_${rec.studentId}`,
          groupId: params.groupId,
          studentId: rec.studentId,
          studentName: rec.studentName,
          date: params.date,
          status: rec.status,
          createdAt: new Date().toISOString(),
          synced: isOnline,
          history: [],
        };
        allAttendance.push(newRecord);
      }

      // If absent or late, notify parents only if record is new or status changed
      if (isNewOrStatusChanged && (rec.status === 'absent' || rec.status === 'late')) {
        const parentStudents = this.getParentStudents().filter((ps) => ps.studentId === rec.studentId && ps.status === 'active');
        parentStudents.forEach((ps) => {
          this.addNotification({
            userId: ps.parentId,
            title: rec.status === 'absent' ? `تنبيه غياب: ${rec.studentName}` : `تنبيه تأخير: ${rec.studentName}`,
            body:
              rec.status === 'absent'
                ? `تم تسجيل غياب ${rec.studentName} في الحصة بتاريخ ${params.date}`
                : `تم تسجيل وصول ${rec.studentName} متأخراً في الحصة بتاريخ ${params.date}`,
            type: 'attendance',
          });
        });
      }
    });

    this.set(STORAGE_KEYS.ATTENDANCE, allAttendance);
    return { success: true, count: params.records.length };
  }

  /**
   * One-Click Single Student Attendance Recording with Instant Parent Notification
   */
  public recordSingleAttendance(params: {
    groupId: string;
    date: string;
    studentId: string;
    studentName: string;
    status: AttendanceStatus;
    modifiedByName?: string;
    isOnline?: boolean;
  }): {
    success: boolean;
    record?: AttendanceRecord;
    parentNotified: boolean;
    parentNames: string[];
    parentIds: string[];
    notificationTitle?: string;
    notificationBody?: string;
    error?: string;
  } {
    if (!params.groupId || !params.studentId || !params.date) {
      return { success: false, parentNotified: false, parentNames: [], parentIds: [], error: 'بيانات الحضور غير مكتملة' };
    }

    const isOnline = params.isOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);
    const allAttendance = this.getAttendance();
    const modifiedBy = params.modifiedByName || 'المدرس';
    let targetRecord: AttendanceRecord;

    const index = allAttendance.findIndex(
      (a) => a.groupId === params.groupId && a.studentId === params.studentId && a.date === params.date
    );

    if (index >= 0) {
      const existing = allAttendance[index];
      const history = existing.history ? [...existing.history] : [];
      if (existing.status !== params.status) {
        history.push({
          oldStatus: existing.status,
          newStatus: params.status,
          modifiedAt: new Date().toISOString(),
          modifiedBy,
        });
      }

      targetRecord = {
        ...existing,
        status: params.status,
        history,
        synced: isOnline,
      };
      allAttendance[index] = targetRecord;
    } else {
      targetRecord = {
        attendanceId: `att_${Date.now()}_${params.studentId}`,
        groupId: params.groupId,
        studentId: params.studentId,
        studentName: params.studentName,
        date: params.date,
        status: params.status,
        createdAt: new Date().toISOString(),
        synced: isOnline,
        history: [],
      };
      allAttendance.push(targetRecord);
    }

    this.set(STORAGE_KEYS.ATTENDANCE, allAttendance);

    const parentNames: string[] = [];
    const parentIds: string[] = [];
    let notifTitle = '';
    let notifBody = '';

    // If student is absent or late, send instant real-time notification to the parent
    if (params.status === 'absent' || params.status === 'late') {
      const parentStudents = this.getParentStudents().filter(
        (ps) => ps.studentId === params.studentId && ps.status === 'active'
      );

      const group = this.getGroupById(params.groupId);
      const groupName = group ? group.name : 'الحصة الدراسية';
      const isAbsent = params.status === 'absent';

      notifTitle = isAbsent
        ? `⚠️ إشعار غياب فوري: ${params.studentName}`
        : `⏰ تنبيه تأخير: ${params.studentName}`;

      notifBody = isAbsent
        ? `نحيط علم سيادتكم بغياب الطالب (${params.studentName}) اليوم عن حصة (${groupName}) بتاريخ ${params.date}. يرجى الاطمئنان عليه ومتابعة تعويض ما فاته.`
        : `تم تسجيل وصول الطالب (${params.studentName}) متأخراً عن موعد حصة (${groupName}) بتاريخ ${params.date}.`;

      parentStudents.forEach((ps) => {
        const parentUser = this.getUserById(ps.parentId);
        const name = parentUser?.name || ps.studentName + ' (ولي أمر)';
        parentNames.push(name);
        parentIds.push(ps.parentId);

        this.addNotification({
          userId: ps.parentId,
          title: notifTitle,
          body: notifBody,
          type: 'attendance',
        });
      });

      this.addAuditLog({
        userId: params.groupId,
        userName: modifiedBy,
        userRole: 'teacher',
        action: isAbsent ? 'تسجيل غياب فوري بضغطة واحدة' : 'تسجيل تأخير فوري بضغطة واحدة',
        details: isAbsent
          ? `تم تسجيل غياب الطالب (${params.studentName}) بضغطة واحدة وإرسال إشعار فوري لولي الأمر (${parentNames.join('، ')})`
          : `تم تسجيل وصول الطالب (${params.studentName}) متأخراً وإشعار ولي الأمر (${parentNames.join('، ')})`,
      });
    } else {
      this.addAuditLog({
        userId: params.groupId,
        userName: modifiedBy,
        userRole: 'teacher',
        action: 'تسجيل حضور فوري بضغطة واحدة',
        details: `تم تسجيل حضور الطالب (${params.studentName}) كـ حاضر في حصة ${params.date}`,
      });
    }

    return {
      success: true,
      record: targetRecord,
      parentNotified: parentNames.length > 0,
      parentNames,
      parentIds,
      notificationTitle: notifTitle,
      notificationBody: notifBody,
    };
  }

  /**
   * One-Click Record All Present & Save Immediately
   */
  public recordAllPresentOneClick(params: {
    groupId: string;
    date: string;
    modifiedByName?: string;
  }): { success: boolean; count: number; error?: string } {
    const members = this.getMembersByGroup(params.groupId);
    if (members.length === 0) {
      return { success: false, count: 0, error: 'لا يوجد طلاب في هذه المجموعة' };
    }

    const records = members.map((m) => ({
      studentId: m.studentId,
      studentName: m.studentName,
      status: 'present' as AttendanceStatus,
    }));

    const res = this.saveAttendanceBatch({
      groupId: params.groupId,
      date: params.date,
      records,
      modifiedByName: params.modifiedByName || 'المدرس',
    });

    this.addAuditLog({
      userId: params.groupId,
      userName: params.modifiedByName || 'المدرس',
      userRole: 'teacher',
      action: 'تسجيل الحضور بضغطة واحدة (الكل حاضر)',
      details: `تم تسجيل حضور جميع طلاب المجموعة (${res.count} طالب) بضغطة واحدة في حصة ${params.date}`,
    });

    return res;
  }

  /**
   * Get Parent Contact Information for a Student
   */
  public getParentInfoForStudent(studentId: string): { parentId: string; parentName: string; phone?: string } | null {
    const links = this.getParentStudents().filter((ps) => ps.studentId === studentId && ps.status === 'active');
    if (links.length === 0) return null;
    const parentUser = this.getUserById(links[0].parentId);
    return {
      parentId: links[0].parentId,
      parentName: parentUser?.name || 'ولي الأمر',
      phone: parentUser?.phone || '01012345678',
    };
  }

  /**
   * Get Recent Attendance Alerts for a Group
   */
  public getAttendanceAlertsForGroup(groupId: string, date?: string): AppNotification[] {
    const notifs = this.getNotifications().filter((n) => n.type === 'attendance');
    const group = this.getGroupById(groupId);
    if (!group) return notifs.slice(0, 10);
    return notifs.filter((n) => {
      const matchesGroup = n.body.includes(group.name);
      const matchesDate = date ? n.body.includes(date) || n.createdAt.startsWith(date) : true;
      return matchesGroup && matchesDate;
    });
  }

  public getUnsyncedAttendanceCount(): number {
    return this.getAttendance().filter((a) => !a.synced).length;
  }

  public syncOfflineAttendance(): number {
    const list = this.getAttendance();
    let syncedCount = 0;
    list.forEach((item) => {
      if (!item.synced) {
        item.synced = true;
        syncedCount++;
      }
    });
    if (syncedCount > 0) {
      this.set(STORAGE_KEYS.ATTENDANCE, list);
    }
    syncEngine.syncNow();
    return syncedCount;
  }

  // --- Attendance Reports ---
  public getStudentAttendanceSummary(studentId: string, groupId?: string): AttendanceReportSummary {
    let records = this.getAttendanceForStudent(studentId);
    if (groupId) {
      records = records.filter((r) => r.groupId === groupId);
    }
    const studentUser = this.getUserById(studentId);
    const totalSessions = records.length;
    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const lateCount = records.filter((r) => r.status === 'late').length;
    const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalSessions) * 100) : 100;

    return {
      studentId,
      studentName: studentUser?.name || records[0]?.studentName || 'طالب',
      totalSessions,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
    };
  }

  public getGroupAttendanceSummaries(groupId: string): AttendanceReportSummary[] {
    const members = this.getMembersByGroup(groupId);
    return members.map((m) => this.getStudentAttendanceSummary(m.studentId, groupId));
  }

  // --- Homework ---
  public getHomework(): Homework[] {
    return this.get<Homework[]>(STORAGE_KEYS.HOMEWORK, []);
  }

  public getHomeworkByGroup(groupId: string): Homework[] {
    return this.getHomework().filter((h) => h.groupId === groupId);
  }

  public getHomeworkForStudent(studentId: string): Homework[] {
    const studentGroupIds = this.getGroupsForStudent(studentId).map((g) => g.groupId);
    return this.getHomework().filter((h) => studentGroupIds.includes(h.groupId));
  }

  public addHomework(params: {
    groupId: string;
    groupName: string;
    title: string;
    description: string;
    dueDate: string;
    assignedDate?: string;
    maxScore?: number;
  }): { success: boolean; homework?: Homework; error?: string } {
    if (!params.title.trim()) return { success: false, error: 'عنوان الواجب مطلوب' };
    if (!params.dueDate) return { success: false, error: 'تاريخ التسليم مطلوب' };

    const homeworkList = this.getHomework();
    const newHw: Homework = {
      homeworkId: `hw_${Date.now()}`,
      groupId: params.groupId,
      groupName: params.groupName,
      title: params.title.trim(),
      description: params.description.trim(),
      assignedDate: params.assignedDate || new Date().toISOString().split('T')[0],
      dueDate: params.dueDate,
      status: 'new',
      maxScore: params.maxScore || 10,
      createdAt: new Date().toISOString(),
    };

    homeworkList.unshift(newHw);
    this.set(STORAGE_KEYS.HOMEWORK, homeworkList);

    const members = this.getMembersByGroup(params.groupId);
    members.forEach((m) => {
      this.addNotification({
        userId: m.studentId,
        title: `واجب جديد: ${params.title}`,
        body: `أضاف مدرس المجموعة واجباً جديداً، موعد التسليم: ${params.dueDate}`,
        type: 'homework',
      });
    });

    return { success: true, homework: newHw };
  }

  public toggleHomeworkStatus(homeworkId: string): { success: boolean; newStatus?: Homework['status']; error?: string } {
    const homeworkList = this.getHomework();
    const target = homeworkList.find((h) => h.homeworkId === homeworkId);
    if (!target) return { success: false, error: 'الواجب غير موجود' };

    const newStatus: Homework['status'] = target.status === 'closed' ? 'active' : 'closed';
    target.status = newStatus;
    this.set(STORAGE_KEYS.HOMEWORK, homeworkList);

    const curr = this.getCurrentUser();
    this.addAuditLog({
      userId: curr?.id || target.groupId,
      userName: curr?.name || 'المدرس',
      userRole: 'teacher',
      action: newStatus === 'closed' ? 'إغلاق واجب' : 'إعادة فتح واجب',
      details: `تم تعديل حالة الواجب (${target.title}) إلى ${newStatus === 'closed' ? 'مغلق' : 'نشط'}`,
    });

    return { success: true, newStatus };
  }

  // --- Homework Submissions & Instant Grading ---
  public getHomeworkSubmissions(): HomeworkSubmission[] {
    return this.get<HomeworkSubmission[]>(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, []);
  }

  public getHomeworkSubmissionsByHomework(homeworkId: string): HomeworkSubmission[] {
    return this.getHomeworkSubmissions().filter((s) => s.homeworkId === homeworkId);
  }

  public getHomeworkSubmissionsForStudent(studentId: string): HomeworkSubmission[] {
    return this.getHomeworkSubmissions().filter((s) => s.studentId === studentId);
  }

  public submitHomework(params: {
    homeworkId: string;
    studentId: string;
    studentName: string;
    answerText: string;
    attachmentUrl?: string;
  }): { success: boolean; submission?: HomeworkSubmission; error?: string } {
    if (!params.answerText.trim()) {
      return { success: false, error: 'يرجى كتابة حل الواجب أو ملاحظة التسليم' };
    }

    const hw = this.getHomework().find((h) => h.homeworkId === params.homeworkId);
    if (!hw) {
      return { success: false, error: 'الواجب غير موجود' };
    }
    if (hw.status === 'closed') {
      return { success: false, error: 'هذا الواجب مغلق ولا يقبل تسليمات جديدة' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isLate = Boolean(hw.dueDate && todayStr > hw.dueDate);
    const submissions = this.getHomeworkSubmissions();
    const submissionId = `hwsub_${params.homeworkId}_${params.studentId}`;
    const existingIdx = submissions.findIndex(
      (s) => s.submissionId === submissionId || (s.homeworkId === params.homeworkId && s.studentId === params.studentId)
    );

    const newSub: HomeworkSubmission = {
      submissionId,
      homeworkId: params.homeworkId,
      groupId: hw.groupId,
      groupName: hw.groupName,
      studentId: params.studentId,
      studentName: params.studentName,
      answerText: params.answerText.trim(),
      attachmentUrl: params.attachmentUrl?.trim() || undefined,
      status: existingIdx >= 0 && submissions[existingIdx].status === 'graded'
        ? 'graded'
        : isLate
        ? 'late'
        : 'submitted',
      submittedAt: new Date().toISOString(),
      score: existingIdx >= 0 ? submissions[existingIdx].score : undefined,
      maxScore: existingIdx >= 0 ? submissions[existingIdx].maxScore : hw.maxScore || 10,
      teacherFeedback: existingIdx >= 0 ? submissions[existingIdx].teacherFeedback : undefined,
      gradedAt: existingIdx >= 0 ? submissions[existingIdx].gradedAt : undefined,
      gradedBy: existingIdx >= 0 ? submissions[existingIdx].gradedBy : undefined,
    };

    if (existingIdx >= 0) {
      submissions[existingIdx] = newSub;
    } else {
      submissions.unshift(newSub);
    }

    this.set(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, submissions);

    // Notify group teacher
    const group = this.getGroupById(hw.groupId);
    if (group) {
      this.addNotification({
        userId: group.teacherId,
        title: `تسليم واجب: ${params.studentName}`,
        body: `قام الطالب (${params.studentName}) بتسليم واجب (${hw.title})${isLate ? ' (متأخر)' : ''}`,
        type: 'homework',
      });
    }

    // Notify linked parents immediately
    const parentLinks = this.getParentStudents().filter(
      (ps) => ps.studentId === params.studentId && ps.status === 'active'
    );
    parentLinks.forEach((pl) => {
      this.addNotification({
        userId: pl.parentId,
        title: `تسليم واجب للابن (${params.studentName})`,
        body: `قام ${params.studentName} بتسليم واجب (${hw.title}) في مجموعة ${hw.groupName}.`,
        type: 'homework',
      });
    });

    return { success: true, submission: newSub };
  }

  public gradeHomeworkSubmission(params: {
    homeworkId: string;
    studentId: string;
    studentName: string;
    score: number;
    maxScore: number;
    teacherFeedback?: string;
    gradedBy?: string;
  }): { success: boolean; submission?: HomeworkSubmission; grade?: GradeRecord; error?: string } {
    const hw = this.getHomework().find((h) => h.homeworkId === params.homeworkId);
    if (!hw) return { success: false, error: 'الواجب غير موجود' };

    if (params.score < 0 || params.maxScore <= 0 || params.score > params.maxScore) {
      return { success: false, error: `الدرجة يجب أن تكون بين 0 و ${params.maxScore}` };
    }

    const submissions = this.getHomeworkSubmissions();
    const submissionId = `hwsub_${params.homeworkId}_${params.studentId}`;
    const idx = submissions.findIndex(
      (s) => s.submissionId === submissionId || (s.homeworkId === params.homeworkId && s.studentId === params.studentId)
    );

    const nowIso = new Date().toISOString();
    let updatedSub: HomeworkSubmission;

    if (idx >= 0) {
      updatedSub = {
        ...submissions[idx],
        submissionId,
        status: 'graded',
        score: params.score,
        maxScore: params.maxScore,
        teacherFeedback: params.teacherFeedback?.trim() || undefined,
        gradedAt: nowIso,
        gradedBy: params.gradedBy || 'المدرس',
      };
      submissions[idx] = updatedSub;
    } else {
      updatedSub = {
        submissionId,
        homeworkId: params.homeworkId,
        groupId: hw.groupId,
        groupName: hw.groupName,
        studentId: params.studentId,
        studentName: params.studentName,
        answerText: 'تم تسليم الواجب ورقياً في الحصة',
        status: 'graded',
        submittedAt: nowIso,
        score: params.score,
        maxScore: params.maxScore,
        teacherFeedback: params.teacherFeedback?.trim() || undefined,
        gradedAt: nowIso,
        gradedBy: params.gradedBy || 'المدرس',
      };
      submissions.unshift(updatedSub);
    }

    this.set(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, submissions);

    // Immediately create/update GradeRecord so it appears in StudentGrades & ParentDashboard immediately
    const allGrades = this.getGrades();
    const gradeId = `grade_hw_${params.homeworkId}_${params.studentId}`;
    const gradeTitle = `واجب: ${hw.title}`;
    const gradeIdx = allGrades.findIndex((g) => g.gradeId === gradeId);
    const gradeRec: GradeRecord = {
      gradeId,
      groupId: hw.groupId,
      groupName: hw.groupName,
      studentId: params.studentId,
      studentName: params.studentName,
      title: gradeTitle,
      score: params.score,
      maxScore: params.maxScore,
      date: nowIso.split('T')[0],
    };

    if (gradeIdx >= 0) {
      allGrades[gradeIdx] = gradeRec;
    } else {
      allGrades.unshift(gradeRec);
    }
    this.set(STORAGE_KEYS.GRADES, allGrades);

    // Notify student immediately
    this.addNotification({
      userId: params.studentId,
      title: `تم تصحيح الواجب: ${hw.title}`,
      body: `حصلت على ${params.score} من ${params.maxScore} في واجب (${hw.title})${params.teacherFeedback ? ` — ملاحظة المدرس: ${params.teacherFeedback}` : ''}`,
      type: 'grade',
    });

    // Notify linked parents immediately
    const parentLinks = this.getParentStudents().filter(
      (ps) => ps.studentId === params.studentId && ps.status === 'active'
    );
    parentLinks.forEach((pl) => {
      this.addNotification({
        userId: pl.parentId,
        title: `درجة واجب للابن (${params.studentName})`,
        body: `حصل ${params.studentName} على ${params.score} من ${params.maxScore} في واجب (${hw.title})${params.teacherFeedback ? ` — ملاحظة المدرس: ${params.teacherFeedback}` : ''}`,
        type: 'grade',
      });
    });

    return { success: true, submission: updatedSub, grade: gradeRec };
  }

  // --- Assessments & Batch Grades (V2 Concept) ---
  public getAssessments(): Assessment[] {
    return this.get<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []);
  }

  public getAssessmentsByGroup(groupId: string): Assessment[] {
    return this.getAssessments().filter((a) => a.groupId === groupId);
  }

  public createAssessment(params: {
    groupId: string;
    groupName: string;
    teacherId: string;
    title: string;
    subject: string;
    date: string;
    maxScore: number;
  }): { success: boolean; assessment?: Assessment; error?: string } {
    if (!params.title.trim()) return { success: false, error: 'اسم الاختبار مطلوب' };
    if (params.maxScore <= 0) return { success: false, error: 'الدرجة النهائية يجب أن تكون أكبر من صفر' };

    const assessments = this.getAssessments();
    const newAsm: Assessment = {
      assessmentId: `asm_${Date.now()}`,
      groupId: params.groupId,
      groupName: params.groupName,
      teacherId: params.teacherId,
      title: params.title.trim(),
      subject: params.subject.trim(),
      date: params.date || new Date().toISOString().split('T')[0],
      maxScore: params.maxScore,
      createdAt: new Date().toISOString(),
    };

    assessments.unshift(newAsm);
    this.set(STORAGE_KEYS.ASSESSMENTS, assessments);

    this.addAuditLog({
      userId: params.teacherId,
      userName: 'مدرس',
      userRole: 'teacher',
      action: 'إنشاء اختبار جديد',
      details: `تم إنشاء الاختبار (${newAsm.title}) للمجموعة ${params.groupName}`,
    });

    return { success: true, assessment: newAsm };
  }

  // --- Grades ---
  public getGrades(): GradeRecord[] {
    return this.get<GradeRecord[]>(STORAGE_KEYS.GRADES, []);
  }

  public getGradesByGroup(groupId: string): GradeRecord[] {
    return this.getGrades().filter((g) => g.groupId === groupId);
  }

  public getGradesForStudent(studentId: string): GradeRecord[] {
    return this.getGrades().filter((g) => g.studentId === studentId);
  }

  public getGradesByAssessment(assessmentId: string): GradeRecord[] {
    return this.getGrades().filter((g) => g.assessmentId === assessmentId);
  }

  public addGrade(params: {
    assessmentId?: string;
    groupId: string;
    groupName: string;
    studentId: string;
    studentName: string;
    title: string;
    score: number;
    maxScore: number;
    date: string;
  }): { success: boolean; grade?: GradeRecord; error?: string } {
    if (!params.title.trim()) return { success: false, error: 'اسم الاختبار مطلوب' };
    if (params.score < 0 || params.maxScore <= 0 || params.score > params.maxScore) {
      return { success: false, error: 'الدرجة غير صحيحة، يجب أن تكون بين 0 والدرجة النهائية' };
    }

    const grades = this.getGrades();
    const newGrade: GradeRecord = {
      gradeId: `grade_${Date.now()}_${params.studentId}`,
      assessmentId: params.assessmentId,
      groupId: params.groupId,
      groupName: params.groupName,
      studentId: params.studentId,
      studentName: params.studentName,
      title: params.title.trim(),
      score: params.score,
      maxScore: params.maxScore,
      date: params.date || new Date().toISOString().split('T')[0],
    };

    grades.unshift(newGrade);
    this.set(STORAGE_KEYS.GRADES, grades);

    // Notify student
    this.addNotification({
      userId: params.studentId,
      title: `درجة جديدة: ${params.title}`,
      body: `حصلت على ${params.score} من ${params.maxScore} في ${params.title}`,
      type: 'grade',
    });

    // Notify parent if linked
    const parentStudents = this.getParentStudents().filter((ps) => ps.studentId === params.studentId);
    parentStudents.forEach((ps) => {
      this.addNotification({
        userId: ps.parentId,
        title: `درجة جديدة للابن (${params.studentName})`,
        body: `حصل ${params.studentName} على ${params.score} من ${params.maxScore} في ${params.title}`,
        type: 'grade',
      });
    });

    return { success: true, grade: newGrade };
  }

  public saveBatchGradesForAssessment(params: {
    assessmentId: string;
    groupId: string;
    groupName: string;
    title: string;
    maxScore: number;
    date: string;
    grades: Array<{ studentId: string; studentName: string; score: number }>;
  }): { success: boolean; count: number; error?: string } {
    const allGrades = this.getGrades();
    let count = 0;

    params.grades.forEach((g) => {
      const numScore = Number(g.score);
      if (typeof numScore !== 'number' || Number.isNaN(numScore) || numScore < 0 || numScore > params.maxScore) {
        return;
      }

      const existingIndex = allGrades.findIndex(
        (rec) => rec.assessmentId === params.assessmentId && rec.studentId === g.studentId
      );
      const isNewOrScoreChanged = existingIndex === -1 || allGrades[existingIndex].score !== numScore;

      if (existingIndex >= 0) {
        allGrades[existingIndex] = {
          ...allGrades[existingIndex],
          score: numScore,
          maxScore: params.maxScore,
          date: params.date,
        };
      } else {
        allGrades.push({
          gradeId: `grade_${Date.now()}_${g.studentId}`,
          assessmentId: params.assessmentId,
          groupId: params.groupId,
          groupName: params.groupName,
          studentId: g.studentId,
          studentName: g.studentName,
          title: params.title,
          score: numScore,
          maxScore: params.maxScore,
          date: params.date,
        });
      }
      count++;

      // Notify parent & student only if grade is new or score changed
      if (isNewOrScoreChanged) {
        this.addNotification({
          userId: g.studentId,
          title: `درجة اختبار: ${params.title}`,
          body: `حصلت على ${numScore} من ${params.maxScore}`,
          type: 'grade',
        });
        const parentStudents = this.getParentStudents().filter((ps) => ps.studentId === g.studentId && ps.status === 'active');
        parentStudents.forEach((ps) => {
          this.addNotification({
            userId: ps.parentId,
            title: `درجة اختبار للابن (${g.studentName})`,
            body: `حصل ${g.studentName} على ${numScore} من ${params.maxScore} في ${params.title}`,
            type: 'grade',
          });
        });
      }
    });

    this.set(STORAGE_KEYS.GRADES, allGrades);

    this.addAuditLog({
      userId: params.groupId,
      userName: 'مدرس',
      userRole: 'teacher',
      action: 'رصد درجات اختبار سريع',
      details: `تم حفظ درجات ${count} طلاب في اختبار ${params.title}`,
    });

    return { success: true, count };
  }

  public getAssessmentStats(assessmentId: string): {
    average: number;
    highest: number;
    lowest: number;
    count: number;
  } {
    const grades = this.getGradesByAssessment(assessmentId);
    const validScores = grades
      .map((g) => Number(g.score))
      .filter((s) => typeof s === 'number' && !Number.isNaN(s));

    if (validScores.length === 0) {
      return { average: 0, highest: 0, lowest: 0, count: 0 };
    }
    const sum = validScores.reduce((a, b) => a + b, 0);
    const average = Math.round((sum / validScores.length) * 10) / 10;
    const highest = Math.max(...validScores);
    const lowest = Math.min(...validScores);
    return { average, highest, lowest, count: validScores.length };
  }

  // --- Student Educational Profile (Requirement #8) ---
  public getStudentEducationalProfile(studentId: string) {
    const user = this.getUserById(studentId);
    const profile = this.getStudentProfile(studentId);
    const groups = this.getGroupsForStudent(studentId);
    const attendanceSummary = this.getStudentAttendanceSummary(studentId);
    const grades = this.getGradesForStudent(studentId);
    const homework = this.getHomeworkForStudent(studentId);
    const notes = this.getNotesForParent(studentId);

    const totalScore = grades.reduce((acc, g) => acc + g.score, 0);
    const totalMax = grades.reduce((acc, g) => acc + g.maxScore, 0);
    const averagePercentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    return {
      student: user,
      profile,
      groupsCount: groups.length,
      attendanceSummary,
      gradesCount: grades.length,
      averagePercentage,
      recentGrades: grades.slice(0, 5),
      homeworkCount: homework.length,
      notes,
    };
  }

  // --- Parent Weekly Summary (Requirement #10) ---
  public getParentWeeklySummary(studentId: string) {
    const attendanceSummary = this.getStudentAttendanceSummary(studentId);
    const grades = this.getGradesForStudent(studentId);
    const homework = this.getHomeworkForStudent(studentId);
    const activeHomework = homework.filter((h) => h.status !== 'closed');
    const recentGrade = grades[0];

    return {
      sessionsSummaryText: `${attendanceSummary.presentCount} من ${attendanceSummary.totalSessions} حصص تم حضورها`,
      attendanceRate: attendanceSummary.attendanceRate,
      activeHomeworkCount: activeHomework.length,
      latestGradeText: recentGrade ? `${recentGrade.score} / ${recentGrade.maxScore} (${recentGrade.title})` : 'لا توجد اختبارات حديثة',
    };
  }

  // --- Schedule Conflicts Detection (Requirement #13) ---
  private parseTimeToMinutes(timeStr: string): number | null {
    if (!timeStr || typeof timeStr !== 'string') return null;

    // Convert Arabic-Indic numerals (٠-٩) to standard ASCII (0-9)
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let normalized = timeStr;
    arabicDigits.forEach((d, idx) => {
      normalized = normalized.split(d).join(idx.toString());
    });

    normalized = normalized.trim().toLowerCase();
    const isPM = normalized.includes('م') || normalized.includes('pm') || normalized.includes('مساء');
    const isAM = normalized.includes('ص') || normalized.includes('am') || normalized.includes('صباح');

    // Extract hours and minutes: e.g. "05:30", "5:00", "17:00", "5"
    const match = normalized.match(/(\d{1,2})(?::(\d{1,2}))?/);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  public detectTeacherScheduleConflicts(teacherId: string): Array<{
    day: string;
    group1: Group;
    group2: Group;
  }> {
    const groups = this.getGroupsByTeacher(teacherId).filter((g) => g.status === 'active');
    const conflicts: Array<{ day: string; group1: Group; group2: Group }> = [];

    const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    days.forEach((day) => {
      const dayGroups = groups.filter((g) => Array.isArray(g.days) && g.days.includes(day));
      for (let i = 0; i < dayGroups.length; i++) {
        for (let j = i + 1; j < dayGroups.length; j++) {
          const g1 = dayGroups[i];
          const g2 = dayGroups[j];

          const start1 = this.parseTimeToMinutes(g1.startTime);
          const start2 = this.parseTimeToMinutes(g2.startTime);

          let hasConflict = false;

          if (start1 !== null && start2 !== null) {
            const dur1 = Number(g1.durationMinutes) || 90;
            const dur2 = Number(g2.durationMinutes) || 90;
            const end1 = start1 + dur1;
            const end2 = start2 + dur2;

            // Two intervals [start1, end1) and [start2, end2) overlap if:
            // max(start1, start2) < min(end1, end2)
            if (Math.max(start1, start2) < Math.min(end1, end2)) {
              hasConflict = true;
            }
          } else {
            // Fallback: normalized string comparison without whitespace
            const clean1 = (g1.startTime || '').replace(/\s+/g, '').toLowerCase();
            const clean2 = (g2.startTime || '').replace(/\s+/g, '').toLowerCase();
            if (clean1 && clean1 === clean2) {
              hasConflict = true;
            }
          }

          if (hasConflict) {
            conflicts.push({
              day,
              group1: g1,
              group2: g2,
            });
          }
        }
      }
    });

    return conflicts;
  }

  // --- Announcements ---
  public getAnnouncements(): Announcement[] {
    return this.get<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
  }

  public getAnnouncementsByGroup(groupId: string): Announcement[] {
    return this.getAnnouncements().filter((a) => a.groupId === groupId);
  }

  public getAnnouncementsForStudent(studentId: string): Announcement[] {
    const studentGroupIds = this.getGroupsForStudent(studentId).map((g) => g.groupId);
    return this.getAnnouncements().filter((a) => studentGroupIds.includes(a.groupId));
  }

  public addAnnouncement(params: {
    groupId: string;
    groupName: string;
    teacherName: string;
    title: string;
    body: string;
  }): { success: boolean; announcement?: Announcement; error?: string } {
    if (!params.title.trim()) return { success: false, error: 'عنوان الإعلان مطلوب' };
    if (!params.body.trim()) return { success: false, error: 'نص الإعلان مطلوب' };

    const announcements = this.getAnnouncements();
    const newAnn: Announcement = {
      announcementId: `ann_${Date.now()}`,
      groupId: params.groupId,
      groupName: params.groupName,
      teacherName: params.teacherName,
      title: params.title.trim(),
      body: params.body.trim(),
      createdAt: new Date().toISOString(),
    };

    announcements.unshift(newAnn);
    this.set(STORAGE_KEYS.ANNOUNCEMENTS, announcements);

    const members = this.getMembersByGroup(params.groupId);
    members.forEach((m) => {
      this.addNotification({
        userId: m.studentId,
        title: `إعلان جديد: ${params.title}`,
        body: params.body.slice(0, 80) + '...',
        type: 'announcement',
      });
    });

    return { success: true, announcement: newAnn };
  }

  // --- Student Notes ---
  public getNotes(): StudentNote[] {
    return this.get<StudentNote[]>(STORAGE_KEYS.NOTES, []);
  }

  public getNotesForTeacher(teacherId: string, studentId?: string): StudentNote[] {
    const notes = this.getNotes().filter((n) => n.teacherId === teacherId);
    if (studentId) return notes.filter((n) => n.studentId === studentId);
    return notes;
  }

  public getNotesForParent(studentId: string): StudentNote[] {
    return this.getNotes().filter((n) => n.studentId === studentId && n.visibility === 'parent_visible');
  }

  public addNote(params: {
    teacherId: string;
    studentId: string;
    studentName: string;
    text: string;
    visibility: 'teacher_only' | 'parent_visible';
  }): { success: boolean; note?: StudentNote; error?: string } {
    if (!params.text.trim()) return { success: false, error: 'نص الملاحظة مطلوب' };

    const notes = this.getNotes();
    const newNote: StudentNote = {
      noteId: `note_${Date.now()}`,
      teacherId: params.teacherId,
      studentId: params.studentId,
      studentName: params.studentName,
      text: params.text.trim(),
      visibility: params.visibility,
      createdAt: new Date().toISOString(),
    };

    notes.unshift(newNote);
    this.set(STORAGE_KEYS.NOTES, notes);
    return { success: true, note: newNote };
  }

  // --- Notifications ---
  public getNotifications(): AppNotification[] {
    return this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  public getNotificationsForUser(userId: string): AppNotification[] {
    return this.getNotifications().filter((n) => n.userId === userId);
  }

  public addNotification(params: {
    userId: string;
    title: string;
    body: string;
    type: 'session' | 'homework' | 'grade' | 'announcement' | 'attendance' | 'request';
  }): void {
    const list = this.getNotifications();
    list.unshift({
      notificationId: `notif_${Date.now()}_${Math.random()}`,
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type,
      read: false,
      createdAt: new Date().toISOString(),
    });
    this.set(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  public markNotificationAsRead(notifId: string): void {
    const list = this.getNotifications();
    const target = list.find((n) => n.notificationId === notifId);
    if (target) {
      target.read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  // --- Audit Logs (Requirement #32) ---
  public getAuditLogs(): AuditLogEntry[] {
    return this.get<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public addAuditLog(entry: {
    userId: string;
    userName: string;
    userRole: UserRole;
    action: string;
    details: string;
  }): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: entry.userId,
      userName: entry.userName,
      userRole: entry.userRole,
      action: entry.action,
      details: entry.details,
      timestamp: new Date().toISOString(),
    });
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200)); // cap at 200 items for memory efficiency
  }

  // --- Reminder Settings (Requirement #14) ---
  public getReminderSetting(): ReminderSetting {
    return this.get<ReminderSetting>(STORAGE_KEYS.REMINDER_SETTING, {
      enabled: true,
      minutesBefore: 30,
    });
  }

  public setReminderSetting(setting: ReminderSetting): void {
    this.set(STORAGE_KEYS.REMINDER_SETTING, setting);
  }

  // --- Data Export & Local Backup (Requirements #17 & #18) ---
  public exportStudentsToCSV(groupId: string): string {
    const group = this.getGroupById(groupId);
    const members = this.getMembersByGroup(groupId);
    const profiles = this.getStudentProfiles();

    let csv = '\uFEFF' + 'الرقم,اسم الطالب,الصف الدراسي,المدرسة,كود ربط ولي الأمر,تاريخ الانضمام\n';
    members.forEach((m, idx) => {
      const prof = profiles.find((p) => p.studentId === m.studentId);
      csv += `${idx + 1},"${m.studentName}","${m.studentGrade}","${prof?.school || '-'}","${prof?.linkingCode || '-'}","${m.joinedAt}"\n`;
    });
    return csv;
  }

  public exportAttendanceToCSV(groupId: string): string {
    const group = this.getGroupById(groupId);
    const records = this.getAttendance().filter((a) => a.groupId === groupId);

    let csv = '\uFEFF' + 'التاريخ,اسم الطالب,الحالة,التسجيل\n';
    records.forEach((r) => {
      const statusAr = r.status === 'present' ? 'حاضر' : r.status === 'late' ? 'متأخر' : 'غائب';
      csv += `"${r.date}","${r.studentName}","${statusAr}","${r.createdAt.split('T')[0]}"\n`;
    });
    return csv;
  }

  public exportGradesToCSV(groupId: string): string {
    const grades = this.getGradesByGroup(groupId);
    let csv = '\uFEFF' + 'اسم الطالب,اسم الاختبار,الدرجة,الدرجة النهائية,النسبة,التاريخ\n';
    grades.forEach((g) => {
      const percent = Math.round((g.score / g.maxScore) * 100);
      csv += `"${g.studentName}","${g.title}",${g.score},${g.maxScore},"${percent}%","${g.date}"\n`;
    });
    return csv;
  }

  public exportFullBackupJSON(): string {
    const allData = this.exportAllDataForSync();
    const safeUsers = (allData.users || []).map(({ passwordHash, ...u }: any) => u);
    const backupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      ...allData,
      users: safeUsers,
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importFullBackupJSON(jsonStr: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object' || !data.version || !Array.isArray(data.users) || !Array.isArray(data.groups)) {
        return { success: false, error: 'الملف غير صالح أو لا يحتوي على بنية بيانات يلا درس الصحيحة' };
      }

      const validUsers = data.users.every(
        (u: any) => u && typeof u.id === 'string' && typeof u.name === 'string' && typeof u.email === 'string' && typeof u.role === 'string'
      );
      const validGroups = data.groups.every(
        (g: any) => g && typeof g.groupId === 'string' && typeof g.name === 'string' && typeof g.teacherId === 'string'
      );

      if (!validUsers || !validGroups) {
        return { success: false, error: 'بنية سجلات المستخدمين أو المجموعات في النسخة الاحتياطية تالفة أو غير مكتملة' };
      }

      this.importServerState(data);

      this.addAuditLog({
        userId: 'admin',
        userName: 'مستخدم',
        userRole: 'admin',
        action: 'استيراد نسخة احتياطية',
        details: 'تم التحقق من صحة المخطط واستيراد نسخة احتياطية محلية شاملة بنجاح دون أخطاء',
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية (JSON غير صالح)' };
    }
  }

  // --- Admin ---
  public toggleUserStatus(userId: string): boolean {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (target) {
      target.status = target.status === 'active' ? 'suspended' : 'active';
      this.set(STORAGE_KEYS.USERS, users);
      return true;
    }
    return false;
  }

  public deleteUserSoft(userId: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'المستخدم غير موجود' };

    target.status = 'suspended';
    this.set(STORAGE_KEYS.USERS, users);

    this.addAuditLog({
      userId,
      userName: target.name,
      userRole: target.role,
      action: 'تعطيل/حذف الحساب',
      details: `تم إلغاء تفعيل حساب ${target.name} (${target.email}) مع الحفاظ على سلامة سجلات المجموعات`,
    });

    const curr = this.getCurrentUser();
    if (curr && curr.id === userId) {
      this.setCurrentUser(null);
    }
    return { success: true };
  }

  public getReports(): AppReport[] {
    return this.get<AppReport[]>(STORAGE_KEYS.REPORTS, []);
  }

  public addReport(params: {
    userId: string;
    userName: string;
    userRole: UserRole;
    title: string;
    description: string;
  }): { success: boolean } {
    const reports = this.getReports();
    reports.unshift({
      id: `rep_${Date.now()}`,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      title: params.title.trim(),
      description: params.description.trim(),
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    });
    this.set(STORAGE_KEYS.REPORTS, reports);
    return { success: true };
  }

  // ==========================================
  // TOP 10 HIGH-VALUE FREE ENHANCEMENTS METHODS
  // ==========================================

  // --- 1. Tuition Payments / Subscriptions ---
  public getTuitionPayments(): TuitionPayment[] {
    return this.get<TuitionPayment[]>(STORAGE_KEYS.PAYMENTS, []);
  }

  public getTuitionPaymentsByGroup(groupId: string): TuitionPayment[] {
    return this.getTuitionPayments().filter((p) => p.groupId === groupId);
  }

  public getTuitionPaymentsByStudent(studentId: string): TuitionPayment[] {
    return this.getTuitionPayments().filter((p) => p.studentId === studentId);
  }

  public updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    paidAmount?: number,
    notes?: string,
    paymentMethod?: 'cash' | 'vodafone_cash' | 'instapay' | 'electronic',
    transactionRef?: string,
    receivedBy?: string
  ): boolean {
    const payments = this.getTuitionPayments();
    const item = payments.find((p) => p.paymentId === paymentId);
    if (!item) return false;

    item.status = status;
    if (paidAmount !== undefined) item.paidAmount = paidAmount;
    if (status === 'paid' && !item.paidDate) {
      item.paidDate = new Date().toISOString().split('T')[0];
    }
    if (notes !== undefined) item.notes = notes;
    if (paymentMethod !== undefined) item.paymentMethod = paymentMethod;
    if (transactionRef !== undefined) item.transactionRef = transactionRef;
    if (receivedBy !== undefined) item.receivedBy = receivedBy;

    this.set(STORAGE_KEYS.PAYMENTS, payments);
    return true;
  }

  public addTuitionPayment(params: Omit<TuitionPayment, 'paymentId'>): {
    success: boolean;
    payment: TuitionPayment;
  } {
    const payments = this.getTuitionPayments();
    const newPayment: TuitionPayment = {
      ...params,
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    payments.unshift(newPayment);
    this.set(STORAGE_KEYS.PAYMENTS, payments);
    return { success: true, payment: newPayment };
  }

  // --- 2. Study Materials & Notes Bank ---
  public getMaterials(): GroupMaterial[] {
    return this.get<GroupMaterial[]>(STORAGE_KEYS.MATERIALS, []);
  }

  public getMaterialsByGroup(groupId: string): GroupMaterial[] {
    return this.getMaterials().filter((m) => m.groupId === groupId);
  }

  public addMaterial(params: Omit<GroupMaterial, 'materialId' | 'createdAt'>): {
    success: boolean;
    material: GroupMaterial;
  } {
    const materials = this.getMaterials();
    const newMat: GroupMaterial = {
      ...params,
      materialId: `mat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    materials.unshift(newMat);
    this.set(STORAGE_KEYS.MATERIALS, materials);

    // Notify students of the group
    const members = this.getMembersByGroup(params.groupId);
    members.forEach((m) => {
      this.addNotification({
        userId: m.studentId,
        title: 'مذكرة / ملف جديد متاح',
        body: `قام المدرس بإضافة (${newMat.title}) في مجموعة ${newMat.groupName}`,
        type: 'announcement',
      });
    });

    return { success: true, material: newMat };
  }

  public deleteMaterial(materialId: string): boolean {
    syncEngine.addTombstone('materials', materialId);
    const materials = this.getMaterials().filter((m) => m.materialId !== materialId);
    this.set(STORAGE_KEYS.MATERIALS, materials);
    return true;
  }

  // --- 3. Badges & Achievement System ---
  public getBadges(): StudentBadge[] {
    return this.get<StudentBadge[]>(STORAGE_KEYS.BADGES, []);
  }

  public getBadgesByStudent(studentId: string): StudentBadge[] {
    return this.getBadges().filter((b) => b.studentId === studentId);
  }

  public getBadgesByGroup(groupId: string): StudentBadge[] {
    return this.getBadges().filter((b) => b.groupId === groupId);
  }

  public awardBadge(params: Omit<StudentBadge, 'badgeId' | 'awardedAt'>): {
    success: boolean;
    badge: StudentBadge;
  } {
    const badges = this.getBadges();
    const newBadge: StudentBadge = {
      ...params,
      badgeId: `bdg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      awardedAt: new Date().toISOString(),
    };
    badges.unshift(newBadge);
    this.set(STORAGE_KEYS.BADGES, badges);

    // Notify student and parent
    this.addNotification({
      userId: params.studentId,
      title: '🎉 وسام تميز جديد!',
      body: `تهانينا! حصلت على وسام (${newBadge.title}) من المدرس: ${newBadge.description}`,
      type: 'announcement',
    });

    // Notify parents
    const parentLinks = this.getParentStudents().filter((ps) => ps.studentId === params.studentId);
    parentLinks.forEach((pl) => {
      this.addNotification({
        userId: pl.parentId,
        title: '🌟 وسام تكريم لابنك!',
        body: `حصل ابنكم (${newBadge.studentName}) على وسام (${newBadge.title}) في مادة الرياضيات.`,
        type: 'announcement',
      });
    });

    return { success: true, badge: newBadge };
  }

  public deleteBadge(badgeId: string): boolean {
    syncEngine.addTombstone('badges', badgeId);
    const badges = this.getBadges().filter((b) => b.badgeId !== badgeId);
    this.set(STORAGE_KEYS.BADGES, badges);
    return true;
  }

  // --- 4. Interactive Practice Quizzes ---
  public getQuizzes(): PracticeQuiz[] {
    return this.get<PracticeQuiz[]>(STORAGE_KEYS.QUIZZES, []);
  }

  public getQuizzesByGroup(groupId: string): PracticeQuiz[] {
    return this.getQuizzes().filter((q) => q.groupId === groupId);
  }

  public getQuizById(quizId: string): PracticeQuiz | undefined {
    return this.getQuizzes().find((q) => q.quizId === quizId);
  }

  public getQuizSubmissions(studentId?: string): QuizSubmission[] {
    const subs = this.get<QuizSubmission[]>(STORAGE_KEYS.QUIZ_SUBMISSIONS, []);
    if (studentId) return subs.filter((s) => s.studentId === studentId);
    return subs;
  }

  public submitQuiz(params: Omit<QuizSubmission, 'submissionId' | 'submittedAt'>): {
    success: boolean;
    submission: QuizSubmission;
  } {
    const submissions = this.getQuizSubmissions();
    const submissionId = `sub_${params.quizId}_${params.studentId}`;
    const newSub: QuizSubmission = {
      ...params,
      submissionId,
      submittedAt: new Date().toISOString(),
    };
    // Replace if already submitted or unshift
    const idx = submissions.findIndex(
      (s) => s.quizId === params.quizId && s.studentId === params.studentId
    );
    if (idx >= 0) {
      submissions[idx] = newSub;
    } else {
      submissions.unshift(newSub);
    }
    this.set(STORAGE_KEYS.QUIZ_SUBMISSIONS, submissions);

    const quiz = this.getQuizById(params.quizId);
    if (quiz) {
      const allGrades = this.getGrades();
      const gradeId = `grade_quiz_${params.quizId}_${params.studentId}`;
      const gradeIdx = allGrades.findIndex((g) => g.gradeId === gradeId);
      const gradeRec: GradeRecord = {
        gradeId,
        groupId: quiz.groupId,
        groupName: quiz.groupName,
        studentId: params.studentId,
        studentName: params.studentName,
        title: `كويز تفاعلي: ${quiz.title}`,
        score: params.score,
        maxScore: params.totalQuestions,
        date: new Date().toISOString().split('T')[0],
      };
      if (gradeIdx >= 0) {
        allGrades[gradeIdx] = gradeRec;
      } else {
        allGrades.unshift(gradeRec);
      }
      this.set(STORAGE_KEYS.GRADES, allGrades);

      const parentLinks = this.getParentStudents().filter(
        (ps) => ps.studentId === params.studentId && ps.status === 'active'
      );
      parentLinks.forEach((pl) => {
        this.addNotification({
          userId: pl.parentId,
          title: `نتيجة كويز فوري للابن (${params.studentName})`,
          body: `حصل ${params.studentName} على ${params.score} من ${params.totalQuestions} في الكويز التفاعلي (${quiz.title}).`,
          type: 'grade',
        });
      });
    }

    return { success: true, submission: newSub };
  }

  // --- 5. Certificates of Appreciation ---
  public getCertificates(): StudentCertificate[] {
    return this.get<StudentCertificate[]>(STORAGE_KEYS.CERTIFICATES, []);
  }

  public getCertificatesByStudent(studentId: string): StudentCertificate[] {
    return this.getCertificates().filter((c) => c.studentId === studentId);
  }

  public createCertificate(
    params: Omit<StudentCertificate, 'certificateId' | 'issueDate'>
  ): { success: boolean; certificate: StudentCertificate } {
    const certificates = this.getCertificates();
    const newCert: StudentCertificate = {
      ...params,
      certificateId: `cert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      issueDate: new Date().toISOString().split('T')[0],
    };
    certificates.unshift(newCert);
    this.set(STORAGE_KEYS.CERTIFICATES, certificates);

    // Notify student and parent
    this.addNotification({
      userId: params.studentId,
      title: '📜 شهادة تقدير جديدة!',
      body: `تم إصدار شهادة تقدير رسمية لك بعنوان: (${newCert.title})`,
      type: 'announcement',
    });

    const parentLinks = this.getParentStudents().filter((ps) => ps.studentId === params.studentId);
    parentLinks.forEach((pl) => {
      this.addNotification({
        userId: pl.parentId,
        title: '📜 تكريم ابنكم بشهادة تقدير!',
        body: `أصدر المدرس شهادة تقدير للطالب (${newCert.studentName}) لتفوقه واجتهاده.`,
        type: 'announcement',
      });
    });

    return { success: true, certificate: newCert };
  }

  // --- 6. Live Online Classroom & Whiteboard ---
  public getLiveSessions(): LiveSession[] {
    return this.get<LiveSession[]>(STORAGE_KEYS.LIVE_SESSIONS, []);
  }

  public getLiveSessionsByGroup(groupId: string): LiveSession[] {
    return this.getLiveSessions().filter((s) => s.groupId === groupId);
  }

  public getActiveLiveSession(groupId?: string): LiveSession | null {
    const sessions = this.getLiveSessions();
    if (groupId) {
      return sessions.find((s) => s.groupId === groupId && s.status === 'live') || null;
    }
    return sessions.find((s) => s.status === 'live') || null;
  }

  public getActiveLiveSessionsForStudent(studentId: string): LiveSession[] {
    const studentGroups = this.getGroupsForStudent(studentId);
    const groupIds = new Set(studentGroups.map((g) => g.groupId));
    return this.getLiveSessions().filter((s) => s.status === 'live' && groupIds.has(s.groupId));
  }

  public startLiveSession(params: {
    groupId: string;
    groupName: string;
    teacherId: string;
    teacherName: string;
    title: string;
    platform: LiveClassPlatform;
    meetingUrl?: string;
    roomName?: string;
    notes?: string;
  }): { success: boolean; session: LiveSession } {
    const sessions = this.getLiveSessions();
    
    // End any existing live session for this group first
    sessions.forEach((s) => {
      if (s.groupId === params.groupId && s.status === 'live') {
        s.status = 'ended';
        s.endedAt = new Date().toISOString();
      }
    });

    const sessionId = `live_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const safeRoomName = params.roomName || `YallaDars_${params.groupId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const safeMeetingUrl = params.meetingUrl || `https://meet.jit.si/${safeRoomName}`;

    const newSession: LiveSession = {
      sessionId,
      groupId: params.groupId,
      groupName: params.groupName,
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      title: params.title || `حصة أونلاين مباشرة — ${params.groupName}`,
      platform: params.platform,
      meetingUrl: safeMeetingUrl,
      roomName: safeRoomName,
      status: 'live',
      startedAt: new Date().toISOString(),
      notes: params.notes,
    };

    sessions.unshift(newSession);
    this.set(STORAGE_KEYS.LIVE_SESSIONS, sessions);

    // Notify all group students & their parents immediately!
    const members = this.getMembersByGroup(params.groupId);
    members.forEach((m) => {
      this.addNotification({
        userId: m.studentId,
        title: '🔴 بدأت الحصة أونلاين الآن!',
        body: `بدأ ${params.teacherName} بث الحصة المباشرة لمجموعة (${params.groupName}). اضغط للدخول للسبورة والبث.`,
        type: 'session',
      });

      // Notify parent
      const parentLinks = this.getParentStudents().filter((ps) => ps.studentId === m.studentId);
      parentLinks.forEach((pl) => {
        this.addNotification({
          userId: pl.parentId,
          title: '🔴 تنبيه: بدأت حصة ابنكم أونلاين',
          body: `بدأت الحصة المباشرة لمجموعة (${params.groupName}) مع ${params.teacherName} الآن.`,
          type: 'session',
        });
      });
    });

    return { success: true, session: newSession };
  }

  public endLiveSession(
    sessionId: string,
    whiteboardSnapshot?: string
  ): { success: boolean } {
    const sessions = this.getLiveSessions();
    const session = sessions.find((s) => s.sessionId === sessionId);
    if (!session) return { success: false };

    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    if (whiteboardSnapshot) {
      session.whiteboardSnapshot = whiteboardSnapshot;
    }

    this.set(STORAGE_KEYS.LIVE_SESSIONS, sessions);
    return { success: true };
  }

  public saveWhiteboardSnapshot(sessionId: string, whiteboardSnapshot: string): boolean {
    const sessions = this.getLiveSessions();
    const session = sessions.find((s) => s.sessionId === sessionId);
    if (!session) return false;
    session.whiteboardSnapshot = whiteboardSnapshot;
    this.set(STORAGE_KEYS.LIVE_SESSIONS, sessions);
    return true;
  }

  // --- 7. Direct WhatsApp Helper ---
  public formatWhatsAppUrl(phone: string, text: string): string {
    // Clean phone number (Egyptian format: 010... -> 2010...)
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '2' + clean;
    } else if (!clean.startsWith('20') && clean.length === 10) {
      clean = '20' + clean;
    }
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${clean}?text=${encoded}`;
  }
}

export const storage = new StorageService();
