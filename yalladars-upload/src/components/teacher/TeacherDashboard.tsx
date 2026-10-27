import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import {
  Calendar,
  Users,
  CheckCircle2,
  BookOpen,
  Plus,
  Clock,
  MapPin,
  ChevronLeft,
  Sparkles,
  QrCode,
  AlertTriangle,
  Award,
  Bell,
  CheckSquare,
  FileSpreadsheet,
  Video,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { Group } from '../../types';

interface TeacherDashboardProps {
  onNavigateToGroup: (
    groupId: string,
    tab?: 'attendance' | 'live' | 'homework' | 'grades' | 'announcements' | 'students' | 'notes' | 'reports' | 'assessments'
  ) => void;
  onOpenCreateGroup: () => void;
  onViewQrCode: (group: Group) => void;
  onNavigateTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigateToGroup,
  onOpenCreateGroup,
  onViewQrCode,
  onNavigateTab,
}) => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const teacherId = currentUser?.id || 'user_teacher_1';

  const [showAssistantPermsModal, setShowAssistantPermsModal] = useState(false);
  const [permSaveBanner, setPermSaveBanner] = useState<string | null>(null);

  // Live session check
  const activeLiveSession = storage.getActiveLiveSession();

  const groups = storage.getGroupsByTeacher(teacherId);
  const activeGroups = groups.filter((g) => g.status === 'active');
  const allMembers = storage.getMembers();
  const teacherGroupIds = groups.map((g) => g.groupId);
  const totalStudents = allMembers.filter((m) => teacherGroupIds.includes(m.groupId) && m.status === 'active').length;

  const homeworkList = storage.getHomework().filter((h) => teacherGroupIds.includes(h.groupId));
  const activeHomework = homeworkList.filter((h) => h.status !== 'closed');
  const allHwSubmissions = storage
    .getHomeworkSubmissions()
    .filter((s) => teacherGroupIds.includes(s.groupId));
  const pendingHwGrading = allHwSubmissions.filter(
    (s) => s.status === 'submitted' || s.status === 'late'
  );

  const pendingRequests = storage.getPendingJoinRequestsForTeacher(teacherId);
  const conflicts = storage.detectTeacherScheduleConflicts(teacherId);

  const assistants = storage.getUsers().filter((u) => u.role === 'assistant');

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = storage.getAttendance().filter(
    (a) => teacherGroupIds.includes(a.groupId) && a.date === today
  );

  const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
  const absentCount = todayAttendance.filter((a) => a.status === 'absent').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'late').length;

  const nextGroup = activeGroups[0] || groups[0];

  const handleToggleAssistantPerm = (
    assistantId: string,
    key: 'canRecordAttendance' | 'canSearchStudents' | 'canManagePayments' | 'canManageJoinRequests' | 'canManageHomework'
  ) => {
    const current = storage.getEffectiveAssistantPermissions(assistantId, teacherId);
    storage.saveAssistantPermissions({
      teacherId,
      assistantId,
      assistantName: current.assistantName,
      assistantEmail: current.assistantEmail,
      allowedGroupIds: current.allowedGroupIds,
      canRecordAttendance: current.canRecordAttendance,
      canSearchStudents: current.canSearchStudents,
      canManagePayments: current.canManagePayments,
      canManageJoinRequests: current.canManageJoinRequests,
      canManageHomework: current.canManageHomework,
      [key]: !current[key],
    });
    setPermSaveBanner('تم حفظ وتحديث صلاحيات المساعد فوراً');
    setTimeout(() => setPermSaveBanner(null), 2500);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-linear-to-l from-teal-800 to-teal-900 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-teal-200">أهلاً بك يا أستاذ 👋</span>
            <h1 className="text-lg font-black">{currentUser?.name || 'أستاذ أحمد حسن'}</h1>
            <p className="mt-1 text-xs text-teal-100/90">
              {activeGroups.length} مجموعات نشطة · {totalStudents} طالباً
            </p>
          </div>
          <button
            onClick={onOpenCreateGroup}
            className="flex items-center gap-1 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3.5 py-2 text-xs font-bold text-white transition active:scale-95 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>مجموعة جديدة</span>
          </button>
        </div>
      </div>

      {/* Active Live Session Alert Banner */}
      {activeLiveSession && (
        <div className="rounded-3xl bg-linear-to-r from-rose-900 via-rose-800 to-slate-900 p-4 text-white shadow-xl border-2 border-rose-500/80 animate-pulse-glow space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <span className="text-xs font-black tracking-wider text-rose-200">
                🔴 لديك حصة أونلاين مباشرة جارية الآن!
              </span>
            </div>
            <span className="text-[10px] bg-rose-500/30 text-rose-200 border border-rose-400/40 px-2 py-0.5 rounded-full font-bold">
              بث مباشر
            </span>
          </div>

          <div>
            <h3 className="text-sm font-black text-white">{activeLiveSession.title}</h3>
            <p className="text-xs text-rose-200 mt-0.5">
              المجموعة: <strong>{activeLiveSession.groupName}</strong>
            </p>
          </div>

          <button
            onClick={() => onNavigateToGroup(activeLiveSession.groupId, 'live')}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-rose-900 hover:bg-rose-50 px-4 py-2.5 text-xs font-black transition active:scale-95 shadow-md"
          >
            <Video className="w-4 h-4 text-rose-600" />
            <span>العودة لإدارة الحصة والسبورة الآن 🚀</span>
          </button>
        </div>
      )}

      {/* Schedule Conflict Warning Banner if any */}
      {conflicts.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-900">تنبيه: تضارب في جدول الحصص!</h4>
            <p className="text-[11px] text-rose-700 mt-0.5">
              يوجد تداخل في المواعيد يوم {conflicts[0].day} بين:{' '}
              <strong>{conflicts[0].group1.name} ({conflicts[0].group1.startTime})</strong> و{' '}
              <strong>{conflicts[0].group2.name} ({conflicts[0].group2.startTime})</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Important Alerts & Notifications Box */}
      {(pendingRequests.length > 0 || absentCount > 0 || activeHomework.length > 0 || pendingHwGrading.length > 0) && (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-3.5 text-xs text-amber-950 space-y-2 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <Bell className="w-4 h-4 text-amber-700" />
            <span>تنبيهات ومتابعات اليوم المهمة:</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            {pendingRequests.length > 0 && (
              <div
                onClick={() => onNavigateToGroup(pendingRequests[0].groupId, 'students')}
                className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-amber-200 cursor-pointer hover:bg-white transition"
              >
                <span>🔔 لديك {pendingRequests.length} طلبات انضمام جديدة بانتظار موافقتك</span>
                <span className="text-amber-800 font-bold underline">مراجعة</span>
              </div>
            )}
            {pendingHwGrading.length > 0 && (
              <div
                onClick={() => onNavigateToGroup(pendingHwGrading[0].groupId, 'homework')}
                className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-amber-200 cursor-pointer hover:bg-white transition"
              >
                <span>📥 يوجد {pendingHwGrading.length} تسليمات واجبات من الطلاب جاهزة للتصحيح</span>
                <span className="text-teal-800 font-bold underline">تصحيح الآن</span>
              </div>
            )}
            {absentCount > 0 && (
              <div className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-amber-200">
                <span>⚠️ {absentCount} طلاب غائبون مسجلون اليوم</span>
                <span className="text-rose-700 font-bold">تم إشعار أولياء الأمور</span>
              </div>
            )}
            {activeHomework.length > 0 && (
              <div className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-amber-200">
                <span>📝 لديك {activeHomework.length} واجبات جارية بحاجة لمتابعة التسليم</span>
                <span className="text-teal-800 font-bold">مستمر</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Up Next Card (الحصة القادمة) */}
      {nextGroup && (
        <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-teal-800 mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              الحصة القادمة
            </span>
            <span className="text-[11px] font-semibold text-teal-700 bg-white px-2 py-0.5 rounded-full border border-teal-200">
              {nextGroup.days.join(' · ')} {nextGroup.startTime}
            </span>
          </div>

          <h3 className="font-bold text-slate-900 text-sm">{nextGroup.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {nextGroup.location}
            </span>
            <span>·</span>
            <span>{nextGroup.durationMinutes} دقيقة</span>
            <span>·</span>
            <span className="font-mono text-teal-700 font-bold dir-ltr">
              كود: {nextGroup.joinCode}
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onNavigateToGroup(nextGroup.groupId, 'attendance')}
              className="flex-1 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition text-center shadow-2xs active:scale-95"
            >
              تسجيل الحضور السريع الآن
            </button>
            <button
              onClick={() => onViewQrCode(nextGroup)}
              className="rounded-xl border border-teal-200 bg-white px-3.5 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-50 transition active:scale-95"
              title="عرض كود QR"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold text-slate-700 px-1">الإجراءات السريعة</h3>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <button
            onClick={() => {
              if (nextGroup) onNavigateToGroup(nextGroup.groupId, 'attendance');
            }}
            className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 p-2.5 shadow-2xs hover:border-teal-400 hover:bg-teal-50/40 transition active:scale-95"
          >
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 mb-1">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="font-bold text-[11px] text-slate-800">حضور</span>
          </button>

          <button
            onClick={() => {
              if (nextGroup) onNavigateToGroup(nextGroup.groupId, 'homework');
            }}
            className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 p-2.5 shadow-2xs hover:border-teal-400 hover:bg-teal-50/40 transition active:scale-95"
          >
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 mb-1">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-bold text-[11px] text-slate-800">واجب</span>
          </button>

          <button
            onClick={() => {
              if (nextGroup) onNavigateToGroup(nextGroup.groupId, 'assessments');
            }}
            className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 p-2.5 shadow-2xs hover:border-teal-400 hover:bg-teal-50/40 transition active:scale-95"
          >
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 mb-1">
              <Award className="w-4 h-4" />
            </div>
            <span className="font-bold text-[11px] text-slate-800">اختبار</span>
          </button>

          <button
            onClick={() => onNavigateTab('gemini-chat')}
            className="flex flex-col items-center justify-center rounded-2xl bg-linear-to-b from-amber-50 to-white border border-amber-300 p-2.5 shadow-2xs hover:border-amber-400 transition active:scale-95"
            title="مساعد الذكاء الاصطناعي (Gemini)"
          >
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 mb-1 shadow-2xs font-black">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
            <span className="font-black text-[11px] text-amber-900">مساعد AI</span>
          </button>
        </div>
      </div>

      {/* Assistant Permissions Control Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-900">إدارة صلاحيات المساعد / السكرتارية</div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              افتراضياً: الحضور والبحث فقط · خصص صلاحية المصروفات والطلبات
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAssistantPermsModal(true)}
          className="flex items-center gap-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-3 py-2 text-xs font-bold transition shrink-0 mr-2"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>تخصيص</span>
        </button>
      </div>

      {/* Stats Cards: Students, Homework, Today's Attendance */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-700">إجمالي الطلاب</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">في {groups.length} مجموعات</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-700">الواجبات الجارية</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeHomework.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {pendingHwGrading.length > 0 ? `${pendingHwGrading.length} تسليم بانتظار التصحيح` : 'مستمرة للتسليم'}
          </div>
        </div>
      </div>

      {/* Attendance Today Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            حضور اليوم ({today})
          </div>
          <span className="text-[11px] text-slate-400">
            {todayAttendance.length > 0 ? `${todayAttendance.length} مسجل` : 'لم يسجل بعد'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
          <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-100">
            <div className="text-lg font-black text-emerald-800">{presentCount}</div>
            <div className="text-[10px] font-bold text-emerald-700">حاضر</div>
          </div>
          <div className="rounded-xl bg-rose-50 p-2.5 border border-rose-100">
            <div className="text-lg font-black text-rose-800">{absentCount}</div>
            <div className="text-[10px] font-bold text-rose-700">غائب</div>
          </div>
          <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-100">
            <div className="text-lg font-black text-amber-800">{lateCount}</div>
            <div className="text-[10px] font-bold text-amber-700">متأخر</div>
          </div>
        </div>
      </div>

      {/* My Groups Quick List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800">مجموعاتي الدراسية</h2>
          <span className="text-[11px] text-teal-700 font-semibold">{groups.length} مجموعات</span>
        </div>

        {groups.map((group) => {
          const membersCount = allMembers.filter((m) => m.groupId === group.groupId && m.status === 'active').length;
          const isPaused = group.status === 'paused';
          return (
            <div
              key={group.groupId}
              onClick={() => onNavigateToGroup(group.groupId)}
              className={`flex items-center justify-between rounded-2xl border p-3.5 transition cursor-pointer ${
                isPaused
                  ? 'bg-slate-50 border-slate-200 opacity-75'
                  : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-slate-900 text-xs truncate">{group.name}</div>
                  {isPaused && (
                    <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      متوقفة
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>{group.grade}</span>
                  <span>·</span>
                  <span>{group.days.join(' و ')}</span>
                  <span>·</span>
                  <span className="text-teal-700 font-medium">{membersCount} طلاب</span>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
            </div>
          );
        })}
      </div>

      {/* Assistant Permissions Modal */}
      {showAssistantPermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl text-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">تخصيص صلاحيات المساعدين والسكرتارية</h3>
                  <p className="text-[11px] text-slate-500">تحكم في المهام المسموحة لكل مساعد في مجموعاتك</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssistantPermsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {permSaveBanner && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{permSaveBanner}</span>
              </div>
            )}

            {assistants.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                لا يوجد حسابات مساعدين مسجلة حالياً
              </div>
            ) : (
              <div className="space-y-3">
                {assistants.map((assistant) => {
                  const perms = storage.getEffectiveAssistantPermissions(assistant.id, teacherId);
                  const permRows: Array<{
                    key: 'canRecordAttendance' | 'canSearchStudents' | 'canManagePayments' | 'canManageJoinRequests' | 'canManageHomework';
                    label: string;
                    desc: string;
                  }> = [
                    {
                      key: 'canRecordAttendance',
                      label: 'تسجيل الحضور والغياب ومسح QR',
                      desc: 'مفعل افتراضياً لتسجيل حضور الطلاب السريع',
                    },
                    {
                      key: 'canSearchStudents',
                      label: 'البحث عن الطلاب وعرض الكارنيهات',
                      desc: 'مفعل افتراضياً للبحث واستخراج الكارنيه الذكي',
                    },
                    {
                      key: 'canManagePayments',
                      label: 'تحصيل المصروفات وإصدار الإيصالات',
                      desc: 'السماح للمساعد بتسجيل سداد الاشتراكات الشهرية',
                    },
                    {
                      key: 'canManageJoinRequests',
                      label: 'مراجعة وقبول طلبات انضمام الطلاب',
                      desc: 'السماح بقبول أو رفض طلبات الانضمام للمجموعات',
                    },
                    {
                      key: 'canManageHomework',
                      label: 'متابعة تسليمات الواجبات',
                      desc: 'السماح بمتابعة حالة تسليم الطلاب للواجبات',
                    },
                  ];

                  return (
                    <div
                      key={assistant.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-slate-900">{assistant.name}</div>
                          <div className="text-[10px] text-slate-500">{assistant.email}</div>
                        </div>
                        <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                          مساعد المدرس
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-slate-200/70">
                        {permRows.map((row) => {
                          const enabled = perms[row.key];
                          return (
                            <div
                              key={row.key}
                              onClick={() => handleToggleAssistantPerm(assistant.id, row.key)}
                              className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200 cursor-pointer hover:border-teal-300 transition"
                            >
                              <div className="min-w-0 flex-1 ml-2">
                                <div className="font-bold text-xs text-slate-800">{row.label}</div>
                                <div className="text-[10px] text-slate-400">{row.desc}</div>
                              </div>
                              <button
                                type="button"
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shrink-0 ${
                                  enabled
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {enabled ? 'مفعل ✓' : 'مغلق'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAssistantPermsModal(false)}
              className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 py-2.5 text-xs font-bold text-white transition"
            >
              تم الحفظ وإغلاق النافذة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

