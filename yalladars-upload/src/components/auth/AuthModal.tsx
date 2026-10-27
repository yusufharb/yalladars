import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { UserRole } from '../../types';
import { X, UserCheck, ShieldAlert, Sparkles, Eye, EyeOff, Lock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  defaultMode?: 'login' | 'register';
  embedded?: boolean;
}

const DEMO_USERS_LIST: { id: string; email: string }[] = [
  { id: 'user_teacher_1', email: 'teacher@yalladars.com' },
  { id: 'user_assistant_1', email: 'assistant@yalladars.com' },
  { id: 'user_student_1', email: 'student@yalladars.com' },
  { id: 'user_student_youssef', email: 'youssef@yalladars.com' },
  { id: 'user_student_marwan', email: 'marwan@yalladars.com' },
  { id: 'user_parent_hamdi', email: 'hamdi@yalladars.com' },
  { id: 'user_parent_1', email: 'parent@yalladars.com' },
  { id: 'user_admin_1', email: 'admin@yalladars.com' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  defaultMode = 'login',
  embedded = false,
}) => {
  const { login, register, isDemoMode, canUseDemoMode, setIsDemoMode } = useAuth();
  const resolvedMode = initialMode || defaultMode;
  const [mode, setMode] = useState<'login' | 'register'>(resolvedMode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || defaultMode);
    }
  }, [isOpen, initialMode, defaultMode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('الرياضيات');
  const [city, setCity] = useState('القاهرة');
  const [grade, setGrade] = useState('الصف الأول الثانوي');
  const [school, setSchool] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError('يرجى إدخال كلمة مرور صحيحة (6 أحرف على الأقل)');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const res = await login(email, password, false);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'خطأ في تسجيل الدخول');
        }
      } else {
        const res = await register({
          name,
          email,
          password,
          role: selectedRole,
          phone,
          subject: selectedRole === 'teacher' ? subject : undefined,
          city: selectedRole === 'teacher' ? city : undefined,
          grade: selectedRole !== 'parent' ? grade : undefined,
          school: selectedRole === 'student' ? school : undefined,
        });
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'خطأ في إنشاء الحساب');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoUserSwitch = async (userId: string) => {
    const found = DEMO_USERS_LIST.find((d) => d.id === userId);
    const localUser = storage.getUserById(userId);
    const targetEmail = found?.email || localUser?.email;
    if (targetEmail) {
      setSubmitting(true);
      setIsDemoMode(true);
      const res = await login(targetEmail, undefined, true);
      setSubmitting(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'تعذر الدخول للحساب التجريبي');
      }
    }
  };

  return (
    <div
      className={
        embedded
          ? 'w-full py-2 flex items-center justify-center'
          : 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
      }
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-800 max-h-[92vh] overflow-y-auto border border-slate-100">
        {!embedded && (
          <button
            onClick={onClose}
            className="absolute left-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white font-bold text-xl shadow-md">
            يد
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {mode === 'login' ? 'تسجيل الدخول إلى يلا درس' : 'إنشاء حساب جديد'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            رفيق تنظيم الدروس الخصوصية في مصر — مجاني وآمن
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              mode === 'login' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              mode === 'register' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر نوع الحساب</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { r: 'teacher', label: 'مدرس' },
                    { r: 'assistant', label: 'مساعد' },
                    { r: 'student', label: 'طالب' },
                    { r: 'parent', label: 'ولي أمر' },
                  ].map((item) => (
                    <button
                      key={item.r}
                      type="button"
                      onClick={() => setSelectedRole(item.r as UserRole)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                        selectedRole === item.r
                          ? 'border-teal-600 bg-teal-50 text-teal-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد أحمد محمود"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              placeholder="example@yalladars.eg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none dir-ltr text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              <span className="flex items-center justify-between">
                <span>كلمة المرور</span>
                {mode === 'login' && (
                  <span className="text-[10px] font-normal text-slate-400">
                    (كلمة مرور الحسابات الافتراضية: 123456)
                  </span>
                )}
              </span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none dir-ltr text-right"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
              <input
                type="tel"
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none dir-ltr text-right"
              />
            </div>
          )}

          {mode === 'register' && selectedRole === 'teacher' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المادة الدراسية</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الرياضيات، الفيزياء..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المدينة / المنطقة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مدينة نصر، المعادي..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {mode === 'register' && selectedRole === 'student' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الصف الدراسي</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs focus:border-teal-600 focus:outline-none bg-white"
                >
                  <option>الصف الأول الإعدادي</option>
                  <option>الصف الثاني الإعدادي</option>
                  <option>الصف الثالث الإعدادي</option>
                  <option>الصف الأول الثانوي</option>
                  <option>الصف الثاني الثانوي</option>
                  <option>الصف الثالث الثانوي</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المدرسة</label>
                <input
                  type="text"
                  placeholder="اسم المدرسة"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition active:scale-99 flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{mode === 'login' ? 'دخول آمن' : 'إنشاء الحساب والبدء'}</span>
          </button>
        </form>

        {/* Toggleable Demo Mode Section (Hidden by Default for Security) */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>هل ترغب في تجربة المنصة بحسابات استعراضية جاهزة؟</span>
            </span>
            <button
              type="button"
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold border transition ${
                isDemoMode
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isDemoMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{isDemoMode ? 'إخفاء وضع العرض التجريبي' : 'وضع العرض التجريبي'}</span>
            </button>
          </div>

          {isDemoMode && (
            <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-3 border border-slate-200/80 animate-fade-in">
              <p className="text-[10px] font-bold text-slate-500 text-center">
                أزرار الدخول السريع المخصصة لوضع العرض التجريبي (Demo Mode):
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleDemoUserSwitch('user_teacher_1')}
                  className="flex items-center justify-center gap-1 rounded-xl border border-teal-200 bg-teal-50/70 py-2 font-bold text-teal-900 hover:bg-teal-100 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>مدرس (أ/ أحمد حسن)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoUserSwitch('user_assistant_1')}
                  className="flex items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50/80 py-2 font-bold text-amber-900 hover:bg-amber-100 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>مساعد (أ/ سارة إبراهيم)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoUserSwitch('user_student_1')}
                  className="flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50/70 py-2 font-bold text-blue-900 hover:bg-blue-100 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>طالب (محمد أحمد)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoUserSwitch('user_student_youssef')}
                  className="flex items-center justify-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50/70 py-2 font-bold text-indigo-900 hover:bg-indigo-100 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>طالب (يوسف حمدي)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoUserSwitch('user_student_marwan')}
                  className="flex items-center justify-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50/70 py-2 font-bold text-cyan-900 hover:bg-cyan-100 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>طالب (مروان حمدي)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoUserSwitch('user_parent_hamdi')}
                  className="flex items-center justify-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50/90 py-2 font-bold text-emerald-950 hover:bg-emerald-100 transition shadow-2xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>ولي أمر (حمدي حرب)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoUserSwitch('user_parent_1')}
                  className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2 font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>ولي أمر (أحمد حسن)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoUserSwitch('user_admin_1')}
                  className="flex items-center justify-center gap-1 rounded-xl border border-purple-200 bg-purple-50/70 py-2 font-bold text-purple-900 hover:bg-purple-100 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>مشرف (Admin)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
