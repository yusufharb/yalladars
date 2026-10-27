import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import type { User, AppReport } from '../../types/index.ts';
import {
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  const rawUsers = storage.getUsers() || [];
  const users: User[] = (Array.isArray(rawUsers) ? rawUsers.flat(Infinity) : [])
    .filter((u): u is User => Boolean(u && typeof u === 'object' && !Array.isArray(u) && (u.id || u.email)));

  const groups = storage.getGroups() || [];
  const rawReports = storage.getReports() || [];
  const reports: AppReport[] = (Array.isArray(rawReports) ? rawReports.flat(Infinity) : [])
    .filter((r): r is AppReport => Boolean(r && typeof r === 'object' && !Array.isArray(r)));

  const teachersCount = users.filter((u) => u.role === 'teacher').length;
  const studentsCount = users.filter((u) => u.role === 'student').length;
  const parentsCount = users.filter((u) => u.role === 'parent').length;

  const handleToggleStatus = (userId: string) => {
    storage.toggleUserStatus(userId);
    setRefreshKey((k) => k + 1);
  };

  const handleResetDemoData = () => {
    storage.resetToDefaultDemo();
    setConfirmReset(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-purple-100 p-2 text-purple-800">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">إدارة النظام (Admin)</h1>
            <p className="text-xs text-slate-500">مسار محمي لإدارة مستخدمي ومجموعات التطبيق</p>
          </div>
        </div>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
            title="إعادة تعيين البيانات للوضع الافتراضي"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>إعادة ضبط الديمو</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-[11px]">
            <button
              onClick={handleResetDemoData}
              className="bg-amber-600 text-white font-bold px-2 py-0.5 rounded-lg"
            >
              تأكيد الضبط
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-slate-600 font-bold px-1.5 py-0.5"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">إجمالي المدرسين</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{teachersCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">إجمالي الطلاب</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{studentsCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">أولياء الأمور</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{parentsCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">المجموعات النشطة</span>
          <div className="text-2xl font-black text-teal-800 mt-1">{groups.length}</div>
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <h3 className="font-bold text-xs text-slate-900">سجل المستخدمين والتحكم بالحسابات</h3>
        <div className="space-y-2">
          {users.map((u, idx) => (
            <div
              key={u.id || `user_${u.email || idx}`}
              className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 truncate">{u.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      u.role === 'teacher'
                        ? 'bg-teal-100 text-teal-800'
                        : u.role === 'student'
                        ? 'bg-blue-100 text-blue-800'
                        : u.role === 'parent'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {u.role === 'teacher'
                      ? 'مدرس'
                      : u.role === 'student'
                      ? 'طالب'
                      : u.role === 'parent'
                      ? 'ولي أمر'
                      : 'مدير'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 dir-ltr text-right truncate">
                  {u.email}
                </div>
              </div>

              <div className="shrink-0 mr-2 flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold ${
                    u.status === 'active' ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {u.status === 'active' ? 'نشط' : 'معطل'}
                </span>
                {u.role !== 'admin' && (
                  <button
                    onClick={() => handleToggleStatus(u.id)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      u.status === 'active'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {u.status === 'active' ? 'تعطيل الحساب' : 'تفعيل'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reports and Support requests */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <h3 className="font-bold text-xs text-slate-900">بلاغات وملاحظات المستخدمين ({reports.length})</h3>
        {reports.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">لا توجد بلاغات مسجلة</p>
        ) : (
          reports.map((rep, idx) => (
            <div key={rep.id || `report_${idx}`} className="rounded-xl bg-slate-50 p-3 text-xs space-y-1 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{rep.title}</span>
                <span className="text-[10px] text-slate-400">{rep.date}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{rep.description}</p>
              <div className="text-[10px] text-teal-700">بواسطة: {rep.userName} ({rep.userRole})</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
