/**
 * Party damage against enemy types, mirroring the game's Party.calculatePokemonAttack.
 * Shared by the Battle Calculator, the Battle Frontier Simulator and the type damage grid.
 *
 * The game runs its per-pokémon attack formula for the whole party for every enemy. Enemy types only
 * affect that formula through TypeHelper.getAttackModifier, so instead each pokémon's attack is
 * calculated once, against a typeless enemy, and summed by the pokémon's types. Damage against an
 * enemy is then those sums times their type modifiers.
 *
 * Only use these after SaveData.loadAttackData, as the type modifiers depend on the save's gem upgrades.
 */

/** Number of type keys, as types range from -1 (None) to 17 */
export const TYPE_KEY_COUNT = 19 * 19;

/** Packs a type pair into one integer from 0 to TYPE_KEY_COUNT - 1, usable as an array index */
export const typeKey = (type1: PokemonType, type2: PokemonType): number => (type1 + 1) * 19 + type2 + 1;
export const unpackTypeKey = (key: number): [PokemonType, PokemonType] => [Math.floor(key / 19) - 1, (key % 19) - 1];

/** Region used by the patched Party.getRegionAttackMultiplier during inRegion; -1 otherwise */
let regionMultiplierOverride: number = -1;

// Party.getRegionAttackMultiplier is used internally by App.game.party.calculateOnePokemonAttack, and
// depends on the player's highest region. Override it so calculations can apply the multiplier of
// the region being calculated for, as reaching a region makes it at least the highest region.
const originalGetRegionAttackMultiplier = Party.prototype.getRegionAttackMultiplier;
Party.prototype.getRegionAttackMultiplier = function (this: Party) {
    const region = Math.max(regionMultiplierOverride, player.highestRegion());
    return originalGetRegionAttackMultiplier.call(this, region);
};

/** Runs a calculation with the regional attack debuff challenge's multiplier for the given region */
export const inRegion = <T>(region: GameConstants.Region, calculate: () => T): T => {
    regionMultiplierOverride = region;
    try {
        return calculate();
    } finally {
        regionMultiplierOverride = -1;
    }
};

/** Party attack before type effectiveness, summed for the party pokémon of one type pair */
export interface TypeGroup {
    key: number;
    type1: PokemonType;
    type2: PokemonType;
    attack: number;
}

/**
 * Sums each pokémon's attack against a typeless enemy by its types. Groups are ordered by type1, then
 * type2 with None last, which sets the floating point summation order of the damage.
 * @param attackOf the pokémon's attack against PokemonType.None, e.g. from Party.calculateOnePokemonAttack
 */
export const groupAttackByType = (pokemon: readonly PartyPokemon[], attackOf: (pokemon: PartyPokemon) => number): TypeGroup[] => {
    const attackByKey = new Float64Array(TYPE_KEY_COUNT);
    for (const p of pokemon) {
        const [type1, type2 = PokemonType.None] = pokemonMap[p.name].type;
        attackByKey[typeKey(type1, type2)] += attackOf(p);
    }

    const groups: TypeGroup[] = [];
    const typeOrder = [...GameHelper.enumNumbers(PokemonType).filter(t => t !== PokemonType.None), PokemonType.None];
    for (const type1 of typeOrder) {
        for (const type2 of typeOrder) {
            const key = typeKey(type1, type2);
            if (attackByKey[key] !== 0) {
                groups.push({ key, type1, type2, attack: attackByKey[key] });
            }
        }
    }
    return groups;
};

/**
 * Type modifiers, indexed by party type key * TYPE_KEY_COUNT + enemy type key, -1 when not calculated yet.
 * Gem upgrades don't change once a save is loaded (loading another save reloads the page), but the
 * disable gems challenge can be toggled, so there's a cache for each state.
 */
const modifierCaches: Partial<Record<'gems' | 'noGems', Float64Array>> = {};
const getModifierCache = (): Float64Array => {
    const state = App.game.challenges.list.disableGems.active() ? 'noGems' : 'gems';
    return modifierCaches[state] ??= new Float64Array(TYPE_KEY_COUNT * TYPE_KEY_COUNT).fill(-1);
};

const sumDamage = (groups: readonly TypeGroup[], enemyKey: number, bonus: number, modifiers: Float64Array): number => {
    let attack = 0;
    for (const group of groups) {
        const index = group.key * TYPE_KEY_COUNT + enemyKey;
        let modifier = modifiers[index];
        if (modifier < 0) {
            modifier = modifiers[index] = TypeHelper.getAttackModifier(group.type1, group.type2, ...unpackTypeKey(enemyKey));
        }
        attack += group.attack * modifier;
    }
    return Math.round(attack * bonus);
};

/** The game's party attack multiplier, applied to the summed damage */
export const getAttackBonus = (): number => App.game.party.multiplier.getBonus('pokemonAttack');

/** Party damage against one enemy type pair (packed with typeKey) */
export const calcDamage = (groups: readonly TypeGroup[], enemyKey: number, bonus = getAttackBonus()): number =>
    sumDamage(groups, enemyKey, bonus, getModifierCache());

/** Party damage against every enemy type pair, indexed by typeKey */
export const calcDamageByType = (groups: readonly TypeGroup[]): Float64Array => {
    const bonus = getAttackBonus();
    const modifiers = getModifierCache();
    const damage = new Float64Array(TYPE_KEY_COUNT);
    for (let enemyType1 = 0; enemyType1 <= 17; enemyType1++) {
        for (let enemyType2 = -1; enemyType2 <= 17; enemyType2++) {
            const key = typeKey(enemyType1, enemyType2);
            damage[key] = sumDamage(groups, key, bonus, modifiers);
        }
    }
    return damage;
};
