package com.yalladars.app.data.local

import androidx.room.*
import com.yalladars.app.data.model.*
import kotlinx.coroutines.flow.Flow

@Dao
interface GroupDao {
    @Query("SELECT * FROM groups ORDER BY createdAt DESC")
    fun getAllGroups(): Flow<List<GroupEntity>>

    @Query("SELECT * FROM groups WHERE teacherId = :teacherId ORDER BY createdAt DESC")
    fun getTeacherGroups(teacherId: String): Flow<List<GroupEntity>>

    @Query("SELECT * FROM groups WHERE groupId = :groupId LIMIT 1")
    suspend fun getGroupById(groupId: String): GroupEntity?

    @Query("SELECT * FROM groups WHERE joinCode = :code LIMIT 1")
    suspend fun getGroupByJoinCode(code: String): GroupEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGroup(group: GroupEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGroups(groups: List<GroupEntity>)

    @Update
    suspend fun updateGroup(group: GroupEntity)

    @Delete
    suspend fun deleteGroup(group: GroupEntity)
}

@Dao
interface AttendanceDao {
    @Query("SELECT * FROM attendance WHERE groupId = :groupId AND date = :date")
    fun getAttendanceForGroupDate(groupId: String, date: String): Flow<List<AttendanceEntity>>

    @Query("SELECT * FROM attendance WHERE studentId = :studentId ORDER BY date DESC")
    fun getAttendanceForStudent(studentId: String): Flow<List<AttendanceEntity>>

    @Query("SELECT * FROM attendance WHERE synced = 0")
    suspend fun getUnsyncedAttendance(): List<AttendanceEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAttendance(record: AttendanceEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAttendanceList(records: List<AttendanceEntity>)

    @Query("UPDATE attendance SET synced = 1 WHERE attendanceId = :id")
    suspend fun markAttendanceSynced(id: String)
}

@Dao
interface HomeworkDao {
    @Query("SELECT * FROM homework WHERE groupId = :groupId ORDER BY dueDate ASC")
    fun getHomeworkForGroup(groupId: String): Flow<List<HomeworkEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHomework(hw: HomeworkEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHomeworkList(hwList: List<HomeworkEntity>)
}

@Dao
interface GradeDao {
    @Query("SELECT * FROM grades WHERE studentId = :studentId ORDER BY date DESC")
    fun getGradesForStudent(studentId: String): Flow<List<GradeEntity>>

    @Query("SELECT * FROM grades WHERE groupId = :groupId")
    fun getGradesForGroup(groupId: String): Flow<List<GradeEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGrade(grade: GradeEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGrades(grades: List<GradeEntity>)
}

@Dao
interface AssessmentDao {
    @Query("SELECT * FROM assessments WHERE groupId = :groupId ORDER BY date DESC")
    fun getAssessmentsForGroup(groupId: String): Flow<List<AssessmentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAssessment(assessment: AssessmentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAssessments(assessments: List<AssessmentEntity>)
}

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue ORDER BY queueId ASC")
    suspend fun getPendingQueue(): List<SyncQueueEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueue(item: SyncQueueEntity): Long

    @Query("DELETE FROM sync_queue WHERE queueId = :queueId")
    suspend fun removeFromQueue(queueId: Long)

    @Query("DELETE FROM sync_queue")
    suspend fun clearQueue()

    @Query("SELECT COUNT(*) FROM sync_queue")
    fun getPendingCountFlow(): Flow<Int>
}
