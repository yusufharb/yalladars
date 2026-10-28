-- ============================================================================
-- YallaDars (يلا درس) - Production Supabase PostgreSQL Schema
-- ============================================================================
-- Fully supports relational queries + Offline-first High Speed Sync Engine
-- Can be pasted and run in Supabase SQL Editor in 1 click.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. High-Speed Atomic Sync Store (Used by Backend & Offline PWA Sync Engine)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yd_sync_records (
  id TEXT PRIMARY KEY,
  collection TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by TEXT,
  deleted_at BIGINT,
  CONSTRAINT uq_collection_entity UNIQUE (collection, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_yd_sync_records_collection ON public.yd_sync_records (collection);
CREATE INDEX IF NOT EXISTS idx_yd_sync_records_updated_at ON public.yd_sync_records (updated_at);
CREATE INDEX IF NOT EXISTS idx_yd_sync_records_lookup ON public.yd_sync_records (collection, entity_id);

-- System State & Metadata Table
CREATE TABLE IF NOT EXISTS public.yd_system_metadata (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Relational Tables (For Dashboards, Reports & Supabase Dashboard UI)
-- ----------------------------------------------------------------------------

-- Users (Teachers, Assistants, Students, Parents, Admins)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'assistant', 'student', 'parent', 'admin')),
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teacher Profiles
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  teacher_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT,
  grades JSONB DEFAULT '[]'::jsonb,
  city TEXT
);

-- Student Profiles (Includes Unique Parent Linking Code)
CREATE TABLE IF NOT EXISTS public.student_profiles (
  student_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  school TEXT NOT NULL,
  linking_code TEXT UNIQUE NOT NULL
);

-- Groups / Classes
CREATE TABLE IF NOT EXISTS public.groups (
  group_id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  location TEXT,
  days JSONB DEFAULT '[]'::jsonb,
  start_time TEXT,
  duration_minutes INTEGER DEFAULT 90,
  join_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  join_approval_mode TEXT NOT NULL DEFAULT 'auto' CHECK (join_approval_mode IN ('auto', 'requires_approval')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group Members (Enrolled Students)
CREATE TABLE IF NOT EXISTS public.group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_grade TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  CONSTRAINT uq_group_student UNIQUE (group_id, student_id)
);

-- Parent-Student Linkings
CREATE TABLE IF NOT EXISTS public.parent_students (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  grade TEXT,
  school TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',
  CONSTRAINT uq_parent_student UNIQUE (parent_id, student_id)
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance (
  attendance_id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attendance_entry UNIQUE (group_id, date, student_id)
);

-- Homework Assignments
CREATE TABLE IF NOT EXISTS public.homework (
  homework_id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('new', 'active', 'closed')),
  max_score NUMERIC(5,2) DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Homework Submissions & Grading
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  submission_id TEXT PRIMARY KEY,
  homework_id TEXT NOT NULL REFERENCES public.homework(homework_id) ON DELETE CASCADE,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  answer_text TEXT,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'graded')),
  score NUMERIC(5,2),
  max_score NUMERIC(5,2),
  teacher_feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_homework_submission UNIQUE (homework_id, student_id)
);

-- Assessments (Exams & Quizzes)
CREATE TABLE IF NOT EXISTS public.assessments (
  assessment_id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student Grades
CREATE TABLE IF NOT EXISTS public.grades (
  grade_id TEXT PRIMARY KEY,
  assessment_id TEXT REFERENCES public.assessments(assessment_id) ON DELETE SET NULL,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  title TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL,
  date DATE NOT NULL
);

-- Tuition Payments & Invoicing
CREATE TABLE IF NOT EXISTS public.tuition_payments (
  payment_id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  month TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partial', 'exempt')),
  payment_method TEXT,
  transaction_ref TEXT,
  received_by TEXT,
  paid_date DATE,
  notes TEXT
);

-- Assistant Granular Permissions
CREATE TABLE IF NOT EXISTS public.assistant_permissions (
  permission_id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assistant_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assistant_name TEXT NOT NULL,
  assistant_email TEXT,
  allowed_group_ids JSONB DEFAULT '[]'::jsonb,
  can_record_attendance BOOLEAN NOT NULL DEFAULT TRUE,
  can_search_students BOOLEAN NOT NULL DEFAULT TRUE,
  can_manage_payments BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_join_requests BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_homework BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assistant_teacher UNIQUE (teacher_id, assistant_id)
);

-- Study Materials / PDFs
CREATE TABLE IF NOT EXISTS public.materials (
  material_id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  unit TEXT,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'video', 'summary', 'link')),
  url TEXT NOT NULL,
  description TEXT,
  file_size TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Badges / Gamification
CREATE TABLE IF NOT EXISTS public.badges (
  badge_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interactive Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  quiz_id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_minutes INTEGER DEFAULT 15,
  max_score NUMERIC(5,2) DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  submission_id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(quiz_id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL,
  answers JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  announcement_id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group Join Requests
CREATE TABLE IF NOT EXISTS public.join_requests (
  request_id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_grade TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  certificate_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  title TEXT NOT NULL,
  issue_date DATE NOT NULL,
  verification_code TEXT UNIQUE NOT NULL
);

-- Live Sessions
CREATE TABLE IF NOT EXISTS public.live_sessions (
  session_id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  title TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'google_meet',
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. Row Level Security (RLS) Enablement
-- ----------------------------------------------------------------------------
ALTER TABLE public.yd_sync_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuition_payments ENABLE ROW LEVEL SECURITY;

-- Allow Service Role full access to all tables (for backend server)
CREATE POLICY "Service role full access on yd_sync_records" ON public.yd_sync_records FOR ALL USING (true);
CREATE POLICY "Service role full access on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Service role full access on groups" ON public.groups FOR ALL USING (true);
CREATE POLICY "Service role full access on group_members" ON public.group_members FOR ALL USING (true);
CREATE POLICY "Service role full access on attendance" ON public.attendance FOR ALL USING (true);
CREATE POLICY "Service role full access on homework" ON public.homework FOR ALL USING (true);
CREATE POLICY "Service role full access on homework_submissions" ON public.homework_submissions FOR ALL USING (true);
CREATE POLICY "Service role full access on grades" ON public.grades FOR ALL USING (true);
CREATE POLICY "Service role full access on tuition_payments" ON public.tuition_payments FOR ALL USING (true);
