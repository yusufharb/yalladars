package com.yalladars.app.data.sync

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
 * YallaDars Android Native Sync Engine
 * Operates on Room SQLite Database.
 * 
 * Rules:
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

    // In production, BASE_URL points to the YallaDars Cloud Sync Server
    private val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl("https://yalladars.app/") // Configurable via buildConfig / server endpoint
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    suspend fun syncNow(): AndroidSyncStatus = withContext(Dispatchers.IO) {
        try {
            // Step 1: Health / Network probe
            val health = api.getHealth()
            if (!health.isSuccessful) {
                Log.w(TAG, "Server unreachable, remaining in offline-first mode.")
                return@withContext AndroidSyncStatus.OFFLINE
            }

            // Step 2: Push pending local Room changes
            val pendingItems = db.syncQueueDao().getPendingQueue()
            if (pendingItems.isNotEmpty()) {
                val pushReq = SyncPushRequest(
                    clientId = "android_device_${android.os.Build.SERIAL ?: "unknown"}",
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

            // Step 3: Pull remote updates since last timestamp
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
            Log.e(TAG, "Sync attempt exception, staying offline-safe: ${e.message}")
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

    suspend fun enqueueLocalMutation(entityType: String, action: String, entityId: String, payloadJson: String) {
        withContext(Dispatchers.IO) {
            db.syncQueueDao().enqueue(
                SyncQueueEntity(
                    entityType = entityType,
                    action = action,
                    entityId = entityId,
                    payloadJson = payloadJson,
                    clientTimestamp = System.currentTimeMillis()
                )
            )
        }
    }

    companion object {
        private const val TAG = "YallaDarsSyncEngine"

        @Volatile
        private var INSTANCE: AndroidSyncEngine? = null

        fun getInstance(context: Context): AndroidSyncEngine {
            return INSTANCE ?: synchronized(this) {
                val instance = AndroidSyncEngine(context.applicationContext)
                INSTANCE = instance
                instance
            }
        }
    }
}
