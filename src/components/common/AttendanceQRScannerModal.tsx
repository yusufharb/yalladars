import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Zap,
  Users,
  Search,
  Check,
  Send,
  Sparkles,
  QrCode,
  RefreshCw
} from 'lucide-react';
import { storage } from '../../services/storage';
import { Group, AttendanceStatus } from '../../types';

interface AttendanceQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  date?: string;
  onScanSuccess?: (studentId: string, studentName: string) => void;
}

export const AttendanceQRScannerModal: React.FC<AttendanceQRScannerModalProps> = ({
  isOpen,
  onClose,
  groupId,
  date = new Date().toISOString().split('T')[0],
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Manual code input
  const [manualCode, setManualCode] = useState<string>('');

  // Scan result state
  const [lastScanned, setLastScanned] = useState<{
    studentId: string;
    studentName: string;
    timestamp: string;
    parentNotified: boolean;
    parentName?: string;
  } | null>(null);

  // Group and members info
  const group = storage.getGroupById(groupId);
  const members = storage.getMembersByGroup(groupId);
  const allStudents = storage.getStudentProfiles();
  const allUsers = storage.getUsers();

  // Play audio beep sound using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch (e) {
      console.warn('Audio beep not supported:', e);
    }
  };

  // Start Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isOpen) {
      setCameraError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment' } })
          .then((s) => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
              videoRef.current.play().catch(() => {});
            }
            setCameraActive(true);
          })
          .catch((err) => {
            console.warn('Camera access denied or not available:', err);
            setCameraError('لم نتمكن من الوصول لكاميرا الجهاز. يمكنك استخدام مسح الكود السريع أو إدخال الكود أدناه.');
            setCameraActive(false);
          });
      } else {
        setCameraError('المتصفح لا يدعم الوصول المباشر للكاميرا. استخدم المسح التجريبي أو إدخال الكود.');
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Process a scanned student code or ID
  const processStudentCode = (codeOrId: string) => {
    if (!codeOrId.trim()) return;

    let targetStudentId = '';
    let targetStudentName = '';

    // Check if JSON payload from smart card
    try {
      if (codeOrId.includes('{') && codeOrId.includes('studentId')) {
        const parsed = JSON.parse(codeOrId);
        targetStudentId = parsed.studentId;
        targetStudentName = parsed.name;
      }
    } catch {}

    // If not JSON, search by studentId or linkingCode
    if (!targetStudentId) {
      const trimmed = codeOrId.trim();
      const profile = allStudents.find(
        (s) => s.linkingCode.toLowerCase() === trimmed.toLowerCase() || s.studentId === trimmed
      );
      if (profile) {
        targetStudentId = profile.studentId;
        const user = allUsers.find((u) => u.id === profile.studentId);
        targetStudentName = user?.name || profile.studentId;
      } else {
        // Search by member name or ID in this group
        const member = members.find(
          (m) =>
            m.studentId === trimmed ||
            m.studentName.toLowerCase().includes(trimmed.toLowerCase())
        );
        if (member) {
          targetStudentId = member.studentId;
          targetStudentName = member.studentName;
        }
      }
    }

    if (!targetStudentId) {
      alert(`لم يتم العثور على طالب بالكود: ${codeOrId}`);
      return;
    }

    // Ensure student name is resolved
    if (!targetStudentName) {
      const user = allUsers.find((u) => u.id === targetStudentId);
      targetStudentName = user?.name || 'الطالب';
    }

    // 1. Mark attendance in storage
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // 1. Record single attendance with instant parent notification
    const attResult = storage.recordSingleAttendance({
      groupId,
      date,
      studentId: targetStudentId,
      studentName: targetStudentName,
      status: 'present',
      modifiedByName: 'المسح الذكي (QR)',
    });

    // 2. Audio Beep & Haptic Feedback
    playBeep();
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // 3. Find parent for notification
    const parentLinks = storage.getParentStudents();
    const link = parentLinks.find((p) => p.studentId === targetStudentId);
    let parentNotified = attResult.parentNotified;
    let parentName = attResult.parentNames[0] || '';

    if (link) {
      const parentUser = storage.getUserById(link.parentId);
      if (!parentName) parentName = parentUser?.name || 'ولي الأمر';
      parentNotified = true;

      // Send positive notification to parent
      storage.addNotification({
        userId: link.parentId,
        title: `✅ تسجيل حضور الابن: ${targetStudentName}`,
        body: `حضر ${targetStudentName} حصة ${group?.subject || 'الدرس'} في تمام الساعة ${nowTime} بنجاح.`,
        type: 'attendance',
      });
    }

    setLastScanned({
      studentId: targetStudentId,
      studentName: targetStudentName,
      timestamp: nowTime,
      parentNotified,
      parentName,
    });

    setManualCode('');

    if (onScanSuccess) {
      onScanSuccess(targetStudentId, targetStudentName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 text-white p-5 shadow-2xl border border-teal-500/30 my-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center pb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-1">
            <Camera className="w-3.5 h-3.5 text-teal-400" />
            <span>ماسح الحضور الذكي بالكاميرا</span>
          </div>
          <h2 className="text-base font-black text-white">{group?.name || 'تسجيل الحضور'}</h2>
          <p className="text-[11px] text-slate-400">
            تاريخ اليوم: {date} · وجّه الكاميرا لكارنيه الطالب
          </p>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="relative mt-3 h-56 w-full rounded-2xl bg-black overflow-hidden flex items-center justify-center border-2 border-teal-500/40 shadow-inner">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {/* Scanner Overlay UI */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Viewfinder Target Box */}
            <div className="relative w-44 h-44 rounded-2xl border-2 border-dashed border-teal-400/80 flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-teal-300" />
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-teal-300" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-teal-300" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-teal-300" />

              {/* Animated Laser Scan Bar */}
              <div className="w-full h-0.5 bg-linear-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_8px_#2dd4bf] animate-bounce" />
            </div>

            <span className="mt-2 text-[10px] text-teal-200/90 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs font-mono">
              QR & Barcode Scanner Active
            </span>
          </div>

          {/* Camera fallback message if error */}
          {!cameraActive && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center">
              <QrCode className="w-12 h-12 text-teal-400 mb-2 animate-pulse" />
              <p className="text-xs font-bold text-white">الكاميرا جاهزة للمسح المباشر</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                {cameraError || 'يمكنك أيضاً الضغط على أي طالب بالأسفل لتسجيل حضوره بنقرة واحدة كمسح فوري.'}
              </p>
            </div>
          )}
        </div>

        {/* Instant Scan Success Feedback Toast */}
        {lastScanned && (
          <div className="mt-3 rounded-2xl bg-linear-to-r from-emerald-900/90 to-teal-900/90 p-3.5 border border-emerald-500/50 animate-fade-in shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-300">تم تسجيل الحضور بنجاح!</span>
                  <span className="text-[10px] font-mono text-emerald-200">{lastScanned.timestamp}</span>
                </div>
                <div className="font-bold text-sm text-white truncate mt-0.5">
                  {lastScanned.studentName}
                </div>
                {lastScanned.parentNotified && (
                  <div className="text-[10px] text-emerald-200 mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>تم إشعار ولي الأمر ({lastScanned.parentName}) فوراً</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual Barcode / Code Input Box */}
        <div className="mt-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              processStudentCode(manualCode);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="أدخل كود الطالب يدوياً (مثال: YD-LK-1001)..."
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-teal-400"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-teal-600 hover:bg-teal-500 px-4 py-2 text-xs font-bold text-white transition active:scale-95 shrink-0"
            >
              تسجيل
            </button>
          </form>
        </div>

        {/* Fast 1-Click Simulated QR Scan for Center Door Test */}
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-teal-400" />
              <span>طلاب المجموعة (اضغط للمسح السريع المباشر):</span>
            </span>
            <span className="text-[10px] text-teal-400 font-mono">{members.length} طالب</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
            {members.map((m) => {
              const profile = allStudents.find((s) => s.studentId === m.studentId);
              const isJustScanned = lastScanned?.studentId === m.studentId;
              return (
                <button
                  key={m.studentId}
                  onClick={() => processStudentCode(m.studentId)}
                  className={`text-right p-2 rounded-xl border text-xs transition flex items-center justify-between ${
                    isJustScanned
                      ? 'bg-emerald-800/80 border-emerald-400 text-white shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{m.studentName}</div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {profile?.linkingCode || m.studentId}
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-teal-500/20 text-teal-300 shrink-0 mr-1">
                    <QrCode className="w-3 h-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
