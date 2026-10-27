import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { TuitionPayment, PaymentStatus, GroupMember } from '../../types';
import { DollarSign, CheckCircle2, Clock, XCircle, AlertCircle, Plus, Send, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { WhatsAppQuickModal } from '../common/WhatsAppQuickModal';

interface TeacherPaymentsTabProps {
  groupId: string;
  groupName: string;
  members: GroupMember[];
}

export const TeacherPaymentsTab: React.FC<TeacherPaymentsTabProps> = ({
  groupId,
  groupName,
  members,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('سبتمبر 2026');
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    isOpen: boolean;
    studentName: string;
    phone: string;
    amount: number;
  }>({
    isOpen: false,
    studentName: '',
    phone: '',
    amount: 250,
  });

  const payments = storage.getTuitionPaymentsByGroup(groupId);
  const currentMonthPayments = payments.filter((p) => p.month === selectedMonth);

  // Calculate statistics
  const totalStudents = members.length;
  const paidCount = currentMonthPayments.filter((p) => p.status === 'paid').length;
  const unpaidCount = totalStudents - paidCount;
  const standardFee = 250;
  const totalCollected = currentMonthPayments.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const totalExpected = totalStudents * standardFee;

  const handleTogglePayment = (studentId: string, studentName: string) => {
    const existing = currentMonthPayments.find((p) => p.studentId === studentId);
    if (existing) {
      const nextStatus: PaymentStatus =
        existing.status === 'paid' ? 'unpaid' : 'paid';
      const paidAmt = nextStatus === 'paid' ? existing.amount : 0;
      storage.updatePaymentStatus(existing.paymentId, nextStatus, paidAmt);
    } else {
      // Add new record
      storage.addTuitionPayment({
        groupId,
        groupName,
        studentId,
        studentName,
        month: selectedMonth,
        amount: standardFee,
        paidAmount: standardFee,
        status: 'paid',
        paidDate: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleOpenWhatsApp = (studentId: string, studentName: string) => {
    // Find parent or student phone
    const studentUser = storage.getUserById(studentId);
    const parentLinks = storage.getParentStudents().filter((ps) => ps.studentId === studentId);
    const parentUser = parentLinks[0] ? storage.getUserById(parentLinks[0].parentId) : null;
    const phone = parentUser?.phone || studentUser?.phone || '01012345678';

    setWhatsAppModalData({
      isOpen: true,
      studentName,
      phone,
      amount: standardFee,
    });
  };

  return (
    <div className="space-y-4">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-3 text-center">
          <span className="text-[10px] text-teal-800 font-bold block">المحصل فعلياً</span>
          <span className="text-base font-black text-teal-950 mt-0.5 block">{totalCollected} ج.م</span>
          <span className="text-[10px] text-teal-700">{paidCount} طلاب سددوا</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-center">
          <span className="text-[10px] text-amber-800 font-bold block">المتوقع تحصيله</span>
          <span className="text-base font-black text-amber-950 mt-0.5 block">{totalExpected} ج.م</span>
          <span className="text-[10px] text-amber-700">{unpaidCount} متبقي</span>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3 text-center">
          <span className="text-[10px] text-blue-800 font-bold block">نسبة التحصيل</span>
          <span className="text-base font-black text-blue-950 mt-0.5 block">
            {totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 100}%
          </span>
          <span className="text-[10px] text-blue-700">شهر {selectedMonth.split(' ')[0]}</span>
        </div>
      </div>

      {/* Month Picker Header */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">شهر الاشتراك:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-800 focus:outline-hidden"
          >
            <option value="سبتمبر 2026">سبتمبر 2026</option>
            <option value="أكتوبر 2026">أكتوبر 2026</option>
            <option value="نوفمبر 2026">نوفمبر 2026</option>
          </select>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">قيمة الاشتراك: ٢٥٠ ج.م شهرياً</span>
      </div>

      {/* Students Payments List */}
      <div className="space-y-2">
        {members.map((member) => {
          const record = currentMonthPayments.find((p) => p.studentId === member.studentId);
          const isPaid = record?.status === 'paid';
          const isPartial = record?.status === 'partial';

          return (
            <div
              key={member.studentId}
              className={`rounded-2xl border p-3 flex items-center justify-between text-xs transition ${
                isPaid
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : isPartial
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleTogglePayment(member.studentId, member.studentName)}
                  className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold transition active:scale-95 ${
                    isPaid
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isPartial
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'border-2 border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-600'
                  }`}
                  title={isPaid ? 'تم الدفع (اضغط لتغيير الحالة)' : 'اضغط للتحديد كمدفوع'}
                >
                  {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </button>
                <div>
                  <div className="font-bold text-slate-900">{member.studentName}</div>
                  <div className="text-[10px] text-slate-500">
                    {isPaid ? (
                      <span className="text-emerald-700 font-semibold">
                        مسدد بالكامل ({record?.paidAmount || standardFee} ج.م) · {record?.paidDate}
                      </span>
                    ) : isPartial ? (
                      <span className="text-amber-700 font-semibold">
                        مسدد جزئياً ({record?.paidAmount} ج.م) · متبقي {standardFee - (record?.paidAmount || 0)} ج.م
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold">مستحق السداد (٢٥٠ ج.م)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!isPaid && (
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(member.studentId, member.studentName)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold transition text-[11px]"
                    title="إرسال تذكير عبر واتساب لولي الأمر"
                  >
                    <Send className="w-3 h-3" />
                    <span>تذكير واتساب</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTogglePayment(member.studentId, member.studentName)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-teal-700 text-white hover:bg-teal-800 shadow-xs'
                  }`}
                >
                  {isPaid ? 'تعديل السداد' : 'تسجيل الدفع'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppQuickModal
        isOpen={whatsAppModalData.isOpen}
        onClose={() => setWhatsAppModalData((prev) => ({ ...prev, isOpen: false }))}
        defaultPhone={whatsAppModalData.phone}
        studentName={whatsAppModalData.studentName}
        groupName={groupName}
        contextType="fee_reminder"
        extraData={{
          amount: whatsAppModalData.amount,
          month: selectedMonth,
        }}
      />
    </div>
  );
};
