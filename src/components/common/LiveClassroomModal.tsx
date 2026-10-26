import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  Presentation,
  Columns,
  MessageCircle,
  Users,
  CheckCircle2,
  Share2,
  Clock,
  Sparkles,
  ExternalLink,
  Volume2,
  ShieldCheck,
  Award,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { LiveSession } from '../../types';
import { InteractiveWhiteboard } from './InteractiveWhiteboard';
import { GeminiChatbot } from './GeminiChatbot';

interface LiveClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: LiveSession | null;
  onEndSession?: (whiteboardSnapshot?: string) => void;
}

type ViewMode = 'split' | 'whiteboard' | 'video';

export const LiveClassroomModal: React.FC<LiveClassroomModalProps> = ({
  isOpen,
  onClose,
  session,
  onEndSession,
}) => {
  const { currentUser, isTeacher, isTeacherOrAssistant } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [copiedLink, setCopiedLink] = useState(false);
  const [recordedAttendanceCount, setRecordedAttendanceCount] = useState<number | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // Calculate elapsed time
  useEffect(() => {
    if (!isOpen || !session || session.status !== 'live') return;

    const start = new Date(session.startedAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const diffMin = Math.floor((now - start) / 60000);
      setElapsedMinutes(Math.max(0, diffMin));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 30000);
    return () => clearInterval(interval);
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const isHost = isTeacherOrAssistant;

  // Build Jitsi meeting embed URL
  const getEmbedUrl = () => {
    if (session.platform === 'jitsi') {
      const displayName = encodeURIComponent(currentUser?.name || (isHost ? 'أستاذ المادة' : 'طالب'));
      // Jitsi URL parameters for smooth experience without annoying popups
      return `https://meet.jit.si/${session.roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=${isHost ? 'false' : 'true'}&config.startWithVideoMuted=false&userInfo.displayName="${displayName}"`;
    }
    return session.meetingUrl;
  };

  const handleCopyLink = () => {
    const inviteUrl = session.meetingUrl;
    navigator.clipboard?.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `السلام عليكم ورحمة الله وبركاته،
بدأت الآن الحصة الأونلاين المباشرة لمجموعة (${session.groupName}) مع ${session.teacherName} 🔴

📌 عنوان الحصة: ${session.title}
📱 رابط الدخول المباشر للحصة التفاعلية والسبورة:
${session.meetingUrl}

💡 ملاحظة: اضغط على الرابط للدخول مباشرة من الهاتف أو الكمبيوتر وسماع الشرح ومتابعة السبورة!`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // 1-Click Online Attendance Recording for Teacher
  const handleMarkOnlineAttendance = () => {
    const members = storage.getMembersByGroup(session.groupId);
    const today = new Date().toISOString().split('T')[0];
    let marked = 0;

    members.forEach((m) => {
      storage.recordSingleAttendance({
        groupId: session.groupId,
        date: today,
        studentId: m.studentId,
        studentName: m.studentName,
        status: 'present',
        modifiedByName: currentUser?.name || 'أستاذ المادة (أونلاين)',
      });
      marked++;
    });

    setRecordedAttendanceCount(marked);
    setTimeout(() => setRecordedAttendanceCount(null), 4000);
  };

  const handleSaveWhiteboardSnapshot = (dataUrl: string) => {
    storage.saveWhiteboardSnapshot(session.sessionId, dataUrl);
  };

  const handleEndClass = () => {
    if (window.confirm('هل تريد بالتأكيد إنهاء الحصة الأونلاين للجميع الآن؟')) {
      if (onEndSession) {
        onEndSession();
      } else {
        storage.endLiveSession(session.sessionId);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 px-4 py-2.5 border-b border-slate-800 text-white shrink-0">
        {/* Title & Live Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 bg-rose-600/30 text-rose-300 border border-rose-500/50 px-2.5 py-1 rounded-full text-xs font-black shrink-0 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>بث مباشر</span>
          </div>

          <div className="min-w-0">
            <h2 className="text-xs font-bold text-white truncate">{session.title}</h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="truncate">{session.groupName}</span>
              <span>·</span>
              <span className="flex items-center gap-1 text-teal-300">
                <Clock className="w-3 h-3 text-teal-400" />
                <span>مضى {elapsedMinutes} دقيقة</span>
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border border-slate-700">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition ${
              viewMode === 'split' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="عرض الفيديو والسبورة معاً"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">سبورة + فيديو</span>
          </button>

          <button
            onClick={() => setViewMode('whiteboard')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition ${
              viewMode === 'whiteboard' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="عرض السبورة التفاعلية ملء الشاشة"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>السبورة الذكية</span>
          </button>

          <button
            onClick={() => setViewMode('video')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition ${
              viewMode === 'video' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="عرض الفيديو والصوت فقط"
          >
            <Video className="w-3.5 h-3.5" />
            <span>الفيديو والصوت</span>
          </button>
        </div>

        {/* Host/Student Controls */}
        <div className="flex items-center gap-2">
          {/* WhatsApp Invite Button */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-bold transition active:scale-95 shadow-2xs"
            title="دعوة الطلاب عبر واتساب"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span className="hidden md:inline">واتساب</span>
          </button>

          {/* Copy Meeting Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 text-xs font-bold border border-slate-700 transition"
            title="نسخ رابط الحصة"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'تم النسخ!' : 'الرابط'}</span>
          </button>

          {/* Gemini AI Teaching Assistant Button */}
          <button
            onClick={() => setShowAiAssistant(!showAiAssistant)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold border transition ${
              showAiAssistant
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            }`}
            title="مساعد الذكاء الاصطناعي (Gemini) لتوليد الأسئلة والشرح"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">مساعد Gemini</span>
          </button>

          {/* Teacher: 1-Click Online Attendance */}
          {isHost && (
            <button
              onClick={handleMarkOnlineAttendance}
              className="flex items-center gap-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 text-xs font-bold transition active:scale-95"
              title="تسجيل حضور جميع طلاب المجموعة أونلاين"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-200" />
              <span className="hidden lg:inline">تسجيل حضور الأونلاين</span>
            </button>
          )}

          {/* End / Leave button */}
          {isHost ? (
            <button
              onClick={handleEndClass}
              className="flex items-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 text-xs font-bold transition active:scale-95 shadow-xs"
            >
              إنهاء الحصة
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 text-xs font-bold transition active:scale-95"
            >
              مغادرة الحصة
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Attendance toast alert if recorded */}
      {recordedAttendanceCount !== null && (
        <div className="bg-emerald-600 text-white px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2 animate-bounce-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>✓ تم تسجيل حضور {recordedAttendanceCount} طالباً في الحصة الأونلاين وحفظ كشف الغياب فوراً!</span>
        </div>
      )}

      {/* Main Classroom Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 gap-2">
        {/* VIDEO PANEL */}
        {(viewMode === 'video' || viewMode === 'split') && (
          <div
            className={`relative flex flex-col rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl ${
              viewMode === 'split' ? 'w-full md:w-5/12 h-64 md:h-full shrink-0' : 'w-full h-full'
            }`}
          >
            <div className="flex items-center justify-between bg-slate-800/80 px-3 py-1.5 text-slate-300 text-xs font-bold border-b border-slate-700">
              <span className="flex items-center gap-1.5 text-teal-300">
                <Video className="w-3.5 h-3.5 text-teal-400" />
                <span>غرفة الفيديو والصوت المباشر (مجاناً 100%)</span>
              </span>
              <a
                href={session.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300"
                title="فتح في نافذة مستقلة"
              >
                <span>فتح منفصل</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex-1 w-full h-full bg-slate-950 relative">
              <iframe
                src={getEmbedUrl()}
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                className="w-full h-full border-0"
                title="بث الحصة المباشرة"
              />
            </div>
          </div>
        )}

        {/* WHITEBOARD PANEL */}
        {(viewMode === 'whiteboard' || viewMode === 'split') && (
          <div className="flex-1 h-full min-h-[300px] flex flex-col">
            <InteractiveWhiteboard
              onSaveSnapshot={isHost ? handleSaveWhiteboardSnapshot : undefined}
              readOnly={!isHost}
              initialSnapshot={session.whiteboardSnapshot}
              className="w-full h-full"
            />
          </div>
        )}

        {/* GEMINI AI ASSISTANT SIDE PANEL */}
        {showAiAssistant && (
          <div className="w-full md:w-80 h-80 md:h-full bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl flex flex-col shrink-0 animate-fade-in overflow-hidden">
            <GeminiChatbot className="h-full border-none rounded-none" />
          </div>
        )}
      </div>
    </div>
  );
};
