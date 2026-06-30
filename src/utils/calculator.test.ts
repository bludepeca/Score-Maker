import { calculateFinalScore, convertToAnilistScale, Criterion } from './calculator';

describe('Calculadora de puntuaciones', () => {
  it('calcula correctamente la puntuación con pesos válidos', () => {
    const criterios: Criterion[] = [
      { id: 1, name: 'Historia', weight: 50, score: 10 },
      { id: 2, name: 'Animación', weight: 50, score: 10 },
    ];
    expect(calculateFinalScore(criterios)).toBe(100);
  });

  it('calcula puntuación intermedia', () => {
    const criterios: Criterion[] = [
      { id: 1, name: 'Historia', weight: 20, score: 9 }, // 9 * 0.20 = 1.8 -> 18
      { id: 2, name: 'Personajes', weight: 15, score: 8 }, // 8 * 0.15 = 1.2 -> 12
      { id: 3, name: 'Final', weight: 15, score: 7 }, // 7 * 0.15 = 1.05 -> 10.5
      { id: 4, name: 'Animación', weight: 50, score: 6 }, // 6 * 0.50 = 3.0 -> 30
    ];
    // Total raw = 1.8 + 1.2 + 1.05 + 3.0 = 7.05
    // Final = 70.5 -> round(70.5) -> 71
    expect(calculateFinalScore(criterios)).toBe(71);
  });

  it('lanza error si los pesos no suman 100', () => {
    const criterios: Criterion[] = [
      { id: 1, name: 'Historia', weight: 50, score: 10 },
    ];
    expect(() => calculateFinalScore(criterios)).toThrowError();
  });

  it('casos extremos: todos 0', () => {
    const criterios: Criterion[] = [
      { id: 1, name: 'A', weight: 100, score: 0 },
    ];
    expect(calculateFinalScore(criterios)).toBe(0);
  });
});

describe('Conversión de escalas AniList', () => {
  it('convierte a 10 puntos decimal', () => {
    expect(convertToAnilistScale(85, 'POINT_10_DECIMAL')).toBe(8.5);
    expect(convertToAnilistScale(100, 'POINT_10_DECIMAL')).toBe(10);
  });

  it('convierte a 10 puntos cerrados', () => {
    expect(convertToAnilistScale(85, 'POINT_10')).toBe(9);
    expect(convertToAnilistScale(84, 'POINT_10')).toBe(8);
  });

  it('convierte a 5 estrellas', () => {
    expect(convertToAnilistScale(100, 'POINT_5')).toBe(5);
    expect(convertToAnilistScale(20, 'POINT_5')).toBe(1);
    expect(convertToAnilistScale(0, 'POINT_5')).toBe(1); // Mínimo 1 estrella
  });
});
