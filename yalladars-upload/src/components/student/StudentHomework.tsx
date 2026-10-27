import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import { BookOpen, CheckCircle2, Send, Award, MessageSquare, Clock, FileCheck } from 'lucide-react';
import { Homework } from '../../types';

export const StudentHomework: React.FC = () => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const studentId = currentUser?.id || 'user_student_1';
  const studentName = currentUser?.name || 'الطالب';

  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [submittingHw, setSubmittingHw] = useState<Homework | null>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const homeworkList = storage.getHomeworkForStudent(studentId);
  const mySubmissions = storage.getHomeworkSubmissionsForStudent(studentId);

  const filteredHomework = homeworkList.filter((hw) => {
    if (filter === 'active') return hw.status !== 'closed';
    if (filter === 'closed') return hw.status === 'closed';
    return true;
  });

  const handleOpenSubmit = (hw: Homework, existingContent?: string) => {
    setSubmittingHw(hw);
    setAnswerContent(existingContent || '');
  };

  const handleSubmitHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingHw || !answerContent.trim()) return;

    const res = storage.submitHomework({
      homeworkId: submittingHw.homeworkId,
      studentId,
      studentName,
      answerText: answerContent.trim(),
    });

    if (res.success) {
      setSubmittingHw(null);
      setAnswerContent('');
      setSuccessMsg(`تم إرسال حل الواجب (${submittingHw.title}) للمدرس بنجاح ✓`);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">واجباتي المدرسية</h1>
          <p className="text-xs text-slate-500">متابعة مواعيد تسليم الواجبات، إرسال الحلول، والدرجات</p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filter === 'all' ? 'bg-white text-teal-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filter === 'active' ? 'bg-white text-teal-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            الجارية
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filter === 'closed' ? 'bg-white text-teal-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            المنتهية
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {filteredHomework.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <BookOpen className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-xs font-bold">لا توجد واجبات مطابقة حالياً 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHomework.map((hw) => {
            const sub = mySubmissions.find((s) => s.homeworkId === hw.homeworkId);
            const maxScore = hw.maxScore || 10;

            return (
              <div
                key={hw.homeworkId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        {hw.groupName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        من {maxScore} درجات
                      </span>
                    </div>
                    <h3 className="mt-1 font-bold text-xs text-slate-900">{hw.title}</h3>
                  </div>

                  {/* Student Submission Status Badge */}
                  {sub?.status === 'graded' ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                      <Award className="w-3 h-3 text-emerald-600" />
                      <span>تم التصحيح: {sub.score} / {sub.maxScore || maxScore} 🌟</span>
                    </span>
                  ) : sub?.status === 'late' ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>تم التسليم متأخراً</span>
                    </span>
                  ) : sub ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1 shrink-0">
                      <FileCheck className="w-3 h-3 text-teal-600" />
                      <span>تم التسليم ✓</span>
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        hw.status === 'closed'
                          ? 'text-slate-600 bg-slate-100 border-slate-200'
                          : 'text-rose-700 bg-rose-50 border-rose-200'
                      }`}
                    >
                      {hw.status === 'closed' ? 'انتهى موعده' : 'لم يسلّم بعد'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {hw.description}
                </p>

                {/* Submitted Answer & Teacher Feedback Box */}
                {sub && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">
                        إجابتك المرسلة ({sub.submittedAt.split('T')[0]}):
                      </span>
                      <p className="text-slate-800 mt-0.5 whitespace-pre-wrap">{sub.answerText}</p>
                    </div>

                    {sub.status === 'graded' && (
                      <div className="pt-2 border-t border-slate-200 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-teal-800 block">
                              تعليق وتصحيح أستاذ المادة:
                            </span>
                            <p className="text-xs text-slate-700">
                              {sub.teacherFeedback || 'أحسنت، تم رصد الدرجة بنجاح 🌟'}
                            </p>
                          </div>
                        </div>
                        <div className="font-black text-sm text-emerald-700 dir-ltr shrink-0 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                          {sub.score} / {sub.maxScore || maxScore}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-2">
                    <span>التكليف: {hw.assignedDate}</span>
                    <span>•</span>
                    <span className="text-rose-700 font-bold">موعد التسليم: {hw.dueDate}</span>
                  </div>

                  {hw.status !== 'closed' && sub?.status !== 'graded' && (
                    <button
                      type="button"
                      onClick={() => handleOpenSubmit(hw, sub?.answerText)}
                      className="flex items-center gap-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 text-xs font-bold transition active:scale-95 shadow-2xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>{sub ? 'تعديل الإجابة' : 'تسليم الواجب الآن'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Homework Modal */}
      {submittingHw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl text-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-bold text-sm text-slate-900">تسليم حل الواجب</h3>
                <p className="text-[11px] text-slate-500">{submittingHw.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSubmittingHw(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitHomework} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اكتب إجابتك أو ملخص الحل أو رابط الملف المرفق *
                </label>
                <textarea
                  rows={4}
                  required
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="اكتب حل المسائل أو ملاحظات التسليم هنا ليقوم المدرس بتصحيحها ورصد الدرجة..."
                  className="w-full rounded-2xl border border-slate-200 p-3 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 py-2.5 text-xs font-bold text-white transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الحل للمدرس</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmittingHw(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

