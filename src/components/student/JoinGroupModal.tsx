import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { syncEngine } from '../../services/syncEngine';
import { Users, X, ArrowRight, AlertCircle } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialCode?: string;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCode = '',
}) => {
  const { currentUser } = useAuth();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialCode) {
        setCode(initialCode.toUpperCase());
      }
      setError(null);
    }
  }, [isOpen, initialCode]);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !currentUser) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/student/join-group', {
        method: 'POST',
        headers: syncEngine.getAuthHeaders(),
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        setError(data.error || 'كود الانضمام غير صحيح');
        return;
      }

      if (data.state) {
        storage.importServerState(data.state);
      }

      if (data.pendingApproval) {
        onSuccess(`تم إرسال طلب انضمامك إلى مجموعة (${data.group?.name || ''}) وبانتظار موافقة المدرس`);
      } else {
        onSuccess(data.group?.name || 'المجموعة');
      }
      onClose();
      setCode('');
    } catch {
      // Offline fallback when server is unreachable
      const localRes = storage.joinGroupByCode(currentUser, code);
      setLoading(false);

      if (localRes.success && localRes.group) {
        if (localRes.pendingApproval) {
          onSuccess(`تم إرسال طلب انضمامك إلى مجموعة (${localRes.group.name}) وبانتظار موافقة المدرس`);
        } else {
          onSuccess(localRes.group.name);
        }
        onClose();
        setCode('');
      } else {
        setError(localRes.error || 'كود الانضمام غير صحيح');
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

        <h3 className="text-base font-bold text-slate-900 text-center">الانضمام إلى مجموعة دراسية</h3>
        <p className="mt-1 text-xs text-slate-500 text-center">
          أدخل كود الانضمام المكون من حروف وأرقام المسلم لك من المدرس
        </p>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-2 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              كود الانضمام (Join Code)
            </label>
            <input
              type="text"
              required
              placeholder="مثال: YD-2026"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center font-mono text-base font-bold uppercase tracking-wider text-teal-900 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 border border-slate-100">
            💡 تجربة سريعة لكود يتطلب موافقة المدرس: جرب كود <strong className="font-mono text-teal-800">YD-2027</strong>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition active:scale-95 disabled:opacity-50"
          >
            <ArrowRight className="w-4 h-4" />
            <span>انضمام للمجموعة</span>
          </button>
        </form>
      </div>
    </div>
  );
};
