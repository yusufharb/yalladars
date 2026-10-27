import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  Zap,
  Brain,
  MessageSquare,
  ChevronDown,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

type ModelChoice = 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.5-flash' | 'gemini-3.1-pro-preview';

interface GeminiChatbotProps {
  initialSubject?: string;
  className?: string;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  initialSubject,
  className = '',
}) => {
  const { currentUser, role } = useAuth();

  const [model, setModel] = useState<ModelChoice>('gemini-3.8-flash');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Welcome message tailored to user role
    const welcome =
      role === 'teacher'
        ? `أهلاً بك يا أستاذ ${currentUser?.name || ''}! 👋\nأنا مساعدك التعليمي الذكي المدعوم بـ Gemini.\nيمكنني مساعدتك في:\n• توليد أسئلة امتحانات وتدريبات متنوعة الصعوبة\n• صياغة ملخصات وشروحات للدروس\n• اقتراح أفكار تفاعلية لإدارة مجموعتك الدراسية`
        : role === 'parent'
        ? `أهلاً بحضرتك يا فندم! 🤝\nأنا مستشارك التربوي في منصة يلا درس.\nيمكنني مساعدتك في فهم التحديات الدراسية لأبنائك، وتنظيم جدول المذاكرة اليومي، وطرق تشجيعهم.`
        : `أهلاً بك يا بطل! 🚀\nأنا رفيقك الذكي للمذاكرة.\nاسألني في أي مسألة صعبة، شرح قانون، أو ملخص لأي درس، وسأشرحه لك خطوة بخطوة بكل سهولة!`;

    return [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: welcome,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.8-flash',
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('هل تريد مسح سجل المحادثة والبدء من جديد؟')) {
      setMessages([
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: 'تم بدء محادثة جديدة! تفضل بطرح سؤالك أو موضوعك وسأساعدك فوراً.',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          modelUsed: model,
        },
      ]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation payload
      const payloadMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: payloadMessages,
          model,
          role,
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const botMessage: ChatMessage = {
          id: `msg_bot_${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          modelUsed: data.model || model,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'تعذر الحصول على إجابة');
      }
    } catch (err: any) {
      let rawError = err?.message || '';
      let userFriendlyNotice = 'تعذر الاتصال بالذكاء الاصطناعي في هذه اللحظة. يرجى المحاولة بعد قليل.';

      if (rawError.includes('503') || rawError.includes('high demand') || rawError.includes('UNAVAILABLE')) {
        userFriendlyNotice = '⚠️ السيرفر يشهد ضغطاً مؤقتاً كبيراً (503). تم التبديل تلقائياً للنموذج البديل الخفيف والمجاني، جرب إرسال الرسالة مرة أخرى الآن.';
      } else if (rawError) {
        // Strip technical JSON if present
        try {
          const match = rawError.match(/\{.*?\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.error?.message) {
              rawError = parsed.error.message;
            }
          }
        } catch (_) {}
        userFriendlyNotice = `تنبيه: ${rawError}`;
      }

      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: userFriendlyNotice,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick suggestions based on role
  const quickPrompts =
    role === 'teacher'
      ? [
          '📝 ضع 3 أسئلة اختيار من متعدد على درس اليوم مع نموذج الإجابة',
          '💡 اقترح فكرة نشاط تحفيزي سريع لطلاب الثانوية',
          '📋 صياغة رسالة تشجيعية لأولياء الأمور بمناسبة تفوق المجموعة',
        ]
      : role === 'parent'
      ? [
          '⏰ كيف أنظم جدول مذاكرة فعال لابني قبل الامتحانات؟',
          '🎯 طرق التعامل مع قلق وتوتر الطالب قبل الامتحانات',
        ]
      : [
          '📐 اشرح لي طريقة حل المسألة بخطوات سهلة ومبسطة',
          '💡 لخص لي أهم القوانين في هذا الدرس في نقاط سريعة',
          '🧠 اعطني سؤالاً تدريبياً لاختبر فهمي الآن',
        ];

  return (
    <div className={`flex flex-col h-full bg-slate-900 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-xl ${className}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-linear-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-slate-950 font-black shadow-sm">
            <Sparkles className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-black text-white">المساعد الذكي (Gemini)</h2>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.2 rounded-full font-bold">
                متعدد الأدوار
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {role === 'teacher' ? 'مساعد المعلم' : role === 'parent' ? 'المستشار التربوي' : 'رفيق المذاكرة للطلاب'}
            </p>
          </div>
        </div>

        {/* Model Selector & Actions */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ModelChoice)}
              className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] font-bold py-1 px-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-400 appearance-none pr-6 cursor-pointer"
            >
              <option value="gemini-3.8-flash">⚡ فلاش الأساسي المستقر (3.8 Flash)</option>
              <option value="gemini-3.1-flash-lite">🚀 سريع وخفيف جداً (Flash Lite)</option>
              <option value="gemini-3.5-flash">🎯 متوازن وشامل (3.5 Flash)</option>
              <option value="gemini-3.1-pro-preview">🧠 برو للمسائل المعقدة (3.1 Pro)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition"
            title="بدء محادثة جديدة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-black shadow-xs ${
                msg.role === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-linear-to-tr from-indigo-600 to-teal-600 text-white'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`relative max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed transition ${
                msg.role === 'user'
                  ? 'bg-teal-700 text-white rounded-tr-none shadow-sm'
                  : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/80 shadow-md'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-white/10 text-[10px] text-slate-300">
                <span className="opacity-80">{msg.timestamp}</span>

                <div className="flex items-center gap-1.5">
                  {msg.modelUsed && (
                    <span className="font-mono text-[9px] opacity-60">
                      {msg.modelUsed.replace('gemini-', '')}
                    </span>
                  )}
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="p-0.5 hover:text-white opacity-60 hover:opacity-100 transition"
                    title="نسخ النص"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-teal-300" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-linear-to-tr from-indigo-600 to-teal-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-slate-700/80 text-xs text-slate-300 flex items-center gap-2 shadow-md">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>جاري التفكير وصياغة الإجابة بواسطة Gemini...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      {messages.length <= 3 && !isLoading && (
        <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              className="text-[11px] whitespace-nowrap bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white px-2.5 py-1 rounded-xl border border-slate-700 transition active:scale-95 shrink-0"
            >
              {qp}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            role === 'teacher'
              ? 'اطلب صياغة سؤال، فكرة درس، أو ملخص تعليمي...'
              : role === 'parent'
              ? 'اطرح سؤالاً عن أساليب المذاكرة أو تشجيع الطالب...'
              : 'اكتب سؤالك، المسألة، أو ما تريد شرحه بالتفصيل...'
          }
          className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 transition"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="h-9 w-9 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-black flex items-center justify-center transition active:scale-95 shrink-0 shadow-md"
          title="إرسال"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
