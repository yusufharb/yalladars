import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import { AttendanceStatus, Group, NoteVisibility, Assessment } from '../../types';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Award,
  Bell,
  Users,
  FileText,
  Plus,
  Save,
  QrCode,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  BarChart2,
  FileSpreadsheet,
  PauseCircle,
  PlayCircle,
  History,
  Search,
  Filter,
  DollarSign,
  FolderDown,
  Trophy,
  Sparkles,
  Send,
  Printer,
  Zap,
  CheckCheck,
  BellRing,
  Camera,
  MessageCircle,
  Share2,
  Video
} from 'lucide-react';
import { TeacherLiveTab } from './TeacherLiveTab';
import { TeacherPaymentsTab } from './TeacherPaymentsTab';
import { TeacherMaterialsTab } from './TeacherMaterialsTab';
import { TeacherLeaderboardTab } from './TeacherLeaderboardTab';
import { TeacherCertificatesTab } from './TeacherCertificatesTab';
import { WhatsAppQuickModal } from '../common/WhatsAppQuickModal';
import { StudentPrintReportModal } from '../common/StudentPrintReportModal';
import { AttendanceQRScannerModal } from '../common/AttendanceQRScannerModal';

interface TeacherGroupDetailProps {
  groupId: string;
  initialTab?: 'attendance' | 'live' | 'homework' | 'grades' | 'announcements' | 'students' | 'notes' | 'reports' | 'assessments' | 'payments' | 'materials' | 'leaderboard' | 'certificates';
  onBack: () => void;
  onViewQrCode: (group: Group) => void;
}

export const TeacherGroupDetail: React.FC<TeacherGroupDetailProps> = ({
  groupId,
  initialTab = 'attendance',
  onBack,
  onViewQrCode,
}) => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const group = storage.getGroupById(groupId);

  const [activeTab, setActiveTab] = useState<
    'attendance' | 'live' | 'reports' | 'homework' | 'assessments' | 'grades' | 'students' | 'announcements' | 'notes' | 'payments' | 'materials' | 'leaderboard' | 'certificates'
  >(initialTab as any);

  // WhatsApp & Report Modals state
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    isOpen: boolean;
    studentName: string;
    phone: string;
    contextType: any;
    extraData: any;
  }>({
    isOpen: false,
    studentName: '',
    phone: '',
    contextType: 'attendance_absence',
    extraData: {},
  });

  const [reportModalData, setReportModalData] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
  }>({
    isOpen: false,
    studentId: '',
    studentName: '',
  });

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'late'>('all');

  // Group members & student profiles
  const members = storage.getMembersByGroup(groupId);
  const studentProfiles = storage.getStudentProfiles();
  const pendingRequests = storage.getJoinRequestsByGroup(groupId);

  // Attendance local draft state for the date
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, AttendanceStatus>>(() => {
    const existing = storage.getAttendanceByGroupAndDate(groupId, selectedDate);
    const draft: Record<string, AttendanceStatus> = {};
    members.forEach((m) => {
      const match = existing.find((e) => e.studentId === m.studentId);
      draft[m.studentId] = match ? match.status : 'present';
    });
    return draft;
  });

  // Feature: 1-Click Instant Attendance & Instant Parent Notification
  const [instantMode, setInstantMode] = useState<boolean>(true);
  const [lastNotifiedStudent, setLastNotifiedStudent] = useState<{
    studentName: string;
    parentName: string;
    status: AttendanceStatus;
    timestamp: string;
  } | null>(null);
  const [showAbsenceLogModal, setShowAbsenceLogModal] = useState<boolean>(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState<boolean>(false);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Homework state
  const homeworkList = storage.getHomeworkByGroup(groupId);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  // Assessments & Grades state (V2)
  const assessmentsList = storage.getAssessmentsByGroup(groupId);
  const gradesList = storage.getGradesByGroup(groupId);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessmentsList[0]?.assessmentId || ''
  );
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [asmTitle, setAsmTitle] = useState('');
  const [asmMaxScore, setAsmMaxScore] = useState<number>(20);
  const [asmDate, setAsmDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Batch grade draft for selected assessment
  const [batchGrades, setBatchGrades] = useState<Record<string, number>>(() => {
    const draft: Record<string, number> = {};
    if (selectedAssessmentId) {
      const existing = storage.getGradesByAssessment(selectedAssessmentId);
      existing.forEach((g) => {
        const val = Number(g.score);
        if (!Number.isNaN(val)) {
          draft[g.studentId] = val;
        }
      });
    }
    return draft;
  });

  // Announcements state
  const announcementsList = storage.getAnnouncementsByGroup(groupId);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  // Notes state - filtered to current group members only
  const allTeacherNotes = storage.getNotesForTeacher(currentUser?.id || '');
  const notesList = allTeacherNotes.filter((note) =>
    members.some((m) => m.studentId === note.studentId)
  );
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteStudentId, setNoteStudentId] = useState(members[0]?.studentId || '');
  const [noteText, setNoteText] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<NoteVisibility>('parent_visible');

  // State synchronization when groupId or initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    const existing = storage.getAttendanceByGroupAndDate(groupId, selectedDate);
    const currentMembers = storage.getMembersByGroup(groupId);
    const draft: Record<string, AttendanceStatus> = {};
    currentMembers.forEach((m) => {
      const match = existing.find((e) => e.studentId === m.studentId);
      draft[m.studentId] = match ? match.status : 'present';
    });
    setAttendanceDraft(draft);

    const groupAssessments = storage.getAssessmentsByGroup(groupId);
    const firstAsmId = groupAssessments[0]?.assessmentId || '';
    setSelectedAssessmentId(firstAsmId);

    const gradesDraft: Record<string, number> = {};
    if (firstAsmId) {
      const existingGrades = storage.getGradesByAssessment(firstAsmId);
      existingGrades.forEach((g) => {
        const val = Number(g.score);
        if (!Number.isNaN(val)) {
          gradesDraft[g.studentId] = val;
        }
      });
    }
    setBatchGrades(gradesDraft);
  }, [groupId, initialTab]);

  // Ensure noteStudentId is set to an active member of this group
  useEffect(() => {
    if ((!noteStudentId || !members.some((m) => m.studentId === noteStudentId)) && members.length > 0) {
      setNoteStudentId(members[0].studentId);
    }
  }, [members, noteStudentId, showNoteModal]);

  // Reports
  const attendanceSummaries = storage.getGroupAttendanceSummaries(groupId);

  if (!group) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-slate-500">المجموعة غير موجودة</p>
        <button onClick={onBack} className="mt-2 text-xs text-teal-700 font-bold">
          العودة للمجموعات
        </button>
      </div>
    );
  }

  const isPaused = group.status === 'paused';

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const existing = storage.getAttendanceByGroupAndDate(groupId, newDate);
    const draft: Record<string, AttendanceStatus> = {};
    members.forEach((m) => {
      const match = existing.find((e) => e.studentId === m.studentId);
      draft[m.studentId] = match ? match.status : 'present';
    });
    setAttendanceDraft(draft);
  };

  const handleSetStatus = (studentId: string, status: AttendanceStatus, studentName?: string) => {
    // 1. Update draft immediately for UI responsiveness
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: status,
    }));

    // 2. If instantMode is active, perform 1-click save & instant parent notification
    if (instantMode) {
      const name = studentName || members.find((m) => m.studentId === studentId)?.studentName || 'الطالب';
      const res = storage.recordSingleAttendance({
        groupId,
        date: selectedDate,
        studentId,
        studentName: name,
        status,
        modifiedByName: currentUser?.name || 'أستاذ المادة',
      });

      if (res.success) {
        if (status === 'absent') {
          if (res.parentNotified) {
            const parentName = res.parentNames[0] || 'ولي الأمر';
            const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            setLastNotifiedStudent({
              studentName: name,
              parentName,
              status,
              timestamp: time,
            });
            setSaveSuccessMsg(`🚨 تم تسجيل غياب (${name}) وإرسال إشعار فوري لولي أمره (${parentName}) 🔔`);
          } else {
            setSaveSuccessMsg(`🚨 تم تسجيل غياب (${name}) بنجاح (بدون إشعار لعدم ربط ولي أمر بعد)`);
          }
        } else if (status === 'late') {
          if (res.parentNotified) {
            const parentName = res.parentNames[0] || 'ولي الأمر';
            setSaveSuccessMsg(`⏰ تم تسجيل وصول (${name}) متأخراً وإشعار ولي أمره (${parentName}) 🔔`);
          } else {
            setSaveSuccessMsg(`⏰ تم تسجيل وصول (${name}) متأخراً (بدون إشعار لعدم ربط ولي أمر بعد)`);
          }
        } else {
          setSaveSuccessMsg(`✓ تم تسجيل حضور (${name}) بضغطة واحدة وحفظه فوراً`);
        }
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    }
  };

  const handleRecordAllPresentOneClick = () => {
    const res = storage.recordAllPresentOneClick({
      groupId,
      date: selectedDate,
      modifiedByName: currentUser?.name || 'أستاذ المادة',
    });

    if (res.success) {
      const draft: Record<string, AttendanceStatus> = {};
      members.forEach((m) => (draft[m.studentId] = 'present'));
      setAttendanceDraft(draft);

      setSaveSuccessMsg(`⚡ تم تسجيل حضور جميع الطلاب (${res.count} طالب) بضغطة واحدة بنجاح وحفظها تلقائياً ✓`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  const handleSaveAttendance = () => {
    const records = members.map((m) => ({
      studentId: m.studentId,
      studentName: m.studentName,
      status: attendanceDraft[m.studentId] || 'present',
    }));

    const res = storage.saveAttendanceBatch({
      groupId,
      date: selectedDate,
      records,
      modifiedByName: currentUser?.name || 'أستاذ المادة',
    });

    if (res.success) {
      setSaveSuccessMsg(`تم حفظ وتحديث حضور ${res.count} طالباً بنجاح`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    const res = storage.addHomework({
      groupId,
      groupName: group.name,
      title: hwTitle,
      description: hwDesc,
      dueDate: hwDueDate,
    });
    if (res.success) {
      setShowHomeworkModal(false);
      setHwTitle('');
      setHwDesc('');
    }
  };

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const res = storage.createAssessment({
      groupId,
      groupName: group.name,
      teacherId: currentUser?.id || 'user_teacher_1',
      title: asmTitle,
      subject: group.subject,
      date: asmDate,
      maxScore: asmMaxScore,
    });
    if (res.success && res.assessment) {
      setShowAssessmentModal(false);
      setSelectedAssessmentId(res.assessment.assessmentId);
      setBatchGrades({});
      setAsmTitle('');
    }
  };

  const handleSaveBatchGrades = () => {
    const currentAsm = assessmentsList.find((a) => a.assessmentId === selectedAssessmentId);
    if (!currentAsm) return;

    const gradesPayload = members
      .filter((m) => typeof batchGrades[m.studentId] === 'number' && !Number.isNaN(batchGrades[m.studentId]))
      .map((m) => ({
        studentId: m.studentId,
        studentName: m.studentName,
        score: Number(batchGrades[m.studentId]),
      }));

    const res = storage.saveBatchGradesForAssessment({
      assessmentId: currentAsm.assessmentId,
      groupId: group.groupId,
      groupName: group.name,
      title: currentAsm.title,
      maxScore: currentAsm.maxScore,
      date: currentAsm.date,
      grades: gradesPayload,
    });

    if (res.success) {
      setSaveSuccessMsg(`تم حفظ درجات ${res.count} طلاب بنجاح`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    storage.handleJoinRequest(requestId, 'accept');
    setSaveSuccessMsg('تم قبول انضمام الطالب بنجاح');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleRejectRequest = (requestId: string) => {
    storage.handleJoinRequest(requestId, 'reject');
  };

  const handleExportCSV = (type: 'students' | 'attendance' | 'grades') => {
    let csv = '';
    let filename = '';
    if (type === 'students') {
      csv = storage.exportStudentsToCSV(groupId);
      filename = `طلاب_${group.name}.csv`;
    } else if (type === 'attendance') {
      csv = storage.exportAttendanceToCSV(groupId);
      filename = `حضور_${group.name}.csv`;
    } else {
      csv = storage.exportGradesToCSV(groupId);
      filename = `درجات_${group.name}.csv`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleGroupStatus = () => {
    storage.toggleGroupStatus(groupId);
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch = m.studentName.toLowerCase().includes(searchStudent.toLowerCase());
    const currentStatus = attendanceDraft[m.studentId] || 'present';
    const matchesStatus =
      attendanceFilter === 'all' ? true : currentStatus === attendanceFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedAssessment = assessmentsList.find((a) => a.assessmentId === selectedAssessmentId);
  const currentAssessmentStats = selectedAssessmentId ? storage.getAssessmentStats(selectedAssessmentId) : null;

  return (
    <div className="space-y-4 pb-20">
      {/* Top Bar with Group Name & Pause/Resume */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition active:scale-95"
          aria-label="الرجوع"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold text-slate-900 truncate">{group.name}</h1>
            {isPaused && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                متوقفة
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {group.grade} · {group.days.join(' و ')} ({group.startTime})
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleGroupStatus}
            className={`p-2 rounded-xl border text-xs font-bold transition ${
              isPaused
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title={isPaused ? 'استئناف المجموعة' : 'إيقاف المجموعة مؤقتاً'}
          >
            {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onViewQrCode(group)}
            className="rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-2 text-xs font-bold text-teal-800 flex items-center gap-1 hover:bg-teal-100 transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR</span>
          </button>
        </div>
      </div>

      {/* Join Code & Quick Invite Banner */}
      <div className="rounded-2xl bg-teal-900 p-3.5 text-white text-xs shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-teal-200 text-[10px] block">كود انضمام الطلاب:</span>
            <span className="font-mono text-base font-black tracking-wider text-white dir-ltr">
              {group.joinCode}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(group.joinCode);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="flex items-center gap-1 rounded-xl bg-white/20 hover:bg-white/30 px-2.5 py-1.5 font-bold transition active:scale-95"
              title="نسخ الكود فقط"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
            </button>
            <button
              onClick={() => {
                const link = typeof window !== 'undefined' ? `${window.location.origin}/?join=${group.joinCode}` : '';
                navigator.clipboard?.writeText(link);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="flex items-center gap-1 rounded-xl bg-white/20 hover:bg-white/30 px-2.5 py-1.5 font-bold transition active:scale-95"
              title="نسخ الرابط المباشر للتطبيق"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ الرابط'}</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Invite Quick Button */}
        <button
          onClick={() => {
            const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/?join=${group.joinCode}` : '';
            const msg = `السلام عليكم ورحمة الله وبركاته،
ندعوكم للانضمام إلى مجموعة (${group.name}) على تطبيق «يلا درس» 📚

📱 رابط الدخول المباشر:
${joinUrl}

🔑 كود الانضمام للمجموعة:
${group.joinCode}

📌 خطوات سريعة:
1. افتح الرابط على هاتفك
2. سجل كطالب أو اختر التجربة السريعة
3. سيتم إدخال كود المجموعة تلقائياً لمتابعة الحصص والواجبات فوراً!`;
            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank');
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 px-3 text-xs font-bold text-white transition active:scale-95 shadow-2xs"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>إرسال دعوة للطالب / ولي الأمر عبر واتساب مباشرة</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 pb-1 scrollbar-none text-xs">
        {[
          { id: 'attendance', label: 'تسجيل الحضور', icon: CheckCircle2 },
          { id: 'live', label: 'الحصة أونلاين والسبورة 🔴', icon: Video },
          { id: 'payments', label: 'المصروفات والاشتراكات', icon: DollarSign },
          { id: 'materials', label: 'المذكرات والملفات', icon: FolderDown },
          { id: 'leaderboard', label: 'لوحة الشرف', icon: Trophy },
          { id: 'certificates', label: 'شهادات التقدير', icon: Sparkles },
          { id: 'reports', label: 'تقارير الحضور', icon: BarChart2 },
          { id: 'assessments', label: 'الاختبارات والدرجات', icon: Award, count: assessmentsList.length },
          { id: 'homework', label: 'الواجبات', icon: BookOpen, count: homeworkList.length },
          { id: 'students', label: 'الطلاب', icon: Users, count: members.length },
          { id: 'announcements', label: 'الإعلانات', icon: Bell, count: announcementsList.length },
          { id: 'notes', label: 'الملاحظات', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl font-bold transition ${
                isActive
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Success notification */}
      {saveSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-teal-50 p-2.5 text-xs text-teal-800 border border-teal-200 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-3">
          {/* Feature Highlight Banner: One-Click Attendance & Instant Parent Notification */}
          <div className="rounded-3xl bg-linear-to-br from-teal-900 via-teal-800 to-slate-900 p-4 text-white shadow-md border border-teal-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-wide">تسجيل الحضور بضغطة واحدة</span>
                    <span className="text-[9px] bg-amber-400/20 text-amber-200 border border-amber-300/40 px-1.5 py-0.2 rounded-full font-bold">
                      إشعار فوري لولي الأمر
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-200 mt-0.5">
                    بنقرة واحدة يتم حفظ الحضور وإرسال إشعار فوري لولي الأمر إذا كان الطالب غائباً
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInstantMode(!instantMode)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  instantMode ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                title={instantMode ? 'تعطيل الحفظ الفوري' : 'تفعيل الحفظ الفوري'}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    instantMode ? 'translate-x-0' : '-translate-x-4'
                  }`}
                />
              </button>
            </div>

            {/* Quick Action Buttons inside Hero Card */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleRecordAllPresentOneClick}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2 px-3 text-xs shadow-sm transition active:scale-95"
              >
                <CheckCheck className="w-4 h-4" />
                <span>تسجيل الكل حاضر</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQRScannerModal(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2 px-3 text-xs shadow-sm transition active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>مسح QR بالكاميرا</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAbsenceLogModal(true)}
                className="flex items-center justify-center gap-1 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold py-2 px-2.5 text-xs border border-white/20 transition active:scale-95"
              >
                <BellRing className="w-3.5 h-3.5 text-rose-300" />
                <span>إشعارات ({members.filter((m) => (attendanceDraft[m.studentId] || 'present') === 'absent').length})</span>
              </button>
            </div>
          </div>

          {/* Date Selector & Manual Save Fallback */}
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-white p-3 border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
              />
            </div>
            <button
              onClick={handleSaveAttendance}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 text-xs font-bold transition active:scale-95 shrink-0"
              title="حفظ يدوي إضافي"
            >
              <Save className="w-3.5 h-3.5 text-teal-700" />
              <span>حفظ الكشف</span>
            </button>
          </div>

          {/* Real-time Absence Alert Banner */}
          {lastNotifiedStudent && (
            <div className="flex items-center justify-between rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900 shadow-2xs animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-600 text-white rounded-xl shadow-2xs shrink-0 animate-pulse">
                  <BellRing className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-slate-900">
                      تم تسجيل غياب ({lastNotifiedStudent.studentName})
                    </span>
                    <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                      إشعار فوري
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    تم إرسال إشعار فوري لحساب ولي الأمر ({lastNotifiedStudent.parentName}) بنجاح ({lastNotifiedStudent.timestamp})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const student = members.find((m) => m.studentName === lastNotifiedStudent.studentName);
                  const pInfo = student ? storage.getParentInfoForStudent(student.studentId) : null;
                  setWhatsAppModalData({
                    isOpen: true,
                    studentName: lastNotifiedStudent.studentName,
                    phone: pInfo?.phone || '01012345678',
                    contextType: 'attendance_absence',
                    extraData: { date: selectedDate, location: group.location },
                  });
                }}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition shadow-xs mr-2"
              >
                <Send className="w-3 h-3" />
                <span>واتساب أيضاً</span>
              </button>
            </div>
          )}

          {/* Quick Filters & Attendance Counters */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1 text-slate-600">
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span className="text-slate-500">الإجمالي: {members.length}</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                حاضر: {members.filter((m) => (attendanceDraft[m.studentId] || 'present') === 'present').length}
              </span>
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-0.5">
                <BellRing className="w-2.5 h-2.5" />
                غائب: {members.filter((m) => (attendanceDraft[m.studentId] || 'present') === 'absent').length}
              </span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                متأخر: {members.filter((m) => (attendanceDraft[m.studentId] || 'present') === 'late').length}
              </span>
            </div>

            <div className="flex gap-1 text-[11px]">
              <button
                onClick={() => setAttendanceFilter('all')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  attendanceFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setAttendanceFilter('present')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  attendanceFilter === 'present' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-emerald-50'
                }`}
              >
                حاضر
              </button>
              <button
                onClick={() => setAttendanceFilter('absent')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  attendanceFilter === 'absent' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-rose-50'
                }`}
              >
                غائب
              </button>
              <button
                onClick={() => setAttendanceFilter('late')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  attendanceFilter === 'late' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-amber-50'
                }`}
              >
                متأخر
              </button>
            </div>
          </div>

          {/* Search student */}
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث عن اسم الطالب في الكشف..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pr-8 pl-3 text-xs focus:border-teal-600 focus:outline-none"
            />
          </div>

          {/* Student attendance list */}
          <div className="space-y-2">
            {filteredMembers.map((member, idx) => {
              const currentStatus = attendanceDraft[member.studentId] || 'present';
              const existingRecord = storage
                .getAttendanceByGroupAndDate(groupId, selectedDate)
                .find((r) => r.studentId === member.studentId);
              const hasHistory = existingRecord?.history && existingRecord.history.length > 0;
              const parentInfo = storage.getParentInfoForStudent(member.studentId);
              const isAbsent = currentStatus === 'absent';
              const isLate = currentStatus === 'late';

              return (
                <div
                  key={member.studentId}
                  className={`rounded-2xl border p-3 shadow-2xs transition ${
                    isAbsent
                      ? 'border-rose-300 bg-rose-50/40'
                      : isLate
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">
                          {idx + 1}. {member.studentName}
                        </span>
                        {isAbsent && (
                          <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.2 rounded-full flex items-center gap-0.5 animate-pulse">
                            <BellRing className="w-2.5 h-2.5" />
                            <span>{parentInfo ? 'غائب (تم إشعار ولي الأمر)' : 'غائب (غير مربوط بولي أمر)'}</span>
                          </span>
                        )}
                        {hasHistory && (
                          <span
                            title="تم تعديل الحضور سابقاً"
                            className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded flex items-center gap-0.5"
                          >
                            <History className="w-2.5 h-2.5" />
                            <span>معدل</span>
                          </span>
                        )}
                      </div>

                      {/* Parent linking info pill */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span>{member.studentGrade}</span>
                        <span>•</span>
                        {parentInfo ? (
                          <span className="text-teal-700 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            ولي الأمر: <strong className="text-slate-800">{parentInfo.parentName}</strong>
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span>غير مربوط بولي أمر</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3 Single-Click Status Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetStatus(member.studentId, 'present', member.studentName)}
                        className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'
                        }`}
                        title="تسجيل حاضر بضغطة واحدة"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>حاضر</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(member.studentId, 'absent', member.studentName)}
                        className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                          currentStatus === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-rose-50'
                        }`}
                        title="تسجيل غياب بضغطة واحدة وإرسال إشعار فوري لولي الأمر"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>غائب</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(member.studentId, 'late', member.studentName)}
                        className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold transition active:scale-95 ${
                          currentStatus === 'late'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-amber-50'
                        }`}
                        title="تسجيل متأخر بضغطة واحدة"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>متأخر</span>
                      </button>

                      {(currentStatus === 'absent' || currentStatus === 'late') && (
                        <button
                          type="button"
                          onClick={() => {
                            const studentUser = storage.getUserById(member.studentId);
                            const phone = parentInfo?.phone || studentUser?.phone || '01012345678';
                            setWhatsAppModalData({
                              isOpen: true,
                              studentName: member.studentName,
                              phone,
                              contextType: currentStatus === 'absent' ? 'attendance_absence' : 'attendance_late',
                              extraData: { date: selectedDate, location: group.location },
                            });
                          }}
                          className="p-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                          title="إرسال إشعار عبر واتساب لولي الأمر"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE REPORTS (Requirement #5) */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900">تقرير نسب الحضور والغياب</h3>
              <p className="text-[11px] text-slate-400">إحصائيات دقيقة لكل طالب في المجموعة</p>
            </div>
            <button
              onClick={() => handleExportCSV('attendance')}
              className="flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 border border-teal-200 hover:bg-teal-100 transition"
              title="تصدير كشف الحضور إلى ملف CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          </div>

          <div className="space-y-2">
            {attendanceSummaries.map((summary, idx) => (
              <div
                key={summary.studentId}
                className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900">
                    {idx + 1}. {summary.studentName}
                  </div>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      summary.attendanceRate >= 80
                        ? 'bg-emerald-50 text-emerald-800'
                        : summary.attendanceRate >= 60
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-rose-50 text-rose-800'
                    }`}
                  >
                    {summary.attendanceRate}% حضور
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[11px] pt-1 border-t border-slate-100">
                  <div className="bg-slate-50 p-1.5 rounded-lg">
                    <span className="block text-slate-400 text-[10px]">الحصص</span>
                    <strong className="text-slate-800">{summary.totalSessions}</strong>
                  </div>
                  <div className="bg-emerald-50 p-1.5 rounded-lg">
                    <span className="block text-emerald-700 text-[10px]">حضور</span>
                    <strong className="text-emerald-800">{summary.presentCount}</strong>
                  </div>
                  <div className="bg-rose-50 p-1.5 rounded-lg">
                    <span className="block text-rose-700 text-[10px]">غياب</span>
                    <strong className="text-rose-800">{summary.absentCount}</strong>
                  </div>
                  <div className="bg-amber-50 p-1.5 rounded-lg">
                    <span className="block text-amber-700 text-[10px]">تأخير</span>
                    <strong className="text-amber-800">{summary.lateCount}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ASSESSMENTS & BATCH GRADES (Requirement #7) */}
      {activeTab === 'assessments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">الاختبارات والكويزات</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExportCSV('grades')}
                className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                title="تصدير كشف الدرجات"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => setShowAssessmentModal(true)}
                className="flex items-center gap-1 rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>اختبار جديد</span>
              </button>
            </div>
          </div>

          {assessmentsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <Award className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold">لم تقم بإضافة اختبارات لهذه المجموعة بعد</p>
              <button
                onClick={() => setShowAssessmentModal(true)}
                className="mt-3 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white"
              >
                إنشاء اختبار الآن
              </button>
            </div>
          ) : (
            <>
              {/* Assessment Selector Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {assessmentsList.map((asm) => (
                  <button
                    key={asm.assessmentId}
                    onClick={() => {
                      setSelectedAssessmentId(asm.assessmentId);
                      const existing = storage.getGradesByAssessment(asm.assessmentId);
                      const draft: Record<string, number> = {};
                      existing.forEach((g) => (draft[g.studentId] = g.score));
                      setBatchGrades(draft);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                      selectedAssessmentId === asm.assessmentId
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {asm.title} (من {asm.maxScore})
                  </button>
                ))}
              </div>

              {/* Assessment Group Statistics (For teacher only - no public ranking) */}
              {selectedAssessment && currentAssessmentStats && (
                <div className="rounded-2xl bg-teal-50 border border-teal-200 p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-900">{selectedAssessment.title}</span>
                    <span className="text-teal-700">{selectedAssessment.date}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-white p-1.5 rounded-lg border border-teal-100">
                      <span className="text-slate-400 text-[10px] block">تم الرصد</span>
                      <strong>{currentAssessmentStats.count} طلاب</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-teal-100">
                      <span className="text-slate-400 text-[10px] block">متوسط المجموعة</span>
                      <strong className="text-teal-800">{currentAssessmentStats.average}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-teal-100">
                      <span className="text-slate-400 text-[10px] block">أعلى درجة</span>
                      <strong className="text-emerald-700">{currentAssessmentStats.highest}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-teal-100">
                      <span className="text-slate-400 text-[10px] block">أقل درجة</span>
                      <strong className="text-rose-700">{currentAssessmentStats.lowest}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Batch Grade Entry Table */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    رصد درجات الطلاب السريع (من {selectedAssessment?.maxScore || 20})
                  </span>
                  <button
                    onClick={handleSaveBatchGrades}
                    className="flex items-center gap-1 rounded-xl bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ الدرجات</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {members.map((m, idx) => {
                    const currentScore = batchGrades[m.studentId] !== undefined ? batchGrades[m.studentId] : '';
                    return (
                      <div
                        key={m.studentId}
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100"
                      >
                        <span className="font-bold text-slate-900 truncate flex-1">
                          {idx + 1}. {m.studentName}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={selectedAssessment?.maxScore || 20}
                            placeholder="الدرجة"
                            value={currentScore}
                            onChange={(e) => {
                              if (e.target.value === '') {
                                setBatchGrades((prev) => {
                                  const next = { ...prev };
                                  delete next[m.studentId];
                                  return next;
                                });
                              } else {
                                const val = Number(e.target.value);
                                setBatchGrades((prev) => ({
                                  ...prev,
                                  [m.studentId]: val,
                                }));
                              }
                            }}
                            className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-bold text-slate-800 text-xs focus:border-teal-600 focus:outline-none"
                          />
                          <span className="text-slate-400 text-xs">/ {selectedAssessment?.maxScore || 20}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: HOMEWORK */}
      {activeTab === 'homework' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">واجبات وتكليفات المجموعة</span>
            <button
              onClick={() => setShowHomeworkModal(true)}
              className="flex items-center gap-1 rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>واجب جديد</span>
            </button>
          </div>

          {homeworkList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <BookOpen className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold">لا توجد واجبات مضافة لهذه المجموعة</p>
            </div>
          ) : (
            homeworkList.map((hw) => (
              <div
                key={hw.homeworkId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-xs font-bold text-slate-900">{hw.title}</h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 mr-2 ${
                      hw.status === 'closed'
                        ? 'text-slate-600 bg-slate-100 border-slate-200'
                        : hw.status === 'new'
                        ? 'text-blue-700 bg-blue-50 border-blue-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}
                  >
                    {hw.status === 'closed' ? 'انتهى موعده' : hw.status === 'new' ? 'جديد' : 'جاري'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {hw.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span>تاريخ التكليف: {hw.assignedDate}</span>
                    <span>•</span>
                    <span className="text-rose-700 font-semibold">موعد التسليم: {hw.dueDate}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => storage.toggleHomeworkStatus(hw.homeworkId)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                      hw.status === 'closed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {hw.status === 'closed' ? 'إعادة فتح الواجب' : 'إغلاق الواجب'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: STUDENTS & JOIN REQUESTS (Requirements #3 & #12) */}
      {activeTab === 'students' && (
        <div className="space-y-3">
          {/* Export to CSV Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">قائمة الطلاب ورموز الربط</span>
            <button
              onClick={() => handleExportCSV('students')}
              className="flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 border border-teal-200 hover:bg-teal-100 transition"
              title="تصدير قائمة الطلاب إلى CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير كشف الطلاب CSV</span>
            </button>
          </div>

          {/* Pending Requests Box if any */}
          {pendingRequests.length > 0 && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-3.5 space-y-2">
              <h4 className="font-bold text-xs text-purple-900">
                طلبات انضمام جديدة بانتظار الموافقة ({pendingRequests.length}):
              </h4>
              <div className="space-y-1.5">
                {pendingRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-purple-100 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{req.studentName}</div>
                      <div className="text-[10px] text-slate-400">{req.studentGrade}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAcceptRequest(req.requestId)}
                        className="rounded-lg bg-teal-700 px-3 py-1 text-white font-bold text-[11px] hover:bg-teal-800"
                      >
                        قبول
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.requestId)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600 font-bold text-[11px] hover:bg-slate-100"
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {members.map((m, i) => {
              const prof = studentProfiles.find((s) => s.studentId === m.studentId);
              const code = prof?.linkingCode || `YD-LK-${1000 + i}`;
              return (
                <div
                  key={m.studentId}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {i + 1}. {m.studentName}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {m.studentGrade} · انضم {m.joinedAt}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mr-2">
                    <button
                      type="button"
                      onClick={() => setReportModalData({ isOpen: true, studentId: m.studentId, studentName: m.studentName })}
                      className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 transition"
                      title="معاينة وطباعة بطاقة المتابعة الشهرية"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const studentUser = storage.getUserById(m.studentId);
                        const parentLinks = storage.getParentStudents().filter((ps) => ps.studentId === m.studentId);
                        const parentUser = parentLinks[0] ? storage.getUserById(parentLinks[0].parentId) : null;
                        const phone = parentUser?.phone || studentUser?.phone || '01012345678';
                        setWhatsAppModalData({
                          isOpen: true,
                          studentName: m.studentName,
                          phone,
                          contextType: 'praise',
                          extraData: { groupName: group.name },
                        });
                      }}
                      className="p-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                      title="مراسلة ولي الأمر عبر واتساب"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-left">
                      <span className="text-[9px] text-slate-400 block text-right">كود ولي الأمر</span>
                      <span className="font-mono text-[11px] font-black text-teal-800 dir-ltr bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-200">
                        {code}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">إعلانات وتنبيهات المجموعة</span>
            <button
              onClick={() => setShowAnnModal(true)}
              className="flex items-center gap-1 rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إعلان جديد</span>
            </button>
          </div>

          {announcementsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <Bell className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold">لا توجد إعلانات منشورة حتى الآن</p>
            </div>
          ) : (
            announcementsList.map((ann) => (
              <div
                key={ann.announcementId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-xs text-slate-900">{ann.title}</h3>
                  <span className="text-[10px] text-slate-400 shrink-0 mr-2">
                    {ann.createdAt.split('T')[0]}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {ann.body}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 7: NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">الملاحظات التربوية والسلوكية</span>
            <button
              onClick={() => setShowNoteModal(true)}
              className="flex items-center gap-1 rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ملاحظة جديدة</span>
            </button>
          </div>

          {notesList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold">لا توجد ملاحظات مسجلة بعد</p>
            </div>
          ) : (
            notesList.map((note) => (
              <div
                key={note.noteId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-xs text-slate-900">{note.studentName}</div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      note.visibility === 'parent_visible'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-purple-50 text-purple-800 border border-purple-200'
                    }`}
                  >
                    {note.visibility === 'parent_visible' ? 'مرئي لولي الأمر' : 'خاص بالمدرس فقط'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{note.text}</p>
                <div className="text-[10px] text-slate-400">{note.createdAt.split('T')[0]}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: LIVE CLASSROOM & WHITEBOARD */}
      {activeTab === 'live' && (
        <TeacherLiveTab group={group} />
      )}

      {/* TAB: PAYMENTS */}
      {activeTab === 'payments' && (
        <TeacherPaymentsTab
          groupId={group.groupId}
          groupName={group.name}
          members={members}
        />
      )}

      {/* TAB: MATERIALS */}
      {activeTab === 'materials' && (
        <TeacherMaterialsTab
          groupId={group.groupId}
          groupName={group.name}
          teacherId={currentUser?.id || 'user_teacher_1'}
        />
      )}

      {/* TAB: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <TeacherLeaderboardTab
          groupId={group.groupId}
          groupName={group.name}
          teacherId={currentUser?.id || 'user_teacher_1'}
          members={members}
        />
      )}

      {/* TAB: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <TeacherCertificatesTab
          groupId={group.groupId}
          groupName={group.name}
          teacherName={currentUser?.name || group.teacherName}
          subject={group.subject}
          members={members}
        />
      )}

      {/* MODAL: New Assessment (V2) */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-800">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              إنشاء اختبار / كويز جديد
            </h3>
            <form onSubmit={handleCreateAssessment} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الاختبار *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كويز الجبر رقم ٢، اختبار منتصف الفصل..."
                  value={asmTitle}
                  onChange={(e) => setAsmTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الدرجة النهائية *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={asmMaxScore}
                    onChange={(e) => setAsmMaxScore(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={asmDate}
                    onChange={(e) => setAsmDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
                >
                  إنشاء الاختبار والبدء بالرصد
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssessmentModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New Homework */}
      {showHomeworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-800">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              واجب جديد للمجموعة
            </h3>
            <form onSubmit={handleCreateHomework} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الواجب *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حل تمارين كتاب المعاصر ص ٤٥"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل ومسائل الواجب</label>
                <textarea
                  rows={3}
                  placeholder="اكتب أرقام المسائل أو التعليمات المطلوبة من الطالب..."
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التسليم *</label>
                <input
                  type="date"
                  required
                  value={hwDueDate}
                  onChange={(e) => setHwDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
                >
                  حفظ ونشر الواجب للطلاب
                </button>
                <button
                  type="button"
                  onClick={() => setShowHomeworkModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New Announcement */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-800">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              إعلان جديد لمجموعة {group.name}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              storage.addAnnouncement({
                groupId: group.groupId,
                groupName: group.name,
                teacherName: currentUser?.name || 'أستاذ المادة',
                title: annTitle,
                body: annBody,
              });
              setShowAnnModal(false);
              setAnnTitle('');
              setAnnBody('');
            }} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الإعلان *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تعديل موعد الحصة أو تنبيه هام"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نص الإعلان *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="اكتب التنبيه هنا..."
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
                >
                  نشر الإعلان الآن
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New Note */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-800">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              إضافة ملاحظة تربوية لطالب
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const target = members.find((m) => m.studentId === noteStudentId);
              if (!target) return;
              storage.addNote({
                teacherId: currentUser?.id || 'user_teacher_1',
                studentId: target.studentId,
                studentName: target.studentName,
                text: noteText,
                visibility: noteVisibility,
              });
              setShowNoteModal(false);
              setNoteText('');
            }} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر الطالب</label>
                <select
                  value={noteStudentId}
                  onChange={(e) => setNoteStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none bg-white"
                >
                  {members.map((m) => (
                    <option key={m.studentId} value={m.studentId}>
                      {m.studentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الظهور</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNoteVisibility('parent_visible')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      noteVisibility === 'parent_visible'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    مرئية لولي الأمر
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteVisibility('teacher_only')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      noteVisibility === 'teacher_only'
                        ? 'bg-purple-50 border-purple-600 text-purple-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    خاصة بالمدرس فقط
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نص الملاحظة *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="اكتب الملاحظة السلوكية أو الأكاديمية..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
                >
                  حفظ الملاحظة
                </button>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared WhatsApp Modal */}
      <WhatsAppQuickModal
        isOpen={whatsAppModalData.isOpen}
        onClose={() => setWhatsAppModalData((prev) => ({ ...prev, isOpen: false }))}
        defaultPhone={whatsAppModalData.phone}
        studentName={whatsAppModalData.studentName}
        groupName={group.name}
        contextType={whatsAppModalData.contextType}
        extraData={whatsAppModalData.extraData}
      />

      {/* Absence Notifications Log Modal */}
      {showAbsenceLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">سجل إشعارات الغياب الفورية</h3>
                  <p className="text-[11px] text-slate-400">حصة {selectedDate} · {group.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAbsenceLogModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {members.filter((m) => (attendanceDraft[m.studentId] || 'present') === 'absent').length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCheck className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="text-xs font-bold text-slate-700">لا يوجد طلاب غائبين في هذه الحصة!</p>
                  <p className="text-[11px] text-slate-400 mt-1">جميع الطلاب حاضرون مسجلون ✓</p>
                </div>
              ) : (
                members
                  .filter((m) => (attendanceDraft[m.studentId] || 'present') === 'absent')
                  .map((m) => {
                    const parentInfo = storage.getParentInfoForStudent(m.studentId);
                    return (
                      <div
                        key={m.studentId}
                        className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{m.studentName}</span>
                          <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                            غائب
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-1 bg-white/90 p-2.5 rounded-xl border border-rose-100">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">ولي الأمر:</span>
                            <span className="font-bold text-slate-800">
                              {parentInfo ? parentInfo.parentName : 'غير مربوط بولي أمر'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">قناة الإشعار:</span>
                            {parentInfo ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                تم إرسال إشعار لولي الأمر
                              </span>
                            ) : (
                              <span className="text-amber-700 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                غير مربوط بولي أمر
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAbsenceLogModal(false);
                            setWhatsAppModalData({
                              isOpen: true,
                              studentName: m.studentName,
                              phone: parentInfo?.phone || '01012345678',
                              contextType: 'attendance_absence',
                              extraData: { date: selectedDate, location: group.location },
                            });
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال واتساب لولي الأمر أيضاً</span>
                        </button>
                      </div>
                    );
                  })
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAbsenceLogModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Shared Student Print Report Modal */}
      <StudentPrintReportModal
        isOpen={reportModalData.isOpen}
        onClose={() => setReportModalData((prev) => ({ ...prev, isOpen: false }))}
        studentId={reportModalData.studentId}
        studentName={reportModalData.studentName}
        groupId={groupId}
      />

      {/* Attendance Camera QR Scanner Modal */}
      <AttendanceQRScannerModal
        isOpen={showQRScannerModal}
        onClose={() => setShowQRScannerModal(false)}
        groupId={groupId}
        date={selectedDate}
        onScanSuccess={(studentId) => {
          setAttendanceDraft((prev) => ({
            ...prev,
            [studentId]: 'present',
          }));
          setSaveSuccessMsg('تم تسجيل حضور الطالب بالكاميرا بنجاح');
          setTimeout(() => setSaveSuccessMsg(null), 3000);
        }}
      />
    </div>
  );
};
