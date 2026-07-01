// src/utils/calculator.ts

export interface Criterion {
  id: number | string;
  name: string;
  description?: string;
  weight: number; // Porcentaje de 0 a 100
  score: number; // Puntuación de 0 a 10
  scoreExplanations?: Record<number, string>; // Ej: { 10: 'Obra maestra', 6: 'Decente' }
}

export interface CriteriaPack {
  id: string;
  name: string;
  criteria: Criterion[];
}

export const DEFAULT_PACKS: CriteriaPack[] = [
  {
    id: 'anime_general',
    name: 'Anime General',
    criteria: [
      {
        id: 1,
        name: 'Historia / Guion',
        description: 'Coherencia narrativa, desarrollo de la trama y ritmo.',
        weight: 20,
        score: 0,
        scoreExplanations: {
          10: 'Guion perfecto, sin huecos argumentales',
          8: 'Muy buena historia con detalles menores',
          6: 'La historia está bien pero no destaca',
          4: 'Aburrida o llena de conveniencias',
          2: 'Incoherente total',
        },
      },
      {
        id: 2,
        name: 'Personajes',
        description: 'Profundidad, evolución y carisma del elenco.',
        weight: 15,
        score: 0,
        scoreExplanations: {
          10: 'Evolución magistral y carismáticos',
          8: 'Buenos personajes, empatizas con ellos',
          5: 'Planos pero cumplen su función',
          2: 'Inaguantables o mal escritos',
        },
      },
      {
        id: 3,
        name: 'Final / Resolución',
        description: 'Satisfacción y cierre de los arcos argumentales.',
        weight: 15,
        score: 0,
        scoreExplanations: {
          10: 'Cierre perfecto y memorable',
          7: 'Cierre correcto',
          4: 'Final apresurado o inconcluso',
          0: 'Final arruina toda la serie',
        },
      },
      {
        id: 4,
        name: 'Animación',
        description: 'Calidad visual, fluidez y estilo artístico.',
        weight: 10,
        score: 0,
        scoreExplanations: {
          10: 'Espectáculo visual constante (Nivel película)',
          7: 'Buena animación, algunos bajones',
          5: 'Promedio, cumple',
          2: 'Animación PowerPoint',
        },
      },
      {
        id: 5,
        name: 'Dirección',
        description: 'Cinematografía, encuadres y visión del director.',
        weight: 10,
        score: 0,
        scoreExplanations: {
          10: 'Dirección magistral que eleva la obra',
          7: 'Buena dirección',
          4: 'Dirección plana y aburrida',
        },
      },
      {
        id: 6,
        name: 'Banda Sonora',
        description: 'Música, efectos de sonido y actuación de voz (seiyuus).',
        weight: 10,
        score: 0,
        scoreExplanations: {
          10: 'OST memorable que escucharías a diario',
          7: 'Acompaña muy bien las escenas',
          4: 'Olvidable',
          2: 'Música repetitiva o molesta',
        },
      },
      {
        id: 7,
        name: 'Impacto Emocional',
        description: 'Qué tanto te hizo sentir (risa, llanto, tensión).',
        weight: 5,
        score: 0,
        scoreExplanations: {
          10: 'Me cambió la vida / Lloré / Reí sin parar',
          7: 'Logró emocionarme en momentos clave',
          3: 'No me transmitió nada',
        },
      },
      {
        id: 8,
        name: 'Temáticas',
        description: 'Profundidad de los temas tratados y su ejecución.',
        weight: 5,
        score: 0,
        scoreExplanations: {
          10: 'Trata temas complejos de forma madura',
          5: 'Temas comunes bien llevados',
          2: 'Mensaje contradictorio o superficial',
        },
      },
      {
        id: 9,
        name: 'Originalidad',
        description: 'Creatividad y frescura de la propuesta.',
        weight: 5,
        score: 0,
        scoreExplanations: {
          10: 'Nunca vi algo igual',
          6: 'Toma clichés y los hace bien',
          2: 'Copia descarada',
        },
      },
      {
        id: 10,
        name: 'Disfrute Personal',
        description: 'Factor X. Qué tanto la pasaste bien viéndolo.',
        weight: 5,
        score: 0,
        scoreExplanations: {
          10: 'Mi nuevo anime favorito',
          7: 'Me enganchó bastante',
          4: 'Lo vi por inercia',
          0: 'Fue una tortura terminarlo',
        },
      },
    ],
  },
  {
    id: 'manga_general',
    name: 'Manga General',
    criteria: [
      {
        id: 11,
        name: 'Historia',
        description: 'Trama y desarrollo narrativo.',
        weight: 25,
        score: 0,
        scoreExplanations: { 10: 'Obra maestra narrativa', 5: 'Decente' },
      },
      {
        id: 12,
        name: 'Arte y Dibujo',
        description: 'Detalle de paneles, anatomía y fondos.',
        weight: 25,
        score: 0,
        scoreExplanations: { 10: 'Paneles dignos de museo', 5: 'Dibujo promedio', 1: 'Garabatos' },
      },
      {
        id: 13,
        name: 'Personajes',
        description: 'Desarrollo del elenco principal.',
        weight: 20,
        score: 0,
      },
      {
        id: 14,
        name: 'Panelería / Ritmo',
        description: 'Flujo de lectura y composición de página.',
        weight: 15,
        score: 0,
      },
      {
        id: 15,
        name: 'Disfrute',
        description: 'Factor de enganche general.',
        weight: 15,
        score: 0,
      },
    ],
  },
];

/**
 * Calcula la puntuación final de un anime (0 a 100)
 * basándose en una lista de criterios con pesos (weight) y notas (score).
 */
export const calculateFinalScore = (criteria: Criterion[]): number => {
  if (!criteria || criteria.length === 0) return 0;

  // Validar que la suma de pesos sea aproximadamente 100
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.1) {
    throw new Error('La suma de los pesos de los criterios debe ser 100%');
  }

  // Calcular: Sumatoria de (score * (weight / 100)) * 10
  // Ej: (9 * 0.20) * 10 = 1.8 * 10 = 18 puntos sobre 20 posibles
  const rawScore = criteria.reduce((sum, c) => {
    return sum + c.score * (c.weight / 100);
  }, 0);

  // rawScore está en escala 0-10, lo multiplicamos por 10 para 0-100
  const finalScore = Math.round(rawScore * 10);
  return Math.min(Math.max(finalScore, 0), 100); // Clamping 0-100
};

/**
 * Convierte la puntuación final (0-100) a diferentes escalas de AniList
 */
export const convertToAnilistScale = (
  score100: number,
  scale: 'POINT_100' | 'POINT_10_DECIMAL' | 'POINT_10' | 'POINT_5' | 'POINT_3',
): number => {
  switch (scale) {
    case 'POINT_100':
      return score100;
    case 'POINT_10_DECIMAL':
      return Math.round(score100) / 10;
    case 'POINT_10':
      return Math.round(score100 / 10);
    case 'POINT_5':
      // 0-100 -> 0-5
      // 0-20 -> 1, 21-40 -> 2, etc. (Ejemplo aproximado, AniList usa stars)
      return Math.max(1, Math.round(score100 / 20));
    case 'POINT_3':
      // 1-3 (Smiley faces)
      if (score100 < 35) return 1;
      if (score100 < 75) return 2;
      return 3;
    default:
      return score100;
  }
};
