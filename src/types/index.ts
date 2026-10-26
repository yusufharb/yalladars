export type UserRole = 'teacher' | 'assistant' | 'student' | 'parent' | 'admin';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export type NoteVisibility = 'teacher_only' | 'parent_visible';

export type GroupStatus = 'active' | 'paused';

export type JoinApprovalMode = 'auto' | 'requires_approval';

export type HomeworkStatus = 'new' | 'active' | 'closed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface TeacherProfile {
  teacherId: string;
  subject: string;
  grades: string[];
  city: string;
}

export interface StudentProfile {
  studentId: string;
  grade: string;
  school: string;
  linkingCode: string; // Used by parent to link child (e.g. YD-LK-8421)
}

export interface Group {
  groupId: string;
  teacherId: string;
  teacherName: string;
  name: string;
  subject: string;
  grade: string;
  location: string;
  days: string[]; // e.g. ['السبت', 'الثلاثاء']
  startTime: string; // e.g. '06:00 م'
  durationMinutes: number; // e.g. 90
  joinCode: string; // e.g. 'YD-5021'
  status: GroupStatus; // active or paused
  joinApprovalMode: JoinApprovalMode; // auto or requires_approval
  createdAt: string;
}

export interface GroupMember {
  groupId: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  joinedAt: string;
  status: 'active' | 'inactive';
}

export interface JoinRequest {
  requestId: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
}

export interface ParentStudent {
  parentId: string;
  studentId: string;
  studentName: string;
  grade: string;
  school: string;
  linkedAt: string;
  status: 'active';
}

export interface AttendanceHistoryEntry {
  oldStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  modifiedAt: string;
  modifiedBy: string;
}

export interface AttendanceRecord {
  attendanceId: string;
  groupId: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  createdAt: string;
  synced: boolean;
  history?: AttendanceHistoryEntry[];
}

export interface Homework {
  homeworkId: string;
  groupId: string;
  groupName: string;
  title: string;
  description: string;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: HomeworkStatus;
  createdAt: string;
}

export interface Assessment {
  assessmentId: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
  maxScore: number;
  createdAt: string;
}

export interface GradeRecord {
  gradeId: string;
  assessmentId?: string;
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  title: string;
  score: number;
  maxScore: number;
  date: string;
}

export interface Announcement {
  announcementId: string;
  groupId: string;
  groupName: string;
  teacherName: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface AppNotification {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type: 'session' | 'homework' | 'grade' | 'announcement' | 'attendance' | 'request';
  read: boolean;
  createdAt: string;
}

export interface StudentNote {
  noteId: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  text: string;
  visibility: NoteVisibility;
  createdAt: string;
}

export interface AppReport {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  title: string;
  description: string;
  date: string;
  status: 'pending' | 'resolved';
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface AttendanceReportSummary {
  studentId: string;
  studentName: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number; // percentage 0-100
}

export interface ReminderSetting {
  enabled: boolean;
  minutesBefore: 10 | 30 | 60;
}

// --- Top 10 High-Value Free Enhancements Types ---

export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'exempt';

export interface TuitionPayment {
  paymentId: string;
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  month: string; // e.g. "سبتمبر 2026"
  amount: number; // e.g. 250
  paidAmount: number;
  status: PaymentStatus;
  paymentMethod?: 'cash' | 'vodafone_cash' | 'instapay' | 'electronic';
  transactionRef?: string;
  receivedBy?: string;
  paidDate?: string;
  notes?: string;
}

export type MaterialType = 'pdf' | 'video' | 'summary' | 'link';

export interface GroupMaterial {
  materialId: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  title: string;
  unit: string;
  type: MaterialType;
  url: string;
  description: string;
  fileSize?: string;
  createdAt: string;
}

export type BadgeType = 'star' | 'punctual' | 'homework_hero' | 'genius' | 'most_improved';

export interface StudentBadge {
  badgeId: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  badgeType: BadgeType;
  title: string;
  icon: string;
  description: string;
  awardedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PracticeQuiz {
  quizId: string;
  groupId: string;
  groupName: string;
  title: string;
  subject: string;
  questions: QuizQuestion[];
  timeMinutes: number;
  createdAt: string;
}

export interface QuizSubmission {
  submissionId: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, number>;
  submittedAt: string;
}

export interface StudentCertificate {
  certificateId: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  teacherName: string;
  subject: string;
  title: string;
  reason: string;
  gradeScore?: string;
  issueDate: string;
}

// --- Live Online Classroom & Whiteboard Types ---

export type LiveClassPlatform = 'jitsi' | 'whiteboard' | 'custom';

export interface LiveSession {
  sessionId: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  platform: LiveClassPlatform;
  meetingUrl: string;
  roomName: string;
  status: 'live' | 'ended';
  whiteboardSnapshot?: string; // Data URL of the exported whiteboard drawing
  startedAt: string;
  endedAt?: string;
  notes?: string;
}
