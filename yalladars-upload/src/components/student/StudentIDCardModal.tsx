import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Share2,
  Copy,
  Check,
  Award,
  BookOpen,
  School,
  QrCode,
  ShieldCheck,
  Sparkles,
  Phone
} from 'lucide-react';
import { storage } from '../../services/storage';

interface StudentIDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export const StudentIDCardModal: React.FC<StudentIDCardModalProps> = ({
  isOpen,
  onClose,
  studentId,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const studentUser = storage.getUserById(studentId);
  const profile = storage.getStudentProfile(studentId);
  const groups = storage.getGroupsForStudent(studentId);
  const linkingCode = profile?.linkingCode || '';

  // QR payload contains structured data for quick attendance scanning
  const qrPayload = JSON.stringify({
    type: 'yalladars_student_card',
    studentId,
    name: studentUser?.name || 'طالب يلا درس',
    linkingCode,
    grade: profile?.grade || 'الصف الأول الثانوي',
    school: profile?.school || 'مدرسة المتفوقين',
    issuedAt: '2026-09-01',
  });

  useEffect(() => {
    if (isOpen && studentId) {
      QRCode.toDataURL(qrPayload, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0f766e',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR error in StudentIDCardModal:', err));
    }
  }, [isOpen, studentId, qrPayload]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(linkingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `بطاقة طالب يلا درس الذكية 🎓\nالاسم: ${studentUser?.name}\nكود الطالب: ${linkingCode}\nالصف: ${profile?.grade}\nالمدرسة: ${profile?.school}\n\nيُستخدم هذا الكارنيه لتسجيل الحضور السريع بالسنتر عبر مسح QR.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-slate-800 my-4 border border-teal-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition print:hidden"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-2 print:hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200/60 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>كارنيه الطالب الذكي (Digital ID)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            أظهر هذا الكود عند باب السنتر لتسجيل حضورك فوراً بالكاميرا
          </p>
        </div>

        {/* Printable Card Area */}
        <div className="mt-2 rounded-2xl bg-linear-to-b from-teal-800 via-teal-900 to-slate-900 p-4 text-white shadow-xl relative overflow-hidden border-2 border-teal-500/40">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:14px_14px] opacity-15 pointer-events-none" />

          {/* Hologram Badge */}
          <div className="flex items-center justify-between border-b border-white/15 pb-2.5 mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xs text-white border border-white/30">
                يد
              </div>
              <div>
                <div className="text-[11px] font-black tracking-wide text-teal-200">يلا درس · سنتر الأوائل</div>
                <div className="text-[9px] text-white/70">بطاقة طالب معتمدة 2026/2027</div>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-300/30 px-2 py-0.5 rounded-full text-[9px] font-bold">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>مُفعّل</span>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="flex items-start gap-3 relative z-10">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-2xl bg-linear-to-tr from-amber-400 to-amber-200 text-teal-950 font-black text-xl flex items-center justify-center shadow-md border-2 border-white/40 shrink-0">
              {studentUser?.name ? studentUser.name.charAt(0) : 'ط'}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-black text-base text-white truncate leading-tight">
                {studentUser?.name || 'محمد أحمد'}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-teal-200 font-medium">
                <School className="w-3 h-3 text-teal-300 shrink-0" />
                <span className="truncate">{profile?.school || 'مدرسة المتفوقين'}</span>
              </div>
              <div className="text-[10px] text-teal-100/80 mt-0.5 font-medium">
                {profile?.grade || 'الصف الأول الثانوي'}
              </div>
              {studentUser?.phone && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-teal-300/80">
                  <Phone className="w-2.5 h-2.5" />
                  <span className="font-mono text-ltr inline-block">{studentUser.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Container */}
          <div className="mt-3.5 bg-white rounded-2xl p-3 text-center shadow-inner relative z-10">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Student Attendance QR"
                className="mx-auto h-36 w-36 object-contain rounded-lg"
              />
            ) : (
              <div className="h-36 w-36 mx-auto flex items-center justify-center text-xs text-slate-400">
                جاري توليد الكود...
              </div>
            )}
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <span className="text-[11px] font-mono font-bold text-teal-900 tracking-wider bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                {linkingCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1 rounded-md text-teal-700 hover:bg-teal-100 transition"
                title="نسخ الكود"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">
              امسح الكود بالكاميرا لتسجيل الحضور الفوري
            </p>
          </div>

          {/* Group tags */}
          {groups.length > 0 && (
            <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-teal-100/90 flex flex-wrap gap-1 relative z-10">
              <span className="text-white/60">المجموعات:</span>
              {groups.map((g) => (
                <span
                  key={g.groupId}
                  className="bg-white/15 px-2 py-0.5 rounded-md text-[9px] font-medium"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-700 transition active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة / حفظ PDF</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>إرسال واتساب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
