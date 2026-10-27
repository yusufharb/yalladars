import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import { Group, JoinApprovalMode } from '../../types';
import {
  Plus,
  Users,
  Calendar,
  MapPin,
  QrCode,
  Copy,
  Check,
  ChevronLeft,
  Search,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface TeacherGroupsProps {
  onSelectGroup: (groupId: string) => void;
  onViewQrCode: (group: Group) => void;
}

export const TeacherGroups: React.FC<TeacherGroupsProps> = ({
  onSelectGroup,
  onViewQrCode,
}) => {
  useStorageUpdate();
  const { currentUser } = useAuth();
  const teacherId = currentUser?.id || 'user_teacher_1';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('الرياضيات');
  const [grade, setGrade] = useState('الصف الأول الثانوي');
  const [location, setLocation] = useState('سنتر الأوائل - قاعة 1');
  const [selectedDays, setSelectedDays] = useState<string[]>(['السبت', 'الثلاثاء']);
  const [startTime, setStartTime] = useState('06:00 م');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [joinApprovalMode, setJoinApprovalMode] = useState<JoinApprovalMode>('auto');
  const [formError, setFormError] = useState<string | null>(null);

  const groups = storage.getGroupsByTeacher(teacherId);
  const allMembers = storage.getMembers();
  const allRequests = storage.getJoinRequests();

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.grade.toLowerCase().includes(search.toLowerCase()) ||
      g.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : statusFilter === 'active' ? g.status === 'active' : g.status === 'paused';
    return matchesSearch && matchesStatus;
  });

  const daysOptions = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  const toggleDay = (d: string) => {
    if (selectedDays.includes(d)) {
      setSelectedDays(selectedDays.filter((x) => x !== d));
    } else {
      setSelectedDays([...selectedDays, d]);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('اسم المجموعة مطلوب');
      return;
    }
    if (selectedDays.length === 0) {
      setFormError('يجب اختيار يوم واحد على الأقل للحصص');
      return;
    }

    const res = storage.createGroup({
      teacherId,
      teacherName: currentUser?.name || 'أستاذ أحمد حسن',
      name,
      subject,
      grade,
      location,
      days: selectedDays,
      startTime,
      durationMinutes,
      joinApprovalMode,
    });

    if (res.success && res.group) {
      setShowCreateModal(false);
      setName('');
      onSelectGroup(res.group.groupId);
    } else {
      setFormError(res.error || 'حدث خطأ أثناء إنشاء المجموعة');
    }
  };

  const handleToggleStatus = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    storage.toggleGroupStatus(groupId);
  };

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">المجموعات الدراسية</h1>
          <p className="text-xs text-slate-500">إدارة مجموعاتك ورموز الانضمام</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء مجموعة</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-2">
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              statusFilter === 'all' ? 'bg-white text-teal-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            الكل ({groups.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              statusFilter === 'active' ? 'bg-white text-teal-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            النشطة ({groups.filter((g) => g.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              statusFilter === 'paused' ? 'bg-white text-teal-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            المتوقفة ({groups.filter((g) => g.status === 'paused').length})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث عن اسم المجموعة أو الصف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2 pr-9 pl-3 text-xs focus:border-teal-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Group Cards */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            <Users className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-xs font-semibold">لا توجد مجموعات مطابقة للبحث</p>
            <p className="text-[11px] text-slate-400 mt-1">
              اضغط على "إنشاء مجموعة" للبدء في تنظيم دروسك
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const count = allMembers.filter((m) => m.groupId === group.groupId && m.status === 'active').length;
            const pendingReqs = allRequests.filter((r) => r.groupId === group.groupId && r.status === 'pending');
            const isPaused = group.status === 'paused';

            return (
              <div
                key={group.groupId}
                onClick={() => onSelectGroup(group.groupId)}
                className={`rounded-2xl border p-4 shadow-2xs transition cursor-pointer ${
                  isPaused
                    ? 'border-slate-300 bg-slate-50/90'
                    : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        {group.grade}
                      </span>
                      {isPaused ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          متوقفة مؤقتاً
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          نشطة
                        </span>
                      )}
                      {group.joinApprovalMode === 'requires_approval' && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          تتطلب موافقة
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 font-bold text-slate-900 text-sm truncate">
                      {group.name}
                    </h3>
                    <p className="text-xs text-slate-500">{group.subject}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400 mr-2 shrink-0 mt-1" />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {group.days.join(' · ')} ({group.startTime})
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {group.location}
                  </span>
                  <span className="flex items-center gap-1 text-slate-700 font-semibold">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    {count} طالباً
                  </span>
                  {pendingReqs.length > 0 && (
                    <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {pendingReqs.length} طلبات جديدة!
                    </span>
                  )}
                </div>

                {/* Footer with Pause/Resume and Codes */}
                <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-2 border border-slate-200/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">كود الانضمام:</span>
                    <span className="font-mono text-xs font-black text-teal-800 dir-ltr">
                      {group.joinCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleStatus(e, group.groupId)}
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold border transition ${
                        isPaused
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                      title={isPaused ? 'استئناف المجموعة' : 'إيقاف المجموعة مؤقتاً'}
                    >
                      {isPaused ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                      <span>{isPaused ? 'استئناف' : 'إيقاف'}</span>
                    </button>

                    <button
                      onClick={(e) => handleCopy(group.joinCode, e)}
                      className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 transition"
                      title="نسخ الكود"
                    >
                      {copiedCode === group.joinCode ? (
                        <>
                          <Check className="w-3 h-3 text-teal-600" />
                          <span className="text-teal-700">تم</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewQrCode(group);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 border border-teal-200 hover:bg-teal-100 transition"
                      title="عرض QR"
                    >
                      <QrCode className="w-3 h-3 text-teal-700" />
                      <span>QR</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-800 my-6">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              إنشاء مجموعة جديدة
            </h2>

            {formError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-2 text-xs text-rose-700 border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المجموعة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: رياضيات أولى ثانوي - مجموعة السبت"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المادة</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الصف</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs focus:border-teal-600 focus:outline-none bg-white"
                  >
                    <option>الصف الأول الثانوي</option>
                    <option>الصف الثاني الثانوي</option>
                    <option>الصف الثالث الثانوي</option>
                    <option>الصف الثالث الإعدادي</option>
                    <option>الصف الثاني الإعدادي</option>
                    <option>الصف الأول الإعدادي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مكان الحصة</label>
                <input
                  type="text"
                  placeholder="اسم السنتر والقاعة أو العنوان"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">أيام الحصص</label>
                <div className="flex flex-wrap gap-1.5">
                  {daysOptions.map((d) => {
                    const isSelected = selectedDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          isSelected
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت الحصة</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="06:00 م"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المدة (بالدقائق)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Join Approval Mode (Requirement #3) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  طريقة انضمام الطلاب بالكود:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setJoinApprovalMode('auto')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-right transition ${
                      joinApprovalMode === 'auto'
                        ? 'bg-teal-50 border-teal-600 text-teal-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <div>انضمام تلقائي</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      يدخل الطالب الكود وينضم فوراً
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setJoinApprovalMode('requires_approval')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-right transition ${
                      joinApprovalMode === 'requires_approval'
                        ? 'bg-purple-50 border-purple-600 text-purple-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <div>يحتاج موافقة</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      توافق على الطالب قبل انضمامه
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
                >
                  إنشاء وتوليد كود الانضمام
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
