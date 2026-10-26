import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AndroidFrame } from './components/common/AndroidFrame';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { QRCodeModal } from './components/common/QRCodeModal';
import { AuthModal } from './components/auth/AuthModal';
import { MoreScreen } from './components/common/MoreScreen';
import { HelpScreen } from './components/help/HelpScreen';
import { AndroidCodeViewer } from './components/android-code/AndroidCodeViewer';
import { GeminiChatbot } from './components/common/GeminiChatbot';

// Teacher components
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TeacherGroups } from './components/teacher/TeacherGroups';
import { TeacherGroupDetail } from './components/teacher/TeacherGroupDetail';
import { TeacherSchedule } from './components/teacher/TeacherSchedule';

// Student components
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentClasses } from './components/student/StudentClasses';
import { StudentHomework } from './components/student/StudentHomework';
import { StudentGrades } from './components/student/StudentGrades';
import { JoinGroupModal } from './components/student/JoinGroupModal';

// Parent components
import { ParentDashboard } from './components/parent/ParentDashboard';
import { ParentChildren } from './components/parent/ParentChildren';
import { ParentAlerts } from './components/parent/ParentAlerts';
import { LinkChildModal } from './components/parent/LinkChildModal';

// Admin component
import { AdminDashboard } from './components/admin/AdminDashboard';

// Assistant component
import { AssistantDashboard } from './components/assistant/AssistantDashboard';

import { Group } from './types';
import { CheckCircle2, Users, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, role, isTeacher, isAssistant, isStudent, isParent, isAdmin, switchRoleQuick } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Teacher navigation state
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupInitialTab, setGroupInitialTab] = useState<
    'attendance' | 'live' | 'homework' | 'grades' | 'announcements' | 'students' | 'notes' | 'reports' | 'assessments' | 'payments' | 'materials' | 'leaderboard' | 'certificates'
  >('attendance');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [qrModalGroup, setQrModalGroup] = useState<Group | null>(null);

  // URL join parameter state
  const [initialJoinCode, setInitialJoinCode] = useState<string>('');
  const [urlJoinAlert, setUrlJoinAlert] = useState<string | null>(null);

  // Check URL parameters on mount (?join=CODE or ?code=CODE or ?register=true)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = (params.get('join') || params.get('code') || '').toUpperCase().trim();
      if (codeFromUrl) {
        setInitialJoinCode(codeFromUrl);
        if (currentUser && role === 'student') {
          setJoinModalOpen(true);
        } else {
          setUrlJoinAlert(codeFromUrl);
        }
      }

      // If user came via register link ?register=true or ?signup=true
      if (params.get('register') === 'true' || params.get('signup') === 'true' || params.get('auth') === 'register') {
        setAuthInitialMode('register');
        if (currentUser) {
          setAuthModalOpen(true);
        }
      }
    }
  }, [role, currentUser]);

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'groups') {
      setSelectedGroupId(null);
    }
  };

  const handleNavigateToGroup = (
    groupId: string,
    initialTab: 'attendance' | 'live' | 'homework' | 'grades' | 'announcements' | 'students' | 'notes' | 'reports' | 'assessments' | 'payments' | 'materials' | 'leaderboard' | 'certificates' = 'attendance'
  ) => {
    setSelectedGroupId(groupId);
    setGroupInitialTab(initialTab);
    setActiveTab('groups');
  };

  return (
    <>
      {currentUser && <OfflineIndicator />}

      <AndroidFrame
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenHelp={() => setActiveTab('help')}
        onOpenAndroidCode={() => setActiveTab('android-code')}
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-14 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl bg-teal-800 p-3 text-xs text-white shadow-xl flex items-center gap-2 animate-fade-in border border-teal-700">
            <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Default Login Screen when not authenticated (Requirement T01) */}
        {!currentUser ? (
          <div className="py-2">
            <AuthModal
              isOpen={true}
              embedded={true}
              initialMode={authInitialMode}
              onClose={() => {
                setActiveTab('dashboard');
              }}
            />
          </div>
        ) : (
          <>
            {/* URL Join Invite Banner */}
            {urlJoinAlert && !isStudent && (
              <div className="fixed top-14 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl bg-amber-600 p-3 text-xs text-white shadow-2xl flex items-center justify-between gap-2 border border-amber-500 animate-bounce-subtle">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="w-4 h-4 shrink-0 text-amber-200" />
                  <div className="min-w-0">
                    <span className="block font-bold truncate">دعوة انضمام لمجموعة</span>
                    <span className="text-[11px] text-amber-100 font-mono dir-ltr">كود: {urlJoinAlert}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      switchRoleQuick('student');
                      setUrlJoinAlert(null);
                      setJoinModalOpen(true);
                    }}
                    className="bg-white text-amber-900 font-bold px-2.5 py-1.5 rounded-xl text-[11px] hover:bg-amber-50 transition active:scale-95 shadow-xs"
                  >
                    انضمام كطالب
                  </button>
                  <button
                    onClick={() => setUrlJoinAlert(null)}
                    className="p-1 text-amber-200 hover:text-white rounded-lg"
                    title="إغلاق"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Global screens across roles */}
            {activeTab === 'gemini-chat' && (
              <div className="h-[calc(100vh-140px)] sm:h-[680px]">
                <GeminiChatbot />
              </div>
            )}
            {activeTab === 'help' && <HelpScreen />}
            {activeTab === 'android-code' && <AndroidCodeViewer />}
            {activeTab === 'more' && (
              <MoreScreen
                onOpenAuth={() => setAuthModalOpen(true)}
                onOpenHelp={() => setActiveTab('help')}
                onOpenAndroidCode={() => setActiveTab('android-code')}
                onOpenAdmin={() => setActiveTab('admin')}
                onOpenGeminiChat={() => setActiveTab('gemini-chat')}
              />
            )}

            {/* TEACHER SCREENS */}
            {isTeacher && (
              <>
                {activeTab === 'dashboard' && (
                  <TeacherDashboard
                    onNavigateToGroup={handleNavigateToGroup}
                    onOpenCreateGroup={() => {
                      setActiveTab('groups');
                      setSelectedGroupId(null);
                    }}
                    onViewQrCode={(grp) => setQrModalGroup(grp)}
                    onNavigateTab={handleTabChange}
                  />
                )}

                {activeTab === 'groups' &&
                  (selectedGroupId ? (
                    <TeacherGroupDetail
                      groupId={selectedGroupId}
                      initialTab={groupInitialTab}
                      onBack={() => setSelectedGroupId(null)}
                      onViewQrCode={(grp) => setQrModalGroup(grp)}
                    />
                  ) : (
                    <TeacherGroups
                      onSelectGroup={(id) => handleNavigateToGroup(id)}
                      onViewQrCode={(grp) => setQrModalGroup(grp)}
                    />
                  ))}

                {activeTab === 'schedule' && (
                  <TeacherSchedule onSelectGroup={(id) => handleNavigateToGroup(id)} />
                )}
              </>
            )}

            {/* ASSISTANT SCREENS */}
            {isAssistant && (
              <AssistantDashboard activeNavTab={activeTab} />
            )}

            {/* STUDENT SCREENS */}
            {isStudent && (
              <>
                {activeTab === 'dashboard' && (
                  <StudentDashboard
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenJoinModal={() => setJoinModalOpen(true)}
                  />
                )}

                {activeTab === 'classes' && (
                  <StudentClasses onOpenJoinModal={() => setJoinModalOpen(true)} />
                )}

                {activeTab === 'homework' && <StudentHomework />}

                {activeTab === 'grades' && <StudentGrades />}
              </>
            )}

            {/* PARENT SCREENS */}
            {isParent && (
              <>
                {activeTab === 'dashboard' && (
                  <ParentDashboard
                    onOpenLinkModal={() => setLinkModalOpen(true)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )}

                {activeTab === 'children' && (
                  <ParentChildren onOpenLinkModal={() => setLinkModalOpen(true)} />
                )}

                {activeTab === 'alerts' && <ParentAlerts />}
              </>
            )}

            {/* ADMIN SCREEN */}
            {isAdmin && activeTab === 'admin' && <AdminDashboard />}
          </>
        )}
      </AndroidFrame>

      {/* Modals */}
      {currentUser && (
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authInitialMode}
          onClose={() => {
            setAuthModalOpen(false);
            setAuthInitialMode('login');
          }}
        />
      )}

      {qrModalGroup && (
        <QRCodeModal
          isOpen={!!qrModalGroup}
          onClose={() => setQrModalGroup(null)}
          title={qrModalGroup.name}
          code={qrModalGroup.joinCode}
          subtitle={`مجموعة ${qrModalGroup.subject} · ${qrModalGroup.grade}`}
        />
      )}

      <JoinGroupModal
        isOpen={joinModalOpen}
        initialCode={initialJoinCode}
        onClose={() => {
          setJoinModalOpen(false);
          setInitialJoinCode('');
        }}
        onSuccess={(groupName) => showToast(`تم الانضمام بنجاح إلى: ${groupName}`)}
      />

      <LinkChildModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onSuccess={(childName) => showToast(`تم ربط حساب الابن (${childName}) بنجاح`)}
      />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
