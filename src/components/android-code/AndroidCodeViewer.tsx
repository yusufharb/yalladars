import React, { useState } from 'react';
import { Smartphone, Code, Copy, Check, Terminal, Download, FileCode, CheckCircle2, Cloud, Database } from 'lucide-react';

export const AndroidCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('SyncEngine.kt');
  const [copied, setCopied] = useState(false);

  const files: Record<string, { lang: string; path: string; category: string; code: string }> = {
    'SyncEngine.kt': {
      lang: 'kotlin',
      category: 'Cloud Sync Engine (Android)',
      path: 'app/src/main/java/com/yalladars/app/data/sync/SyncEngine.kt',
      code: `package com.yalladars.app.data.sync

import android.content.Context
import android.util.Log
import com.yalladars.app.data.local.YallaDarsDatabase
import com.yalladars.app.data.model.SyncQueueEntity
import com.yalladars.app.data.remote.ApiService
import com.yalladars.app.data.remote.SyncPushRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

enum class AndroidSyncStatus {
    SYNCED, SYNCING, OFFLINE, PENDING, ERROR
}

/**
 * YallaDars Android Native Sync Engine (Offline-First)
 * 1. Immediate local write to Room (0ms latency, works completely offline).
 * 2. Enqueues mutation to Room SyncQueueEntity.
 * 3. When network is available (or triggered periodically via WorkManager/Coroutines):
 *    a) Pushes pending queue items to Cloud Server (/api/sync/push).
 *    b) Pulls updated entities from Cloud Server (/api/sync/state?since=...).
 *    c) Commits remote entities into Room with OnConflictStrategy.REPLACE.
 *    d) Clears synchronized queue records.
 */
class AndroidSyncEngine private constructor(private val context: Context) {

    private val db = YallaDarsDatabase.getDatabase(context)
    private var lastSyncTimestamp: Long = 0L

    private val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl("https://yalladars.app/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    suspend fun syncNow(): AndroidSyncStatus = withContext(Dispatchers.IO) {
        try {
            // Step 1: Health probe
            val health = api.getHealth()
            if (!health.isSuccessful) {
                return@withContext AndroidSyncStatus.OFFLINE
            }

            // Step 2: Push local pending changes from Room
            val pendingItems = db.syncQueueDao().getPendingQueue()
            if (pendingItems.isNotEmpty()) {
                val pushReq = SyncPushRequest(
                    clientId = "android_device_\${android.os.Build.SERIAL ?: "device"}",
                    clientTimestamp = System.currentTimeMillis(),
                    changes = pendingItems
                )
                val pushRes = api.pushChanges(pushReq)
                if (pushRes.isSuccessful && pushRes.body()?.success == true) {
                    for (item in pendingItems) {
                        db.syncQueueDao().removeFromQueue(item.queueId)
                    }
                    val body = pushRes.body()
                    if (body?.state != null) {
                        applyRemoteStateToRoom(body.state)
                    }
                }
            }

            // Step 3: Pull remote updates
            val pullRes = api.getSyncState(sinceTimestamp = lastSyncTimestamp)
            if (pullRes.isSuccessful && pullRes.body()?.success == true) {
                val remote = pullRes.body()
                if (remote?.state != null) {
                    applyRemoteStateToRoom(remote.state)
                }
                lastSyncTimestamp = remote?.serverTimestamp ?: System.currentTimeMillis()
            }

            AndroidSyncStatus.SYNCED
        } catch (e: Exception) {
            AndroidSyncStatus.OFFLINE
        }
    }

    private suspend fun applyRemoteStateToRoom(state: com.yalladars.app.data.remote.RemoteDbState) {
        if (state.groups.isNotEmpty()) db.groupDao().insertGroups(state.groups)
        if (state.attendance.isNotEmpty()) db.attendanceDao().insertAttendanceList(state.attendance)
        if (state.homework.isNotEmpty()) db.homeworkDao().insertHomeworkList(state.homework)
        if (state.grades.isNotEmpty()) db.gradeDao().insertGrades(state.grades)
        if (state.assessments.isNotEmpty()) db.assessmentDao().insertAssessments(state.assessments)
    }

    companion object {
        @Volatile private var INSTANCE: AndroidSyncEngine? = null
        fun getInstance(context: Context): AndroidSyncEngine {
            return INSTANCE ?: synchronized(this) {
                val instance = AndroidSyncEngine(context.applicationContext)
                INSTANCE = instance
                instance
            }
        }
    }
}`,
    },
    'ApiService.kt': {
      lang: 'kotlin',
      category: 'Cloud REST Client',
      path: 'app/src/main/java/com/yalladars/app/data/remote/ApiService.kt',
      code: `package com.yalladars.app.data.remote

import com.yalladars.app.data.model.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface ApiService {
    @GET("api/health")
    suspend fun getHealth(): Response<ServerHealthResponse>

    @GET("api/sync/state")
    suspend fun getSyncState(@Query("since") sinceTimestamp: Long = 0): Response<SyncStateResponse>

    @POST("api/sync/push")
    suspend fun pushChanges(@Body request: SyncPushRequest): Response<SyncPushResponse>
}`,
    },
    'Models.kt': {
      lang: 'kotlin',
      category: 'Room SQLite Entities',
      path: 'app/src/main/java/com/yalladars/app/data/model/Models.kt',
      code: `package com.yalladars.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "groups")
data class GroupEntity(
    @PrimaryKey val groupId: String,
    val teacherId: String,
    val teacherName: String = "",
    val name: String,
    val subject: String,
    val grade: String,
    val location: String,
    val startTime: String,
    val durationMinutes: Int,
    val joinCode: String,
    val status: GroupStatus = GroupStatus.ACTIVE,
    val joinApprovalMode: JoinApprovalMode = JoinApprovalMode.AUTO,
    val createdAt: String = System.currentTimeMillis().toString()
)

@Entity(tableName = "attendance")
data class AttendanceEntity(
    @PrimaryKey val attendanceId: String,
    val groupId: String,
    val studentId: String,
    val studentName: String,
    val date: String,
    val status: AttendanceStatus,
    val synced: Boolean = true
)

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true) val queueId: Long = 0,
    val entityType: String,
    val action: String,
    val entityId: String,
    val payloadJson: String,
    val clientTimestamp: Long = System.currentTimeMillis(),
    val retryCount: Int = 0
)`,
    },
    'AppDao.kt': {
      lang: 'kotlin',
      category: 'Room DAOs',
      path: 'app/src/main/java/com/yalladars/app/data/local/AppDao.kt',
      code: `package com.yalladars.app.data.local

import androidx.room.*
import com.yalladars.app.data.model.*
import kotlinx.coroutines.flow.Flow

@Dao
interface GroupDao {
    @Query("SELECT * FROM groups ORDER BY createdAt DESC")
    fun getAllGroups(): Flow<List<GroupEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGroups(groups: List<GroupEntity>)
}

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue ORDER BY queueId ASC")
    suspend fun getPendingQueue(): List<SyncQueueEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueue(item: SyncQueueEntity): Long

    @Query("DELETE FROM sync_queue WHERE queueId = :queueId")
    suspend fun removeFromQueue(queueId: Long)
}`,
    },
    'YallaDarsRepository.kt': {
      lang: 'kotlin',
      category: 'Unified Repository',
      path: 'app/src/main/java/com/yalladars/app/data/repository/YallaDarsRepository.kt',
      code: `package com.yalladars.app.data.repository

import android.content.Context
import com.google.gson.Gson
import com.yalladars.app.data.local.YallaDarsDatabase
import com.yalladars.app.data.model.*
import com.yalladars.app.data.sync.AndroidSyncEngine

class YallaDarsRepository(context: Context) {
    private val db = YallaDarsDatabase.getDatabase(context)
    private val syncEngine = AndroidSyncEngine.getInstance(context)
    private val gson = Gson()

    fun getAllGroups() = db.groupDao().getAllGroups()

    suspend fun createGroup(group: GroupEntity) {
        db.groupDao().insertGroup(group)
        syncEngine.enqueueLocalMutation("groups", "upsert", group.groupId, gson.toJson(group))
    }

    suspend fun triggerSync() = syncEngine.syncNow()
}`,
    },
    'MainActivity.kt': {
      lang: 'kotlin',
      category: 'Jetpack Compose UI',
      path: 'app/src/main/java/com/yalladars/app/MainActivity.kt',
      code: `package com.yalladars.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    // YallaDars Native Screen with Room + SyncEngine
                }
            }
        }
    }
}`,
    },
    'build.gradle.kts': {
      lang: 'kotlin',
      category: 'Gradle Configuration',
      path: 'app/build.gradle.kts',
      code: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

dependencies {
    // Room SQLite Database for 100% Free Offline Data
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")

    // Retrofit & OkHttp for Zero-Cost Cloud Sync
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // WorkManager & Coroutines
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}`,
    },
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(files[selectedFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-900 to-emerald-900 p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-500/20 p-2.5 backdrop-blur-sm border border-teal-400/30">
            <Smartphone className="h-6 w-6 text-teal-300" />
          </div>
          <div>
            <h1 className="text-base font-extrabold">معمارية كود أندرويد الأصلي (Android Native)</h1>
            <p className="text-xs text-teal-200 mt-0.5">
              Room SQLite + SyncEngine + Retrofit · مزامنة سحابية حقيقية بدون تكاليف
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-white/10 p-2.5 border border-white/10">
            <div className="flex items-center gap-1.5 text-teal-300 font-semibold mb-1">
              <Database className="w-3.5 h-3.5" />
              <span>Room SQLite المحلي</span>
            </div>
            <p className="text-[11px] text-teal-100/90 leading-tight">
              يعمل Offline بالكامل 100% ويحفظ البيانات محلياً على جهاز المدرس أو الطالب فوراً.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-2.5 border border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
              <Cloud className="w-3.5 h-3.5" />
              <span>Sync Engine السحابي</span>
            </div>
            <p className="text-[11px] text-emerald-100/90 leading-tight">
              يرسل الطابور إلى السيرفر ويسحب التحديثات بين الأجهزة بدون أي بطاقة بنكية أو تكلفة.
            </p>
          </div>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {Object.entries(files).map(([fileName, fileData]) => (
          <button
            key={fileName}
            onClick={() => setSelectedFile(fileName)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              selectedFile === fileName
                ? 'bg-teal-700 text-white border-teal-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 opacity-80" />
            <span>{fileName}</span>
          </button>
        ))}
      </div>

      {/* File Details Bar */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500">
        <span className="font-mono text-[11px]">{files[selectedFile].path}</span>
        <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
          {files[selectedFile].category}
        </span>
      </div>

      {/* Code Box */}
      <div className="relative rounded-2xl bg-slate-950 p-4 text-slate-100 shadow-lg border border-slate-800 font-mono text-xs overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-400">
          <span>{files[selectedFile].lang.toUpperCase()}</span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[11px]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>نسخ الكود</span>
              </>
            )}
          </button>
        </div>

        <pre className="overflow-x-auto pt-3 max-h-[380px] scrollbar-thin scrollbar-thumb-slate-700 text-[11px] leading-relaxed text-slate-300 dir-ltr text-left">
          <code>{files[selectedFile].code}</code>
        </pre>
      </div>

      {/* APK Compilation Instructions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-teal-700" />
          <span>خطوات بناء ملف الـ APK وتثبيته على الهاتف:</span>
        </h3>
        <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pr-1">
          <li>
            افتح مجلد <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono">/android</code> في برنامج <strong>Android Studio</strong>.
          </li>
          <li>
            انتظر انتهاء مزامنة Gradle Dependencies (Room + Retrofit + Coroutines).
          </li>
          <li>
            من القائمة العلوية: اختر <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.
          </li>
          <li>
            احصل على الملف الجاهز من المسار:
            <div className="font-mono text-[11px] bg-slate-50 p-2 rounded-lg text-slate-700 border border-slate-200 mt-1 dir-ltr text-left">
              app/build/outputs/apk/debug/app-debug.apk
            </div>
          </li>
          <li>
            ثبته مباشرة على هاتفك أو أرسله عبر البلوتوث / الواتساب.
          </li>
        </ol>
      </div>
    </div>
  );
};
