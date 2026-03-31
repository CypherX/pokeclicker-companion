const isRunning = ko.observable(false);
const showResult = ko.observable(false);

let regionMultiplierOverride = -1;
const gymList = ko.observable([]);
const tempBattleList = ko.observable([]);
const damageCache = new Map();

// Type effectiveness cache
const typeMultCache = {};
const getTypeMult = (pType1, pType2, eType1, eType2, repPokemon, region, weather) => {
    if (!typeMultCache[pType1]) typeMultCache[pType1] = {};
    if (!typeMultCache[pType1][pType2]) typeMultCache[pType1][pType2] = {};
    if (!typeMultCache[pType1][pType2][eType1]) typeMultCache[pType1][pType2][eType1] = {};

    if (typeMultCache[pType1][pType2][eType1][eType2] === undefined) {
        const dummyBase = App.game.party.calculateOnePokemonAttack(repPokemon, PokemonType.None, PokemonType.None, region, true, true, false, weather, false, false);
        
        if (dummyBase === 0) {
            typeMultCache[pType1][pType2][eType1][eType2] = 1;
        } else {
            const dummyMult = App.game.party.calculateOnePokemonAttack(repPokemon, eType1, eType2, region, true, true, false, weather, false, false);
            typeMultCache[pType1][pType2][eType1][eType2] = dummyMult / dummyBase;
        }
    }
    return typeMultCache[pType1][pType2][eType1][eType2];
};

const settings = {
    xAttackEnabled: ko.observable(false),
    weather: ko.observable(WeatherType.Clear),
    hideCompleted: ko.observable(true),
    hideLocked: ko.observable(false),
    activeFlutes: ko.observableArray([]),
    allFlutesToggle: ko.observable(false),
    clicksPerSecond: ko.observable(0),
    xClickEnabled: ko.observable(false),
    rockyHelmetEnabled: ko.observable(false),
    autoCollapseConfig: ko.observable(true),
    runCalcImmediately: ko.observable(true),
};

settings.autoCollapseConfig(!!+(localStorage.getItem('autoCollapseBattleCalcConfig') ?? '1'));
settings.autoCollapseConfig.subscribe((value) => localStorage.setItem('autoCollapseBattleCalcConfig', +value));

settings.runCalcImmediately(!!+(localStorage.getItem('runBattleCalcImmediately') ?? '1'));
settings.runCalcImmediately.subscribe((value) => localStorage.setItem('runBattleCalcImmediately', +value));

settings.activeFlutes.subscribe(() => toggleActiveFlutes());

settings.allFlutesToggle.subscribe((value) => {
    if (value) {
        settings.activeFlutes(Object.values(GameConstants.FluteItemType));
    } else {
        settings.activeFlutes([]);
    }
});

settings.clicksPerSecond.subscribe((value) => {
    if (isNaN(value) || value < 0 || !value?.length) {
        settings.clicksPerSecond(0);
    }
    if (value > 20) {
        settings.clicksPerSecond(20);
    }
});

const runFirstCalc = async () => {
    if (isRunning()) return;

    isRunning(true);
    loadGymList();
    loadTempBattleList();

    await calcBattleData();

    isRunning(false);
    showResult(true);

    if (settings.autoCollapseConfig()) {
        new bootstrap.Collapse(document.getElementById('battleCalcConfigCollapse')).hide();
    }
};

const calcBattleData = async () => {
    const start = performance.now();
    damageCache.clear();

    const weatherLookup = new Array(GameConstants.MAX_AVAILABLE_REGION + 1);
    if (settings.weather() === -1) {
        const date = new Date();
        for (let i = 0; i <= GameConstants.MAX_AVAILABLE_REGION; i++) {
            weatherLookup[i] = Weather.getWeather(i, date);
        }
    } else {
        weatherLookup.fill(settings.weather());
    }
    
    player.effectList['xAttack'](settings.xAttackEnabled() ? 1 : 0);
    player.effectList['xClick'](settings.xClickEnabled() ? 1 : 0);
    App.game.oakItems.itemList[OakItemType.Rocky_Helmet].isActiveKO(settings.rockyHelmetEnabled());
    Object.values(GameConstants.FluteItemType).forEach((flute) => {
        toggleFlute(flute, settings.activeFlutes().includes(flute));
    });

    const regionBuckets = {};
    const reps = {};

    for (let region = 0; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
        regionBuckets[region] = {};
    }

    // Calculate raw attack power
    for (const pokemon of App.game.party.caughtPokemon) {
        const pMap = pokemonMap[pokemon.name];
        const pType1 = pMap.type[0];
        const pType2 = pMap.type[1] ?? PokemonType.None;

        if (!reps[pType1]) reps[pType1] = {};
        if (!reps[pType1][pType2]) reps[pType1][pType2] = pokemon;

        for (let region = 0; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
            if (!regionBuckets[region][pType1]) regionBuckets[region][pType1] = {};
            regionMultiplierOverride = region;
            const baseRegAttack = App.game.party.calculateOnePokemonAttack(
                pokemon, PokemonType.None, PokemonType.None, region, false, true, false, weatherLookup[region], false, true
            );

            regionBuckets[region][pType1][pType2] = (regionBuckets[region][pType1][pType2] || 0) + baseRegAttack;
        }
    }

    // Apply cached type multiplier to the aggregated buckets
    const calcAggregatedPartyAttack = (eType1, eType2, region, weather) => {
        let attack = 0;
        const buckets = regionBuckets[region];

        for (const pType1 in buckets) {
            for (const pType2 in buckets[pType1]) {
                const baseRegAttack = buckets[pType1][pType2];
                if (baseRegAttack === 0) continue;

                const repPokemon = reps[pType1][pType2];
                const mult = getTypeMult(pType1, pType2, eType1, eType2, repPokemon, region, weather);

                attack += baseRegAttack * mult;
            }
        }

        const bonus = App.game.party.multiplier.getBonus('pokemonAttack');
        return Math.round(attack * bonus);
    };

    const calcMkjAttack = (eType1, eType2, region, weather) => {
        const magikarp = App.game.party.caughtPokemon.find(p => Math.floor(p.id) === 129);
        if (!magikarp) return 0;
        const attack = App.game.party.calculateOnePokemonAttack(magikarp, eType1, eType2, region, true, true, false, weather, false, true);
        const bonus = App.game.party.multiplier.getBonus('pokemonAttack');
        return Math.round(attack * bonus);
    };
    
    const clickDamage = calcClickAttack();
    const mkjClickDamage = calcClickAttack(GameConstants.Region.alola, GameConstants.AlolaSubRegions.MagikarpJump);
    const gymTime = getGymBattleTime.peek();

    for (const gym of gymList.peek()) {
        regionMultiplierOverride = gym.townObj.region;
        
        const isMkj = gym.townObj.region === GameConstants.Region.alola && gym.townObj.subRegion === GameConstants.AlolaSubRegions.MagikarpJump;
        const currentClickDamage = isMkj ? mkjClickDamage : clickDamage;
        
        if (gym.clickDamage.peek() !== currentClickDamage) {
            gym.clickDamage(currentClickDamage);
            gym.formattedClickDamage(`(${currentClickDamage.toLocaleString()})`);
        }

        let totalSeconds = 0;

        for (const pokemon of gym.pokemonList) {
            let damage = damageCache.get(pokemon.damageKey1) || damageCache.get(pokemon.damageKey2);
            if (damage === undefined) {
                if (isMkj) {
                    damage = calcMkjAttack(pokemon.type1, pokemon.type2, gym.townObj.region, weatherLookup[gym.townObj.region]);
                } else {
                    damage = calcAggregatedPartyAttack(pokemon.type1, pokemon.type2, gym.townObj.region, weatherLookup[gym.townObj.region]);
                }
                damageCache.set(pokemon.damageKey1, damage);
            }
            
            const totalDmg = damage + currentClickDamage;

            if (pokemon.partyDamage.peek() !== totalDmg) {
                pokemon.partyDamage(totalDmg);
                pokemon.formattedPartyDamage(totalDmg.toLocaleString());
            }
            
            const secondsToDefeat = Math.max(1, pokemon.maxHealth / totalDmg);
            if (pokemon.secondsToDefeat.peek() !== secondsToDefeat) {
                pokemon.secondsToDefeat(secondsToDefeat);
                pokemon.formattedSeconds(Math.ceil(secondsToDefeat).toLocaleString());
                
                const hasRemainder = secondsToDefeat !== Infinity && secondsToDefeat % 1 !== 0;
                pokemon.hasSecondsRemainder(hasRemainder);
                if (hasRemainder) {
                    pokemon.secondsRemainder(`(${secondsToDefeat.toLocaleString()})`);
                }
            }
            
            if (totalDmg > 0) {
                totalSeconds += Math.ceil(secondsToDefeat);
            }
        }

        if (totalSeconds === 0) totalSeconds = Infinity;
        if (gym.secondsToWin.peek() !== totalSeconds) {
            gym.secondsToWin(totalSeconds);
            gym.formattedSecondsToWin(totalSeconds.toLocaleString());
        }

        const newTimeClass = totalSeconds <= gymTime ? 'text-success' : 'text-danger';
        if (gym.timeClass.peek() !== newTimeClass) {
            gym.timeClass(newTimeClass);
        }
    }

    const tbTime = getTempBattleTime.peek();

    for (const tb of tempBattleList.peek()) {
        const town = tb.getTown();
        regionMultiplierOverride = town.region;
        
        const isMkj = town.region === GameConstants.Region.alola && town.subRegion === GameConstants.AlolaSubRegions.MagikarpJump;
        const currentClickDamage = isMkj ? mkjClickDamage : clickDamage;

        if (tb.clickDamage.peek() !== currentClickDamage) {
            tb.clickDamage(currentClickDamage);
            tb.formattedClickDamage(`(${currentClickDamage.toLocaleString()})`);
        }

        let totalSeconds = 0;

        for (const pokemon of tb.pokemonList) {
            let damage = damageCache.get(pokemon.damageKey1) || damageCache.get(pokemon.damageKey2);
            if (damage === undefined) {
                if (isMkj) {
                    damage = calcMkjAttack(pokemon.type1, pokemon.type2, town.region, weatherLookup[town.region]);
                } else {
                    damage = calcAggregatedPartyAttack(pokemon.type1, pokemon.type2, town.region, weatherLookup[town.region]);
                }
                damageCache.set(pokemon.damageKey1, damage);
            }

            const totalDmg = damage + currentClickDamage;
            
            if (pokemon.partyDamage.peek() !== totalDmg) {
                pokemon.partyDamage(totalDmg);
                pokemon.formattedPartyDamage(totalDmg.toLocaleString());
            }
            
            const secondsToDefeat = Math.max(1, pokemon.maxHealth / totalDmg);
            if (pokemon.secondsToDefeat.peek() !== secondsToDefeat) {
                pokemon.secondsToDefeat(secondsToDefeat);
                pokemon.formattedSeconds(Math.ceil(secondsToDefeat).toLocaleString());
                
                const hasRemainder = secondsToDefeat !== Infinity && secondsToDefeat % 1 !== 0;
                pokemon.hasSecondsRemainder(hasRemainder);
                if (hasRemainder) {
                    pokemon.secondsRemainder(`(${secondsToDefeat.toLocaleString()})`);
                }
            }
            
            if (totalDmg > 0) {
                totalSeconds += Math.ceil(secondsToDefeat);
            }
        }

        if (totalSeconds === 0) totalSeconds = Infinity;
        if (tb.secondsToWin.peek() !== totalSeconds) {
            tb.secondsToWin(totalSeconds);
            tb.formattedSecondsToWin(totalSeconds.toLocaleString());
        }

        const newTbTimeClass = totalSeconds <= tbTime ? 'text-success' : 'text-danger';
        if (tb.timeClass.peek() !== newTbTimeClass) {
            tb.timeClass(newTbTimeClass);
        }
    }

    player.effectList['xAttack'](0);
    player.effectList['xClick'](0);
    App.game.oakItems.itemList[OakItemType.Rocky_Helmet].isActiveKO(false);
    Object.values(GameConstants.FluteItemType).forEach((flute) => {
        toggleFlute(flute, false);
    });

    regionMultiplierOverride = -1;

    const end = performance.now();
    console.log(`[calcBattleData] ${end - start}ms`);
};

const calcClickAttack = (region = 0, subRegion = 0) => {
    const clicksPerSecond = settings.clicksPerSecond();
    if (clicksPerSecond <= 0) return 0;

    const caughtPokemon = App.game.party.partyPokemonActiveInSubRegion(region, subRegion);
    const baseClickAttack = Math.pow(caughtPokemon.reduce((total, p) => total + p.clickAttackBonus(), 1), 1.4);
    const bonus = App.game.multiplier.getBonus('clickAttack', false);
    const clickAttack = Math.floor(baseClickAttack * bonus);
    return clickAttack * Math.floor(clicksPerSecond);
};

const timeFluteEnabled = ko.pureComputed(() => settings.activeFlutes().includes('Time_Flute'));

const getGymBattleTime = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded() || !timeFluteEnabled()) return GameConstants.GYM_TIME / 1000;
    const fluteBonus = (ItemList["Time_Flute"].multiplyBy - 1) * (AchievementHandler.achievementBonus() + 1) + 1;
    const battleTime = GameConstants.GYM_TIME * fluteBonus;
    return Math.ceil(battleTime / 100) / 10;
});

const getTempBattleTime = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded() || !timeFluteEnabled()) return GameConstants.TEMP_BATTLE_TIME / 1000;
    const fluteBonus = (ItemList["Time_Flute"].multiplyBy - 1) * (AchievementHandler.achievementBonus() + 1) + 1;
    const battleTime = GameConstants.TEMP_BATTLE_TIME * fluteBonus;
    return Math.ceil(battleTime / 100) / 10;
});

// Override Party.getRegionAttackMultiplier used internally by
// game calculations when calling App.game.party.calculateOnePokemonAttack
const originalGetRegionAttackMultiplier = Party.prototype.getRegionAttackMultiplier;
Party.prototype.getRegionAttackMultiplier = function () {
    const region = Math.max(regionMultiplierOverride, player.highestRegion());
    return originalGetRegionAttackMultiplier.call(this, region);
};

const toggleActiveFlutes = () => {
    Object.values(GameConstants.FluteItemType).forEach((flute) => {
        toggleFlute(flute, settings.activeFlutes().includes(flute));
    });
};

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

const isFluteActive = (flute) => !!player.effectList[flute]();

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

const formattedSecondsToWin = (secondsToWin) => secondsToWin.toLocaleString();

let isGymListInitialized = false;
const loadGymList = () => {
    const gymsDefeated = SaveData.file().save.statistics.gymsDefeated;

    if (isGymListInitialized) {
        for (const gym of gymList.peek()) {
            const completed = gymsDefeated[GameConstants.getGymIndex(gym.town)] > 0;
            if (gym.isCompleted.peek() !== completed) gym.isCompleted(completed);
        }
        return;
    }

    let list = [];
    GameConstants.RegionGyms.forEach((gyms, region) => {
        if (region > GameConstants.MAX_AVAILABLE_REGION) return;
        if (region == GameConstants.Region.alola) gyms = gyms.filter(g => !g.endsWith(' Trial'));
        list.push({ region: region, gyms: gyms });
    });

    Companion.data.GymListOverride.forEach((g) => list.push({...g}));
    
    list = list.sort((a, b) => a.region - b.region).flatMap(rg => rg.gyms.map(g => {
        const gym = GymList[g];
        gym.region = rg.region;
        gym.townObj = TownList[gym.parent?.name ?? gym.town];
        
        const isMkj = gym.townObj.region == GameConstants.Region.alola && gym.townObj.subRegion == GameConstants.AlolaSubRegions.MagikarpJump;
        
        gym.pokemonList = gym.getPokemonList().map((p) => {
            const pMap = pokemonMap[p.name];
            const type1 = pMap.type[0];
            const type2 = pMap.type[1] ?? PokemonType.None;
            
            let damageKey1 = `${gym.townObj.region}|${type1}|${type2}`;
            let damageKey2 = `${gym.townObj.region}|${type2}|${type1}`;
            if (isMkj) {
                damageKey1 += '|mkj';
                damageKey2 += '|mkj';
            }

            return {
                ...p,
                type1,
                type2,
                damageKey1,
                damageKey2,
                typeString: pMap.type.map(t => PokemonType[t]).join(' / '),
                formattedMaxHealth: p.maxHealth.toLocaleString(),
                partyDamage: ko.observable(0).extend({ deferred: true }),
                formattedPartyDamage: ko.observable('0').extend({ deferred: true }),
                secondsToDefeat: ko.observable(0).extend({ deferred: true }),
                formattedSeconds: ko.observable('0').extend({ deferred: true }),
                hasSecondsRemainder: ko.observable(false).extend({ deferred: true }),
                secondsRemainder: ko.observable('').extend({ deferred: true })
            };
        });
        
        gym.totalHealth = gym.pokemonList.reduce((hp, p) => hp + p.maxHealth, 0);
        gym.formattedTotalHealth = gym.totalHealth.toLocaleString();
        
        gym.isCompleted = ko.observable(gymsDefeated[GameConstants.getGymIndex(gym.town)] > 0).extend({ deferred: true });
        gym.secondsToWin = ko.observable(0).extend({ deferred: true });
        gym.formattedSecondsToWin = ko.observable('0').extend({ deferred: true });
        gym.timeClass = ko.observable('text-success').extend({ deferred: true });
        gym.clickDamage = ko.observable(0).extend({ deferred: true });
        gym.formattedClickDamage = ko.observable('').extend({ deferred: true });

        return gym;
    }));

    gymList(list);
    isGymListInitialized = true;
};

let isTempBattleListInitialized = false;
const loadTempBattleList = () => {
    const temporaryBattleDefeated = SaveData.file().save.statistics.temporaryBattleDefeated;

    if (isTempBattleListInitialized) {
        for (const tb of tempBattleList.peek()) {
            const completed = temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0;
            if (tb.isCompleted.peek() !== completed) tb.isCompleted(completed);
        }
        return;
    }

    const list = [];
    const excludedBattles = new Set(['Captain Mina', 'Captain Ilima', 'Captain Mallow', 'Captain Lana', 'Captain Kiawe', 'Captain Sophocles', 'Kahuna Nanu']);

    Object.values(TemporaryBattleList).forEach((tb) => {
        const town = tb.getTown();
        if (town.region > GameConstants.MAX_AVAILABLE_REGION || excludedBattles.has(tb.name)) return;

        const isMkj = town.region == GameConstants.Region.alola && town.subRegion == GameConstants.AlolaSubRegions.MagikarpJump;

        tb.pokemonList = tb.getPokemonList().map((p) => {
            const pMap = pokemonMap[p.name];
            const type1 = pMap.type[0];
            const type2 = pMap.type[1] ?? PokemonType.None;

            let damageKey1 = `${town.region}|${type1}|${type2}`;
            let damageKey2 = `${town.region}|${type2}|${type1}`;
            if (isMkj) {
                damageKey1 += '|mkj';
                damageKey2 += '|mkj';
            }

            return {
                ...p,
                type1,
                type2,
                damageKey1,
                damageKey2,
                typeString: pMap.type.map(t => PokemonType[t]).join(' / '),
                formattedMaxHealth: p.maxHealth.toLocaleString(),
                partyDamage: ko.observable(0).extend({ deferred: true }),
                formattedPartyDamage: ko.observable('0').extend({ deferred: true }),
                secondsToDefeat: ko.observable(0).extend({ deferred: true }),
                formattedSeconds: ko.observable('0').extend({ deferred: true }),
                hasSecondsRemainder: ko.observable(false).extend({ deferred: true }),
                secondsRemainder: ko.observable('').extend({ deferred: true })
            };
        });
        
        tb.totalHealth = tb.pokemonList.reduce((hp, p) => hp + p.maxHealth, 0);
        tb.formattedTotalHealth = tb.totalHealth.toLocaleString();
        
        tb.isCompleted = ko.observable(temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0).extend({ deferred: true });
        tb.secondsToWin = ko.observable(0).extend({ deferred: true });
        tb.formattedSecondsToWin = ko.observable('0').extend({ deferred: true });
        tb.timeClass = ko.observable('text-success').extend({ deferred: true });
        tb.clickDamage = ko.observable(0).extend({ deferred: true });
        tb.formattedClickDamage = ko.observable('').extend({ deferred: true });

        list.push(tb);
    });

    tempBattleList(list);
    isTempBattleListInitialized = true;
}

const hasVisibleGyms = ko.pureComputed(() => {
    const showAll = Companion.settings.showAllRegions();
    const highestReg = player.highestRegion();
    const hideLocked = settings.hideLocked();
    const hideCompleted = settings.hideCompleted();

    return gymList().some(gym => {
        if (!showAll && gym.parent.region > highestReg) return false;
        if (hideLocked && !gym.isUnlocked()) return false;
        if (hideCompleted && gym.isCompleted()) return false; 
        return true; 
    });
});

const hasVisibleTempBattles = ko.pureComputed(() => {
    const showAll = Companion.settings.showAllRegions();
    const highestReg = player.highestRegion();
    const hideLocked = settings.hideLocked();
    const hideCompleted = settings.hideCompleted();

    return tempBattleList().some(tb => {
        if (!showAll && tb.getTown().region > highestReg) return false;
        if (hideLocked && !tb.isUnlocked()) return false;
        if (hideCompleted && tb.isCompleted()) return false;
        return true; 
    });
});

//let calcDebounceTimeout;
const ignoreSettings = ['hideCompleted', 'hideLocked', 'allFlutesToggle', 'autoCollapseConfig'];

Object.entries(settings).forEach(([name, setting]) => {
    if (ignoreSettings.includes(name)) return;
    setting.subscribe(() => {
        if (showResult()) {
            /*clearTimeout(calcDebounceTimeout);
            calcDebounceTimeout = setTimeout(() => {
                BattleCalculator.calcBattleData();
            }, 100);*/
            BattleCalculator.calcBattleData();
        }
    });
});

module.exports = {
    settings,
    getGymBattleTime,
    getTempBattleTime,
    formattedSecondsToWin,
    calcClickAttack,
    calcBattleData,
    showResult,
    gymList,
    tempBattleList,
    hasVisibleGyms,
    hasVisibleTempBattles,
    isRunning,
    runFirstCalc,
};