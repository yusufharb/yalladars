import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import { BookOpen, Calendar, Clock, CheckCircle2 } from 'lucide-react';

export const StudentHomework: React.FC = () => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const studentId = currentUser?.id || 'user_student_1';

  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');

  const homeworkList = storage.getHomeworkForStudent(studentId);

  const filteredHomework = homeworkList.filter((hw) => {
    if (filter === 'active') return hw.status !== 'closed';
    if (filter === 'closed') return hw.status === 'closed';
    return true;
  });

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">واجباتي المدرسية</h1>
          <p className="text-xs text-slate-500">متابعة مواعيد تسليم الواجبات والتكاليف</p>
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

      {filteredHomework.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <BookOpen className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-xs font-bold">لا توجد واجبات مطابقة حالياً 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHomework.map((hw) => (
            <div
              key={hw.homeworkId}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {hw.groupName}
                  </span>
                  <h3 className="mt-1 font-bold text-xs text-slate-900">{hw.title}</h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 mr-2 ${
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

              <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                <span>تاريخ التكليف: {hw.assignedDate}</span>
                <span className="text-rose-700 font-bold">موعد التسليم: {hw.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
