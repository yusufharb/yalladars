import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode as QrIcon, MessageCircle, Share2, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  code: string;
  subtitle?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  title,
  code,
  subtitle,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const getJoinUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/?join=${code}`;
    }
    return `https://yalladars.app/?join=${code}`;
  };

  useEffect(() => {
    if (isOpen && code) {
      QRCode.toDataURL(getJoinUrl(), {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f766e',
          light: '#ffffff',
        },
      })
        .then((url) => setDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [isOpen, code]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = getJoinUrl();
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getWhatsAppInvitationText = () => {
    const joinUrl = getJoinUrl();
    return `السلام عليكم ورحمة الله وبركاته،
ندعوكم للانضمام إلى مجموعتنا الدراسية (${title}) على تطبيق «يلا درس» 📚

📱 رابط الدخول المباشر للتطبيق:
${joinUrl}

🔑 كود الانضمام للمجموعة:
${code}

📌 طريقة الانضمام السريعة:
1. اضغط على الرابط أعلاه من الهاتف.
2. قم بتسجيل الدخول كطالب (أو اختر تجربة طالب).
3. اضغط «انضمام للمجموعة» وستظهر لك مواعيد الحصص والواجبات والدرجات والكارنيه الذكي فوراً!`;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getWhatsAppInvitationText());
    const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `انضمام لمجموعة ${title} - يلا درس`,
          text: getWhatsAppInvitationText(),
          url: getJoinUrl(),
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-center max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <QrIcon className="h-6 w-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}

        <div className="mt-3 flex flex-col items-center justify-center">
          {/* QR Box */}
          <div className="rounded-2xl border border-teal-100 bg-white p-2.5 shadow-xs">
            {dataUrl ? (
              <img src={dataUrl} alt="QR Code" className="h-40 w-40 rounded-xl" />
            ) : (
              <div className="h-40 w-40 flex items-center justify-center text-xs text-slate-400">
                جاري توليد الرمز...
              </div>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-teal-700 font-medium">
            امسح الكاميرا للانتقال للرابط مباشرة
          </p>

          {/* Join Code Banner */}
          <div className="mt-3 w-full rounded-2xl bg-teal-50 p-2.5 border border-teal-100 text-right">
            <span className="block text-[11px] font-bold text-teal-900 mb-1">
              كود الانضمام للمجموعة:
            </span>
            <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-teal-200">
              <span className="font-mono text-lg font-black tracking-wider text-teal-800 dir-ltr">
                {code}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 rounded-lg bg-teal-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-teal-800 transition active:scale-95"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
              </button>
            </div>
          </div>

          {/* Direct Link Share & WhatsApp Buttons */}
          <div className="mt-3 w-full space-y-2">
            <button
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>إرسال دعوة للطالب أو ولي الأمر عبر واتساب</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span className="truncate">{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط التطبيق'}</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>مشاركة الرابط</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3.5 rounded-xl bg-amber-50 p-2 text-right border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed">
          💡 <strong>للتجربة السريعة:</strong> افتح الرابط في نافذة تصفح خاصة (Incognito) أو على هاتف آخر، واختر حساب الطالب لتجربة تجربة الحضور والواجبات والتنبيهات المباشرة!
        </div>
      </div>
    </div>
  );
};
