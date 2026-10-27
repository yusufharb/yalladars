import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { useStorageUpdate } from '../../hooks/useStorageUpdate';
import {
  Camera,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  Printer,
  Share2,
  FileText,
  CreditCard,
  Phone,
  Calendar,
  Sparkles,
  QrCode,
  AlertCircle,
  TrendingUp,
  Receipt,
  ShieldCheck,
  Lock,
  BookOpen,
  UserPlus
} from 'lucide-react';
import { AttendanceQRScannerModal } from '../common/AttendanceQRScannerModal';
import { StudentIDCardModal } from '../student/StudentIDCardModal';
import { PaymentReceiptModal } from '../common/PaymentReceiptModal';
import { WhatsAppQuickModal } from '../common/WhatsAppQuickModal';
import { TuitionPayment, Group, PaymentStatus, AttendanceStatus } from '../../types';

interface AssistantDashboardProps {
  activeNavTab?: string;
}

export const AssistantDashboard: React.FC<AssistantDashboardProps> = ({ activeNavTab }) => {
  useStorageUpdate();
  const { currentUser } = useAuth();

  const groups = storage.getGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.groupId || '');
  const [activeTab, setActiveTab] = useState<'attendance' | 'payments' | 'cards'>('attendance');

  // Sync with bottom navigation tab
  React.useEffect(() => {
    if (activeNavTab === 'scanner') {
      setActiveTab('attendance');
      setIsScannerOpen(true);
    } else if (activeNavTab === 'payments') {
      setActiveTab('payments');
    } else if (activeNavTab === 'dashboard') {
      setActiveTab('attendance');
    }
  }, [activeNavTab]);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<string | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<TuitionPayment | null>(null);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('سبتمبر 2026');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Recording Modal
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [payStudentId, setPayStudentId] = useState('');
  const [payAmount, setPayAmount] = useState('250');
  const [payMethod, setPayMethod] = useState<'cash' | 'vodafone_cash' | 'instapay' | 'electronic'>('cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // WhatsApp reminder modal
  const [whatsAppModal, setWhatsAppModal] = useState<{
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

  const selectedGroup = groups.find((g) => g.groupId === selectedGroupId) || groups[0];
  const assistantId = currentUser?.id || 'user_assistant_1';
  const perms = storage.getEffectiveAssistantPermissions(assistantId, selectedGroup?.teacherId);

  const members = selectedGroup ? storage.getMembersByGroup(selectedGroup.groupId) : [];
  const attendanceRecords = selectedGroup
    ? storage.getAttendanceByGroupAndDate(selectedGroup.groupId, selectedDate)
    : [];
  const pendingJoinRequests = selectedGroup
    ? storage.getJoinRequestsByGroup(selectedGroup.groupId)
    : [];
  const groupHomework = selectedGroup
    ? storage.getHomeworkByGroup(selectedGroup.groupId)
    : [];

  const payments = selectedGroup
    ? storage.getTuitionPaymentsByGroup(selectedGroup.groupId).filter((p) => p.month === selectedMonth)
    : [];

  // Summary Metrics
  const presentCount = attendanceRecords.filter((a) => a.status === 'present').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'absent').length;
  const totalPaidAmount = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const unpaidCount = members.length - payments.filter((p) => p.status === 'paid').length;

  const handleToggleAttendance = (studentId: string, studentName: string, currentStatus?: AttendanceStatus) => {
    if (!selectedGroup || !perms.canRecordAttendance) return;
    const nextStatus: AttendanceStatus = currentStatus === 'present' ? 'absent' : 'present';

    storage.recordSingleAttendance({
      groupId: selectedGroup.groupId,
      date: selectedDate,
      studentId,
      studentName,
      status: nextStatus,
      modifiedByName: currentUser?.name || 'السكرتارية',
    });
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !payStudentId || !perms.canManagePayments) return;

    const studentUser = storage.getUserById(payStudentId);
    const studentName = studentUser?.name || 'الطالب';
    const amountNum = parseFloat(payAmount) || 250;

    const existingPayment = payments.find((p) => p.studentId === payStudentId);

    let savedPayment: TuitionPayment;

    if (existingPayment) {
      storage.updatePaymentStatus(
        existingPayment.paymentId,
        'paid',
        amountNum,
        payNotes,
        payMethod,
        payRef,
        currentUser?.name || 'السكرتارية'
      );
      savedPayment = {
        ...existingPayment,
        status: 'paid',
        paidAmount: amountNum,
        paymentMethod: payMethod,
        transactionRef: payRef,
        notes: payNotes,
        paidDate: new Date().toISOString().split('T')[0],
      };
    } else {
      const res = storage.addTuitionPayment({
        groupId: selectedGroup.groupId,
        groupName: selectedGroup.name,
        studentId: payStudentId,
        studentName,
        month: selectedMonth,
        amount: amountNum,
        paidAmount: amountNum,
        status: 'paid',
        paymentMethod: payMethod,
        transactionRef: payRef,
        receivedBy: currentUser?.name || 'السكرتارية',
        paidDate: new Date().toISOString().split('T')[0],
        notes: payNotes,
      });
      savedPayment = res.payment;
    }

    setShowAddPaymentModal(false);
    setReceiptPayment(savedPayment);
  };

  const filteredMembers = members.filter((m) =>
    m.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Assistant Welcome Header */}
      <div className="rounded-3xl bg-linear-to-l from-amber-700 via-amber-800 to-teal-900 p-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-200 font-bold mb-1">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>لوحة مساعد المدرس وسكرتارية السنتر</span>
            </div>
            <h1 className="text-xl font-black">{currentUser?.name || 'أ/ سارة إبراهيم'}</h1>
            <p className="text-xs text-amber-100/90 mt-0.5">
              متابعة الحضور السريع، سداد المصروفات، وإصدار الإيصالات
            </p>
          </div>

          {perms.canRecordAttendance && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-white text-slate-900 hover:bg-amber-50 px-3.5 py-2.5 text-xs font-black transition active:scale-95 shadow-lg"
            >
              <Camera className="w-4 h-4 text-amber-600" />
              <span>مسح الحضور</span>
            </button>
          )}
        </div>

        {/* Active Permissions Badges */}
        <div className="mt-3 pt-2.5 border-t border-white/15 flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="text-amber-200 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            صلاحياتك الحالية:
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-bold ${
              perms.canRecordAttendance ? 'bg-emerald-500/30 text-emerald-100' : 'bg-white/10 text-white/50'
            }`}
          >
            {perms.canRecordAttendance ? '✓ تسجيل الحضور' : '✗ تسجيل الحضور'}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-bold ${
              perms.canSearchStudents ? 'bg-emerald-500/30 text-emerald-100' : 'bg-white/10 text-white/50'
            }`}
          >
            {perms.canSearchStudents ? '✓ البحث والكروت' : '✗ البحث والكروت'}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-bold ${
              perms.canManagePayments ? 'bg-emerald-500/30 text-emerald-100' : 'bg-white/10 text-white/60'
            }`}
          >
            {perms.canManagePayments ? '✓ تحصيل المصروفات' : '🔒 المصروفات (بإذن المدرس)'}
          </span>
          {perms.canManageJoinRequests && (
            <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/30 text-emerald-100">
              ✓ طلبات الانضمام
            </span>
          )}
          {perms.canManageHomework && (
            <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/30 text-emerald-100">
              ✓ متابعة الواجبات
            </span>
          )}
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-center shadow-2xs">
          <span className="text-[10px] text-emerald-800 font-bold block">حضور اليوم</span>
          <span className="text-lg font-black text-emerald-950 mt-0.5 block">{presentCount} طالب</span>
          <span className="text-[10px] text-emerald-700">{absentCount} غياب</span>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-3 text-center shadow-2xs">
          <span className="text-[10px] text-teal-800 font-bold block">إجمالي المحصل</span>
          <span className="text-lg font-black text-teal-950 mt-0.5 block">
            {perms.canManagePayments ? `${totalPaidAmount} ج.م` : 'مقيد 🔒'}
          </span>
          <span className="text-[10px] text-teal-700">{selectedMonth}</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-center shadow-2xs">
          <span className="text-[10px] text-amber-800 font-bold block">متبقي السداد</span>
          <span className="text-lg font-black text-amber-950 mt-0.5 block">
            {perms.canManagePayments ? `${unpaidCount} طلاب` : 'مقيد 🔒'}
          </span>
          <span className="text-[10px] text-amber-700">
            {perms.canManagePayments ? 'لم يسددوا بعد' : 'بإذن المدرس'}
          </span>
        </div>
      </div>

      {/* Group Selector Dropdown */}
      <div className="rounded-2xl bg-white p-3 shadow-xs border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-700" />
          <span className="text-xs font-bold text-slate-700">اختر المجموعة:</span>
        </div>
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-teal-900 focus:outline-hidden focus:border-teal-600 max-w-[200px]"
        >
          {groups.map((g) => (
            <option key={g.groupId} value={g.groupId}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex rounded-2xl bg-slate-200/80 p-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'attendance' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>الحضور والغياب</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'payments' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>المصروفات والتحصيل</span>
        </button>

        <button
          onClick={() => setActiveTab('cards')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'cards' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>كارنيهات الطلاب</span>
        </button>
      </div>

      {/* TAB 1: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث عن اسم طالب..."
                className="w-full rounded-xl bg-white border border-slate-200 pr-9 pl-3 py-2 text-xs focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white px-3 py-2 text-xs font-bold transition active:scale-95 shrink-0"
            >
              <Camera className="w-4 h-4" />
              <span>ماسح الكاميرا</span>
            </button>
          </div>

          {/* Members Attendance List */}
          <div className="rounded-3xl bg-white p-3 shadow-xs border border-slate-200 divide-y divide-slate-100">
            {filteredMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                لا يوجد طلاب يطابقون البحث
              </div>
            ) : (
              filteredMembers.map((m) => {
                const rec = attendanceRecords.find((r) => r.studentId === m.studentId);
                const isPresent = rec?.status === 'present';
                const isAbsent = rec?.status === 'absent';

                return (
                  <div key={m.studentId} className="py-2.5 flex items-center justify-between">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isPresent
                            ? 'bg-emerald-100 text-emerald-800'
                            : isAbsent
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.studentName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {m.studentName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isPresent ? (
                            <span className="text-emerald-700 font-bold">حاضر ✓</span>
                          ) : isAbsent ? (
                            <span className="text-rose-600 font-bold">غائب ✗</span>
                          ) : (
                            <span>لم يُسجل</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleAttendance(m.studentId, m.studentName, rec?.status)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1 ${
                          isPresent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isPresent ? 'حاضر' : 'تسجيل حضور'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedStudentForCard(m.studentId)}
                        className="p-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 transition"
                        title="عرض كارنيه الطالب"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Optional Join Requests Management Card (when permitted by Teacher) */}
      {perms.canManageJoinRequests && pendingJoinRequests.length > 0 && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-purple-900">
            <UserPlus className="w-4 h-4 text-purple-700" />
            <span>طلبات انضمام الطلاب للمجموعة ({pendingJoinRequests.length}):</span>
          </div>
          <div className="space-y-1.5">
            {pendingJoinRequests.map((req) => (
              <div
                key={req.requestId}
                className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-purple-100"
              >
                <div>
                  <div className="font-bold text-slate-900">{req.studentName}</div>
                  <div className="text-[10px] text-slate-500">{req.studentGrade}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => storage.handleJoinRequest(req.requestId, 'accept')}
                    className="px-3 py-1 rounded-lg bg-teal-700 text-white font-bold text-[11px] hover:bg-teal-800"
                  >
                    قبول
                  </button>
                  <button
                    type="button"
                    onClick={() => storage.handleJoinRequest(req.requestId, 'reject')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-bold text-[11px] hover:bg-slate-100"
                  >
                    رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Homework Follow-Up Card (when permitted by Teacher) */}
      {perms.canManageHomework && groupHomework.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-blue-900">
            <BookOpen className="w-4 h-4 text-blue-700" />
            <span>متابعة تسليمات الواجبات ({groupHomework.length}):</span>
          </div>
          <div className="space-y-1.5">
            {groupHomework.map((hw) => {
              const subs = storage.getHomeworkSubmissionsByHomework(hw.homeworkId);
              return (
                <div
                  key={hw.homeworkId}
                  className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-blue-100"
                >
                  <div>
                    <div className="font-bold text-slate-900">{hw.title}</div>
                    <div className="text-[10px] text-slate-500">موعد التسليم: {hw.dueDate}</div>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                    سلّم {subs.length} من {members.length}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENTS & TUITION */}
      {activeTab === 'payments' && (
        <div className="space-y-3">
          {!perms.canManagePayments ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 text-center space-y-2 shadow-2xs">
              <div className="mx-auto h-11 w-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-amber-950">
                صلاحية تحصيل المصروفات غير مفعلة حالياً
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed max-w-xs mx-auto">
                حساب المساعد مخصص افتراضياً لتسجيل الحضور والبحث عن الطلاب. يمكن لأستاذ المادة تفعيل صلاحية «تحصيل المصروفات وإصدار الإيصالات» لك من لوحة تحكم المدرس في أي وقت.
              </p>
            </div>
          ) : (
            <>
              {/* Header & Add Button */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">
                  سداد مصروفات شهر ({selectedMonth})
                </span>

                <button
                  onClick={() => {
                    setPayStudentId(members[0]?.studentId || '');
                    setShowAddPaymentModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold transition active:scale-95 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تسجيل سداد جديد</span>
                </button>
              </div>

              {/* Payments List */}
              <div className="rounded-3xl bg-white p-3 shadow-xs border border-slate-200 divide-y divide-slate-100">
                {members.map((m) => {
                  const payment = payments.find((p) => p.studentId === m.studentId);
                  const isPaid = payment?.status === 'paid';

                  return (
                    <div key={m.studentId} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {m.studentName}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-mono">250 ج.م</span>
                          {payment?.paymentMethod && (
                            <span className="text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded-md">
                              {payment.paymentMethod === 'vodafone_cash'
                                ? 'فودافون كاش'
                                : payment.paymentMethod === 'instapay'
                                ? 'إنستاباي'
                                : 'نقداً'}
                            </span>
                          )}
                          {payment?.transactionRef && (
                            <span className="font-mono text-slate-400">
                              #{payment.transactionRef}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isPaid ? (
                          <>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>مسدد</span>
                            </span>

                            <button
                              onClick={() => setReceiptPayment(payment)}
                              className="p-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 transition"
                              title="طباعة الإيصال"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setPayStudentId(m.studentId);
                                setShowAddPaymentModal(true);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-95"
                            >
                              تحصيل
                            </button>

                            <button
                              onClick={() => {
                                const studentUser = storage.getUserById(m.studentId);
                                setWhatsAppModal({
                                  isOpen: true,
                                  studentName: m.studentName,
                                  phone: studentUser?.phone || '01012345678',
                                  amount: 250,
                                });
                              }}
                              className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                              title="تذكير ولي الأمر بالواتساب"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: STUDENT ID CARDS */}
      {activeTab === 'cards' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800">
              كارنيهات الطلاب المعتمدة ({members.length} طالب)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {members.map((m) => {
              const profile = storage.getStudentProfile(m.studentId);
              return (
                <div
                  key={m.studentId}
                  className="rounded-2xl bg-white p-3 border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="h-7 w-7 rounded-lg bg-teal-800 text-white font-bold text-xs flex items-center justify-center">
                        {m.studentName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {m.studentName}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          {profile?.linkingCode || m.studentId}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudentForCard(m.studentId)}
                    className="mt-2 w-full flex items-center justify-center gap-1 rounded-xl bg-teal-50 hover:bg-teal-100 py-1.5 text-[11px] font-bold text-teal-800 transition active:scale-95"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>عرض الكارنيه</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-slate-800 my-4 border border-slate-100">
            <button
              onClick={() => setShowAddPaymentModal(false)}
              className="absolute left-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              X
            </button>

            <div className="text-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-teal-900">تسجيل سداد مصروفات</h3>
              <p className="text-xs text-slate-500 mt-0.5">شهر {selectedMonth}</p>
            </div>

            <form onSubmit={handleSavePayment} className="mt-3 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اختر الطالب:</label>
                <select
                  value={payStudentId}
                  onChange={(e) => setPayStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-800 focus:outline-hidden focus:border-teal-600"
                >
                  {members.map((m) => (
                    <option key={m.studentId} value={m.studentId}>
                      {m.studentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المبلغ المسدد (ج.م):</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-bold font-mono text-slate-800 focus:outline-hidden focus:border-teal-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">طريقة الدفع:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`p-2 rounded-xl border font-bold text-center transition ${
                      payMethod === 'cash'
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    نقداً (كاش بالسنتر)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('vodafone_cash')}
                    className={`p-2 rounded-xl border font-bold text-center transition ${
                      payMethod === 'vodafone_cash'
                        ? 'border-rose-600 bg-rose-50 text-rose-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    فودافون كاش
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('instapay')}
                    className={`p-2 rounded-xl border font-bold text-center transition ${
                      payMethod === 'instapay'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    إنستاباي (InstaPay)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('electronic')}
                    className={`p-2 rounded-xl border font-bold text-center transition ${
                      payMethod === 'electronic'
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    محفظة إلكترونية
                  </button>
                </div>
              </div>

              {(payMethod === 'vodafone_cash' || payMethod === 'instapay') && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    رقم العملية / التحويل:
                  </label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="مثال: VF-98214 أو رقم هاتف المحفظة"
                    className="w-full rounded-xl border border-slate-300 p-2 font-mono text-slate-800 focus:outline-hidden focus:border-teal-600"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="ملاحظات اختيارية..."
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-800 focus:outline-hidden focus:border-teal-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold transition shadow-xs"
                >
                  حفظ وإصدار إيصال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCANNER MODAL */}
      {selectedGroup && (
        <AttendanceQRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          groupId={selectedGroup.groupId}
          date={selectedDate}
        />
      )}

      {/* STUDENT ID CARD MODAL */}
      {selectedStudentForCard && (
        <StudentIDCardModal
          isOpen={!!selectedStudentForCard}
          onClose={() => setSelectedStudentForCard(null)}
          studentId={selectedStudentForCard}
        />
      )}

      {/* PAYMENT RECEIPT MODAL */}
      <PaymentReceiptModal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
      />

      {/* WHATSAPP REMINDER MODAL */}
      <WhatsAppQuickModal
        isOpen={whatsAppModal.isOpen}
        onClose={() => setWhatsAppModal((prev) => ({ ...prev, isOpen: false }))}
        studentName={whatsAppModal.studentName}
        defaultPhone={whatsAppModal.phone}
        contextType="fee_reminder"
        extraData={{ amount: whatsAppModal.amount, month: selectedMonth }}
      />
    </div>
  );
};
