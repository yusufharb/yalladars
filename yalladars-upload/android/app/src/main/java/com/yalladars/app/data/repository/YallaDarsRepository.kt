package com.yalladars.app.data.repository

import android.content.Context
import com.google.gson.Gson
import com.yalladars.app.data.local.YallaDarsDatabase
import com.yalladars.app.data.model.*
import com.yalladars.app.data.sync.AndroidSyncEngine
import kotlinx.coroutines.flow.Flow

/**
 * Unified Repository Layer for YallaDars Android
 * 
 * Ensures single source of truth:
 * UI reads from Room SQLite Flow (instant display).
 * UI writes to Room SQLite immediately + triggers background sync.
 */
class YallaDarsRepository(context: Context) {

    private val db = YallaDarsDatabase.getDatabase(context)
    private val syncEngine = AndroidSyncEngine.getInstance(context)
    private val gson = Gson()

    // --- Groups (Teacher & Student) ---
    fun getAllGroups(): Flow<List<GroupEntity>> = db.groupDao().getAllGroups()

    fun getTeacherGroups(teacherId: String): Flow<List<GroupEntity>> =
        db.groupDao().getTeacherGroups(teacherId)

    suspend fun createGroup(group: GroupEntity) {
        db.groupDao().insertGroup(group)
        syncEngine.enqueueLocalMutation(
            entityType = "groups",
            action = "upsert",
            entityId = group.groupId,
            payloadJson = gson.toJson(group)
        )
    }

    // --- Attendance (Teacher) ---
    fun getAttendanceForDate(groupId: String, date: String): Flow<List<AttendanceEntity>> =
        db.attendanceDao().getAttendanceForGroupDate(groupId, date)

    suspend fun recordAttendanceBatch(records: List<AttendanceEntity>) {
        db.attendanceDao().insertAttendanceList(records)
        for (rec in records) {
            syncEngine.enqueueLocalMutation(
                entityType = "attendance",
                action = "upsert",
                entityId = rec.attendanceId,
                payloadJson = gson.toJson(rec)
            )
        }
    }

    // --- Student / Parent Queries ---
    fun getStudentAttendance(studentId: String): Flow<List<AttendanceEntity>> =
        db.attendanceDao().getAttendanceForStudent(studentId)

    fun getStudentGrades(studentId: String): Flow<List<GradeEntity>> =
        db.gradeDao().getGradesForStudent(studentId)

    fun getHomeworkForGroup(groupId: String): Flow<List<HomeworkEntity>> =
        db.homeworkDao().getHomeworkForGroup(groupId)

    suspend fun addHomework(hw: HomeworkEntity) {
        db.homeworkDao().insertHomework(hw)
        syncEngine.enqueueLocalMutation(
            entityType = "homework",
            action = "upsert",
            entityId = hw.homeworkId,
            payloadJson = gson.toJson(hw)
        )
    }

    suspend fun triggerSync() = syncEngine.syncNow()
}
