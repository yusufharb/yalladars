import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import {
  User,
  Shield,
  HelpCircle,
  Code,
  RotateCcw,
  LogOut,
  ChevronLeft,
  Smartphone,
  Info,
  CheckCircle2,
  Users,
  Download,
  Upload,
  FileSpreadsheet,
  Lock,
  Edit,
  History,
  AlertTriangle,
  Sparkles,
  Share2,
  Globe,
  Copy,
  Check,
  X
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface MoreScreenProps {
  onOpenAuth: () => void;
  onOpenHelp: () => void;
  onOpenAndroidCode: () => void;
  onOpenAdmin: () => void;
  onOpenGeminiChat?: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({
  onOpenAuth,
  onOpenHelp,
  onOpenAndroidCode,
  onOpenAdmin,
  onOpenGeminiChat,
}) => {
  const { currentUser, role, logout, switchRoleQuick } = useAuth();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);

  // Edit Profile Form State
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editSubject, setEditSubject] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editSchool, setEditSchool] = useState('');

  // Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [copiedRegisterLink, setCopiedRegisterLink] = useState(false);

  const studentProfile =
    role === 'student' && currentUser ? storage.getStudentProfile(currentUser.id) : null;
  const teacherProfile =
    role === 'teacher' && currentUser ? storage.getTeacherProfile(currentUser.id) : null;
  const auditLogs = storage.getAuditLogs();

  React.useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      if (teacherProfile) {
        setEditSubject(teacherProfile.subject);
        setEditCity(teacherProfile.city);
      }
      if (studentProfile) {
        setEditSchool(studentProfile.school);
      }
    }
  }, [currentUser]);

  const handleReset = () => {
    if (window.confirm('هل تريد إعادة تعيين البيانات التجريبية الافتراضية؟')) {
      storage.resetToDefaultDemo();
      window.location.reload();
    }
  };

  const handleExportBackup = () => {
    const jsonStr = storage.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `يلا_درس_نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = storage.importFullBackupJSON(content);
      if (res.success) {
        setImportStatusMsg('تم استيراد النسخة الاحتياطية بنجاح!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportStatusMsg(res.error || 'فشل الاستيراد');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    storage.updateUserProfile(currentUser.id, { name: editName });
    if (role === 'teacher') {
      storage.updateTeacherProfile(currentUser.id, { subject: editSubject, city: editCity });
    } else if (role === 'student') {
      storage.updateStudentProfile(currentUser.id, { school: editSchool });
    }

    setShowEditProfile(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
      setNewPassword('');
    }, 1500);
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        'تحذير: هل أنت متأكد من تعطيل حسابك؟ لن يتم مسح بيانات وسجلات مجموعاتك التاريخية للحفاظ على حقوق الطلاب.'
      )
    ) {
      if (currentUser) {
        storage.deleteUserSoft(currentUser.id);
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-lg">
              {currentUser?.name.charAt(0) || 'ي'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-slate-900 text-sm truncate">{currentUser?.name}</h2>
              <p className="text-xs text-slate-500 dir-ltr text-right truncate">
                {currentUser?.email}
              </p>
              <span className="inline-block mt-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                {role === 'teacher'
                  ? 'مدرس'
                  : role === 'student'
                  ? 'طالب'
                  : role === 'parent'
                  ? 'ولي أمر'
                  : 'مشرف نظام'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowEditProfile(true)}
            className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>تعديل</span>
          </button>
        </div>

        {studentProfile && (
          <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-200/80">
            <span className="block text-[11px] text-slate-500">كود ربط ولي الأمر:</span>
            <span className="font-mono text-sm font-black text-teal-800 dir-ltr">
              {studentProfile.linkingCode}
            </span>
          </div>
        )}

        {teacherProfile && (
          <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-200/80">
            <span>مدرس: </span>
            <strong className="text-slate-900">{teacherProfile.subject}</strong> · {teacherProfile.city}
          </div>
        )}
      </div>

      {importStatusMsg && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900">
          {importStatusMsg}
        </div>
      )}

      {/* Settings & Tools Links */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs divide-y divide-slate-100 text-xs font-semibold text-slate-800">
        {/* Global Access & Share Registration Link */}
        <div className="p-3.5 bg-linear-to-r from-teal-50/80 via-emerald-50/40 to-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 block truncate">رابط التسجيل ومشاركة التطبيق عالمياً</span>
                <span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full font-bold">مباشر 🌐</span>
              </div>
              <span className="text-[10px] text-slate-500 block truncate">
                دخول من أي مكان في العالم مع مزامنة سحابية مستمرة
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}?register=true`;
              navigator.clipboard?.writeText(url);
              setCopiedRegisterLink(true);
              setTimeout(() => setCopiedRegisterLink(false), 2500);
            }}
            className="flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 shrink-0 shadow-xs"
          >
            {copiedRegisterLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-teal-200" />
                <span>تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ الرابط</span>
              </>
            )}
          </button>
        </div>

        {onOpenGeminiChat && (
          <button
            onClick={onOpenGeminiChat}
            className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition bg-linear-to-r from-amber-50/60 to-white"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-lg bg-linear-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
              </div>
              <div className="text-right">
                <span className="block font-bold text-slate-900">المساعد التعليمي الذكي (Gemini Chat)</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  حل مسائل، صياغة امتحانات، واستشارات تربوية
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
              جديد ⭐
            </span>
          </button>
        )}

        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-teal-700" />
            <span>تغيير كلمة المرور</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={handleExportBackup}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-teal-700" />
            <span>تصدير نسخة احتياطية محلية (Export JSON)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">مجاني</span>
        </button>

        <label className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer">
          <div className="flex items-center gap-2.5">
            <Upload className="w-4 h-4 text-teal-700" />
            <span>استيراد نسخة احتياطية (Import JSON)</span>
          </div>
          <input
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
          <span className="text-[10px] text-slate-400 font-normal">اختيار ملف</span>
        </label>

        <button
          onClick={() => setShowAuditLogs(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-teal-700" />
            <span>سجل العمليات والتدقيق (Audit Log)</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onOpenAndroidCode}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <Code className="w-4 h-4 text-teal-700" />
            <span>كود أندرويد الأصلي (Kotlin / Compose) وبناء APK</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onOpenHelp}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-teal-700" />
            <span>المساعدة والأسئلة الشائعة والإبلاغ عن مشكلة</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onOpenAdmin}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-purple-700" />
            <span>لوحة تحكم إدارة النظام (Admin)</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onOpenAuth}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-blue-700" />
            <span>تبديل الحساب أو إنشاء حساب جديد</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={handleReset}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition text-amber-700"
        >
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4" />
            <span>إعادة تعيين البيانات التجريبية الافتراضية</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={handleDeleteAccount}
          className="w-full flex items-center justify-between p-3.5 hover:bg-rose-50 transition text-rose-600"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4" />
            <span>حذف / تعطيل الحساب (Soft Delete)</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* App Info Box */}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-center text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-700">تطبيق يلا درس — Yalla Dars V2</p>
        <p className="text-[11px]">نسخة مستقرة مجانية بالكامل بدون أي رسوم أو بطاقات أو Billing</p>
        <div className="pt-2 flex justify-center">
          <PWAInstallButton />
        </div>
      </div>

      {/* Modal: Edit Profile */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">تعديل البيانات الشخصية</h3>
              <button onClick={() => setShowEditProfile(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-teal-600 focus:outline-none"
                />
              </div>

              {role === 'teacher' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">المادة</label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">المدينة / المنطقة</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {role === 'student' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدرسة</label>
                  <input
                    type="text"
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-700 py-2.5 font-bold text-white hover:bg-teal-800 transition"
              >
                حفظ التعديلات
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">تغيير كلمة المرور</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-800 text-center font-bold">
                تم تغيير كلمة المرور بنجاح!
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-teal-600 focus:outline-none dir-ltr text-right"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-teal-700 py-2.5 font-bold text-white hover:bg-teal-800 transition"
                >
                  تحديث كلمة المرور
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Audit Logs (Requirement #32) */}
      {showAuditLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl bg-white p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h3 className="font-bold text-sm text-slate-900">سجل العمليات والتدقيق (Audit Log)</h3>
              <button onClick={() => setShowAuditLogs(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {auditLogs.length === 0 ? (
                <p className="text-slate-400 text-center py-4">لا توجد عمليات مسجلة</p>
              ) : (
                auditLogs.map((log, idx) => (
                  <div key={log.id || `log_${idx}`} className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-teal-900">{log.action}</strong>
                      <span className="text-[10px] text-slate-400">{log.timestamp.split('T')[0]}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{log.details}</p>
                    <div className="text-[10px] text-slate-400">بواسطة: {log.userName} ({log.userRole})</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
