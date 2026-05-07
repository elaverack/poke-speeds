/** Pokémon Champions–style non-HP Speed at level 50 (IV fixed at 31, Speed SP 0–32). */
export function championsSpeedStat(
  baseSpe: number,
  speedSP: number,
  natureMult: number,
  level = 50,
  iv = 31,
): number {
  const inner = Math.floor(((2 * baseSpe + iv + speedSP) * level) / 100);
  return Math.floor((inner + 5) * natureMult);
}

export type ChampionsSpeedRange = {
  minNegativeNature: number;
  minNeutralNature: number;
  maxNeutralNature: number;
  maxPositiveNature: number;
};

export function championsSpeedRange(baseSpe: number): ChampionsSpeedRange {
  return {
    minNegativeNature: championsSpeedStat(baseSpe, 0, 0.9),
    minNeutralNature: championsSpeedStat(baseSpe, 0, 1),
    maxNeutralNature: championsSpeedStat(baseSpe, 32, 1),
    maxPositiveNature: championsSpeedStat(baseSpe, 32, 1.1),
  };
}
