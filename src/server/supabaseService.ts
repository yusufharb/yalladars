import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SyncRecordPayload {
  id: string;
  collection: string;
  entityId: string;
  data: any;
  updatedAt: string;
  isDeleted: boolean;
  deletedBy?: string;
  deletedAt?: number;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured = false;

  constructor() {
    this.init();
  }

  public init() {
    const url = process.env.SUPABASE_URL?.trim();
    const key = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.SUPABASE_ANON_KEY
    )?.trim();

    if (url && key) {
      try {
        this.client = createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.isConfigured = true;
        console.log('✅ [Supabase] Connected successfully to Supabase PostgreSQL at:', url);
      } catch (err) {
        console.error('❌ [Supabase] Failed to initialize Supabase client:', err);
        this.client = null;
        this.isConfigured = false;
      }
    } else {
      console.log('ℹ️ [Supabase] SUPABASE_URL / KEY not set. Falling back to local storage file.');
      this.isConfigured = false;
      this.client = null;
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Loads all active records and tombstones from Supabase `yd_sync_records`.
   * Returns null if Supabase is empty or unconfigured.
   */
  public async loadAllState(): Promise<{
    collections: Record<string, any[]>;
    tombstones: any[];
    lastUpdated: number;
  } | null> {
    if (!this.isAvailable() || !this.client) return null;

    try {
      const { data, error } = await this.client
        .from('yd_sync_records')
        .select('*');

      if (error) {
        // Table might not exist yet if user hasn't run schema.sql
        console.warn('⚠️ [Supabase] Could not fetch yd_sync_records:', error.message);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ [Supabase] Database is currently empty in Supabase.');
        return null;
      }

      const collections: Record<string, any[]> = {};
      const tombstones: any[] = [];
      let latestUpdated = 0;

      for (const row of data) {
        const rowUpdated = new Date(row.updated_at).getTime();
        if (rowUpdated > latestUpdated) {
          latestUpdated = rowUpdated;
        }

        if (row.is_deleted) {
          tombstones.push({
            id: row.entity_id,
            entityType: row.collection,
            deletedAt: row.deleted_at || rowUpdated,
            deletedBy: row.deleted_by || undefined,
          });
        } else {
          if (!collections[row.collection]) {
            collections[row.collection] = [];
          }
          if (row.data) {
            collections[row.collection].push(row.data);
          }
        }
      }

      return {
        collections,
        tombstones,
        lastUpdated: latestUpdated > 0 ? latestUpdated : Date.now(),
      };
    } catch (err: any) {
      console.error('❌ [Supabase] Error loading state from Supabase:', err?.message || err);
      return null;
    }
  }

  /**
   * Seeds default database to Supabase on first run.
   */
  public async seedInitialData(database: Record<string, any>): Promise<boolean> {
    if (!this.isAvailable() || !this.client) return false;

    try {
      const rows: any[] = [];
      const collectionsToSeed = [
        'users',
        'teacherProfiles',
        'studentProfiles',
        'groups',
        'members',
        'parentStudents',
        'attendance',
        'homework',
        'assessments',
        'grades',
        'announcements',
        'notes',
        'joinRequests',
        'notifications',
        'auditLogs',
        'reports',
        'payments',
        'materials',
        'badges',
        'quizzes',
        'quizSubmissions',
        'certificates',
        'liveSessions',
        'homeworkSubmissions',
        'assistantPermissions',
      ];

      for (const col of collectionsToSeed) {
        const list = database[col];
        if (Array.isArray(list)) {
          for (const item of list) {
            if (!item) continue;
            const entityId = String(
              item.id ||
              item.groupId ||
              item.teacherId ||
              item.studentId ||
              item.attendanceId ||
              item.homeworkId ||
              item.gradeId ||
              item.paymentId ||
              item.submissionId ||
              item.sessionId ||
              item.materialId ||
              item.badgeId ||
              item.quizId ||
              item.requestId ||
              item.notificationId ||
              item.assistantId ||
              item.permissionId ||
              `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
            );

            rows.push({
              id: `${col}_${entityId}`,
              collection: col,
              entity_id: entityId,
              data: item,
              updated_at: new Date().toISOString(),
              is_deleted: false,
            });
          }
        }
      }

      if (rows.length === 0) return true;

      // Upsert in batches of 100 to avoid payload limits
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error } = await this.client
          .from('yd_sync_records')
          .upsert(batch, { onConflict: 'collection,entity_id' });

        if (error) {
          console.warn('⚠️ [Supabase] Batch upsert warning:', error.message);
        }
      }

      console.log(`✅ [Supabase] Successfully seeded ${rows.length} initial records into Supabase.`);
      return true;
    } catch (err: any) {
      console.error('❌ [Supabase] Seeding error:', err?.message || err);
      return false;
    }
  }

  /**
   * Persists changes into Supabase when client pushes sync changes.
   */
  public async persistChanges(
    changes: Array<{ entityType: string; action: 'upsert' | 'delete'; entityId: string; payload?: any }>,
    tombstones?: Array<{ id: string; entityType: string; deletedAt: number; deletedBy?: string }>
  ): Promise<void> {
    if (!this.isAvailable() || !this.client) return;

    try {
      const upsertRows: any[] = [];

      for (const ch of changes) {
        if (!ch || !ch.entityType || !ch.entityId) continue;
        const isDelete = ch.action === 'delete';
        upsertRows.push({
          id: `${ch.entityType}_${ch.entityId}`,
          collection: ch.entityType,
          entity_id: ch.entityId,
          data: isDelete ? {} : ch.payload || {},
          updated_at: new Date().toISOString(),
          is_deleted: isDelete,
          deleted_at: isDelete ? Date.now() : null,
        });
      }

      if (Array.isArray(tombstones)) {
        for (const t of tombstones) {
          if (!t || !t.entityType || !t.id) continue;
          upsertRows.push({
            id: `${t.entityType}_${t.id}`,
            collection: t.entityType,
            entity_id: t.id,
            data: {},
            updated_at: new Date(t.deletedAt || Date.now()).toISOString(),
            is_deleted: true,
            deleted_by: t.deletedBy || null,
            deleted_at: t.deletedAt || Date.now(),
          });
        }
      }

      if (upsertRows.length === 0) return;

      for (let i = 0; i < upsertRows.length; i += 100) {
        const batch = upsertRows.slice(i, i + 100);
        await this.client
          .from('yd_sync_records')
          .upsert(batch, { onConflict: 'collection,entity_id' });
      }
    } catch (err: any) {
      console.warn('⚠️ [Supabase] Persist changes error (non-fatal):', err?.message || err);
    }
  }
}

export const supabaseService = new SupabaseService();
