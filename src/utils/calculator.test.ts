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
    const criterios: Criterion[] = [{ id: 1, name: 'Historia', weight: 50, score: 10 }];
    expect(() => calculateFinalScore(criterios)).toThrowError();
  });

  it('casos extremos: todos 0', () => {
    const criterios: Criterion[] = [{ id: 1, name: 'A', weight: 100, score: 0 }];
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

import { autoBalanceSliders } from './calculator';

describe('autoBalanceSliders', () => {
  it('should not change items if total is already 100', () => {
    const items = [
      { id: 1, weight: 50 },
      { id: 2, weight: 50 },
    ];
    const balanced = autoBalanceSliders(items);
    expect(balanced).toEqual(items);
  });

  it('should not change items if all are locked', () => {
    const items = [
      { id: 1, weight: 60, locked: true },
      { id: 2, weight: 60, locked: true },
    ];
    const balanced = autoBalanceSliders(items);
    expect(balanced).toEqual(items); // Total is 120, but locked, so no change
  });

  it('should distribute missing percent proportionally among unlocked items', () => {
    const items = [
      { id: 1, weight: 40, locked: true },
      { id: 2, weight: 20 }, // 33.3% of unlocked
      { id: 3, weight: 40 }, // 66.6% of unlocked
    ];
    // Total is 100 currently, let's lower one so total is 80 (diff = +20)
    items[0].weight = 20;

    // Now total is 80, missing 20.
    // Unlocked total = 60.
    // id:2 should get (20/60)*20 = ~7 => 27
    // id:3 should get (40/60)*20 = ~13 => 53
    // Total = 20 + 27 + 53 = 100

    const balanced = autoBalanceSliders(items);

    const total = balanced.reduce((sum, i) => sum + i.weight, 0);
    expect(total).toBe(100);
    expect(balanced[0].weight).toBe(20); // Locked, unchanged
    expect(balanced[1].weight).toBe(27);
    expect(balanced[2].weight).toBe(53);
  });

  it('should remove excess percent proportionally among unlocked items', () => {
    const items = [
      { id: 1, weight: 50 },
      { id: 2, weight: 50 },
      { id: 3, weight: 20, locked: true },
    ];
    // Total is 120, diff is -20.
    // Unlocked total = 100.
    // id:1 gets (50/100)*(-20) = -10 => 40
    // id:2 gets (50/100)*(-20) = -10 => 40
    // id:3 locked => 20

    const balanced = autoBalanceSliders(items);

    const total = balanced.reduce((sum, i) => sum + i.weight, 0);
    expect(total).toBe(100);
    expect(balanced[0].weight).toBe(40);
    expect(balanced[1].weight).toBe(40);
    expect(balanced[2].weight).toBe(20);
  });
});
