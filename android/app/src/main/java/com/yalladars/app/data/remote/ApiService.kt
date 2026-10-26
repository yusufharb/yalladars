package com.yalladars.app.data.remote

import com.yalladars.app.BuildConfig
import com.yalladars.app.data.model.*
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

data class ServerHealthResponse(
    val status: String,
    val app: String,
    val serverTime: String,
    val timestamp: Long,
    val billing: String
)

data class TombstoneDto(
    val id: String,
    val entityType: String,
    val deletedAt: Long,
    val deletedBy: String? = null
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
    val joinRequests: List<JoinRequestEntity> = emptyList(),
    val tombstones: List<TombstoneDto> = emptyList()
)

data class SyncPushRequest(
    val clientId: String,
    val clientTimestamp: Long,
    val changes: List<SyncQueueEntity>? = null,
    val tombstones: List<TombstoneDto>? = null
)

data class RejectedChangeDto(
    val id: String,
    val entityType: String,
    val entityId: String,
    val reason: String
)

data class SyncPushResponse(
    val success: Boolean,
    val serverTimestamp: Long,
    val appliedCount: Int,
    val appliedChangeIds: List<String> = emptyList(),
    val rejectedChanges: List<RejectedChangeDto> = emptyList(),
    val state: RemoteDbState? = null
)

interface ApiService {
    @GET("api/health")
    suspend fun getHealth(): Response<ServerHealthResponse>

    @GET("api/sync/state")
    suspend fun getSyncState(
        @Query("since") sinceTimestamp: Long = 0,
        @Header("Authorization") authHeader: String? = null
    ): Response<SyncStateResponse>

    @POST("api/sync/push")
    suspend fun pushChanges(
        @Body request: SyncPushRequest,
        @Header("Authorization") authHeader: String? = null
    ): Response<SyncPushResponse>
}

object NetworkClient {
    @Volatile
    private var jwtToken: String? = null

    fun setAuthToken(token: String?) {
        jwtToken = token
    }

    private val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val token = jwtToken
        val requestBuilder = original.newBuilder()
        if (!token.isNullOrBlank() && original.header("Authorization") == null) {
            requestBuilder.header("Authorization", "Bearer $token")
        }
        chain.proceed(requestBuilder.build())
    }

    val apiService: ApiService by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC else HttpLoggingInterceptor.Level.NONE
        }
        val client = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(logging)
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .build()

        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
