package com.yalladars.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.yalladars.app.data.model.*

@Database(
    entities = [
        UserEntity::class,
        GroupEntity::class,
        GroupMemberEntity::class,
        ParentStudentEntity::class,
        AttendanceEntity::class,
        HomeworkEntity::class,
        AssessmentEntity::class,
        GradeEntity::class,
        AnnouncementEntity::class,
        StudentNoteEntity::class,
        JoinRequestEntity::class,
        SyncQueueEntity::class
    ],
    version = 2,
    exportSchema = false
)
abstract class YallaDarsDatabase : RoomDatabase() {

    abstract fun groupDao(): GroupDao
    abstract fun attendanceDao(): AttendanceDao
    abstract fun homeworkDao(): HomeworkDao
    abstract fun gradeDao(): GradeDao
    abstract fun assessmentDao(): AssessmentDao
    abstract fun syncQueueDao(): SyncQueueDao

    companion object {
        @Volatile
        private var INSTANCE: YallaDarsDatabase? = null

        fun getDatabase(context: Context): YallaDarsDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    YallaDarsDatabase::class.java,
                    "yalladars_offline_db"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
