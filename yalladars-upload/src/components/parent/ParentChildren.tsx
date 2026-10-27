import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import { Users, Plus, CheckCircle2, AlertCircle, School, Calendar, Printer } from 'lucide-react';
import { StudentPrintReportModal } from '../common/StudentPrintReportModal';

interface ParentChildrenProps {
  onOpenLinkModal: () => void;
}

export const ParentChildren: React.FC<ParentChildrenProps> = ({ onOpenLinkModal }) => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const parentId = currentUser?.id || 'user_parent_1';

  const linkedChildren = storage.getStudentsForParent(parentId);
  const [selectedChildForPrint, setSelectedChildForPrint] = useState<{
    studentId: string;
    studentName: string;
  } | null>(null);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">أبنائي</h1>
          <p className="text-xs text-slate-500">إدارة حسابات الأبناء المرتبطين بحسابك</p>
        </div>
        <button
          onClick={onOpenLinkModal}
          className="flex items-center gap-1 rounded-2xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>ربط ابن جديد</span>
        </button>
      </div>

      {linkedChildren.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <Users className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-xs font-bold">لا يوجد أبناء مرتبطين بعد</p>
          <p className="text-[11px] text-slate-400 mt-1">
            اطلب كود الربط من ابنك أو المدرس لربطه ومتابعة حصصه
          </p>
          <button
            onClick={onOpenLinkModal}
            className="mt-3 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white"
          >
            إدخال كود الربط
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {linkedChildren.map((child) => {
            const groups = storage.getGroupsForStudent(child.studentId);
            return (
              <div
                key={child.studentId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{child.studentName}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{child.grade}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setSelectedChildForPrint({
                          studentId: child.studentId,
                          studentName: child.studentName,
                        })
                      }
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-[10px] transition"
                    >
                      <Printer className="w-3 h-3" />
                      <span>بطاقة التقرير</span>
                    </button>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      مرتبط ✓
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                  <span className="flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-slate-400" />
                    {child.school}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    {groups.length} مجموعات دراسية
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    تم الربط: {child.linkedAt}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Print Report Modal */}
      {selectedChildForPrint && (
        <StudentPrintReportModal
          isOpen={!!selectedChildForPrint}
          onClose={() => setSelectedChildForPrint(null)}
          studentId={selectedChildForPrint.studentId}
          studentName={selectedChildForPrint.studentName}
        />
      )}
    </div>
  );
};
