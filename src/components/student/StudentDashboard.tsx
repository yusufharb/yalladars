import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import {
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  Plus,
  Copy,
  Check,
  ChevronLeft,
  Bell,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
  Sparkles,
  CheckSquare,
  HelpCircle,
  Trophy,
  DollarSign,
  Printer,
  Play,
  FileText,
  QrCode,
  Video
} from 'lucide-react';
import { PracticeQuizModal } from './PracticeQuizModal';
import { CertificateModal } from '../common/CertificateModal';
import { StudentIDCardModal } from './StudentIDCardModal';
import { LiveClassroomModal } from '../common/LiveClassroomModal';
import { StudentBadge, StudentCertificate, PracticeQuiz, LiveSession } from '../../types';

interface StudentDashboardProps {
  onNavigateTab: (tab: 'classes' | 'homework' | 'grades' | 'gemini-chat') => void;
  onOpenJoinModal: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigateTab,
  onOpenJoinModal,
}) => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const studentId = currentUser?.id || 'user_student_1';

  const [copiedCode, setCopiedCode] = useState(false);
  const [regeneratedMsg, setRegeneratedMsg] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  // Modals state
  const [activeQuiz, setActiveQuiz] = useState<PracticeQuiz | null>(null);
  const [viewingCert, setViewingCert] = useState<StudentCertificate | null>(null);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [viewingLiveSession, setViewingLiveSession] = useState<LiveSession | null>(null);
  const activeLiveSessions = storage.getActiveLiveSessionsForStudent(studentId);

  // Student data
  const studentProfile = storage.getStudentProfile(studentId);
  const linkingCode = studentProfile?.linkingCode || '';

  const groups = storage.getGroupsForStudent(studentId);
  const homeworkList = storage.getHomeworkForStudent(studentId);
  const gradesList = storage.getGradesForStudent(studentId);
  const attendanceList = storage.getAttendanceForStudent(studentId);
  const announcementsList = storage.getAnnouncementsForStudent(studentId);
  const educationalProfile = storage.getStudentEducationalProfile(studentId);

  // Enhanced features data
  const badges: StudentBadge[] = storage.getBadgesByStudent(studentId);
  const certificates: StudentCertificate[] = storage.getCertificatesByStudent(studentId);
  const payments = storage.getTuitionPaymentsByStudent(studentId);
  const studentGroupIds = groups.map((g) => g.groupId);
  const availableQuizzes = storage.getQuizzes().filter((q) => studentGroupIds.includes(q.groupId));
  const currentMonthPayment = payments[0] || null;

  // Computed next items
  const nextGroup = groups[0];
  const nextHomework = homeworkList.find((h) => h.status !== 'closed') || homeworkList[0];
  const latestGrade = gradesList[0];
  const latestAttendance = attendanceList[0];

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(linkingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRegenerateCode = () => {
    storage.regenerateStudentLinkingCode(studentId);
    setConfirmRegenerate(false);
    setRegeneratedMsg(true);
    setTimeout(() => setRegeneratedMsg(false), 3000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Welcome Header */}
      <div className="rounded-3xl bg-linear-to-l from-teal-800 to-teal-900 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-teal-200">أهلاً يا بطل 👋</span>
            <h1 className="text-lg font-black">{currentUser?.name || 'محمد أحمد'}</h1>
            <p className="mt-1 text-xs text-teal-100/90">
              {studentProfile?.grade || 'الصف الأول الثانوي'} · {groups.length} مجموعات دراسية
            </p>
          </div>
          <button
            onClick={onOpenJoinModal}
            className="flex items-center gap-1 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3.5 py-2 text-xs font-bold text-white transition active:scale-95 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>انضم لمجموعة</span>
          </button>
        </div>
      </div>

      {/* Active Live Session Alert Banner for Student */}
      {activeLiveSessions.length > 0 && (
        <div className="rounded-3xl bg-linear-to-r from-rose-900 via-rose-800 to-slate-900 p-4 text-white shadow-xl border-2 border-rose-500/80 animate-pulse-glow space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <span className="text-xs font-black tracking-wider text-rose-200">
                🔴 الحصة أونلاين جارية الآن على الهواء!
              </span>
            </div>
            <span className="text-[10px] bg-rose-500/30 text-rose-200 border border-rose-400/40 px-2 py-0.5 rounded-full font-bold">
              بث مباشر الآن
            </span>
          </div>

          <div>
            <h3 className="text-sm font-black text-white">{activeLiveSessions[0].title}</h3>
            <p className="text-xs text-rose-200 mt-0.5">
              المجموعة: <strong>{activeLiveSessions[0].groupName}</strong> · المدرس: {activeLiveSessions[0].teacherName}
            </p>
          </div>

          <button
            onClick={() => setViewingLiveSession(activeLiveSessions[0])}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-rose-900 hover:bg-rose-50 px-4 py-2.5 text-xs font-black transition active:scale-95 shadow-md"
          >
            <Video className="w-4 h-4 text-rose-600" />
            <span>دخول الحصة الأونلاين ومتابعة السبورة الذكية 🚀</span>
          </button>
        </div>
      )}

      {/* Student Digital ID Card Quick Card */}
      <div className="rounded-2xl bg-linear-to-r from-teal-900 to-slate-900 p-3.5 text-white shadow-md flex items-center justify-between border border-teal-700/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold border border-teal-400/30 shrink-0">
            <QrCode className="w-5 h-5 text-teal-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-xs text-white truncate">
              <span>كارنيه الطالب الذكي (Digital ID)</span>
              <span className="text-[9px] bg-teal-500/30 text-teal-200 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                {linkingCode}
              </span>
            </div>
            <p className="text-[10px] text-teal-200/80 mt-0.5 truncate">
              امسح الكود لتسجيل حضورك في السنتر فوراً
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsIdCardOpen(true)}
          className="flex items-center gap-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-3 py-1.5 text-xs transition active:scale-95 shadow-sm shrink-0 mr-2"
        >
          <span>عرض الكارنيه</span>
        </button>
      </div>

      {/* Live Next Session Countdown Widget */}
      {nextGroup && (
        <div className="rounded-2xl bg-linear-to-r from-teal-900 via-teal-800 to-indigo-900 p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-200 text-xs font-bold">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>العد التنازلي للحصة القادمة:</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
              {nextGroup.startTime}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-white">{nextGroup.subject}</div>
              <div className="text-[11px] text-teal-200 mt-0.5">
                {nextGroup.days.join(' و ')} · {nextGroup.location}
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-center">
              <div className="bg-black/30 rounded-xl px-2 py-1">
                <span className="block text-base font-black text-amber-300">١٨</span>
                <span className="text-[8px] text-slate-300">ساعة</span>
              </div>
              <span className="font-black text-amber-400">:</span>
              <div className="bg-black/30 rounded-xl px-2 py-1">
                <span className="block text-base font-black text-amber-300">٤٥</span>
                <span className="text-[8px] text-slate-300">دقيقة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Study Buddy Card */}
      <div className="rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-3.5 text-white shadow-md flex items-center justify-between border border-indigo-700/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-amber-400 to-indigo-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 fill-slate-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs text-white">رفيق المذاكرة الذكي (Gemini)</span>
              <span className="text-[9px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                AI مجاني
              </span>
            </div>
            <p className="text-[11px] text-indigo-200 mt-0.5 truncate">
              مسألة صعبة أو قانون محتاج شرح؟ اسألني فوراً خطوة بخطوة 🧠
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('gemini-chat')}
          className="rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 px-3 py-1.5 text-xs font-black transition active:scale-95 shrink-0 shadow-sm"
        >
          ابدأ المحادثة
        </button>
      </div>

      {/* Monthly Tuition Fee Card */}
      {currentMonthPayment ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900">مصروفات اشتراك {currentMonthPayment.month}:</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {currentMonthPayment.status === 'paid' ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 inline" />
                    تم السداد بنجاح ({currentMonthPayment.paidAmount || currentMonthPayment.amount} ج.م) · {currentMonthPayment.notes || 'الحساب منتظم'}
                  </span>
                ) : currentMonthPayment.status === 'partial' ? (
                  <span className="text-blue-700 font-bold flex items-center gap-1">
                    سداد جزئي ({currentMonthPayment.paidAmount || 0} من {currentMonthPayment.amount} ج.م) · متبقي {Math.max(0, currentMonthPayment.amount - (currentMonthPayment.paidAmount || 0))} ج.م
                  </span>
                ) : currentMonthPayment.status === 'exempt' ? (
                  <span className="text-purple-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 inline" />
                    معفى من المصروفات {currentMonthPayment.notes ? `· ${currentMonthPayment.notes}` : ''}
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold">مستحق السداد ({currentMonthPayment.amount} ج.م)</span>
                )}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg font-mono">
            {currentMonthPayment.groupName || 'إيصال معتمد'}
          </span>
        </div>
      ) : null}

      {/* Earned Badges & Achievements Bar */}
      {badges.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-600" />
              أوسمتي وإنجازاتي التكريمية ({badges.length}):
            </span>
            <span className="text-[10px] text-amber-800 font-bold">لوحة الشرف</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <div
                key={b.badgeId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200 shadow-2xs text-xs"
              >
                <span className="text-base">{b.icon}</span>
                <div className="min-w-0">
                  <span className="font-bold text-amber-950 block leading-tight">{b.title}</span>
                  <span className="text-[9px] text-slate-500 block truncate max-w-[140px]">
                    {b.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Practice Quiz Launcher */}
      {availableQuizzes.length > 0 && (
        <div className="rounded-2xl bg-linear-to-r from-indigo-900 to-purple-900 p-4 text-white shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>تحدي وتدريب سريع (ذاتي التصحيح)</span>
            </div>
            <h4 className="font-black text-sm text-white mt-1">
              {availableQuizzes[0].title}
            </h4>
            <p className="text-[11px] text-indigo-200 mt-0.5">
              ٥ أسئلة تفاعلية لاختبار فهمك مع شرح فوري لكل مسألة
            </p>
          </div>
          <button
            onClick={() => setActiveQuiz(availableQuizzes[0])}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs shadow-md hover:bg-indigo-50 transition active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-indigo-950" />
            <span>ابدأ الكويز</span>
          </button>
        </div>
      )}

      {/* Certificates of Appreciation Cards */}
      {certificates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              شهادات التقدير الممنوحة لي ({certificates.length}):
            </h3>
          </div>
          <div className="space-y-2">
            {certificates.map((cert) => (
              <div
                key={cert.certificateId}
                className="rounded-2xl border border-amber-200 bg-amber-50/30 p-3 shadow-2xs flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{cert.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      من: {cert.teacherName} · {cert.issueDate}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewingCert(cert)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-[11px] hover:bg-amber-50 transition shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>عرض وطباعة</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "ماذا عندي اليوم؟ ماذا علي أن أفعل؟" Action Card */}
      <div className="rounded-2xl border border-teal-200/90 bg-teal-50/80 p-4 shadow-2xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-xs text-teal-950">
          <CheckSquare className="w-4 h-4 text-teal-700" />
          <span>ماذا عندي اليوم؟ وماذا عليّ أن أفعل؟</span>
        </div>

        <div className="space-y-1.5 text-xs text-slate-700">
          {nextGroup ? (
            <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-teal-100">
              <Clock className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                لديك حصة <strong>{nextGroup.subject}</strong> ({nextGroup.days.join(' · ')}) الساعة{' '}
                <strong>{nextGroup.startTime}</strong> في {nextGroup.location}.
              </span>
            </div>
          ) : (
            <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100 text-slate-500">
              لا توجد حصص مسجلة اليوم.
            </div>
          )}

          {nextHomework ? (
            <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-teal-100">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                عليك حل: <strong>{nextHomework.title}</strong> — موعد التسليم: {nextHomework.dueDate}.
              </span>
            </div>
          ) : (
            <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100 text-emerald-800">
              أحسنت! لا توجد واجبات متأخرة عليك حالياً.
            </div>
          )}
        </div>
      </div>

      {/* Parent Linking Code Banner */}
      <div className="rounded-2xl border border-teal-200/80 bg-white p-3.5 shadow-2xs flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold text-teal-900">
            كود ربط ولي الأمر الخاص بك:
          </span>
          <span className="font-mono text-base font-black text-teal-800 dir-ltr text-right block mt-0.5">
            {linkingCode}
          </span>
          {regeneratedMsg ? (
            <span className="text-[10px] text-emerald-600 font-bold">تم توليد كود جديد بنجاح ✓</span>
          ) : (
            <p className="text-[10px] text-slate-400 mt-0.5">
              أعطِ هذا الكود العشوائي الآمن لوالدك لمتابعة درجاتك
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mr-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 rounded-xl bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-900 border border-teal-200 hover:bg-teal-100 transition"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'تم' : 'نسخ'}</span>
          </button>
          {!confirmRegenerate ? (
            <button
              onClick={() => setConfirmRegenerate(true)}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
              title="توليد كود ربط جديد"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl text-[10px]">
              <button
                onClick={handleRegenerateCode}
                className="bg-amber-600 text-white font-bold px-2 py-0.5 rounded-lg"
              >
                تأكيد التجديد
              </button>
              <button
                onClick={() => setConfirmRegenerate(false)}
                className="text-slate-600 font-bold px-1.5 py-0.5"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Core Quick Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Next Session */}
        <div
          onClick={() => onNavigateTab('classes')}
          className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-teal-300 transition cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 mb-1">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            الحصة القادمة
          </div>
          {nextGroup ? (
            <>
              <div className="font-bold text-xs text-slate-900 truncate mt-1">
                {nextGroup.subject}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {nextGroup.days[0]} · {nextGroup.startTime}
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 mt-2">لا توجد حصص مسجلة</div>
          )}
        </div>

        {/* Card 2: Next Homework */}
        <div
          onClick={() => onNavigateTab('homework')}
          className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-teal-300 transition cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            الواجب القادم
          </div>
          {nextHomework ? (
            <>
              <div className="font-bold text-xs text-slate-900 truncate mt-1">
                {nextHomework.title}
              </div>
              <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
                تسليم: {nextHomework.dueDate}
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 mt-2">لا توجد واجبات</div>
          )}
        </div>

        {/* Card 3: Latest Grade */}
        <div
          onClick={() => onNavigateTab('grades')}
          className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-teal-300 transition cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            آخر درجة
          </div>
          {latestGrade ? (
            <>
              <div className="font-black text-sm text-teal-800 dir-ltr text-right mt-1">
                {latestGrade.score} / {latestGrade.maxScore}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {latestGrade.title}
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 mt-2">لا توجد درجات</div>
          )}
        </div>

        {/* Card 4: Latest Attendance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            نسبة الحضور
          </div>
          <div className="text-base font-black text-emerald-800 mt-1">
            {educationalProfile.attendanceSummary.attendanceRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {educationalProfile.attendanceSummary.presentCount} من{' '}
            {educationalProfile.attendanceSummary.totalSessions} حصص
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-teal-700" />
            إعلانات المدرسين
          </h2>
          <span className="text-[11px] text-slate-400">{announcementsList.length}</span>
        </div>

        {announcementsList.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            لا توجد إعلانات جديدة
          </div>
        ) : (
          announcementsList.slice(0, 3).map((ann) => (
            <div
              key={ann.announcementId}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{ann.title}</span>
                <span className="text-[10px] text-slate-400">{ann.createdAt.split('T')[0]}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{ann.body}</p>
              <div className="text-[10px] text-teal-700 font-semibold pt-1">
                من: {ann.teacherName} ({ann.groupName})
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <PracticeQuizModal
        isOpen={!!activeQuiz}
        onClose={() => setActiveQuiz(null)}
        quiz={activeQuiz}
        studentId={studentId}
        studentName={currentUser?.name || 'محمد أحمد'}
      />

      <CertificateModal
        isOpen={!!viewingCert}
        onClose={() => setViewingCert(null)}
        certificate={viewingCert}
      />

      <StudentIDCardModal
        isOpen={isIdCardOpen}
        onClose={() => setIsIdCardOpen(false)}
        studentId={studentId}
      />

      {viewingLiveSession && (
        <LiveClassroomModal
          isOpen={!!viewingLiveSession}
          onClose={() => setViewingLiveSession(null)}
          session={viewingLiveSession}
        />
      )}
    </div>
  );
};

