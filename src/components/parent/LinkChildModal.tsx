import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { syncEngine } from '../../services/syncEngine';
import { Users, X, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LinkChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (childName: string) => void;
}

interface PreviewState {
  found: boolean;
  studentId?: string;
  studentName?: string;
  grade?: string;
  school?: string;
  alreadyLinked?: boolean;
}

export const LinkChildModal: React.FC<LinkChildModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    const cleanCode = code.trim().toUpperCase();
    if (!isOpen || cleanCode.length < 6) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    const checkPreview = async () => {
      try {
        const res = await fetch('/api/parent/preview-student', {
          method: 'POST',
          headers: syncEngine.getAuthHeaders(),
          body: JSON.stringify({ code: cleanCode }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.success) {
            setPreview({
              found: Boolean(data.found),
              studentId: data.studentId,
              studentName: data.studentName,
              grade: data.grade,
              school: data.school,
              alreadyLinked: Boolean(data.alreadyLinked),
            });
            return;
          }
        }
      } catch {
        // Fallback to local storage when offline
      }
      if (!cancelled) {
        const localPrev = storage.previewStudentByLinkingCode(cleanCode, currentUser?.id);
        setPreview(localPrev);
      }
    };

    checkPreview();
    return () => {
      cancelled = true;
    };
  }, [code, isOpen, currentUser?.id]);

  if (!isOpen) return null;

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !currentUser) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/parent/link-student', {
        method: 'POST',
        headers: syncEngine.getAuthHeaders(),
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        setError(data.error || 'كود ربط الطالب غير صحيح');
        return;
      }

      if (data.state) {
        storage.importServerState(data.state);
      } else {
        storage.linkChildByCode(currentUser.id, code);
      }

      onSuccess(data.studentName || preview?.studentName || 'الطالب');
      onClose();
      setCode('');
    } catch {
      // Offline fallback only when server is unreachable
      const localRes = storage.linkChildByCode(currentUser.id, code);
      setLoading(false);

      if (localRes.success && localRes.studentName) {
        onSuccess(localRes.studentName);
        onClose();
        setCode('');
      } else {
        setError(localRes.error || 'كود الطالب غير صحيح');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-800">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Users className="h-6 w-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 text-center">ربط حساب الابن</h3>
        <p className="mt-1 text-xs text-slate-500 text-center">
          أدخل كود ربط الابن (Student Linking Code) الخاص بحساب ابنك للتحقق من اسمه وربطه
        </p>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-2 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLink} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              كود ربط الطالب (Linking Code)
            </label>
            <input
              type="text"
              required
              placeholder="مثال: YD-LK-XXXX"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center font-mono text-base font-bold uppercase tracking-wider text-teal-900 focus:border-teal-600 focus:outline-none"
            />
          </div>

          {preview && preview.found && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تم التحقق من بيانات الطالب:</span>
              </div>
              <p className="font-bold text-sm text-slate-900 pr-5">{preview.studentName}</p>
              <p className="text-[11px] text-slate-600 pr-5">
                {preview.grade} • {preview.school}
              </p>
              {preview.alreadyLinked && (
                <p className="text-[11px] font-bold text-amber-700 pr-5">
                  هذا الطالب مربوط بحسابك بالفعل
                </p>
              )}
            </div>
          )}

          {preview && !preview.found && code.trim().length >= 8 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>لا يوجد طالب مسجل بهذا الكود، تأكد من الكود الظاهر في حساب ابنك.</span>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 border border-slate-100">
            💡 يمكنك الحصول على كود الربط الفريد الخاص بابنك من داخل حسابه الشخصي في بطاقة <strong className="text-teal-800">«كود ربط ولي الأمر»</strong> بصيغة <strong className="font-mono text-teal-800">YD-LK-XXXX</strong>.
          </div>

          <button
            type="submit"
            disabled={loading || (preview?.found === true && preview?.alreadyLinked === true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition active:scale-95 disabled:opacity-50"
          >
            <ArrowRight className="w-4 h-4" />
            <span>
              {preview?.found ? `تأكيد ربط (${preview.studentName})` : 'ربط الابن ومتابعة درجاته'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
