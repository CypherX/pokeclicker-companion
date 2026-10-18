import { bindAllFlutesToggle, deactivateAllFlutes, setActiveFlutes } from './flutes';
import * as SaveData from './save';
import { sleep } from './util';

interface AttemptResult {
    /** Gems earned, indexed by PokemonType */
    gemsEarned: Uint32Array;
    calcTime: number;
    /** Stage the run was lost on, or the target stage if it was reached without losing */
    stageReached: number;
    /** Time to play every stage up to the target (or to the loss, without a target) */
    totalSeconds: number;
    /** Time until the run was lost, or until the target stage was cleared */
    defeatSeconds: number;
}

interface SimulationResult {
    attempts: AttemptResult[];
    totalCalcTime: number;
    settings: { attempts: number; highestStage: number; targetStage: number };
    averageStageReached: number;
    lowestStageReached: number;
    highestStageReached: number;
    averageGems: Record<number, number>;
    averageRunTime: number;
    averageFullRunTime: number;
    bestAttempt: number;
    worstAttempt: number;
}

export const isRunning = ko.observable(false);
export const simulationResult = ko.observable<SimulationResult | null>(null);
/** 1-based index of the attempt shown in detail; bound to a text input */
export const selectedAttemptValue = ko.observable<number | string>(1);
export const progressCurrentAttempt = ko.observable(0);
export const progressTotalAttempts = ko.observable(0);

export const settings = {
    xAttackEnabled: ko.observable(false),
    activeFlutes: ko.observableArray<GameConstants.FluteItemType>([]),
    allFlutesToggle: ko.observable(false),
    /** Bound to text inputs, so these may hold strings */
    simulationAttempts: ko.observable<number | string>(1),
    targetStage: ko.observable<number | string>(0),
};

export const selectedAttempt = ko.pureComputed(() => {
    const result = simulationResult();
    if (!result) {
        return null;
    }

    const selected = +(selectedAttemptValue() ?? 1);
    return result.attempts?.[selected - 1];
});

selectedAttemptValue.subscribe((value) => {
    const totalAttempts = simulationResult()?.attempts.length ?? 0;
    if (isNaN(+value) || +value < 1 || +value > totalAttempts) {
        selectedAttemptValue(1);
    }
});

bindAllFlutesToggle(settings.allFlutesToggle, settings.activeFlutes);

settings.simulationAttempts.subscribe((value) => {
    if (isNaN(+value) || +value < 1 || !(value as string)?.length) {
        settings.simulationAttempts(1);
    }
});

settings.targetStage.subscribe((value) => {
    if (isNaN(+value) || +value < 1 || !(value as string)?.length) {
        settings.targetStage(0);
    }
});

/** The game's Power Herb only applies in the Battle Frontier, so force it on while simulating */
const setPowerHerbActive = (active: boolean) => {
    ItemList.Power_Herb.applyCondition = () => active;
    App.game.party.caughtPokemon.forEach(p => {
        if (p.heldItem() === ItemList.Power_Herb) {
            p.heldItem.valueHasMutated!();
        }
    });
};

export const runSimulation = async (): Promise<void> => {
    if (isRunning()) {
        return;
    }

    isRunning(true);
    simulationResult(null);
    selectedAttemptValue(1);
    progressTotalAttempts(+settings.simulationAttempts());
    await sleep(0);

    player.effectList['xAttack'](settings.xAttackEnabled() ? 1 : 0);
    setActiveFlutes(settings.activeFlutes());
    setPowerHerbActive(true);

    const highestStage = SaveData.file()?.save?.statistics?.battleFrontierHighestStageCompleted ?? 1;
    const result = await simulate(+settings.simulationAttempts(), highestStage, +settings.targetStage());

    setPowerHerbActive(false);

    console.log(result);
    simulationResult(result);
    selectedAttemptValue(result.bestAttempt + 1);

    player.effectList['xAttack'](0);
    deactivateAllFlutes();

    isRunning(false);
    progressCurrentAttempt(0);
    progressTotalAttempts(0);
};

/* ------------------------------------------------------------------ */
/* Simulation                                                         */
/* ------------------------------------------------------------------ */

/** Packs a type pair into a small integer key: (type1 + 1) << 5 | (type2 + 1) */
const typeKey = (type1: PokemonType, type2: PokemonType) => ((type1 + 1) << 5) | (type2 + 1);

// ref: PokemonFactory.routeHealth
const calcHealth = (stage: number): number => {
    const routeNum = MapHelper.normalizeRoute(stage + 10, GameConstants.Region.none);
    return Math.max(20, Math.floor(Math.pow((100 * Math.pow(routeNum, 2.2) / 12), 1.15) * (1 + GameConstants.Region.none / 20))) || 20;
};

const calcGemReward = (stage: number): number => Math.ceil(stage / 80);

/**
 * Party damage against every enemy type pair, indexed by typeKey. Gives the same values as the
 * game's Battle Frontier, which calls App.game.party.calculatePokemonAttack for each enemy.
 *
 * Calling that for all 342 type pairs runs the game's per-pokémon attack formula for the whole
 * party each time. Enemy types only affect that formula through TypeHelper.getAttackModifier, so
 * instead each pokémon's attack is calculated once, against a typeless enemy, and summed by the
 * pokémon's types. Each type pair's damage is then those sums times their type modifiers.
 */
const calcPartyDamageByType = (): Float64Array => {
    const party = App.game.party;

    const attackByPartyTypes = new Map<number, { type1: PokemonType; type2: PokemonType; attack: number }>();
    for (const pokemon of party.caughtPokemon) {
        const attack = party.calculateOnePokemonAttack(pokemon, PokemonType.None, PokemonType.None, GameConstants.Region.none, true, false, false, WeatherType.Clear);
        if (attack === 0) {
            continue;
        }

        const { type1, type2 } = PokemonHelper.getPokemonByName(pokemon.name);
        const key = typeKey(type1, type2);
        const group = attackByPartyTypes.get(key);
        if (group) {
            group.attack += attack;
        } else {
            attackByPartyTypes.set(key, { type1, type2, attack });
        }
    }

    const groups = [...attackByPartyTypes.values()];
    const bonus = party.multiplier.getBonus('pokemonAttack');
    const damage = new Float64Array(1 << 10);
    for (let enemyType1 = 0; enemyType1 <= 17; enemyType1++) {
        for (let enemyType2 = -1; enemyType2 <= 17; enemyType2++) {
            let attack = 0;
            for (const group of groups) {
                attack += group.attack * TypeHelper.getAttackModifier(group.type1, group.type2, enemyType1, enemyType2);
            }
            damage[typeKey(enemyType1, enemyType2)] = Math.round(attack * bonus);
        }
    }
    return damage;
};

/** Battle Frontier enemies by highest region: base pokémon ids, and their forms by base id */
const pokemonRegionPool: Record<number, { baseIds: number[]; byBaseId: Map<number, PokemonListData[]> }> = {};
const buildPokemonPool = () => {
    if (Object.keys(pokemonRegionPool).length) {
        return;
    }

    for (let region = 0; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
        const regionPokemon = pokemonList.filter(p => p.id > 0 && p.nativeRegion <= region && p.nativeRegion > GameConstants.Region.none);
        const baseIds = [...new Set(regionPokemon.map(p => Math.floor(p.id)))];

        const byBaseId = new Map<number, PokemonListData[]>();
        for (const id of baseIds) {
            byBaseId.set(id, regionPokemon.filter(p => Math.floor(p.id) === id));
        }

        pokemonRegionPool[region] = { baseIds, byBaseId };
    }
};

const simulate = async (attempts = 1, highestStage = 1, targetStage = 0): Promise<SimulationResult> => {
    const timeLimit = GameConstants.GYM_TIME / 1000;
    const highestRegion = player.highestRegion();
    const gemTypes = GameHelper.enumNumbers(PokemonType).filter(type => type !== PokemonType.None);

    const damageCache = calcPartyDamageByType();

    // Precalculate stage values, indexed by stage. Stages past the cache are calculated as needed,
    // inline in the loop: helper functions there make Firefox ~30% slower.
    const maxPrecalcStage = targetStage || highestStage + 10000;

    const healthCache = new Float64Array(maxPrecalcStage + 1);
    const gemRewardCache = new Uint32Array(maxPrecalcStage + 1);
    for (let i = 1; i <= maxPrecalcStage; i++) {
        healthCache[i] = calcHealth(i);
        gemRewardCache[i] = calcGemReward(i);
    }

    buildPokemonPool();

    // Like the game's pokemonMap.randomRegion, enemies are picked by species first and then by form,
    // so species with many forms (e.g. Alcremie, Magikarp) aren't over-represented.
    // Only types matter here, and most species' forms all share the same types, so each species
    // stores its type key directly. Species whose forms differ store MIXED_TYPES, and their forms'
    // type keys are stored contiguously in formTypeKeys.
    const MIXED_TYPES = 0xFFFF;
    const pool = pokemonRegionPool[highestRegion];
    const speciesCount = pool.baseIds.length;
    const speciesTypeKey = new Uint16Array(speciesCount);
    const formStart = new Uint32Array(speciesCount);
    const formCount = new Uint32Array(speciesCount);
    const typeKeys: number[] = [];
    pool.baseIds.forEach((id, species) => {
        const keys = pool.byBaseId.get(id)!.map(p => typeKey(p.type[0], p.type[1] ?? PokemonType.None));
        speciesTypeKey[species] = keys.every(key => key === keys[0]) ? keys[0] : MIXED_TYPES;
        formStart[species] = typeKeys.length;
        formCount[species] = keys.length;
        typeKeys.push(...keys);
    });
    const formTypeKeys = new Uint16Array(typeKeys);

    const result: SimulationResult = {
        attempts: [],
        totalCalcTime: performance.now(),
        settings: { attempts, highestStage, targetStage },
        averageStageReached: 0,
        lowestStageReached: 0,
        highestStageReached: 0,
        averageGems: Object.fromEntries(gemTypes.map(type => [type, 0])),
        averageRunTime: 0,
        averageFullRunTime: 0,
        bestAttempt: 0,
        worstAttempt: 0,
    };

    for (let attempt = 1; attempt <= attempts; attempt++) {
        const attemptResult: AttemptResult = {
            gemsEarned: new Uint32Array(18),
            calcTime: performance.now(),
            stageReached: 0,
            totalSeconds: 0,
            defeatSeconds: 0,
        };

        if (attempt % 1000 === 0) {
            progressCurrentAttempt(attempt);
            await sleep(0);
        }

        let runOver = false;

        for (let currentStage = 1; ; currentStage++) {
            const health = currentStage <= maxPrecalcStage ? healthCache[currentStage] : calcHealth(currentStage);
            const gemReward = currentStage <= maxPrecalcStage ? gemRewardCache[currentStage] : calcGemReward(currentStage);
            let stageSeconds = 0;

            for (let i = 0; i < 3; i++) {
                // One random number picks both: the integer part is the species, and the
                // remaining fraction is uniform in [0, 1), so it picks the form
                const r = Math.random() * speciesCount;
                const species = r | 0;
                let enemyTypeKey = speciesTypeKey[species];
                if (enemyTypeKey === MIXED_TYPES) {
                    enemyTypeKey = formTypeKeys[formStart[species] + (((r - species) * formCount[species]) | 0)];
                }
                const damage = damageCache[enemyTypeKey];
                const t1 = (enemyTypeKey >> 5) - 1;
                const t2 = (enemyTypeKey & 31) - 1;

                let seconds = Math.ceil(health / damage);
                if (seconds < 1) seconds = 1;
                // Stages already completed are battled at double speed
                if (currentStage <= highestStage) seconds *= 0.5;

                const newTotal = stageSeconds + seconds;

                if (newTotal <= timeLimit) {
                    attemptResult.gemsEarned[t1] += t2 === PokemonType.None ? gemReward * 2 : gemReward;
                    if (t2 !== PokemonType.None) {
                        attemptResult.gemsEarned[t2] += gemReward;
                    }
                }

                stageSeconds = newTotal;
            }

            attemptResult.totalSeconds += stageSeconds;

            if (!runOver && stageSeconds > timeLimit) {
                runOver = true;
                attemptResult.stageReached = currentStage;
                attemptResult.defeatSeconds = attemptResult.totalSeconds;
            }

            // Without a target the run ends on the first loss; with one, keep going to see the full run
            if ((stageSeconds > timeLimit && targetStage === 0) || (targetStage > 0 && currentStage >= targetStage)) {
                break;
            }
        }

        if (!runOver) {
            attemptResult.stageReached = targetStage;
            attemptResult.defeatSeconds = attemptResult.totalSeconds;
        }

        attemptResult.calcTime = performance.now() - attemptResult.calcTime;
        result.attempts.push(attemptResult);
    }

    result.totalCalcTime = performance.now() - result.totalCalcTime;

    // Summarise the attempts
    const attemptCount = result.attempts.length;
    let sumStages = 0, bestStage = -Infinity, worstStage = Infinity;
    let sumRunTime = 0, sumFullRunTime = 0;
    let bestAttemptIdx = 0, worstAttemptIdx = 0;

    const gemTotals: Record<number, number> = Object.fromEntries(gemTypes.map(type => [type, 0]));

    result.attempts.forEach((attempt, i) => {
        const stageReached = attempt.stageReached;
        sumStages += stageReached;

        if (stageReached > bestStage) {
            bestStage = stageReached;
            bestAttemptIdx = i;
        }

        if (stageReached < worstStage) {
            worstStage = stageReached;
            worstAttemptIdx = i;
        }

        sumRunTime += attempt.defeatSeconds;
        if (targetStage > 0) {
            sumFullRunTime += attempt.totalSeconds;
        }

        for (const type of gemTypes) {
            gemTotals[type] += attempt.gemsEarned[type];
        }
    });

    result.averageStageReached = Math.floor(sumStages / attemptCount);
    result.highestStageReached = bestStage;
    result.lowestStageReached = worstStage;

    for (const type of gemTypes) {
        result.averageGems[type] = Math.floor(gemTotals[type] / attemptCount);
    }

    result.averageRunTime = Math.floor(sumRunTime / attemptCount);
    if (targetStage > 0) {
        result.averageFullRunTime = Math.floor(sumFullRunTime / attemptCount);
    }

    result.bestAttempt = bestAttemptIdx;
    result.worstAttempt = worstAttemptIdx;

    return result;
};
