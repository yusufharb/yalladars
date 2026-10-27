import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { Bell, CheckCircle2, BookOpen, Award, AlertTriangle, Sparkles } from 'lucide-react';

export const ParentAlerts: React.FC = () => {
  const { currentUser } = useAuth();
  const parentId = currentUser?.id || 'user_parent_1';

  const [notifications, setNotifications] = useState(() => storage.getNotificationsForUser(parentId));

  useEffect(() => {
    const update = () => {
      setNotifications(storage.getNotificationsForUser(parentId));
    };
    const unsubscribe = storage.subscribe(update);
    return unsubscribe;
  }, [parentId]);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">التنبيهات والإشعارات</h1>
          <p className="text-xs text-slate-500">إشعارات الحضور والغياب الفورية ودرجات الاختبارات</p>
        </div>
        {notifications.length > 0 && (
          <span className="text-[11px] font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
            {notifications.length} إشعار
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <Bell className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-xs font-bold">لا توجد تنبيهات جديدة</p>
          <p className="text-[11px] text-slate-400 mt-1">ستصلك هنا إشعارات فورية عند تسجيل غياب أو حضور ابنك في الحصة</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => {
            const isAttendanceAlert = notif.type === 'attendance';
            const isGrade = notif.type === 'grade';
            const isHomework = notif.type === 'homework';

            const Icon = isAttendanceAlert
              ? AlertTriangle
              : isGrade
              ? Award
              : isHomework
              ? BookOpen
              : CheckCircle2;

            return (
              <div
                key={notif.notificationId}
                className={`flex items-start gap-3 rounded-2xl border p-3.5 shadow-2xs transition animate-fade-in ${
                  isAttendanceAlert
                    ? 'border-rose-200 bg-linear-to-l from-rose-50/70 to-amber-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`rounded-xl p-2 shrink-0 ${
                    isAttendanceAlert
                      ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-300/60'
                      : 'bg-teal-50 text-teal-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-xs text-slate-900">{notif.title}</h3>
                      {isAttendanceAlert && (
                        <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.2 rounded-full">
                          إشعار غياب فوري
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {notif.createdAt ? notif.createdAt.split('T')[0] : 'اليوم'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">{notif.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
