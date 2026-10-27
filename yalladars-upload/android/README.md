# مشروع أندرويد يلا درس (Hybrid WebView + Room Offline Sync)

هذا المجلد يحتوي على مشروع Android Studio المتكامل لتطبيق **يلا درس (Yalla Dars)** بنمط **Hybrid WebView Container + Room SQLite Offline Sync Layer**:

1. **ملفات البناء القياسية (Gradle Kotlin DSL & Version Catalog)**:
   - `settings.gradle.kts` و `build.gradle.kts` و `gradle.properties`
   - `gradle/libs.versions.toml` شاملاً معالج `com.google.devtools.ksp` ومترجم قاعدة بيانات `androidx.room:room-compiler`
   - `app/build.gradle.kts` مع إعداد `BuildConfig.API_BASE_URL`:
     - في وضع التطوير (`debug`): `http://10.0.2.2:3000/` للاتصال بخادم التطوير المحلي من محاكي أندرويد
     - في وضع الإنتاج (`release`): `https://yalladars.eg/` عبر اتصال مشفر HTTPS فقط
2. **الأمان والشبكة (`network_security_config.xml`)**:
   - منع حركة المرور غير المشفرة (`cleartextTrafficPermitted="false"`) افتراضياً لجميع النطاقات، والسماح بها فقط للنطاق المحلي `10.0.2.2` و `localhost` أثناء التطوير.
3. **الكاميرا والـ WebView (`MainActivity.kt`)**:
   - تفويض صلاحية الكاميرا (`android.permission.CAMERA`) لمكتبة قارئ `Html5Qrcode` داخل التطبيق لتمكين مسح رموز حضور الطلاب.
   - دعم زر الرجوع في أندرويد ورفع/تصدير الملفات.
