package com.yalladars.app.data.remote

import com.google.gson.annotations.SerializedName
import com.yalladars.app.data.model.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

data class ServerHealthResponse(
    val status: String,
    val app: String,
    val serverTime: String,
    val timestamp: Long,
    val billing: String
)

data class SyncStateResponse(
    val success: Boolean,
    val serverTimestamp: Long,
    val lastModified: Long,
    val state: RemoteDbState
)

data class RemoteDbState(
    val users: List<UserEntity> = emptyList(),
    val groups: List<GroupEntity> = emptyList(),
    val members: List<GroupMemberEntity> = emptyList(),
    val parentStudents: List<ParentStudentEntity> = emptyList(),
    val attendance: List<AttendanceEntity> = emptyList(),
    val homework: List<HomeworkEntity> = emptyList(),
    val assessments: List<AssessmentEntity> = emptyList(),
    val grades: List<GradeEntity> = emptyList(),
    val announcements: List<AnnouncementEntity> = emptyList(),
    val notes: List<StudentNoteEntity> = emptyList(),
    val joinRequests: List<JoinRequestEntity> = emptyList()
)

data class SyncPushRequest(
    val clientId: String,
    val clientTimestamp: Long,
    val changes: List<SyncQueueEntity>? = null,
    val entities: RemoteDbState? = null
)

data class SyncPushResponse(
    val success: Boolean,
    val serverTimestamp: Long,
    val appliedCount: Int,
    val state: RemoteDbState? = null
)

interface ApiService {
    @GET("api/health")
    suspend fun getHealth(): Response<ServerHealthResponse>

    @GET("api/sync/state")
    suspend fun getSyncState(@Query("since") sinceTimestamp: Long = 0): Response<SyncStateResponse>

    @POST("api/sync/push")
    suspend fun pushChanges(@Body request: SyncPushRequest): Response<SyncPushResponse>
}
