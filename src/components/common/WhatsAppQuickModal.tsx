import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { Send, MessageCircle, X, Copy, Check, Sparkles } from 'lucide-react';

interface WhatsAppQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  studentName?: string;
  parentName?: string;
  groupName?: string;
  contextType?: 'attendance_absence' | 'attendance_late' | 'grade_exam' | 'fee_reminder' | 'next_session' | 'praise';
  extraData?: {
    examTitle?: string;
    score?: number;
    maxScore?: number;
    amount?: number;
    month?: string;
    date?: string;
    time?: string;
    location?: string;
  };
}

export const WhatsAppQuickModal: React.FC<WhatsAppQuickModalProps> = ({
  isOpen,
  onClose,
  defaultPhone = '',
  studentName = 'الطالب',
  parentName = 'ولي الأمر',
  groupName = 'حصة الرياضيات',
  contextType = 'attendance_absence',
  extraData = {},
}) => {
  const [phone, setPhone] = useState(defaultPhone);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(contextType);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (defaultPhone) setPhone(defaultPhone);
  }, [defaultPhone]);

  const generateDefaultMessage = (type: string) => {
    switch (type) {
      case 'attendance_absence':
        return `السلام عليكم ورحمة الله وبركاته يا فندم.
نود إحاطة علم سيادتكم بغياب ابنكم (${studentName}) اليوم عن حصة ${groupName} ${
          extraData.location ? `في ${extraData.location}` : ''
        }.
نرجو الاطمئنان عليه ومتابعة تعويض ما فاته في الحصة القادمة إن شاء الله.
مع تحيات أستاذ المادة وإدارة مجموعة يلا درس.`;

      case 'attendance_late':
        return `السلام عليكم يا فندم، نحيطكم علماً بوصول الطالب (${studentName}) متأخراً عن موعد حصة ${groupName} اليوم. حرصاً على مصلحته نرجو التأكيد عليه بالالتزام بموعد البدء. خالص تحياتنا.`;

      case 'grade_exam':
        return `السلام عليكم ورحمة الله وبركاته،
يسعدنا إبلاغكم بنتيجة ابنكم (${studentName}) في ${extraData.examTitle || 'اختبار الشهر'}:
الدرجة: ${extraData.score ?? '--'} من ${extraData.maxScore ?? 20}
مجموعة: ${groupName}
بارك الله في جهوده، ونرجو تشجيعه ومواصلة التفوق دائماً!`;

      case 'fee_reminder':
        return `السلام عليكم يا فندم،
تذكير ودي بخصوص سداد اشتراك شهر ${extraData.month || 'الحالي'} لمجموعة ${groupName} للطالب (${studentName}).
المبلغ المطلوب: ${extraData.amount || 250} ج.م.
يمكن السداد في السنتر مع الحصة القادمة أو فودافون كاش. شاكرين لحسن تعاونكم.`;

      case 'next_session':
        return `السلام عليكم يا فندم،
تذكير بموعد حصة ${groupName} القادمة للطالب (${studentName}):
الموعد: ${extraData.date || 'الحصة القادمة'} الساعة ${extraData.time || '٠٦:٠٠ م'}
المكان: ${extraData.location || 'السنتر'}. برجاء إحضار كشكول الواجب والملزمة.`;

      case 'praise':
        return `السلام عليكم يا فندم،
رسالة شكر وتقدير لمجهود ابنكم المتميز (${studentName}) في مجموعة ${groupName}. الطالب أظهر تفوقاً والتزاماً رائعاً اليوم واستحق تكريم المدرس. فخورين به دائماً! 🌟`;

      default:
        return `السلام عليكم ورحمة الله وبركاته بخصوص متابعة الطالب (${studentName}) في مجموعة ${groupName}...`;
    }
  };

  React.useEffect(() => {
    setCustomMessage(generateDefaultMessage(selectedTemplate));
  }, [selectedTemplate, studentName, groupName, extraData.score, extraData.amount]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!phone) {
      alert('برجاء كتابة رقم الهاتف أولاً');
      return;
    }
    const url = storage.formatWhatsAppUrl(phone, customMessage);
    window.open(url, '_blank');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl text-slate-800 my-8 border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-emerald-800">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">مراسلة واتساب فورية ذكية</h3>
              <p className="text-[11px] text-slate-500">لولي أمر الطالب: {studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Picker */}
        <div className="mt-3">
          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
            اختر قالب الرسالة الجاهز:
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setSelectedTemplate('attendance_absence')}
              className={`p-1.5 rounded-xl border text-center transition text-[11px] font-bold ${
                selectedTemplate === 'attendance_absence'
                  ? 'border-rose-500 bg-rose-50 text-rose-800'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              🚨 إشعار غياب
            </button>

            <button
              type="button"
              onClick={() => setSelectedTemplate('grade_exam')}
              className={`p-1.5 rounded-xl border text-center transition text-[11px] font-bold ${
                selectedTemplate === 'grade_exam'
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              📊 نتيجة امتحان
            </button>

            <button
              type="button"
              onClick={() => setSelectedTemplate('fee_reminder')}
              className={`p-1.5 rounded-xl border text-center transition text-[11px] font-bold ${
                selectedTemplate === 'fee_reminder'
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              💳 تذكير اشتراك
            </button>

            <button
              type="button"
              onClick={() => setSelectedTemplate('next_session')}
              className={`p-1.5 rounded-xl border text-center transition text-[11px] font-bold ${
                selectedTemplate === 'next_session'
                  ? 'border-teal-500 bg-teal-50 text-teal-800'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              ⏰ تذكير حصة
            </button>

            <button
              type="button"
              onClick={() => setSelectedTemplate('praise')}
              className={`p-1.5 rounded-xl border text-center transition text-[11px] font-bold ${
                selectedTemplate === 'praise'
                  ? 'border-purple-500 bg-purple-50 text-purple-800'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              🌟 ثناء وتفوق
            </button>

            <button
              type="button"
              onClick={() => setSelectedTemplate('attendance_late')}
              className={`p-1.5 rounded-xl border text-center transition text-[11px] font-bold ${
                selectedTemplate === 'attendance_late'
                  ? 'border-orange-500 bg-orange-50 text-orange-800'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              ⚠️ تأخير بالحصة
            </button>
          </div>
        </div>

        {/* Phone Input */}
        <div className="mt-3">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            رقم واتساب ولي الأمر (مصر):
          </label>
          <input
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010XXXXXXXX"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Message Preview & Edit */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-600">
              نص الرسالة (يمكنك تعديلها):
            </label>
            <button
              onClick={handleCopy}
              className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>نسخ النص</span>
                </>
              )}
            </button>
          </div>
          <textarea
            rows={4}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSend}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold shadow-md transition active:scale-98"
          >
            <Send className="w-3.5 h-3.5" />
            <span>فتح المحادثة في واتساب</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
