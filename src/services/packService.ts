import { db } from '../db';
import { criteriaPacks, criteriaItems } from '../db/schema';
import { DEFAULT_PACKS } from '../utils/calculator';
import * as Crypto from 'expo-crypto';

export const getOrSeedPacks = async () => {
  let rows = await db.select().from(criteriaPacks);

  if (rows.length === 0) {
    console.log('Seeding default packs...');
    for (const dp of DEFAULT_PACKS) {
      const packId = Crypto.randomUUID();
      await db.insert(criteriaPacks).values({
        id: packId,
        name: dp.name || 'Pack por defecto',
        description: 'Pack básico del sistema',
        isDefault: true,
        targetTypes:
          dp.id === 'anime_general' ? JSON.stringify(['ANIME']) : JSON.stringify(['MANGA']),
        targetGenres: JSON.stringify([]),
      });

      for (let i = 0; i < dp.criteria.length; i++) {
        const c = dp.criteria[i];
        await db.insert(criteriaItems).values({
          id: Crypto.randomUUID(),
          packId: packId,
          name: c.name,
          description: c.description || '',
          weight: c.weight,
          scoreExplanations: c.scoreExplanations ? JSON.stringify(c.scoreExplanations) : null,
          order: i,
        });
      }
    }
    rows = await db.select().from(criteriaPacks);
  }
  return rows;
};
