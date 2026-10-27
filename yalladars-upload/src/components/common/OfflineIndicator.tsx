import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Cloud, ArrowDownUp, AlertTriangle, X } from 'lucide-react';
import { syncEngine, SyncState, BlockedSyncItem } from '../../services/syncEngine';

export const OfflineIndicator: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>(() => syncEngine.getState());
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [showBlockedModal, setShowBlockedModal] = useState<boolean>(false);
  const [blockedItems, setBlockedItems] = useState<BlockedSyncItem[]>([]);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state) => {
      setSyncState(state);
      if (state.blockedCount > 0) {
        setBlockedItems(syncEngine.getBlockedQueue());
      } else {
        setBlockedItems([]);
      }
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
          <div className="flex justify-end gap-1.5">
            {syncState.blockedCount > 0 && (
              <button
                onClick={() => {
                  setBlockedItems(syncEngine.getBlockedQueue());
                  setShowBlockedModal(true);
                }}
                className="pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-900/90 backdrop-blur-md text-white border border-rose-500/60 shadow-lg text-[10px] hover:bg-rose-800 transition"
                title="تعديلات مرفوضة تحتاج مراجعة"
              >
                <AlertTriangle className="h-3 w-3 text-rose-300" />
                <span>{syncState.blockedCount} مرفوض</span>
              </button>
            )}

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

      {/* Blocked Sync Changes Modal */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>تعديلات معلقة/مرفوضة من الخادم ({blockedItems.length})</span>
              </h3>
              <button onClick={() => setShowBlockedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
              {blockedItems.map((item) => (
                <div key={item.id} className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 space-y-1">
                  <div className="font-bold text-slate-900">
                    {item.entityType} ({item.action})
                  </div>
                  <div className="text-[11px] text-rose-700">
                    السبب: {item.reason || item.rejectedReason || 'غير مصرح بهذا التعديل'}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={async () => {
                  await syncEngine.retryBlockedItems();
                  setShowBlockedModal(false);
                }}
                className="rounded-xl bg-teal-700 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => {
                  syncEngine.clearBlockedItems();
                  setShowBlockedModal(false);
                }}
                className="rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                تجاهل ومسح القائمة
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
