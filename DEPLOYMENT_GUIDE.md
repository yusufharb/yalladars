# دليل النشر والربط بقاعدة بيانات Supabase ومنصة Railway
## منصة يلا درس — YallaDars

---

### 1. إعداد قاعدة بيانات Supabase (PostgreSQL)

1. ادخل إلى موقع [Supabase.com](https://supabase.com) وسجّل الدخول مجاناً.
2. أنشئ مشروعاً جديداً (**New Project**) واختر اسماً (مثل `yalladars-db`) وحدد كلمة مرور قوية لقاعدة البيانات، واختر أقرب منطقة جغرافية (مثل `Frankfurt / eu-central-1` لمصر والشرق الأوسط).
3. بعد اكتمال إنشاء المشروع (يستغرق دقيقة):
   - افتح القائمة الجانبية واختر **SQL Editor**.
   - انسخ محتويات الملف [`supabase_schema.sql`](./supabase_schema.sql) بالكامل والصقها في المحرر.
   - اضغط على زر **Run** (سيقوم بإنشاء الجداول، الفهارس، وقواعد الأمان RLS بنجاح).
4. انسخ بيانات الاتصال من:
   - **Project Settings** -> **API**:
     - `Project URL` (انسخ الرابط الذي يبدأ بـ `https://...supabase.co`) -> هذا هو `SUPABASE_URL`.
     - `service_role secret` (اضغط Reveal وانسخ المفتاح) -> هذا هو `SUPABASE_SERVICE_ROLE_KEY`.

---

### 2. النشر على منصة Railway (خطوة بخطوة)

1. ادخل إلى موقع [Railway.app](https://railway.app) وسجّل الدخول باستخدام حسابك على GitHub.
2. اضغط على **+ New Project** ثم اختر **Deploy from GitHub repo**.
3. اختر مستودعك: `yusufharb/yalladars`.
4. قبل النشر أو فور إنشاء المشروع، ادخل إلى إعدادات المشروع (**Variables**) وأضف المتغيرات التالية:

| المتغير (Variable) | القيمة المطلوبة |
| :--- | :--- |
| `SUPABASE_URL` | رابط مشروعك على Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح الـ service_role السري من Supabase |
| `JWT_SECRET` | نص عشوائي قوي لا يقل عن 32 حرفاً لتشفير الجلسات |
| `GEMINI_API_KEY` | مفتاح Gemini API من Google AI Studio لتشغيل المساعد الذكي |
| `NODE_ENV` | `production` |
| `PORT` | `3000` (ستقوم Railway بتمرير المنفذ تلقائياً) |

5. في تبويب **Settings**:
   - تحت قسم **Networking**، اضغط على **Generate Domain** للحصول على رابط عام مجاني ينتهي بـ `.up.railway.app` (أو أضف دومينك الخاص `Custom Domain`).
6. ستقوم Railway تلقائياً بقراءة ملف [`Dockerfile`](./Dockerfile) أو [`railway.json`](./railway.json)، وبناء الواجهة (`npm run build`) وتشغيل الخادم (`npm start`).

---

### 3. مميزات هذا الإعداد

- **قاعدة بيانات سحابية دائمة**: جميع الحصص، الحضور، الدرجات، الواجبات، والمصروفات محفوظة في PostgreSQL على Supabase ولا تُفقد أبداً.
- **استمرار عمل الـ Offline-First**: التطبيق يظل يعمل 100% بدون إنترنت على هواتف المعلمين والطلاب ويقوم بالمزامنة التلقائية فور عودة الاتصال.
- **تكلفة مجانية 0$**: كل من Supabase Free Tier و Railway Free/Hobby يمنحانك تشغيلاً كاملاً دون أي تكاليف أولية.
- **تطبيق PWA للأجهزة المحمولة**: بمجرد فتح الرابط من الهاتف، يمكن للمستخدم تثبيته كأيقونة تطبيق كاملة على الشاشة الرئيسية (Install PWA).
