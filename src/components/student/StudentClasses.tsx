import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import { Plus, Users, Calendar, MapPin, Clock, CheckCircle2, AlertCircle, Clock4, Video } from 'lucide-react';
import { LiveClassroomModal } from '../common/LiveClassroomModal';
import { LiveSession } from '../../types';

interface StudentClassesProps {
  onOpenJoinModal: () => void;
}

export const StudentClasses: React.FC<StudentClassesProps> = ({ onOpenJoinModal }) => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const studentId = currentUser?.id || 'user_student_1';

  const [selectedLiveSession, setSelectedLiveSession] = useState<LiveSession | null>(null);

  const groups = storage.getGroupsForStudent(studentId);
  const pendingRequests = storage
    .getJoinRequests()
    .filter((r) => r.studentId === studentId && r.status === 'pending');

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">حصصي ومجموعاتي</h1>
          <p className="text-xs text-slate-500">المجموعات الدراسية التي انضممت إليها</p>
        </div>
        <button
          onClick={onOpenJoinModal}
          className="flex items-center gap-1 rounded-2xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>انضم لمجموعة</span>
        </button>
      </div>

      {/* Pending Approval Requests Notice */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-3.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900">
            <Clock4 className="w-4 h-4 text-purple-700" />
            <span>طلبات انضمام قيد مراجعة المدرس:</span>
          </div>
          {pendingRequests.map((req) => (
            <div
              key={req.requestId}
              className="flex items-center justify-between bg-white p-2 rounded-xl text-xs text-slate-700 border border-purple-100"
            >
              <span>{req.groupName}</span>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                بانتظار موافقة المدرس
              </span>
            </div>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <Users className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-xs font-bold">لم تنضم لأي مجموعة دراسية بعد</p>
          <p className="text-[11px] text-slate-400 mt-1">
            اطلب كود الانضمام (Join Code) من مدرسك واضغط على "انضم لمجموعة"
          </p>
          <button
            onClick={onOpenJoinModal}
            className="mt-3 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white"
          >
            إدخال كود الانضمام
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isPaused = group.status === 'paused';
            return (
              <div
                key={group.groupId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                      {group.subject}
                    </span>
                    <h3 className="mt-1 font-bold text-slate-900 text-xs">{group.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      المدرس: <strong className="text-slate-700">{group.teacherName}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isPaused && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        متوقفة مؤقتاً
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      منضم ✓
                    </span>
                  </div>
                </div>

                {/* Active Live Session Indicator */}
                {(() => {
                  const activeSession = storage.getActiveLiveSession(group.groupId);
                  if (!activeSession) return null;
                  return (
                    <div className="rounded-2xl bg-linear-to-r from-rose-900 to-slate-900 p-3 text-white flex items-center justify-between gap-2 border border-rose-700/60 shadow-md animate-pulse-glow">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                        </span>
                        <div>
                          <span className="text-xs font-black text-rose-200 block">🔴 الحصة أونلاين جارية الآن</span>
                          <span className="text-[10px] text-slate-300 truncate max-w-[180px] block">{activeSession.title}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedLiveSession(activeSession)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-rose-900 hover:bg-rose-50 text-xs font-black transition active:scale-95 shadow-sm shrink-0"
                      >
                        <Video className="w-3.5 h-3.5 text-rose-600" />
                        <span>دخول الحصة</span>
                      </button>
                    </div>
                  );
                })()}

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                  <span className="flex items-center gap-1 font-semibold text-teal-800">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    {group.days.join(' · ')} ({group.startTime})
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {group.location}
                  </span>
                </div>

                {/* Study Materials & Files for this group */}
                {(() => {
                  const groupMaterials = storage.getMaterialsByGroup(group.groupId);
                  if (groupMaterials.length === 0) return null;
                  return (
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-600 block">
                        📚 المذكرات والملازم المتاحة ({groupMaterials.length}):
                      </span>
                      <div className="space-y-1">
                        {groupMaterials.map((mat) => (
                          <div
                            key={mat.materialId}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-900 block truncate">{mat.title}</span>
                              <span className="text-[10px] text-teal-700">{mat.unit}</span>
                            </div>
                            <a
                              href={mat.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-teal-700 text-white font-bold text-[10px] hover:bg-teal-800 transition shrink-0 mr-2"
                            >
                              تحميل / فتح
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {selectedLiveSession && (
        <LiveClassroomModal
          isOpen={!!selectedLiveSession}
          onClose={() => setSelectedLiveSession(null)}
          session={selectedLiveSession}
        />
      )}
    </div>
  );
};
