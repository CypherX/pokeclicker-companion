const isRunning = ko.observable(false);
const simulationResult = ko.observable(null);
const selectedAttemptValue = ko.observable(1);

selectedAttemptValue.subscribe((value) => {
    const totalAttempts = simulationResult()?.attempts.length ?? 0;
    if (isNaN(value) || value < 1 || value > totalAttempts) {
        selectedAttemptValue(1);
    }
});

const selectedAttempt = ko.pureComputed(() => {
    const result = simulationResult();
    if (!result) {
        return null;
    }

    const selectedAttempt = selectedAttemptValue() ?? 1;
    return result.attempts?.[selectedAttempt - 1];
});

const progressCurrentAttempt = ko.observable(0);
const progressTotalAttempts = ko.observable(0);

const settings = {
    xAttackEnabled: ko.observable(false),
    activeFlutes: ko.observableArray([]),
    allFlutesToggle: ko.observable(false),
    simulationAttempts: ko.observable(1),
    targetStage: ko.observable(0),
};

settings.allFlutesToggle.subscribe((value) => {
    if (value) {
        settings.activeFlutes(Object.values(GameConstants.FluteItemType));
    } else {
        settings.activeFlutes([]);
    }
});

settings.simulationAttempts.subscribe((value) => {
    if (isNaN(value) || value < 1 || !value?.length) {
        settings.simulationAttempts(1);
    }
});

settings.targetStage.subscribe((value) => {
    if (isNaN(value) || value < 1 || !value?.length) {
        settings.targetStage(0);
    }
});

const runSimulation = async () => {
    if (isRunning()) {
        return;
    }

    isRunning(true);
    simulationResult(null);
    selectedAttemptValue(1);
    progressTotalAttempts(+settings.simulationAttempts());
    await Util.sleep(0);

    // Toggle xAttack, flutes
    player.effectList['xAttack'](settings.xAttackEnabled() ? 1 : 0);
    Object.values(GameConstants.FluteItemType).forEach((flute) => {
        toggleFlute(flute, settings.activeFlutes().includes(flute));
    });

    const highestStage = SaveData.file()?.save?.statistics?.battleFrontierHighestStageCompleted ?? 1;
    const result = await runShit(+settings.simulationAttempts(), highestStage, +settings.targetStage());

    console.log(result);
    simulationResult(result);
    selectedAttemptValue(result.bestAttempt + 1);

    player.effectList['xAttack'](0);
    Object.values(GameConstants.FluteItemType).forEach((flute) => {
        toggleFlute(flute, false);
    });

    isRunning(false);
    progressCurrentAttempt(0);
    progressTotalAttempts(0);
};

const runShit = async function (attempts = 1, highestStage = 1, targetStage = 0) {
    const timeLimit = GameConstants.GYM_TIME / 1000;
    const highestRegion = player.highestRegion();
    const gemTypes = GameHelper.enumNumbers(PokemonType).filter(type => type !== PokemonType.None);

    const damageCache = new Float64Array(1 << 10); 
    for (let a = 0; a <= 17; a++) {
        for (let b = -1; b <= 17; b++) {
            const key = ((a + 1) << 5) | (b + 1);
            damageCache[key] = App.game.party.calculatePokemonAttack(a, b, true, GameConstants.Region.none, false, false, WeatherType.Clear);
        }
    }

    const maxPrecalcStage = targetStage || highestStage + 10000;

    const healthCache = new Float64Array(maxPrecalcStage);
    const gemRewardCache = new Uint32Array(maxPrecalcStage);
    for (let i = 1; i <= maxPrecalcStage; i++) {
        healthCache[i] = calcHealth(i);
        gemRewardCache[i] = calcGemReward(i);
    }

    buildPokemonPool();

    const pool = pokemonRegionPool[highestRegion];
    const flatTypePool = [];
    pool.baseIds.forEach(id => pool.byBaseId.get(id).forEach(p => {
        const t1 = p.type[0];
        const t2 = p.type[1] ?? PokemonType.None;
        flatTypePool.push(((t1 + 1) << 5) | (t2 + 1));
    }));
    const typePoolArray = new Uint16Array(flatTypePool);
    const poolLength = typePoolArray.length;

    const result = {
        attempts: [],
        totalCalcTime: performance.now(),
        settings: { attempts, highestStage, targetStage },
        averageStageReached: 0,
        lowestStageReached: 0,
        highestStageReached: 0,
        averageGems: Object.fromEntries([...gemTypes].map(type => [type, 0])),
        averageRunTime: 0,
        averageFullRunTime: 0,
        bestAttempt: 0,
        worstAttempt: 0,
    };

    for (let attempt = 1; attempt <= attempts; attempt++) {
        const attemptResult = {
            gemsEarned: new Uint32Array(18),
            calcTime: performance.now(),
            stageReached: 0,
            totalSeconds: 0,
            defeatSeconds: 0,
        };

        if (attempt % 1000 === 0) {
            progressCurrentAttempt(attempt);
            await Util.sleep(0);
        }

        let currentStage = 1;
        let runOver = false;

        for (;; currentStage++) {
            let stageSeconds = 0;

            for (let i = 0; i < 3; i++) {
                const typeKey = typePoolArray[Math.floor(Math.random() * poolLength)];
                const damage = damageCache[typeKey];
                const t1 = (typeKey >> 5) - 1;
                const t2 = (typeKey & 31) - 1;
                const gemReward = gemRewardCache[currentStage];

                let seconds = Math.ceil(healthCache[currentStage] / damage);
                if (seconds < 1) seconds = 1;
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

            if ((stageSeconds > timeLimit && targetStage === 0) || (targetStage > 0 && currentStage >= targetStage)) {
                break;
            }
        }

        attemptResult.calcTime = performance.now() - attemptResult.calcTime;
        result.attempts.push(attemptResult);
    }

    result.totalCalcTime = performance.now() - result.totalCalcTime;

    // prepare results

    const attemptCount = result.attempts.length;
    let sumStages = 0, bestStage = -Infinity, worstStage = Infinity;
    let sumRunTime = 0, sumFullRunTime = 0;
    let bestAttemptIdx = 0, worstAttemptIdx = 0;

    const gemTotals = Object.fromEntries(gemTypes.map(type => [type, 0]));

    for (let i = 0; i < attemptCount; i++) {
        const attempt = result.attempts[i];

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
    }

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

const pokemonRegionPool = {};
const buildPokemonPool = () => {
    if (Object.keys(pokemonRegionPool).length) {
        return;
    }

    for (let region = 0; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
        const regionPokemon = pokemonList.filter(p => p.id > 0 && p.nativeRegion <= region && p.nativeRegion > GameConstants.Region.none);
        const baseIds = [...new Set(regionPokemon.map(p => Math.floor(p.id)))];

        pokemonRegionPool[region] = {
            baseIds,
            byBaseId: new Map(),
        };

        for (const id of baseIds) {
            pokemonRegionPool[region].byBaseId.set(id, regionPokemon.filter(p => Math.floor(p.id) === id));
        }
    }
};

const getEnemy = (highestRegion) => {
    const pool = pokemonRegionPool[highestRegion];
    const id = Rand.fromArray(pool.baseIds);
    return Rand.fromArray(pool.byBaseId.get(id));
};

const calcHealth = (stage) => {
    // ref: PokemonFactory.routeHealth
    const routeNum = MapHelper.normalizeRoute(stage + 10, GameConstants.Region.none);
    return Math.max(20, Math.floor(Math.pow((100 * Math.pow(routeNum, 2.2) / 12), 1.15) * (1 + GameConstants.Region.none / 20))) || 20;
};

const calcGemReward = (stage) => Math.ceil(stage / 80);

const toggleFlute = (flute, active) => {
    if (active && !isFluteActive(flute)) {
        player.itemList[flute](0);
        player.effectList[flute](1);
        updateFluteActiveGemTypes();
    }

    if (!active && isFluteActive(flute)) {
        player.effectList[flute](0);
        player.itemList[flute](1);
        updateFluteActiveGemTypes();
    }
}

const isFluteActive = (flute) => {
    return !!player.effectList[flute]();
};

const updateFluteActiveGemTypes = () => {
    FluteEffectRunner.activeGemTypes.removeAll();
    const gemTypes = new Set();
    GameHelper.enumStrings(GameConstants.FluteItemType).forEach(flute => {
        if (isFluteActive(flute)) {
            ItemList[flute].gemTypes.forEach(idx => gemTypes.add(PokemonType[idx]));
        }
    });
    [...gemTypes].forEach(x => FluteEffectRunner.activeGemTypes.push(x));
};

module.exports = {
    isRunning,
    simulationResult,
    selectedAttemptValue,
    selectedAttempt,
    progressCurrentAttempt,
    progressTotalAttempts,
    settings,

    runSimulation,
};