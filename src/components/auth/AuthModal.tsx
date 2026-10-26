import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { storage } from '../../services/storage';
import { GraduationCap, BookOpen, Users, Shield, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, switchUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>('teacher');

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('الصف الأول الثانوي');
  const [school, setSchool] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const allUsers = storage.getUsers();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const res = login(email, password);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'خطأ في تسجيل الدخول');
      }
    } else {
      const res = register({
        name,
        email,
        role,
        phone,
        subject,
        grade,
        school,
      });
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'خطأ في إنشاء الحساب');
      }
    }
  };

  const handleDemoSelect = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      switchUser(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-800 my-8">
        {/* Header */}
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-teal-900">يلا درس — YallaDars</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            المنصة المجانية المتكاملة لمتابعة الدروس الخصوصية في مصر
          </p>
        </div>

        {/* Demo Fast Switcher */}
        <div className="mt-4 rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
          <span className="block text-xs font-bold text-slate-700 mb-2">
            🚀 تجربة فورية بدون تسجيل (حسابات تجريبية جاهزة):
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemoSelect('user_teacher_1')}
              className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-slate-200/90 text-right hover:border-teal-600 hover:bg-teal-50/50 transition shadow-2xs"
            >
              <div className="p-1 rounded-lg bg-teal-100 text-teal-800">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">أستاذ أحمد</div>
                <div className="text-[10px] text-slate-500">مدرس رياضيات</div>
              </div>
            </button>

            <button
              onClick={() => handleDemoSelect('user_student_1')}
              className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-slate-200/90 text-right hover:border-teal-600 hover:bg-teal-50/50 transition shadow-2xs"
            >
              <div className="p-1 rounded-lg bg-blue-100 text-blue-800">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">محمد أحمد</div>
                <div className="text-[10px] text-slate-500">طالب أولى ثانوي</div>
              </div>
            </button>

            <button
              onClick={() => handleDemoSelect('user_student_youssef')}
              className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-slate-200/90 text-right hover:border-teal-600 hover:bg-teal-50/50 transition shadow-2xs"
            >
              <div className="p-1 rounded-lg bg-indigo-100 text-indigo-800">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">يوسف حمدي</div>
                <div className="text-[10px] text-slate-500">طالب أولى ثانوي</div>
              </div>
            </button>

            <button
              onClick={() => handleDemoSelect('user_student_marwan')}
              className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-slate-200/90 text-right hover:border-teal-600 hover:bg-teal-50/50 transition shadow-2xs"
            >
              <div className="p-1 rounded-lg bg-cyan-100 text-cyan-800">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">مروان حمدي</div>
                <div className="text-[10px] text-slate-500">طالب ثانية ثانوي</div>
              </div>
            </button>

            <button
              onClick={() => handleDemoSelect('user_parent_hamdi')}
              className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-emerald-300 bg-emerald-50/40 text-right hover:border-emerald-600 hover:bg-emerald-50 transition shadow-2xs"
            >
              <div className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-emerald-950 truncate">حمدي حرب</div>
                <div className="text-[10px] text-emerald-700">ولي أمر (يوسف ومروان)</div>
              </div>
            </button>

            <button
              onClick={() => handleDemoSelect('user_assistant_1')}
              className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-amber-300 bg-amber-50/40 text-right hover:border-amber-600 hover:bg-amber-50 transition shadow-2xs"
            >
              <div className="p-1 rounded-lg bg-amber-100 text-amber-800">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-amber-950 truncate">أ/ سارة إبراهيم</div>
                <div className="text-[10px] text-amber-700">مساعد وسكرتارية</div>
              </div>
            </button>

            <button
              onClick={() => handleDemoSelect('user_admin_1')}
              className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-slate-200/90 text-right hover:border-teal-600 hover:bg-teal-50/50 transition shadow-2xs"
            >
              <div className="p-1 rounded-lg bg-purple-100 text-purple-800">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">إدارة النظام</div>
                <div className="text-[10px] text-slate-500">لوحة الإشراف</div>
              </div>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mode === 'login' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'
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
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mode === 'register' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            حساب جديد مجاني
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {mode === 'register' && (
            <>
              {/* Role selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اختر نوع الحساب:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition ${
                      role === 'teacher'
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 mb-1" />
                    مدرس
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('assistant')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition ${
                      role === 'assistant'
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mb-1" />
                    مساعد
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition ${
                      role === 'student'
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 mb-1" />
                    طالب
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('parent')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition ${
                      role === 'parent'
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4 mb-1" />
                    ولي أمر
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder={role === 'teacher' ? 'أ/ أحمد محمود' : 'الاسم ثلاثي أو ثنائي'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              {role === 'teacher' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المادة الدراسية</label>
                  <input
                    type="text"
                    placeholder="مثال: الرياضيات، الفيزياء، اللغة الإنجليزية..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
              )}

              {role === 'student' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الصف الدراسي</label>
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
                      <option>المرحلة الابتدائية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المدرسة</label>
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
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
            <input
              type="email"
              required
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none dir-ltr text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none dir-ltr text-right"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الموبايل (اختياري - بدون OTP)
              </label>
              <input
                type="tel"
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none dir-ltr text-right"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-800 transition disabled:opacity-50"
          >
            {loading ? (
              <span>جاري المعالجة...</span>
            ) : mode === 'login' ? (
              <>
                <UserCheck className="w-4 h-4" />
                <span>دخول</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>إنشاء الحساب فوراً</span>
              </>
            )}
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600"
        >
          إلغاء والمتابعة كزائر
        </button>
      </div>
    </div>
  );
};
