import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import { Award, TrendingUp, Calendar, CheckCircle2, FileText, User } from 'lucide-react';

export const StudentGrades: React.FC = () => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const studentId = currentUser?.id || 'user_student_1';

  const [activeSubTab, setActiveSubTab] = useState<'grades' | 'profile'>('grades');

  const grades = storage.getGradesForStudent(studentId);
  const educationalProfile = storage.getStudentEducationalProfile(studentId);

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-base font-bold text-slate-900">سجل درجاتي ومستواي التعليمي</h1>
        <p className="text-xs text-slate-500">متابعة نتائج الاختبارات وسجل إنجاز الطالب</p>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('grades')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            activeSubTab === 'grades' ? 'bg-white text-teal-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          درجات الاختبارات ({grades.length})
        </button>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            activeSubTab === 'profile' ? 'bg-white text-teal-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          ملف المستوى التعليمي
        </button>
      </div>

      {activeSubTab === 'profile' ? (
        /* Requirement #8: Student Educational Profile (No Public Ranking) */
        <div className="space-y-3 animate-fade-in">
          <div className="rounded-2xl bg-teal-800 p-4 text-white shadow-xs space-y-2">
            <span className="text-xs text-teal-200">الملف التعليمي للطالب</span>
            <h2 className="text-base font-black">{currentUser?.name}</h2>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-teal-700/60 text-center">
              <div>
                <span className="text-[10px] text-teal-200 block">نسبة الحضور</span>
                <strong className="text-base font-black">
                  {educationalProfile.attendanceSummary.attendanceRate}%
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-teal-200 block">متوسط الدرجات</span>
                <strong className="text-base font-black">
                  {educationalProfile.averagePercentage}%
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-teal-200 block">الاختبارات</span>
                <strong className="text-base font-black">
                  {educationalProfile.gradesCount}
                </strong>
              </div>
            </div>
          </div>

          {/* Teacher Educational Notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <FileText className="w-4 h-4 text-teal-700" />
              <span>ملاحظات وإرشادات المعلم</span>
            </div>
            {educationalProfile.notes.length === 0 ? (
              <p className="text-xs text-slate-400">لا توجد ملاحظات مسجلة بعد</p>
            ) : (
              educationalProfile.notes.map((n) => (
                <div key={n.noteId} className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-100 space-y-1">
                  <p className="text-slate-700 leading-relaxed">{n.text}</p>
                  <span className="text-[10px] text-slate-400 block text-left">{n.createdAt.split('T')[0]}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Grades List */
        <div className="space-y-3">
          {grades.length > 0 && (
            <div className="flex items-center justify-between rounded-2xl bg-teal-50 border border-teal-200 p-3.5 text-teal-900 shadow-2xs">
              <div>
                <span className="text-xs text-teal-700">متوسط الأداء العام</span>
                <div className="text-2xl font-black mt-0.5">{educationalProfile.averagePercentage}%</div>
              </div>
              <div className="text-left">
                <span className="text-xs text-teal-700">الاختبارات المنجزة</span>
                <div className="text-base font-bold mt-0.5">{grades.length} اختبارات</div>
              </div>
            </div>
          )}

          {grades.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <Award className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold">لم تسجل لك درجات بعد</p>
              <p className="text-[11px] text-slate-400 mt-1">
                ستظهر درجاتك هنا بمجرد أن يرصدها مدرسك
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {grades.map((gr) => {
                const percent = Math.round((gr.score / gr.maxScore) * 100);
                return (
                  <div
                    key={gr.gradeId}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        {gr.groupName}
                      </span>
                      <h3 className="mt-1 font-bold text-xs text-slate-900">{gr.title}</h3>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{gr.date}</span>
                      </div>
                    </div>

                    <div className="text-left shrink-0 mr-3">
                      <div className="font-black text-base text-teal-800 dir-ltr text-right">
                        {gr.score} / {gr.maxScore}
                      </div>
                      <span
                        className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          percent >= 85
                            ? 'bg-emerald-50 text-emerald-800'
                            : percent >= 65
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
