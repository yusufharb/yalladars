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
  LiveClassPlatform
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
  INITIAL_LIVE_SESSIONS
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
    return {
      users: this.getUsers(),
      teachers: this.getTeachers(),
      students: this.getStudentProfiles(),
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
    };
  }

  public importServerState(serverState: any) {
    if (!serverState || typeof serverState !== 'object') return;
    const sanitize = (list: any[]) => {
      if (!Array.isArray(list)) return [];
      return list.flat(Infinity).filter((item) => item && typeof item === 'object' && !Array.isArray(item));
    };
    if (Array.isArray(serverState.users)) this.set(STORAGE_KEYS.USERS, sanitize(serverState.users), false);
    if (Array.isArray(serverState.teachers)) this.set(STORAGE_KEYS.TEACHERS, sanitize(serverState.teachers), false);
    if (Array.isArray(serverState.students)) this.set(STORAGE_KEYS.STUDENTS, sanitize(serverState.students), false);
    if (Array.isArray(serverState.groups)) this.set(STORAGE_KEYS.GROUPS, sanitize(serverState.groups), false);
    if (Array.isArray(serverState.members)) this.set(STORAGE_KEYS.MEMBERS, sanitize(serverState.members), false);
    if (Array.isArray(serverState.parentStudents)) this.set(STORAGE_KEYS.PARENT_STUDENTS, sanitize(serverState.parentStudents), false);
    if (Array.isArray(serverState.attendance)) this.set(STORAGE_KEYS.ATTENDANCE, sanitize(serverState.attendance), false);
    if (Array.isArray(serverState.homework)) this.set(STORAGE_KEYS.HOMEWORK, sanitize(serverState.homework), false);
    if (Array.isArray(serverState.assessments)) this.set(STORAGE_KEYS.ASSESSMENTS, sanitize(serverState.assessments), false);
    if (Array.isArray(serverState.grades)) this.set(STORAGE_KEYS.GRADES, sanitize(serverState.grades), false);
    if (Array.isArray(serverState.announcements)) this.set(STORAGE_KEYS.ANNOUNCEMENTS, sanitize(serverState.announcements), false);
    if (Array.isArray(serverState.notes)) this.set(STORAGE_KEYS.NOTES, sanitize(serverState.notes), false);
    if (Array.isArray(serverState.notifications)) this.set(STORAGE_KEYS.NOTIFICATIONS, sanitize(serverState.notifications), false);
    if (Array.isArray(serverState.joinRequests)) this.set(STORAGE_KEYS.JOIN_REQUESTS, sanitize(serverState.joinRequests), false);
    if (Array.isArray(serverState.auditLogs)) this.set(STORAGE_KEYS.AUDIT_LOGS, sanitize(serverState.auditLogs), false);
    if (Array.isArray(serverState.reports)) this.set(STORAGE_KEYS.REPORTS, sanitize(serverState.reports), false);
    if (Array.isArray(serverState.payments)) this.set(STORAGE_KEYS.PAYMENTS, sanitize(serverState.payments), false);
    if (Array.isArray(serverState.materials)) this.set(STORAGE_KEYS.MATERIALS, sanitize(serverState.materials), false);
    if (Array.isArray(serverState.badges)) this.set(STORAGE_KEYS.BADGES, sanitize(serverState.badges), false);
    if (Array.isArray(serverState.quizzes)) this.set(STORAGE_KEYS.QUIZZES, sanitize(serverState.quizzes), false);
    if (Array.isArray(serverState.quizSubmissions)) this.set(STORAGE_KEYS.QUIZ_SUBMISSIONS, sanitize(serverState.quizSubmissions), false);
    if (Array.isArray(serverState.certificates)) this.set(STORAGE_KEYS.CERTIFICATES, sanitize(serverState.certificates), false);
    if (Array.isArray(serverState.liveSessions)) this.set(STORAGE_KEYS.LIVE_SESSIONS, sanitize(serverState.liveSessions), false);
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
      localStorage.setItem(
        STORAGE_KEYS.REMINDER_SETTING,
        JSON.stringify({ enabled: true, minutesBefore: 30 })
      );
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      this.notify();
    } else {
      // Validate and clean any legacy nested arrays in localStorage, and ensure seed users exist
      try {
        const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        if (storedUsers) {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.some((x: any) => Array.isArray(x))) {
            const cleaned = parsed.flat(Infinity).filter((x: any) => x && typeof x === 'object' && !Array.isArray(x));
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleaned));
          }
        }

        const currentUsers = this.getUsers();
        let usersUpdated = false;
        for (const initU of INITIAL_USERS) {
          const existing = currentUsers.find(u => u.id === initU.id);
          if (!existing) {
            currentUsers.push(initU);
            usersUpdated = true;
          } else if (existing.status !== initU.status || existing.name !== initU.name) {
            existing.status = initU.status;
            existing.name = initU.name;
            usersUpdated = true;
          }
        }
        if (usersUpdated) {
          this.set(STORAGE_KEYS.USERS, currentUsers, false);
        }

        const currentStudents = this.getStudentProfiles();
        let stuUpdated = false;
        for (const initStu of INITIAL_STUDENTS) {
          if (!currentStudents.some(s => s.studentId === initStu.studentId)) {
            currentStudents.push(initStu);
            stuUpdated = true;
          }
        }
        if (stuUpdated) {
          this.set(STORAGE_KEYS.STUDENTS, currentStudents, false);
        }

        const currentMembers = this.getMembers();
        let memUpdated = false;
        for (const initMem of INITIAL_MEMBERS) {
          if (!currentMembers.some(m => m.groupId === initMem.groupId && m.studentId === initMem.studentId)) {
            currentMembers.push(initMem);
            memUpdated = true;
          }
        }
        if (memUpdated) {
          this.set(STORAGE_KEYS.MEMBERS, currentMembers, false);
        }

        const currentPS = this.getParentStudents();
        let psUpdated = false;
        for (const initPS of INITIAL_PARENT_STUDENTS) {
          if (!currentPS.some(p => p.parentId === initPS.parentId && p.studentId === initPS.studentId)) {
            currentPS.push(initPS);
            psUpdated = true;
          }
        }
        if (psUpdated) {
          this.set(STORAGE_KEYS.PARENT_STUDENTS, currentPS, false);
        }

        // Initialize any missing new collections
        if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
          localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
          localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(INITIAL_MATERIALS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.BADGES)) {
          localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(INITIAL_BADGES));
        }
        if (!localStorage.getItem(STORAGE_KEYS.QUIZZES)) {
          localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(INITIAL_QUIZZES));
        }
        if (!localStorage.getItem(STORAGE_KEYS.QUIZ_SUBMISSIONS)) {
          localStorage.setItem(STORAGE_KEYS.QUIZ_SUBMISSIONS, JSON.stringify(INITIAL_QUIZ_SUBMISSIONS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) {
          localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(INITIAL_CERTIFICATES));
        }
      } catch {}
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
    localStorage.setItem(key, JSON.stringify(sanitizedValue));
    
    if (shouldEnqueueSync) {
      // Map storage key to sync entity type
      const keyMap: Record<string, string> = {
        [STORAGE_KEYS.USERS]: 'users',
        [STORAGE_KEYS.TEACHERS]: 'teachers',
        [STORAGE_KEYS.STUDENTS]: 'students',
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
      };
      const entityType = keyMap[key];
      if (entityType) {
        syncEngine.enqueueChange(entityType, 'upsert', value);
      }
    }
    
    this.notify();
  }

  // --- Auth / Current User ---
  public getCurrentUser(): User | null {
    return this.get<User | null>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  }

  public setCurrentUser(user: User | null): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, []);
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  public registerUser(params: {
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    subject?: string;
    grade?: string;
    school?: string;
  }): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanEmail = params.email.trim().toLowerCase();

    if (!params.name.trim()) {
      return { success: false, error: 'الاسم مطلوب' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'البريد الإلكتروني غير صحيح' };
    }

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً' };
    }

    const newId = `user_${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: params.name.trim(),
      email: cleanEmail,
      role: params.role,
      phone: params.phone?.trim() || '',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.set(STORAGE_KEYS.USERS, users);

    // Profile specifics
    if (params.role === 'teacher') {
      const teachers = this.get<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, []);
      teachers.push({
        teacherId: newId,
        subject: params.subject?.trim() || 'عام',
        grades: params.grade ? [params.grade] : ['المرحلة الثانوية'],
        city: 'مصر',
      });
      this.set(STORAGE_KEYS.TEACHERS, teachers);
    } else if (params.role === 'student') {
      const students = this.get<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
      const linkingCode = `YD-LK-${Math.floor(1000 + Math.random() * 9000)}`;
      students.push({
        studentId: newId,
        grade: params.grade?.trim() || 'الصف الأول الثانوي',
        school: params.school?.trim() || 'مدرسة حكومية',
        linkingCode,
      });
      this.set(STORAGE_KEYS.STUDENTS, students);
    }

    this.setCurrentUser(newUser);
    return { success: true, user: newUser };
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

  public loginUser(email: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      return { success: false, error: 'الحساب غير موجود، يرجى إنشاء حساب جديد' };
    }
    if (found.status === 'suspended') {
      return { success: false, error: 'تم تعطيل هذا الحساب من قبل الإدارة' };
    }

    this.setCurrentUser(found);
    return { success: true, user: found };
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
    return this.getStudentProfiles().find((s) => s.studentId === studentId);
  }

  public regenerateStudentLinkingCode(studentId: string): string {
    const profiles = this.getStudentProfiles();
    const prof = profiles.find((s) => s.studentId === studentId);
    const newCode = `YD-LK-${Math.floor(1000 + Math.random() * 9000)}`;
    if (prof) {
      prof.linkingCode = newCode;
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

  public linkChildByCode(parentId: string, linkingCode: string): { success: boolean; studentName?: string; error?: string } {
    const cleanCode = linkingCode.trim().toUpperCase();
    const studentProfile = this.getStudentProfiles().find((s) => s.linkingCode.toUpperCase() === cleanCode);

    if (!studentProfile) {
      return { success: false, error: 'كود الطالب غير صحيح، اطلب من ابنك كود الربط من صفحته الشخصية' };
    }

    const studentUser = this.getUserById(studentProfile.studentId);
    if (!studentUser) {
      return { success: false, error: 'بيانات الطالب غير متوفرة' };
    }

    const parentStudents = this.getParentStudents();
    const alreadyLinked = parentStudents.some((ps) => ps.parentId === parentId && ps.studentId === studentProfile.studentId);

    if (alreadyLinked) {
      return { success: false, error: 'تم ربط هذا الطالب بحسابك من قبل!' };
    }

    parentStudents.push({
      parentId,
      studentId: studentProfile.studentId,
      studentName: studentUser.name,
      grade: studentProfile.grade,
      school: studentProfile.school,
      linkedAt: new Date().toISOString().split('T')[0],
      status: 'active',
    });

    this.set(STORAGE_KEYS.PARENT_STUDENTS, parentStudents);

    this.addNotification({
      userId: parentId,
      title: 'تم ربط الابن بنجاح',
      body: `تم ربط حساب الابن (${studentUser.name}) بحسابك بنجاح. يمكنك الآن متابعة حضوره ودرجاته وواجباته.`,
      type: 'session',
    });

    return { success: true, studentName: studentUser.name };
  }

  public unlinkChild(parentId: string, studentId: string): boolean {
    const parentStudents = this.getParentStudents();
    const target = parentStudents.find((ps) => ps.parentId === parentId && ps.studentId === studentId);
    if (target) {
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
    const backupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      ...this.exportAllDataForSync(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importFullBackupJSON(jsonStr: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.version || !Array.isArray(data.users) || !Array.isArray(data.groups)) {
        return { success: false, error: 'الملف غير صالح أو لا يحتوي على بنية بيانات يلا درس الصحيحة' };
      }

      this.importServerState(data);

      this.addAuditLog({
        userId: 'admin',
        userName: 'مستخدم',
        userRole: 'admin',
        action: 'استيراد نسخة احتياطية',
        details: 'تم استيراد نسخة احتياطية محلية شاملة بنجاح دون أخطاء',
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية' };
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
    const newSub: QuizSubmission = {
      ...params,
      submissionId: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
