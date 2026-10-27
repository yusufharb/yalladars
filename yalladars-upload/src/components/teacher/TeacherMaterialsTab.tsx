import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { GroupMaterial, MaterialType } from '../../types';
import { FileText, Video, ExternalLink, Plus, Trash2, Download, BookOpen, X, Sparkles } from 'lucide-react';

interface TeacherMaterialsTabProps {
  groupId: string;
  groupName: string;
  teacherId: string;
}

export const TeacherMaterialsTab: React.FC<TeacherMaterialsTabProps> = ({
  groupId,
  groupName,
  teacherId,
}) => {
  const [materials, setMaterials] = useState<GroupMaterial[]>(() =>
    storage.getMaterialsByGroup(groupId)
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [unit, setUnit] = useState('الوحدة الأولى: الجبر والعلاقات');
  const [type, setType] = useState<MaterialType>('pdf');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [fileSize, setFileSize] = useState('3.5 ميجابايت');

  const refreshList = () => {
    setMaterials(storage.getMaterialsByGroup(groupId));
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    storage.addMaterial({
      groupId,
      groupName,
      teacherId,
      title: title.trim(),
      unit,
      type,
      url: url.trim() || 'https://example.com/material.pdf',
      description: description.trim(),
      fileSize: type === 'video' ? 'فيديو يوتيوب' : fileSize,
    });

    refreshList();
    setShowAddModal(false);
    setTitle('');
    setUrl('');
    setDescription('');
  };

  const handleDelete = (materialId: string) => {
    if (window.confirm('هل تريد حذف هذه المذكرة من المجموعة؟')) {
      storage.deleteMaterial(materialId);
      refreshList();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action banner */}
      <div className="flex items-center justify-between bg-teal-50 border border-teal-200 p-3 rounded-2xl text-xs">
        <div>
          <span className="font-bold text-teal-950 block">بنك المذكرات والملخصات الرقمية</span>
          <span className="text-[10px] text-teal-700">متاحة لجميع طلاب المجموعة وأولياء أمورهم للتحميل الفوري</span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة مذكرة</span>
        </button>
      </div>

      {/* Materials List */}
      <div className="space-y-2.5">
        {materials.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-bold">لا توجد مذكرات أو ملفات مضافة بعد</p>
            <p className="text-[11px] text-slate-400 mt-0.5">اضغط على زر "إضافة مذكرة" لرفع أول ملزمة للطلاب</p>
          </div>
        ) : (
          materials.map((mat) => (
            <div
              key={mat.materialId}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-teal-300 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      mat.type === 'video'
                        ? 'bg-rose-50 text-rose-600'
                        : mat.type === 'summary'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-teal-50 text-teal-700'
                    }`}
                  >
                    {mat.type === 'video' ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-block mb-1">
                      {mat.unit}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{mat.title}</h4>
                    {mat.description && (
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{mat.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span>{mat.fileSize || 'ملف رقمي'}</span>
                      <span>·</span>
                      <span>{mat.createdAt.split('T')[0]}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={mat.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-300 transition"
                    title="فتح أو تحميل"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(mat.materialId)}
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl text-slate-800 my-8 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900">إضافة مذكرة أو رابط شرح جديد</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  عنوان الملزمة / الفيديو:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مذكرة مراجعة ليلة الامتحان في الجبر"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع المادة:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MaterialType)}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs focus:border-teal-600 focus:outline-hidden"
                  >
                    <option value="pdf">ملف PDF (ملزمة)</option>
                    <option value="video">فيديو يوتيوب (شرح)</option>
                    <option value="summary">ملخص وقوانين</option>
                    <option value="link">رابط خارجي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">الوحدة الدراسية:</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs focus:border-teal-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  رابط الملف / التحميل (Google Drive أو YouTube أو موقع):
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/... أو رابط يوتيوب"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-teal-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  وصف مختصر للمحتوى وأهم الأفكار:
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: يرجى حل مسائل صفحة ٤ و ٥ قبل الحصة القادمة..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-teal-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 font-bold shadow-md transition"
                >
                  حفظ ونشر المذكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
