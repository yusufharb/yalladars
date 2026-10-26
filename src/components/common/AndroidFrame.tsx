import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { UserRole } from '../../types';
import {
  Wifi,
  Battery,
  Signal,
  Home,
  Users,
  Calendar,
  BookOpen,
  Bell,
  MoreHorizontal,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Code,
  LogOut,
  UserCheck,
  ChevronDown,
  Layers,
  QrCode,
  DollarSign
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAuthModal: () => void;
  onOpenHelp: () => void;
  onOpenAndroidCode: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  onTabChange,
  onOpenAuthModal,
  onOpenHelp,
  onOpenAndroidCode,
}) => {
  const { currentUser, role, isTeacher, isAssistant, isStudent, isParent, isAdmin, logout, switchRoleQuick, switchUser } =
    useAuth();
  const [timeStr, setTimeStr] = useState('06:30');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const handleSwitchToSpecificUser = (userId: string, targetTab = 'dashboard') => {
    const user = storage.getUserById(userId);
    if (user) {
      switchUser(user);
      setShowRoleDropdown(false);
      onTabChange(targetTab);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Bottom navigation items depending on current role (Requirement #23)
  const navItems = isTeacher
    ? [
        { id: 'dashboard', label: 'الرئيسية', icon: Home },
        { id: 'groups', label: 'المجموعات', icon: Users },
        { id: 'schedule', label: 'الجدول', icon: Calendar },
        { id: 'more', label: 'المزيد', icon: MoreHorizontal },
      ]
    : isAssistant
    ? [
        { id: 'dashboard', label: 'الرئيسية', icon: Home },
        { id: 'scanner', label: 'مسح الحضور', icon: QrCode },
        { id: 'payments', label: 'الاشتراكات', icon: DollarSign },
        { id: 'more', label: 'المزيد', icon: MoreHorizontal },
      ]
    : isStudent
    ? [
        { id: 'dashboard', label: 'الرئيسية', icon: Home },
        { id: 'classes', label: 'الحصص', icon: Users },
        { id: 'homework', label: 'الواجبات', icon: BookOpen },
        { id: 'more', label: 'المزيد', icon: MoreHorizontal },
      ]
    : isParent
    ? [
        { id: 'dashboard', label: 'الرئيسية', icon: Home },
        { id: 'children', label: 'أبنائي', icon: Users },
        { id: 'alerts', label: 'التنبيهات', icon: Bell },
        { id: 'more', label: 'المزيد', icon: MoreHorizontal },
      ]
    : [
        { id: 'admin', label: 'الإدارة', icon: Home },
        { id: 'more', label: 'المزيد', icon: MoreHorizontal },
      ];

  const roleNameMap: Record<UserRole, string> = {
    teacher: 'مدرس',
    assistant: 'مساعد وسكرتارية',
    student: 'طالب',
    parent: 'ولي أمر',
    admin: 'مشرف نظام',
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-start sm:py-4">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[844px] bg-slate-100 flex flex-col relative sm:rounded-[40px] sm:shadow-2xl sm:border-[8px] sm:border-slate-800 overflow-hidden text-slate-800">
        {/* Android Status Bar */}
        <div className="bg-teal-900 text-white px-5 pt-2 pb-1 flex items-center justify-between text-[11px] font-semibold shrink-0 select-none">
          <span className="font-mono tracking-tight">{timeStr}</span>
          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span>94%</span>
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Top App Header with Quick Persona Switcher */}
        <div className="bg-teal-800 text-white px-4 py-2.5 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-700/80 flex items-center justify-center font-black text-sm text-teal-100 border border-teal-600/50">
              يد
            </div>
            <div>
              <span className="font-black text-sm tracking-wide block leading-tight">يلا درس</span>
              <span className="text-[10px] text-teal-200">الدروس الخصوصية في مصر</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-1 bg-teal-700/80 hover:bg-teal-700 text-teal-100 px-2.5 py-1 rounded-xl text-[11px] font-bold border border-teal-600/60 transition active:scale-95"
              >
                <span>{roleNameMap[role]}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showRoleDropdown && (
                <div className="absolute left-0 mt-1.5 w-48 rounded-2xl bg-white p-2 text-slate-800 shadow-2xl border border-slate-200 z-50 animate-fade-in text-xs max-h-80 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100 mb-1">
                    تبديل فوري بين الحسابات:
                  </div>

                  {/* Teacher */}
                  <button
                    onClick={() => handleSwitchToSpecificUser('user_teacher_1')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-teal-50 text-slate-800 font-bold flex items-center justify-between"
                  >
                    <span>أستاذ أحمد حسن</span>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md">مدرس</span>
                  </button>

                  {/* Assistant / Secretary */}
                  <button
                    onClick={() => handleSwitchToSpecificUser('user_assistant_1')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-amber-50 text-amber-950 font-bold flex items-center justify-between"
                  >
                    <span>أ/ سارة إبراهيم</span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">مساعد</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />
                  <div className="px-2 py-0.5 text-[9px] font-bold text-slate-400">حسابات الطلاب:</div>

                  {/* Student Mohamed Ahmed */}
                  <button
                    onClick={() => handleSwitchToSpecificUser('user_student_1')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-blue-50 text-slate-800 font-bold flex items-center justify-between"
                  >
                    <span>محمد أحمد</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md">أولى ثانوي</span>
                  </button>

                  {/* Student Youssef Hamdi */}
                  <button
                    onClick={() => handleSwitchToSpecificUser('user_student_youssef')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 text-slate-800 font-bold flex items-center justify-between"
                  >
                    <span>يوسف حمدي</span>
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">أولى ثانوي</span>
                  </button>

                  {/* Student Marwan Hamdi */}
                  <button
                    onClick={() => handleSwitchToSpecificUser('user_student_marwan')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-cyan-50 text-slate-800 font-bold flex items-center justify-between"
                  >
                    <span>مروان حمدي</span>
                    <span className="text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded-md">ثانية ثانوي</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />
                  <div className="px-2 py-0.5 text-[9px] font-bold text-slate-400">أولياء الأمور:</div>

                  {/* Parent Hamdi Harb */}
                  <button
                    onClick={() => handleSwitchToSpecificUser('user_parent_hamdi')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-emerald-950 font-bold flex items-center justify-between bg-emerald-50/50"
                  >
                    <span>حمدي حرب</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md font-semibold">ولي أمر (يوسف ومروان)</span>
                  </button>

                  {/* Parent Ahmed Hassan */}
                  <button
                    onClick={() => handleSwitchToSpecificUser('user_parent_1')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-semibold flex items-center justify-between"
                  >
                    <span>أحمد حسن</span>
                    <span className="text-[9px] text-slate-500 font-normal">ولي أمر محمد</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {/* Admin */}
                  <button
                    onClick={() => handleSwitchToSpecificUser('user_admin_1', 'admin')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-purple-50 text-purple-900 font-bold flex items-center justify-between"
                  >
                    <span>إدارة المنصة (Admin)</span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md">إشراف</span>
                  </button>
                </div>
              )}
            </div>

            {/* Gemini AI Chatbot Button */}
            <button
              onClick={() => onTabChange('gemini-chat')}
              className={`p-1.5 rounded-xl border transition ${
                activeTab === 'gemini-chat'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                  : 'bg-teal-700/80 hover:bg-teal-700 text-teal-100 border border-teal-600/60'
              }`}
              title="المساعد الذكي (Gemini Chatbot)"
            >
              <Sparkles className="w-4 h-4 fill-current" />
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton compact />

            {/* Android Kotlin Code Exporter Button */}
            <button
              onClick={onOpenAndroidCode}
              className="p-1.5 rounded-xl bg-teal-700/80 hover:bg-teal-700 text-teal-100 border border-teal-600/60 transition"
              title="كود الأندرويد الأصلي والـ APK"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">{children}</div>

        {/* Bottom Android Navigation Bar */}
        <div className="bg-white border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shrink-0 z-30 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition active:scale-95 ${
                  isActive ? 'text-teal-800 font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition ${
                    isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Android Gesture Bar */}
        <div className="bg-white pb-2 pt-1 flex justify-center shrink-0">
          <div className="w-28 h-1 rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  );
};
