/**
 * Breeding efficiency math, mirroring the game's PartyPokemon calculations.
 * Shared by the Vitamin Tracker and the optimal vitamin data generator (tools/updateData.ts).
 */

export type VitaminCounts = [protein: number, calcium: number, carbos: number];

const { VitaminType } = GameConstants;

export const getBreedingAttackBonus = (vitaminsUsed: VitaminCounts, baseAttack: number): number => {
    const attackBonusPercent = (GameConstants.BREEDING_ATTACK_BONUS + vitaminsUsed[VitaminType.Calcium]) / 100;
    const proteinBoost = vitaminsUsed[VitaminType.Protein];
    return (baseAttack * attackBonusPercent) + proteinBoost;
};

export const calcEggSteps = (vitaminsUsed: VitaminCounts, eggCycles: number): number => {
    const div = 300;
    const extraCycles = (vitaminsUsed[VitaminType.Calcium] + vitaminsUsed[VitaminType.Protein]) / 2;
    const steps = (eggCycles + extraCycles) * GameConstants.EGG_CYCLE_MULTIPLIER;
    return steps <= div ? steps : Math.round(((steps / div) ** (1 - vitaminsUsed[VitaminType.Carbos] / 70)) * div);
};

export const getBreedingEfficiency = (vitaminsUsed: VitaminCounts, baseAttack: number, eggCycles: number): number => {
    return (getBreedingAttackBonus(vitaminsUsed, baseAttack) / calcEggSteps(vitaminsUsed, eggCycles)) * GameConstants.EGG_CYCLE_MULTIPLIER;
};

/**
 * Brute-forces the most efficient vitamin spread for a pokémon, using the vitamins
 * available by the given region (5 per region, Calcium from Hoenn, Carbos from Unova).
 * Ties go to the last spread found.
 */
export const getBestVitamins = (pokemon: { attack: number; eggCycles: number }, region: GameConstants.Region) => {
    const { attack: baseAttack, eggCycles } = pokemon;
    let res = {
        protein: 0,
        calcium: 0,
        carbos: 0,
        eff: getBreedingEfficiency([0, 0, 0], baseAttack, eggCycles),
    };

    const totalVitamins = (region + 1) * 5;
    let carbos = (region >= GameConstants.Region.unova ? totalVitamins : 0) + 1;
    while (carbos-- > 0) {
        let calcium = (region >= GameConstants.Region.hoenn ? totalVitamins - carbos : 0) + 1;
        while (calcium-- > 0) {
            let protein = (totalVitamins - (carbos + calcium)) + 1;
            while (protein-- > 0) {
                const eff = getBreedingEfficiency([protein, calcium, carbos], baseAttack, eggCycles);
                // Efficiency only drops from here as protein decreases
                if (eff < res.eff) break;
                res = { protein, calcium, carbos, eff };
            }
        }
    }
    return res;
};
