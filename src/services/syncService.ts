import NetInfo from '@react-native-community/netinfo';
import { db } from '../db';
import { syncQueue, scores } from '../db/schema';
import { eq } from 'drizzle-orm';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../api/supabase';

// Esta función debería llamarse cuando la app arranca, o al guardar un nuevo dato.
export const processSyncQueue = async () => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    console.log('SyncService: No hay conexión a internet. La sincronización queda pendiente.');
    return;
  }

  try {
    // Buscar tareas pendientes
    const pendingTasks = await db
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.status, 'pending_upload'));

    if (pendingTasks.length === 0) {
      console.log('SyncService: No hay tareas pendientes.');
      return;
    }

    const token = useAuthStore.getState().anilistToken;
    const anilistUserId = useAuthStore.getState().anilistUserId;

    for (const task of pendingTasks) {
      if (task.action === 'SAVE_SCORE') {
        const payload = JSON.parse(task.payload);
        console.log(`SyncService: Procesando guardado para animeId ${payload.animeId}...`);

        // Supabase guardado en la nube
        if (anilistUserId) {
          const { error } = await supabase.from('scores').upsert(
            {
              anilist_user_id: anilistUserId,
              anime_id: payload.animeId,
              final_score: payload.finalScore,
              breakdown: payload.breakdown,
              pack_id: payload.packId,
              pack_snapshot: payload.packSnapshot,
            },
            { onConflict: 'anilist_user_id, anime_id' },
          );

          if (error) {
            console.error('SyncService: Error guardando en Supabase', error);
          } else {
            console.log('SyncService: Sincronizado con Supabase correctamente.');
          }
        }

        // Si tuvo éxito, actualizar estado en la cola local
        await db.update(syncQueue).set({ status: 'synced' }).where(eq(syncQueue.id, task.id));
        console.log(`SyncService: Tarea ${task.id} sincronizada con éxito.`);
      } else if (task.action === 'SYNC_CRITERIA') {
        console.log(`SyncService: Procesando sincronización de criterios...`);
        await uploadCriteriaConfig();
        await db.update(syncQueue).set({ status: 'synced' }).where(eq(syncQueue.id, task.id));
      }
    }
  } catch (error) {
    console.error('SyncService: Error procesando la cola', error);
  }
};

export const uploadCriteriaConfig = async () => {
  const anilistUserId = useAuthStore.getState().anilistUserId;
  if (!anilistUserId) return;

  try {
    const { criteriaPacks, criteriaItems } = await import('../db/schema');

    // Obtener todos los packs locales
    const packs = await db.select().from(criteriaPacks);
    const items = await db.select().from(criteriaItems);

    const configPayload = {
      packs,
      items,
    };

    const { error } = await supabase.from('user_settings').upsert(
      {
        anilist_user_id: anilistUserId.toString(), // ensuring string format
        criteria_config: configPayload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'anilist_user_id' },
    );

    if (error) {
      console.error('SyncService: Error subiendo criteria config a Supabase', error);
    } else {
      console.log('SyncService: Criteria config subido exitosamente.');
    }
  } catch (err) {
    console.error('SyncService: Error en uploadCriteriaConfig', err);
  }
};

export const downloadCriteriaConfig = async () => {
  const anilistUserId = useAuthStore.getState().anilistUserId;
  if (!anilistUserId) return;

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('criteria_config')
      .eq('anilist_user_id', anilistUserId.toString())
      .single();

    if (error || !data || !data.criteria_config) {
      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows found
        console.error('SyncService: Error descargando config', error);
      }
      return; // No config to download
    }

    const config = data.criteria_config;
    if (config && Array.isArray(config.packs) && Array.isArray(config.items)) {
      const { criteriaPacks, criteriaItems } = await import('../db/schema');

      // Eliminar actuales y reemplazar con la nube
      await db.delete(criteriaItems);
      await db.delete(criteriaPacks);

      for (const pack of config.packs) {
        if (pack.updatedAt && typeof pack.updatedAt === 'string') {
          pack.updatedAt = new Date(pack.updatedAt);
        }
        await db.insert(criteriaPacks).values(pack);
      }
      for (const item of config.items) {
        await db.insert(criteriaItems).values(item);
      }
      console.log('SyncService: Criterios sincronizados desde la nube exitosamente.');
    }
  } catch (err) {
    console.error('SyncService: Error en downloadCriteriaConfig', err);
  }
};
