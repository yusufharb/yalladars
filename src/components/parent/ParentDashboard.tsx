import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import { ParentStudent, StudentBadge, StudentCertificate } from '../../types';
import {
  Users,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  BookOpen,
  Bell,
  FileText,
  AlertCircle,
  Calendar,
  ChevronLeft,
  Sparkles,
  BarChart2,
  Trash2,
  Printer,
  DollarSign,
  Send,
  Trophy
} from 'lucide-react';
import { StudentPrintReportModal } from '../common/StudentPrintReportModal';
import { CertificateModal } from '../common/CertificateModal';
import { WhatsAppQuickModal } from '../common/WhatsAppQuickModal';

interface ParentDashboardProps {
  onOpenLinkModal: () => void;
  onNavigateTab: (tab: 'children' | 'alerts' | 'gemini-chat') => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  onOpenLinkModal,
  onNavigateTab,
}) => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const parentId = currentUser?.id || 'user_parent_1';

  const linkedChildren = storage.getStudentsForParent(parentId);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    linkedChildren[0]?.studentId || ''
  );

  // Modals state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<StudentCertificate | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  React.useEffect(() => {
    if (linkedChildren.length > 0 && !linkedChildren.some((c) => c.studentId === selectedStudentId)) {
      setSelectedStudentId(linkedChildren[0].studentId);
    }
  }, [linkedChildren, selectedStudentId]);

  const selectedChild = linkedChildren.find((c) => c.studentId === selectedStudentId);

  // Data for selected child
  const childGroups = selectedStudentId ? storage.getGroupsForStudent(selectedStudentId) : [];
  const childAttendance = selectedStudentId ? storage.getAttendanceForStudent(selectedStudentId) : [];
  const childHomework = selectedStudentId ? storage.getHomeworkForStudent(selectedStudentId) : [];
  const childGrades = selectedStudentId ? storage.getGradesForStudent(selectedStudentId) : [];
  const childNotes = selectedStudentId ? storage.getNotesForParent(selectedStudentId) : [];
  const weeklySummary = selectedStudentId ? storage.getParentWeeklySummary(selectedStudentId) : null;
  const attendanceSummary = selectedStudentId ? storage.getStudentAttendanceSummary(selectedStudentId) : null;

  // New features data
  const childBadges: StudentBadge[] = selectedStudentId ? storage.getBadgesByStudent(selectedStudentId) : [];
  const childCerts: StudentCertificate[] = selectedStudentId ? storage.getCertificatesByStudent(selectedStudentId) : [];
  const childPayments = selectedStudentId ? storage.getTuitionPaymentsByStudent(selectedStudentId) : [];
  const septPayment = childPayments.find((p) => p.month === 'سبتمبر 2026') || childPayments[0];

  const nextSession = childGroups[0];
  const activeHomework = childHomework.filter((h) => h.status !== 'closed');
  const nextHw = activeHomework[0] || childHomework[0];
  const latestGrade = childGrades[0];
  const latestAttendance = childAttendance[0];

  const handleUnlink = (childName: string, studentId: string) => {
    if (window.confirm(`هل أنت متأكد من إلغاء ربط حساب الابن (${childName})؟`)) {
      storage.unlinkChild(parentId, studentId);
      if (linkedChildren.length > 1) {
        const remaining = linkedChildren.filter((c) => c.studentId !== studentId);
        setSelectedStudentId(remaining[0].studentId);
      }
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Welcome & Children Header */}
      <div className="rounded-3xl bg-linear-to-l from-teal-800 to-teal-900 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-teal-200">مرحباً بك يا ولي الأمر 👋</span>
            <h1 className="text-lg font-black">{currentUser?.name || 'أحمد حسن'}</h1>
            <p className="mt-1 text-xs text-teal-100/90">
              متابعة دراسة {linkedChildren.length} من الأبناء
            </p>
          </div>
          <button
            onClick={onOpenLinkModal}
            className="flex items-center gap-1 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3.5 py-2 text-xs font-bold text-white transition active:scale-95 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>ربط ابن جديد</span>
          </button>
        </div>

        {/* Children selector chips */}
        {linkedChildren.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {linkedChildren.map((child) => {
              const isSelected = child.studentId === selectedStudentId;
              return (
                <button
                  key={child.studentId}
                  onClick={() => setSelectedStudentId(child.studentId)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shrink-0 ${
                    isSelected
                      ? 'bg-white text-teal-900 shadow-sm'
                      : 'bg-white/10 text-teal-100 hover:bg-white/20'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{child.studentName}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {linkedChildren.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <Users className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-xs font-bold">لم تقم بربط أي ابن بحسابك بعد</p>
          <p className="text-[11px] text-slate-400 mt-1">
            اطلب كود الربط (Student Linking Code) من ابنك أو من المدرس لربط حسابه ومتابعة درجاته
          </p>
          <button
            onClick={onOpenLinkModal}
            className="mt-3 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm"
          >
            ربط الابن الآن
          </button>
        </div>
      ) : (
        <>
          {/* Weekly Summary Card (Requirement #10) */}
          {weeklySummary && (
            <div className="rounded-2xl border border-teal-200/90 bg-teal-50/80 p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-teal-950">
                  <BarChart2 className="w-4 h-4 text-teal-700" />
                  <span>الملخص الأسبوعي للابن ({selectedChild?.studentName}):</span>
                </div>
                <button
                  onClick={() => selectedChild && handleUnlink(selectedChild.studentName, selectedChild.studentId)}
                  className="text-[10px] text-slate-400 hover:text-rose-600 transition flex items-center gap-0.5"
                  title="إلغاء ربط الحساب"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>إلغاء الربط</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-teal-100">
                  <span className="text-[10px] text-slate-400 block">الحضور الأسبوعي</span>
                  <strong className="text-emerald-700 text-xs">{weeklySummary.sessionsSummaryText}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-teal-100">
                  <span className="text-[10px] text-slate-400 block">الواجبات الجارية</span>
                  <strong className="text-blue-700 text-xs">{weeklySummary.activeHomeworkCount} واجبات</strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-teal-100">
                  <span className="text-[10px] text-slate-400 block">نسبة الحضور</span>
                  <strong className="text-teal-900 text-xs">{weeklySummary.attendanceRate}%</strong>
                </div>
              </div>
            </div>
          )}

          {/* Action Bar: Print Official Report & WhatsApp Contact */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white p-2.5 text-xs font-bold transition shadow-xs active:scale-98"
            >
              <Printer className="w-4 h-4 text-teal-300" />
              <span>طباعة بطاقة تقييم شاملة للابن</span>
            </button>
            <button
              onClick={() => setWhatsAppModalOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 text-xs font-bold transition shadow-xs active:scale-98"
              title="مراسلة أستاذ المادة"
            >
              <Send className="w-4 h-4" />
              <span>مراسلة المدرس</span>
            </button>
          </div>

          {/* Child Tuition Fee Status Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">حالة اشتراك شهر سبتمبر:</span>
                <span className="text-[11px] text-slate-500">
                  {septPayment?.status === 'paid' ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 inline" />
                      مسدد بالكامل ({septPayment.paidAmount} ج.م) · {septPayment.notes || 'حساب منتظم'}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold">مستحق السداد (٢٥٠ ج.م)</span>
                  )}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg font-mono">
              {childGroups[0]?.name || 'المجموعة'}
            </span>
          </div>

          {/* AI Educational Advisor Card */}
          <div className="rounded-2xl bg-linear-to-r from-slate-900 to-indigo-950 p-3.5 text-white shadow-md flex items-center justify-between border border-indigo-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-linear-to-tr from-amber-400 to-indigo-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                <Sparkles className="w-4 h-4 fill-slate-950" />
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-xs text-white">المستشار التربوي الذكي (Gemini)</span>
                <span className="text-[11px] text-indigo-200 block truncate">
                  استشر الذكاء الاصطناعي في تنظيم وقت المذاكرة وتشجيع ابنك
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('gemini-chat')}
              className="rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 px-3 py-1.5 text-xs font-black transition active:scale-95 shrink-0 shadow-sm"
            >
              استشارة تربوية
            </button>
          </div>

          {/* Child Badges & Achievements */}
          {childBadges.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50/40 p-3.5 shadow-2xs">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 mb-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                أوسمة التميز الممنوحة لابنكم ({childBadges.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {childBadges.map((b) => (
                  <div
                    key={b.badgeId}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200 shadow-2xs text-xs"
                  >
                    <span className="text-base">{b.icon}</span>
                    <div>
                      <span className="font-bold text-amber-950 block">{b.title}</span>
                      <span className="text-[9px] text-slate-500 block truncate max-w-[140px]">
                        {b.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Child Certificates of Appreciation */}
          {childCerts.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                شهادات التقدير والتفوق للابن:
              </span>
              <div className="space-y-2">
                {childCerts.map((cert) => (
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
                      onClick={() => setSelectedCert(cert)}
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

          {/* 4 Cards: Session, Attendance, Homework, Grade */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Next Session */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 mb-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                الحصة القادمة
              </div>
              {nextSession ? (
                <>
                  <div className="font-bold text-xs text-slate-900 truncate mt-1">
                    {nextSession.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {nextSession.days[0]} ({nextSession.startTime})
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400 mt-2">لا توجد حصص</div>
              )}
            </div>

            {/* Card 2: Attendance Rate */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                سجل الحضور
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-emerald-700 font-bold">
                  {attendanceSummary?.presentCount || 0} حاضر
                </span>
                <span>·</span>
                <span className="text-rose-600 font-bold">
                  {attendanceSummary?.absentCount || 0} غياب
                </span>
              </div>
              {latestAttendance && (
                <div className="text-[10px] text-slate-400 mt-1">
                  آخر تسجيل: {latestAttendance.date} ({latestAttendance.status === 'present' ? 'حاضر' : 'غائب'})
                </div>
              )}
            </div>

            {/* Card 3: Next Homework */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                الواجب القادم
              </div>
              {nextHw ? (
                <>
                  <div className="font-bold text-xs text-slate-900 truncate mt-1">{nextHw.title}</div>
                  <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                    تسليم: {nextHw.dueDate}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400 mt-2">لا توجد واجبات</div>
              )}
            </div>

            {/* Card 4: Latest Grade */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                آخر درجة امتحان
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
          </div>

          {/* Teacher Notes for Parent */}
          {childNotes.length > 0 && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                <FileText className="w-4 h-4 text-teal-700" />
                ملاحظات المدرس الخاصة بولي الأمر
              </div>
              {childNotes.map((note) => (
                <div
                  key={note.noteId}
                  className="rounded-xl bg-white p-3 border border-teal-100 text-xs text-slate-700 leading-relaxed shadow-2xs"
                >
                  <p>{note.text}</p>
                  <span className="block text-[10px] text-slate-400 mt-1.5 text-left">
                    {note.createdAt.split('T')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recent Grades List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800">درجات الاختبارات</h3>
            {childGrades.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
                لم تسجل درجات حتى الآن
              </div>
            ) : (
              childGrades.map((g) => (
                <div
                  key={g.gradeId}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 truncate">{g.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{g.date}</div>
                  </div>
                  <div className="font-black text-sm text-teal-800 dir-ltr text-right mr-2">
                    {g.score} / {g.maxScore}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Printable Report Modal */}
      {selectedChild && (
        <StudentPrintReportModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          studentId={selectedChild.studentId}
          studentName={selectedChild.studentName}
          groupId={childGroups[0]?.groupId}
        />
      )}

      {/* Certificate Viewer Modal */}
      <CertificateModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        certificate={selectedCert}
      />

      {/* WhatsApp Modal with Teacher */}
      {selectedChild && (
        <WhatsAppQuickModal
          isOpen={whatsAppModalOpen}
          onClose={() => setWhatsAppModalOpen(false)}
          defaultPhone="01012345678"
          studentName={selectedChild.studentName}
          groupName={childGroups[0]?.name || 'مجموعة الرياضيات'}
          contextType="praise"
          extraData={{
            location: childGroups[0]?.location || 'السنتر',
          }}
        />
      )}
    </div>
  );
};
