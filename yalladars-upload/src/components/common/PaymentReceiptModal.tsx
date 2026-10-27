import React from 'react';
import { X, Printer, Share2, CheckCircle2, ShieldCheck, DollarSign, Calendar, User, FileText } from 'lucide-react';
import { TuitionPayment } from '../../types';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: TuitionPayment | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  if (!isOpen || !payment) return null;

  const receiptNumber = `REC-${payment.paymentId.replace(/[^0-9]/g, '').slice(-6) || '202609'}`;
  const paidDate = payment.paidDate || new Date().toISOString().split('T')[0];

  const methodLabelMap: Record<string, string> = {
    cash: 'نقداً بالسنتر (كاش)',
    vodafone_cash: 'فودافون كاش (Vodafone Cash)',
    instapay: 'إنستاباي (InstaPay)',
    electronic: 'دفع إلكتروني / محفظة',
  };

  const paymentMethodLabel = payment.paymentMethod
    ? methodLabelMap[payment.paymentMethod] || payment.paymentMethod
    : 'نقداً بالسنتر';

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🧾 إيصال سداد مصروفات درس - يلا درس\n` +
      `رقم الإيصال: ${receiptNumber}\n` +
      `الطالب: ${payment.studentName}\n` +
      `المجموعة: ${payment.groupName}\n` +
      `الشهر: ${payment.month}\n` +
      `المبلغ المسدد: ${payment.paidAmount || payment.amount} ج.م\n` +
      `طريقة الدفع: ${paymentMethodLabel}\n` +
      (payment.transactionRef ? `رقم العملية: ${payment.transactionRef}\n` : '') +
      `تاريخ السداد: ${paidDate}\n` +
      `المستلم: ${payment.receivedBy || 'سكرتارية السنتر'}\n\n` +
      `شكراً لكم مع تمنياتنا بالتوفيق والنجاح 🌟`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-slate-800 my-4 border border-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition print:hidden"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Receipt Card */}
        <div className="rounded-2xl border-2 border-dashed border-teal-600/40 p-5 bg-linear-to-b from-teal-50/50 to-white relative">
          {/* Header */}
          <div className="text-center border-b border-teal-100 pb-3 mb-3">
            <div className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-white font-black text-xs shadow-xs">
              يد
            </div>
            <h3 className="font-black text-base text-teal-950">إيصال سداد مصروفات</h3>
            <p className="text-[11px] text-teal-700 font-bold">منصة يلا درس التعليمية · سنتر الأوائل</p>
            <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
              <span>{receiptNumber}</span>
              <span>·</span>
              <span>{paidDate}</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">اسم الطالب:</span>
              <span className="font-black text-slate-900">{payment.studentName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">المجموعة الدراسية:</span>
              <span className="font-bold text-teal-900 truncate max-w-[180px]">{payment.groupName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">شهر الاشتراك:</span>
              <span className="font-bold text-slate-900">{payment.month}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">طريقة الدفع:</span>
              <span className="font-bold text-emerald-800">{paymentMethodLabel}</span>
            </div>

            {payment.transactionRef && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">رقم التحويل / العملية:</span>
                <span className="font-mono font-bold text-slate-800">{payment.transactionRef}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">المستلم:</span>
              <span className="font-medium text-slate-700">{payment.receivedBy || 'سكرتارية السنتر'}</span>
            </div>

            {/* Total Paid Badge */}
            <div className="mt-3 rounded-xl bg-teal-800 text-white p-3 text-center flex items-center justify-between">
              <span className="text-xs font-bold text-teal-100">المبلغ المسدد:</span>
              <span className="text-xl font-black text-amber-300">
                {payment.paidAmount || payment.amount} ج.م
              </span>
            </div>
          </div>

          {/* Stamp / Seal */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>معتمد إلكترونياً</span>
            </div>
            <span className="font-mono">يلا درس مصر 🇪🇬</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-700 transition active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة الإيصال</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة بالواتساب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
