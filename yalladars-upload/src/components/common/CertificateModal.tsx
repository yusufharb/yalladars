import React from 'react';
import { StudentCertificate } from '../../types';
import { Award, Printer, X, Download, Share2, Sparkles, CheckCircle2 } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: StudentCertificate | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
}) => {
  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-4 shadow-2xl text-slate-800 my-6 border border-amber-200">
        {/* Controls header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
              <Award className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-800">شهادة تقدير وتفوق دراسي</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الشهادة</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div
          id="certificate-print-area"
          className="relative mt-3 rounded-2xl border-4 border-double border-amber-400 bg-linear-to-b from-amber-50/60 via-white to-amber-50/40 p-6 text-center shadow-inner overflow-hidden"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 right-2 text-amber-400/80 text-xl font-serif">✦</div>
          <div className="absolute top-2 left-2 text-amber-400/80 text-xl font-serif">✦</div>
          <div className="absolute bottom-2 right-2 text-amber-400/80 text-xl font-serif">✦</div>
          <div className="absolute bottom-2 left-2 text-amber-400/80 text-xl font-serif">✦</div>

          {/* Republic & Platform Branding Header */}
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2 text-[10px] text-amber-800 font-bold">
            <span>جمهورية مصر العربية</span>
            <span className="text-amber-700 tracking-wider">منصة يلا درس التعليمية</span>
            <span>العام الدراسي ٢٠٢٦</span>
          </div>

          {/* Certificate Badge */}
          <div className="mx-auto my-3 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-tr from-amber-500 to-yellow-300 text-white shadow-lg ring-4 ring-amber-100">
            <Award className="h-8 w-8" />
          </div>

          <h2 className="text-lg font-black text-amber-950 tracking-wide font-serif">
            {certificate.title}
          </h2>
          <p className="text-[11px] text-amber-800/80 font-medium mt-0.5">
            تمنح إدارة سنتر التفوق ومنصة يلا درس هذه الشهادة إلى
          </p>

          {/* Student Name */}
          <div className="my-3 py-1.5 px-4 rounded-xl bg-amber-100/60 border border-amber-300 inline-block max-w-full">
            <h3 className="text-xl font-black text-amber-950 tracking-normal">
              الطالب: {certificate.studentName}
            </h3>
          </div>

          {/* Reason & Subject */}
          <p className="text-xs text-slate-700 leading-relaxed max-w-md mx-auto px-2">
            {certificate.reason}
          </p>

          {certificate.gradeScore && (
            <div className="mt-2 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 py-1 px-3 rounded-lg inline-block">
              التقدير والدرجة: {certificate.gradeScore}
            </div>
          )}

          {/* Group details */}
          <p className="text-[11px] text-slate-500 mt-2">
            المجموعة: <span className="font-semibold text-slate-700">{certificate.groupName}</span>
          </p>

          {/* Footer with Signatures & Seal */}
          <div className="mt-6 pt-3 border-t border-amber-200/80 flex items-end justify-between text-xs text-slate-600">
            <div className="text-right">
              <span className="block text-[10px] text-slate-400">تاريخ الإصدار:</span>
              <span className="font-mono text-[11px] font-bold text-slate-800">
                {certificate.issueDate}
              </span>
            </div>

            {/* Official Stamp Simulation */}
            <div className="h-14 w-14 rounded-full border-2 border-dashed border-amber-600 text-amber-700 flex flex-col items-center justify-center text-[8px] font-bold rotate-12 bg-amber-50/50 shadow-2xs">
              <span>يلا درس</span>
              <span>معتمد</span>
              <span>★ ٢٠٢٦ ★</span>
            </div>

            <div className="text-left">
              <span className="block text-[10px] text-slate-400">أستاذ المادة:</span>
              <span className="font-bold text-amber-950 font-serif text-[11px]">
                {certificate.teacherName}
              </span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-4 flex items-center justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
