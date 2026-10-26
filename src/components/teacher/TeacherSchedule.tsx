import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  AlertTriangle,
  Bell,
  Check
} from 'lucide-react';
import { ReminderSetting } from '../../types';

interface TeacherScheduleProps {
  onSelectGroup: (groupId: string) => void;
}

export const TeacherSchedule: React.FC<TeacherScheduleProps> = ({ onSelectGroup }) => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const teacherId = currentUser?.id || 'user_teacher_1';
  const groups = storage.getGroupsByTeacher(teacherId);
  const activeGroups = groups.filter((g) => g.status === 'active');
  const allMembers = storage.getMembers();

  // Schedule conflicts
  const conflicts = storage.detectTeacherScheduleConflicts(teacherId);

  // Reminder settings
  const [reminder, setReminder] = useState<ReminderSetting>(() => storage.getReminderSetting());
  const [savedReminderMsg, setSavedReminderMsg] = useState(false);

  const daysOrder = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  const handleUpdateReminder = (minutes: 10 | 30 | 60, enabled: boolean) => {
    const updated: ReminderSetting = { enabled, minutesBefore: minutes };
    setReminder(updated);
    storage.setReminderSetting(updated);
    setSavedReminderMsg(true);
    setTimeout(() => setSavedReminderMsg(false), 2500);
  };

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-base font-bold text-slate-900">جدول الحصص الأسبوعي</h1>
        <p className="text-xs text-slate-500">تنظيم مواعيد حصصك ومجموعاتك خلال الأسبوع</p>
      </div>

      {/* Schedule Conflict Warning (Requirement #13) */}
      {conflicts.length > 0 && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>تحذير تضارب في المواعيد!</span>
          </div>
          {conflicts.map((c, idx) => (
            <p key={idx} className="text-[11px] leading-relaxed text-rose-700">
              يوجد تضارب يوم <strong>{c.day}</strong> بين:{' '}
              <strong>{c.group1.name} ({c.group1.startTime})</strong> و{' '}
              <strong>{c.group2.name} ({c.group2.startTime})</strong>. يُرجى تعديل موعد إحدى الحصتين لتجنب تداخل الحضور.
            </p>
          ))}
        </div>
      )}

      {/* Reminder Setting Box (Requirement #14) */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
            <Bell className="w-4 h-4 text-teal-700" />
            <span>التذكير المحلي بمواعيد الحصص</span>
          </div>
          {savedReminderMsg && (
            <span className="text-[10px] text-teal-700 font-bold bg-white px-2 py-0.5 rounded-full border border-teal-200">
              تم الحفظ ✓
            </span>
          )}
        </div>
        <p className="text-[11px] text-teal-800">
          تنبيهات محلية مجانية داخل جهازك قبل بدء الحصة:
        </p>

        <div className="grid grid-cols-4 gap-1.5 text-xs">
          {[
            { val: 10, label: '10 دقائق' },
            { val: 30, label: '30 دقيقة' },
            { val: 60, label: 'ساعة' },
            { val: 0, label: 'إيقاف' },
          ].map((item) => {
            const isSelected = item.val === 0 ? !reminder.enabled : reminder.enabled && reminder.minutesBefore === item.val;
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.val === 0) {
                    handleUpdateReminder(30, false);
                  } else {
                    handleUpdateReminder(item.val as any, true);
                  }
                }}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Days Schedule */}
      <div className="space-y-3">
        {daysOrder.map((day) => {
          const dayGroups = activeGroups.filter((g) => g.days.includes(day));
          if (dayGroups.length === 0) return null;

          return (
            <div key={day} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                <Calendar className="w-4 h-4 text-teal-700" />
                <h3 className="font-black text-xs text-teal-900">{day}</h3>
                <span className="text-[10px] text-slate-400">({dayGroups.length} حصص)</span>
              </div>

              <div className="space-y-2">
                {dayGroups.map((g) => {
                  const studentCount = allMembers.filter((m) => m.groupId === g.groupId && m.status === 'active').length;
                  return (
                    <div
                      key={`${day}_${g.groupId}`}
                      onClick={() => onSelectGroup(g.groupId)}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-3 hover:bg-teal-50/50 hover:border-teal-200 border border-slate-100 transition cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{g.name}</span>
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/60 px-1.5 py-0.5 rounded">
                            {g.grade}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-teal-800">
                            <Clock className="w-3 h-3 text-teal-600" />
                            {g.startTime} ({g.durationMinutes} دقيقة)
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {g.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {studentCount} طلاب
                          </span>
                        </div>
                      </div>

                      <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
