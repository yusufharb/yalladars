import React from 'react';
import { storage } from '../../services/storage';
import { AttendanceRecord, GradeRecord, StudentNote } from '../../types';
import { Printer, X, Award, CheckCircle2, Calendar, FileText, Check, AlertCircle } from 'lucide-react';

interface StudentPrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  groupId?: string;
}

export const StudentPrintReportModal: React.FC<StudentPrintReportModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  groupId,
}) => {
  if (!isOpen) return null;

  const studentProfile = storage.getStudentProfile(studentId);
  const groups = groupId
    ? [storage.getGroupById(groupId)].filter(Boolean)
    : storage.getGroupsForStudent(studentId);

  const mainGroup = groups[0];
  const teacher = mainGroup ? storage.getUserById(mainGroup.teacherId) : null;

  const attendance: AttendanceRecord[] = storage.getAttendance().filter((a) => a.studentId === studentId);
  const grades: GradeRecord[] = storage.getGradesForStudent(studentId);
  const badges = storage.getBadgesByStudent(studentId);
  const payments = storage.getTuitionPaymentsByStudent(studentId);
  const notes: StudentNote[] = storage.getNotesForParent(studentId);

  // Attendance metrics
  const totalSessions = attendance.length;
  const presentCount = attendance.filter((a: AttendanceRecord) => a.status === 'present').length;
  const absentCount = attendance.filter((a: AttendanceRecord) => a.status === 'absent').length;
  const lateCount = attendance.filter((a: AttendanceRecord) => a.status === 'late').length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

  // Grade averages
  const totalScore = grades.reduce((acc: number, g: GradeRecord) => acc + g.score, 0);
  const totalMax = grades.reduce((acc: number, g: GradeRecord) => acc + g.maxScore, 0);
  const averagePercentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 95;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl text-slate-800 my-6 border border-slate-200">
        {/* Header Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">تقرير المتابعة والتقييم الشامل للطالب</h3>
              <p className="text-[11px] text-slate-500">جاهز للطباعة أو الحفظ كملف PDF</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التقرير</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div className="mt-4 p-6 rounded-2xl border border-slate-300 bg-white print:border-none print:p-0">
          {/* Official Header */}
          <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between">
            <div className="text-right">
              <h1 className="text-base font-black text-slate-900">منصة يلا درس — بطاقة المتابعة الشهرية</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                مجموعة: {mainGroup?.name || 'الرياضيات العامة'} · السنتر: {mainGroup?.location || 'سنتر الأوائل'}
              </p>
            </div>
            <div className="text-left font-mono text-[11px] text-slate-500">
              <div>تاريخ التقرير: {new Date().toISOString().split('T')[0]}</div>
              <div className="text-teal-800 font-bold">المدرس: {teacher?.name || 'أستاذ أحمد حسن'}</div>
            </div>
          </div>

          {/* Student Profile Info Grid */}
          <div className="grid grid-cols-3 gap-3 my-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">اسم الطالب:</span>
              <span className="font-bold text-slate-900 text-sm">{studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الصف الدراسي:</span>
              <span className="font-semibold text-slate-800">
                {studentProfile?.grade || mainGroup?.grade || 'الصف الأول الثانوي'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">المدرسة:</span>
              <span className="font-semibold text-slate-800">{studentProfile?.school || 'مدرسة المتفوقين'}</span>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-3 gap-2 my-4">
            <div className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/60 text-center">
              <span className="text-[10px] text-teal-800 font-bold block">نسبة الحضور</span>
              <span className="text-lg font-black text-teal-900">{attendanceRate}%</span>
              <span className="text-[10px] text-teal-700 block">
                ({presentCount} حضور من أصل {totalSessions} حصة)
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 text-center">
              <span className="text-[10px] text-blue-800 font-bold block">المعدل التراكمي للاختبارات</span>
              <span className="text-lg font-black text-blue-900">{averagePercentage}%</span>
              <span className="text-[10px] text-blue-700 block">
                ({totalScore} من {totalMax} درجة)
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 text-center">
              <span className="text-[10px] text-amber-800 font-bold block">الأوسمة والشهادات</span>
              <span className="text-lg font-black text-amber-900">{badges.length} وسام</span>
              <span className="text-[10px] text-amber-700 block">تكريم دراسي مستمر</span>
            </div>
          </div>

          {/* Exams & Grades Table */}
          <div className="my-4">
            <h4 className="text-xs font-bold text-slate-800 mb-2 border-r-2 border-teal-600 pr-2">
              سجل درجات الاختبارات التراكمية:
            </h4>
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="p-2 font-bold">عنوان الاختبار</th>
                  <th className="p-2 font-bold">التاريخ</th>
                  <th className="p-2 font-bold">الدرجة المحصلة</th>
                  <th className="p-2 font-bold">الدرجة النهائية</th>
                  <th className="p-2 font-bold">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {grades.length > 0 ? (
                  grades.map((g: GradeRecord) => (
                    <tr key={g.gradeId} className="border-b border-slate-100">
                      <td className="p-2 font-semibold text-slate-800">{g.title}</td>
                      <td className="p-2 text-slate-500 font-mono">{g.date}</td>
                      <td className="p-2 font-bold text-teal-800">{g.score}</td>
                      <td className="p-2 text-slate-600">{g.maxScore}</td>
                      <td className="p-2 font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 text-[10px]">
                          {Math.round((g.score / g.maxScore) * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-2 text-center text-slate-400">
                      لا توجد درجات مسجلة حتى الآن
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Badges Section */}
          {badges.length > 0 && (
            <div className="my-3">
              <h4 className="text-xs font-bold text-slate-800 mb-1.5 border-r-2 border-amber-500 pr-2">
                الأوسمة والشارات الممنوحة:
              </h4>
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <div
                    key={b.badgeId}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs"
                  >
                    <span>{b.icon}</span>
                    <span className="font-bold text-amber-950">{b.title}</span>
                    <span className="text-[10px] text-amber-700">({b.description})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tuition Status */}
          <div className="my-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">حالة سداد اشتراك الشهر:</span>
              <span className="font-bold text-slate-800">
                {payments.find((p) => p.status === 'paid')
                  ? 'تم سداد اشتراك شهر سبتمبر بالكامل (٢٥٠ ج.م) ✅'
                  : 'اشتراك الشهر مسدد أو معفى'}
              </span>
            </div>
            <div className="text-left text-[11px] text-slate-500">
              إيصال رقم: {payments[0]?.paymentId || 'REC-2026-01'}
            </div>
          </div>

          {/* Teacher Recommendations / Notes */}
          {notes.length > 0 && (
            <div className="my-3">
              <h4 className="text-xs font-bold text-slate-800 mb-1 border-r-2 border-teal-600 pr-2">
                ملاحظات وتوصيات أستاذ المادة لولي الأمر:
              </h4>
              <div className="space-y-1.5">
                {notes.map((n: StudentNote) => (
                  <div key={n.noteId} className="p-2 rounded-xl bg-teal-50/50 border border-teal-100 text-xs text-slate-700">
                    "{n.text}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures Footer */}
          <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
            <div>توقيع أستاذ المادة: ............................</div>
            <div>توقيع إدارة السنتر: ............................</div>
            <div>توقيع ولي الأمر بالعلم: ............................</div>
          </div>
        </div>
      </div>
    </div>
  );
};
