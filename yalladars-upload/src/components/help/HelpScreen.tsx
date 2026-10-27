import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { HelpCircle, Send, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export const HelpScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [repTitle, setRepTitle] = useState('');
  const [repDesc, setRepDesc] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const faqs = [
    {
      q: 'هل تطبيق "يلا درس" مجاني بالكامل؟',
      a: 'نعم، مجاني ١٠٠٪ وبدون أي رسوم أو بطاقات دفع بنكية أو اشتراكات، صُمم خصيصاً لخدمة المعلمين والطلاب في مصر بدون أي تكلفة إطلاقاً.',
    },
    {
      q: 'كيف ينضم الطالب إلى مجموعة المدرس؟',
      a: 'يقوم المدرس بإنشاء المجموعة والحصول على "كود الانضمام" (Join Code)، ثم يكتب الطالب الكود في خانة "انضم لمجموعة" لينضم فوراً للمجموعة دون أي خطوات معقدة.',
    },
    {
      q: 'كيف يربط ولي الأمر حساب ابنه؟',
      a: 'يظهر لكل طالب "كود ولي الأمر" (Student Linking Code) في حسابه (أو يعطيه له المدرس). يفتح ولي الأمر خانة "ربط ابن" ويدخل الكود ليتم ربط بيانات الحضور والدرجات فوراً.',
    },
    {
      q: 'هل يعمل التطبيق عند ضعف أو انقطاع الإنترنت؟',
      a: 'نعم، التطبيق مجهز بـ Offline-Cache يمكنك من تسجيل الحضور والمتابعة حتى في حالة انقطاع الاتصال، ويتم حفظ السجلات ومزامنتها فور عودة الاتصال.',
    },
    {
      q: 'هل يستطيع الطالب رؤية درجات زملائه؟',
      a: 'ممنوع تماماً. يطبق التطبيق نظام حماية الصلاحيات (RBAC)، فالطالب يرى درجاته وحضوره فقط، وكذلك ولي الأمر لا يرى إلا أبناءه المرتبطين بحسابه.',
    },
  ];

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repTitle.trim() || !repDesc.trim()) return;

    storage.addReport({
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'مستخدم',
      userRole: currentUser?.role || 'student',
      title: repTitle,
      description: repDesc,
    });

    setSentSuccess(true);
    setRepTitle('');
    setRepDesc('');
    setTimeout(() => setSentSuccess(false), 4000);
  };

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-base font-bold text-slate-900">المساعدة والدعم</h1>
        <p className="text-xs text-slate-500">الأسئلة الشائعة والإبلاغ عن مشكلة</p>
      </div>

      {/* Info Card */}
      <div className="rounded-2xl bg-teal-50 border border-teal-200 p-3.5 text-xs text-teal-900 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">يلا درس — YallaDars v1.0 MVP</p>
          <p className="text-[11px] text-teal-700 mt-0.5 leading-relaxed">
            تطبيق تعليمي مصري لإدارة الدروس الخصوصية بدون أي إعلانات تجارية مزعجة أو متطلبات دفع.
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
        <h3 className="font-bold text-xs text-slate-900 mb-2">الأسئلة الشائعة</h3>
        <div className="space-y-1.5">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="rounded-xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-3 text-right text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 text-xs text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-100 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Report a Problem */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <h3 className="font-bold text-xs text-slate-900">الإبلاغ عن مشكلة أو اقتراح ميزة</h3>

        {sentSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-teal-50 p-2 text-xs text-teal-800 border border-teal-200">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>تم استلام رسالتك بنجاح، شكراً لمساعدتنا في تحسين يلا درس!</span>
          </div>
        )}

        <form onSubmit={handleSubmitReport} className="space-y-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">عنوان المشكلة أو الاقتراح *</label>
            <input
              type="text"
              required
              placeholder="مثال: صعوبة في قراءة كود الحصة أو اقتراح..."
              value={repTitle}
              onChange={(e) => setRepTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل البلاغ *</label>
            <textarea
              rows={3}
              required
              placeholder="اشرح المشكلة أو الفكرة باختصار..."
              value={repDesc}
              onChange={(e) => setRepDesc(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>إرسال البلاغ</span>
          </button>
        </form>
      </div>
    </div>
  );
};
