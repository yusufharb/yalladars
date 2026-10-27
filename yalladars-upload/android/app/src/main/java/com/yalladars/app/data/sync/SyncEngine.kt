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
 * Operates on Room SQLite Database with JWT Bearer Auth, Composite Keys, and Tombstone Deletion Sync.
 */
class AndroidSyncEngine private constructor(private val context: Context) {

    private val db = YallaDarsDatabase.getDatabase(context)
    private var lastSyncTimestamp: Long = 0L
    @Volatile
    var authToken: String? = null

    private val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl("https://yalladars.app/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    private fun getBearerHeader(): String? = authToken?.let { "Bearer $it" }

    suspend fun syncNow(): AndroidSyncStatus = withContext(Dispatchers.IO) {
        try {
            val health = api.getHealth()
            if (!health.isSuccessful) {
                Log.w(TAG, "Server unreachable, remaining in offline-first mode.")
                return@withContext AndroidSyncStatus.OFFLINE
            }

            val pendingItems = db.syncQueueDao().getPendingQueue()
            if (pendingItems.isNotEmpty()) {
                val pushReq = SyncPushRequest(
                    clientId = "android_device_${android.os.Build.SERIAL ?: "unknown"}",
                    clientTimestamp = System.currentTimeMillis(),
                    changes = pendingItems
                )
                val pushRes = api.pushChanges(pushReq, getBearerHeader())
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

            val pullRes = api.getSyncState(sinceTimestamp = lastSyncTimestamp, authHeader = getBearerHeader())
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
        // Apply tombstones (deletions) first
        for (tomb in state.tombstones) {
            if (tomb.entityType == "members" && tomb.id.contains("_")) {
                val parts = tomb.id.split("_", limit = 2)
                if (parts.size == 2) db.groupMemberDao().deleteMember(parts[0], parts[1])
            } else if (tomb.entityType == "parentStudents" && tomb.id.contains("_")) {
                val parts = tomb.id.split("_", limit = 2)
                if (parts.size == 2) db.parentStudentDao().unlinkChild(parts[0], parts[1])
            }
        }

        if (state.groups.isNotEmpty()) db.groupDao().insertGroups(state.groups)
        if (state.members.isNotEmpty()) db.groupMemberDao().insertMembers(state.members)
        if (state.parentStudents.isNotEmpty()) db.parentStudentDao().insertParentStudents(state.parentStudents)
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
