/** Pokémon Champions–style non-HP Speed at level 50 (IV fixed at 31, Speed SP 0–32). */
export function championsSpeedStat(
  baseSpe: number,
  speedSP: number,
  natureMult: number,
  level = 50,
  iv = 31,
): number {
  const baseStatWithSP = Math.floor(((2 * baseSpe + iv) * level) / 100) + 5 + speedSP;
  return Math.floor(baseStatWithSP * natureMult);
}

export type ChampionsSpeedRange = {
  minNegativeNature: number;
  minNeutralNature: number;
  maxNeutralNature: number;
  maxPositiveNature: number;
};

export type SpeedCondition = 'neutral' | 'choicescarf' | 'tailwind' | 'minus1' | 'minus2';

export function championsSpeedRange(baseSpe: number): ChampionsSpeedRange {
  return {
    minNegativeNature: championsSpeedStat(baseSpe, 0, 0.9),
    minNeutralNature: championsSpeedStat(baseSpe, 0, 1),
    maxNeutralNature: championsSpeedStat(baseSpe, 32, 1),
    maxPositiveNature: championsSpeedStat(baseSpe, 32, 1.1),
  };
}

function applyConditionToStat(value: number, condition: SpeedCondition): number {
  switch (condition) {
    case 'neutral':
      return value;
    case 'choicescarf':
      return Math.floor(value * 1.5);
    case 'tailwind':
      return Math.floor(value * 2);
    case 'minus1':
      return Math.floor((value * 2) / 3);
    case 'minus2':
      return Math.floor(value / 2);
  }
}

export function applyConditionToRange(
  range: ChampionsSpeedRange,
  condition: SpeedCondition,
): ChampionsSpeedRange {
  return {
    minNegativeNature: applyConditionToStat(range.minNegativeNature, condition),
    minNeutralNature: applyConditionToStat(range.minNeutralNature, condition),
    maxNeutralNature: applyConditionToStat(range.maxNeutralNature, condition),
    maxPositiveNature: applyConditionToStat(range.maxPositiveNature, condition),
  };
}
