import NetInfo from '@react-native-community/netinfo';
import { db } from '../db';
import { syncQueue, scores } from '../db/schema';
import { eq } from 'drizzle-orm';
import { useAuthStore } from '../store/useAuthStore';

// Esta función debería llamarse cuando la app arranca, o al guardar un nuevo dato.
export const processSyncQueue = async () => {
  const state = await NetInfo.fetch();
  
  if (!state.isConnected) {
    console.log('SyncService: No hay conexión a internet. La sincronización queda pendiente.');
    return;
  }

  try {
    // Buscar tareas pendientes
    const pendingTasks = await db.select().from(syncQueue).where(eq(syncQueue.status, 'pending_upload'));

    if (pendingTasks.length === 0) {
      console.log('SyncService: No hay tareas pendientes.');
      return;
    }

    const token = useAuthStore.getState().anilistToken;

    for (const task of pendingTasks) {
      if (task.action === 'SAVE_SCORE') {
        const payload = JSON.parse(task.payload);
        console.log(`SyncService: Procesando guardado para animeId ${payload.animeId}...`);

        // Aquí irá la mutación GraphQL a AniList y el guardado en Supabase
        // Mock de llamada a la API
        if (token) {
          // await fetch('https://graphql.anilist.co', { ... })
          // await supabase.from('scores').insert({ ... })
        }

        // Si tuvo éxito, actualizar estado en la cola local
        await db.update(syncQueue).set({ status: 'synced' }).where(eq(syncQueue.id, task.id));
        console.log(`SyncService: Tarea ${task.id} sincronizada con éxito.`);
      }
    }
  } catch (error) {
    console.error('SyncService: Error procesando la cola', error);
  }
};
