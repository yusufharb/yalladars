import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { PracticeQuiz, QuizQuestion } from '../../types';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Sparkles,
  X
} from 'lucide-react';

interface PracticeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: PracticeQuiz | null;
  studentId: string;
  studentName: string;
  onCompleted?: (score: number, total: number) => void;
}

export const PracticeQuizModal: React.FC<PracticeQuizModalProps> = ({
  isOpen,
  onClose,
  quiz,
  studentId,
  studentName,
  onCompleted,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  if (!isOpen || !quiz) return null;

  const currentQuestion: QuizQuestion = quiz.questions[currentIdx];
  const totalQuestions = quiz.questions.length;

  const handleSelectOption = (optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIdx,
    }));
  };

  const handleSubmit = () => {
    let calculatedScore = 0;
    quiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        calculatedScore += 1;
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);

    storage.submitQuiz({
      quizId: quiz.quizId,
      studentId,
      studentName,
      score: calculatedScore,
      totalQuestions: quiz.questions.length,
      answers: selectedAnswers,
    });

    if (onCompleted) {
      onCompleted(calculatedScore, totalQuestions);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentIdx(0);
    setScore(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl text-slate-800 my-8 border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 line-clamp-1">{quiz.title}</h3>
              <p className="text-[10px] text-slate-500">
                السؤال {currentIdx + 1} من {totalQuestions} · {quiz.subject}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question Progress dots */}
        <div className="flex items-center gap-1.5 my-3">
          {quiz.questions.map((q, idx) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCorrect = isSubmitted && selectedAnswers[q.id] === q.correctIndex;
            const isWrong = isSubmitted && isAnswered && selectedAnswers[q.id] !== q.correctIndex;

            let dotColor = 'bg-slate-200';
            if (isSubmitted) {
              dotColor = isCorrect ? 'bg-emerald-500' : isWrong ? 'bg-rose-500' : 'bg-slate-300';
            } else if (idx === currentIdx) {
              dotColor = 'bg-indigo-600 ring-2 ring-indigo-200';
            } else if (isAnswered) {
              dotColor = 'bg-indigo-400';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`h-2 flex-1 rounded-full transition-all ${dotColor}`}
              />
            );
          })}
        </div>

        {/* Results Banner if submitted */}
        {isSubmitted && (
          <div className="mb-4 rounded-2xl bg-linear-to-r from-teal-50 to-indigo-50 p-3 border border-teal-200 text-center">
            <div className="flex items-center justify-center gap-2 text-teal-900 font-black text-sm">
              <Award className="w-5 h-5 text-amber-500" />
              <span>
                درجتك: {score} من {totalQuestions} (
                {Math.round((score / totalQuestions) * 100)}%)
              </span>
            </div>
            <p className="text-[11px] text-teal-700 mt-1">
              {score === totalQuestions
                ? 'ممتاز جداً! إجابات مثالية بدون أي خطأ 🌟'
                : score >= totalQuestions / 2
                ? 'أحسنت! أداء جيد، راجع تصحيح الأسئلة بالأسفل 👏'
                : 'حاول مجدداً لتقوية نقاط ضعفك في هذا الدرس 💪'}
            </p>
          </div>
        )}

        {/* Current Question */}
        <div className="my-2 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
          <p className="text-xs font-black text-slate-900 leading-relaxed">
            {currentQuestion.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2 mt-3">
          {currentQuestion.options.map((option, optIdx) => {
            const isSelected = selectedAnswers[currentQuestion.id] === optIdx;
            const isCorrect = currentQuestion.correctIndex === optIdx;

            let borderStyle = 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40';
            if (isSubmitted) {
              if (isCorrect) {
                borderStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
              } else if (isSelected) {
                borderStyle = 'border-rose-500 bg-rose-50 text-rose-950 font-bold';
              }
            } else if (isSelected) {
              borderStyle = 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold';
            }

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                disabled={isSubmitted}
                className={`w-full text-right p-3 rounded-2xl border text-xs transition flex items-center justify-between ${borderStyle}`}
              >
                <span>{option}</span>
                {isSubmitted && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {isSubmitted && isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation when submitted */}
        {isSubmitted && (
          <div className="mt-3 rounded-2xl bg-amber-50/70 p-3 border border-amber-200/80 text-[11px] text-amber-950 leading-relaxed">
            <span className="font-bold block text-amber-900 mb-0.5">💡 توضيح الحل النموذجي:</span>
            {currentQuestion.explanation}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition"
          >
            السابق
          </button>

          <div className="flex items-center gap-2">
            {isSubmitted ? (
              <button
                type="button"
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة الكويز</span>
              </button>
            ) : currentIdx === totalQuestions - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
              >
                إنهاء وتسليم الإجابات
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
              >
                التالي
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
