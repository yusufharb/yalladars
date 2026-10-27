package com.yalladars.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

enum class UserRole {
    @SerializedName("teacher") TEACHER,
    @SerializedName("student") STUDENT,
    @SerializedName("parent") PARENT,
    @SerializedName("admin") ADMIN
}

enum class AttendanceStatus {
    @SerializedName("present") PRESENT,
    @SerializedName("absent") ABSENT,
    @SerializedName("late") LATE
}

enum class GroupStatus {
    @SerializedName("active") ACTIVE,
    @SerializedName("paused") PAUSED
}

enum class JoinApprovalMode {
    @SerializedName("auto") AUTO,
    @SerializedName("requires_approval") REQUIRES_APPROVAL
}

enum class HomeworkStatus {
    @SerializedName("new") NEW,
    @SerializedName("active") ACTIVE,
    @SerializedName("closed") CLOSED
}

enum class NoteVisibility {
    @SerializedName("teacher_only") TEACHER_ONLY,
    @SerializedName("parent_visible") PARENT_VISIBLE
}

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val name: String,
    val email: String,
    val role: UserRole,
    val phone: String? = null,
    val status: String = "active",
    val createdAt: String = System.currentTimeMillis().toString()
)

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

@Entity(tableName = "group_members", primaryKeys = ["groupId", "studentId"])
data class GroupMemberEntity(
    val groupId: String,
    val studentId: String,
    val studentName: String,
    val studentGrade: String,
    val joinedAt: String,
    val status: String = "active"
)

@Entity(tableName = "parent_students", primaryKeys = ["parentId", "studentId"])
data class ParentStudentEntity(
    val parentId: String,
    val studentId: String,
    val studentName: String,
    val grade: String,
    val school: String,
    val linkedAt: String
)

@Entity(tableName = "attendance")
data class AttendanceEntity(
    @PrimaryKey val attendanceId: String,
    val groupId: String,
    val studentId: String,
    val studentName: String,
    val date: String,
    val status: AttendanceStatus,
    val createdAt: String = System.currentTimeMillis().toString(),
    val synced: Boolean = true
)

@Entity(tableName = "homework")
data class HomeworkEntity(
    @PrimaryKey val homeworkId: String,
    val groupId: String,
    val groupName: String,
    val title: String,
    val description: String,
    val assignedDate: String,
    val dueDate: String,
    val status: HomeworkStatus = HomeworkStatus.ACTIVE,
    val createdAt: String = System.currentTimeMillis().toString()
)

@Entity(tableName = "assessments")
data class AssessmentEntity(
    @PrimaryKey val assessmentId: String,
    val groupId: String,
    val groupName: String = "",
    val teacherId: String = "",
    val title: String,
    val subject: String = "",
    val date: String,
    val maxScore: Double,
    val createdAt: String = System.currentTimeMillis().toString()
)

@Entity(tableName = "grades")
data class GradeEntity(
    @PrimaryKey val gradeId: String,
    val assessmentId: String = "",
    val groupId: String,
    val groupName: String = "",
    val studentId: String,
    val studentName: String = "",
    val title: String,
    val score: Double,
    val maxScore: Double,
    val date: String
)

@Entity(tableName = "announcements")
data class AnnouncementEntity(
    @PrimaryKey val announcementId: String,
    val groupId: String,
    val groupName: String,
    val teacherName: String,
    val title: String,
    val body: String,
    val createdAt: String = System.currentTimeMillis().toString()
)

@Entity(tableName = "student_notes")
data class StudentNoteEntity(
    @PrimaryKey val noteId: String,
    val teacherId: String,
    val studentId: String,
    val studentName: String,
    val text: String,
    val visibility: NoteVisibility = NoteVisibility.PARENT_VISIBLE,
    val createdAt: String = System.currentTimeMillis().toString()
)

@Entity(tableName = "join_requests")
data class JoinRequestEntity(
    @PrimaryKey val requestId: String,
    val groupId: String,
    val groupName: String,
    val teacherId: String,
    val studentId: String,
    val studentName: String,
    val studentGrade: String,
    val status: String = "pending", // pending, accepted, rejected
    val requestedAt: String = System.currentTimeMillis().toString()
)

/**
 * Offline-First Sync Queue for Room Database
 * Whenever a mutation occurs on the Android device (e.g. attendance recorded,
 * homework assigned, student joined group), it is immediately committed to Room
 * and placed into this queue. When network connectivity is established, the
 * SyncEngine sends this queue to the Cloud Sync Server.
 */
@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true) val queueId: Long = 0,
    val entityType: String, // "attendance", "groups", "grades", etc.
    val action: String, // "upsert" or "delete"
    val entityId: String,
    val payloadJson: String,
    val clientTimestamp: Long = System.currentTimeMillis(),
    val retryCount: Int = 0
)
