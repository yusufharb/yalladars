import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Cloud, CloudOff, ArrowDownUp } from 'lucide-react';
import { syncEngine, SyncState } from '../../services/syncEngine';

export const OfflineIndicator: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>(() => syncEngine.getState());
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state) => {
      setSyncState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    const success = await syncEngine.syncNow();
    setIsManualSyncing(false);
    if (success) {
      setSyncSuccessMsg('تمت المزامنة السحابية بنجاح وتحديث كافة الأجهزة');
    } else {
      setSyncSuccessMsg('تم حفظ البيانات محلياً وسيتم المزامنة تلقائياً عند الاتصال');
    }
    setTimeout(() => setSyncSuccessMsg(null), 3500);
  };

  const formatLastSync = (ts: number | null): string => {
    if (!ts) return 'جارٍ الفحص...';
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 10) return 'الآن';
    if (diffSec < 60) return `منذ ${diffSec} ثانية`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    return 'منذ فترة';
  };

  return (
    <>
      {/* Offline Alert Bar */}
      {!syncState.isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 px-4 py-2 text-white shadow-md transition-all">
          <div className="mx-auto flex max-w-md items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>وضع عدم الاتصال: يمكنك الاستمرار بالحفظ محلياً (Offline-First)</span>
            </div>
            {syncState.pendingCount > 0 && (
              <span className="rounded bg-amber-700 px-2 py-0.5 font-bold">
                {syncState.pendingCount} معلق
              </span>
            )}
          </div>
        </div>
      )}

      {/* Temporary Toast for manual sync */}
      {syncSuccessMsg && (
        <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm rounded-xl bg-teal-800 p-3 text-xs text-white shadow-lg flex items-center justify-between animate-fade-in border border-teal-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-300 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Floating Sync Status & Trigger Bar when online */}
      {syncState.isOnline && (
        <div className="fixed top-2 left-4 right-4 z-40 mx-auto max-w-md pointer-events-none">
          <div className="flex justify-end">
            <button
              onClick={handleManualSync}
              disabled={isManualSyncing || syncState.status === 'syncing'}
              title="انقر للمزامنة الفورية بين أجهزة المدرس والطلاب وأولياء الأمور"
              className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-slate-700/60 shadow-lg text-[10px] hover:bg-slate-800 active:scale-95 transition"
            >
              {isManualSyncing || syncState.status === 'syncing' ? (
                <>
                  <RefreshCw className="h-3 w-3 text-teal-400 animate-spin" />
                  <span className="text-teal-300">مزامنة سحابية...</span>
                </>
              ) : syncState.pendingCount > 0 ? (
                <>
                  <ArrowDownUp className="h-3 w-3 text-amber-400 animate-pulse" />
                  <span className="text-amber-300 font-medium">
                    {syncState.pendingCount} معلق · مزامنة
                  </span>
                </>
              ) : (
                <>
                  <Cloud className="h-3 w-3 text-emerald-400" />
                  <span className="text-slate-300">
                    سحابي متزامن ({formatLastSync(syncState.lastSyncTime)})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
