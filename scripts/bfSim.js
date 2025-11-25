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

const attemptOptions = ko.pureComputed(() => {
    return simulationResult()?.attempts.map((attempt, i) => ({
        label: `Attempt #${i + 1} Results`,
        value: attempt,
    }));
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
    if (settings.xAttackEnabled) {
        player.effectList['xAttack'](1);
    }
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
    const damageCache = new Map();
    buildPokemonPool();

    const result = {
        attempts: [],
        totalCalcTime: performance.now(),
        settings: {
            attempts,
            highestStage,
            targetStage,
        },
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
            gemsEarned: Object.fromEntries([...gemTypes].map(type => [type, 0])),
            calcTime: performance.now(),
            stageReached: 0,
            totalSeconds: 0,
            defeatSeconds: 0,
        };

        let runOver = false;

        if (attempt % 100 === 0) {
            progressCurrentAttempt(attempt);
            await Util.sleep(0);
        }

        for (let currentStage = 1; ; currentStage++) {
            let stageSeconds = 0;

            for (let pokemonIndex = 0; pokemonIndex < 3; pokemonIndex++) {
                const enemy = getEnemy(highestRegion);
                const t1 = enemy.type[0];
                const t2 = enemy.type[1] ?? PokemonType.None;
                const hp = getHealth(currentStage);
                const gemReward = getGemReward(currentStage);

                const key = (1 << (t1 + 1)) | (1 << (t2 + 1));
                let damage = damageCache.get(key);
                if (damage === undefined) {
                    damage = App.game.party.calculatePokemonAttack(t1, t2, true, GameConstants.Region.none, false, false, WeatherType.Clear);
                    damageCache.set(key, damage);
                }

                let secondsToDefeat = Math.max(1, Math.ceil(hp / damage));
                if (currentStage <= highestStage) {
                    secondsToDefeat /= 2;
                }

                stageSeconds += secondsToDefeat;

                if (stageSeconds <= timeLimit) {
                    attemptResult.gemsEarned[t1] += t2 === PokemonType.None ? gemReward * 2 : gemReward;
                    if (t2 !== PokemonType.None) {
                        attemptResult.gemsEarned[t2] += gemReward;
                    }
                }
            }

            attemptResult.totalSeconds += stageSeconds;

            if (!runOver && stageSeconds > timeLimit) {
                attemptResult.stageReached = currentStage;
                attemptResult.defeatSeconds = attemptResult.totalSeconds;
                runOver = true;
            }

            if ((stageSeconds > timeLimit && targetStage === 0) || (targetStage > 0 && currentStage >= targetStage)) {
                break;
            }
        }

        attemptResult.calcTime = performance.now() - attemptResult.calcTime;
        result.attempts.push(attemptResult);
    }

    result.totalCalcTime = performance.now() - result.totalCalcTime;

    const stagesReached = result.attempts.map(a => a.stageReached);
    result.averageStageReached = Math.floor(stagesReached.reduce((sum, stage) => sum + stage, 0) / result.attempts.length);
    result.highestStageReached = Math.max(...stagesReached);
    result.lowestStageReached = Math.min(...stagesReached);

    for (const gemType of gemTypes) {
        result.averageGems[gemType] = Math.floor(result.attempts.reduce((sum, a) => sum + a.gemsEarned[gemType] ?? 0, 0) / result.attempts.length);
    }

    result.averageRunTime = Math.floor(result.attempts.reduce((sum, a) => sum + a.defeatSeconds, 0) / result.attempts.length);

    if (targetStage > 0) {
        result.averageFullRunTime = Math.floor(result.attempts.reduce((sum, a) => sum + a.totalSeconds, 0) / result.attempts.length);
    }

    result.bestAttempt = result.attempts.reduce((bestIdx, current, idx, arr) => current.stageReached > arr[bestIdx].stageReached ? idx : bestIdx, 0);
    result.worstAttempt = result.attempts.reduce((worstIdx, current, idx, arr) => current.stageReached < arr[worstIdx].stageReached ? idx : worstIdx, 0);

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

const healthCache = [];
const getHealth = (stage) => {
    return healthCache[stage] || (healthCache[stage] = calcHealth(stage));
};

const calcHealth = (stage) => {
    // ref: PokemonFactory.routeHealth
    const routeNum = MapHelper.normalizeRoute(stage + 10, GameConstants.Region.none);
    return Math.max(20, Math.floor(Math.pow((100 * Math.pow(routeNum, 2.2) / 12), 1.15) * (1 + GameConstants.Region.none / 20))) || 20;
};

const gemRewardCache = [];
const getGemReward = (stage) => gemRewardCache[stage] ?? (gemRewardCache[stage] = Math.ceil(stage / 80));

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
    attemptOptions,
    progressCurrentAttempt,
    progressTotalAttempts,
    settings,

    runSimulation,
};