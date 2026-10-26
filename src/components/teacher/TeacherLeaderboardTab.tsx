import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { GroupMember, StudentBadge, BadgeType } from '../../types';
import { Trophy, Award, Star, Flame, Sparkles, CheckCircle2, Plus, X } from 'lucide-react';

interface TeacherLeaderboardTabProps {
  groupId: string;
  groupName: string;
  teacherId: string;
  members: GroupMember[];
}

export const TeacherLeaderboardTab: React.FC<TeacherLeaderboardTabProps> = ({
  groupId,
  groupName,
  teacherId,
  members,
}) => {
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(members[0]?.studentId || '');
  const [badgeType, setBadgeType] = useState<BadgeType>('star');
  const [badgeTitle, setBadgeTitle] = useState('نجم الأسبوع');
  const [badgeDesc, setBadgeDesc] = useState('للتفوق في اختبار المادة');

  const attendanceSummaries = storage.getGroupAttendanceSummaries(groupId);
  const grades = storage.getGradesByGroup(groupId);
  const badges = storage.getBadgesByGroup(groupId);

  // Compute student scores & rankings
  const rankedStudents = members.map((m) => {
    const studentGrades = grades.filter((g) => g.studentId === m.studentId);
    const totalScore = studentGrades.reduce((sum, g) => sum + g.score, 0);
    const totalMax = studentGrades.reduce((sum, g) => sum + g.maxScore, 0);
    const gradeRate = totalMax > 0 ? (totalScore / totalMax) * 100 : 80;

    const att = attendanceSummaries.find((a) => a.studentId === m.studentId);
    const attRate = att ? att.attendanceRate : 100;

    // Overall weighted score: 60% exam score + 40% attendance
    const combinedScore = Math.round(gradeRate * 0.6 + attRate * 0.4);

    const studentBadges = badges.filter((b) => b.studentId === m.studentId);

    return {
      studentId: m.studentId,
      studentName: m.studentName,
      gradeRate: Math.round(gradeRate),
      attRate: Math.round(attRate),
      combinedScore,
      badges: studentBadges,
    };
  });

  // Sort descending by combined score
  rankedStudents.sort((a, b) => b.combinedScore - a.combinedScore);

  const handleAwardBadge = (e: React.FormEvent) => {
    e.preventDefault();
    const student = members.find((m) => m.studentId === selectedStudentId);
    if (!student) return;

    let icon = '⭐';
    if (badgeType === 'punctual') icon = '⏰';
    if (badgeType === 'genius') icon = '🧠';
    if (badgeType === 'homework_hero') icon = '✍️';
    if (badgeType === 'most_improved') icon = '🚀';

    storage.awardBadge({
      studentId: student.studentId,
      studentName: student.studentName,
      groupId,
      groupName,
      teacherId,
      badgeType,
      title: badgeTitle,
      icon,
      description: badgeDesc,
    });

    setShowAwardModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-2xl bg-linear-to-r from-amber-500 to-yellow-400 p-4 text-white shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-100" />
            <h3 className="font-black text-sm text-amber-950">لوحة الشرف والمتصدرين</h3>
          </div>
          <p className="text-[11px] text-amber-900 mt-1">
            ترتيب تنافسي تلقائي يعتمد على درجات الاختبارات (٦٠٪) ونسبة الحضور والالتزام (٤٠٪)
          </p>
        </div>
        <button
          onClick={() => setShowAwardModal(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-amber-900 font-bold text-xs shadow-xs hover:bg-amber-50 transition active:scale-95"
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>منح وسام</span>
        </button>
      </div>

      {/* Podium for Top 3 */}
      {rankedStudents.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 text-center pt-4 pb-2 items-end">
          {/* Second Place */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-2.5 flex flex-col items-center">
            <span className="text-xl">🥈</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">المركز الثاني</span>
            <span className="text-xs font-bold text-slate-900 truncate w-full mt-1">
              {rankedStudents[1].studentName}
            </span>
            <span className="text-[11px] font-mono font-black text-slate-700 mt-0.5">
              {rankedStudents[1].combinedScore} نقطة
            </span>
          </div>

          {/* First Place */}
          <div className="bg-linear-to-b from-amber-100 to-amber-50 border-2 border-amber-300 rounded-2xl p-3 flex flex-col items-center shadow-xs -mt-2">
            <span className="text-2xl animate-bounce">🥇</span>
            <span className="text-[10px] font-black text-amber-800 mt-0.5">المركز الأول</span>
            <span className="text-xs font-black text-amber-950 truncate w-full mt-1">
              {rankedStudents[0].studentName}
            </span>
            <span className="text-xs font-mono font-black text-amber-900 mt-0.5">
              {rankedStudents[0].combinedScore} نقطة
            </span>
          </div>

          {/* Third Place */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-2.5 flex flex-col items-center">
            <span className="text-xl">🥉</span>
            <span className="text-[10px] font-bold text-amber-700 mt-0.5">المركز الثالث</span>
            <span className="text-xs font-bold text-slate-900 truncate w-full mt-1">
              {rankedStudents[2].studentName}
            </span>
            <span className="text-[11px] font-mono font-black text-slate-700 mt-0.5">
              {rankedStudents[2].combinedScore} نقطة
            </span>
          </div>
        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="space-y-2">
        {rankedStudents.map((st, idx) => (
          <div
            key={st.studentId}
            className={`rounded-2xl border p-3 flex items-center justify-between text-xs transition ${
              idx === 0
                ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                : idx < 3
                ? 'border-slate-300 bg-white'
                : 'border-slate-200 bg-white/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-7 w-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                  idx === 0
                    ? 'bg-amber-500 text-white shadow-xs'
                    : idx === 1
                    ? 'bg-slate-400 text-white'
                    : idx === 2
                    ? 'bg-amber-700 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {idx + 1}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{st.studentName}</span>
                  {idx === 0 && <span className="text-[10px] text-amber-600 font-bold">👑 المتصدر</span>}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span>الدرجات: {st.gradeRate}%</span>
                  <span>·</span>
                  <span>الحضور: {st.attRate}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Badges icons */}
              {st.badges.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {st.badges.slice(0, 3).map((b) => (
                    <span key={b.badgeId} title={b.title} className="text-sm">
                      {b.icon}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-right">
                <span className="font-mono text-sm font-black text-teal-800 block">
                  {st.combinedScore}
                </span>
                <span className="text-[9px] text-slate-400 block">نقطة تميز</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Award Badge Modal */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl text-slate-800 my-8 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900">منح وسام تميز جديد لطالب</h3>
              <button
                onClick={() => setShowAwardModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAwardBadge} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">اختر الطالب:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-hidden"
                >
                  {members.map((m) => (
                    <option key={m.studentId} value={m.studentId}>
                      {m.studentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع الوسام:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'star', label: '⭐ نجم الأسبوع', defaultTitle: 'نجم الأسبوع' },
                    { id: 'punctual', label: '⏰ منضبط المواعيد', defaultTitle: 'منضبط المواعيد' },
                    { id: 'genius', label: '🧠 عبقري الرياضيات', defaultTitle: 'عبقري الرياضيات' },
                    { id: 'homework_hero', label: '✍️ بطل الواجبات', defaultTitle: 'بطل الواجبات' },
                    { id: 'most_improved', label: '🚀 التطور السريع', defaultTitle: 'التطور السريع' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setBadgeType(item.id as BadgeType);
                        setBadgeTitle(item.defaultTitle);
                      }}
                      className={`p-2 rounded-xl border text-right font-bold text-xs transition ${
                        badgeType === item.id
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  سبب التكريم والثناء:
                </label>
                <input
                  type="text"
                  required
                  value={badgeDesc}
                  onChange={(e) => setBadgeDesc(e.target.value)}
                  placeholder="مثال: لحصوله على الدرجة النهائية في اختبار الجبر"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAwardModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 font-bold shadow-md transition"
                >
                  تأكيد ومنح الوسام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
