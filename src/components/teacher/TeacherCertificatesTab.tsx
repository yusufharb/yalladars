import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { GroupMember, StudentCertificate } from '../../types';
import { Award, Plus, Printer, Eye, X, Sparkles } from 'lucide-react';
import { CertificateModal } from '../common/CertificateModal';

interface TeacherCertificatesTabProps {
  groupId: string;
  groupName: string;
  teacherName: string;
  subject: string;
  members: GroupMember[];
}

export const TeacherCertificatesTab: React.FC<TeacherCertificatesTabProps> = ({
  groupId,
  groupName,
  teacherName,
  subject,
  members,
}) => {
  const [certificates, setCertificates] = useState<StudentCertificate[]>(() =>
    storage.getCertificates().filter((c) => c.groupId === groupId)
  );

  const [selectedCert, setSelectedCert] = useState<StudentCertificate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form
  const [studentId, setStudentId] = useState(members[0]?.studentId || '');
  const [certTitle, setCertTitle] = useState('شهادة تقدير وتفوق دراسي');
  const [reason, setReason] = useState('تقديراً للتفوق والالتزام المتميز في مادة الرياضيات لشهر سبتمبر.');
  const [gradeScore, setGradeScore] = useState('١٩ / ٢٠ (ممتاز مع مرتبة الشرف)');

  const refreshList = () => {
    setCertificates(storage.getCertificates().filter((c) => c.groupId === groupId));
  };

  const handleCreateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    const st = members.find((m) => m.studentId === studentId);
    if (!st) return;

    const res = storage.createCertificate({
      studentId: st.studentId,
      studentName: st.studentName,
      groupId,
      groupName,
      teacherName,
      subject,
      title: certTitle,
      reason,
      gradeScore,
    });

    if (res.success) {
      refreshList();
      setShowCreateModal(false);
      setSelectedCert(res.certificate);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs">
        <div>
          <span className="font-bold text-amber-950 block">شهادات التقدير والتحفيز الرسمية</span>
          <span className="text-[10px] text-amber-800">
            أصدر شهادات شكر وتقدير أنيقة قابلة للطباعة لطلاب المجموعة المتفوقين
          </span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إصدار شهادة</span>
        </button>
      </div>

      {/* Certificates Grid */}
      <div className="space-y-2.5">
        {certificates.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-bold">لم يتم إصدار شهادات لهذه المجموعة حتى الآن</p>
            <p className="text-[11px] text-slate-400 mt-0.5">اضغط على زر "إصدار شهادة" لتكريم طالب متميز</p>
          </div>
        ) : (
          certificates.map((cert) => (
            <div
              key={cert.certificateId}
              className="rounded-2xl border border-amber-200 bg-amber-50/20 p-3.5 shadow-2xs hover:border-amber-400 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950">{cert.title}</h4>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    الطالب: <span className="text-teal-800">{cert.studentName}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{cert.reason}</p>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{cert.issueDate}</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCert(cert)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-50 transition shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة وطباعة</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl text-slate-800 my-8 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900">إصدار شهادة تقدير لطالب</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCertificate} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">اختر الطالب المكرم:</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-600 focus:outline-hidden"
                >
                  {members.map((m) => (
                    <option key={m.studentId} value={m.studentId}>
                      {m.studentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">عنوان الشهادة:</label>
                <input
                  type="text"
                  required
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  سبب التكريم والثناء في الشهادة:
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">الدرجة والتقدير:</label>
                <input
                  type="text"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  placeholder="مثال: ١٩.٥ / ٢٠ (ممتاز مع مرتبة الشرف)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 font-bold shadow-md transition"
                >
                  إصدار الشهادة فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      <CertificateModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        certificate={selectedCert}
      />
    </div>
  );
};
