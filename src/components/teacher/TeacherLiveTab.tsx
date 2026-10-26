import React, { useState } from 'react';
import {
  Video,
  Presentation,
  Play,
  Share2,
  MessageCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  ExternalLink,
  Download,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { Group, LiveSession, LiveClassPlatform } from '../../types';
import { LiveClassroomModal } from '../common/LiveClassroomModal';

interface TeacherLiveTabProps {
  group: Group;
}

export const TeacherLiveTab: React.FC<TeacherLiveTabProps> = ({ group }) => {
  const { currentUser } = useAuth();

  const [activeSession, setActiveSession] = useState<LiveSession | null>(() =>
    storage.getActiveLiveSession(group.groupId)
  );

  const [isClassroomOpen, setIsClassroomOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

  // New session form state
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<LiveClassPlatform>('jitsi');
  const [customMeetingUrl, setCustomMeetingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Listen to storage changes to update active session
  React.useEffect(() => {
    const unsub = storage.subscribe(() => {
      setActiveSession(storage.getActiveLiveSession(group.groupId));
    });
    return unsub;
  }, [group.groupId]);

  const pastSessions = storage
    .getLiveSessionsByGroup(group.groupId)
    .filter((s) => s.status === 'ended');

  const handleStartLive = (e: React.FormEvent) => {
    e.preventDefault();

    const sessionTitle = title.trim() || `حصة أونلاين مباشرة — ${group.name}`;
    const roomName = `YallaDars_${group.groupId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const meetingUrl = platform === 'custom' && customMeetingUrl.trim()
      ? customMeetingUrl.trim()
      : `https://meet.jit.si/${roomName}`;

    const res = storage.startLiveSession({
      groupId: group.groupId,
      groupName: group.name,
      teacherId: currentUser?.id || 'user_teacher_1',
      teacherName: currentUser?.name || 'أستاذ المادة',
      title: sessionTitle,
      platform,
      meetingUrl,
      roomName,
      notes: notes.trim(),
    });

    if (res.success) {
      setActiveSession(res.session);
      setIsClassroomOpen(true);
      setSuccessToast('✓ تم بدء الحصة المباشرة وإشعار جميع طلاب المجموعة وأولياء أمورهم فوراً 🔔');
      setTimeout(() => setSuccessToast(null), 4000);
      setTitle('');
      setNotes('');
    }
  };

  const handleEndLive = (whiteboardSnapshot?: string) => {
    if (!activeSession) return;
    storage.endLiveSession(activeSession.sessionId, whiteboardSnapshot);
    setActiveSession(null);
    setIsClassroomOpen(false);
    setSuccessToast('تم إنهاء الحصة الأونلاين وحفظ ملخصها.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleShareWhatsApp = (session: LiveSession) => {
    const text = `السلام عليكم ورحمة الله وبركاته،
بدأت الآن الحصة الأونلاين المباشرة لمجموعة (${session.groupName}) مع ${session.teacherName} 🔴

📌 عنوان الحصة: ${session.title}
📱 رابط الدخول المباشر للحصة والسبورة:
${session.meetingUrl}

💡 ملاحظة: اضغط على الرابط للدخول مباشرة من الهاتف أو الكمبيوتر وسماع الشرح ومتابعة السبورة!`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {successToast && (
        <div className="flex items-center gap-2 rounded-2xl bg-teal-50 p-3 text-xs text-teal-800 border border-teal-200 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ACTIVE LIVE CLASSROOM BANNER */}
      {activeSession ? (
        <div className="rounded-3xl bg-linear-to-r from-rose-900 via-rose-800 to-slate-900 p-5 text-white shadow-xl border border-rose-700/60 space-y-4 animate-pulse-glow">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <span className="text-xs font-black tracking-wider text-rose-200">
                🔴 الحصة أونلاين جارية الآن على الهواء
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShareWhatsApp(activeSession)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>إرسال الرابط للطلاب على واتساب</span>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-base font-black text-white">{activeSession.title}</h2>
            <p className="text-xs text-rose-200 mt-1">
              المنصة: <strong>{activeSession.platform === 'jitsi' ? 'فيديو وصوت مجاني + سبورة (Jitsi)' : activeSession.platform === 'whiteboard' ? 'سبورة تفاعلية' : 'رابط مخصص'}</strong>
              {' · '}
              بدأت الساعة: {new Date(activeSession.startedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-700/50">
            <button
              onClick={() => setIsClassroomOpen(true)}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 rounded-2xl bg-white text-rose-900 hover:bg-rose-50 px-4 py-2.5 text-xs font-black transition active:scale-95 shadow-md"
            >
              <Video className="w-4 h-4 text-rose-600" />
              <span>دخول الفصل والسبورة الآن</span>
            </button>

            <button
              onClick={() => handleEndLive()}
              className="rounded-2xl bg-rose-950/80 hover:bg-rose-950 text-rose-200 border border-rose-700 px-4 py-2.5 text-xs font-bold transition active:scale-95"
            >
              إنهاء الحصة الأونلاين
            </button>
          </div>
        </div>
      ) : (
        /* START NEW LIVE SESSION FORM */
        <div className="rounded-3xl bg-linear-to-br from-slate-900 via-teal-950 to-slate-900 p-5 text-white shadow-xl border border-teal-800/40 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <Video className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">بدء حصة أونلاين تفاعلية (صوت وصورة وسبورة)</h2>
              <p className="text-xs text-teal-200/80 mt-0.5">
                طريقة مجانية 100% ومباشرة — يدخل الطلاب بنقرة واحدة بدون أي حسابات معقدة
              </p>
            </div>
          </div>

          <form onSubmit={handleStartLive} className="space-y-3.5">
            {/* Platform Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-teal-100 block">اختر نوع الحصة الأونلاين:</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform('jitsi')}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-right transition ${
                    platform === 'jitsi'
                      ? 'bg-teal-600/30 border-teal-400 text-white ring-1 ring-teal-400'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs">فيديو + صوت + سبورة</span>
                    <span className="text-[10px] bg-teal-500 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
                      موصى به ⭐
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    مجاني 100% وبدون حد زمني (Jitsi Meet)، يدعم كاميرا، مايك، ومشاركة الشاشة.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPlatform('whiteboard')}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-right transition ${
                    platform === 'whiteboard'
                      ? 'bg-teal-600/30 border-teal-400 text-white ring-1 ring-teal-400'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs">سبورة تفاعلية ذكية فقط</span>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    سبورة رقمية مدمجة لرسم المسائل وكتابة القوانين وتصديرها كصورة للطلاب.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPlatform('custom')}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-right transition ${
                    platform === 'custom'
                      ? 'bg-teal-600/30 border-teal-400 text-white ring-1 ring-teal-400'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs">رابط خارجي خاص بك</span>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    لصق رابط Google Meet أو Zoom أو بث يوتيوب مباشر جاهز لديك.
                  </p>
                </button>
              </div>
            </div>

            {/* Custom URL input if platform === 'custom' */}
            {platform === 'custom' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-teal-100 block">رابط الاجتماع (Google Meet / Zoom):</label>
                <div className="relative">
                  <input
                    type="url"
                    value={customMeetingUrl}
                    onChange={(e) => setCustomMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    required
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 dir-ltr text-right"
                  />
                  <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
            )}

            {/* Session Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-teal-100 block">موضوع الحصة / الدرس:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`مثال: مراجعة الجبر ليلة الامتحان وحل مسائل المتفوقين`}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            {/* Optional Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-teal-100 block">تعليمات للطلاب (اختياري):</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: يرجى تجهيز كشكول الرياضيات والآلة الحاسبة قبل الدخول"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 px-4 text-xs transition active:scale-98 shadow-md"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>بدء الحصة وإرسال إشعار فوري لجميع الطلاب 🚀</span>
            </button>
          </form>
        </div>
      )}

      {/* PAST LIVE SESSIONS & WHITEBOARD ARCHIVE */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-bold text-slate-900">سجل الحصص الأونلاين والسبورات المحفوظة</h3>
          </div>
          <span className="text-[11px] text-slate-500">
            {pastSessions.length} حصة سابقة
          </span>
        </div>

        {pastSessions.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
            لا توجد حصص سابقة بعد. عند انتهاء أول حصة أونلاين، سيتم حفظ تسجيل الحصة والسبورة هنا تلقائياً.
          </div>
        ) : (
          <div className="space-y-2">
            {pastSessions.map((session) => (
              <div
                key={session.sessionId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>{session.title}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-md">
                      منتهية ✓
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(session.startedAt).toLocaleDateString('ar-EG')}
                    </span>
                    <span>·</span>
                    <span>
                      الساعة: {new Date(session.startedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {session.notes && (
                    <p className="text-[11px] text-slate-600 mt-1 italic">
                      ملاحظة: {session.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {session.whiteboardSnapshot ? (
                    <button
                      onClick={() => setSelectedSnapshot(session.whiteboardSnapshot!)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 font-bold text-xs transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض السبورة المحفوظة</span>
                    </button>
                  ) : null}

                  <a
                    href={session.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>رابط الغرفة</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Snapshot Preview Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl p-4 border border-slate-700 text-white space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs">لقطة السبورة التفاعلية للحصة</h4>
              <div className="flex items-center gap-2">
                <a
                  href={selectedSnapshot}
                  download="سبورة_حصة_يلا_درس.png"
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الصورة</span>
                </a>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-800 max-h-[70vh] flex items-center justify-center">
              <img
                src={selectedSnapshot}
                alt="لقطة السبورة"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Classroom Fullscreen Modal */}
      {isClassroomOpen && activeSession && (
        <LiveClassroomModal
          isOpen={isClassroomOpen}
          onClose={() => setIsClassroomOpen(false)}
          session={activeSession}
          onEndSession={handleEndLive}
        />
      )}
    </div>
  );
};
